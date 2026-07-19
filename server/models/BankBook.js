const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BankBook = sequelize.define("BankBook", {
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
  // If multiple banks, track which bank account
  masterBankId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.STRING, allowNull: false },
  
  transactionType: { type: DataTypes.STRING, allowNull: false }, // "UPI", "Bank Transfer", "Cheque"
  
  referenceId: { type: DataTypes.INTEGER, allowNull: true },
  referenceType: { type: DataTypes.STRING, allowNull: true }, // "Payment", "Expense", "Withdrawal", "Deposit"
  
  bankIn: { type: DataTypes.INTEGER, defaultValue: 0 },
  bankOut: { type: DataTypes.INTEGER, defaultValue: 0 },
  
  balance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // Running bank balance
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_bankbook_tenant_env" },
    { fields: ["date"], name: "idx_bankbook_date" },
    { fields: ["masterBankId"], name: "idx_bankbook_bank_id" },
  ],
});

module.exports = BankBook;
