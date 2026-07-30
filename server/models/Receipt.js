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
        const result = await sequelize.query(
          `SELECT MAX(CAST(SUBSTRING("receiptNumber" FROM 4) AS INTEGER)) AS max_num
           FROM "Receipts"
           WHERE "tenantId" = :tenantId AND "environmentId" = :environmentId`,
          {
            replacements: { tenantId: receipt.tenantId, environmentId: receipt.environmentId },
            type: sequelize.QueryTypes.SELECT,
            transaction: options.transaction,
          }
        );
        const nextNum = (result[0]?.max_num || 0) + 1;
        receipt.receiptNumber = `RCP${String(nextNum).padStart(5, "0")}`;
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
