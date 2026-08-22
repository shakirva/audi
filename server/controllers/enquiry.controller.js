const enquiryService = require("../services/enquiry.service");
const { sendSuccess, buildPagination } = require("../helpers/response");

class EnquiryController {
  async list(req, res, next) {
    try {
      const { search, status, salesExecutiveId } = req.query;
      const result = await enquiryService.listEnquiries({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        userRole: req.user.role,
        userId: req.user.id,
        search,
        status,
        salesExecutiveId,
        query: req.query,
      });

      return sendSuccess(res, {
        data: result.data,
        message: "Enquiries fetched successfully",
        pagination: buildPagination(result.total, result.page, result.limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const result = await enquiryService.getEnquiry(req.params.id, {
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
      const result = await enquiryService.createEnquiry(req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Enquiry created successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const result = await enquiryService.updateEnquiry(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        updatedBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Enquiry updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await enquiryService.deleteEnquiry(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EnquiryController();
