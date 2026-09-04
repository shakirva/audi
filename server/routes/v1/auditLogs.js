const express = require("express");
const router = express.Router();
const auditLogController = require("../../controllers/auditLog.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate } = require("../../middleware/planGate");
const { ROLES } = require("../../helpers/roles");

// Only Owners and Managers can view activity logs
router.use(auth, tenantScope, subscriptionGuard, planGate);

router.get("/", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLogController.getAll);
router.delete("/clear", requireRole(ROLES.OWNER, ROLES.TESTER), auditLogController.clearAll);

module.exports = router;
