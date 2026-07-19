const { Subscription, Tenant } = require("../models");

const subscriptionGuard = async (req, res, next) => {
  try {
    // SuperAdmin bypasses all subscription checks
    if (req.user && req.user.role === "SuperAdmin") {
      return next();
    }

    if (!req.tenantId) {
      return res.status(500).json({ error: "Missing tenant scope" });
    }

    // 1. Check Tenant Status
    const tenant = await Tenant.findByPk(req.tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    if (tenant.status === "suspended") {
      return res.status(403).json({ error: "Account suspended. Please contact support." });
    }

    // 2. Check Subscription
    const subscription = await Subscription.findOne({
      where: { tenantId: req.tenantId },
      order: [["id", "DESC"]] // get latest
    });

    if (!subscription) {
      return res.status(403).json({ error: "No active subscription found." });
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (subscription.status === "cancelled") {
      return res.status(403).json({ error: "Subscription cancelled." });
    }

    if (subscription.status === "expired") {
      return res.status(403).json({ error: "Subscription expired." });
    }

    // If plan is trial, check trialEndDate
    if (subscription.plan === "trial") {
      if (subscription.trialEndDate && subscription.trialEndDate < today) {
        // Auto-update status to expired
        subscription.status = "expired";
        await subscription.save();
        return res.status(403).json({ error: "Trial expired. Please upgrade your plan." });
      }
    } else {
      // For paid plans, check subscriptionEndDate
      if (subscription.subscriptionEndDate && subscription.subscriptionEndDate < today) {
        subscription.status = "expired";
        await subscription.save();
        return res.status(403).json({ error: "Subscription expired. Please renew." });
      }
    }

    // Valid subscription
    req.subscription = subscription;
    next();
  } catch (err) {
    console.error("SubscriptionGuard error:", err);
    res.status(500).json({ error: "Failed to verify subscription status" });
  }
};

module.exports = { subscriptionGuard };
