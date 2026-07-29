/**
 * Base Repository — provides common CRUD operations for all models.
 * All repositories extend this class.
 *
 * Every query automatically scopes by tenantId + environmentId.
 */

const { NotFoundError } = require("../helpers/errors");
const { parsePagination } = require("../helpers/pagination");

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find all records with tenant/env scoping, filtering, pagination.
   */
  async findAll({ tenantId, environmentId, where = {}, order = [["createdAt", "DESC"]], query = {}, include = [] }) {
    const filter = { tenantId, environmentId, ...where };
    const { page, limit, offset } = parsePagination(query);

    const { count, rows } = await this.model.findAndCountAll({
      where: filter,
      order,
      limit,
      offset,
      include,
    });

    return { rows, total: count, page, limit };
  }

  /**
   * Find all without pagination (for internal use, reports, etc.)
   */
  async findAllUnpaginated({ tenantId, environmentId, where = {}, order = [["createdAt", "DESC"]], include = [] }) {
    return this.model.findAll({
      where: { tenantId, environmentId, ...where },
      order,
      include,
    });
  }

  /**
   * Find a single record by condition.
   */
  async findOne({ tenantId, environmentId, where = {}, include = [] }) {
    return this.model.findOne({
      where: { tenantId, environmentId, ...where },
      include,
    });
  }

  /**
   * Find by primary key (with tenant scoping for safety).
   */
  async findById(id, { tenantId, environmentId, include = [] } = {}) {
    const where = { id };
    if (tenantId) where.tenantId = tenantId;
    if (environmentId) where.environmentId = environmentId;

    return this.model.findOne({ where, include });
  }

  /**
   * Create a new record.
   */
  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  /**
   * Update an existing record.
   */
  async update(instance, data, options = {}) {
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        instance[key] = data[key];
      }
    });
    await instance.save(options);
    return instance;
  }

  /**
   * Delete a record (hard delete for now; soft delete when paranoid is enabled).
   */
  async delete(instance) {
    await instance.destroy();
    return true;
  }

  /**
   * Count records with scoping.
   */
  async count({ tenantId, environmentId, where = {} }) {
    return this.model.count({
      where: { tenantId, environmentId, ...where },
    });
  }

  /**
   * Find or throw NotFoundError.
   */
  async findOneOrFail({ tenantId, environmentId, where = {}, resourceName = "Record" }) {
    const record = await this.findOne({ tenantId, environmentId, where });
    if (!record) throw new NotFoundError(resourceName);
    return record;
  }
}

module.exports = BaseRepository;
