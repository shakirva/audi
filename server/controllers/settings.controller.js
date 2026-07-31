const settingsService = require("../services/settings.service");
const { sendSuccess } = require("../helpers/response");

class SettingsController {
  async getPublic(req, res, next) {
    try {
      const result = await settingsService.getPublicSettings(req.params.slug);
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const result = await settingsService.getSettings(req.tenantId, req.environmentId);
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const result = await settingsService.updateSettings(req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId
      });
      return sendSuccess(res, { data: result, message: "Settings updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async customers(req, res, next) {
    try {
      const result = await settingsService.getCustomers({
        tenantId: req.tenantId,
        environmentId: req.environmentId
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetSandbox(req, res, next) {
    try {
      const result = await settingsService.resetSandbox({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        environmentType: req.environmentType
      });
      return sendSuccess(res, { data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async tester(req, res, next) {
    try {
      const result = await settingsService.generateTesterCredentials(req.user.tenantId, req.body);
      return sendSuccess(res, { data: result, message: "Tester credentials generated" });
    } catch (err) {
      next(err);
    }
  }

  async users(req, res, next) {
    try {
      const result = await settingsService.getUsers(req.tenantId);
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { ROLES } = require("../helpers/roles");
      const { ForbiddenError } = require("../helpers/errors");
      
      const targetUserId = req.params.id;
      const actingUserId = req.user.id;
      const actingUserRole = req.user.role;
      
      if (actingUserRole !== ROLES.OWNER && actingUserRole !== ROLES.MANAGER) {
        if (targetUserId !== actingUserId) {
          throw new ForbiddenError("You are not authorized to update this user's profile");
        }
        // Prevent privilege escalation: non-admins cannot change their own roles or active status
        delete req.body.role;
        delete req.body.active;
      }

      const result = await settingsService.updateUser(req.params.id, req.body, req.tenantId);
      return sendSuccess(res, { data: result, message: "User updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async toggleUserActive(req, res, next) {
    try {
      const result = await settingsService.toggleUserActive(req.params.id, req.tenantId);
      return sendSuccess(res, { data: result, message: `User ${result.active ? 'activated' : 'deactivated'} successfully` });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await settingsService.deleteUser(req.params.id, req.tenantId);
      return sendSuccess(res, { data: result, message: "User removed successfully" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingsController();
