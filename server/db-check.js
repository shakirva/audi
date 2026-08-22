const sequelize = require('./db');
const { Settings } = require('./models');

async function run() {
  const settings = await Settings.findOne();
  console.log(JSON.stringify(settings.toJSON(), null, 2));
  process.exit(0);
}
run();
