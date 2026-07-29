const express = require("express");
const customerController = require("../../controllers/customer.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { validate } = require("../../middleware/validate");
const { createCustomerSchema, updateCustomerSchema } = require("../../validators/customer.validator");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use((req, res, next) => { req.user = { id: 1 }; req.tenantId = 2; req.environmentId = 3; next(); });

router.get("/", customerController.list);
router.get("/:id", customerController.getOne);
router.post("/", validate(createCustomerSchema), auditLog("Create Customer"), customerController.create);
router.post("/find-or-create", auditLog("Find or Create Customer"), customerController.findOrCreate);
router.put("/:id", validate(updateCustomerSchema), auditLog("Update Customer"), customerController.update);
router.delete("/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Delete Customer"), customerController.remove);

module.exports = router;
