const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const { auth } = require("../middleware/auth");
const tenantScope = require("../middleware/tenantScope");

// POST /api/feedback - Submit feedback
router.post("/", auth, tenantScope, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: "Feedback content is required" });
    }

    const feedback = await Feedback.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      content,
    });

    res.status(201).json({ success: true, data: feedback, message: "Feedback submitted successfully" });
  } catch (error) {
    next(error);
  }
});

// GET /api/feedback - Get all feedbacks (SuperAdmin only)
router.get("/", auth, async (req, res, next) => {
  try {
    if (req.user.role !== "SuperAdmin") {
      return res.status(403).json({ success: false, message: "Only SuperAdmin can view all feedback" });
    }

    const feedbacks = await Feedback.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
