const settingsRepository = require("../repositories/settings.repository");
const bookingRepository = require("../repositories/booking.repository");
const expenseRepository = require("../repositories/expense.repository");
const { Tenant, Environment, User, Booking, Expense } = require("../models");
const { NotFoundError, BadRequestError } = require("../helpers/errors");
const { ROLES } = require("../helpers/roles");

class SettingsService {
  async getPublicSettings(slug) {
    const tenant = await Tenant.findOne({ where: { slug, status: 'active' } });
    if (!tenant) throw new NotFoundError("Tenant");

    const env = await Environment.findOne({ where: { tenantId: tenant.id, type: 'production' } });
    if (!env) throw new NotFoundError("Production environment");

    const settings = await settingsRepository.findOrCreateSettings(tenant.id, env.id);
    
    return {
      name: settings.venueName,
      location: settings.location,
      phone: settings.phone,
      halls: settings.halls || [],
      blackoutDates: settings.blackoutDates || [],
      gallery: settings.gallery || [],
      eventTypes: settings.eventTypes || ["Wedding", "Reception", "Engagement", "Birthday", "Conference", "Anniversary", "Baptism", "Other"],
      sessions: settings.sessions || [{ name: "Morning", time: "09:00 AM - 02:00 PM" }, { name: "Evening", time: "04:00 PM - 10:00 PM" }, { name: "Full Day", time: "09:00 AM - 10:00 PM" }]
    };
  }

  async getSettings(tenantId, environmentId, environmentType) {
    const settings = await settingsRepository.findOrCreateSettings(tenantId, environmentId);
    
    // If sandbox environment, inherit branding fields from production when not set locally
    if (environmentType === "sandbox") {
      const { Environment } = require("../models");
      const prodEnv = await Environment.findOne({ where: { tenantId, type: "production" } });
      if (prodEnv && prodEnv.id !== environmentId) {
        const prodSettings = await settingsRepository.findOrCreateSettings(tenantId, prodEnv.id);
        
        // Branding fields to inherit from production if empty in sandbox
        const brandingFields = [
          "logoUrl", "venueName", "ownerName", "location", "phone", "email",
          "gstin", "legalName", "bankName", "accountName", "accountNumber", "ifscCode",
          "bookingPrefix", "receiptPrefix"
        ];
        
        brandingFields.forEach(field => {
          if (!settings[field] && prodSettings[field]) {
            settings.dataValues[field] = prodSettings[field];
          }
        });
        
        // Also inherit halls and sessions if sandbox has defaults/empty
        if ((!settings.halls || settings.halls.length === 0) && prodSettings.halls && prodSettings.halls.length > 0) {
          settings.dataValues.halls = prodSettings.halls;
        }
        if ((!settings.sessions || settings.sessions.length <= 3) && prodSettings.sessions && prodSettings.sessions.length > 0) {
          settings.dataValues.sessions = prodSettings.sessions;
        }
        if ((!settings.eventTypes || settings.eventTypes.length <= 8) && prodSettings.eventTypes && prodSettings.eventTypes.length > 0) {
          settings.dataValues.eventTypes = prodSettings.eventTypes;
        }
      }
    }
    
    return settings;
  }

  async updateSettings(data, { tenantId, environmentId }) {
    const settings = await settingsRepository.findOrCreateSettings(tenantId, environmentId);
    
    const allowed = [
      "venueName", "ownerName", "location", "phone", "email", "gstin",
      "halls", "blackoutDates", "notifications", "managerRevenueEnabled",
      "gallery", "eventTypes", "sessions", "expenseCategories", "places",
      "bookingPrefix", "receiptPrefix", "logoUrl", "legalName", "bankName", "accountName", 
      "accountNumber", "ifscCode", "allowPastDateBooking"
    ];
    
    const updateData = {};
    allowed.forEach(key => {
      if (data[key] !== undefined) updateData[key] = data[key];
    });
    
    return settingsRepository.update(settings, updateData);
  }

  async getCustomers({ tenantId, environmentId }) {
    const bookings = await bookingRepository.findAllUnpaginated({ tenantId, environmentId });

    const customerMap = {};
    bookings.forEach(b => {
      if (!customerMap[b.phone]) {
        customerMap[b.phone] = {
          name: b.customerName,
          phone: b.phone,
          bookings: [],
          totalSpent: 0,
        };
      }
      customerMap[b.phone].bookings.push({
        id: b.bookingId,
        eventType: b.eventType,
        date: b.date,
        hall: b.hall,
        totalAmount: b.totalAmount,
        status: b.status,
      });
      if (b.status === "Confirmed" || b.status === "Completed") {
        customerMap[b.phone].totalSpent += b.totalAmount;
      }
    });

    return Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  async resetSandbox({ tenantId, environmentId, environmentType }) {
    if (environmentType !== "sandbox") {
      throw new BadRequestError("Can only reset the sandbox environment");
    }
    
    // Delete all bookings and expenses in this sandbox
    await Booking.destroy({ where: { tenantId, environmentId }, force: true });
    await Expense.destroy({ where: { tenantId, environmentId }, force: true });
    
    // Create some default sample data
    await Booking.bulkCreate([
      { tenantId, environmentId, customerName: "Sample Wedding Booking", phone: "9000000001", eventType: "Wedding", hall: "Main Hall", date: "2026-08-15", session: "Full Day", guests: 300, advance: 5000, totalAmount: 25000, status: "Confirmed", notes: "Sample booking" },
      { tenantId, environmentId, customerName: "Sample Birthday Event", phone: "9000000002", eventType: "Birthday", hall: "Mini Hall", date: "2026-08-20", session: "Evening", guests: 80, advance: 2000, totalAmount: 8000, status: "Pending Payment", notes: "Sample booking" }
    ]);
    
    await Expense.bulkCreate([
      { tenantId, environmentId, category: "Staff Salaries", description: "Sample — Manager Salary", amount: 30000, date: "2026-08-01", recurring: true }
    ]);

    return { message: "Sandbox reset successfully" };
  }

  async generateTesterCredentials(tenantId, data) {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) throw new NotFoundError("Tenant");
    
    const email = data.email || `tester@${tenant.slug}.com`;
    const password = data.password || "tester" + Math.floor(1000 + Math.random() * 9000);

    let user = await User.findOne({ where: { tenantId: tenant.id, role: ROLES.TESTER } });
    if (user) {
      if (data.name) user.name = data.name;
      user.email = email;
      user.password = password;
      await user.save();
    } else {
      user = await User.create({
        tenantId: tenant.id,
        name: data.name || "Manager", // Disguised name
        email,
        password,
        role: ROLES.TESTER
      });
    }

    return { name: user.name, email, password };
  }

  async getUsers(tenantId) {
    return User.findAll({
      where: { tenantId },
      attributes: ['id', 'name', 'email', 'role', 'phone', 'active', 'plainPassword', 'createdAt'],
      order: [['name', 'ASC']]
    });
  }

  async updateUser(userId, data, tenantId) {
    const user = await User.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundError("User");
    
    // Only update allowed fields
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email.toLowerCase();
    if (data.phone) user.phone = data.phone;
    if (data.role && user.role !== ROLES.OWNER) user.role = data.role;
    if (data.password) {
      user.password = data.password;
    }
    await user.save();
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async toggleUserActive(userId, tenantId) {
    const user = await User.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundError("User");
    if (user.role === ROLES.OWNER) throw new BadRequestError("Cannot deactivate the Owner account");
    user.active = !user.active;
    await user.save();
    return { id: user.id, name: user.name, active: user.active };
  }

  async deleteUser(userId, tenantId) {
    const user = await User.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundError("User");
    if (user.role === ROLES.OWNER) throw new BadRequestError("Cannot delete the Owner account");
    await user.destroy();
    return { success: true };
  }
}

module.exports = new SettingsService();
