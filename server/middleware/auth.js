const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token and attach user to request
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // In Sequelize, use findByPk instead of findById
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] }
    });
    
    if (!user || !user.active) return res.status(401).json({ error: "User not found or disabled" });

    // Multi-Tenant Security: Resolve Environment from header
    const Environment = require("../models/Environment");
    const envHeader = req.headers["x-environment"] || "prod";
    
    // Fallback logic to grab the appropriate environment for this tenant
    let environment = await Environment.findOne({ 
      where: { tenantId: user.tenantId, type: envHeader === "sandbox" ? "sandbox" : "prod" } 
    });

    if (!environment) {
      // If the specific requested environment isn't found, fallback to their first one
      environment = await Environment.findOne({ where: { tenantId: user.tenantId } });
    }

    if (!environment) return res.status(401).json({ error: "No environment found for tenant" });

    // Explicitly attach tenant isolation metadata
    req.user = user.toJSON();
    req.user.tenantId = user.tenantId;
    req.user.environmentId = environment.id;

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Restrict to specific roles
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

module.exports = { auth, requireRole };
