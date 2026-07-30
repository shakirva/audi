const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Agreement = sequelize.define("Agreement", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Tenants", key: "id" },
  },
  environmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Environments", key: "id" },
  },
  agreementNumber: { type: DataTypes.STRING, allowNull: false },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Bookings", key: "id" },
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("Draft", "Sent", "Signed", "Cancelled"),
    defaultValue: "Draft",
  },
  totalAmount: { type: DataTypes.INTEGER, defaultValue: 0 },
  advanceAmount: { type: DataTypes.INTEGER, defaultValue: 0 },
  balanceAmount: { type: DataTypes.INTEGER, defaultValue: 0 },
  termsAndConditions: { type: DataTypes.TEXT, allowNull: true },
  digitalSignatureUrl: { type: DataTypes.STRING, allowNull: true },
  signedAt: { type: DataTypes.DATE, allowNull: true },
  signedByIp: { type: DataTypes.STRING, allowNull: true },
  
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true, // Soft delete
  hooks: {
    beforeCreate: async (agreement, options) => {
      if (!agreement.agreementNumber) {
        const result = await sequelize.query(
          `SELECT MAX(CAST(SUBSTRING("agreementNumber" FROM 4) AS INTEGER)) AS max_num
           FROM "Agreements"
           WHERE "tenantId" = :tenantId AND "environmentId" = :environmentId
             AND "agreementNumber" ~ '^AGR[0-9]+$'`,
          {
            replacements: { tenantId: agreement.tenantId, environmentId: agreement.environmentId },
            type: sequelize.QueryTypes.SELECT,
            transaction: options?.transaction,
          }
        );
        const nextNum = (result[0]?.max_num || 0) + 1;
        agreement.agreementNumber = `AGR${String(nextNum).padStart(4, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_agreements_tenant_env" },
    { unique: true, fields: ["agreementNumber", "tenantId", "environmentId"], name: "idx_agreements_number_tenant_env" },
    { fields: ["bookingId"], name: "idx_agreements_booking" },
  ],
});

module.exports = Agreement;
