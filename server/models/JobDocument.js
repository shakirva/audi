const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const JobDocument = sequelize.define("JobDocument", {
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
  documentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  documentType: {
    type: DataTypes.STRING,
    allowNull: true, // "PDF", "Image", "Excel", etc.
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Users", key: "id" },
  },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_job_docs_tenant_env" },
    { fields: ["jobId"], name: "idx_job_docs_job" },
  ],
});

module.exports = JobDocument;
