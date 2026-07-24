/**
 * Booking Service — all booking business logic lives here.
 * Controllers call services; services call repositories.
 * Routes/controllers remain thin.
 */

const bookingRepository = require("../repositories/booking.repository");
const customerService = require("./customer.service");
const { NotFoundError, BadRequestError } = require("../helpers/errors");
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
    const data = rows.map((b) => ({
      id: b.bookingId,
      _id: b.id,
      customerName: b.customerName,
      phone: b.phone,
      eventType: b.eventType,
      hall: b.hall,
      date: b.date,
      session: b.session,
      guests: b.guests,
      advance: b.advance,
      totalAmount: b.totalAmount,
      status: b.status,
      notes: b.notes,
      createdAt: b.createdAt,
    }));

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
      customerName: data.customerName,
      phone: data.phone,
      address: data.address || "",
      eventType: data.eventType,
      hall: data.hall,
      date: data.date,
      session: data.session || "Full Day",
      guests: Number(data.guests) || 0,
      advance: Number(data.advance) || 0,
      totalAmount: Number(data.totalAmount) || 0,
      status: data.status || "Enquiry",
      notes: data.notes || "",
      // Extended Contract Fields
      brideName: data.brideName || "",
      groomName: data.groomName || "",
      fatherName: data.fatherName || "",
      motherName: data.motherName || "",
      email: data.email || "",
      whatsapp: data.whatsapp || "",
      decoration: data.decoration || "",
      catering: data.catering || "",
      sound: data.sound || "",
      specialInstructions: data.specialInstructions || "",
      package: data.package || "",
      discount: Number(data.discount) || 0,
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
    if (!booking) throw new NotFoundError("Booking");

    const fields = ["customerName", "phone", "eventType", "hall", "date", "session", "guests", "advance", "totalAmount", "status", "notes"];
    const updateData = {};
    fields.forEach((f) => {
      if (data[f] !== undefined) {
        updateData[f] = ["guests", "advance", "totalAmount"].includes(f)
          ? Number(data[f])
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
  async generateInvoice(id, { tenantId, environmentId }) {
    const booking = await bookingRepository.findOneOrFail({
      tenantId, environmentId,
      where: { id },
      resourceName: "Booking",
    });

    const { Payment } = require("../models");
    const payments = await Payment.findAll({ where: { bookingId: id, tenantId, environmentId } });
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
