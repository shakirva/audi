const express = require("express");
const { Op } = require("sequelize");
const Booking = require("../models/Booking");
const { auth, requireRole } = require("../middleware/auth");
const { tenantScope } = require("../middleware/tenantScope");
const { subscriptionGuard } = require("../middleware/subscriptionGuard");
const { auditLog } = require("../middleware/audit");
const Tenant = require("../models/Tenant");
const Environment = require("../models/Environment");

const router = express.Router();

// GET /api/bookings — list all bookings (with optional filters)
router.get("/", auth, tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const { status, month, hall, search } = req.query;
    const filter = {
      tenantId: req.tenantId,
      environmentId: req.environmentId,
    };

    if (status && status !== "All") filter.status = status;
    if (month) filter.date = { [Op.like]: `${month}%` };  // "2026-05%"
    if (hall) filter.hall = hall;
    if (search) {
      filter[Op.or] = [
        { customerName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { bookingId: { [Op.iLike]: `%${search}%` } },
        { eventType: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const bookings = await Booking.findAll({ where: filter, order: [["date", "DESC"]] });

    // Map _id to id and bookingId for frontend compatibility
    const mapped = bookings.map(b => ({
      id: b.bookingId,
      _id: b.id,
      customerName: b.customerName,
      phone: b.phone,
      eventType: b.eventType,
      hall: b.hall,
      date: b.date,
      session: b.session,
      guests: b.guests,
      advance: b.advance,
      totalAmount: b.totalAmount,
      status: b.status,
      notes: b.notes,
      createdAt: b.createdAt,
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET /api/bookings/stats/dashboard — aggregated stats for dashboard
// NOTE: Must be before /:id to avoid Express matching 'stats' as an :id param
router.get("/stats/dashboard", auth, tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const allBookings = await Booking.findAll({
      where: {
        tenantId: req.tenantId,
        environmentId: req.environmentId
      }
    });
    const confirmed = allBookings.filter(b => b.status === "Confirmed" || b.status === "Completed");
    const pending = allBookings.filter(b => b.status === "Pending Payment");
    const enquiries = allBookings.filter(b => b.status === "Enquiry");
    const totalRevenue = confirmed.reduce((s, b) => s + b.totalAmount, 0);
    const uniqueCustomers = new Set(allBookings.map(b => b.phone)).size;

    res.json({
      totalBookings: allBookings.length,
      totalRevenue,
      pendingCount: pending.length,
      enquiryCount: enquiries.length,
      confirmedCount: confirmed.length,
      uniqueCustomers,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /api/bookings/stats/comparison — compare production vs sandbox
router.get("/stats/comparison", auth, requireRole("Owner", "SuperAdmin"), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const prodEnv = await Environment.findOne({ where: { tenantId, type: "production" } });
    const sandboxEnv = await Environment.findOne({ where: { tenantId, type: "sandbox" } });

    const prodBookings = prodEnv ? await Booking.findAll({ where: { tenantId, environmentId: prodEnv.id } }) : [];
    const sandboxBookings = sandboxEnv ? await Booking.findAll({ where: { tenantId, environmentId: sandboxEnv.id } }) : [];

    const prodConfirmed = prodBookings.filter(b => b.status === "Confirmed" || b.status === "Completed");
    const sandboxConfirmed = sandboxBookings.filter(b => b.status === "Confirmed" || b.status === "Completed");

    res.json({
      production: {
        bookings: prodBookings.length,
        revenue: prodConfirmed.reduce((s, b) => s + b.totalAmount, 0)
      },
      sandbox: {
        bookings: sandboxBookings.length,
        revenue: sandboxConfirmed.reduce((s, b) => s + b.totalAmount, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comparison stats" });
  }
});

// GET /api/bookings/:id — single booking
router.get("/:id", auth, tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      where: { 
        bookingId: req.params.id, 
        tenantId: req.tenantId, 
        environmentId: req.environmentId 
      } 
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// POST /api/bookings/enquiry — create new public enquiry (unauthenticated)
router.post("/enquiry", async (req, res) => {
  try {
    const { customerName, phone, eventType, hall, date, session, guests, notes, tenantSlug } = req.body;
    if (!customerName || !phone || !date || !tenantSlug) {
      return res.status(400).json({ error: "Customer name, phone, date, and tenantSlug are required" });
    }

    const tenant = await Tenant.findOne({ where: { slug: tenantSlug, status: 'active' } });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const env = await Environment.findOne({ where: { tenantId: tenant.id, type: 'production' } });
    if (!env) return res.status(500).json({ error: "Production environment not found" });

    const booking = await Booking.create({
      tenantId: tenant.id,
      environmentId: env.id,
      customerName, phone, eventType, 
      hall: hall || "Main Hall", 
      date,
      session: session || "Full Day",
      guests: Number(guests) || 0,
      advance: 0,
      totalAmount: 0,
      status: "Enquiry",
      notes: notes || "",
    });

    res.status(201).json({ id: booking.bookingId, status: booking.status });
  } catch (err) {
    console.error("Create enquiry error:", err);
    res.status(500).json({ error: "Failed to create enquiry" });
  }
});

// POST /api/bookings — create new booking
router.post("/", auth, tenantScope, subscriptionGuard, auditLog("Create Booking"), async (req, res) => {
  try {
    const { customerName, phone, eventType, hall, date, session, guests, advance, totalAmount, status, notes } = req.body;
    if (!customerName || !phone || !date) {
      return res.status(400).json({ error: "Customer name, phone, and date are required" });
    }

    const booking = await Booking.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      customerName, phone, eventType, hall, date,
      session: session || "Full Day",
      guests: Number(guests) || 0,
      advance: Number(advance) || 0,
      totalAmount: Number(totalAmount) || 0,
      status: status || "Enquiry",
      notes: notes || "",
    });

    res.status(201).json({
      id: booking.bookingId,
      _id: booking.id,
      customerName: booking.customerName,
      phone: booking.phone,
      eventType: booking.eventType,
      hall: booking.hall,
      date: booking.date,
      session: booking.session,
      guests: booking.guests,
      advance: booking.advance,
      totalAmount: booking.totalAmount,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
    });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// PUT /api/bookings/:id — update booking
router.put("/:id", auth, tenantScope, subscriptionGuard, auditLog("Update Booking"), async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      where: { 
        bookingId: req.params.id,
        tenantId: req.tenantId,
        environmentId: req.environmentId
      } 
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const fields = ["customerName", "phone", "eventType", "hall", "date", "session", "guests", "advance", "totalAmount", "status", "notes"];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        booking[f] = ["guests", "advance", "totalAmount"].includes(f)
          ? Number(req.body[f])
          : req.body[f];
      }
    });

    await booking.save();
    res.json({
      id: booking.bookingId,
      _id: booking.id,
      customerName: booking.customerName,
      phone: booking.phone,
      eventType: booking.eventType,
      hall: booking.hall,
      date: booking.date,
      session: booking.session,
      guests: booking.guests,
      advance: booking.advance,
      totalAmount: booking.totalAmount,
      status: booking.status,
      notes: booking.notes,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// PATCH /api/bookings/:id/status — update status only
router.patch("/:id/status", auth, tenantScope, subscriptionGuard, auditLog("Update Booking Status"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status required" });

    const booking = await Booking.findOne({ 
      where: { 
        bookingId: req.params.id,
        tenantId: req.tenantId,
        environmentId: req.environmentId
      } 
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    
    booking.status = status;
    await booking.save();
    
    res.json({ id: booking.bookingId, status: booking.status });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// DELETE /api/bookings/:id — delete booking
router.delete("/:id", auth, requireRole("Owner", "Manager", "Tester"), tenantScope, subscriptionGuard, auditLog("Delete Booking"), async (req, res) => {
  try {
    const deletedCount = await Booking.destroy({ 
      where: { 
        bookingId: req.params.id,
        tenantId: req.tenantId,
        environmentId: req.environmentId
      } 
    });
    if (deletedCount === 0) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

module.exports = router;
