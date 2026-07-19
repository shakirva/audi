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
}

module.exports = new SettingsController();
