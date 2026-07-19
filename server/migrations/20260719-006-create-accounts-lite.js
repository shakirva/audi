/**
 * Migration: Create Phase 6 Accounts Lite Tables
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    const baseFields = {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
      environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
      date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      description: { type: Sequelize.STRING, allowNull: false },
      transactionType: { type: Sequelize.STRING, allowNull: false },
      referenceId: { type: Sequelize.INTEGER, allowNull: true },
      referenceType: { type: Sequelize.STRING, allowNull: true },
      createdBy: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    };

    try {
      // 1. AccountStatements Table
      await queryInterface.createTable("AccountStatements", {
        ...baseFields,
        customerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Customers", key: "id" }, onDelete: "CASCADE" },
        debit: { type: Sequelize.INTEGER, defaultValue: 0 },
        credit: { type: Sequelize.INTEGER, defaultValue: 0 },
        balance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      }, { transaction });

      // 2. CashBooks Table
      await queryInterface.createTable("CashBooks", {
        ...baseFields,
        cashIn: { type: Sequelize.INTEGER, defaultValue: 0 },
        cashOut: { type: Sequelize.INTEGER, defaultValue: 0 },
        balance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      }, { transaction });

      // 3. BankBooks Table
      await queryInterface.createTable("BankBooks", {
        ...baseFields,
        masterBankId: { type: Sequelize.INTEGER, allowNull: true }, // Refers to masters_banks eventually
        bankIn: { type: Sequelize.INTEGER, defaultValue: 0 },
        bankOut: { type: Sequelize.INTEGER, defaultValue: 0 },
        balance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      }, { transaction });

      // Indexes
      await queryInterface.addIndex("AccountStatements", ["tenantId", "environmentId"], { transaction });
      await queryInterface.addIndex("AccountStatements", ["customerId"], { transaction });
      await queryInterface.addIndex("CashBooks", ["tenantId", "environmentId"], { transaction });
      await queryInterface.addIndex("BankBooks", ["tenantId", "environmentId"], { transaction });

      await transaction.commit();
      console.log("✅ Migration: Phase 6 Accounts Lite tables created successfully");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("BankBooks", { transaction });
      await queryInterface.dropTable("CashBooks", { transaction });
      await queryInterface.dropTable("AccountStatements", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
