require("dotenv").config({ path: __dirname + "/../.env" });
const assert = require("assert");
const sequelize = require("../db");
const { Tenant, Environment, Booking, Payment, JournalEntry, JournalEntryLine, ChartOfAccount } = require("../models");
const accountingEngine = require("../services/accountingEngine.service");

async function runTests() {
  console.log("🚀 Starting Phase 2.5 Business Flow Validation...");
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Setup Test Tenant
    const tenant = await Tenant.create({ name: "Test Tenant", email: "test@venueza.com", slug: "test-tenant-123" }, { transaction });
    const env = await Environment.create({ tenantId: tenant.id, name: "Production" }, { transaction });

    // Seed COA for this tenant directly (mocked)
    const accounts = [
      { code: "1100", systemKey: "CASH_IN_HAND", name: "Cash", type: "Asset" },
      { code: "1300", systemKey: "ACCOUNTS_RECEIVABLE", name: "Accounts Receivable", type: "Asset" },
      { code: "4100", systemKey: "HALL_BOOKING_REVENUE", name: "Booking Revenue", type: "Income" }
    ];

    for (const acc of accounts) {
      await ChartOfAccount.create({ ...acc, tenantId: tenant.id, environmentId: env.id }, { transaction });
    }

    console.log("✅ Multi-Tenant Setup: Tenant and Chart of Accounts created.");

    // 2. Booking Creation Flow
    const booking = await Booking.create({
      tenantId: tenant.id, environmentId: env.id,
      customerName: "John Doe", phone: "1234567890", date: "2026-07-23",
      eventType: "Wedding", hall: "Main Hall", totalAmount: 50000,
      status: "Confirmed"
    }, { transaction });

    await accountingEngine.recordBooking(booking.id, tenant.id, env.id, transaction);
    
    const bookingJv = await JournalEntry.findOne({
      where: { sourceModule: "Booking", sourceId: booking.id, tenantId: tenant.id },
      include: ['lines'],
      transaction
    });

    assert.ok(bookingJv, "Booking journal should be created");
    assert.strictEqual(bookingJv.lines.length, 2, "Booking journal should have 2 lines");
    
    let totalDebit = 0; let totalCredit = 0;
    bookingJv.lines.forEach(line => {
      totalDebit += parseFloat(line.debit);
      totalCredit += parseFloat(line.credit);
    });

    assert.strictEqual(totalDebit, 50000, "Total debit must equal 50000");
    assert.strictEqual(totalDebit, totalCredit, "Debit MUST equal Credit (Financial Integrity Rule)");
    
    console.log("✅ Booking Lifecycle: Confirmation posts balanced journal properly.");

    // 3. Payment Flow
    const payment = await Payment.create({
      tenantId: tenant.id, environmentId: env.id,
      bookingId: booking.id, amount: 20000, paymentMode: "Cash",
      paymentDate: "2026-07-23", status: "Completed",
      paymentNumber: "PAY-TEST-01", customerId: 1
    }, { transaction });

    await accountingEngine.recordPayment(payment.id, tenant.id, env.id, transaction);

    const paymentJv = await JournalEntry.findOne({
      where: { sourceModule: "Payment", sourceId: payment.id, tenantId: tenant.id },
      include: ['lines'],
      transaction
    });

    let pDebit = 0; let pCredit = 0;
    paymentJv.lines.forEach(line => {
      pDebit += parseFloat(line.debit);
      pCredit += parseFloat(line.credit);
    });

    assert.strictEqual(pDebit, pCredit, "Payment journal debit MUST equal credit");
    
    console.log("✅ Payment Lifecycle: Advance payment records balanced journal properly.");

    // 4. Financial Summary
    const summary = await accountingEngine.getBookingSummary(booking.id, tenant.id, env.id, transaction);
    assert.strictEqual(summary.totalRevenue, 50000, "Revenue should be 50k");
    assert.strictEqual(summary.totalCollected, 20000, "Collected should be 20k");
    assert.strictEqual(summary.outstanding, 30000, "Outstanding should be 30k");
    console.log("✅ Booking Financial Summary: Reconciles correctly from accounting engine.");

    // 5. Test Reversals / Cancellations
    console.log("🚧 Future Test: Reversal/Cancellation flows... to be implemented.");

    await transaction.rollback(); // Rollback to not dirty the DB
    console.log("🎉 All Phase 2.5 Validation Tests Passed Successfully.");
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
}

runTests();
