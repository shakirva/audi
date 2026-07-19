/**
 * Migration: Create Phase 4 Agreement & Receipt Engine Tables
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ── 1. Create AgreementTemplates Table ──
      await queryInterface.createTable("AgreementTemplates", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
        environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
        name: { type: Sequelize.STRING, allowNull: false },
        content: { type: Sequelize.TEXT, allowNull: false },
        variables: { type: Sequelize.JSONB, defaultValue: [] },
        isDefault: { type: Sequelize.BOOLEAN, defaultValue: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // ── 2. Create Agreements Table ──
      await queryInterface.createTable("Agreements", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
        environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
        agreementNumber: { type: Sequelize.STRING, allowNull: false },
        bookingId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Bookings", key: "id" }, onDelete: "CASCADE" },
        templateId: { type: Sequelize.INTEGER, allowNull: true, references: { model: "AgreementTemplates", key: "id" }, onDelete: "SET NULL" },
        status: { type: Sequelize.ENUM("Draft", "Sent", "Signed", "Cancelled"), defaultValue: "Draft" },
        totalAmount: { type: Sequelize.INTEGER, defaultValue: 0 },
        advanceAmount: { type: Sequelize.INTEGER, defaultValue: 0 },
        balanceAmount: { type: Sequelize.INTEGER, defaultValue: 0 },
        termsAndConditions: { type: Sequelize.TEXT, allowNull: true },
        digitalSignatureUrl: { type: Sequelize.STRING, allowNull: true },
        signedAt: { type: Sequelize.DATE, allowNull: true },
        signedByIp: { type: Sequelize.STRING, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // ── 3. Create AgreementVersions Table ──
      await queryInterface.createTable("AgreementVersions", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
        environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
        agreementId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Agreements", key: "id" }, onDelete: "CASCADE" },
        versionNumber: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        contentSnapshot: { type: Sequelize.TEXT, allowNull: false },
        pdfUrl: { type: Sequelize.STRING, allowNull: true },
        qrCodeUrl: { type: Sequelize.STRING, allowNull: true },
        changeSummary: { type: Sequelize.STRING, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // ── 4. Create Payments Table ──
      await queryInterface.createTable("Payments", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
        environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
        paymentNumber: { type: Sequelize.STRING, allowNull: false },
        bookingId: { type: Sequelize.INTEGER, allowNull: true, references: { model: "Bookings", key: "id" }, onDelete: "CASCADE" },
        customerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Customers", key: "id" }, onDelete: "CASCADE" },
        amount: { type: Sequelize.INTEGER, allowNull: false },
        paymentMode: { type: Sequelize.ENUM("Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Other"), allowNull: false },
        referenceNumber: { type: Sequelize.STRING, allowNull: true },
        paymentDate: { type: Sequelize.STRING, allowNull: false },
        status: { type: Sequelize.ENUM("Pending", "Completed", "Failed", "Refunded"), defaultValue: "Completed" },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // ── 5. Create Receipts Table ──
      await queryInterface.createTable("Receipts", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
        environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
        receiptNumber: { type: Sequelize.STRING, allowNull: false },
        paymentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Payments", key: "id" }, onDelete: "CASCADE" },
        bookingId: { type: Sequelize.INTEGER, allowNull: true, references: { model: "Bookings", key: "id" }, onDelete: "CASCADE" },
        customerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Customers", key: "id" }, onDelete: "CASCADE" },
        receiptDate: { type: Sequelize.STRING, allowNull: false },
        amount: { type: Sequelize.INTEGER, allowNull: false },
        pdfUrl: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.ENUM("Generated", "Sent", "Cancelled"), defaultValue: "Generated" },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // Create indexes for all tables
      await queryInterface.addIndex("AgreementTemplates", ["tenantId", "environmentId"], { transaction });
      await queryInterface.addIndex("Agreements", ["tenantId", "environmentId"], { transaction });
      await queryInterface.addIndex("Agreements", ["agreementNumber", "tenantId", "environmentId"], { transaction, unique: true });
      await queryInterface.addIndex("AgreementVersions", ["tenantId", "environmentId"], { transaction });
      await queryInterface.addIndex("Payments", ["tenantId", "environmentId"], { transaction });
      await queryInterface.addIndex("Payments", ["paymentNumber", "tenantId", "environmentId"], { transaction, unique: true });
      await queryInterface.addIndex("Receipts", ["tenantId", "environmentId"], { transaction });
      await queryInterface.addIndex("Receipts", ["receiptNumber", "tenantId", "environmentId"], { transaction, unique: true });

      await transaction.commit();
      console.log("✅ Migration: Phase 4 Agreement & Receipt tables created successfully");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("Receipts", { transaction });
      await queryInterface.dropTable("Payments", { transaction });
      await queryInterface.dropTable("AgreementVersions", { transaction });
      await queryInterface.dropTable("Agreements", { transaction });
      await queryInterface.dropTable("AgreementTemplates", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
