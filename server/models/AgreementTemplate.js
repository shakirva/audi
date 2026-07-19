const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AgreementTemplate = sequelize.define("AgreementTemplate", {
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
  name: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false }, // HTML or Markdown format
  variables: { type: DataTypes.JSONB, defaultValue: [] }, // e.g. ["customerName", "eventDate"]
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_agreement_templates_tenant_env" },
  ],
});

module.exports = AgreementTemplate;
