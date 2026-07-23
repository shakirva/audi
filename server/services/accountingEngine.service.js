/**
 * Accounting Engine — Central service for all accounting operations.
 * All modules (Payments, Expenses, Bookings) call this engine to create
 * proper double-entry journal entries, vouchers, and update ledgers.
 */

const { ChartOfAccount, JournalEntry, Voucher, CashBook, BankBook, AccountStatement, Booking, Payment, Expense, Customer, sequelize } = require("../models");
const { Op } = require("sequelize");

// ── Default Chart of Accounts (seeded per tenant) ──
const DEFAULT_ACCOUNTS = [
  // Assets (1xxx)
  { code: "1001", name: "Cash Account", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1002", name: "Bank Account", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1003", name: "Petty Cash", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1004", name: "Advance Receivable", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1005", name: "Customer Outstanding", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1006", name: "Security Deposit", type: "Asset", subType: "Current Asset", isSystem: true },
  { code: "1007", name: "Fixed Assets", type: "Asset", subType: "Fixed Asset", isSystem: true },

  // Liabilities (2xxx)
  { code: "2001", name: "Customer Advances", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2002", name: "Vendor Payables", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2003", name: "Staff Salary Payable", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2004", name: "Taxes Payable", type: "Liability", subType: "Current Liability", isSystem: true },
  { code: "2005", name: "Refund Pending", type: "Liability", subType: "Current Liability", isSystem: true },

  // Income (3xxx)
  { code: "3001", name: "Hall Booking Income", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "3002", name: "Decoration Income", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "3003", name: "Catering Commission", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "3004", name: "Extra Services", type: "Income", subType: "Operating Income", isSystem: true },
  { code: "3005", name: "Misc Income", type: "Income", subType: "Other Income", isSystem: true },

  // Expenses (4xxx)
  { code: "4001", name: "Electricity", type: "Expense", subType: "Utility", isSystem: true },
  { code: "4002", name: "Staff Salary", type: "Expense", subType: "Payroll", isSystem: true },
  { code: "4003", name: "Cleaning", type: "Expense", subType: "Operational", isSystem: true },
  { code: "4004", name: "Maintenance", type: "Expense", subType: "Operational", isSystem: true },
  { code: "4005", name: "Marketing", type: "Expense", subType: "Operational", isSystem: true },
  { code: "4006", name: "Fuel", type: "Expense", subType: "Operational", isSystem: true },
  { code: "4007", name: "Office Expense", type: "Expense", subType: "Administrative", isSystem: true },
  { code: "4008", name: "Misc Expense", type: "Expense", subType: "Other", isSystem: true },
];

class AccountingEngine {

  // ═══════════════════════════════════
  // SEED CHART OF ACCOUNTS
  // ═══════════════════════════════════
  async seedChartOfAccounts({ tenantId, environmentId }) {
    const existing = await ChartOfAccount.count({ where: { tenantId, environmentId } });
    if (existing > 0) return; // Already seeded

    for (const acct of DEFAULT_ACCOUNTS) {
      await ChartOfAccount.create({ ...acct, tenantId, environmentId });
    }
    console.log(`[AccountingEngine] Seeded ${DEFAULT_ACCOUNTS.length} accounts for tenant ${tenantId}`);
  }

  // ═══════════════════════════════════
  // GET ACCOUNT BY CODE
  // ═══════════════════════════════════
  async getAccountByCode(code, { tenantId, environmentId }) {
    let account = await ChartOfAccount.findOne({ where: { code, tenantId, environmentId } });
    if (!account) {
      // Auto-seed if missing
      await this.seedChartOfAccounts({ tenantId, environmentId });
      account = await ChartOfAccount.findOne({ where: { code, tenantId, environmentId } });
    }
    return account;
  }

  // ═══════════════════════════════════
  // CREATE JOURNAL ENTRY + VOUCHER
  // ═══════════════════════════════════
  async createEntry({
    tenantId, environmentId,
    date, description,
    debitCode, creditCode,
    amount,
    voucherType, // "RV", "PV", "JV", "CV", "EV", "RFV"
    sourceModule, sourceId,
    customerId, bookingId,
    paymentMode, referenceNumber,
    notes, createdBy,
    transaction
  }) {
    const debitAccount = await this.getAccountByCode(debitCode, { tenantId, environmentId });
    const creditAccount = await this.getAccountByCode(creditCode, { tenantId, environmentId });

    if (!debitAccount || !creditAccount) {
      console.error(`[AccountingEngine] Account not found: debit=${debitCode} credit=${creditCode}`);
      return null;
    }

    // 1. Create Voucher
    const voucher = await Voucher.create({
      tenantId, environmentId,
      voucherType,
      date,
      description,
      amount,
      sourceModule, sourceId,
      customerId, bookingId,
      paymentMode, referenceNumber,
      notes, createdBy,
    }, { transaction });

    // 2. Create Journal Entry
    const journal = await JournalEntry.create({
      tenantId, environmentId,
      date,
      description,
      debitAccountId: debitAccount.id,
      creditAccountId: creditAccount.id,
      amount,
      sourceModule, sourceId,
      voucherId: voucher.id,
      customerId, bookingId,
      notes, createdBy,
    }, { transaction });

    return { voucher, journal };
  }

  // ═══════════════════════════════════
  // RECORD PAYMENT (called from payment.service.js)
  // ═══════════════════════════════════
  async onPaymentReceived(payment, { tenantId, environmentId, createdBy, transaction }) {
    const isCash = payment.paymentMode === "Cash";
    const debitCode = isCash ? "1001" : "1002"; // Cash or Bank
    const creditCode = "1005"; // Customer Outstanding

    await this.createEntry({
      tenantId, environmentId,
      date: payment.paymentDate || new Date(),
      description: `Payment Received #${payment.paymentNumber} - ${payment.paymentMode}`,
      debitCode,
      creditCode,
      amount: payment.amount,
      voucherType: "RV", // Receipt Voucher
      sourceModule: "Payment",
      sourceId: payment.id,
      customerId: payment.customerId,
      bookingId: payment.bookingId,
      paymentMode: payment.paymentMode,
      referenceNumber: payment.referenceNumber,
      createdBy,
      transaction,
    });
  }

  // ═══════════════════════════════════
  // RECORD EXPENSE (called from expense.service.js)
  // ═══════════════════════════════════
  async onExpenseCreated(expense, { tenantId, environmentId, createdBy, paymentMode, transaction }) {
    // Map expense category to account code
    const categoryMap = {
      "Electricity": "4001",
      "Staff Salary": "4002", "Salary": "4002",
      "Cleaning": "4003",
      "Maintenance": "4004",
      "Marketing": "4005",
      "Fuel": "4006",
      "Office Expense": "4007", "Office": "4007",
    };

    const expenseAccountCode = categoryMap[expense.category] || "4008"; // Default to Misc Expense
    const creditCode = (paymentMode === "Bank" || paymentMode === "UPI" || paymentMode === "Bank Transfer") ? "1002" : "1001";

    await this.createEntry({
      tenantId, environmentId,
      date: expense.date || new Date(),
      description: `Expense: ${expense.description}`,
      debitCode: expenseAccountCode,
      creditCode,
      amount: expense.amount,
      voucherType: "EV", // Expense Voucher
      sourceModule: "Expense",
      sourceId: expense.id,
      paymentMode: paymentMode || "Cash",
      createdBy,
      transaction,
    });
  }

  // ═══════════════════════════════════
  // RECORD BOOKING (customer outstanding)
  // ═══════════════════════════════════
  async onBookingCreated(booking, { tenantId, environmentId, createdBy, transaction }) {
    if (!booking.totalAmount || booking.totalAmount <= 0) return;

    await this.createEntry({
      tenantId, environmentId,
      date: new Date(),
      description: `Booking #${booking.bookingId} - ${booking.customerName}`,
      debitCode: "1005",  // Customer Outstanding (Asset - they owe us)
      creditCode: "3001", // Hall Booking Income
      amount: booking.totalAmount,
      voucherType: "JV", // Journal Voucher
      sourceModule: "Booking",
      sourceId: booking.id,
      customerId: booking.customerId,
      bookingId: booking.id,
      createdBy,
      transaction,
    });
  }

  // ═══════════════════════════════════
  // DASHBOARD AGGREGATIONS
  // ═══════════════════════════════════
  async getDashboard({ tenantId, environmentId }) {
    const scope = { tenantId, environmentId };

    // Cash balance
    const lastCash = await CashBook.findOne({
      where: scope, order: [["createdAt", "DESC"]]
    });
    const cashBalance = lastCash ? lastCash.balance : 0;

    // Bank balance
    const lastBank = await BankBook.findOne({
      where: scope, order: [["createdAt", "DESC"]]
    });
    const bankBalance = lastBank ? lastBank.balance : 0;

    // Today's range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    // Today's collection
    const todayCollection = await Payment.sum("amount", {
      where: { ...scope, status: "Completed", createdAt: { [Op.between]: [startOfDay, endOfDay] } }
    }) || 0;

    // Today's expenses
    const todayExpense = await Expense.sum("amount", {
      where: { ...scope, createdAt: { [Op.between]: [startOfDay, endOfDay] } }
    }) || 0;

    // Monthly range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyRevenue = await Payment.sum("amount", {
      where: { ...scope, status: "Completed", createdAt: { [Op.between]: [startOfMonth, endOfMonth] } }
    }) || 0;

    const monthlyExpense = await Expense.sum("amount", {
      where: { ...scope, createdAt: { [Op.between]: [startOfMonth, endOfMonth] } }
    }) || 0;

    // Outstanding
    const totalBookingAmount = await Booking.sum("totalAmount", {
      where: { ...scope, status: { [Op.notIn]: ["Cancelled", "Draft"] } }
    }) || 0;

    const totalCollected = await Payment.sum("amount", {
      where: { ...scope, status: "Completed" }
    }) || 0;

    const outstanding = totalBookingAmount - totalCollected;

    // Total transactions
    const totalJournals = await JournalEntry.count({ where: scope });
    const totalVouchers = await Voucher.count({ where: scope });

    // Recent transactions (last 20)
    const recentTransactions = await JournalEntry.findAll({
      where: scope,
      include: [
        { model: ChartOfAccount, as: "DebitAccount", attributes: ["code", "name", "type"] },
        { model: ChartOfAccount, as: "CreditAccount", attributes: ["code", "name", "type"] },
        { model: Customer, attributes: ["id", "name"], required: false },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    // Recent vouchers (last 10)
    const recentVouchers = await Voucher.findAll({
      where: scope,
      include: [{ model: Customer, attributes: ["id", "name"], required: false }],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    // Monthly chart data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const mRev = await Payment.sum("amount", {
        where: { ...scope, status: "Completed", createdAt: { [Op.between]: [d, mEnd] } }
      }) || 0;
      const mExp = await Expense.sum("amount", {
        where: { ...scope, createdAt: { [Op.between]: [d, mEnd] } }
      }) || 0;
      monthlyData.push({
        month: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        revenue: mRev,
        expense: mExp,
        profit: mRev - mExp,
      });
    }

    // Account balances from Chart of Accounts
    const accounts = await ChartOfAccount.findAll({ where: { ...scope, isActive: true } });
    const accountBalances = {};
    for (const acct of accounts) {
      const debits = await JournalEntry.sum("amount", { where: { ...scope, debitAccountId: acct.id } }) || 0;
      const credits = await JournalEntry.sum("amount", { where: { ...scope, creditAccountId: acct.id } }) || 0;

      if (acct.type === "Asset" || acct.type === "Expense") {
        accountBalances[acct.code] = { ...acct.toJSON(), balance: acct.openingBalance + debits - credits };
      } else {
        accountBalances[acct.code] = { ...acct.toJSON(), balance: acct.openingBalance + credits - debits };
      }
    }

    const totalAssets = Object.values(accountBalances).filter(a => a.type === "Asset").reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = Object.values(accountBalances).filter(a => a.type === "Liability").reduce((s, a) => s + a.balance, 0);
    const totalIncome = Object.values(accountBalances).filter(a => a.type === "Income").reduce((s, a) => s + a.balance, 0);
    const totalExpenses = Object.values(accountBalances).filter(a => a.type === "Expense").reduce((s, a) => s + a.balance, 0);

    return {
      summary: {
        cashBalance,
        bankBalance,
        totalBalance: cashBalance + bankBalance,
        totalAssets,
        totalLiabilities,
        netBalance: totalAssets - totalLiabilities,
        todayCollection,
        todayExpense,
        outstanding: outstanding > 0 ? outstanding : 0,
        monthlyRevenue,
        monthlyExpense,
        netProfit: monthlyRevenue - monthlyExpense,
        totalJournals,
        totalVouchers,
      },
      monthlyData,
      accountBalances: Object.values(accountBalances),
      recentTransactions,
      recentVouchers,
    };
  }

  // ═══════════════════════════════════
  // GENERAL LEDGER
  // ═══════════════════════════════════
  async getLedger({ tenantId, environmentId, accountCode, startDate, endDate, page = 1, limit = 50 }) {
    const where = { tenantId, environmentId };

    if (accountCode) {
      const account = await ChartOfAccount.findOne({ where: { code: accountCode, tenantId, environmentId } });
      if (account) {
        where[Op.or] = [{ debitAccountId: account.id }, { creditAccountId: account.id }];
      }
    }

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await JournalEntry.findAndCountAll({
      where,
      include: [
        { model: ChartOfAccount, as: "DebitAccount", attributes: ["code", "name", "type"] },
        { model: ChartOfAccount, as: "CreditAccount", attributes: ["code", "name", "type"] },
        { model: Customer, attributes: ["id", "name"], required: false },
        { model: Voucher, attributes: ["voucherNumber", "voucherType"], required: false },
      ],
      order: [["date", "DESC"], ["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return { data: rows, total: count, page, limit };
  }

  // ═══════════════════════════════════
  // VOUCHER LIST
  // ═══════════════════════════════════
  async getVouchers({ tenantId, environmentId, voucherType, startDate, endDate, page = 1, limit = 50 }) {
    const where = { tenantId, environmentId };
    if (voucherType) where.voucherType = voucherType;
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };

    const { count, rows } = await Voucher.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ["id", "name"], required: false },
        { model: Booking, attributes: ["id", "bookingId", "customerName"], required: false },
      ],
      order: [["date", "DESC"], ["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return { data: rows, total: count, page, limit };
  }

  // ═══════════════════════════════════
  // CUSTOMER LEDGER
  // ═══════════════════════════════════
  async getCustomerLedger(customerId, { tenantId, environmentId }) {
    const customer = await Customer.findOne({ where: { id: customerId, tenantId, environmentId } });
    if (!customer) return null;

    // Get all bookings for this customer
    const bookings = await Booking.findAll({
      where: { customerId, tenantId, environmentId, status: { [Op.notIn]: ["Draft", "Cancelled"] } },
      attributes: ["id", "bookingId", "totalAmount", "advance", "date", "eventType", "status"],
      order: [["createdAt", "DESC"]],
    });

    // Get all payments
    const payments = await Payment.findAll({
      where: { customerId, tenantId, environmentId },
      order: [["createdAt", "DESC"]],
    });

    // Get journal entries for this customer
    const journals = await JournalEntry.findAll({
      where: { customerId, tenantId, environmentId },
      include: [
        { model: ChartOfAccount, as: "DebitAccount", attributes: ["code", "name"] },
        { model: ChartOfAccount, as: "CreditAccount", attributes: ["code", "name"] },
      ],
      order: [["date", "DESC"]],
    });

    const totalBooked = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
    const totalPaid = payments.filter(p => p.status === "Completed").reduce((s, p) => s + p.amount, 0);

    return {
      customer: customer.toJSON(),
      totalBooked,
      totalPaid,
      outstanding: totalBooked - totalPaid,
      bookings,
      payments,
      journals,
    };
  }

  // ═══════════════════════════════════
  // PROFIT & LOSS
  // ═══════════════════════════════════
  async getProfitLoss({ tenantId, environmentId, startDate, endDate }) {
    const scope = { tenantId, environmentId };
    const dateFilter = startDate && endDate ? { createdAt: { [Op.between]: [startDate, endDate] } } : {};

    const incomeAccounts = await ChartOfAccount.findAll({ where: { ...scope, type: "Income" } });
    const expenseAccounts = await ChartOfAccount.findAll({ where: { ...scope, type: "Expense" } });

    const incomeItems = [];
    let totalIncome = 0;
    for (const acct of incomeAccounts) {
      const credits = await JournalEntry.sum("amount", { where: { ...scope, ...dateFilter, creditAccountId: acct.id } }) || 0;
      const debits = await JournalEntry.sum("amount", { where: { ...scope, ...dateFilter, debitAccountId: acct.id } }) || 0;
      const balance = credits - debits;
      if (balance !== 0) {
        incomeItems.push({ code: acct.code, name: acct.name, amount: balance });
        totalIncome += balance;
      }
    }

    const expenseItems = [];
    let totalExpenses = 0;
    for (const acct of expenseAccounts) {
      const debits = await JournalEntry.sum("amount", { where: { ...scope, ...dateFilter, debitAccountId: acct.id } }) || 0;
      const credits = await JournalEntry.sum("amount", { where: { ...scope, ...dateFilter, creditAccountId: acct.id } }) || 0;
      const balance = debits - credits;
      if (balance !== 0) {
        expenseItems.push({ code: acct.code, name: acct.name, amount: balance });
        totalExpenses += balance;
      }
    }

    return {
      income: incomeItems,
      totalIncome,
      expenses: expenseItems,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    };
  }

  // ═══════════════════════════════════
  // OUTSTANDING / BOOKING PAYMENTS REPORT
  // ═══════════════════════════════════
  async getOutstandingReport({ tenantId, environmentId, onlyOutstanding = false }) {
    const bookings = await Booking.findAll({
      where: { tenantId, environmentId, status: { [Op.notIn]: ["Draft", "Cancelled"] } },
      include: [{ model: Customer, attributes: ["id", "name", "phone"] }],
      attributes: ["id", "bookingId", "customerName", "totalAmount", "advance", "date", "eventType", "status", "customerId"],
      order: [["date", "DESC"]],
    });

    const results = [];
    for (const booking of bookings) {
      const totalPaid = await Payment.sum("amount", {
        where: { bookingId: booking.id, tenantId, environmentId, status: "Completed" }
      }) || 0;

      const outstanding = (booking.totalAmount || 0) - totalPaid;
      
      if (onlyOutstanding && outstanding <= 0) continue;

      results.push({
        id: booking.id,
        bookingId: booking.bookingId,
        customerName: booking.Customer?.name || booking.customerName,
        phone: booking.Customer?.phone || "",
        eventType: booking.eventType,
        date: booking.date,
        totalAmount: booking.totalAmount,
        totalPaid,
        outstanding: outstanding > 0 ? outstanding : 0,
        status: booking.status,
      });
    }

    return results;
  }
}

module.exports = new AccountingEngine();
