const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Expense = sequelize.define("Expense", {
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
  category: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Bookings", key: "id" }
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Vendors", key: "id" }
  },
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true, // Enables soft delete via deletedAt column
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_expenses_tenant_env" },
  ],
});

module.exports = Expense;

