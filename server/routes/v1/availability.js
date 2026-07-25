const express = require("express");
const router = express.Router();
const availabilityService = require("../../services/availability.service");
const { sendSuccess, sendError } = require("../../helpers/response");

router.get("/", async (req, res) => {
  try {
    const { hall, date, ignoreBookingId } = req.query;
    if (!hall || !date) {
      return sendError(res, "hall and date are required", 400);
    }
    
    const availability = await availabilityService.getCalendarAvailability({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      hall,
      date,
      ignoreBookingId
    });

    return sendSuccess(res, { data: availability });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch availability", 500);
  }
});

router.get("/month", async (req, res) => {
  try {
    const { hall, year, month } = req.query;
    if (!hall || !year || !month) {
      return sendError(res, "hall, year, and month are required", 400);
    }
    
    const availability = await availabilityService.getMonthAvailability({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      hall,
      year: parseInt(year),
      month: parseInt(month)
    });

    return sendSuccess(res, { data: availability });
  } catch (error) {
    return sendError(res, error.message || "Failed to fetch month availability", 500);
  }
});

module.exports = router;
