const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const JobStaff = sequelize.define("JobStaff", {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Users", key: "id" },
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false, // "Sales Executive", "Reception", "Operations", etc.
  },
  status: {
    type: DataTypes.ENUM("Pending", "In Progress", "Completed"),
    defaultValue: "Pending",
  },
  assignedBy: { type: DataTypes.INTEGER, allowNull: true },
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_job_staff_tenant_env" },
    { fields: ["jobId"], name: "idx_job_staff_job" },
    { fields: ["userId"], name: "idx_job_staff_user" },
  ],
});

module.exports = JobStaff;
