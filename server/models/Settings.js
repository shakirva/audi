const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Settings = sequelize.define("Settings", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Tenants", key: "id" },
  },
  environmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Environments", key: "id" },
  },
  venueName: { type: DataTypes.STRING, defaultValue: "Sreelakshmi Convention Centre" },
  ownerName: { type: DataTypes.STRING, defaultValue: "Rajan P.K." },
  location: { type: DataTypes.STRING, defaultValue: "Taliparamba, Kannur, Kerala" },
  phone: { type: DataTypes.STRING, defaultValue: "+91 94470 12345" },
  email: { type: DataTypes.STRING, defaultValue: "" },
  gstin: { type: DataTypes.STRING, defaultValue: "" },
  bookingPrefix: { type: DataTypes.STRING, defaultValue: "BK" },
  receiptPrefix: { type: DataTypes.STRING, defaultValue: "PAY" },
  
  // Branding and Bank Details
  logoUrl: { type: DataTypes.STRING, defaultValue: "" },
  legalName: { type: DataTypes.STRING, defaultValue: "" },
  bankName: { type: DataTypes.STRING, defaultValue: "" },
  accountName: { type: DataTypes.STRING, defaultValue: "" },
  accountNumber: { type: DataTypes.STRING, defaultValue: "" },
  ifscCode: { type: DataTypes.STRING, defaultValue: "" },

  // JSONB fields for nested data in PostgreSQL
  halls: { type: DataTypes.JSONB, defaultValue: [] },
  blackoutDates: { type: DataTypes.JSONB, defaultValue: [] },
  notifications: { type: DataTypes.JSONB, defaultValue: {} },
  gallery: { type: DataTypes.JSONB, defaultValue: [] },
  eventTypes: { type: DataTypes.JSONB, defaultValue: ["Wedding", "Reception", "Engagement", "Birthday", "Conference", "Anniversary", "Baptism", "Other"] },
  sessions: { type: DataTypes.JSONB, defaultValue: [{ name: "Morning", time: "09:00 AM - 02:00 PM" }, { name: "Evening", time: "04:00 PM - 10:00 PM" }, { name: "Full Day", time: "09:00 AM - 10:00 PM" }] },
  expenseCategories: { type: DataTypes.JSONB, defaultValue: ["Staff Salaries", "Maintenance", "Utilities", "Catering Prep", "Miscellaneous"] },
  places: { type: DataTypes.JSONB, defaultValue: ["Kannur", "Thalassery", "Iritty", "Kuthuparamba", "Payyanur"] },
  
  managerRevenueEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  
  // Role-Based Module Access configuration
  moduleAccess: { type: DataTypes.JSONB, defaultValue: {} },
  
  // GST calculation mode: 'inclusive' = GST is part of quoted amount, 'exclusive' = GST added on top
  gstMode: { type: DataTypes.STRING, defaultValue: "inclusive" },
  
  // Allow booking on past dates (for backfilling previous year data)
  allowPastDateBooking: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  indexes: [
    { unique: true, fields: ["tenantId", "environmentId"], name: "idx_settings_tenant_env" },
  ],
});

module.exports = Settings;
