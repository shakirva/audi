const { sequelize, models } = require('./models');

async function clearData() {
  const t = await sequelize.transaction();
  try {
    const tenantId = 1;
    console.log("Starting data wipe for tenant", tenantId);

    // Disable foreign key checks for SQLite/Postgres?
    // In Postgres, we can't easily disable globally, but we can do it table by table or use CASCADE in raw queries, 
    // or just delete in proper order.
    
    // Proper deletion order (leaves first)
    const tablesToClear = [
      'AuditLogs', 'ActivityLogs',
      'JournalEntryLines', 'JournalEntries',
      'Payments', 'Receipts', 'Vouchers',
      'VendorPayments', 'VendorBills',
      'JobChecklists', 'JobDocuments', 'JobStaffs', 'JobTimelines', 'JobVendors', 'Jobs',
      'Bookings', 'BookingServices',
      'Enquiries', 'FollowUps',
      'Customers', 'Vendors',
      'Expenses', 'Inventories',
      'LeaveRequests', 'Attendance', 'Feedbacks', 'ComplianceDocuments'
    ];

    for (const tableName of tablesToClear) {
      if (models[tableName]) {
        // JournalEntryLines doesn't have tenantId directly, so we delete via JournalEntry
        if (tableName === 'JournalEntryLines') {
           const jeIds = (await models.JournalEntries.findAll({ where: { tenantId }, attributes: ['id'], transaction: t })).map(x => x.id);
           if (jeIds.length > 0) {
              await models.JournalEntryLines.destroy({ where: { journalEntryId: jeIds }, force: true, transaction: t });
           }
        } else {
           await models[tableName].destroy({ where: { tenantId }, force: true, transaction: t });
        }
        console.log(`Cleared ${tableName}`);
      }
    }
    
    // We should also clear any specific other things if requested, but let's stick to these.

    await t.commit();
    console.log("Successfully cleared transactional data!");
  } catch (error) {
    await t.rollback();
    console.error("Error clearing data:", error);
  } finally {
    await sequelize.close();
  }
}

clearData();
