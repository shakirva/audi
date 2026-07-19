const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AuditLog = sequelize.define("AuditLog", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  environmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  }
});

module.exports = AuditLog;
