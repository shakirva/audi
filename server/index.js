require("dotenv").config();
require("dotenv").config({ path: ".env.release" });
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
const feedbackRoutes = require("./routes/feedback");

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

const publicRoutes = require("./routes/public");

// ── Legacy API Routes (kept for backward compatibility) ──
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
    app.use("/api/expenses", expenseRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/public", publicRoutes);

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

// ── Version ──
app.get("/api/version", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || "development",
    commit: process.env.COMMIT_SHA || "unknown",
    release: process.env.RELEASE_ID || "unknown",
    timestamp: process.env.RELEASE_TIMESTAMP || new Date().toISOString()
  });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Centralized Error Handler (catches all errors from next(err)) ──
app.use(errorHandler);

// ── Connect to PostgreSQL and start server ──
const PORT = process.env.PORT || 5000;

const initDB = async () => {
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL (production mode, sync disabled)");
  } else {
    await sequelize.sync({ alter: false }); // creates tables if they don't exist
    console.log("✅ Connected to PostgreSQL & synced tables");
  }
};

initDB()
  .then(async () => {
    
    // FIX: Populate missing createdBy in Bookings from Enquiries
    try {
      const { Booking, Enquiry } = require('./models');
      const bookings = await Booking.findAll({ where: { createdBy: null } });
      for (const b of bookings) {
        if (b.enquiryId) {
          const enq = await Enquiry.findByPk(b.enquiryId);
          if (enq && enq.createdBy) {
            b.createdBy = enq.createdBy;
            await b.save();
          } else if (enq && enq.salesExecutiveId) {
            b.createdBy = enq.salesExecutiveId;
            await b.save();
          }
        }
      }
    } catch (err) {
      console.error("Failed to run booking createdBy fix:", err);
    }
    
    // FORCE drop NOT NULL constraints that sync(alter: true) fails to handle
    try {
      await sequelize.query('ALTER TABLE "Enquiries" ALTER COLUMN "customerId" DROP NOT NULL;');
      console.log("✅ Forced DROP NOT NULL on customerId in Enquiries table");
    } catch (e) {
      console.log("⚠️ Could not drop NOT NULL on customerId (already dropped or table missing):", e.message);
    }
    
    // FIX: Add 'Afternoon' to enum_Bookings_session if missing
    try {
      await sequelize.query("ALTER TYPE \"enum_Bookings_session\" ADD VALUE 'Afternoon'");
      console.log("✅ Added 'Afternoon' to enum_Bookings_session");
    } catch (e) {
      // Ignored - usually means it already exists
    }
    
    // FIX: Reset Enquiries that are "Booking Confirmed" but have no actual Booking
    try {
      const result = await sequelize.query(`
        UPDATE "Enquiries" 
        SET status = 'Interested' 
        WHERE status = 'Booking Confirmed' AND id NOT IN (
          SELECT "enquiryId" FROM "Bookings" WHERE "enquiryId" IS NOT NULL
        )
      `);
      console.log("✅ Reset stuck Enquiries");
    } catch (e) {
      console.log("⚠️ Could not reset stuck Enquiries:", e.message);
    }

    // MIGRATION: Create VendorBills and VendorPayments tables if they don't exist
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "VendorBills" (
          id SERIAL PRIMARY KEY,
          "tenantId" INTEGER NOT NULL REFERENCES "Tenants"(id),
          "environmentId" INTEGER NOT NULL REFERENCES "Environments"(id),
          "vendorId" INTEGER NOT NULL REFERENCES "Vendors"(id),
          "billNumber" VARCHAR(255) NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "dueDate" TIMESTAMP WITH TIME ZONE,
          description VARCHAR(255) NOT NULL,
          amount DECIMAL(12,2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
          "bookingId" INTEGER REFERENCES "Bookings"(id),
          notes TEXT,
          "createdBy" INTEGER,
          "deletedAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "VendorPayments" (
          id SERIAL PRIMARY KEY,
          "tenantId" INTEGER NOT NULL REFERENCES "Tenants"(id),
          "environmentId" INTEGER NOT NULL REFERENCES "Environments"(id),
          "vendorId" INTEGER NOT NULL REFERENCES "Vendors"(id),
          "vendorBillId" INTEGER REFERENCES "VendorBills"(id),
          "paymentNumber" VARCHAR(255) NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          amount DECIMAL(12,2) NOT NULL,
          "paymentMode" VARCHAR(255) NOT NULL,
          "referenceNumber" VARCHAR(255),
          description VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'Completed',
          "createdBy" INTEGER,
          "deletedAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      console.log("✅ VendorBills & VendorPayments tables ensured");
    } catch (e) {
      console.log("⚠️ VendorBills/VendorPayments migration:", e.message);
    }

    // MIGRATION: Add VendorBill/VendorPayment to sourceModule ENUMs
    try {
      await sequelize.query(`ALTER TYPE "enum_JournalEntries_sourceModule" ADD VALUE IF NOT EXISTS 'VendorBill';`);
      await sequelize.query(`ALTER TYPE "enum_JournalEntries_sourceModule" ADD VALUE IF NOT EXISTS 'VendorPayment';`);
      await sequelize.query(`ALTER TYPE "enum_Vouchers_sourceModule" ADD VALUE IF NOT EXISTS 'VendorBill';`);
      await sequelize.query(`ALTER TYPE "enum_Vouchers_sourceModule" ADD VALUE IF NOT EXISTS 'VendorPayment';`);
      console.log("✅ VendorBill/VendorPayment ENUM values ensured");
    } catch (e) {
      console.log("⚠️ ENUM migration:", e.message);
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

module.exports = app;
