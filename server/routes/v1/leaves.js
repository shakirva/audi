const express = require("express");
const router = express.Router();
const { auth } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate } = require("../../middleware/planGate");
const { LeaveRequest, User } = require("../../models");

router.use(auth, tenantScope, subscriptionGuard, planGate);

// GET /api/v1/leaves
router.get("/", async (req, res) => {
  try {
    const where = { tenantId: req.tenantId };
    
    // If not owner/admin, staff can only see their own leaves
    if (req.user.role === "Sales" || req.user.role === "Operations") {
      where.userId = req.user.id;
    }

    const records = await LeaveRequest.findAll({
      where,
      include: [{ model: User, as: "User", attributes: ["id", "name", "role"] }],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
});

// POST /api/v1/leaves
router.post("/", async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ error: "Start date, end date, and reason are required" });
    }

    const record = await LeaveRequest.create({
      tenantId: req.tenantId,
      userId: req.user.id,
      startDate,
      endDate,
      reason,
      status: "Pending",
      createdBy: req.user.id,
    });

    const populatedRecord = await LeaveRequest.findByPk(record.id, {
      include: [{ model: User, as: "User", attributes: ["id", "name", "role"] }]
    });

    res.json({ success: true, data: populatedRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create leave request" });
  }
});

// PUT /api/v1/leaves/:id
router.put("/:id", async (req, res) => {
  try {
    const record = await LeaveRequest.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });

    if (!record) return res.status(404).json({ error: "Record not found" });

    // If staff, they can only edit their own pending requests
    if (req.user.role === "Sales" || req.user.role === "Operations") {
      if (record.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });
      if (record.status !== "Pending") return res.status(400).json({ error: "Can only edit pending requests" });
      
      await record.update({
        startDate: req.body.startDate || record.startDate,
        endDate: req.body.endDate || record.endDate,
        reason: req.body.reason || record.reason,
        updatedBy: req.user.id,
      });
    } else {
      // Admin/Owner can update status too
      await record.update({
        startDate: req.body.startDate || record.startDate,
        endDate: req.body.endDate || record.endDate,
        reason: req.body.reason || record.reason,
        status: req.body.status || record.status,
        updatedBy: req.user.id,
      });
    }

    const populatedRecord = await LeaveRequest.findByPk(record.id, {
      include: [{ model: User, as: "User", attributes: ["id", "name", "role"] }]
    });

    res.json({ success: true, data: populatedRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update leave request" });
  }
});

// DELETE /api/v1/leaves/:id
router.delete("/:id", async (req, res) => {
  try {
    const record = await LeaveRequest.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });

    if (!record) return res.status(404).json({ error: "Record not found" });

    // If staff, they can only delete their own pending requests
    if (req.user.role === "Sales" || req.user.role === "Operations") {
      if (record.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });
      if (record.status !== "Pending") return res.status(400).json({ error: "Can only delete pending requests" });
    }

    await record.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
});

module.exports = router;
