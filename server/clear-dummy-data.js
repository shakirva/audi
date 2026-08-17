const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://venueza:Venueza@Prod2026@localhost:5432/venueza_prod', {
  logging: false,
});

async function clearData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    const tablesToClear = [
      '"AuditLogs"',
      '"JobDocuments"',
      '"JobChecklists"',
      '"JobTimelines"',
      '"JobVendors"',
      '"JobStaffs"',
      '"Jobs"',
      '"Receipts"',
      '"Payments"',
      '"Expenses"',
      '"JournalEntries"',
      '"Vouchers"',
      '"AccountStatements"',
      '"BankBooks"',
      '"CashBooks"',
      '"FollowUps"',
      '"Enquiries"',
      '"Bookings"',
      '"Customers"'
    ];

    for (const table of tablesToClear) {
      await sequelize.query(`TRUNCATE TABLE ${table} CASCADE;`);
      console.log(`Cleared ${table}`);
    }

    console.log('All dummy data cleared successfully!');
  } catch (err) {
    console.error('Failed to clear data:', err);
  } finally {
    await sequelize.close();
  }
}

clearData();
