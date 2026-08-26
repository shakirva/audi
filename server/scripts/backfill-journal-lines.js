/**
 * Backfill Script: Creates JournalEntryLines for all existing JournalEntries
 * that have no lines (due to the missing createEntry method bug).
 * 
 * For each JE, we look at its sourceModule and sourceId to determine
 * the correct debit/credit accounts and amounts from the source records.
 */
require("dotenv").config();
const { sequelize, JournalEntry, JournalEntryLine, ChartOfAccount, Booking, Payment, Expense } = require("../models");

async function backfill() {
  const t = await sequelize.transaction();
  
  try {
    // Get all JEs that have no lines
    const allJEs = await JournalEntry.findAll({
      include: [{ model: JournalEntryLine, as: "lines" }],
      transaction: t
    });
    
    const orphanJEs = allJEs.filter(je => !je.lines || je.lines.length === 0);
    console.log(`Found ${orphanJEs.length} JournalEntries with no lines (out of ${allJEs.length} total)`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const je of orphanJEs) {
      try {
        const { tenantId, environmentId, sourceModule, sourceId, bookingId } = je;
        
        // Find the accounts for this tenant/environment
        const getAccount = async (code) => {
          return ChartOfAccount.findOne({
            where: { code, tenantId, environmentId },
            transaction: t
          });
        };
        
        let debitAcct, creditAcct, amount;
        
        if (sourceModule === "Booking") {
          // Find the booking
          const booking = await Booking.findByPk(bookingId || sourceId, { transaction: t });
          if (!booking || !booking.totalAmount || booking.totalAmount <= 0) {
            skipped++;
            continue;
          }
          
          amount = booking.totalAmount;
          
          // Check if this is a GST entry (description contains "GST")
          if (je.description && je.description.toLowerCase().includes("gst")) {
            const gstAmount = Number(booking.taxes) || 0;
            if (gstAmount <= 0) { skipped++; continue; }
            amount = gstAmount;
            debitAcct = await getAccount("1005"); // Customer Outstanding
            creditAcct = await getAccount("2004"); // Taxes Payable
          } else {
            // Net revenue entry
            const gstAmount = Number(booking.taxes) || 0;
            amount = booking.totalAmount - gstAmount;
            if (amount <= 0) { amount = booking.totalAmount; } // fallback
            debitAcct = await getAccount("1005"); // Customer Outstanding
            creditAcct = await getAccount("3001"); // Hall Booking Income
          }
        } else if (sourceModule === "Payment") {
          const payment = await Payment.findByPk(sourceId, { transaction: t });
          if (!payment || !payment.amount || payment.amount <= 0) {
            skipped++;
            continue;
          }
          
          amount = payment.amount;
          const isCash = payment.paymentMode === "Cash";
          debitAcct = await getAccount(isCash ? "1001" : "1002"); // Cash or Bank
          creditAcct = await getAccount("1005"); // Customer Outstanding
        } else if (sourceModule === "Expense") {
          const expense = await Expense.findByPk(sourceId, { transaction: t });
          if (!expense || !expense.amount || expense.amount <= 0) {
            skipped++;
            continue;
          }
          
          amount = expense.amount;
          // Map expense category
          const categoryMap = {
            "Electricity": "4001",
            "Staff Salary": "4002", "Salary": "4002",
            "Cleaning": "4003",
            "Maintenance": "4004",
            "Marketing": "4005",
            "Fuel": "4006",
            "Office Expense": "4007", "Office": "4007",
          };
          const expenseCode = categoryMap[expense.category] || "4008";
          const isCash = !expense.paymentMode || expense.paymentMode === "Cash";
          
          debitAcct = await getAccount(expenseCode);
          creditAcct = await getAccount(isCash ? "1001" : "1002");
          
          // Fallback: if specific expense account doesn't exist, use generic
          if (!debitAcct) {
            debitAcct = await getAccount("4008"); // Misc Expense
          }
        } else {
          console.log(`  Skipping JE ${je.id} — unknown sourceModule: ${sourceModule}`);
          skipped++;
          continue;
        }
        
        if (!debitAcct || !creditAcct) {
          console.log(`  Skipping JE ${je.id} — missing accounts for ${sourceModule} (debit: ${debitAcct?.code}, credit: ${creditAcct?.code})`);
          skipped++;
          continue;
        }
        
        // Create the two lines
        await JournalEntryLine.create({
          journalEntryId: je.id,
          accountId: debitAcct.id,
          debit: amount,
          credit: 0,
          description: je.description
        }, { transaction: t });
        
        await JournalEntryLine.create({
          journalEntryId: je.id,
          accountId: creditAcct.id,
          debit: 0,
          credit: amount,
          description: je.description
        }, { transaction: t });
        
        // Also ensure JE status is Posted
        if (je.status !== "Posted") {
          await je.update({ status: "Posted", postedAt: je.createdAt }, { transaction: t });
        }
        
        created++;
      } catch (err) {
        console.error(`  Error processing JE ${je.id}:`, err.message);
        errors++;
      }
    }
    
    await t.commit();
    console.log(`\nBackfill complete:`);
    console.log(`  Created lines for: ${created} JEs`);
    console.log(`  Skipped: ${skipped} JEs`);
    console.log(`  Errors: ${errors} JEs`);
    
    // Verify
    const lineCount = await JournalEntryLine.count();
    console.log(`  Total JournalEntryLines now: ${lineCount}`);
    
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error("Backfill failed, rolling back:", err);
    process.exit(1);
  }
}

backfill();
