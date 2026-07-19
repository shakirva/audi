/**
 * Migration: Add audit fields to existing tables.
 * 
 * Adds createdBy, updatedBy, deletedAt to Users, Bookings, and Expenses tables.
 * Also changes User.role from ENUM to VARCHAR(255) for role expansion flexibility.
 * 
 * This is safe to run on existing data — all new columns are nullable.
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ── 1. Change User role from ENUM to VARCHAR ──
      // This allows adding new roles without ALTER TYPE headaches
      await queryInterface.changeColumn("Users", "role", {
        type: Sequelize.STRING,
        defaultValue: "Staff",
        allowNull: false,
      }, { transaction });

      // ── 2. Add audit fields to Users ──
      await queryInterface.addColumn("Users", "createdBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "updatedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "deletedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });

      // ── 3. Add audit fields to Bookings ──
      await queryInterface.addColumn("Bookings", "createdBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Bookings", "updatedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Bookings", "deletedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });

      // ── 4. Add audit fields to Expenses ──
      await queryInterface.addColumn("Expenses", "createdBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Expenses", "updatedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Expenses", "deletedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });

      await transaction.commit();
      console.log("✅ Migration: audit fields added successfully");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove audit fields from Expenses
      await queryInterface.removeColumn("Expenses", "deletedAt", { transaction });
      await queryInterface.removeColumn("Expenses", "updatedBy", { transaction });
      await queryInterface.removeColumn("Expenses", "createdBy", { transaction });

      // Remove audit fields from Bookings
      await queryInterface.removeColumn("Bookings", "deletedAt", { transaction });
      await queryInterface.removeColumn("Bookings", "updatedBy", { transaction });
      await queryInterface.removeColumn("Bookings", "createdBy", { transaction });

      // Remove audit fields from Users
      await queryInterface.removeColumn("Users", "deletedAt", { transaction });
      await queryInterface.removeColumn("Users", "updatedBy", { transaction });
      await queryInterface.removeColumn("Users", "createdBy", { transaction });

      // Revert role column to ENUM (optional — may lose data if new roles were used)
      // Keeping as VARCHAR is safer

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
