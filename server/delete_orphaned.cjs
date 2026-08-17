require('dotenv').config({ path: '/var/www/venueza/server/.env' });
const sequelize = require('./db');

async function removeOrphans() {
  try {
    await sequelize.query("UPDATE \"Enquiries\" SET \"deletedAt\" = NOW() WHERE \"enquiryNumber\" IN ('ENQ007', 'ENQ008', 'ENQ009')");
    console.log('Successfully deleted ENQ007, ENQ008, ENQ009.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
removeOrphans();
