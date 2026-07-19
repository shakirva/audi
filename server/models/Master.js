const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Reusable fields for all master models
const masterFields = {
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
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
};

const masterOptions = (tableName) => ({
  paranoid: true,
  tableName,
  indexes: [{ fields: ["tenantId", "environmentId"] }],
});

const MasterHall = sequelize.define("MasterHall", {
  ...masterFields,
  capacity: { type: DataTypes.INTEGER, defaultValue: 0 },
  price: { type: DataTypes.INTEGER, defaultValue: 0 },
  icon: { type: DataTypes.STRING, allowNull: true },
}, masterOptions("masters_halls"));

const MasterPackage = sequelize.define("MasterPackage", {
  ...masterFields,
  price: { type: DataTypes.INTEGER, defaultValue: 0 },
  features: { type: DataTypes.JSONB, defaultValue: [] },
}, masterOptions("masters_packages"));

const MasterService = sequelize.define("MasterService", {
  ...masterFields,
  price: { type: DataTypes.INTEGER, defaultValue: 0 },
  category: { type: DataTypes.STRING, allowNull: true }, // Food, Decor, etc.
}, masterOptions("masters_services"));

const MasterEventType = sequelize.define("MasterEventType", {
  ...masterFields,
  color: { type: DataTypes.STRING, allowNull: true },
}, masterOptions("masters_event_types"));

const MasterLeadSource = sequelize.define("MasterLeadSource", {
  ...masterFields,
}, masterOptions("masters_lead_sources"));

const MasterPaymentMode = sequelize.define("MasterPaymentMode", {
  ...masterFields,
}, masterOptions("masters_payment_modes"));

const MasterBank = sequelize.define("MasterBank", {
  ...masterFields,
  accountNumber: { type: DataTypes.STRING, allowNull: false },
  ifscCode: { type: DataTypes.STRING, allowNull: true },
  branch: { type: DataTypes.STRING, allowNull: true },
}, masterOptions("masters_banks"));

const MasterExpenseCategory = sequelize.define("MasterExpenseCategory", {
  ...masterFields,
}, masterOptions("masters_expense_categories"));

module.exports = {
  MasterHall,
  MasterPackage,
  MasterService,
  MasterEventType,
  MasterLeadSource,
  MasterPaymentMode,
  MasterBank,
  MasterExpenseCategory,
};
