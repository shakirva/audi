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
  
  // JSONB fields for nested data in PostgreSQL
  halls: { type: DataTypes.JSONB, defaultValue: [] },
  blackoutDates: { type: DataTypes.JSONB, defaultValue: [] },
  notifications: { type: DataTypes.JSONB, defaultValue: {} },
  gallery: { type: DataTypes.JSONB, defaultValue: [] },
  eventTypes: { type: DataTypes.JSONB, defaultValue: ["Wedding", "Reception", "Engagement", "Birthday", "Conference", "Anniversary", "Baptism", "Other"] },
  sessions: { type: DataTypes.JSONB, defaultValue: [{ name: "Morning", time: "09:00 AM - 02:00 PM" }, { name: "Evening", time: "04:00 PM - 10:00 PM" }, { name: "Full Day", time: "09:00 AM - 10:00 PM" }] },
  expenseCategories: { type: DataTypes.JSONB, defaultValue: ["Staff Salaries", "Maintenance", "Utilities", "Catering Prep", "Miscellaneous"] },
  
  managerRevenueEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  indexes: [
    { unique: true, fields: ["tenantId", "environmentId"], name: "idx_settings_tenant_env" },
  ],
});

module.exports = Settings;
