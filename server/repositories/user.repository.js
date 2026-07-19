const BaseRepository = require("./base.repository");
const User = require("../models/User");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.model.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByEmailAndTenant(email, tenantId) {
    return this.model.findOne({ where: { email: email.toLowerCase(), tenantId } });
  }
}

module.exports = new UserRepository();
