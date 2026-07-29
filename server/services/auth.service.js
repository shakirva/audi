const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");
const { Tenant } = require("../models"); // using direct models for cross-tenant logic if needed
const { UnauthorizedError, NotFoundError, ConflictError, BadRequestError } = require("../helpers/errors");
const { ROLES } = require("../helpers/roles");

class AuthService {
  async login({ email, password, tenantSlug }) {
    let user = null;
    
    if (tenantSlug) {
      const tenant = await Tenant.findOne({ where: { slug: tenantSlug } });
      if (tenant) {
        user = await userRepository.findByEmailAndTenant(email, tenant.id);
      }
    }
    
    if (!user) {
      user = await userRepository.findByEmail(email);
    }
    
    if (!user) throw new UnauthorizedError("Invalid credentials");
    if (!user.active) throw new UnauthorizedError("Account is disabled");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new UnauthorizedError("Invalid credentials");

    const token = jwt.sign({ id: user.id, role: user.role, tenantId: user.tenantId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    const tenant = await Tenant.findByPk(user.tenantId);

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      tenant: tenant ? { 
        name: tenant.name, 
        slug: tenant.slug, 
        sandboxEnabled: tenant.sandboxEnabled, 
        allowEnvironmentSwitch: tenant.allowEnvironmentSwitch 
      } : null,
    };
  }

  async getMe(userId, tenantId) {
    const user = await userRepository.findById(userId, { tenantId });
    if (!user) throw new NotFoundError("User");

    const tenant = await Tenant.findByPk(tenantId);
    
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      tenant: tenant ? { 
        name: tenant.name, 
        slug: tenant.slug, 
        sandboxEnabled: tenant.sandboxEnabled, 
        allowEnvironmentSwitch: tenant.allowEnvironmentSwitch 
      } : null,
    };
  }

  async registerUser({ name, email, password, role, phone }, { tenantId, createdBy }) {
    const exists = await userRepository.findByEmailAndTenant(email, tenantId);
    if (exists) throw new ConflictError("Email already registered in this tenant");

    const user = await userRepository.create({
      tenantId,
      name,
      email: email.toLowerCase(),
      password,
      role: role || ROLES.STAFF,
      phone: phone || "",
      createdBy
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async bootstrapSuperAdmin() {
    const exists = await userRepository.findByEmail("admin@venueza.com");
    if (exists) {
      return { message: "SuperAdmin already exists", email: exists.email };
    }

    const user = await userRepository.create({
      tenantId: 1, // Assuming tenant 1 is the main venueza tenant
      name: "Super Admin",
      email: "admin@venueza.com",
      password: "Admin@123",
      role: ROLES.SUPER_ADMIN,
      phone: "9999999999",
      active: true
    });

    return { success: true, email: user.email, password: "Admin@123" };
  }
}

module.exports = new AuthService();
