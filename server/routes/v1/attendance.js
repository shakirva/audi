const express = require("express");
const router = express.Router();
const { auth } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { Attendance, User } = require("../../models");

router.use(auth, tenantScope);

// GET /api/v1/attendance
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    const where = { tenantId: req.tenantId };
    
    // If not owner/admin, staff can only see their own attendance
    if (req.user.role === "Sales" || req.user.role === "Operations") {
      where.userId = req.user.id;
    } else if (date) {
      where.date = date; // Admin/Owner filter by date
    }

    const records = await Attendance.findAll({
      where,
      include: [{ model: User, as: "User", attributes: ["id", "name", "role"] }],
      order: [["date", "DESC"]],
    });

    res.json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// POST /api/v1/attendance/check-in
router.post("/check-in", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    // Check if already checked in today
    const existing = await Attendance.findOne({
      where: { tenantId: req.tenantId, userId: req.user.id, date: today }
    });

    if (existing && existing.checkIn) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    const checkInTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    
    let record;
    if (existing) {
      record = await existing.update({ checkIn: checkInTime, status: "Present" });
    } else {
      record = await Attendance.create({
        tenantId: req.tenantId,
        userId: req.user.id,
        date: today,
        checkIn: checkInTime,
        status: "Present",
        createdBy: req.user.id,
      });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Check-in failed" });
  }
});

// POST /api/v1/attendance/check-out
router.post("/check-out", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    const existing = await Attendance.findOne({
      where: { tenantId: req.tenantId, userId: req.user.id, date: today }
    });

    if (!existing || !existing.checkIn) {
      return res.status(400).json({ error: "You need to check in first" });
    }
    if (existing.checkOut) {
      return res.status(400).json({ error: "Already checked out today" });
    }

    const checkOutTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    await existing.update({ checkOut: checkOutTime, updatedBy: req.user.id });

    res.json({ success: true, data: existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Check-out failed" });
  }
});

// PUT /api/v1/attendance/:id
router.put("/:id", async (req, res) => {
  try {
    if (req.user.role === "Sales" || req.user.role === "Operations") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const record = await Attendance.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });

    if (!record) return res.status(404).json({ error: "Record not found" });

    await record.update({
      checkIn: req.body.checkIn !== undefined ? req.body.checkIn : record.checkIn,
      checkOut: req.body.checkOut !== undefined ? req.body.checkOut : record.checkOut,
      status: req.body.status !== undefined ? req.body.status : record.status,
      updatedBy: req.user.id,
    });

    res.json({ success: true, data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update record" });
  }
});

// DELETE /api/v1/attendance/:id
router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role === "Sales" || req.user.role === "Operations") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const record = await Attendance.findOne({
      where: { id: req.params.id, tenantId: req.tenantId }
    });

    if (!record) return res.status(404).json({ error: "Record not found" });

    await record.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

module.exports = router;
