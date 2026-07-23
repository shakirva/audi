const { DataTypes } = require("sequelize");
const sequelize = require("../db");

/**
 * Chart of Accounts — Master list of all accounting heads.
 * Pre-seeded with standard accounts for Assets, Liabilities, Income, Expenses.
 */
const ChartOfAccount = sequelize.define("ChartOfAccount", {
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
  code: { type: DataTypes.STRING, allowNull: false },        // e.g. "1001", "2001", "3001"
  systemKey: { type: DataTypes.STRING, allowNull: true },    // e.g. "CASH_IN_HAND", "ACCOUNTS_RECEIVABLE"
  name: { type: DataTypes.STRING, allowNull: false },         // e.g. "Cash Account", "Bank Account"
  type: {
    type: DataTypes.ENUM("Asset", "Liability", "Income", "Expense", "Equity"),
    allowNull: false,
  },
  subType: { type: DataTypes.STRING, allowNull: true },       // e.g. "Current Asset", "Fixed Asset"
  description: { type: DataTypes.STRING, allowNull: true },
  parentId: { type: DataTypes.INTEGER, allowNull: true },     // For hierarchy (optional)
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false }, // System accounts cannot be deleted
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  openingBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_coa_tenant_env" },
    { unique: true, fields: ["code", "tenantId", "environmentId"], name: "idx_coa_code_unique" },
  ],
});

module.exports = ChartOfAccount;
