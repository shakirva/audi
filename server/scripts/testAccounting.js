require("dotenv").config({ path: __dirname + "/../.env" });
const assert = require("assert");
const sequelize = require("../db");
const { Tenant, Environment, Booking, Payment, JournalEntry, JournalEntryLine, ChartOfAccount } = require("../models");
const accountingEngine = require("../services/accountingEngine.service");

/**
 * Basic integration tests for the Accounting Engine.
 * Run this against a test database.
 */
async function runTests() {
  console.log("Starting Accounting Engine Tests...");
  let transaction;
  
  try {
    // Start isolated transaction
    transaction = await sequelize.transaction();

    // 1. Setup mock tenant
    const tenant = await Tenant.create({ name: "Test Tenant", email: "test@test.com" }, { transaction });
    const env = await Environment.create({ name: "Production", tenantId: tenant.id }, { transaction });

    // Seed COA for this tenant (reuse the seed array from syncLedger ideally, but manually mock here)
    const coaRec = await ChartOfAccount.create({ tenantId: tenant.id, environmentId: env.id, code: "1300", systemKey: "ACCOUNTS_RECEIVABLE", name: "AR", type: "Asset" }, { transaction });
    const coaInc = await ChartOfAccount.create({ tenantId: tenant.id, environmentId: env.id, code: "4100", systemKey: "HALL_BOOKING_REVENUE", name: "Rev", type: "Income" }, { transaction });
    const coaCash = await ChartOfAccount.create({ tenantId: tenant.id, environmentId: env.id, code: "1100", systemKey: "CASH_IN_HAND", name: "Cash", type: "Asset" }, { transaction });

    // 2. Test Booking Confirmation generates JV
    const booking = await Booking.create({
      tenantId: tenant.id,
      environmentId: env.id,
      bookingNumber: "BK-TEST-1",
      totalAmount: 10000,
      customerId: 1 // Mock
    }, { transaction });

    await accountingEngine.recordBooking(booking.id, tenant.id, env.id, transaction);

    // Verify
    const bookingJv = await JournalEntry.findOne({ where: { sourceModule: "Booking", sourceId: booking.id }, include: ['lines'], transaction });
    assert(bookingJv, "Journal entry for booking should be created");
    assert.strictEqual(bookingJv.status, "Posted", "Status should be Posted");
    assert.strictEqual(bookingJv.lines.length, 2, "Should have 2 lines");
    
    const debitLine = bookingJv.lines.find(l => l.accountId === coaRec.id);
    const creditLine = bookingJv.lines.find(l => l.accountId === coaInc.id);
    assert.strictEqual(parseFloat(debitLine.debit), 10000, "Debit AR 10000");
    assert.strictEqual(parseFloat(creditLine.credit), 10000, "Credit Rev 10000");
    console.log("✔ Test 1 Passed: Booking confirmation generates balanced journal.");

    // 3. Test Idempotency
    await accountingEngine.recordBooking(booking.id, tenant.id, env.id, transaction);
    const jvCount = await JournalEntry.count({ where: { sourceModule: "Booking", sourceId: booking.id }, transaction });
    assert.strictEqual(jvCount, 1, "Should not duplicate journal entries");
    console.log("✔ Test 2 Passed: Idempotency check prevents duplicates.");

    // 4. Test Payment Collection
    const payment = await Payment.create({
      tenantId: tenant.id,
      environmentId: env.id,
      paymentNumber: "PAY-TEST-1",
      bookingId: booking.id,
      customerId: 1,
      amount: 2000,
      paymentMode: "Cash",
      paymentDate: new Date()
    }, { transaction });

    await accountingEngine.recordPayment(payment.id, tenant.id, env.id, transaction);

    const paymentJv = await JournalEntry.findOne({ where: { sourceModule: "Payment", sourceId: payment.id }, include: ['lines'], transaction });
    assert(paymentJv, "Journal entry for payment should be created");
    const cashLine = paymentJv.lines.find(l => l.accountId === coaCash.id);
    assert.strictEqual(parseFloat(cashLine.debit), 2000, "Debit Cash 2000");
    console.log("✔ Test 3 Passed: Payment generates balanced journal.");

    // 5. Test Reversal
    await accountingEngine.reverseJournal(paymentJv.id, 999, "Mistake", transaction);
    const reversedOriginal = await JournalEntry.findByPk(paymentJv.id, { transaction });
    assert.strictEqual(reversedOriginal.status, "Reversed", "Original JV should be marked Reversed");
    
    const reversalJv = await JournalEntry.findOne({ where: { sourceModule: "Refund", sourceId: payment.id }, include: ['lines'], transaction });
    assert(reversalJv, "Reversal JV should be created");
    const revCashLine = reversalJv.lines.find(l => l.accountId === coaCash.id);
    assert.strictEqual(parseFloat(revCashLine.credit), 2000, "Cash should be credited to reverse");
    console.log("✔ Test 4 Passed: Reversal safely negates entry and updates status.");

    // 6. Test Booking Summary
    const summary = await accountingEngine.getBookingSummary(booking.id, tenant.id, env.id);
    assert.strictEqual(summary.totalRevenue, 10000, "Revenue should be 10000");
    // Collected was 2000, reversed 2000, so net collected should be 0. (Note: The summary uses posted status and checks sourceModule. Reversal is 'Refund').
    assert.strictEqual(summary.totalCollected, 0, "Net collected should be 0 after reversal");
    console.log("✔ Test 5 Passed: Booking financial summary calculates correctly.");

    // Rollback tests
    await transaction.rollback();
    console.log("All tests passed! DB changes rolled back safely.");
    process.exit(0);

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("✖ Test Failed:", err);
    process.exit(1);
  }
}

runTests();
