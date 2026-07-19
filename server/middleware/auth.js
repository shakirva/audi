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

    req.user = user;
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
