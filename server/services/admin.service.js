const { Tenant, Subscription, User, Environment, Settings } = require("../models");
const { NotFoundError, BadRequestError } = require("../helpers/errors");
const { ROLES } = require("../helpers/roles");

class AdminService {
  async getTenants() {
    return Tenant.findAll({
      include: [
        { model: Subscription, limit: 1, order: [["id", "DESC"]] },
      ],
      order: [["createdAt", "DESC"]]
    });
  }

  async createTenant({ name, slug, ownerName, email, phone, plan }) {
    if (!name || !slug || !email) {
      throw new BadRequestError("Name, slug, and email required");
    }

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
    const crypto = require("crypto");
    const generatedPassword = crypto.randomBytes(4).toString("hex") + "!Aa";

    await User.create({
      tenantId: tenant.id,
      name: ownerName || "Owner",
      email: email,
      password: generatedPassword, // generated secure password
      role: ROLES.OWNER,
      phone: phone || ""
    });

    // 5. Create Default Settings
    const defaultHalls = [
      { name: "Main Hall", icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup" },
      { name: "Mini Hall", icon: "🏠", price: 6000, capacity: 150, description: "Intimate setting for smaller events" },
    ];
    await Settings.create({ tenantId: tenant.id, environmentId: prodEnv.id, venueName: name, email, phone, halls: defaultHalls });
    await Settings.create({ tenantId: tenant.id, environmentId: sandboxEnv.id, venueName: name, email, phone, halls: defaultHalls });

    return { tenant, defaultPassword: generatedPassword };
  }

  async updateSubscription(tenantId, { plan, status, trialEndDate, subscriptionEndDate }) {
    let subscription = await Subscription.findOne({
      where: { tenantId },
      order: [["id", "DESC"]]
    });

    if (!subscription) {
      subscription = await Subscription.create({ tenantId });
    }

    if (plan) subscription.plan = plan;
    if (status) subscription.status = status;
    if (trialEndDate !== undefined) subscription.trialEndDate = trialEndDate || null;
    if (subscriptionEndDate !== undefined) subscription.subscriptionEndDate = subscriptionEndDate || null;

    await subscription.save();
    return subscription;
  }

  async toggleSandbox(tenantId) {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) throw new NotFoundError("Tenant");

    tenant.sandboxEnabled = !tenant.sandboxEnabled;
    await tenant.save();

    return { id: tenant.id, sandboxEnabled: tenant.sandboxEnabled };
  }

  async toggleStatus(tenantId) {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) throw new NotFoundError("Tenant");

    tenant.status = tenant.status === "active" ? "suspended" : "active";
    await tenant.save();

    return { id: tenant.id, status: tenant.status };
  }
}

module.exports = new AdminService();
