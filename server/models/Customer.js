const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Customer = sequelize.define("Customer", {
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
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  altPhone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.STRING, allowNull: true },
  pincode: { type: DataTypes.STRING, allowNull: true },
  customerType: { type: DataTypes.ENUM("Individual", "Corporate"), defaultValue: "Individual" },
  source: { type: DataTypes.STRING, allowNull: true }, // Lead source reference
  notes: { type: DataTypes.TEXT, allowNull: true },
  
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true, // Enables soft delete via deletedAt column
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_customers_tenant_env" },
    { fields: ["phone", "tenantId", "environmentId"], name: "idx_customers_phone_tenant_env" },
  ],
});

module.exports = Customer;
