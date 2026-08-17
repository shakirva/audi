require('dotenv').config({ path: './.env' });
const sequelize = require('./db');

async function migrate() {
  try {
    await sequelize.query("UPDATE \"Enquiries\" SET status = 'Interested' WHERE status = 'Quotation Sent'");
    console.log('Migrated data successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
