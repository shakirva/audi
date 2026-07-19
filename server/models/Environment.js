const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Environment = sequelize.define("Environment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Tenants", key: "id" },
  },
  name: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.STRING, // 'production', 'sandbox', 'training', etc.
    defaultValue: "production",
  },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  indexes: [
    { unique: true, fields: ["tenantId", "name"], name: "idx_environments_tenant_name" },
  ],
});

module.exports = Environment;
