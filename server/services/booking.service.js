/**
 * Booking Service — all booking business logic lives here.
 * Controllers call services; services call repositories.
 * Routes/controllers remain thin.
 */

const bookingRepository = require("../repositories/booking.repository");
const customerService = require("./customer.service");
const availabilityService = require("./availability.service");
const { BadRequestError, NotFoundError, ConflictError } = require("../helpers/errors");
const paymentService = require("./payment.service");
const accountingEngine = require("./accountingEngine.service");
const { sequelize } = require("../models");

class BookingService {
  /**
   * List all bookings with filters.
   */
  async listBookings({ tenantId, environmentId, userRole, userId, status, month, hall, search, query }) {
    const { rows, total, page, limit } = await bookingRepository.findAllFiltered({
      tenantId,
      environmentId,
      userRole,
      userId,
      status,
      month,
      hall,
      search,
      query,
    });

    // Map for frontend compatibility (id = bookingId, _id = pk)
    const data = rows.map((b) => {
      const bData = b.toJSON ? b.toJSON() : b;
      return {
        ...bData,
        id: bData.bookingId,
        _id: bData.id,
      };
    });

    return { data, total, page, limit };
  }

  /**
   * Get a single booking by its bookingId (e.g., "BK001").
   */
  async getBooking(bookingId, { tenantId, environmentId }) {
    const booking = await bookingRepository.findByBookingId(bookingId, { tenantId, environmentId });
    if (!booking) throw new NotFoundError("Booking");
    return booking;
  }

  /**
   * Get dashboard statistics.
   */
  async getDashboardStats({ tenantId, environmentId, userRole, userId }) {
    return bookingRepository.getDashboardStats({ tenantId, environmentId, userRole, userId });
  }

  /**
   * Create a new booking.
   */
  async createBooking(data, { tenantId, environmentId }) {
    if (!data.customerName || !data.phone || !data.date) {
      throw new BadRequestError("Customer name, phone, and date are required");
    }

    // --- Availability Check ---
    if (data.hall && data.session) {
      const avail = await availabilityService.checkAvailability({
        tenantId,
        environmentId,
        hall: data.hall,
        date: data.date,
        session: data.session
      });
      if (!avail.available) {
        throw new ConflictError(`This session has just been booked by another user. Please choose another session. (${avail.reason})`);
      }
    }

    let customerId = null;
    try {
      const { customer } = await customerService.findOrCreateCustomer({
        name: data.customerName,
        phone: data.phone,
        gender: data.gender,
        place: data.place,
        address: data.address,
      }, { tenantId, environmentId, createdBy: data.createdBy || null });
      customerId = customer.id;
    } catch (e) {
      console.error("Failed to create customer for booking:", e);
    }

    const booking = await bookingRepository.create({
      tenantId,
      environmentId,
      customerId,
      enquiryId: data.enquiryId || null,
      customerName: data.customerName,
      phone: data.phone,
      address: data.address || "",
      clientGstNumber: data.clientGstNumber || "",
      bookedBy: data.bookedBy || "",
      bookingParty: data.bookingParty || "",
      eventType: data.eventType,
      hall: data.hall,
      date: data.date,
      session: data.session || "Full Day",
      guests: Number(data.guests) || 0,
      advance: 0, // Will be updated by paymentService
      totalAmount: Number(data.totalAmount) || 0,
      status: data.status || "Enquiry",
      notes: data.notes || "",
      // Extended Contract Fields
      brideName: data.brideName || "",
      brideFatherName: data.brideFatherName || "",
      brideMotherName: data.brideMotherName || "",
      bridePhone: data.bridePhone || "",
      brideAddress: data.brideAddress || "",
      groomName: data.groomName || "",
      groomFatherName: data.groomFatherName || "",
      groomMotherName: data.groomMotherName || "",
      groomPhone: data.groomPhone || "",
      groomAddress: data.groomAddress || "",
      fatherName: data.fatherName || "",
      motherName: data.motherName || "",
      email: data.email || "",
      whatsapp: data.whatsapp || "",
      decoration: data.decoration || "",
      catering: data.catering || "",
      sound: data.sound || "",
      facilities: data.facilities || [],
      specialInstructions: data.specialInstructions || "",
      package: data.package || "",
      discount: Number(data.discount) || 0,
      taxes: Number(data.taxes) || 0,
      taxPercentage: Number(data.taxPercentage) || 0,
      createdBy: data.createdBy,
    });

    // Create accounting journal entry (Customer Outstanding ↔ Hall Booking Income)
    try {
      await accountingEngine.onBookingCreated(booking, {
        tenantId, environmentId, createdBy: data.createdBy || null,
      });
    } catch (e) {
      console.error("[BookingService] Accounting engine error:", e);
    }
    if (Number(data.advance) > 0 && data.paymentMethod) {
      try {
        if (data.paymentMethod === "UPI" && data.upiAmount && data.upiAmount.includes(",")) {
          // It's a split UPI payment
          const ids = (data.upiId || "").split(",");
          const amounts = data.upiAmount.split(",");
          const names = (data.upiName || "").split(",");
          const collectors = (data.receivedBy || "").split(",");
          
          for (let i = 0; i < amounts.length; i++) {
             const amt = Number(amounts[i]) || 0;
             if (amt > 0) {
               const col = collectors[i] ? collectors[i].trim() : "";
               const nte = (names[i] ? ` - ${names[i]}` : "");
               const formattedNotes = col ? `Collected By: ${col}\n${nte}` : nte;
               
               await paymentService.recordPayment({
                 bookingId: booking.id,
                 customerId: booking.customerId,
                 amount: amt,
                 paymentMode: data.paymentMethod,
                 paymentDate: data.collectionDate ? new Date(data.collectionDate).toISOString() : new Date().toISOString(),
                 referenceNumber: ids[i] || "",
                 notes: formattedNotes,
                 bankId: null 
               }, { tenantId, environmentId, createdBy: data.createdBy || null });
             }
          }
        } else {
          const col = data.receivedBy ? data.receivedBy.trim() : "";
          const baseNotes = data.paymentRemarks || "Advance payment at booking";
          const formattedNotes = col ? `Collected By: ${col}\n${baseNotes}` : baseNotes;

          await paymentService.recordPayment({
            bookingId: booking.id,
            customerId: booking.customerId,
            amount: Number(data.advance),
            paymentMode: data.paymentMethod,
            paymentDate: data.collectionDate ? new Date(data.collectionDate).toISOString() : new Date().toISOString(),
            referenceNumber: data.upiId || data.accountName || "",
            notes: formattedNotes,
            bankId: null // Optional depending on schema
          }, { tenantId, environmentId, createdBy: data.createdBy || null });
        }
      } catch (e) {
        console.error("Failed to record advance payment during booking:", e);
      }
    }

    const bData = booking.toJSON ? booking.toJSON() : booking;
    return {
      ...bData,
      id: bData.bookingId,
      _id: bData.id,
    };
  }

  /**
   * Update an existing booking.
   */
  async updateBooking(bookingId, data, { tenantId, environmentId }) {
    const booking = await bookingRepository.findByBookingId(bookingId, { tenantId, environmentId });
    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // --- Availability Check ---
    if (data.hall && data.date && data.session) {
      const avail = await availabilityService.checkAvailability({
        tenantId,
        environmentId,
        hall: data.hall,
        date: data.date,
        session: data.session,
        ignoreBookingId: booking.id
      });
      if (!avail.available) {
        throw new ConflictError(`This session has just been booked by another user. Please choose another session. (${avail.reason})`);
      }
    }

    const fields = [
      "customerName", "phone", "eventType", "hall", "date", "session", "guests", 
      "totalAmount", "status", "notes", "taxes", "taxPercentage",
      "address", "clientGstNumber", "bookedBy", "bookingParty", 
      "brideName", "brideFatherName", "brideMotherName", "bridePhone", "brideAddress", 
      "groomName", "groomFatherName", "groomMotherName", "groomPhone", "groomAddress", 
      "fatherName", "motherName", "email", "whatsapp", "decoration", "catering", 
      "sound", "facilities", "specialInstructions", "package", "discount", "cancellationReason"
    ];
    const updateData = {};
    fields.forEach((f) => {
      if (data[f] !== undefined) {
        updateData[f] = ["guests", "totalAmount", "taxes", "taxPercentage", "discount"].includes(f)
          ? Number(data[f]) || 0
          : data[f];
      }
    });

    const updated = await bookingRepository.update(booking, updateData);

    // Rebuild the accounting journal entry (Customer Outstanding ↔ Hall Booking Income)
    try {
      await accountingEngine.onBookingUpdated(updated, {
        tenantId, environmentId, createdBy: data.createdBy || null,
      });
    } catch (e) {
      console.error("[BookingService] Accounting engine error on update:", e);
    }

    // Handle advance payment: if advance increased, record the difference as a proper payment
    const newAdvance = Number(data.advance) || 0;
    const oldAdvance = Number(booking.advance) || 0;
    const advanceDiff = newAdvance - oldAdvance;

    if (advanceDiff > 0 && data.paymentMethod) {
      try {
        if (data.paymentMethod === "UPI" && data.upiAmount && data.upiAmount.includes(",")) {
          // Split UPI payment
          const ids = (data.upiId || "").split(",");
          const amounts = data.upiAmount.split(",");
          const names = (data.upiName || "").split(",");
          const collectors = (data.receivedBy || "").split(",");
          
          for (let i = 0; i < amounts.length; i++) {
            const amt = Number(amounts[i]) || 0;
            if (amt > 0) {
              await paymentService.recordPayment({
                bookingId: booking.id,
                customerId: booking.customerId,
                amount: amt,
                paymentMode: data.paymentMethod,
                paymentDate: data.collectionDate ? new Date(data.collectionDate).toISOString() : new Date().toISOString(),
                referenceNumber: ids[i] || "",
                notes: (collectors[i] || "") + (names[i] ? ` - ${names[i]}` : ""),
                bankId: null
              }, { tenantId, environmentId, createdBy: data.createdBy || null });
            }
          }
        } else {
          // Standard single payment
          await paymentService.recordPayment({
            bookingId: booking.id,
            customerId: booking.customerId,
            amount: advanceDiff,
            paymentMode: data.paymentMethod,
            paymentDate: data.collectionDate ? new Date(data.collectionDate).toISOString() : new Date().toISOString(),
            referenceNumber: data.upiId || data.accountName || "",
            notes: data.paymentRemarks || data.receivedBy || "Payment recorded via booking edit",
            bankId: null
          }, { tenantId, environmentId, createdBy: data.createdBy || null });
        }
      } catch (e) {
        console.error("Failed to record payment during booking edit:", e);
      }
    } else if (advanceDiff > 0 && !data.paymentMethod) {
      // Advance increased but no payment method selected — just update the field directly
      updated.advance = newAdvance;
      await updated.save({ hooks: false });
    }

    const bData = updated.toJSON ? updated.toJSON() : updated;
    return {
      ...bData,
      id: bData.bookingId,
      _id: bData.id,
    };
  }

  /**
   * Update booking status only.
   */
  async updateBookingStatus(bookingId, status, { tenantId, environmentId }) {
    if (!status) throw new BadRequestError("Status required");

    const booking = await bookingRepository.findByBookingId(bookingId, { tenantId, environmentId });
    if (!booking) throw new NotFoundError("Booking");

    const updated = await bookingRepository.update(booking, { status });
    return { id: updated.bookingId, status: updated.status };
  }

  /**
   * Delete a booking.
   */
  async deleteBooking(bookingId, { tenantId, environmentId }) {
    const booking = await bookingRepository.findByBookingId(bookingId, { tenantId, environmentId });
    if (!booking) throw new NotFoundError("Booking");

    // Manually delete related accounting records (Expenses, Journals, Vouchers)
    // because they are not configured with ON DELETE CASCADE in the associations.
    // (Payments, Receipts, Agreements, Jobs DO have CASCADE and will be deleted automatically)
    const { Expense, JournalEntry, Voucher, Payment, Receipt, Job, Agreement, AgreementVersion } = require("../models");
    
    await Expense.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    await JournalEntry.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    await Voucher.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    
    await Receipt.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    await Payment.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });

    try {
      await AgreementVersion.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
      await Agreement.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
      await Job.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    } catch (e) {}

    // Now delete the booking itself using the correct repository method
    const deleted = await bookingRepository.deleteByBookingId(bookingId, { tenantId, environmentId });
    if (!deleted) throw new NotFoundError("Booking");
    return { message: "Booking deleted successfully", id: bookingId };
  }

  /**
   * Generate Final Tax Invoice
   */
  async generateInvoice(idParam, { tenantId, environmentId }) {
    const whereCondition = isNaN(idParam) ? { bookingId: idParam } : { id: idParam };
    
    const booking = await bookingRepository.findOneOrFail({
      tenantId, environmentId,
      where: whereCondition,
      resourceName: "Booking",
    });

    const realBookingId = booking.id;

    const { Payment } = require("../models");
    const payments = await Payment.findAll({ where: { bookingId: realBookingId, tenantId, environmentId } });
    const totalPaid = payments.filter(p => p.status === "Completed").reduce((s, p) => s + p.amount, 0);
    const outstanding = booking.totalAmount - totalPaid;

    if (outstanding > 0) {
      throw new Error("Cannot generate final invoice while outstanding balance exists.");
    }

    const updated = await bookingRepository.update(booking, {
      invoiceStatus: "Generated",
      status: "Closed", // Mark Financially Closed
    });

    return updated;
  }
  /**
   * Safe Delete — handles financial cleanup before deletion.
   * Accepts options: { reason, refundAction, refundAccount, expenseAction, deletedBy }
   *
   * refundAction: "refund" | "writeOff" | "alreadyRefunded"
   * refundAccount: "Cash" | "Bank" (only when refundAction = "refund")
   * expenseAction: "delete" | "unlink"
   * collectionAction: "delete" | "keep"
   */
  async safeDeleteBooking(bookingId, { tenantId, environmentId, reason, refundAction, refundAccount, expenseAction, deletedBy, enquiryAction, customerAction, collectionAction }) {
    const booking = await bookingRepository.findByBookingId(bookingId, { tenantId, environmentId });
    if (!booking) throw new NotFoundError("Booking");

    if (!reason) throw new BadRequestError("Deletion reason is required");

    const { Expense, JournalEntry, Voucher, Payment, Receipt, CashBook, BankBook, Enquiry, Customer, Booking } = require("../models");
    const { Op } = require("sequelize");

    // ── Handle CRM actions before deleting booking ──
    if (booking.enquiryId && enquiryAction) {
      if (enquiryAction === "delete") {
        await Enquiry.destroy({ where: { id: booking.enquiryId, tenantId, environmentId } });
      } else if (enquiryAction === "revert") {
        await Enquiry.update(
          { status: "Interested", leadScore: "Hot" },
          { where: { id: booking.enquiryId, tenantId, environmentId } }
        );
      }
    }

    if (booking.customerId && customerAction === "delete") {
      const otherBookingsCount = await Booking.count({
        where: { customerId: booking.customerId, tenantId, environmentId, id: { [Op.ne]: booking.id } }
      });
      if (otherBookingsCount === 0) {
        await Customer.destroy({ where: { id: booking.customerId, tenantId, environmentId } });
      }
    }

    const payments = await Payment.findAll({ where: { bookingId: booking.id, tenantId, environmentId } });
    const totalPaid = payments.filter(p => p.status === "Completed").reduce((s, p) => s + p.amount, 0);
    const expenses = await Expense.findAll({ where: { bookingId: booking.id, tenantId, environmentId } });

    // ── Handle refund action ──
    if (totalPaid > 0 && refundAction === "refund") {
      const cashBookRepo = require("../repositories/cashBook.repository");
      const bankBookRepo = require("../repositories/bankBook.repository");
      
      const refundNote = `Refund for deleted booking ${booking.bookingId} — ${reason}`;
      if (refundAccount === "Bank") {
        const bankBal = await bankBookRepo.getLatestBalance({ tenantId, environmentId });
        await bankBookRepo.create({
          tenantId, environmentId,
          date: new Date(),
          description: refundNote,
          transactionType: "Booking Refund",
          referenceId: booking.id,
          referenceType: "Booking",
          bankIn: 0,
          bankOut: totalPaid,
          balance: bankBal - totalPaid,
          createdBy: deletedBy,
        });
      } else {
        const cashBal = await cashBookRepo.getLatestBalance({ tenantId, environmentId });
        await cashBookRepo.create({
          tenantId, environmentId,
          date: new Date(),
          description: refundNote,
          transactionType: "Booking Refund",
          referenceId: booking.id,
          referenceType: "Booking",
          cashIn: 0,
          cashOut: totalPaid,
          balance: cashBal - totalPaid,
          createdBy: deletedBy,
        });
      }
    }

    // ── Handle expenses ──
    if (expenses.length > 0) {
      if (expenseAction === "unlink") {
        // Keep expenses but unlink from this booking
        await Expense.update(
          { bookingId: null, notes: `[Unlinked from deleted booking ${booking.bookingId}] ${reason}` },
          { where: { bookingId: booking.id, tenantId, environmentId } }
        );
      } else {
        // Default: delete expenses
        await Expense.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
      }
    }

    // ── Clean up accounting records ──
    await JournalEntry.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    await Voucher.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });

    // ── Handle collection history ──
    // We explicitly handle these because ON DELETE CASCADE might not be active at the DB schema level.
    if (collectionAction === "keep") {
      // Keep collection records but unlink from this booking
      await Receipt.update(
        { bookingId: null },
        { where: { bookingId: booking.id, tenantId, environmentId } }
      );
      await Payment.update(
        { bookingId: null, notes: require("sequelize").literal(`CONCAT(notes, '\n[Unlinked from deleted booking ${booking.bookingId}]')`) },
        { where: { bookingId: booking.id, tenantId, environmentId } }
      );
    } else {
      // Default: delete all collection records
      await Receipt.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
      await Payment.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    }
    
    try {
      const { Job, Agreement, AgreementVersion } = require("../models");
      await AgreementVersion.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
      await Agreement.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
      await Job.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    } catch (e) {
      console.warn("Could not explicitly delete Jobs/Agreements", e);
    }

    // ── Delete the booking ──
    const deleted = await bookingRepository.deleteByBookingId(bookingId, { tenantId, environmentId });
    if (!deleted) throw new NotFoundError("Booking");

    return {
      message: "Booking deleted successfully",
      id: bookingId,
      refundProcessed: totalPaid > 0 && refundAction === "refund",
      refundAmount: totalPaid > 0 && refundAction === "refund" ? totalPaid : 0,
      expensesHandled: expenses.length,
    };
  }
}

module.exports = new BookingService();
