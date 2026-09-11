const { DataTypes, Op } = require("sequelize");
const sequelize = require("../db");

const VendorBill = sequelize.define("VendorBill", {
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
  billNumber: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  description: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM("Unpaid", "Partial", "Paid", "Cancelled"),
    defaultValue: "Unpaid",
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Bookings", key: "id" },
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  hooks: {
    beforeValidate: async (bill, options) => {
      if (!bill.billNumber) {
        const lastBill = await VendorBill.findOne({
          where: { tenantId: bill.tenantId, environmentId: bill.environmentId },
          order: [["id", "DESC"]],
          attributes: ["billNumber"],
          paranoid: false,
          transaction: options.transaction,
        });
        let nextNum = 1;
        if (lastBill && lastBill.billNumber) {
          const match = lastBill.billNumber.match(/VB(\d+)/);
          if (match) nextNum = parseInt(match[1], 10) + 1;
        }
        bill.billNumber = `VB${String(nextNum).padStart(3, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_vendor_bills_tenant_env" },
    { fields: ["vendorId"], name: "idx_vendor_bills_vendor" },
    { unique: true, fields: ["billNumber", "tenantId", "environmentId"], name: "idx_vendor_bills_number_unique" },
  ],
});

module.exports = VendorBill;
