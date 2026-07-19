const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AgreementVersion = sequelize.define("AgreementVersion", {
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
  agreementId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Agreements", key: "id" },
  },
  versionNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  contentSnapshot: { type: DataTypes.TEXT, allowNull: false },
  pdfUrl: { type: DataTypes.STRING, allowNull: true },
  qrCodeUrl: { type: DataTypes.STRING, allowNull: true },
  changeSummary: { type: DataTypes.STRING, allowNull: true },
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_agr_versions_tenant_env" },
    { fields: ["agreementId"], name: "idx_agr_versions_agreement" },
  ],
});

module.exports = AgreementVersion;
