const express = require("express");
const jobController = require("../../controllers/job.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { validate } = require("../../middleware/validate");
const { createJobSchema, updateJobStatusSchema, assignStaffSchema } = require("../../validators/job.validator");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard);

router.get("/", jobController.list);
router.get("/:id", jobController.getOne);

// For manual triggers; ideally called from a Booking webhook/service hook
router.post("/", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), validate(createJobSchema), auditLog("Create Job"), jobController.createFromBooking);

router.patch("/:id/status", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), validate(updateJobStatusSchema), auditLog("Update Job Status"), jobController.updateStatus);

router.post("/:id/staff", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), validate(assignStaffSchema), auditLog("Assign Staff to Job"), jobController.assignStaff);

// Future endpoints:
// router.post("/:id/vendors", ...);
// router.post("/:id/checklists", ...);
// router.post("/:id/documents", ...);

module.exports = router;
