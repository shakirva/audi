const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const FinancialPeriod = sequelize.define("FinancialPeriod", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" } },
  environmentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Environments", key: "id" } },
  name: { type: DataTypes.STRING, allowNull: false }, // e.g., "FY 2026", "Jan 2026"
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM("Open", "Closed"),
    defaultValue: "Open",
  },
  closedAt: { type: DataTypes.DATE, allowNull: true },
  closedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_finperiod_tenant_env" },
    { fields: ["startDate", "endDate"], name: "idx_finperiod_dates" },
    { fields: ["status"], name: "idx_finperiod_status" }
  ]
});

module.exports = FinancialPeriod;
