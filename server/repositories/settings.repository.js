const BaseRepository = require("./base.repository");
const Settings = require("../models/Settings");

class SettingsRepository extends BaseRepository {
  constructor() {
    super(Settings);
  }

  async findOrCreateSettings(tenantId, environmentId) {
    let settings = await this.findOne({ tenantId, environmentId });
    if (!settings) {
      settings = await this.create({
        tenantId,
        environmentId,
        halls: [
          { name: "Main Hall", icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup" },
          { name: "Mini Hall", icon: "🏠", price: 6000, capacity: 150, description: "Intimate setting for smaller events" },
          { name: "Open Stage", icon: "🌿", price: 8000, capacity: 300, description: "Outdoor stage with natural surroundings" },
        ]
      });
    }
    return settings;
  }
}

module.exports = new SettingsRepository();
