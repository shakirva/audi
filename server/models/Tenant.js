const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Tenant = sequelize.define("Tenant", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  ownerName: { type: DataTypes.STRING, defaultValue: "" },
  email: { type: DataTypes.STRING, defaultValue: "" },
  phone: { type: DataTypes.STRING, defaultValue: "" },
  status: {
    type: DataTypes.ENUM("active", "suspended"),
    defaultValue: "active",
  },
  sandboxEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  allowEnvironmentSwitch: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Tenant;
