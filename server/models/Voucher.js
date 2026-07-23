const { DataTypes } = require("sequelize");
const sequelize = require("../db");

/**
 * Voucher — Every financial transaction generates a voucher.
 * Supports: Receipt (RV), Payment (PV), Journal (JV), Contra (CV), Expense (EV), Refund (RFV)
 */
const Voucher = sequelize.define("Voucher", {
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
  voucherNumber: { type: DataTypes.STRING, allowNull: false },
  voucherType: {
    type: DataTypes.ENUM("RV", "PV", "JV", "CV", "EV", "RFV"),
    allowNull: false,
  },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },

  // Source tracking
  sourceModule: {
    type: DataTypes.ENUM("Payment", "Expense", "Booking", "Refund", "Vendor", "Manual"),
    allowNull: false,
  },
  sourceId: { type: DataTypes.INTEGER, allowNull: true },

  // Optional links
  customerId: { type: DataTypes.INTEGER, allowNull: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: true },

  status: {
    type: DataTypes.ENUM("Draft", "Approved", "Cancelled"),
    defaultValue: "Approved",
  },

  paymentMode: { type: DataTypes.STRING, allowNull: true }, // Cash, UPI, Bank, etc.
  referenceNumber: { type: DataTypes.STRING, allowNull: true }, // Cheque no, txn id, etc.

  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  hooks: {
    beforeValidate: async (voucher, options) => {
      if (!voucher.voucherNumber) {
        const prefix = voucher.voucherType;
        const count = await Voucher.count({
          where: {
            tenantId: voucher.tenantId,
            environmentId: voucher.environmentId,
            voucherType: voucher.voucherType,
          },
          transaction: options.transaction
        });
        voucher.voucherNumber = `${prefix}${String(count + 1).padStart(5, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_voucher_tenant_env" },
    { unique: true, fields: ["voucherNumber", "tenantId", "environmentId"], name: "idx_voucher_number_unique" },
    { fields: ["voucherType"], name: "idx_voucher_type" },
    { fields: ["date"], name: "idx_voucher_date" },
    { fields: ["sourceModule", "sourceId"], name: "idx_voucher_source" },
  ],
});

module.exports = Voucher;
