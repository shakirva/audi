/**
 * Booking Controller — thin layer between routes and services.
 * Handles HTTP request/response, delegates logic to BookingService.
 */

const bookingService = require("../services/booking.service");
const { sendSuccess } = require("../helpers/response");
const { buildPagination } = require("../helpers/response");

class BookingController {
  /**
   * GET /api/v1/bookings
   */
  async list(req, res, next) {
    try {
      const { status, month, hall, search } = req.query;
      const result = await bookingService.listBookings({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        status,
        month,
        hall,
        search,
        query: req.query,
      });

      return sendSuccess(res, {
        data: result.data,
        message: "Bookings fetched successfully",
        pagination: buildPagination(result.total, result.page, result.limit),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/bookings/stats/dashboard
   */
  async dashboardStats(req, res, next) {
    try {
      const stats = await bookingService.getDashboardStats({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: stats,
        message: "Dashboard stats fetched successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/bookings/:id
   */
  async getOne(req, res, next) {
    try {
      const booking = await bookingService.getBooking(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: booking,
        message: "Booking fetched successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/bookings
   */
  async create(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: booking,
        message: "Booking created successfully",
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/bookings/:id
   */
  async update(req, res, next) {
    try {
      const booking = await bookingService.updateBooking(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: booking,
        message: "Booking updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/bookings/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const booking = await bookingService.updateBookingStatus(req.params.id, req.body.status, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: booking,
        message: "Booking status updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/bookings/:id/invoice
   */
  async generateInvoice(req, res, next) {
    try {
      const booking = await bookingService.generateInvoice(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: booking,
        message: "Final Tax Invoice generated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/bookings/:id
   */
  async remove(req, res, next) {
    try {
      const result = await bookingService.deleteBooking(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });

      return sendSuccess(res, {
        data: result,
        message: "Booking deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/bookings/:id/safe-delete
   * Accepts body: { reason, refundAction, refundAccount, expenseAction }
   */
  async safeRemove(req, res, next) {
    try {
      const result = await bookingService.safeDeleteBooking(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        reason: req.body.reason,
        refundAction: req.body.refundAction,
        refundAccount: req.body.refundAccount,
        expenseAction: req.body.expenseAction,
        enquiryAction: req.body.enquiryAction,
        customerAction: req.body.customerAction,
        deletedBy: req.user?.id,
      });

      return sendSuccess(res, {
        data: result,
        message: "Booking deleted successfully with all financial records handled",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
