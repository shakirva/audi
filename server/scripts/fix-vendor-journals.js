require("dotenv").config({ path: "../.env" });
const sequelize = require("../db");
const { JournalEntry, JournalEntryLine, ChartOfAccount } = require("../models");

async function run() {
  const t = await sequelize.transaction();
  try {
    const entries = await JournalEntry.findAll({
      where: { sourceModule: ["VendorBill", "VendorPayment"] },
      include: [{ model: JournalEntryLine, as: "lines" }],
      transaction: t
    });

    console.log(`Found ${entries.length} vendor journal entries to fix.`);

    let fixedCount = 0;
    for (const entry of entries) {
      const coa1005 = await ChartOfAccount.findOne({ where: { code: "1005", tenantId: entry.tenantId, environmentId: entry.environmentId }, transaction: t });
      const coa3006 = await ChartOfAccount.findOne({ where: { code: "3006", tenantId: entry.tenantId, environmentId: entry.environmentId }, transaction: t });
      const coa1001 = await ChartOfAccount.findOne({ where: { code: "1001", tenantId: entry.tenantId, environmentId: entry.environmentId }, transaction: t });
      const coa1002 = await ChartOfAccount.findOne({ where: { code: "1002", tenantId: entry.tenantId, environmentId: entry.environmentId }, transaction: t });
      
      if (!coa1005 || !coa3006) {
        console.log(`Creating COA 1005 & 3006 for tenant ${entry.tenantId}...`);
        if (!coa1005) {
          await ChartOfAccount.create({ tenantId: entry.tenantId, environmentId: entry.environmentId, code: "1005", systemKey: "VENDOR_RECEIVABLE", name: "Vendor Receivable", type: "Asset", subType: "Current Asset", isSystem: true, isActive: true, openingBalance: 0 }, { transaction: t });
        }
        if (!coa3006) {
          await ChartOfAccount.create({ tenantId: entry.tenantId, environmentId: entry.environmentId, code: "3006", systemKey: "VENDOR_INCOME", name: "Vendor Royalty & Commission", type: "Income", subType: "Operating Income", isSystem: true, isActive: true, openingBalance: 0 }, { transaction: t });
        }
      }

      const c1005 = await ChartOfAccount.findOne({ where: { code: "1005", tenantId: entry.tenantId, environmentId: entry.environmentId }, transaction: t });
      const c3006 = await ChartOfAccount.findOne({ where: { code: "3006", tenantId: entry.tenantId, environmentId: entry.environmentId }, transaction: t });

      if (entry.sourceModule === "VendorBill") {
        const debitLine = entry.lines.find(l => parseFloat(l.debit) > 0);
        const creditLine = entry.lines.find(l => parseFloat(l.credit) > 0);
        if (debitLine && creditLine) {
          await debitLine.update({ accountId: c1005.id }, { transaction: t });
          await creditLine.update({ accountId: c3006.id }, { transaction: t });
          fixedCount++;
        }
      } else if (entry.sourceModule === "VendorPayment") {
        const debitLine = entry.lines.find(l => parseFloat(l.debit) > 0);
        const creditLine = entry.lines.find(l => parseFloat(l.credit) > 0);
        if (debitLine && creditLine) {
          const isCash = creditLine.accountId === coa1001?.id;
          const cashOrBankId = isCash ? coa1001.id : (coa1002?.id || coa1001.id);
          await debitLine.update({ accountId: cashOrBankId }, { transaction: t });
          await creditLine.update({ accountId: c1005.id }, { transaction: t });
          fixedCount++;
        }
      }
    }

    await t.commit();
    console.log(`Successfully fixed ${fixedCount} vendor journals.`);
  } catch (err) {
    await t.rollback();
    console.error("Failed:", err);
  } finally {
    process.exit(0);
  }
}
run();
