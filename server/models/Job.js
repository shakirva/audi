const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Job = sequelize.define("Job", {
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
  jobNumber: { type: DataTypes.STRING, allowNull: false },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Customers", key: "id" },
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Bookings", key: "id" },
  },
  agreementId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Agreements", key: "id" },
  },
  status: {
    type: DataTypes.ENUM("Draft", "Confirmed", "Planning", "Ready", "Event Running", "Completed", "Closed"),
    defaultValue: "Confirmed",
  },
  priority: {
    type: DataTypes.ENUM("Low", "Normal", "High", "Urgent"),
    defaultValue: "Normal",
  },
  eventDate: { type: DataTypes.STRING, allowNull: false },
  hall: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true,
  hooks: {
    beforeCreate: async (job, options) => {
      if (!job.jobNumber) {
        const result = await sequelize.query(
          `SELECT MAX(CAST(SUBSTRING("jobNumber" FROM 4) AS INTEGER)) AS max_num
           FROM "Jobs"
           WHERE "tenantId" = :tenantId AND "environmentId" = :environmentId`,
          {
            replacements: { tenantId: job.tenantId, environmentId: job.environmentId },
            type: sequelize.QueryTypes.SELECT,
            transaction: options?.transaction,
          }
        );
        const nextNum = (result[0]?.max_num || 0) + 1;
        job.jobNumber = `JOB${String(nextNum).padStart(6, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_jobs_tenant_env" },
    { unique: true, fields: ["jobNumber", "tenantId", "environmentId"], name: "idx_jobs_number_tenant_env" },
    { fields: ["bookingId"], name: "idx_jobs_booking" },
    { fields: ["customerId"], name: "idx_jobs_customer" },
    { fields: ["eventDate"], name: "idx_jobs_event_date" },
  ],
});

module.exports = Job;
