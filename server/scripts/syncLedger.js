require("dotenv").config({ path: __dirname + "/../.env" });
const { Sequelize } = require("sequelize");
const sequelize = require("../db");
const { Tenant, Environment, Booking, Payment, ChartOfAccount, JournalEntry } = require("../models");
const accountingEngine = require("../services/accountingEngine.service");

// Default Chart of Accounts to seed with systemKeys
const defaultAccounts = [
  { code: "1100", systemKey: "CASH_IN_HAND", name: "Cash in Hand", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1200", systemKey: "BANK_ACCOUNT", name: "Bank Account", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1300", systemKey: "ACCOUNTS_RECEIVABLE", name: "Accounts Receivable", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "2100", systemKey: "ACCOUNTS_PAYABLE", name: "Accounts Payable", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2200", systemKey: "CUSTOMER_ADVANCES", name: "Customer Advances", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2300", systemKey: "TAXES_PAYABLE", name: "Taxes Payable", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "3100", systemKey: "OWNER_CAPITAL", name: "Owner's Capital", type: "Equity", subType: "Capital", isSystem: true },
  { code: "3200", systemKey: "RETAINED_EARNINGS", name: "Retained Earnings", type: "Equity", subType: "Reserves", isSystem: true },
  { code: "4100", systemKey: "HALL_BOOKING_REVENUE", name: "Hall Booking Revenue", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "4200", systemKey: "DECORATION_REVENUE", name: "Decoration Revenue", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "5100", systemKey: "STAFF_SALARIES", name: "Staff Salaries", type: "Expense", subType: "Payroll", isSystem: true },
  { code: "5200", systemKey: "CLEANING_EXPENSE", name: "Cleaning Expense", type: "Expense", subType: "Operating Expense", isSystem: true },
  { code: "5300", systemKey: "GENERAL_EXPENSE", name: "General Expense", type: "Expense", subType: "Operating Expense", isSystem: true }
];

async function seedChartOfAccounts(tenantId, environmentId, transaction) {
  for (const acct of defaultAccounts) {
    const existing = await ChartOfAccount.findOne({ where: { tenantId, environmentId, code: acct.code }, transaction });
    if (existing) {
      await existing.update({ systemKey: acct.systemKey, type: acct.type, subType: acct.subType }, { transaction });
    } else {
      await ChartOfAccount.create({
        ...acct,
        tenantId,
        environmentId
      }, { transaction });
    }
  }
}

async function syncLedger() {
  console.log("Starting Ledger Synchronization...");
  
  try {
    const tenants = await Tenant.findAll();

    for (const tenant of tenants) {
      const environments = await Environment.findAll({ where: { tenantId: tenant.id } });
      
      for (const env of environments) {
        console.log(`Processing Tenant: ${tenant.id} | Env: ${env.id}`);
        
        try {
          await sequelize.query(`ALTER TYPE "enum_ChartOfAccounts_type" ADD VALUE 'Equity';`);
        } catch (e) {
          // Ignore if it already exists
        }

        // Single massive transaction per environment
        const transaction = await sequelize.transaction();
        
        try {
          // 1. Seed COA
          await seedChartOfAccounts(tenant.id, env.id, transaction);
          console.log(" - Seeded Chart of Accounts.");

          // 2. Retro-actively post bookings
          const bookings = await Booking.findAll({ where: { tenantId: tenant.id, environmentId: env.id }, transaction });
          let newBookingJVs = 0;
          for (const booking of bookings) {
            if (booking.totalAmount > 0) {
              const res = await accountingEngine.recordBooking(booking.id, tenant.id, env.id, transaction);
              if (res) newBookingJVs++; // Engine handles idempotency check internally
            }
          }
          console.log(` - Posted ${newBookingJVs} legacy bookings to ledger.`);

          // 3. Retro-actively post payments
          const payments = await Payment.findAll({ where: { tenantId: tenant.id, environmentId: env.id, status: "Completed" }, transaction });
          let newPaymentJVs = 0;
          for (const payment of payments) {
            if (payment.amount > 0) {
              const res = await accountingEngine.recordPayment(payment.id, tenant.id, env.id, transaction);
              if (res) newPaymentJVs++;
            }
          }
          console.log(` - Posted ${newPaymentJVs} legacy payments to ledger.`);

          await transaction.commit();
          console.log(`✔ Successfully synced environment ${env.id}`);
        } catch (error) {
          await transaction.rollback();
          console.error(`✖ Failed to sync environment ${env.id}:`, error.message);
        }
      }
    }
    
    console.log("Ledger Synchronization Complete.");
    process.exit(0);
  } catch (error) {
    console.error("Critical Failure:", error);
    process.exit(1);
  }
}

syncLedger();
