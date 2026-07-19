"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const newFields = {
        videography: { type: Sequelize.STRING, allowNull: true },
        ledWall: { type: Sequelize.STRING, allowNull: true },
        generator: { type: Sequelize.STRING, allowNull: true },
        cleaning: { type: Sequelize.STRING, allowNull: true },
        additionalServices: { type: Sequelize.TEXT, allowNull: true },
        discount: { type: Sequelize.INTEGER, defaultValue: 0 },
        taxes: { type: Sequelize.INTEGER, defaultValue: 0 },
        package: { type: Sequelize.STRING, allowNull: true },
      };

      for (const [columnName, attributes] of Object.entries(newFields)) {
        await queryInterface.addColumn("Bookings", columnName, attributes, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const newFields = [
        "videography", "ledWall", "generator", "cleaning", 
        "additionalServices", "discount", "taxes", "package"
      ];
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
