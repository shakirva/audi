const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Inventory = sequelize.define("Inventory", {
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
  itemName: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: true },
  totalQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  availableQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  condition: { type: DataTypes.STRING, defaultValue: "Good" }, // Good, Needs Repair, Damaged
  notes: { type: DataTypes.TEXT, allowNull: true },
  unitPrice: { type: DataTypes.FLOAT, allowNull: true },
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  indexes: [
    { fields: ["tenantId", "environmentId"] },
  ],
});

module.exports = Inventory;
