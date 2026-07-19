/**
 * Migration: Create Phase 5 Job Management Tables
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    const baseFields = {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenantId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Tenants", key: "id" }, onDelete: "CASCADE" },
      environmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Environments", key: "id" }, onDelete: "CASCADE" },
    };

    try {
      // ── 1. Create Jobs Table ──
      await queryInterface.createTable("Jobs", {
        ...baseFields,
        jobNumber: { type: Sequelize.STRING, allowNull: false },
        customerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Customers", key: "id" }, onDelete: "CASCADE" },
        bookingId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Bookings", key: "id" }, onDelete: "CASCADE" },
        agreementId: { type: Sequelize.INTEGER, allowNull: true, references: { model: "Agreements", key: "id" }, onDelete: "SET NULL" },
        status: { type: Sequelize.ENUM("Draft", "Confirmed", "Planning", "Ready", "Event Running", "Completed", "Closed"), defaultValue: "Confirmed" },
        priority: { type: Sequelize.ENUM("Low", "Normal", "High", "Urgent"), defaultValue: "Normal" },
        eventDate: { type: Sequelize.STRING, allowNull: false },
        hall: { type: Sequelize.STRING, allowNull: false },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // ── 2. Create JobStaff Table ──
      await queryInterface.createTable("JobStaffs", {
        ...baseFields,
        jobId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Jobs", key: "id" }, onDelete: "CASCADE" },
        userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Users", key: "id" }, onDelete: "CASCADE" },
        role: { type: Sequelize.STRING, allowNull: false },
        status: { type: Sequelize.ENUM("Pending", "In Progress", "Completed"), defaultValue: "Pending" },
        assignedBy: { type: Sequelize.INTEGER, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // ── 3. Create JobVendors Table ──
      await queryInterface.createTable("JobVendors", {
        ...baseFields,
        jobId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Jobs", key: "id" }, onDelete: "CASCADE" },
        vendorId: { type: Sequelize.INTEGER, allowNull: true },
        category: { type: Sequelize.STRING, allowNull: false },
        vendorName: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.ENUM("Assigned", "Confirmed", "Completed"), defaultValue: "Assigned" },
        cost: { type: Sequelize.INTEGER, defaultValue: 0 },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // ── 4. Create JobTimelines Table ──
      await queryInterface.createTable("JobTimelines", {
        ...baseFields,
        jobId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Jobs", key: "id" }, onDelete: "CASCADE" },
        userId: { type: Sequelize.INTEGER, allowNull: true, references: { model: "Users", key: "id" }, onDelete: "SET NULL" },
        action: { type: Sequelize.STRING, allowNull: false },
        relatedResource: { type: Sequelize.STRING, allowNull: true },
        details: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // ── 5. Create JobChecklists Table ──
      await queryInterface.createTable("JobChecklists", {
        ...baseFields,
        jobId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Jobs", key: "id" }, onDelete: "CASCADE" },
        taskName: { type: Sequelize.STRING, allowNull: false },
        isCompleted: { type: Sequelize.BOOLEAN, defaultValue: false },
        completedAt: { type: Sequelize.DATE, allowNull: true },
        completedBy: { type: Sequelize.INTEGER, allowNull: true, references: { model: "Users", key: "id" }, onDelete: "SET NULL" },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        createdBy: { type: Sequelize.INTEGER, allowNull: true },
        updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      }, { transaction });

      // ── 6. Create JobDocuments Table ──
      await queryInterface.createTable("JobDocuments", {
        ...baseFields,
        jobId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Jobs", key: "id" }, onDelete: "CASCADE" },
        documentName: { type: Sequelize.STRING, allowNull: false },
        fileUrl: { type: Sequelize.STRING, allowNull: false },
        documentType: { type: Sequelize.STRING, allowNull: true },
        uploadedBy: { type: Sequelize.INTEGER, allowNull: true, references: { model: "Users", key: "id" }, onDelete: "SET NULL" },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // Indexes
      await queryInterface.addIndex("Jobs", ["tenantId", "environmentId"], { transaction });
      await queryInterface.addIndex("Jobs", ["jobNumber", "tenantId", "environmentId"], { transaction, unique: true });
      await queryInterface.addIndex("JobStaffs", ["jobId"], { transaction });
      await queryInterface.addIndex("JobVendors", ["jobId"], { transaction });
      await queryInterface.addIndex("JobTimelines", ["jobId"], { transaction });
      await queryInterface.addIndex("JobChecklists", ["jobId"], { transaction });
      await queryInterface.addIndex("JobDocuments", ["jobId"], { transaction });

      await transaction.commit();
      console.log("✅ Migration: Phase 5 Job Management tables created successfully");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("JobDocuments", { transaction });
      await queryInterface.dropTable("JobChecklists", { transaction });
      await queryInterface.dropTable("JobTimelines", { transaction });
      await queryInterface.dropTable("JobVendors", { transaction });
      await queryInterface.dropTable("JobStaffs", { transaction });
      await queryInterface.dropTable("Jobs", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
