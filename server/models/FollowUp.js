const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const FollowUp = sequelize.define("FollowUp", {
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
  enquiryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Enquiries", key: "id" },
  },
  type: {
    type: DataTypes.ENUM("Call", "Visit", "WhatsApp", "Email", "Meeting"),
    allowNull: false,
    defaultValue: "Call"
  },
  notes: { type: DataTypes.TEXT, allowNull: false },
  nextFollowUpDate: { type: DataTypes.STRING, allowNull: true },
  outcome: {
    type: DataTypes.ENUM("Interested", "Not Interested", "Callback", "Converted", "No Answer"),
    allowNull: true,
  },
  
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true, // Enables soft delete
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_follow_ups_tenant_env" },
    { fields: ["enquiryId"], name: "idx_follow_ups_enquiry" },
  ],
});

module.exports = FollowUp;
