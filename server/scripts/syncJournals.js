/**
 * Sync existing payments and expenses into the new accounting journal system.
 * Run once to backfill data. Safe to re-run (checks for existing entries).
 */
require("dotenv").config();
const { Payment, Expense, Booking, JournalEntry } = require("../models");
const accountingEngine = require("../services/accountingEngine.service");
const sequelize = require("../db");

async function syncAll() {
  await sequelize.authenticate();
  console.log("DB connected");

  // Check if already synced
  const existingJournals = await JournalEntry.count();
  if (existingJournals > 0) {
    console.log(`Already have ${existingJournals} journal entries. Skipping sync.`);
    process.exit(0);
  }

  // 1. Sync all bookings (creates outstanding entries)
  const bookings = await Booking.findAll({ 
    where: { status: ["Confirmed", "Completed", "Closed", "Agreement Pending", "Advance Pending", "Ready For Job"] },
    order: [["createdAt", "ASC"]] 
  });
  console.log(`Syncing ${bookings.length} bookings...`);
  for (const booking of bookings) {
    try {
      await accountingEngine.onBookingCreated(booking, {
        tenantId: booking.tenantId,
        environmentId: booking.environmentId,
        createdBy: booking.createdBy,
      });
    } catch (e) {
      console.error(`Failed booking ${booking.bookingId}:`, e.message);
    }
  }

  // 2. Sync all payments
  const payments = await Payment.findAll({ order: [["createdAt", "ASC"]] });
  console.log(`Syncing ${payments.length} payments...`);
  for (const payment of payments) {
    try {
      await accountingEngine.onPaymentReceived(payment, {
        tenantId: payment.tenantId,
        environmentId: payment.environmentId,
        createdBy: payment.createdBy,
      });
    } catch (e) {
      console.error(`Failed payment ${payment.paymentNumber}:`, e.message);
    }
  }

  // 3. Sync all expenses
  const expenses = await Expense.findAll({ order: [["createdAt", "ASC"]] });
  console.log(`Syncing ${expenses.length} expenses...`);
  for (const expense of expenses) {
    try {
      await accountingEngine.onExpenseCreated(expense, {
        tenantId: expense.tenantId,
        environmentId: expense.environmentId,
        createdBy: expense.createdBy,
        paymentMode: "Cash",
      });
    } catch (e) {
      console.error(`Failed expense ${expense.id}:`, e.message);
    }
  }

  const totalJournals = await JournalEntry.count();
  console.log(`\nSync complete! Total journal entries created: ${totalJournals}`);
  process.exit(0);
}

syncAll().catch(e => { console.error(e); process.exit(1); });
