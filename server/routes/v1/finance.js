const express = require("express");
const router = express.Router();
const financeController = require("../../controllers/finance.controller");
const authController = require("../../controllers/auth.controller");

// Protect all finance routes
router.use(authController.protect);

// Booking Financial Center
router.get("/booking-summary/:id", financeController.getBookingSummary);

// Operational Reports
router.get("/reports/booking-profit", financeController.getBookingProfitReport);
router.get("/reports/expense-categories", financeController.getExpenseCategoriesReport);
router.get("/reports/vendor-outstanding", financeController.getVendorOutstandingReport);
router.get("/reports/payment-history", financeController.getPaymentHistoryReport);
router.get("/reports/cash-closing", financeController.getCashClosingReport);
router.get("/reports/daily-business-summary", financeController.getDailyBusinessSummary);

module.exports = router;
