const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const CashBook = sequelize.define("CashBook", {
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
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.STRING, allowNull: false },
  
  transactionType: { type: DataTypes.STRING, allowNull: false }, // "Payment Received", "Expense Paid", etc.
  
  referenceId: { type: DataTypes.INTEGER, allowNull: true },
  referenceType: { type: DataTypes.STRING, allowNull: true }, // "Payment", "Expense"
  
  cashIn: { type: DataTypes.INTEGER, defaultValue: 0 },
  cashOut: { type: DataTypes.INTEGER, defaultValue: 0 },
  
  balance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // Running cash balance
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_cashbook_tenant_env" },
    { fields: ["date"], name: "idx_cashbook_date" },
  ],
});

module.exports = CashBook;
