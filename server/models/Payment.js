const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Payment = sequelize.define("Payment", {
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
  paymentNumber: { type: DataTypes.STRING, allowNull: false },
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
  amount: { type: DataTypes.INTEGER, allowNull: false },
  paymentMode: {
    type: DataTypes.ENUM("Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Other"),
    allowNull: false,
  },
  referenceNumber: { type: DataTypes.STRING, allowNull: true }, // Transaction ID, Cheque number
  paymentDate: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM("Pending", "Completed", "Failed", "Refunded"),
    defaultValue: "Completed",
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
  
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  hooks: {
    beforeValidate: async (payment, options) => {
      if (!payment.paymentNumber) {
        // Fetch Settings for receipt prefix
        const Settings = sequelize.models.Settings;
        let prefix = "PAY";
        if (Settings) {
          const settings = await Settings.findOne({ 
            where: { tenantId: payment.tenantId, environmentId: payment.environmentId },
            transaction: options.transaction
          });
          if (settings && settings.receiptPrefix) {
            prefix = settings.receiptPrefix;
          }
        }

        // Find highest existing paymentNumber (including soft-deleted) to guarantee uniqueness
        const lastPayment = await sequelize.models.Payment.findOne({
          where: { tenantId: payment.tenantId, environmentId: payment.environmentId },
          order: [["id", "DESC"]],
          attributes: ["paymentNumber"],
          paranoid: false, // include soft-deleted records
          transaction: options.transaction
        });

        let nextNum = 1;
        if (lastPayment && lastPayment.paymentNumber) {
          let idPart = lastPayment.paymentNumber;
          if (idPart.startsWith(prefix)) {
            idPart = idPart.substring(prefix.length);
          }
          const match = idPart.match(/\d+$/);
          if (match) nextNum = parseInt(match[0], 10) + 1;
        }

        payment.paymentNumber = `${prefix}${String(nextNum).padStart(5, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_payments_tenant_env" },
    { unique: true, fields: ["paymentNumber", "tenantId", "environmentId"], name: "idx_payments_number_tenant_env" },
    { fields: ["bookingId"], name: "idx_payments_booking" },
    { fields: ["customerId"], name: "idx_payments_customer" },
  ],
});

module.exports = Payment;
