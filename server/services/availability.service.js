const { Op } = require("sequelize");
const Booking = require("../models/Booking");
const Enquiry = require("../models/Enquiry");

class AvailabilityService {
  /**
   * Check availability for a specific hall, date, and session.
   * If `ignoreBookingId` is provided, it excludes that booking from the check.
   */
  async checkAvailability({ tenantId, environmentId, hall, date, session, ignoreBookingId = null }) {
    // Standardize inputs
    if (!hall || !date || !session) return { available: false, reason: "Missing parameters" };

    const whereClause = {
      tenantId,
      environmentId,
      hall,
      date,
      status: { [Op.notIn]: ["Cancelled", "Closed"] } // Only active bookings block availability
    };

    if (ignoreBookingId) {
      whereClause.id = { [Op.ne]: ignoreBookingId };
    }

    const existingBookings = await Booking.findAll({ where: whereClause, attributes: ["session", "bookingId"] });

    if (existingBookings.length === 0) return { available: true };

    const bookedSessions = existingBookings.map(b => b.session);

    if (bookedSessions.includes("Full Day")) {
      return { available: false, reason: "Fully Booked", conflict: existingBookings };
    }

    if (session === "Full Day") {
      return { available: false, reason: "Partially Booked", conflict: existingBookings };
    }

    if (bookedSessions.includes(session)) {
      return { available: false, reason: "Session Booked", conflict: existingBookings };
    }

    return { available: true };
  }

  /**
   * Get availability overview for a specific date and hall
   */
  async getCalendarAvailability({ tenantId, environmentId, hall, date, ignoreBookingId = null }) {
    const whereClause = {
      tenantId,
      environmentId,
      hall,
      date,
      status: { [Op.notIn]: ["Cancelled", "Closed"] }
    };
    
    if (ignoreBookingId) {
        whereClause.id = { [Op.ne]: ignoreBookingId };
    }

    const bookings = await Booking.findAll({ where: whereClause, attributes: ["session"] });
    const bookedSessions = bookings.map(b => b.session);

    let status = "Available";
    if (bookedSessions.includes("Full Day") || (bookedSessions.includes("Morning") && bookedSessions.includes("Evening"))) {
      status = "Fully Booked";
    } else if (bookedSessions.length > 0) {
      status = "Partially Booked";
    }

    return {
      morning: bookedSessions.includes("Full Day") || bookedSessions.includes("Morning") ? "booked" : "available",
      evening: bookedSessions.includes("Full Day") || bookedSessions.includes("Evening") ? "booked" : "available",
      fullDay: status === "Available" ? "available" : "booked",
      status
    };
  }
}

module.exports = new AvailabilityService();
