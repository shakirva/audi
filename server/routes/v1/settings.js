const express = require("express");
const settingsController = require("../../controllers/settings.controller");
const { auth, requireRole } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { auditLog } = require("../../middleware/audit");
const { ROLES } = require("../../helpers/roles");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../../server/public/uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const router = express.Router();

const { checkHallLimit } = require("../../middleware/planGate");

router.get("/public/:slug", settingsController.getPublic);
router.get("/", auth, tenantScope, subscriptionGuard, settingsController.get);
router.put("/", auth, requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), tenantScope, subscriptionGuard, checkHallLimit, settingsController.update);

router.post("/upload-logo", auth, requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.TESTER), upload.single("logo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});
router.get("/customers", auth, tenantScope, subscriptionGuard, settingsController.customers);
router.get("/users", auth, tenantScope, subscriptionGuard, settingsController.users);
router.put("/users/:id", auth, tenantScope, subscriptionGuard, settingsController.updateUser);
router.patch("/users/:id/toggle", auth, requireRole(ROLES.OWNER, ROLES.MANAGER), tenantScope, subscriptionGuard, settingsController.toggleUserActive);
router.delete("/users/:id", auth, requireRole(ROLES.OWNER), tenantScope, subscriptionGuard, settingsController.deleteUser);
router.post("/sandbox/reset", auth, requireRole(ROLES.OWNER), tenantScope, subscriptionGuard, auditLog("Reset Sandbox"), settingsController.resetSandbox);
router.post("/tester", auth, requireRole(ROLES.OWNER), settingsController.tester);

module.exports = router;
