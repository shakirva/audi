require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const sequelize = require("./db");

// Load all models + associations (must be before routes)
require("./models");

// ── Existing routes (backward compatible — DO NOT REMOVE) ──
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const expenseRoutes = require("./routes/expenses");
const settingsRoutes = require("./routes/settings");
const adminRoutes = require("./routes/admin");

// ── New v1 API routes (Controller → Service → Repository) ──
const v1Routes = require("./routes/v1");

// ── New middleware ──
const { requestId } = require("./middleware/requestId");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── Trust Nginx Proxy ──
app.set('trust proxy', 1);

// ── Security ──
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "http://127.0.0.1:5173"],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: "Too many requests, please try again later" },
  validate: { xForwardedForHeader: false },
});
app.use("/api/", limiter);

// ── Request ID (every response gets a unique trace ID) ──
app.use(requestId);

// ── Body parsing ──
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Static Files ──
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ── Legacy API Routes (kept for backward compatibility) ──
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);

// ── V1 API Routes (new architecture — use these going forward) ──
app.use("/api/v1", v1Routes);

// ── Health check ──
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString(), version: "1.0.0" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Centralized Error Handler (catches all errors from next(err)) ──
app.use(errorHandler);

// ── Connect to PostgreSQL and start server ──
const PORT = process.env.PORT || 5000;

sequelize
  .sync({ alter: true }) // creates tables if they don't exist
  .then(async () => {
    console.log("✅ Connected to PostgreSQL & synced tables");
    
    // FORCE drop NOT NULL constraints that sync(alter: true) fails to handle
    try {
      await sequelize.query('ALTER TABLE "Enquiries" ALTER COLUMN "customerId" DROP NOT NULL;');
      console.log("✅ Forced DROP NOT NULL on customerId in Enquiries table");
    } catch (e) {
      console.log("⚠️ Could not drop NOT NULL on customerId (already dropped or table missing):", e.message);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Venueza API running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📦 V1 API: http://localhost:${PORT}/api/v1`);
    });
  })
  .catch((err) => {
    console.error("❌ PostgreSQL connection failed:", err.message);
    process.exit(1);
  });
