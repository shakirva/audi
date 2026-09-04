/**
 * Plan Gate Middleware — Enforces feature entitlements based on tenant's subscription plan.
 * 
 * Usage:
 *   // Auto-detect feature from route path
 *   router.use(auth, tenantScope, subscriptionGuard, planGate);
 * 
 *   // Explicitly require a feature
 *   router.use(auth, tenantScope, subscriptionGuard, requireFeature("advanced_accounting"));
 * 
 *   // Check limit before creating a resource
 *   router.post("/register", auth, checkUserLimit, handler);
 */

const { checkFeature, checkLimit, getLimit, ROUTE_FEATURE_MAP, getPlan } = require("../config/plans");
const { User, Settings } = require("../models");

/**
 * Auto-detect which feature the current route requires and enforce it.
 * Looks at req.baseUrl to determine the feature key from ROUTE_FEATURE_MAP.
 */
const planGate = (req, res, next) => {
  try {
    if (!req.subscription) {
      return res.status(403).json({ error: "No subscription found" });
    }

    // SuperAdmin bypasses all plan checks
    if (req.user && req.user.role === "SuperAdmin") {
      return next();
    }

    const plan = req.subscription.plan;

    // Find matching feature for this route
    const routePath = req.baseUrl.replace("/api/v1", "");
    const featureKey = ROUTE_FEATURE_MAP[routePath];

    if (!featureKey) {
      // No feature mapping for this route — allow by default
      // Core features like /bookings, /enquiries, /payments don't need gating
      return next();
    }

    if (!checkFeature(plan, featureKey)) {
      const planConfig = getPlan(plan);
      return res.status(403).json({
        error: "Feature not available on your current plan",
        code: "PLAN_UPGRADE_REQUIRED",
        feature: featureKey,
        currentPlan: planConfig ? planConfig.displayName : plan,
        message: `This feature requires a Professional or Business plan. Please upgrade to access it.`,
      });
    }

    next();
  } catch (err) {
    console.error("PlanGate error:", err);
    res.status(500).json({ error: "Failed to verify plan entitlements" });
  }
};

/**
 * Explicitly require a specific feature.
 * Use when a route doesn't match the auto-detect pattern.
 */
const requireFeature = (featureKey) => (req, res, next) => {
  try {
    if (!req.subscription) {
      return res.status(403).json({ error: "No subscription found" });
    }

    if (req.user && req.user.role === "SuperAdmin") {
      return next();
    }

    const plan = req.subscription.plan;

    if (!checkFeature(plan, featureKey)) {
      const planConfig = getPlan(plan);
      return res.status(403).json({
        error: "Feature not available on your current plan",
        code: "PLAN_UPGRADE_REQUIRED",
        feature: featureKey,
        currentPlan: planConfig ? planConfig.displayName : plan,
        message: `This feature requires a higher plan. Please upgrade to access it.`,
      });
    }

    next();
  } catch (err) {
    console.error("RequireFeature error:", err);
    res.status(500).json({ error: "Failed to verify feature entitlement" });
  }
};

/**
 * Check user limit before creating a new user.
 * Attach to user creation routes.
 */
const checkUserLimit = async (req, res, next) => {
  try {
    if (req.user && req.user.role === "SuperAdmin") {
      return next();
    }

    if (!req.subscription || !req.user) {
      return res.status(403).json({ error: "No subscription found" });
    }

    const plan = req.subscription.plan;
    const tenantId = req.user.tenantId;

    // Count active users for this tenant
    const currentCount = await User.count({
      where: { tenantId, active: true },
    });

    if (!checkLimit(plan, "maxUsers", currentCount)) {
      const max = getLimit(plan, "maxUsers");
      return res.status(403).json({
        error: "User limit reached",
        code: "LIMIT_EXCEEDED",
        limitType: "users",
        currentCount,
        maxAllowed: max,
        message: `Your ${plan} plan allows up to ${max} users. Please upgrade your plan to add more users.`,
      });
    }

    next();
  } catch (err) {
    console.error("CheckUserLimit error:", err);
    res.status(500).json({ error: "Failed to verify user limit" });
  }
};

/**
 * Check hall limit before saving settings with new halls.
 * Attach to settings update routes.
 */
const checkHallLimit = async (req, res, next) => {
  try {
    if (req.user && req.user.role === "SuperAdmin") {
      return next();
    }

    if (!req.subscription) {
      return res.status(403).json({ error: "No subscription found" });
    }

    // Only check if halls are being updated
    if (!req.body.halls) {
      return next();
    }

    const plan = req.subscription.plan;
    const newHallCount = Array.isArray(req.body.halls) ? req.body.halls.length : 0;

    const max = getLimit(plan, "maxHalls");
    if (newHallCount > max) {
      return res.status(403).json({
        error: "Hall limit reached",
        code: "LIMIT_EXCEEDED",
        limitType: "halls",
        currentCount: newHallCount,
        maxAllowed: max,
        message: `Your ${plan} plan allows up to ${max} hall(s). Please upgrade your plan to add more halls.`,
      });
    }

    next();
  } catch (err) {
    console.error("CheckHallLimit error:", err);
    res.status(500).json({ error: "Failed to verify hall limit" });
  }
};

module.exports = { planGate, requireFeature, checkUserLimit, checkHallLimit };
