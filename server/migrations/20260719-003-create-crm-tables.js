/**
 * Migration: Create Phase 3 CRM Models (Enquiries and FollowUps)
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ── 1. Create Enquiries Table ──
      await queryInterface.createTable("Enquiries", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
        environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
        enquiryNumber: { type: Sequelize.STRING, allowNull: false },
        customerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Customers", key: "id" }, onDelete: "CASCADE" },
        eventType: { type: Sequelize.STRING, allowNull: false },
        tentativeDate: { type: Sequelize.STRING, allowNull: true },
        hallPreference: { type: Sequelize.STRING, allowNull: true },
        guestCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        budget: { type: Sequelize.INTEGER, defaultValue: 0 },
        salesExecutiveId: { type: Sequelize.INTEGER, allowNull: true, references: { model: "Users", key: "id" }, onDelete: "SET NULL" },
        status: { type: Sequelize.ENUM("New", "Contacted", "Visited", "Quoted", "Won", "Lost"), defaultValue: "New" },
        lostReason: { type: Sequelize.STRING, allowNull: true },
        source: { type: Sequelize.STRING, allowNull: true },
        remarks: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      await queryInterface.addIndex("Enquiries", ["tenantId", "environmentId"], { transaction, name: "idx_enquiries_tenant_env" });
      await queryInterface.addIndex("Enquiries", ["enquiryNumber", "tenantId", "environmentId"], { transaction, unique: true, name: "idx_enquiries_number_tenant_env" });
      await queryInterface.addIndex("Enquiries", ["customerId"], { transaction, name: "idx_enquiries_customer" });
      await queryInterface.addIndex("Enquiries", ["salesExecutiveId"], { transaction, name: "idx_enquiries_sales_exec" });

      // ── 2. Create FollowUps Table ──
      await queryInterface.createTable("FollowUps", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
        environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
        enquiryId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Enquiries", key: "id" }, onDelete: "CASCADE" },
        type: { type: Sequelize.ENUM("Call", "Visit", "WhatsApp", "Email", "Meeting"), allowNull: false, defaultValue: "Call" },
        notes: { type: Sequelize.TEXT, allowNull: false },
        nextFollowUpDate: { type: Sequelize.STRING, allowNull: true },
        outcome: { type: Sequelize.ENUM("Interested", "Not Interested", "Callback", "Converted", "No Answer"), allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      await queryInterface.addIndex("FollowUps", ["tenantId", "environmentId"], { transaction, name: "idx_follow_ups_tenant_env" });
      await queryInterface.addIndex("FollowUps", ["enquiryId"], { transaction, name: "idx_follow_ups_enquiry" });

      await transaction.commit();
      console.log("✅ Migration: Phase 3 CRM tables created successfully");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable("FollowUps", { transaction });
      await queryInterface.dropTable("Enquiries", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
