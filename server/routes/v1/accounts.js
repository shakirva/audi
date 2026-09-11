const express = require("express");
const accountStatementController = require("../../controllers/accountStatement.controller");
const cashBookController = require("../../controllers/cashBook.controller");
const bankBookController = require("../../controllers/bankBook.controller");
const accountsDashboardController = require("../../controllers/accountsDashboard.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate, requireFeature } = require("../../middleware/planGate");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard);
router.use(requireRole(ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTS, ROLES.TESTER));

// ── Existing routes ──
router.get("/statements", requireFeature("advanced_accounting"), accountStatementController.getStatements);
router.get("/cash-book", requireFeature("advanced_accounting"), cashBookController.getLedger);
router.get("/bank-book", requireFeature("advanced_accounting"), bankBookController.getLedger);

// ── New accounting routes ──
router.get("/dashboard", requireFeature("payments"), accountsDashboardController.getDashboard);
router.get("/verify-booking-accounts", requireFeature("booking_accounts"), (req, res) => res.json({ ok: true }));
router.get("/ledger", requireFeature("advanced_accounting"), accountsDashboardController.getLedger);
router.get("/vouchers", requireFeature("advanced_accounting"), accountsDashboardController.getVouchers);
router.delete("/vouchers/:id", requireFeature("advanced_accounting"), accountsDashboardController.deleteVoucher);
router.get("/chart-of-accounts", requireFeature("advanced_accounting"), accountsDashboardController.getChartOfAccounts);
router.get("/customer-ledger/:customerId", requireFeature("advanced_accounting"), accountsDashboardController.getCustomerLedger);
router.get("/booking-ledger/:bookingId", requireFeature("booking_accounts"), accountsDashboardController.getBookingLedger);
router.get("/profit-loss", requireFeature("finance_reports"), accountsDashboardController.getProfitLoss);
router.get("/outstanding", requireFeature("advanced_accounting"), accountsDashboardController.getOutstanding);

module.exports = router;
