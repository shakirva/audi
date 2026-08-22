const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const LeaveRequest = sequelize.define("LeaveRequest", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Tenants", key: "id" },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Users", key: "id" },
  },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: "Pending" },
  appliedOn: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  indexes: [
    { fields: ["tenantId", "status"], name: "idx_leaverequest_tenant_status" },
    { fields: ["tenantId", "userId"], name: "idx_leaverequest_tenant_user" },
  ],
});

module.exports = LeaveRequest;
