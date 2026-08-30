const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const DemoRequest = sequelize.define("DemoRequest", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  venueName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("New", "Contacted", "Approved", "Rejected"),
    defaultValue: "New",
  }
}, {
  timestamps: true,
});

module.exports = DemoRequest;
