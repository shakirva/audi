const BaseRepository = require("./base.repository");
const {
  MasterHall, MasterPackage, MasterService, MasterEventType,
  MasterLeadSource, MasterPaymentMode, MasterBank, MasterExpenseCategory
} = require("../models/Master");
const { NotFoundError } = require("../helpers/errors");

const MasterModels = {
  halls: MasterHall,
  packages: MasterPackage,
  services: MasterService,
  event_types: MasterEventType,
  lead_sources: MasterLeadSource,
  payment_modes: MasterPaymentMode,
  banks: MasterBank,
  expense_categories: MasterExpenseCategory
};

class MasterRepository {
  getModel(type) {
    const model = MasterModels[type];
    if (!model) throw new NotFoundError(`Master type '${type}'`);
    return model;
  }

  async findAll(type, { tenantId, environmentId, search, query = {} }) {
    const model = this.getModel(type);
    const repo = new BaseRepository(model);
    return repo.findAll({ tenantId, environmentId, query });
  }

  async findById(type, id, { tenantId, environmentId }) {
    const model = this.getModel(type);
    const repo = new BaseRepository(model);
    return repo.findById(id, { tenantId, environmentId });
  }

  async create(type, data, { tenantId, environmentId, createdBy }) {
    const model = this.getModel(type);
    const repo = new BaseRepository(model);
    return repo.create({ tenantId, environmentId, ...data, createdBy });
  }

  async update(type, id, data, { tenantId, environmentId, updatedBy }) {
    const model = this.getModel(type);
    const repo = new BaseRepository(model);
    const record = await repo.findById(id, { tenantId, environmentId });
    if (!record) throw new NotFoundError("Master record");
    return repo.update(record, { ...data, updatedBy });
  }

  async delete(type, id, { tenantId, environmentId }) {
    const model = this.getModel(type);
    const repo = new BaseRepository(model);
    const record = await repo.findById(id, { tenantId, environmentId });
    if (!record) throw new NotFoundError("Master record");
    return repo.delete(record);
  }
}

module.exports = new MasterRepository();
