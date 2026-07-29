const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Booking = sequelize.define("Booking", {
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
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Nullable temporarily for backward compatibility with existing data
    references: { model: "Customers", key: "id" },
  },
  enquiryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Enquiries", key: "id" },
  },
  bookingId: { type: DataTypes.STRING },
  customerName: { type: DataTypes.STRING, allowNull: false }, // Used as "Enquired By"
  bookedBy: { type: DataTypes.STRING, allowNull: true },
  bookingParty: { type: DataTypes.STRING, allowNull: true },
  brideName: { type: DataTypes.STRING, allowNull: true },
  brideFatherName: { type: DataTypes.STRING, allowNull: true },
  brideMotherName: { type: DataTypes.STRING, allowNull: true },
  bridePhone: { type: DataTypes.STRING, allowNull: true },
  brideAddress: { type: DataTypes.TEXT, allowNull: true },
  groomName: { type: DataTypes.STRING, allowNull: true },
  groomFatherName: { type: DataTypes.STRING, allowNull: true },
  groomMotherName: { type: DataTypes.STRING, allowNull: true },
  groomPhone: { type: DataTypes.STRING, allowNull: true },
  groomAddress: { type: DataTypes.TEXT, allowNull: true },
  fatherName: { type: DataTypes.STRING, allowNull: true },
  motherName: { type: DataTypes.STRING, allowNull: true },
  additionalContact1: { type: DataTypes.STRING, allowNull: true },
  additionalContact2: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  whatsapp: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  pincode: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  eventType: { type: DataTypes.STRING, allowNull: true },
  hall: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.STRING, allowNull: true },
  session: { type: DataTypes.ENUM("Morning", "Evening", "Full Day"), defaultValue: "Full Day" },
  guests: { type: DataTypes.INTEGER, defaultValue: 0 },
  decoration: { type: DataTypes.STRING, allowNull: true },
  catering: { type: DataTypes.STRING, allowNull: true },
  photography: { type: DataTypes.STRING, allowNull: true },
  sound: { type: DataTypes.STRING, allowNull: true },
  vehicleParking: { type: DataTypes.STRING, allowNull: true },
  specialInstructions: { type: DataTypes.TEXT, allowNull: true },
  videography: { type: DataTypes.STRING, allowNull: true },
  ledWall: { type: DataTypes.STRING, allowNull: true },
  generator: { type: DataTypes.STRING, allowNull: true },
  cleaning: { type: DataTypes.STRING, allowNull: true },
  facilities: { type: DataTypes.JSONB, defaultValue: [] },
  additionalServices: { type: DataTypes.TEXT, allowNull: true },
  package: { type: DataTypes.STRING, allowNull: true },
  discount: { type: DataTypes.INTEGER, defaultValue: 0 },
  taxes: { type: DataTypes.INTEGER, defaultValue: 0 },
  advance: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalAmount: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM("Draft", "Confirmed", "Agreement Pending", "Advance Pending", "Ready For Job", "Completed", "Closed", "Cancelled"), defaultValue: "Draft" },
  invoiceStatus: { type: DataTypes.ENUM("Pending", "Generated"), defaultValue: "Pending" },
  notes: { type: DataTypes.TEXT, defaultValue: "" },
  // ── Audit fields ──
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  paranoid: true, // Enables soft delete via deletedAt column
  hooks: {
    beforeValidate: async (booking) => {
      if (!booking.bookingId) {
        // Fetch Settings for prefix
        const Settings = sequelize.models.Settings;
        let prefix = "BK";
        if (Settings) {
          const settings = await Settings.findOne({ where: { tenantId: booking.tenantId, environmentId: booking.environmentId } });
          if (settings && settings.bookingPrefix) {
            prefix = settings.bookingPrefix;
          }
        }
        
        // Find highest existing bookingId (including soft-deleted) to guarantee uniqueness
        const lastBooking = await Booking.findOne({
          where: { tenantId: booking.tenantId, environmentId: booking.environmentId },
          order: [["id", "DESC"]],
          attributes: ["bookingId"],
          paranoid: false, // include soft-deleted records
        });

        let nextNum = 1;
        if (lastBooking && lastBooking.bookingId) {
          const match = lastBooking.bookingId.match(/\d+$/);
          if (match) nextNum = parseInt(match[0], 10) + 1;
        }

        booking.bookingId = `${prefix}${String(nextNum).padStart(3, "0")}`;
      }
    }
  },
  indexes: [
    { fields: ["tenantId", "environmentId"], name: "idx_bookings_tenant_env" },
    { unique: true, fields: ["bookingId", "tenantId", "environmentId"], name: "idx_bookings_id_tenant_env" },
  ],
});

module.exports = Booking;


