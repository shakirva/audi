/**
 * Booking Repository — data access layer for Bookings.
 * Extends BaseRepository with booking-specific queries.
 */

const { Op } = require("sequelize");
const BaseRepository = require("./base.repository");
const Booking = require("../models/Booking");

class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking);
  }

  /**
   * Find all bookings with optional search/filter support.
   */
  async findAllFiltered({ tenantId, environmentId, userRole, userId, status, month, hall, search, query = {} }) {
    const where = {};

    if (status && status !== "All") where.status = status;
    if (month) where.date = { [Op.like]: `${month}%` };
    if (hall) where.hall = hall;
    if (search) {
      where[Op.or] = [
        { customerName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { bookingId: { [Op.iLike]: `%${search}%` } },
        { eventType: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return this.findAll({
      tenantId,
      environmentId,
      where,
      order: [["date", "DESC"]],
      query,
    });
  }

  /**
   * Find a booking by its bookingId (e.g., "BK001").
   */
  async findByBookingId(bookingId, { tenantId, environmentId }) {
    return this.findOne({
      tenantId,
      environmentId,
      where: { bookingId },
    });
  }

  /**
   * Get dashboard statistics.
   */
  async getDashboardStats({ tenantId, environmentId, userRole, userId }) {
    const where = {};
    const allBookings = await this.findAllUnpaginated({ tenantId, environmentId, where });

    const confirmed = allBookings.filter((b) => b.status === "Confirmed" || b.status === "Completed");
    const pending = allBookings.filter((b) => b.status === "Pending Payment");
    const enquiries = allBookings.filter((b) => b.status === "Enquiry");
    const totalRevenue = confirmed.reduce((s, b) => s + b.totalAmount, 0);
    const uniqueCustomers = new Set(allBookings.map((b) => b.phone)).size;

    return {
      totalBookings: allBookings.length,
      totalRevenue,
      pendingCount: pending.length,
      enquiryCount: enquiries.length,
      confirmedCount: confirmed.length,
      uniqueCustomers,
    };
  }

  /**
   * Delete a booking by its bookingId.
   */
  async deleteByBookingId(bookingId, { tenantId, environmentId }) {
    const deletedCount = await Booking.destroy({
      where: { bookingId, tenantId, environmentId },
    });
    return deletedCount > 0;
  }
}

module.exports = new BookingRepository();
