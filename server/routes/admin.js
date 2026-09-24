const express = require("express");
const { Tenant, Subscription, User, Environment, Settings } = require("../models");
const { auth, requireRole } = require("../middleware/auth");
const { auditLog } = require("../middleware/audit");

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
router.post("/tenants", auditLog("Create Tenant"), async (req, res) => {
  try {
    const { name, slug, ownerName, email, phone, plan, customPrice } = req.body;
    if (!name || !slug || !email) return res.status(400).json({ error: "Name, slug, and email required" });

    // 1. Create Tenant
    const tenant = await Tenant.create({ name, slug, ownerName, email, phone });

    // 2. Create Environments
    const prodEnv = await Environment.create({ tenantId: tenant.id, name: "Production", type: "production", isDefault: true });
    const sandboxEnv = await Environment.create({ tenantId: tenant.id, name: "Sandbox", type: "sandbox", isDefault: false });

    // 3. Create Subscription
    const today = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(today.getDate() + 14); // 14-day trial

    await Subscription.create({
      tenantId: tenant.id,
      plan: plan || "trial",
      status: "active",
      trialStartDate: today.toISOString().split("T")[0],
      trialEndDate: trialEnd.toISOString().split("T")[0],
      customPrice: customPrice || null,
    });

    // 4. Create Owner User
    const crypto = require("crypto");
    const generatedPassword = crypto.randomBytes(4).toString("hex") + "!Aa"; // e.g., 'a1b2c3d4!Aa'

    await User.create({
      tenantId: tenant.id,
      name: ownerName || "Owner",
      email: email,
      password: generatedPassword,
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

    res.status(201).json({ message: "Tenant created successfully", tenant, defaultPassword: generatedPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

// PUT /api/admin/tenants/:id/subscription — Update subscription status
router.put("/tenants/:id/subscription", auditLog("Update Tenant Subscription"), async (req, res) => {
  try {
    const { plan, status, trialEndDate, subscriptionEndDate, customPrice } = req.body;
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
    if (customPrice !== undefined) subscription.customPrice = customPrice === "" ? null : customPrice;

    await subscription.save();
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// PATCH /api/admin/tenants/:id/toggle-sandbox — Toggle sandbox feature
router.patch("/tenants/:id/toggle-sandbox", auditLog("Toggle Tenant Sandbox"), async (req, res) => {
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
router.patch("/tenants/:id/status", auditLog("Update Tenant Status"), async (req, res) => {
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
router.put("/tenants/:id", auditLog("Update Tenant Details"), async (req, res) => {
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

// DELETE /api/admin/tenants/:id — Delete a tenant
router.delete("/tenants/:id", auditLog("Delete Tenant"), async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // Ensure we don't delete protected/system tenants if they exist (e.g. SuperAdmin)
    if (tenant.slug === 'superadmin' || tenant.slug === 'ktconvention' || tenant.slug === 'laurel-garden') {
       return res.status(403).json({ error: "Cannot delete protected system tenants." });
    }

    // Manually delete related data that might not have ON DELETE CASCADE at the DB level
    const models = require("../models");
    const tenantId = tenant.id;
    
    // Ordered deletion to respect potential internal foreign keys
    const journalEntries = await models.JournalEntry.findAll({ where: { tenantId } });
    const journalEntryIds = journalEntries.map(je => je.id);
    if (journalEntryIds.length > 0) {
      await models.JournalEntryLine.destroy({ where: { journalEntryId: journalEntryIds }, force: true });
    }
    await models.JournalEntry.destroy({ where: { tenantId }, force: true });
    await models.Voucher.destroy({ where: { tenantId }, force: true });
    await models.Receipt.destroy({ where: { tenantId }, force: true });
    await models.Payment.destroy({ where: { tenantId }, force: true });
    await models.VendorPayment.destroy({ where: { tenantId }, force: true });
    await models.VendorBill.destroy({ where: { tenantId }, force: true });
    await models.Expense.destroy({ where: { tenantId }, force: true });
    
    await models.JobChecklist.destroy({ where: { tenantId }, force: true });
    await models.JobDocument.destroy({ where: { tenantId }, force: true });
    await models.JobTimeline.destroy({ where: { tenantId }, force: true });
    await models.JobVendor.destroy({ where: { tenantId }, force: true });
    await models.JobStaff.destroy({ where: { tenantId }, force: true });
    await models.Job.destroy({ where: { tenantId }, force: true });
    
    await models.AgreementVersion.destroy({ where: { tenantId }, force: true });
    await models.Agreement.destroy({ where: { tenantId }, force: true });
    await models.AgreementTemplate.destroy({ where: { tenantId }, force: true });
    
    await models.FollowUp.destroy({ where: { tenantId }, force: true });
    await models.Booking.destroy({ where: { tenantId }, force: true });
    await models.Enquiry.destroy({ where: { tenantId }, force: true });
    await models.AccountStatement.destroy({ where: { tenantId }, force: true });
    await models.CashBook.destroy({ where: { tenantId }, force: true });
    await models.BankBook.destroy({ where: { tenantId }, force: true });
    await models.ChartOfAccount.destroy({ where: { tenantId }, force: true });
    
    await models.Customer.destroy({ where: { tenantId }, force: true });
    await models.Vendor.destroy({ where: { tenantId }, force: true });
    await models.Inventory.destroy({ where: { tenantId }, force: true });
    
    await models.MasterHall.destroy({ where: { tenantId }, force: true });
    await models.MasterPackage.destroy({ where: { tenantId }, force: true });
    await models.MasterService.destroy({ where: { tenantId }, force: true });
    await models.MasterEventType.destroy({ where: { tenantId }, force: true });
    await models.MasterLeadSource.destroy({ where: { tenantId }, force: true });
    await models.MasterPaymentMode.destroy({ where: { tenantId }, force: true });
    await models.MasterBank.destroy({ where: { tenantId }, force: true });
    await models.MasterExpenseCategory.destroy({ where: { tenantId }, force: true });
    
    await models.Feedback.destroy({ where: { tenantId }, force: true });
    await models.FinancialPeriod.destroy({ where: { tenantId }, force: true });
    await models.ComplianceDocument.destroy({ where: { tenantId }, force: true });
    await models.LeaveRequest.destroy({ where: { tenantId }, force: true });
    await models.Attendance.destroy({ where: { tenantId }, force: true });
    
    await models.AuditLog.destroy({ where: { tenantId }, force: true });
    await models.Settings.destroy({ where: { tenantId }, force: true });
    await models.Subscription.destroy({ where: { tenantId }, force: true });
    await models.User.destroy({ where: { tenantId }, force: true });
    await models.Environment.destroy({ where: { tenantId }, force: true });

    await tenant.destroy({ force: true }); // Finally delete the tenant
    res.json({ success: true, message: "Tenant deleted successfully" });
  } catch (err) {
    console.error("Failed to delete tenant:", err);
    res.status(500).json({ error: "Failed to delete tenant. Check logs for details." });
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

// GET /api/admin/leads — Fetch all demo requests from the landing page
router.get("/leads", async (req, res) => {
  try {
    const { DemoRequest } = require("../models");
    const leads = await DemoRequest.findAll({ order: [["createdAt", "DESC"]] });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// PATCH /api/admin/leads/:id/status — Update lead status
router.patch("/leads/:id/status", async (req, res) => {
  try {
    const { DemoRequest } = require("../models");
    const lead = await DemoRequest.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    if (req.body.status) lead.status = req.body.status;
    await lead.save();

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: "Failed to update lead status" });
  }
});

module.exports = router;
