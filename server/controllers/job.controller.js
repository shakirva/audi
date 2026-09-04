const jobService = require("../services/job.service");
const { sendSuccess, buildPagination } = require("../helpers/response");

class JobController {
  async list(req, res, next) {
    try {
      const { status, priority } = req.query;
      const result = await jobService.listJobs({
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        status,
        priority,
        query: req.query,
      });

      return sendSuccess(res, {
        data: result.data,
        message: "Jobs fetched successfully",
        pagination: buildPagination(result.total, result.page, result.limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const result = await jobService.getJob(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async createFromBooking(req, res, next) {
    try {
      const result = await jobService.createJobFromBooking(req.body.bookingId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Job created successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const result = await jobService.updateJobStatus(req.params.id, req.body.status, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        updatedBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Job status updated" });
    } catch (err) {
      next(err);
    }
  }

  async assignStaff(req, res, next) {
    try {
      const result = await jobService.assignStaff(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Staff assigned successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const result = await jobService.createStandaloneJob(req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result, message: "Job created successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await jobService.deleteJob(req.params.id, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { message: "Job deleted successfully" });
    } catch (err) {
      next(err);
    }
  }

  async toggleChecklist(req, res, next) {
    try {
      const result = await jobService.toggleChecklist(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async addTask(req, res, next) {
    try {
      const result = await jobService.addTask(req.params.id, req.body, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
        createdBy: req.user.id,
      });
      return sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  async removeTask(req, res, next) {
    try {
      await jobService.removeTask(req.params.id, req.params.taskId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { message: "Task removed" });
    } catch (err) {
      next(err);
    }
  }

  async removeStaff(req, res, next) {
    try {
      await jobService.removeStaff(req.params.id, req.params.staffId, {
        tenantId: req.tenantId,
        environmentId: req.environmentId,
      });
      return sendSuccess(res, { message: "Staff removed" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new JobController();
