const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const Tenant = require("../models/Tenant");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.active) return res.status(401).json({ error: "Account is disabled" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    const tenant = await Tenant.findByPk(user.tenantId);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      tenant: tenant ? { name: tenant.name, slug: tenant.slug, sandboxEnabled: tenant.sandboxEnabled, allowEnvironmentSwitch: tenant.allowEnvironmentSwitch } : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/me — get current user
router.get("/me", auth, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.user.tenantId);
    res.json({ 
      user: req.user,
      tenant: tenant ? { name: tenant.name, slug: tenant.slug, sandboxEnabled: tenant.sandboxEnabled, allowEnvironmentSwitch: tenant.allowEnvironmentSwitch } : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// POST /api/auth/register (Owner only — create Manager/Staff accounts)
router.post("/register", auth, async (req, res) => {
  try {
    if (req.user.role !== "Owner") return res.status(403).json({ error: "Only Owner can create users" });

    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password required" });

    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const user = await User.create({ name, email, password, role: role || "Staff", phone: phone || "", tenantId: req.user.tenantId });
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/bootstrap — one-time SuperAdmin seed (remove after use)
router.post("/bootstrap", async (req, res) => {
  try {
    const exists = await User.findOne({
      where: { email: "admin@venueza.com" }
    });

    if (exists) {
      return res.json({ message: "SuperAdmin already exists" });
    }

    const user = await User.create({
      tenantId: 1,
      name: "Super Admin",
      email: "admin@venueza.com",
      password: "Admin@123",
      role: "SuperAdmin",
      phone: "9999999999",
      active: true
    });

    res.json({
      success: true,
      email: user.email,
      password: "Admin@123"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

