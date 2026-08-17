const { Booking, JournalEntry, ChartOfAccount } = require('./server/models');
const sequelize = require('./server/db');
const { Op } = require('sequelize');

async function fix() {
  await sequelize.sync();
  
  const incomeAccount = await ChartOfAccount.findOne({ where: { code: '3001' } });
  const taxAccount = await ChartOfAccount.findOne({ where: { code: '2004' } });
  const outstandingAccount = await ChartOfAccount.findOne({ where: { code: '1005' } });

  const bookings = await Booking.findAll({
    where: { taxes: { [Op.gt]: 0 } }
  });

  for (const booking of bookings) {
    const netRevenue = booking.totalAmount - booking.taxes;

    // Fix the existing income journal entry
    await JournalEntry.update(
      { amount: netRevenue },
      { 
        where: { 
          sourceModule: 'Booking', 
          sourceId: booking.id, 
          creditAccountId: incomeAccount.id 
        } 
      }
    );

    // Check if tax entry exists
    const existingTax = await JournalEntry.findOne({
      where: {
        sourceModule: 'Booking',
        sourceId: booking.id,
        creditAccountId: taxAccount.id
      }
    });

    // If it doesn't exist, create it
    if (!existingTax) {
      console.log(`Creating tax entry for BK${booking.id}`);
      await JournalEntry.create({
        tenantId: booking.tenantId,
        environmentId: booking.environmentId,
        date: booking.createdAt,
        description: `GST on Booking #${booking.bookingId} - ${booking.customerName}`,
        amount: booking.taxes,
        debitAccountId: outstandingAccount.id,
        creditAccountId: taxAccount.id,
        voucherType: 'JV',
        sourceModule: 'Booking',
        sourceId: booking.id,
        bookingId: booking.id,
        customerId: booking.customerId
      });
    }
  }
  console.log('Done');
  process.exit(0);
}
fix().catch(console.error);
