const customerService = require("../services/customer.service");
const { sendSuccess, buildPagination } = require("../helpers/response");

class CustomerController {
  async list(req, res, next) {
    try {
      const { search, type } = req.query;
      const result = await customerService.listCustomers({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        search,
        type,
        query: req.query,
      });

      return sendSuccess(res, {
        data: result.data,
        message: "Customers fetched successfully",
        pagination: buildPagination(result.total, result.page, result.limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const result = await customerService.getCustomer(req.params.id, {
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
      const result = await customerService.createCustomer(req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Customer created successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  // Find existing customer by phone, or create a new one
  async findOrCreate(req, res, next) {
    try {
      const { name, phone, email, address, place, gender } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: "Name and phone are required" });
      }

      const result = await customerService.findOrCreateCustomer(
        { name, phone, email, address, place, gender },
        {
          tenantId: req.tenantId,
          environmentId: req.environmentId,
          createdBy: req.user.id,
        }
      );
      return sendSuccess(res, {
        data: result.customer,
        message: result.created ? "Customer created" : "Customer found",
        statusCode: result.created ? 201 : 200,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const result = await customerService.updateCustomer(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        updatedBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Customer updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await customerService.deleteCustomer(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CustomerController();
