const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const JobVendor = sequelize.define("JobVendor", {
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
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Jobs", key: "id" },
  },
  // vendorId is nullable for now until Phase 7 Vendor Management is built
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false, // "Decoration", "Catering", "Photography", etc.
  },
  vendorName: { 
    type: DataTypes.STRING,
    allowNull: true, // Used if Vendor model is not yet linked
  },
  status: {
    type: DataTypes.ENUM("Assigned", "Confirmed", "Completed"),
    defaultValue: "Assigned",
  },
  cost: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true },
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_job_vendors_tenant_env" },
    { fields: ["jobId"], name: "idx_job_vendors_job" },
  ],
});

module.exports = JobVendor;
