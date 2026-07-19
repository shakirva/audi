const masterRepository = require("../repositories/master.repository");

class MasterService {
  async listMaster(type, { tenantId, environmentId, search, query }) {
    const result = await masterRepository.findAll(type, { tenantId, environmentId, search, query });
    return { data: result.rows, total: result.total, page: result.page, limit: result.limit };
  }

  async getMaster(type, id, { tenantId, environmentId }) {
    const record = await masterRepository.findById(type, id, { tenantId, environmentId });
    if (!record) throw new NotFoundError("Master record");
    return record;
  }

  async createMaster(type, data, { tenantId, environmentId, createdBy }) {
    return masterRepository.create(type, data, { tenantId, environmentId, createdBy });
  }

  async updateMaster(type, id, data, { tenantId, environmentId, updatedBy }) {
    return masterRepository.update(type, id, data, { tenantId, environmentId, updatedBy });
  }

  async deleteMaster(type, id, { tenantId, environmentId }) {
    await masterRepository.delete(type, id, { tenantId, environmentId });
    return { message: "Master record deleted successfully", id };
  }
}

module.exports = new MasterService();
