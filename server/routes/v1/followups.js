const express = require("express");
const followupController = require("../../controllers/followup.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { validate } = require("../../middleware/validate");
const { createFollowUpSchema, updateFollowUpSchema } = require("../../validators/followup.validator");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard);

router.get("/", followupController.list);
router.get("/:id", followupController.getOne);
router.post("/", validate(createFollowUpSchema), auditLog("Create FollowUp"), followupController.create);
router.put("/:id", validate(updateFollowUpSchema), auditLog("Update FollowUp"), followupController.update);
router.delete("/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Delete FollowUp"), followupController.remove);

module.exports = router;
