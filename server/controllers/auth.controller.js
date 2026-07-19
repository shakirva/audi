const authService = require("../services/auth.service");
const { sendSuccess } = require("../helpers/response");

class AuthController {
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, {
        data: result,
        message: "Login successful",
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const result = await authService.getMe(req.user.id, req.user.tenantId);
      return sendSuccess(res, {
        data: result,
        message: "User fetched successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const result = await authService.registerUser(req.body, { 
        tenantId: req.user.tenantId,
        createdBy: req.user.id
      });
      return sendSuccess(res, {
        data: result,
        message: "User registered successfully",
        statusCode: 201
      });
    } catch (err) {
      next(err);
    }
  }

  async bootstrap(req, res, next) {
    try {
      const result = await authService.bootstrapSuperAdmin();
      return sendSuccess(res, {
        data: result,
        message: "Bootstrap successful",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
