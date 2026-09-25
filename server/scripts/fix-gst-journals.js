require("dotenv").config({ path: __dirname + "/../.env" });
const sequelize = require("../db");
const { JournalEntry, JournalEntryLine, Booking, ChartOfAccount } = require("../models");
const accountingEngine = require("../services/accountingEngine.service");

async function run() {
  try {
    const transaction = await sequelize.transaction();
    try {
      // Find all bookings with taxes > 0
      const bookings = await Booking.findAll({ 
        where: { tenantId: 20 },
        transaction 
      });

      for (const booking of bookings) {
        if (!booking.taxes || booking.taxes <= 0) continue;

        // Find the single journal entry for this booking
        const entry = await JournalEntry.findOne({
          where: { sourceModule: 'Booking', sourceId: booking.id, tenantId: booking.tenantId },
          include: [{ model: JournalEntryLine, as: 'lines' }],
          transaction
        });

        if (entry && entry.lines && entry.lines.length === 2) {
          // This is a buggy entry! It only has revenue and outstanding, missing GST.
          console.log(`Fixing Journal Entry ${entry.id} for Booking ${booking.id}`);

          const gstAmount = Number(booking.taxes);
          const totalAmount = Number(booking.totalAmount);
          const netRevenue = totalAmount - gstAmount;

          const outstandingAcct = await ChartOfAccount.findOne({ where: { code: '1005', tenantId: booking.tenantId, environmentId: booking.environmentId }, transaction });
          const revenueAcct = await ChartOfAccount.findOne({ where: { code: '3001', tenantId: booking.tenantId, environmentId: booking.environmentId }, transaction });
          const taxesAcct = await ChartOfAccount.findOne({ where: { code: '2004', tenantId: booking.tenantId, environmentId: booking.environmentId }, transaction });

          if (!outstandingAcct || !revenueAcct || !taxesAcct) {
            throw new Error(`Missing COA for tenant ${booking.tenantId}`);
          }

          // Delete old lines
          await JournalEntryLine.destroy({ where: { journalEntryId: entry.id }, transaction });

          // Create new lines
          await JournalEntryLine.bulkCreate([
            { journalEntryId: entry.id, accountId: outstandingAcct.id, debit: totalAmount, credit: 0, description: entry.description },
            { journalEntryId: entry.id, accountId: revenueAcct.id, debit: 0, credit: netRevenue, description: entry.description },
            { journalEntryId: entry.id, accountId: taxesAcct.id, debit: 0, credit: gstAmount, description: entry.description }
          ], { transaction });

          console.log(`Fixed entry ${entry.id}`);
        }
      }

      await transaction.commit();
      console.log("Success!");
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

run();
