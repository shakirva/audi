require("dotenv").config({ path: __dirname + "/../.env" });
const { Sequelize } = require("sequelize");
const sequelize = require("../db");
const { Tenant, Environment, Booking, Payment, Expense, ChartOfAccount, JournalEntry } = require("../models");
const accountingEngine = require("../services/accountingEngine.service");

const accountsList = [
  { code: "1001", name: "Cash in Hand", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1002", name: "Bank Account", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1003", name: "Petty Cash", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1004", name: "UPI / Online Payments", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1005", name: "Customer Outstanding", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1006", name: "Inventory / Stock", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1007", name: "Fixed Assets", type: "Asset", subType: "Fixed Asset", isSystem: true },
  { code: "2001", name: "Customer Advances", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2002", name: "Vendor Payables", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2003", name: "Staff Salary Payable", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2004", name: "Taxes Payable", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2005", name: "Refund Pending", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "3001", name: "Hall Booking Income", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "3002", name: "Decoration Income", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "3003", name: "Catering Commission", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "3004", name: "Extra Services", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "3005", name: "Misc Income", type: "Income", subType: "Other Income", isSystem: true },
  { code: "4001", name: "Electricity", type: "Expense", subType: "Utility", isSystem: true },
  { code: "4002", name: "Staff Salary", type: "Expense", subType: "Payroll", isSystem: true },
  { code: "4003", name: "Cleaning", type: "Expense", subType: "Operational", isSystem: true },
  { code: "4004", name: "Maintenance", type: "Expense", subType: "Operational", isSystem: true },
  { code: "4005", name: "Marketing", type: "Expense", subType: "Operational", isSystem: true },
  { code: "4006", name: "Fuel", type: "Expense", subType: "Operational", isSystem: true },
  { code: "4007", name: "Office Expense", type: "Expense", subType: "Administrative", isSystem: true },
  { code: "4008", name: "Misc Expense", type: "Expense", subType: "Other", isSystem: true }
];

async function run() {
  try {
    const tenant = await Tenant.findOne({ where: { slug: "shakir" } });
    if (!tenant) {
      console.error("Tenant not found");
      process.exit(1);
    }
    const env = await Environment.findOne({ where: { tenantId: tenant.id } });

    const transaction = await sequelize.transaction();

    try {
      console.log("Seeding accounts...");
      for (const acc of accountsList) {
        const exists = await ChartOfAccount.findOne({ where: { tenantId: tenant.id, environmentId: env.id, code: acc.code }, transaction });
        if (!exists) {
          await ChartOfAccount.create({ ...acc, tenantId: tenant.id, environmentId: env.id }, { transaction });
        }
      }
      console.log("Accounts seeded.");

      // Post bookings
      const bookings = await Booking.findAll({ where: { tenantId: tenant.id, environmentId: env.id }, transaction });
      console.log(`Found ${bookings.length} bookings`);
      for (const booking of bookings) {
        if (booking.totalAmount > 0) {
          const entry = await JournalEntry.findOne({ where: { sourceModule: "Booking", sourceId: booking.id, status: "Posted" }, transaction });
          if (!entry) {
            await accountingEngine.onBookingCreated(booking, { tenantId: tenant.id, environmentId: env.id, createdBy: null, transaction });
          }
        }
      }

      // Post payments
      const payments = await Payment.findAll({ where: { tenantId: tenant.id, environmentId: env.id, status: "Completed" }, transaction });
      console.log(`Found ${payments.length} payments`);
      for (const payment of payments) {
        if (payment.amount > 0) {
          const entry = await JournalEntry.findOne({ where: { sourceModule: "Payment", sourceId: payment.id, status: "Posted" }, transaction });
          if (!entry) {
            await accountingEngine.onPaymentReceived(payment, { tenantId: tenant.id, environmentId: env.id, createdBy: null, transaction });
          }
        }
      }
      
      // Post expenses
      const expenses = await Expense.findAll({ where: { tenantId: tenant.id, environmentId: env.id }, transaction });
      console.log(`Found ${expenses.length} expenses`);
      for (const expense of expenses) {
        if (expense.amount > 0) {
          const entry = await JournalEntry.findOne({ where: { sourceModule: "Expense", sourceId: expense.id, status: "Posted" }, transaction });
          if (!entry) {
            await accountingEngine.onExpenseCreated(expense, { tenantId: tenant.id, environmentId: env.id, createdBy: null, paymentMode: expense.paymentMode, transaction });
          }
        }
      }

      await transaction.commit();
      console.log("Success! COA seeded and journals posted.");
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
