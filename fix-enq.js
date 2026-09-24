const { Enquiry } = require('./server/models');
const db = require('./server/db');

async function fix() {
  await db.authenticate();
  await Enquiry.update(
    { enquirerArea: 'pokkund', enquirerAddress: 'mizab manziel' },
    { where: { enquiryNumber: 'ENQ004' } }
  );
  console.log('Fixed ENQ004');
  process.exit(0);
}

fix().catch(console.error);
