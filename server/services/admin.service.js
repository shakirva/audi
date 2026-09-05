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

    const t = await Tenant.sequelize.transaction();
    try {
      // 1. Create Tenant
      const tenant = await Tenant.create({ name, slug, ownerName, email, phone }, { transaction: t });

      // 2. Create Environments
      const prodEnv = await Environment.create({ tenantId: tenant.id, name: "Production", type: "production", isDefault: true }, { transaction: t });
      const sandboxEnv = await Environment.create({ tenantId: tenant.id, name: "Sandbox", type: "sandbox", isDefault: false }, { transaction: t });

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
      }, { transaction: t });

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
      }, { transaction: t });

      // 5. Create Default Settings
      let defaultHalls = [];
      if (plan === 'starter') {
        defaultHalls = [
          { name: "Main Hall", icon: "🏛️", price: 15000, capacity: 600, description: "Grand hall" }
        ];
      } else {
        defaultHalls = [
          { name: "Main Hall", icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup" },
          { name: "Mini Hall", icon: "🏠", price: 6000, capacity: 150, description: "Intimate setting for smaller events" },
        ];
      }
      
      await Settings.create({ tenantId: tenant.id, environmentId: prodEnv.id, venueName: name, email, phone, halls: defaultHalls }, { transaction: t });
      await Settings.create({ tenantId: tenant.id, environmentId: sandboxEnv.id, venueName: name, email, phone, halls: defaultHalls }, { transaction: t });

      await t.commit();
      return { tenant, defaultPassword: generatedPassword };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateSubscription(tenantId, { plan, status, trialEndDate, subscriptionStartDate, subscriptionEndDate, billingPeriodMonths, billingPeriod, notes }) {
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
    if (subscriptionStartDate !== undefined) subscription.subscriptionStartDate = subscriptionStartDate || null;
    if (subscriptionEndDate !== undefined) subscription.subscriptionEndDate = subscriptionEndDate || null;
    
    let resolvedMonths = billingPeriodMonths;
    // Map legacy billingPeriod ENUM strings safely to billingPeriodMonths integers if necessary
    if (resolvedMonths === undefined && billingPeriod) {
      if (billingPeriod === "monthly" || billingPeriod === "1_month") resolvedMonths = 1;
      else if (billingPeriod === "3_months") resolvedMonths = 3;
      else if (billingPeriod === "6_months") resolvedMonths = 6;
      else if (billingPeriod === "annual" || billingPeriod === "12_months") resolvedMonths = 12;
      else if (billingPeriod === "lifetime") resolvedMonths = null;
    }

    if (resolvedMonths !== undefined) subscription.billingPeriodMonths = resolvedMonths || null;
    if (notes !== undefined) subscription.notes = notes || "";

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
