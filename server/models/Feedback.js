const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Feedback = sequelize.define("Feedback", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
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
  userName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("New", "Reviewed", "Resolved"),
    defaultValue: "New",
  }
}, {
  timestamps: true,
});

module.exports = Feedback;
