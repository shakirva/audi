/**
 * Migration: Create Phase 2 Models (Customer and Masters)
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    const masterFields = {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onDelete: "CASCADE",
      },
      environmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Environments", key: "id" },
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      createdBy: { type: Sequelize.INTEGER, allowNull: true },
      updatedBy: { type: Sequelize.INTEGER, allowNull: true },
    };

    try {
      // ── 1. Create Customers Table ──
      await queryInterface.createTable("Customers", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
        environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
        name: { type: Sequelize.STRING, allowNull: false },
        phone: { type: Sequelize.STRING, allowNull: false },
        altPhone: { type: Sequelize.STRING, allowNull: true },
        email: { type: Sequelize.STRING, allowNull: true },
        address: { type: Sequelize.TEXT, allowNull: true },
        city: { type: Sequelize.STRING, allowNull: true },
        state: { type: Sequelize.STRING, allowNull: true },
        pincode: { type: Sequelize.STRING, allowNull: true },
        customerType: { type: Sequelize.ENUM("Individual", "Corporate"), defaultValue: "Individual" },
        source: { type: Sequelize.STRING, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      await queryInterface.addIndex("Customers", ["tenantId", "environmentId"], { transaction, name: "idx_customers_tenant_env" });
      await queryInterface.addIndex("Customers", ["phone", "tenantId", "environmentId"], { transaction, name: "idx_customers_phone_tenant_env" });

      // ── 2. Add customerId to Bookings ──
      await queryInterface.addColumn("Bookings", "customerId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Customers", key: "id" },
        onDelete: "SET NULL",
      }, { transaction });

      // ── 3. Create Master Tables ──
      await queryInterface.createTable("masters_halls", {
        ...masterFields,
        capacity: { type: Sequelize.INTEGER, defaultValue: 0 },
        price: { type: Sequelize.INTEGER, defaultValue: 0 },
        icon: { type: Sequelize.STRING, allowNull: true },
      }, { transaction });

      await queryInterface.createTable("masters_packages", {
        ...masterFields,
        price: { type: Sequelize.INTEGER, defaultValue: 0 },
        features: { type: Sequelize.JSONB, defaultValue: [] },
      }, { transaction });

      await queryInterface.createTable("masters_services", {
        ...masterFields,
        price: { type: Sequelize.INTEGER, defaultValue: 0 },
        category: { type: Sequelize.STRING, allowNull: true },
      }, { transaction });

      await queryInterface.createTable("masters_event_types", {
        ...masterFields,
        color: { type: Sequelize.STRING, allowNull: true },
      }, { transaction });

      await queryInterface.createTable("masters_lead_sources", { ...masterFields }, { transaction });
      await queryInterface.createTable("masters_payment_modes", { ...masterFields }, { transaction });
      
      await queryInterface.createTable("masters_banks", {
        ...masterFields,
        accountNumber: { type: Sequelize.STRING, allowNull: false },
        ifscCode: { type: Sequelize.STRING, allowNull: true },
        branch: { type: Sequelize.STRING, allowNull: true },
      }, { transaction });

      await queryInterface.createTable("masters_expense_categories", { ...masterFields }, { transaction });

      await transaction.commit();
      console.log("✅ Migration: Phase 2 tables created successfully");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable("masters_expense_categories", { transaction });
      await queryInterface.dropTable("masters_banks", { transaction });
      await queryInterface.dropTable("masters_payment_modes", { transaction });
      await queryInterface.dropTable("masters_lead_sources", { transaction });
      await queryInterface.dropTable("masters_event_types", { transaction });
      await queryInterface.dropTable("masters_services", { transaction });
      await queryInterface.dropTable("masters_packages", { transaction });
      await queryInterface.dropTable("masters_halls", { transaction });

      await queryInterface.removeColumn("Bookings", "customerId", { transaction });
      await queryInterface.dropTable("Customers", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
