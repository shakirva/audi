/**
 * Database configuration for Sequelize CLI migrations.
 * Uses the same DATABASE_URL as the main app.
 */
require("dotenv").config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
  },
  test: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
