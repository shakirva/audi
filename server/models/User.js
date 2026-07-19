const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const bcrypt = require("bcryptjs");
const { ALL_ROLES } = require("../helpers/roles");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Tenants", key: "id" },
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.STRING,
    defaultValue: "Staff",
    validate: {
      isIn: {
        args: [ALL_ROLES],
        msg: `Role must be one of: ${ALL_ROLES.join(", ")}`,
      },
    },
  },
  phone: { type: DataTypes.STRING, defaultValue: "" },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true, // Enables soft delete via deletedAt column
  hooks: {
    beforeSave: async (user) => {
      if (user.changed("password")) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  },
  indexes: [
    { unique: true, fields: ["email", "tenantId"], name: "idx_users_email_tenant" },
    { fields: ["tenantId"], name: "idx_users_tenant" },
  ],
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;

