const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ComplianceDocument = sequelize.define("ComplianceDocument", {
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
  documentType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "e.g. Water Testing, Fire License, GST Registration",
  },
  documentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  documentNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Registration/licence number",
  },
  issuingAuthority: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: "Date-only, no timezone issues",
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: "Date-only, no timezone issues. NULL if hasExpiry=false",
  },
  hasExpiry: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  reminderDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 90,
    comment: "Number of days before expiry to start showing warnings",
  },
  responsibleUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Users", key: "id" },
    comment: "Staff member responsible for renewal",
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Relative path to uploaded file",
  },
  attachmentName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Original filename of the uploaded document",
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_compliance_docs_tenant_env" },
    { fields: ["expiryDate"], name: "idx_compliance_docs_expiry" },
    { fields: ["documentType"], name: "idx_compliance_docs_type" },
  ],
});

module.exports = ComplianceDocument;
