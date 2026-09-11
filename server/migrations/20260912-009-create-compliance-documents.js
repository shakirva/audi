/**
 * Migration: Create ComplianceDocuments table
 * 
 * Stores venue compliance documents (licences, registrations, certificates)
 * with expiry tracking and reminder support.
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable("ComplianceDocuments", {
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
        documentType: { type: Sequelize.STRING, allowNull: false },
        documentName: { type: Sequelize.STRING, allowNull: false },
        documentNumber: { type: Sequelize.STRING, allowNull: true },
        issuingAuthority: { type: Sequelize.STRING, allowNull: true },
        issueDate: { type: Sequelize.DATEONLY, allowNull: true },
        expiryDate: { type: Sequelize.DATEONLY, allowNull: true },
        hasExpiry: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        reminderDays: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 90 },
        responsibleUserId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "Users", key: "id" },
          onDelete: "SET NULL",
        },
        attachmentUrl: { type: Sequelize.STRING, allowNull: true },
        attachmentName: { type: Sequelize.STRING, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
      }, { transaction });

      await queryInterface.addIndex("ComplianceDocuments", ["tenantId", "environmentId"], {
        transaction, name: "idx_compliance_docs_tenant_env",
      });
      await queryInterface.addIndex("ComplianceDocuments", ["expiryDate"], {
        transaction, name: "idx_compliance_docs_expiry",
      });
      await queryInterface.addIndex("ComplianceDocuments", ["documentType"], {
        transaction, name: "idx_compliance_docs_type",
      });

      await transaction.commit();
      console.log("✅ Migration: ComplianceDocuments table created successfully");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ComplianceDocuments");
  },
};
