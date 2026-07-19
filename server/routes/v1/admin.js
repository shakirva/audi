const express = require("express");
const adminController = require("../../controllers/admin.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

// Only SuperAdmins can access these routes
router.use(auth, requireRole(ROLES.SUPER_ADMIN));

router.get("/tenants", adminController.getTenants);
router.post("/tenants", adminController.createTenant);
router.put("/tenants/:id/subscription", adminController.updateSubscription);
router.patch("/tenants/:id/toggle-sandbox", adminController.toggleSandbox);
router.patch("/tenants/:id/status", adminController.toggleStatus);

module.exports = router;
