const adminService = require("../services/admin.service");
const { sendSuccess } = require("../helpers/response");

class AdminController {
  async getTenants(req, res, next) {
    try {
      const result = await adminService.getTenants();
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async createTenant(req, res, next) {
    try {
      const result = await adminService.createTenant(req.body);
      return sendSuccess(res, { data: result, message: "Tenant created successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async updateSubscription(req, res, next) {
    try {
      const result = await adminService.updateSubscription(req.params.id, req.body);
      return sendSuccess(res, { data: result, message: "Subscription updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async toggleSandbox(req, res, next) {
    try {
      const result = await adminService.toggleSandbox(req.params.id);
      return sendSuccess(res, { data: result, message: "Sandbox toggled successfully" });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const result = await adminService.toggleStatus(req.params.id);
      return sendSuccess(res, { data: result, message: "Tenant status toggled successfully" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
