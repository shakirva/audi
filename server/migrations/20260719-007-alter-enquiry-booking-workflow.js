"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Alter Enquiry: add session and leadScore
      await queryInterface.addColumn("Enquiries", "session", {
        type: Sequelize.ENUM("Morning", "Afternoon", "Evening", "Full Day"),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Enquiries", "leadScore", {
        type: Sequelize.ENUM("Hot", "Warm", "Cold"),
        defaultValue: "Warm",
      }, { transaction });

      // Note: Changing ENUM values in Postgres safely often requires raw SQL or dropping the type.
      // For sqlite/mysql it's easier, but since this might run on postgres we'll do raw SQL if needed,
      // but to be safe and compatible, we'll alter the column type to STRING to avoid ENUM type casting issues.
      await queryInterface.changeColumn("Enquiries", "status", {
        type: Sequelize.STRING,
        defaultValue: "New Enquiry",
      }, { transaction });

      // 2. Alter Booking: add Enquiry reference and deep fields
      await queryInterface.addColumn("Bookings", "enquiryId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Enquiries", key: "id" },
        onDelete: "SET NULL",
      }, { transaction });

      const newFields = {
        brideName: { type: Sequelize.STRING, allowNull: true },
        groomName: { type: Sequelize.STRING, allowNull: true },
        fatherName: { type: Sequelize.STRING, allowNull: true },
        motherName: { type: Sequelize.STRING, allowNull: true },
        additionalContact1: { type: Sequelize.STRING, allowNull: true },
        additionalContact2: { type: Sequelize.STRING, allowNull: true },
        email: { type: Sequelize.STRING, allowNull: true },
        whatsapp: { type: Sequelize.STRING, allowNull: true },
        address: { type: Sequelize.TEXT, allowNull: true },
        pincode: { type: Sequelize.STRING, allowNull: true },
        decoration: { type: Sequelize.STRING, allowNull: true },
        catering: { type: Sequelize.STRING, allowNull: true },
        photography: { type: Sequelize.STRING, allowNull: true },
        sound: { type: Sequelize.STRING, allowNull: true },
        vehicleParking: { type: Sequelize.STRING, allowNull: true },
        specialInstructions: { type: Sequelize.TEXT, allowNull: true },
      };

      for (const [columnName, attributes] of Object.entries(newFields)) {
        await queryInterface.addColumn("Bookings", columnName, attributes, { transaction });
      }

      await queryInterface.changeColumn("Bookings", "status", {
        type: Sequelize.STRING,
        defaultValue: "Pending Payment",
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("Enquiries", "session", { transaction });
      await queryInterface.removeColumn("Enquiries", "leadScore", { transaction });
      
      const newFields = ["enquiryId", "brideName", "groomName", "fatherName", "motherName", "additionalContact1", "additionalContact2", "email", "whatsapp", "address", "pincode", "decoration", "catering", "photography", "sound", "vehicleParking", "specialInstructions"];
      for (const col of newFields) {
        await queryInterface.removeColumn("Bookings", col, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
