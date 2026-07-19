const express = require("express");
const masterController = require("../../controllers/master.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard);

// :type maps to the master table alias (e.g. halls, packages, event_types, etc.)
router.get("/:type", masterController.list);
router.get("/:type/:id", masterController.getOne);

// Only Owner and Manager can modify master data
router.post("/:type", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Create Master"), masterController.create);
router.put("/:type/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Update Master"), masterController.update);
router.delete("/:type/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Delete Master"), masterController.remove);

module.exports = router;
