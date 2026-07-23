const { DataTypes } = require("sequelize");
const sequelize = require("../db");

/**
 * Journal Entry Line — Rows of a journal entry (Debits & Credits).
 */
const JournalEntryLine = sequelize.define("JournalEntryLine", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  journalEntryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "JournalEntries", key: "id" },
    onDelete: "CASCADE",
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "ChartOfAccounts", key: "id" },
  },
  debit: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  credit: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  description: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: false,
  indexes: [
    { fields: ["journalEntryId"], name: "idx_jrnline_entry" },
    { fields: ["accountId"], name: "idx_jrnline_account" },
  ],
});

module.exports = JournalEntryLine;
