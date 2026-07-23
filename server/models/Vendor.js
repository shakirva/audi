const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Vendor = sequelize.define("Vendor", {
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
  category: { type: DataTypes.STRING, allowNull: false }, // Catering, Decoration, etc.
  phone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "Active" }, // Active, Inactive
}, {
  paranoid: true,
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_vendors_tenant_env" },
  ],
});

module.exports = Vendor;
