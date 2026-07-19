const express = require("express");
const settingsController = require("../../controllers/settings.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.get("/public/:slug", settingsController.getPublic);
router.get("/", auth, tenantScope, subscriptionGuard, settingsController.get);
router.put("/", auth, requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), tenantScope, subscriptionGuard, settingsController.update);
router.get("/customers", auth, tenantScope, subscriptionGuard, settingsController.customers);
router.post("/sandbox/reset", auth, requireRole(ROLES.OWNER), tenantScope, subscriptionGuard, auditLog("Reset Sandbox"), settingsController.resetSandbox);
router.post("/tester", auth, requireRole(ROLES.OWNER), settingsController.tester);

module.exports = router;
