/**
 * V1 API Router — aggregates all v1 route modules.
 * 
 * Mounted at /api/v1 in the main server.
 * 
 * New ERP modules (CRM, Jobs, Agreements, Vendors, etc.)
 * will be added here as they are built.
 */

const express = require("express");
const router = express.Router();

// Import v1 route modules
const bookingRoutes = require("./bookings");
const expenseRoutes = require("./expenses");
const authRoutes = require("./auth");
const settingsRoutes = require("./settings");
const adminRoutes = require("./admin");
const customerRoutes = require("./customers");
const masterRoutes = require("./masters");
const enquiryRoutes = require("./enquiries");
const followupRoutes = require("./followups");
const agreementRoutes = require("./agreements");
const paymentRoutes = require("./payments");
const jobRoutes = require("./jobs");
const accountRoutes = require("./accounts");
const financeRoutes = require("./finance");

// Mount routes
router.use("/bookings", bookingRoutes);
router.use("/expenses", expenseRoutes);
router.use("/auth", authRoutes);
router.use("/settings", settingsRoutes);
router.use("/admin", adminRoutes);
router.use("/customers", customerRoutes);
router.use("/masters", masterRoutes);
router.use("/enquiries", enquiryRoutes);
router.use("/followups", followupRoutes);
router.use("/agreements", agreementRoutes);
router.use("/payments", paymentRoutes);
router.use("/jobs", jobRoutes);
router.use("/accounts", accountRoutes);
router.use("/finance", financeRoutes);

// Future v1 routes will be added here:
// router.use("/enquiries", enquiryRoutes);
// router.use("/agreements", agreementRoutes);
// router.use("/jobs", jobRoutes);
// router.use("/customers", customerRoutes);
// router.use("/vendors", vendorRoutes);
// router.use("/purchases", purchaseRoutes);
// router.use("/receipts", receiptRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/staff", staffRoutes);
// router.use("/reports", reportRoutes);
// router.use("/masters", masterRoutes);

module.exports = router;
