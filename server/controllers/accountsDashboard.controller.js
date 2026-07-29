/**
 * Accounts Dashboard Controller — serves all accounting API endpoints.
 */
const accountingEngine = require("../services/accountingEngine.service");
const { sendSuccess } = require("../helpers/response");

class AccountsDashboardController {
  async getDashboard(req, res, next) {
    try {
      const data = await accountingEngine.getDashboard({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data, message: "Accounts dashboard fetched successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getLedger(req, res, next) {
    try {
      const { accountCode, startDate, endDate, page, limit } = req.query;
      const data = await accountingEngine.getLedger({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        accountCode,
        startDate,
        endDate,
        page: Number(page) || 1,
        limit: Number(limit) || 50,
      });
      return sendSuccess(res, { data, message: "Ledger fetched successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getVouchers(req, res, next) {
    try {
      const { voucherType, startDate, endDate, page, limit } = req.query;
      const data = await accountingEngine.getVouchers({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        voucherType,
        startDate,
        endDate,
        page: Number(page) || 1,
        limit: Number(limit) || 50,
      });
      return sendSuccess(res, { data, message: "Vouchers fetched successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerLedger(req, res, next) {
    try {
      const data = await accountingEngine.getCustomerLedger(req.params.customerId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data, message: "Customer ledger fetched successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getBookingLedger(req, res, next) {
    try {
      const data = await accountingEngine.getBookingLedger(req.params.bookingId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data, message: "Booking ledger fetched successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getProfitLoss(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await accountingEngine.getProfitLoss({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        startDate,
        endDate,
      });
      return sendSuccess(res, { data, message: "Profit & Loss fetched successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getOutstanding(req, res, next) {
    try {
      const onlyOutstanding = req.query.onlyOutstanding === "true";
      const data = await accountingEngine.getOutstandingReport({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        onlyOutstanding
      });
      return sendSuccess(res, { data, message: "Outstanding report fetched successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getChartOfAccounts(req, res, next) {
    try {
      const { ChartOfAccount } = require("../models");
      const accounts = await ChartOfAccount.findAll({
        where: { tenantId: req.tenantId, environmentId: req.environmentId, isActive: true },
        order: [["code", "ASC"]],
      });
      return sendSuccess(res, { data: accounts, message: "Chart of Accounts fetched successfully" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AccountsDashboardController();
