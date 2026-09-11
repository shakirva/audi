const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const VendorPayment = sequelize.define("VendorPayment", {
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
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Vendors", key: "id" },
  },
  vendorBillId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "VendorBills", key: "id" },
  },
  paymentNumber: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  paymentMode: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["Cash", "UPI", "Bank Transfer", "Cheque"]],
    },
  },
  referenceNumber: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM("Completed", "Cancelled"),
    defaultValue: "Completed",
  },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  hooks: {
    beforeValidate: async (payment, options) => {
      if (!payment.paymentNumber) {
        const lastPayment = await VendorPayment.findOne({
          where: { tenantId: payment.tenantId, environmentId: payment.environmentId },
          order: [["id", "DESC"]],
          attributes: ["paymentNumber"],
          paranoid: false,
          transaction: options.transaction,
        });
        let nextNum = 1;
        if (lastPayment && lastPayment.paymentNumber) {
          const match = lastPayment.paymentNumber.match(/VP(\d+)/);
          if (match) nextNum = parseInt(match[1], 10) + 1;
        }
        payment.paymentNumber = `VP${String(nextNum).padStart(3, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_vendor_payments_tenant_env" },
    { fields: ["vendorId"], name: "idx_vendor_payments_vendor" },
    { fields: ["vendorBillId"], name: "idx_vendor_payments_bill" },
    { unique: true, fields: ["paymentNumber", "tenantId", "environmentId"], name: "idx_vendor_payments_number_unique" },
  ],
});

module.exports = VendorPayment;
