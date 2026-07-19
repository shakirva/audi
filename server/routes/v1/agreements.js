const express = require("express");
const agreementController = require("../../controllers/agreement.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { validate } = require("../../middleware/validate");
const { createAgreementSchema, updateAgreementSchema } = require("../../validators/agreement.validator");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard);

router.get("/", agreementController.getAll);
router.get("/:id", agreementController.getOne);
router.get("/booking/:bookingId", agreementController.getByBooking);
router.post("/", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.SALES, ROLES.TESTER), validate(createAgreementSchema), auditLog("Create Agreement"), agreementController.createForBooking);
router.put("/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.SALES, ROLES.TESTER), validate(updateAgreementSchema), auditLog("Update Agreement"), agreementController.update);
router.post("/:id/generate-pdf", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.SALES, ROLES.TESTER), auditLog("Generate Agreement PDF"), agreementController.generatePdf);

module.exports = router;
