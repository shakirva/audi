const express = require("express");
const jobController = require("../../controllers/job.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate } = require("../../middleware/planGate");
const { auditLog } = require("../../middleware/audit");
const { validate } = require("../../middleware/validate");
const { createJobSchema, updateJobStatusSchema, assignStaffSchema } = require("../../validators/job.validator");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard, planGate);

router.get("/", jobController.list);
router.get("/:id", jobController.getOne);

// For manual triggers; ideally called from a Booking webhook/service hook
router.post("/from-booking", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), validate(createJobSchema), auditLog("Create Job From Booking"), jobController.createFromBooking);

router.post("/", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Create Standalone Job"), jobController.create);
router.delete("/:id", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Delete Job"), jobController.remove);

router.patch("/:id/status", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), validate(updateJobStatusSchema), auditLog("Update Job Status"), jobController.updateStatus);

router.post("/:id/staff", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), validate(assignStaffSchema), auditLog("Assign Staff to Job"), jobController.assignStaff);

router.post("/:id/checklist/toggle", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Toggle Job Checklist"), jobController.toggleChecklist);
router.post("/:id/tasks", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Add Job Task"), jobController.addTask);
router.delete("/:id/tasks/:taskId", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Remove Job Task"), jobController.removeTask);
router.delete("/:id/staff/:staffId", requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), auditLog("Remove Job Staff"), jobController.removeStaff);

module.exports = router;
