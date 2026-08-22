const express = require("express");
const { Tenant, Subscription, User, Environment, Settings } = require("../models");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Only SuperAdmins can access these routes
router.use(auth, requireRole("SuperAdmin"));

// GET /api/admin/tenants — List all tenants with subscription info
router.get("/tenants", async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      include: [
        { model: Subscription, limit: 1, order: [["id", "DESC"]] },
      ],
      order: [["createdAt", "DESC"]]
    });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tenants" });
  }
});

// POST /api/admin/tenants — Create a new tenant (onboarding)
router.post("/tenants", async (req, res) => {
  try {
    const { name, slug, ownerName, email, phone, plan } = req.body;
    if (!name || !slug || !email) return res.status(400).json({ error: "Name, slug, and email required" });

    // 1. Create Tenant
    const tenant = await Tenant.create({ name, slug, ownerName, email, phone });

    // 2. Create Environments
    const prodEnv = await Environment.create({ tenantId: tenant.id, name: "Production", type: "production", isDefault: true });
    const sandboxEnv = await Environment.create({ tenantId: tenant.id, name: "Sandbox", type: "sandbox", isDefault: false });

    // 3. Create Subscription
    const today = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(today.getDate() + 7); // 7-day trial

    await Subscription.create({
      tenantId: tenant.id,
      plan: plan || "trial",
      status: "active",
      trialStartDate: today.toISOString().split("T")[0],
      trialEndDate: trialEnd.toISOString().split("T")[0],
    });

    // 4. Create Owner User
    await User.create({
      tenantId: tenant.id,
      name: ownerName || "Owner",
      email: email,
      password: "password123", // default password
      role: "Owner",
      phone: phone || ""
    });

    // 5. Create Default Settings
    const defaultHalls = [
      { name: "Main Hall", icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup" },
      { name: "Mini Hall", icon: "🏠", price: 6000, capacity: 150, description: "Intimate setting for smaller events" },
    ];
    await Settings.create({ tenantId: tenant.id, environmentId: prodEnv.id, venueName: name, email, phone, halls: defaultHalls });
    await Settings.create({ tenantId: tenant.id, environmentId: sandboxEnv.id, venueName: name, email, phone, halls: defaultHalls });

    res.status(201).json({ message: "Tenant created successfully", tenant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

// PUT /api/admin/tenants/:id/subscription — Update subscription status
router.put("/tenants/:id/subscription", async (req, res) => {
  try {
    const { plan, status, trialEndDate, subscriptionEndDate } = req.body;
    let subscription = await Subscription.findOne({
      where: { tenantId: req.params.id },
      order: [["id", "DESC"]]
    });

    if (!subscription) {
      subscription = await Subscription.create({ tenantId: req.params.id });
    }

    if (plan) subscription.plan = plan;
    if (status) subscription.status = status;
    if (trialEndDate !== undefined) subscription.trialEndDate = trialEndDate || null;
    if (subscriptionEndDate !== undefined) subscription.subscriptionEndDate = subscriptionEndDate || null;

    await subscription.save();
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// PATCH /api/admin/tenants/:id/toggle-sandbox — Toggle sandbox feature
router.patch("/tenants/:id/toggle-sandbox", async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    tenant.sandboxEnabled = !tenant.sandboxEnabled;
    await tenant.save();

    res.json({ id: tenant.id, sandboxEnabled: tenant.sandboxEnabled });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle sandbox" });
  }
});

// PATCH /api/admin/tenants/:id/status — Suspend/Activate tenant
router.patch("/tenants/:id/status", async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    tenant.status = tenant.status === "active" ? "suspended" : "active";
    await tenant.save();

    res.json({ id: tenant.id, status: tenant.status });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// PUT /api/admin/tenants/:id — Update tenant details
router.put("/tenants/:id", async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const { name, slug, ownerName, email, phone } = req.body;
    if (name) tenant.name = name;
    if (slug) tenant.slug = slug;
    if (ownerName) tenant.ownerName = ownerName;
    if (email) tenant.email = email;
    if (phone !== undefined) tenant.phone = phone;

    await tenant.save();
    res.json(tenant);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "Slug or email already in use" });
    }
    res.status(500).json({ error: "Failed to update tenant details" });
  }
});
// POST /api/admin/tenants/:id/impersonate — SuperAdmin enters a tenant's ERP as their Owner
router.post("/tenants/:id/impersonate", async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // Find the Owner user for this tenant
    const owner = await User.findOne({ 
      where: { tenantId: tenant.id, role: "Owner" } 
    });
    if (!owner) return res.status(404).json({ error: "No owner found for this tenant" });

    // Generate a JWT token for the owner — SuperAdmin is impersonating
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { id: owner.id, role: owner.role, tenantId: owner.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: "4h" } // Short expiry for impersonation sessions
    );

    res.json({
      token,
      user: { id: owner.id, name: owner.name, email: owner.email, role: owner.role, phone: owner.phone },
      tenant: { 
        name: tenant.name, 
        slug: tenant.slug, 
        sandboxEnabled: tenant.sandboxEnabled, 
        allowEnvironmentSwitch: tenant.allowEnvironmentSwitch 
      },
    });
  } catch (err) {
    console.error("Impersonation error:", err);
    res.status(500).json({ error: "Failed to impersonate tenant" });
  }
});

module.exports = router;
