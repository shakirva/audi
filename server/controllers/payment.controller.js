const paymentService = require("../services/payment.service");
const { sendSuccess, buildPagination } = require("../helpers/response");

class PaymentController {
  async list(req, res, next) {
    try {
      const { bookingId, customerId } = req.query;
      const result = await paymentService.listPayments({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        bookingId,
        customerId,
        query: req.query,
      });

      return sendSuccess(res, {
        data: result.data,
        message: "Payments fetched successfully",
        pagination: buildPagination(result.total, result.page, result.limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const result = await paymentService.getPayment(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async record(req, res, next) {
    try {
      const result = await paymentService.recordPayment(req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Payment recorded and receipt generated", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async getReceipt(req, res, next) {
    try {
      const result = await paymentService.getReceipt(req.params.paymentId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async generateReceiptPdf(req, res, next) {
    try {
      const result = await paymentService.generateReceiptPdf(req.params.receiptId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentController();
