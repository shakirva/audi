const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const JobTimeline = sequelize.define("JobTimeline", {
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
    allowNull: true, // Who performed the action
    references: { model: "Users", key: "id" },
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false, // "Job Created", "Payment Received", etc.
  },
  relatedResource: {
    type: DataTypes.STRING,
    allowNull: true, // e.g. "Payment#123", "Agreement#AGR001"
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_job_timelines_tenant_env" },
    { fields: ["jobId"], name: "idx_job_timelines_job" },
    { fields: ["createdAt"], name: "idx_job_timelines_created" },
  ],
});

module.exports = JobTimeline;
