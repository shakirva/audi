const express = require("express");
const paymentController = require("../../controllers/payment.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { validate } = require("../../middleware/validate");
const { recordPaymentSchema } = require("../../validators/payment.validator");
const { ROLES } = require("../../helpers/roles");

const router = express.Router();

router.use(auth, tenantScope, subscriptionGuard);

router.get("/", paymentController.list);
router.get("/:id", paymentController.getOne);
router.post("/", requireRole(ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTS, ROLES.TESTER), validate(recordPaymentSchema), auditLog("Record Payment"), paymentController.record);
router.delete("/:id", requireRole(ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTS, ROLES.TESTER), auditLog("Delete Payment"), paymentController.remove);

// Receipt specific routes nested under payments for now
router.get("/:paymentId/receipt", paymentController.getReceipt);
router.post("/receipt/:receiptId/generate-pdf", requireRole(ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTS, ROLES.TESTER), auditLog("Generate Receipt PDF"), paymentController.generateReceiptPdf);

module.exports = router;
