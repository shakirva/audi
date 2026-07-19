const masterService = require("../services/master.service");
const { sendSuccess, buildPagination } = require("../helpers/response");

class MasterController {
  async list(req, res, next) {
    try {
      const type = req.params.type;
      const result = await masterService.listMaster(type, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        search: req.query.search,
        query: req.query,
      });

      return sendSuccess(res, {
        data: result.data,
        message: `${type} fetched successfully`,
        pagination: buildPagination(result.total, result.page, result.limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const { type, id } = req.params;
      const result = await masterService.getMaster(type, id, {
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
      const type = req.params.type;
      const result = await masterService.createMaster(type, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: `${type} created successfully`, statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { type, id } = req.params;
      const result = await masterService.updateMaster(type, id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        updatedBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: `${type} updated successfully` });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const { type, id } = req.params;
      const result = await masterService.deleteMaster(type, id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MasterController();
