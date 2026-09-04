const express = require("express");
const accountStatementController = require("../../controllers/accountStatement.controller");
const cashBookController = require("../../controllers/cashBook.controller");
const bankBookController = require("../../controllers/bankBook.controller");
const accountsDashboardController = require("../../controllers/accountsDashboard.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate } = require("../../middleware/planGate");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard, planGate);
router.use(requireRole(ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTS, ROLES.TESTER));

// ── Existing routes ──
router.get("/statements", accountStatementController.getStatements);
router.get("/cash-book", cashBookController.getLedger);
router.get("/bank-book", bankBookController.getLedger);

// ── New accounting routes ──
router.get("/dashboard", accountsDashboardController.getDashboard);
router.get("/ledger", accountsDashboardController.getLedger);
router.get("/vouchers", accountsDashboardController.getVouchers);
router.delete("/vouchers/:id", accountsDashboardController.deleteVoucher);
router.get("/chart-of-accounts", accountsDashboardController.getChartOfAccounts);
router.get("/customer-ledger/:customerId", accountsDashboardController.getCustomerLedger);
router.get("/booking-ledger/:bookingId", accountsDashboardController.getBookingLedger);
router.get("/profit-loss", accountsDashboardController.getProfitLoss);
router.get("/outstanding", accountsDashboardController.getOutstanding);

module.exports = router;
