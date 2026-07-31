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

class BookingService {
  /**
   * List all bookings with filters.
   */
  async listBookings({ tenantId, environmentId, status, month, hall, search, query }) {
    const { rows, total, page, limit } = await bookingRepository.findAllFiltered({
      tenantId,
      environmentId,
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
  async getDashboardStats({ tenantId, environmentId }) {
    return bookingRepository.getDashboardStats({ tenantId, environmentId });
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
        await paymentService.recordPayment({
          bookingId: booking.id,
          customerId: booking.customerId,
          amount: Number(data.advance),
          paymentMode: data.paymentMethod,
          paymentDate: new Date().toISOString(),
          referenceNumber: data.upiId || data.accountName || "",
          notes: data.paymentRemarks || data.receivedBy || "Advance payment at booking",
          bankId: null // Optional depending on schema
        }, { tenantId, environmentId, createdBy: data.createdBy || null });
      } catch (e) {
        console.error("Failed to record advance payment during booking:", e);
      }
    }

    return {
      id: booking.bookingId,
      _id: booking.id,
      customerName: booking.customerName,
      phone: booking.phone,
      eventType: booking.eventType,
      hall: booking.hall,
      date: booking.date,
      session: booking.session,
      guests: booking.guests,
      advance: booking.advance,
      totalAmount: booking.totalAmount,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
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
      "advance", "totalAmount", "status", "notes", "taxes", "taxPercentage",
      "address", "clientGstNumber", "bookedBy", "bookingParty", 
      "brideName", "brideFatherName", "brideMotherName", "bridePhone", "brideAddress", 
      "groomName", "groomFatherName", "groomMotherName", "groomPhone", "groomAddress", 
      "fatherName", "motherName", "email", "whatsapp", "decoration", "catering", 
      "sound", "facilities", "specialInstructions", "package", "discount", "cancellationReason"
    ];
    const updateData = {};
    fields.forEach((f) => {
      if (data[f] !== undefined) {
        updateData[f] = ["guests", "advance", "totalAmount", "taxes", "taxPercentage", "discount"].includes(f)
          ? Number(data[f]) || 0
          : data[f];
      }
    });

    const updated = await bookingRepository.update(booking, updateData);

    return {
      id: updated.bookingId,
      _id: updated.id,
      customerName: updated.customerName,
      phone: updated.phone,
      eventType: updated.eventType,
      hall: updated.hall,
      date: updated.date,
      session: updated.session,
      guests: updated.guests,
      advance: updated.advance,
      totalAmount: updated.totalAmount,
      status: updated.status,
      notes: updated.notes,
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
    const { Expense, JournalEntry, Voucher } = require("../models");
    
    await Expense.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    await JournalEntry.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });
    await Voucher.destroy({ where: { bookingId: booking.id, tenantId, environmentId } });

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
}

module.exports = new BookingService();
