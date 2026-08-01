const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Attendance = sequelize.define("Attendance", {
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
  date: { type: DataTypes.DATEONLY, allowNull: false },
  checkIn: { type: DataTypes.STRING, allowNull: true },
  checkOut: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "Present" },
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  indexes: [
    { fields: ["tenantId", "date"], name: "idx_attendance_tenant_date" },
    { fields: ["tenantId", "userId", "date"], unique: true, name: "idx_attendance_tenant_user_date" },
  ],
});

module.exports = Attendance;
