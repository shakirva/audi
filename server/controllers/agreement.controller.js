const agreementService = require("../services/agreement.service");
const { sendSuccess } = require("../helpers/response");

class AgreementController {
  async getAll(req, res, next) {
    try {
      const result = await agreementService.getAll(req.query, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result.rows, meta: { total: result.total } });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const result = await agreementService.getAgreement(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async getByBooking(req, res, next) {
    try {
      const result = await agreementService.getByBookingId(req.params.bookingId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async createForBooking(req, res, next) {
    try {
      const result = await agreementService.createAgreementForBooking(req.body.bookingId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Agreement created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const result = await agreementService.updateAgreement(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        updatedBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Agreement updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async generatePdf(req, res, next) {
    try {
      const result = await agreementService.generatePdf(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AgreementController();
