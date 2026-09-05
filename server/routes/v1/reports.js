const express = require("express");
const router = express.Router();

// Used purely to trigger the planGate middleware for the entire /reports module
router.get("/access", (req, res) => {
  res.json({ success: true });
});

module.exports = router;
