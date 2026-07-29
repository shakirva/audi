const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Receipt = sequelize.define("Receipt", {
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
  receiptNumber: { type: DataTypes.STRING, allowNull: false },
  paymentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Payments", key: "id" },
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Bookings", key: "id" },
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Customers", key: "id" },
  },
  receiptDate: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  pdfUrl: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM("Generated", "Sent", "Cancelled"),
    defaultValue: "Generated",
  },
  
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  hooks: {
    beforeValidate: async (receipt, options) => {
      if (!receipt.receiptNumber) {
        const count = await Receipt.count({
          where: { tenantId: receipt.tenantId, environmentId: receipt.environmentId },
          transaction: options.transaction
        });
        receipt.receiptNumber = `RCP${String(count + 1).padStart(5, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_receipts_tenant_env" },
    { unique: true, fields: ["receiptNumber", "tenantId", "environmentId"], name: "idx_receipts_number_tenant_env" },
    { fields: ["paymentId"], name: "idx_receipts_payment" },
    { fields: ["bookingId"], name: "idx_receipts_booking" },
  ],
});

module.exports = Receipt;
