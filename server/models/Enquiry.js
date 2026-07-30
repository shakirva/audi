const { DataTypes, Op } = require("sequelize");
const sequelize = require("../db");

const Enquiry = sequelize.define("Enquiry", {
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
  enquiryNumber: { type: DataTypes.STRING, allowNull: false },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Customers", key: "id" },
  },
  enquirerName: { type: DataTypes.STRING, allowNull: false },
  enquirerPhone: { type: DataTypes.STRING, allowNull: false },
  enquirerArea: { type: DataTypes.STRING, allowNull: true },
  enquirerAddress: { type: DataTypes.TEXT, allowNull: true },
  eventType: { type: DataTypes.STRING, allowNull: false },
  tentativeDate: { type: DataTypes.STRING, allowNull: true },
  session: { type: DataTypes.ENUM("Morning", "Afternoon", "Evening", "Full Day"), allowNull: true },
  hallPreference: { type: DataTypes.STRING, allowNull: true },
  guestCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  budget: { type: DataTypes.INTEGER, defaultValue: 0 },
  salesExecutiveId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Users", key: "id" },
  },
  status: {
    type: DataTypes.ENUM("New Enquiry", "Contacted", "Follow-up", "Customer Visit", "Quotation Sent", "Interested", "Booking Confirmed", "Cancelled", "Lost"),
    defaultValue: "New Enquiry",
  },
  leadScore: {
    type: DataTypes.ENUM("Hot", "Warm", "Cold"),
    defaultValue: "Warm",
  },
  lostReason: { type: DataTypes.STRING, allowNull: true },
  source: { type: DataTypes.STRING, allowNull: true },
  remarks: { type: DataTypes.TEXT, allowNull: true },

  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true, // Enables soft delete
  hooks: {
    beforeValidate: async (enquiry) => {
      if (!enquiry.enquiryNumber) {
        // Find the highest existing enquiry number (including soft-deleted) to guarantee uniqueness
        const lastEnquiry = await Enquiry.findOne({
          where: { tenantId: enquiry.tenantId, environmentId: enquiry.environmentId },
          order: [["id", "DESC"]],
          attributes: ["enquiryNumber"],
          paranoid: false, // include soft-deleted records
        });

        let nextNum = 1;
        if (lastEnquiry && lastEnquiry.enquiryNumber) {
          const match = lastEnquiry.enquiryNumber.match(/ENQ(\d+)/);
          if (match) nextNum = parseInt(match[1], 10) + 1;
        }

        enquiry.enquiryNumber = `ENQ${String(nextNum).padStart(3, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_enquiries_tenant_env" },
    { unique: true, fields: ["enquiryNumber", "tenantId", "environmentId"], name: "idx_enquiries_number_tenant_env" },
    { fields: ["customerId"], name: "idx_enquiries_customer" },
    { fields: ["salesExecutiveId"], name: "idx_enquiries_sales_exec" },
  ],
});

module.exports = Enquiry;
