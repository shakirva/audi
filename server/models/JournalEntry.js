const { DataTypes } = require("sequelize");
const sequelize = require("../db");

/**
 * Journal Entry — Double-entry accounting journal.
 * Every financial transaction creates one journal entry with debit and credit legs.
 */
const JournalEntry = sequelize.define("JournalEntry", {
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
  journalNumber: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.STRING, allowNull: false },

  // Debit side
  debitAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ChartOfAccounts", key: "id" },
  },
  // Credit side
  creditAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ChartOfAccounts", key: "id" },
  },
  amount: { type: DataTypes.INTEGER, allowNull: false },

  // Source tracking
  sourceModule: {
    type: DataTypes.ENUM("Payment", "Expense", "Booking", "Refund", "Vendor", "Manual", "Opening"),
    allowNull: false,
  },
  sourceId: { type: DataTypes.INTEGER, allowNull: true },  // Payment ID, Expense ID, etc.

  // Voucher link
  voucherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Vouchers", key: "id" },
  },

  // Optional links
  customerId: { type: DataTypes.INTEGER, allowNull: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: true },

  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  hooks: {
    beforeValidate: async (entry, options) => {
      if (!entry.journalNumber) {
        const count = await JournalEntry.count({
          where: { tenantId: entry.tenantId, environmentId: entry.environmentId },
          transaction: options.transaction
        });
        entry.journalNumber = `JRN${String(count + 1).padStart(5, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_journal_tenant_env" },
    { unique: true, fields: ["journalNumber", "tenantId", "environmentId"], name: "idx_journal_number_unique" },
    { fields: ["debitAccountId"], name: "idx_journal_debit_acct" },
    { fields: ["creditAccountId"], name: "idx_journal_credit_acct" },
    { fields: ["sourceModule", "sourceId"], name: "idx_journal_source" },
    { fields: ["date"], name: "idx_journal_date" },
  ],
});

module.exports = JournalEntry;
