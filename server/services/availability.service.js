const { Op } = require("sequelize");
const Booking = require("../models/Booking");
const Enquiry = require("../models/Enquiry");
const Settings = require("../models/Settings");

class AvailabilityService {
  /**
   * Check availability for a specific hall, date, and session.
   * If `ignoreBookingId` is provided, it excludes that booking from the check.
   */
  async checkAvailability({ tenantId, environmentId, hall, date, session, ignoreBookingId = null }) {
    // Standardize inputs
    if (!hall || !date || !session) return { available: false, reason: "Missing parameters" };

    const settings = await Settings.findOne({ where: { tenantId, environmentId } });
    if (settings && settings.blackoutDates && settings.blackoutDates.includes(date)) {
      return { available: false, reason: "Date is blocked by administration" };
    }

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

  /**
   * Get availability for an entire month for a specific hall
   */
  async getMonthAvailability({ tenantId, environmentId, hall, year, month }) {
    if (!hall || !year || !month) return {};
    
    // Create start and end date for the month
    // month is 1-indexed (1 = Jan, 12 = Dec)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const whereClause = {
      tenantId,
      environmentId,
      hall,
      date: { [Op.between]: [startDate, endDate] },
      status: { [Op.notIn]: ["Cancelled", "Closed"] }
    };

    const bookings = await Booking.findAll({ where: whereClause, attributes: ["date", "session"] });
    
    // Group by date
    const dateMap = {};
    for (const b of bookings) {
      if (!dateMap[b.date]) dateMap[b.date] = [];
      dateMap[b.date].push(b.session);
    }

    const result = {};
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const sessions = dateMap[dateStr] || [];
      
      let status = "Available";
      if (sessions.includes("Full Day") || (sessions.includes("Morning") && sessions.includes("Evening"))) {
        status = "Fully Booked";
      } else if (sessions.length > 0) {
        status = "Partially Booked";
      }
      
      result[dateStr] = {
        status,
        morning: sessions.includes("Full Day") || sessions.includes("Morning") ? "booked" : "available",
        evening: sessions.includes("Full Day") || sessions.includes("Evening") ? "booked" : "available",
      };
    }

    return result;
  }
}

module.exports = new AvailabilityService();
