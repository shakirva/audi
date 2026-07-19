const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const JobChecklist = sequelize.define("JobChecklist", {
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
  taskName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Users", key: "id" },
  },
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_job_checklists_tenant_env" },
    { fields: ["jobId"], name: "idx_job_checklists_job" },
  ],
});

module.exports = JobChecklist;
