const express = require("express");
const Settings = require("../models/Settings");
const { auth, requireRole } = require("../middleware/auth");
const { tenantScope } = require("../middleware/tenantScope");
const { subscriptionGuard } = require("../middleware/subscriptionGuard");
const { auditLog } = require("../middleware/audit");
const Tenant = require("../models/Tenant");
const Environment = require("../models/Environment");

const router = express.Router();

async function getSettings(tenantId, environmentId) {
  let settings = await Settings.findOne({ where: { tenantId, environmentId } });
  if (!settings) {
    settings = await Settings.create({
      tenantId,
      environmentId,
      halls: [
        { name: "Main Hall", icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup" },
        { name: "Mini Hall", icon: "🏠", price: 6000, capacity: 150, description: "Intimate setting for smaller events" },
        { name: "Open Stage", icon: "🌿", price: 8000, capacity: 300, description: "Outdoor stage with natural surroundings" },
      ]
    });
  }
  return settings;
}

// GET /api/settings/public/:slug — get public venue info (no auth required)
router.get("/public/:slug", async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ where: { slug: req.params.slug, status: 'active' } });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const env = await Environment.findOne({ where: { tenantId: tenant.id, type: 'production' } });
    if (!env) return res.status(500).json({ error: "Production environment not found" });

    const settings = await getSettings(tenant.id, env.id);
    res.json({
      name: settings.venueName,
      location: settings.location,
      phone: settings.phone,
      halls: settings.halls || [],
      blackoutDates: settings.blackoutDates || [],
      gallery: settings.gallery || [],
      eventTypes: settings.eventTypes || ["Wedding", "Reception", "Engagement", "Birthday", "Conference", "Anniversary", "Baptism", "Other"],
      sessions: settings.sessions || [{ name: "Morning", time: "09:00 AM - 02:00 PM" }, { name: "Evening", time: "04:00 PM - 10:00 PM" }, { name: "Full Day", time: "09:00 AM - 10:00 PM" }]
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public settings" });
  }
});

// GET /api/settings — get all settings
router.get("/", auth, tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const settings = await getSettings(req.tenantId, req.environmentId);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/settings — update settings
router.put("/", auth, requireRole("Owner", "Manager", "Tester"), tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const settings = await getSettings(req.tenantId, req.environmentId);
    const allowed = [
      "venueName", "ownerName", "location", "phone", "email", "gstin",
      "halls", "blackoutDates", "notifications", "managerRevenueEnabled",
      "gallery", "eventTypes", "sessions", "expenseCategories"
    ];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) settings[key] = req.body[key];
    });
    // In Sequelize, if you modify a JSONB field you might need to use changed()
    // but typically direct assignment works if you reassign the whole object.
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});


// GET /api/settings/customers — derived customer list from bookings
router.get("/customers", auth, tenantScope, subscriptionGuard, async (req, res) => {
  try {
    const Booking = require("../models/Booking");
    const bookings = await Booking.findAll({ 
      where: { 
        tenantId: req.tenantId,
        environmentId: req.environmentId
      } 
    });

    const customerMap = {};
    bookings.forEach(b => {
      if (!customerMap[b.phone]) {
        customerMap[b.phone] = {
          name: b.customerName,
          phone: b.phone,
          bookings: [],
          totalSpent: 0,
        };
      }
      customerMap[b.phone].bookings.push({
        id: b.bookingId,
        eventType: b.eventType,
        date: b.date,
        hall: b.hall,
        totalAmount: b.totalAmount,
        status: b.status,
      });
      if (b.status === "Confirmed" || b.status === "Completed") {
        customerMap[b.phone].totalSpent += b.totalAmount;
      }
    });

    const customers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// POST /api/settings/sandbox/reset — reset sandbox data
router.post("/sandbox/reset", auth, requireRole("Owner"), tenantScope, subscriptionGuard, auditLog("Reset Sandbox"), async (req, res) => {
  try {
    if (req.environmentType !== "sandbox") {
      return res.status(400).json({ error: "Can only reset the sandbox environment" });
    }
    
    const Booking = require("../models/Booking");
    const Expense = require("../models/Expense");
    
    // Delete all bookings and expenses in this sandbox
    await Booking.destroy({ where: { tenantId: req.tenantId, environmentId: req.environmentId } });
    await Expense.destroy({ where: { tenantId: req.tenantId, environmentId: req.environmentId } });
    
    // Create some default sample data
    await Booking.bulkCreate([
      { tenantId: req.tenantId, environmentId: req.environmentId, customerName: "Sample Wedding Booking", phone: "9000000001", eventType: "Wedding", hall: "Main Hall", date: "2026-08-15", session: "Full Day", guests: 300, advance: 5000, totalAmount: 25000, status: "Confirmed", notes: "Sample booking" },
      { tenantId: req.tenantId, environmentId: req.environmentId, customerName: "Sample Birthday Event", phone: "9000000002", eventType: "Birthday", hall: "Mini Hall", date: "2026-08-20", session: "Evening", guests: 80, advance: 2000, totalAmount: 8000, status: "Pending Payment", notes: "Sample booking" }
    ]);
    
    await Expense.bulkCreate([
      { tenantId: req.tenantId, environmentId: req.environmentId, category: "Staff Salaries", description: "Sample — Manager Salary", amount: 30000, date: "2026-08-01", recurring: true }
    ]);

    res.json({ message: "Sandbox reset successfully" });
  } catch (err) {
    console.error("Sandbox reset error:", err);
    res.status(500).json({ error: "Failed to reset sandbox" });
  }
});

// POST /api/settings/tester — create or reset tester account credentials
router.post("/tester", auth, requireRole("Owner"), async (req, res) => {
  try {
    const User = require("../models/User");
    const Tenant = require("../models/Tenant");
    const bcrypt = require("bcryptjs");

    const tenant = await Tenant.findByPk(req.user.tenantId);
    const email = req.body.email || `tester@${tenant.slug}.com`;
    const password = req.body.password || "tester" + Math.floor(1000 + Math.random() * 9000);

    let user = await User.findOne({ where: { tenantId: tenant.id, role: "Tester" } });
    if (user) {
      user.email = email;
      user.password = password;
      await user.save();
    } else {
      user = await User.create({
        tenantId: tenant.id,
        name: req.body.name || "Manager", // Disguised name
        email,
        password,
        role: "Tester"
      });
    }

    res.json({ email, password });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate tester credentials" });
  }
});

module.exports = router;
