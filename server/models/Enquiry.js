const { DataTypes } = require("sequelize");
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
    allowNull: false,
    references: { model: "Customers", key: "id" },
  },
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
        // Scope enquiry number generation to tenant + environment
        const count = await Enquiry.count({
          where: { tenantId: enquiry.tenantId, environmentId: enquiry.environmentId },
        });
        enquiry.enquiryNumber = `ENQ${String(count + 1).padStart(3, "0")}`;
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
