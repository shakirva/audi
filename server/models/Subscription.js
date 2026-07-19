const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Subscription = sequelize.define("Subscription", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Tenants", key: "id" },
  },
  plan: {
    type: DataTypes.ENUM("trial", "basic", "premium", "enterprise"),
    defaultValue: "trial",
  },
  status: {
    type: DataTypes.ENUM("active", "expired", "cancelled"),
    defaultValue: "active",
  },
  trialStartDate: { type: DataTypes.DATEONLY, allowNull: true },
  trialEndDate: { type: DataTypes.DATEONLY, allowNull: true },
  subscriptionStartDate: { type: DataTypes.DATEONLY, allowNull: true },
  subscriptionEndDate: { type: DataTypes.DATEONLY, allowNull: true },
  managedBy: { type: DataTypes.STRING, defaultValue: "manual" },
  notes: { type: DataTypes.TEXT, defaultValue: "" },
});

module.exports = Subscription;
