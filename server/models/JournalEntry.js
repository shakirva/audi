const { DataTypes } = require("sequelize");
const sequelize = require("../db");

/**
 * Journal Entry (Header) — Proper Double-Entry Accounting Architecture.
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
  journalNumber: { type: DataTypes.STRING, allowNull: false }, // JV-2026-000001
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.STRING, allowNull: false },

  // Source tracking for Idempotency
  sourceModule: {
    type: DataTypes.ENUM("Payment", "Expense", "Booking", "Refund", "Vendor", "Manual", "Opening"),
    allowNull: false,
  },
  sourceId: { type: DataTypes.INTEGER, allowNull: true },

  // Links
  voucherId: { type: DataTypes.INTEGER, allowNull: true },
  customerId: { type: DataTypes.INTEGER, allowNull: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: true },

  // Status & Audit Trail
  status: {
    type: DataTypes.ENUM("Draft", "Posted", "Cancelled", "Reversed"),
    defaultValue: "Draft",
  },
  postedAt: { type: DataTypes.DATE, allowNull: true },
  reversedAt: { type: DataTypes.DATE, allowNull: true },
  reversedBy: { type: DataTypes.INTEGER, allowNull: true },
  remarks: { type: DataTypes.TEXT, allowNull: true },

  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  hooks: {
    beforeValidate: async (entry, options) => {
      if (!entry.journalNumber) {
        const year = new Date().getFullYear();
        const count = await JournalEntry.count({
          where: { tenantId: entry.tenantId, environmentId: entry.environmentId },
          transaction: options.transaction
        });
        entry.journalNumber = `JV-${year}-${String(count + 1).padStart(6, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_journal_tenant_env" },
    { unique: true, fields: ["journalNumber", "tenantId", "environmentId"], name: "idx_journal_number_unique" },
    { fields: ["sourceModule", "sourceId", "tenantId", "environmentId"], name: "idx_journal_idempotency_source" },
    { fields: ["bookingId"], name: "idx_journal_booking" },
    { fields: ["date"], name: "idx_journal_date" },
    { fields: ["status"], name: "idx_journal_status" },
  ],
});

module.exports = JournalEntry;
