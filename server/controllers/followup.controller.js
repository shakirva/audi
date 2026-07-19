const followupService = require("../services/followup.service");
const { sendSuccess, buildPagination } = require("../helpers/response");
const { BadRequestError } = require("../helpers/errors");

class FollowUpController {
  async list(req, res, next) {
    try {
      const { enquiryId } = req.query;
      if (!enquiryId) throw new BadRequestError("enquiryId is required");

      const result = await followupService.listFollowUps({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        enquiryId,
        query: req.query,
      });

      return sendSuccess(res, {
        data: result.data,
        message: "FollowUps fetched successfully",
        pagination: buildPagination(result.total, result.page, result.limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const result = await followupService.getFollowUp(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const result = await followupService.createFollowUp(req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "FollowUp created successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const result = await followupService.updateFollowUp(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        updatedBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "FollowUp updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await followupService.deleteFollowUp(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FollowUpController();
