const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AccountStatement = sequelize.define("AccountStatement", {
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
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Customers", key: "id" },
  },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.STRING, allowNull: false },
  
  // E.g. "Booking Advance", "Payment Received", "Refund", "Invoice Issued"
  transactionType: { type: DataTypes.STRING, allowNull: false },
  
  referenceId: { type: DataTypes.INTEGER, allowNull: true }, // e.g. Payment ID or Booking ID
  referenceType: { type: DataTypes.STRING, allowNull: true }, // e.g. "Payment", "Booking"
  
  debit: { type: DataTypes.INTEGER, defaultValue: 0 },  // Amount customer owes (Invoice/Booking total)
  credit: { type: DataTypes.INTEGER, defaultValue: 0 }, // Amount customer paid (Payment)
  
  balance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // Running balance
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_acc_stmts_tenant_env" },
    { fields: ["customerId"], name: "idx_acc_stmts_customer" },
    { fields: ["date"], name: "idx_acc_stmts_date" },
  ],
});

module.exports = AccountStatement;
