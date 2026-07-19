const express = require("express");
const enquiryController = require("../../controllers/enquiry.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { validate } = require("../../middleware/validate");
const { createEnquirySchema, updateEnquirySchema } = require("../../validators/enquiry.validator");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard);

router.get("/", enquiryController.list);
router.get("/:id", enquiryController.getOne);
router.post("/", validate(createEnquirySchema), auditLog("Create Enquiry"), enquiryController.create);
router.put("/:id", validate(updateEnquirySchema), auditLog("Update Enquiry"), enquiryController.update);
router.delete("/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Delete Enquiry"), enquiryController.remove);

module.exports = router;
