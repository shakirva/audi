const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { tenantScope, subscriptionGuard } = require("../../middleware/tenant");
const { planGate } = require("../../middleware/planGate");

router.use(auth, tenantScope, subscriptionGuard, planGate);

// Used purely to trigger the planGate middleware for the entire /reports module
router.get("/access", (req, res) => {
  res.json({ success: true });
});

module.exports = router;
