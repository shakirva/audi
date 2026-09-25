/**
 * Accounting Engine — Central service for all accounting operations.
 * All modules (Payments, Expenses, Bookings) call this engine to create
 * proper double-entry journal entries, vouchers, and update ledgers.
 */

const { ChartOfAccount, JournalEntry, JournalEntryLine, Voucher, CashBook, BankBook, AccountStatement, Booking, Payment, Expense, Customer, Receipt, FinancialPeriod } = require("../models");
const sequelize = require("../db");
const { Op } = require("sequelize");

class AccountingEngine {
  async initializeTenantCOA(tenantId, environmentId, transaction) {
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

    for (const acc of accountsList) {
      const exists = await ChartOfAccount.findOne({ where: { tenantId, environmentId, code: acc.code }, transaction });
      if (!exists) {
        await ChartOfAccount.create({ ...acc, tenantId, environmentId }, { transaction });
      }
    }
  }

  /**
   * Helper to ensure precise decimal math
   */
  _toDecimal(val) {
    return parseFloat(val).toFixed(2);
  }

  /**
   * Validates and posts a Journal Entry with multiple lines.
   * Enforces double-entry rule: SUM(Debit) must equal SUM(Credit).
   */
  async postJournal(data, transaction) {
    const {
      tenantId,
      environmentId,
      date,
      description,
      lines, // Array of { accountId, debit, credit, description }
      sourceModule,
      sourceId,
      bookingId,
      customerId,
      createdBy
    } = data;

    // 1. Idempotency Check: Prevent duplicate posting
    const existingEntry = await JournalEntry.findOne({
      where: { tenantId, environmentId, sourceModule, sourceId },
      transaction
    });
    if (existingEntry) {
      console.warn(`Idempotency check: Journal already exists for ${sourceModule} ID ${sourceId}, skipping.`);
      return existingEntry;
    }

    // 1.5 Period Lock Check
    const journalDate = date || new Date();
    await this.checkFinancialPeriod(journalDate, tenantId, environmentId, transaction);

    // 2. Validate double-entry
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new Error("Journal entry lines cannot have negative amounts.");
      }
      totalDebit += parseFloat(line.debit || 0);
      totalCredit += parseFloat(line.credit || 0);
    }

    if (this._toDecimal(totalDebit) !== this._toDecimal(totalCredit)) {
      throw new Error(`Unbalanced Journal Entry: Debits (${totalDebit}) do not equal Credits (${totalCredit}).`);
    }

    if (totalDebit <= 0) {
      throw new Error("Journal entry must have an amount greater than zero.");
    }

    // 3. Create Header
    const entry = await JournalEntry.create({
      tenantId,
      environmentId,
      date: date || new Date(),
      description,
      sourceModule,
      sourceId,
      bookingId,
      customerId,
      status: "Posted",
      postedAt: new Date(),
      createdBy
    }, { transaction });

    // 4. Create Lines
    for (const line of lines) {
      await JournalEntryLine.create({
        journalEntryId: entry.id,
        accountId: line.accountId,
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description || description
      }, { transaction });
    }

    return entry;
  }

  /**
   * Reverses a posted Journal Entry
   */
  async reverseJournal(journalEntryId, reversedBy, remarks, transaction) {
    const original = await JournalEntry.findByPk(journalEntryId, {
      include: [{ model: JournalEntryLine, as: 'lines' }],
      transaction
    });

    if (!original) throw new Error("Journal entry not found.");
    if (original.status !== "Posted") throw new Error(`Cannot reverse entry in status ${original.status}.`);

    // Period Lock Check
    const reversalDate = new Date();
    await this.checkFinancialPeriod(reversalDate, original.tenantId, original.environmentId, transaction);

    // 2. Create the Reversal Headers (swap debit and credit)
    const reversingLines = original.lines.map(line => ({
      accountId: line.accountId,
      debit: line.credit,
      credit: line.debit,
      description: `Reversal of ${original.journalNumber}`
    }));

    // Post reversal journal
    const reversal = await this.postJournal({
      tenantId: original.tenantId,
      environmentId: original.environmentId,
      description: `Reversal of ${original.journalNumber}: ${remarks}`,
      lines: reversingLines,
      sourceModule: "Refund", // or "Manual" based on context
      sourceId: original.sourceId,
      bookingId: original.bookingId,
      customerId: original.customerId,
      createdBy: reversedBy
    }, transaction);

    // Update original status
    await original.update({
      status: "Reversed",
      reversedAt: new Date(),
      reversedBy,
      remarks
    }, { transaction });

    return reversal;
  }

  /**
   * Helper to verify if the period is locked.
   */
  async checkFinancialPeriod(date, tenantId, environmentId, transaction) {
    const period = await FinancialPeriod.findOne({
      where: {
        tenantId,
        environmentId,
        startDate: { [Op.lte]: date },
        endDate: { [Op.gte]: date },
      },
      transaction
    });

    if (period && period.status === "Closed") {
      throw new Error(`PeriodClosedError: The financial period '${period.name}' is closed. No journals can be posted or reversed in this period.`);
    }
  }

  /**
   * Helper to fetch an account by System Key.
   */
  async getAccountByKey(tenantId, environmentId, systemKey, transaction) {
    const account = await ChartOfAccount.findOne({
      where: { tenantId, environmentId, systemKey },
      transaction
    });
    if (!account) throw new Error(`Chart of Account missing system key '${systemKey}'. Please check COA configuration.`);
    return account;
  }

  /**
   * Records a Booking Confirmation.
   * Debit: ACCOUNTS_RECEIVABLE
   * Credit: HALL_BOOKING_REVENUE
   */
  async recordBooking(bookingId, tenantId, environmentId, transaction) {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) throw new Error("Booking not found");
    if (booking.totalAmount <= 0) return;

    const receivableAcct = await this.getAccountByKey(tenantId, environmentId, "ACCOUNTS_RECEIVABLE", transaction);
    const revenueAcct = await this.getAccountByKey(tenantId, environmentId, "HALL_BOOKING_REVENUE", transaction);

    const lines = [
      { accountId: receivableAcct.id, debit: booking.totalAmount, credit: 0 },
      { accountId: revenueAcct.id, debit: 0, credit: booking.totalAmount }
    ];

    return await this.postJournal({
      tenantId,
      environmentId,
      date: new Date(),
      description: `Booking #${booking.bookingId} - ${booking.customerName}`,
      lines,
      sourceModule: "Booking",
      sourceId: bookingId,
      bookingId,
      customerId: booking.customerId,
      createdBy: booking.createdBy
    }, transaction);
  }

  /**
   * Helper: createEntry — bridges debitCode/creditCode shorthand to postJournal.
   * Used by onPaymentReceived, onExpenseCreated, onBookingCreated.
   */
  async createEntry({
    tenantId, environmentId, date, description,
    debitCode, creditCode, amount,
    voucherType, sourceModule, sourceId,
    customerId, bookingId, paymentMode, referenceNumber,
    createdBy, transaction
  }) {
    const debitAcct = await ChartOfAccount.findOne({
      where: { code: debitCode, tenantId, environmentId },
      transaction
    });
    const creditAcct = await ChartOfAccount.findOne({
      where: { code: creditCode, tenantId, environmentId },
      transaction
    });

    if (!debitAcct) throw new Error(`Chart of Account not found for code '${debitCode}'`);
    if (!creditAcct) throw new Error(`Chart of Account not found for code '${creditCode}'`);

    const lines = [
      { accountId: debitAcct.id, debit: amount, credit: 0 },
      { accountId: creditAcct.id, debit: 0, credit: amount }
    ];

    return await this.postJournal({
      tenantId,
      environmentId,
      date: date || new Date(),
      description,
      lines,
      sourceModule,
      sourceId,
      bookingId,
      customerId,
      createdBy
    }, transaction);
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
      bookingId: expense.bookingId,
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

    const gstAmount = Number(booking.taxes) || 0;
    const netRevenue = (booking.totalAmount || 0) - gstAmount;

    // 1. Customer owes us the full amount → recognize as revenue (net of GST)
    await this.createEntry({
      tenantId, environmentId,
      date: new Date(),
      description: `Booking #${booking.bookingId} - ${booking.customerName}`,
      debitCode: "1005",  // Customer Outstanding (Asset - they owe us)
      creditCode: "3001", // Hall Booking Income (net revenue only)
      amount: netRevenue,
      voucherType: "JV",
      sourceModule: "Booking",
      sourceId: booking.id,
      bookingId: booking.id,
      createdBy,
      transaction,
    });

    // 2. If GST exists, record GST portion as a liability (owed to government)
    if (gstAmount > 0) {
      await this.createEntry({
        tenantId, environmentId,
        date: new Date(),
        description: `GST on Booking #${booking.bookingId} - ${booking.customerName}`,
        debitCode: "1005",  // Customer Outstanding (they pay GST too)
        creditCode: "2004", // Taxes Payable (GST liability to government)
        amount: gstAmount,
        voucherType: "JV",
        sourceModule: "Booking",
        sourceId: booking.id,
        customerId: booking.customerId,
        bookingId: booking.id,
        createdBy,
        transaction,
      });
    }
  }

  /**
   * Records a Payment Collection.
   * Debit: Cash/Bank
   * Credit: Customer Outstanding
   */
  async recordPayment(paymentId, tenantId, environmentId, transaction) {
    const payment = await Payment.findByPk(paymentId, { transaction });
    if (!payment) throw new Error("Payment not found");
    if (payment.amount <= 0) return;

    const isCash = payment.paymentMode === "Cash";
    const debitCode = isCash ? "1001" : "1002"; // Cash or Bank
    const creditCode = "1005"; // Customer Outstanding

    const debitAcct = await ChartOfAccount.findOne({ where: { code: debitCode, tenantId, environmentId }, transaction });
    const creditAcct = await ChartOfAccount.findOne({ where: { code: creditCode, tenantId, environmentId }, transaction });

    if (!debitAcct || !creditAcct) {
      console.warn(`[AccountingEngine] Missing COA for payment: debit=${debitCode}, credit=${creditCode}`);
      return;
    }

    const lines = [
      { accountId: debitAcct.id, debit: payment.amount, credit: 0 },
      { accountId: creditAcct.id, debit: 0, credit: payment.amount }
    ];

    await this.postJournal({
      tenantId,
      environmentId,
      description: `Payment received via ${payment.paymentMode}`,
      lines,
      sourceModule: "Payment",
      sourceId: payment.id,
      bookingId: payment.bookingId,
      customerId: payment.customerId,
      createdBy: payment.createdBy
    }, transaction);
  }

  /**
   * Records an Expense linked to a booking.
   * Debit: Expense Account
   * Credit: Cash/Bank
   */
  async recordExpense(expenseId, tenantId, environmentId, transaction) {
    const expense = await Expense.findByPk(expenseId, { transaction });
    if (!expense) throw new Error("Expense not found");
    if (expense.amount <= 0) return;

    const isCash = !expense.paymentMode || expense.paymentMode === "Cash";
    const creditCode = isCash ? "1001" : "1002";
    
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
    const debitCode = categoryMap[expense.category] || "4008";

    const debitAcct = await ChartOfAccount.findOne({ where: { code: debitCode, tenantId, environmentId }, transaction });
    const creditAcct = await ChartOfAccount.findOne({ where: { code: creditCode, tenantId, environmentId }, transaction });

    if (!debitAcct || !creditAcct) {
      console.warn(`[AccountingEngine] Missing COA for expense: debit=${debitCode}, credit=${creditCode}`);
      return;
    }

    const lines = [
      { accountId: debitAcct.id, debit: expense.amount, credit: 0 },
      { accountId: creditAcct.id, debit: 0, credit: expense.amount }
    ];

    await this.postJournal({
      tenantId,
      environmentId,
      description: `Expense: ${expense.title || expense.description}`,
      lines,
      sourceModule: "Expense",
      sourceId: expense.id,
      bookingId: expense.bookingId,
      createdBy: expense.createdBy
    }, transaction);
  }

  async cancelBooking(bookingId, userId, remarks, tenantId, environmentId, transaction) {
    const entry = await JournalEntry.findOne({ where: { sourceModule: "Booking", sourceId: bookingId, status: "Posted" }, transaction });
    if (entry) await this.reverseJournal(entry.id, userId, remarks, transaction);
  }

  async reversePayment(paymentId, userId, remarks, tenantId, environmentId, transaction) {
    const entry = await JournalEntry.findOne({ where: { sourceModule: "Payment", sourceId: paymentId, status: "Posted" }, transaction });
    if (entry) await this.reverseJournal(entry.id, userId, remarks, transaction);
  }
  
  async reverseExpense(expenseId, userId, remarks, tenantId, environmentId, transaction) {
    const entry = await JournalEntry.findOne({ where: { sourceModule: "Expense", sourceId: expenseId, status: "Posted" }, transaction });
    if (entry) await this.reverseJournal(entry.id, userId, remarks, transaction);
  }

  async recordRefund(refund, tenantId, environmentId, transaction) {
    const isCash = refund.paymentMode === "Cash";
    const assetKey = isCash ? "CASH_IN_HAND" : "BANK_ACCOUNT";
    const assetAcct = await this.getAccountByKey(tenantId, environmentId, assetKey, transaction);
    const receivableAcct = await this.getAccountByKey(tenantId, environmentId, "ACCOUNTS_RECEIVABLE", transaction);

    const lines = [
      { accountId: receivableAcct.id, debit: refund.amount, credit: 0 },
      { accountId: assetAcct.id, debit: 0, credit: refund.amount }
    ];

    await this.postJournal({
      tenantId, environmentId, date: refund.date,
      description: `Refund: ${refund.remarks || ''}`, lines,
      sourceModule: "Refund", sourceId: refund.id,
      bookingId: refund.bookingId, customerId: refund.customerId,
      createdBy: refund.createdBy
    }, transaction);
  }

  async recordAdjustment(data, transaction) {
    // Validates and posts a manual adjustment journal
    data.sourceModule = "Adjustment";
    data.sourceId = data.sourceId || Date.now();
    await this.postJournal(data, transaction);
  }

  // ═══════════════════════════════════
  // VENDOR BILL (records expense + liability)
  // ═══════════════════════════════════
  async onVendorBillCreated(bill, vendor, { tenantId, environmentId, createdBy, transaction }) {
    if (!bill.amount || bill.amount <= 0) return;

    // Debit: Misc Expense (4008) — vendor cost is an expense
    // Credit: Vendor Payable (2005) — we owe the vendor
    await this.createEntry({
      tenantId, environmentId,
      date: bill.date || new Date(),
      description: `Vendor Bill #${bill.billNumber} — ${vendor.name}`,
      debitCode: "4008",   // Miscellaneous Expense
      creditCode: "2005",  // Vendor Payable (Accounts Payable)
      amount: parseFloat(bill.amount),
      voucherType: "EV",   // Expense Voucher
      sourceModule: "VendorBill",
      sourceId: bill.id,
      createdBy,
      transaction,
    });
  }

  // ═══════════════════════════════════
  // VENDOR PAYMENT (reduces liability, money goes out)
  // ═══════════════════════════════════
  async onVendorPaymentMade(payment, vendor, { tenantId, environmentId, createdBy, transaction }) {
    if (!payment.amount || payment.amount <= 0) return;

    // paymentMode determines which account the money leaves from
    const isCash = payment.paymentMode === "Cash";
    const creditCode = isCash ? "1001" : "1002"; // Cash in Hand OR Bank Account

    // Debit: Vendor Payable (2005) — reduce what we owe the vendor
    // Credit: Cash (1001) or Bank (1002) — money going out
    await this.createEntry({
      tenantId, environmentId,
      date: payment.date || new Date(),
      description: `Vendor Payment #${payment.paymentNumber} — ${vendor.name} via ${payment.paymentMode}`,
      debitCode: "2005",   // Vendor Payable
      creditCode,          // Cash or Bank
      amount: parseFloat(payment.amount),
      voucherType: "PV",   // Payment Voucher
      sourceModule: "VendorPayment",
      sourceId: payment.id,
      paymentMode: payment.paymentMode,
      referenceNumber: payment.referenceNumber,
      createdBy,
      transaction,
    });
  }

  // ═══════════════════════════════════
  // VENDOR REVERSALS
  // ═══════════════════════════════════
  async reverseVendorBill(billId, userId, remarks, tenantId, environmentId, transaction) {
    const entry = await JournalEntry.findOne({ where: { sourceModule: "VendorBill", sourceId: billId, status: "Posted" }, transaction });
    if (entry) await this.reverseJournal(entry.id, userId, remarks, transaction);
  }

  async reverseVendorPayment(paymentId, userId, remarks, tenantId, environmentId, transaction) {
    const entry = await JournalEntry.findOne({ where: { sourceModule: "VendorPayment", sourceId: paymentId, status: "Posted" }, transaction });
    if (entry) await this.reverseJournal(entry.id, userId, remarks, transaction);
  }

  // ── BOOKING FINANCIAL SUMMARY METHODS ──

  async getBookingSummary(bookingId, tenantId, environmentId, transaction) {
    const entries = await JournalEntry.findAll({
      where: { bookingId, tenantId, environmentId, status: "Posted" },
      transaction,
      include: [{
        model: JournalEntryLine,
        as: "lines",
        include: [{ model: ChartOfAccount, as: "account" }]
      }]
    });

    let revenue = 0;
    let expense = 0;
    let collected = 0;

    entries.forEach(entry => {
      entry.lines.forEach(line => {
        const type = line.account.type;
        const subType = line.account.subType;
        const amtDebit = parseFloat(line.debit);
        const amtCredit = parseFloat(line.credit);

        if (type === "Income") {
          revenue += (amtCredit - amtDebit);
        }
        if (type === "Expense") {
          expense += (amtDebit - amtCredit);
        }
        // If it hit Cash/Bank, and it came from a Payment module (i.e. we collected it)
        if (type === "Asset" && (line.account.systemKey === "CASH_IN_HAND" || line.account.systemKey === "BANK_ACCOUNT")) {
          // If Debit, money came in. If Credit, money went out (e.g., refund).
          if (entry.sourceModule === "Payment") collected += amtDebit;
          if (entry.sourceModule === "Refund") collected -= amtCredit;
        }
      });
    });

    return {
      totalRevenue: revenue,
      totalCollected: collected,
      outstanding: revenue - collected,
      totalExpenses: expense,
      netProfit: revenue - expense
    };
  }
  // ── POLYFILL REPORTING METHODS FOR PHASE 1 ──
  // These return safe default values/computations to prevent UI crashes 
  // until the new JournalEntryLine architecture is fully wired into the reporting dashboards in Phase 2.

  async getDashboard({ tenantId, environmentId }) {
    const { sequelize, ChartOfAccount, JournalEntry, JournalEntryLine } = require("../models");
    const { Op } = require("sequelize");
    
    // Aggregation Query to sum debits and credits by account systemKey and type
    const query = `
      SELECT 
        c."code", 
        c."type",
        COALESCE(SUM(l.debit), 0) as "totalDebit",
        COALESCE(SUM(l.credit), 0) as "totalCredit"
      FROM "JournalEntryLines" l
      JOIN "ChartOfAccounts" c ON l."accountId" = c.id
      JOIN "JournalEntries" j ON l."journalEntryId" = j.id
      WHERE j."tenantId" = :tenantId 
        AND j."environmentId" = :environmentId
        AND j.status = 'Posted'
      GROUP BY c."code", c."type"
    `;

    const balances = await sequelize.query(query, {
      replacements: { tenantId, environmentId },
      type: sequelize.QueryTypes.SELECT
    });

    let cashBalance = 0;
    let bankBalance = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    let outstandingReceivables = 0;

    balances.forEach(b => {
      const debit = parseFloat(b.totalDebit);
      const credit = parseFloat(b.totalCredit);
      
      if (b.code === "1001") cashBalance = debit - credit;
      if (b.code === "1002") bankBalance = debit - credit;
      if (b.code === "1005") outstandingReceivables = debit - credit;
      
      if (b.type === "Income") totalRevenue += (credit - debit);
      if (b.type === "Expense") totalExpenses += (debit - credit);
    });

    // Today's collections
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayQuery = `
      SELECT COALESCE(SUM(l.debit), 0) as "todayCollection"
      FROM "JournalEntryLines" l
      JOIN "ChartOfAccounts" c ON l."accountId" = c.id
      JOIN "JournalEntries" j ON l."journalEntryId" = j.id
      WHERE j."tenantId" = :tenantId 
        AND j."environmentId" = :environmentId
        AND j.status = 'Posted'
        AND j."sourceModule" = 'Payment'
        AND j."date" >= :startOfDay
        AND c."type" = 'Asset'
        AND c."code" IN ('1001', '1002')
    `;

    const [{ todayCollection }] = await sequelize.query(todayQuery, {
      replacements: { tenantId, environmentId, startOfDay },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate Lifetime Collections directly from payments for accurate KPI
    const lifetimeCollectionsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN "paymentMode" = 'Cash' THEN amount ELSE 0 END), 0) as "cashCollected",
        COALESCE(SUM(CASE WHEN "paymentMode" IN ('UPI', 'Bank Transfer', 'Card') THEN amount ELSE 0 END), 0) as "bankCollected"
      FROM "Payments"
      WHERE "tenantId" = :tenantId AND "environmentId" = :environmentId AND status = 'Completed' AND "deletedAt" IS NULL
    `;

    const [{ cashCollected, bankCollected }] = await sequelize.query(lifetimeCollectionsQuery, {
      replacements: { tenantId, environmentId },
      type: sequelize.QueryTypes.SELECT
    });

    return {
      summary: {
        cashBalance,
        bankBalance,
        totalBalance: cashBalance + bankBalance,
        cashCollected: parseFloat(cashCollected),
        bankCollected: parseFloat(bankCollected),
        outstandingReceivables,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        todayCollection: parseFloat(todayCollection)
      },
      recentTransactions: await JournalEntry.findAll({
        where: { tenantId, environmentId, status: "Posted" },
        order: [["date", "DESC"], ["createdAt", "DESC"]],
        limit: 10,
        attributes: ["journalNumber", "date", "description", "sourceModule", "sourceId"]
      })
    };
  }

  // ═══════════════════════════════════
  // GENERAL LEDGER
  // ═══════════════════════════════════
  async getLedger({ tenantId, environmentId, accountCode, customerId, startDate, endDate, page = 1, limit = 50 }) {
    const { sequelize } = require("../models");
    const where = { tenantId, environmentId, status: "Posted" };

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }
    
    if (customerId) {
      where.customerId = customerId;
    }

    const includeConfig = [
      { 
        model: JournalEntryLine, as: "lines", 
        include: [{ model: ChartOfAccount, as: "account", attributes: ["code", "name", "type"] }],
        ...(accountCode ? { where: { '$lines.account.code$': accountCode }, required: true } : {})
      },
      { model: Customer, attributes: ["id", "name"], required: false },
    ];

    // If filtering by account code, find matching journal entries through lines
    if (accountCode) {
      const account = await ChartOfAccount.findOne({ where: { code: accountCode, tenantId, environmentId } });
      if (account) {
        // Find journal entry IDs that have lines with this account
        const journalIds = await JournalEntryLine.findAll({
          where: { accountId: account.id },
          attributes: ['journalEntryId'],
          raw: true
        });
        const ids = journalIds.map(j => j.journalEntryId);
        if (ids.length > 0) {
          where.id = { [Op.in]: ids };
        } else {
          return { data: [], total: 0, page, limit };
        }
      }
    }

    const { count, rows } = await JournalEntry.findAndCountAll({
      where,
      include: [
        { model: JournalEntryLine, as: "lines", include: [{ model: ChartOfAccount, as: "account", attributes: ["code", "name", "type"] }] },
        { model: Customer, attributes: ["id", "name"], required: false },
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
    const where = { tenantId, environmentId, status: "Posted" };
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };

    const { count, rows } = await JournalEntry.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ["id", "name"], required: false },
        { model: Booking, attributes: ["id", "bookingId", "customerName"], required: false },
        { model: JournalEntryLine, as: 'lines', attributes: ["debit"] }
      ],
      order: [["date", "DESC"], ["createdAt", "DESC"]],
      limit: voucherType ? undefined : limit,
      offset: voucherType ? undefined : (page - 1) * limit,
    });

    const mappedRows = rows.map(entry => {
      const amount = entry.lines ? entry.lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0) : 0;
      
      let vType = "JV";
      if (entry.sourceModule === "Payment") vType = "RV";
      else if (entry.sourceModule === "Expense" || entry.sourceModule === "VendorBill") vType = "EV";
      else if (entry.sourceModule === "VendorPayment") vType = "PV";
      else if (entry.sourceModule === "Refund") vType = "RFV";

      return {
        id: entry.id,
        voucherNumber: entry.journalNumber,
        voucherType: vType,
        date: entry.date,
        createdAt: entry.createdAt,
        description: entry.description,
        sourceModule: entry.sourceModule,
        sourceId: entry.sourceId,
        amount,
        status: entry.status,
        Customer: entry.Customer,
        Booking: entry.Booking
      };
    });

    if (voucherType) {
       const filteredRows = mappedRows.filter(r => r.voucherType === voucherType);
       return { 
         data: filteredRows.slice((page - 1) * limit, page * limit), 
         total: filteredRows.length, 
         page, 
         limit 
       };
    }

    return { data: mappedRows, total: count, page, limit };
  }

  async deleteVoucher(id, { tenantId, environmentId }) {
    // Vouchers map to JournalEntries now
    const entry = await JournalEntry.findOne({ where: { id, tenantId, environmentId } });
    if (!entry) throw new Error("Journal Entry not found");
    
    // If it was auto-generated from a Payment, delete the Payment
    if (entry.sourceModule === 'Payment' && entry.sourceId) {
      const paymentService = require("./payment.service");
      try {
        await paymentService.removePayment(entry.sourceId, { tenantId, environmentId });
        return { success: true, message: "Associated payment and journal deleted" };
      } catch (e) {
        console.warn("[AccountingEngine] Payment already deleted or error:", e.message);
      }
    }

    // If it was auto-generated from an Expense, delete the Expense
    if (entry.sourceModule === 'Expense' && entry.sourceId) {
      const expenseService = require("./expense.service");
      try {
        await expenseService.deleteExpense(entry.sourceId, { tenantId, environmentId });
        return { success: true, message: "Associated expense and journal deleted" };
      } catch (e) {
        console.warn("[AccountingEngine] Expense already deleted or error:", e.message);
      }
    }

    // Fallback: Just reverse/delete the journal
    const { sequelize } = require("../models");
    const t = await sequelize.transaction();
    try {
      const JournalEntryLine = require("../models/JournalEntryLine");
      await JournalEntryLine.destroy({
        where: { journalEntryId: entry.id },
        transaction: t
      });
      await entry.destroy({ transaction: t });
      
      await t.commit();
      return { success: true };
    } catch (error) {
      await t.rollback();
      throw error;
    }
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
        { model: JournalEntryLine, as: "lines", include: [{ model: ChartOfAccount, as: "account", attributes: ["code", "name", "type"] }] },
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
  // BOOKING LEDGER (FINANCIAL CENTER)
  // ═══════════════════════════════════
  async getBookingLedger(bookingIdParam, { tenantId, environmentId }) {
    const { Op } = require("sequelize");
    const whereCondition = isNaN(bookingIdParam) 
      ? { bookingId: bookingIdParam, tenantId, environmentId }
      : { id: bookingIdParam, tenantId, environmentId };

    const booking = await Booking.findOne({ 
      where: whereCondition,
      include: [{ model: Customer, attributes: ["id", "name", "phone", "email"] }]
    });
    if (!booking) return null;

    const realBookingId = booking.id;

    // Get all payments for this booking
    const payments = await Payment.findAll({
      where: { bookingId: realBookingId, tenantId, environmentId },
      include: [{ model: Receipt, attributes: ["receiptNumber"] }],
      order: [["createdAt", "DESC"]],
    });

    // Get all expenses for this booking
    const expenses = await Expense.findAll({
      where: { bookingId: realBookingId, tenantId, environmentId },
      order: [["createdAt", "DESC"]],
    });

    // Get journal entries for this booking
    const journals = await JournalEntry.findAll({
      where: { bookingId: realBookingId, tenantId, environmentId },
      include: [
        { model: JournalEntryLine, as: "lines", include: [{ model: ChartOfAccount, as: "account", attributes: ["code", "name", "type"] }] },
      ],
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    const totalPaid = payments.filter(p => p.status === "Completed").reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const outstanding = (booking.totalAmount || 0) - totalPaid;
    const gstAmount = Number(booking.taxes) || 0;
    const netRevenue = (booking.totalAmount || 0) - gstAmount; // What owner actually earns
    const netProfit = netRevenue - totalExpenses;

    const mappedJournals = journals.map(j => {
      const json = j.toJSON();
      const debitLine = json.lines?.find(l => l.debit > 0);
      const creditLine = json.lines?.find(l => l.credit > 0);
      return {
        ...json,
        DebitAccount: debitLine ? debitLine.account : null,
        CreditAccount: creditLine ? creditLine.account : null,
        amount: debitLine ? debitLine.debit : (creditLine ? creditLine.credit : 0)
      };
    });

    return {
      booking: booking.toJSON(),
      totalPaid,
      totalExpenses,
      outstanding: outstanding > 0 ? outstanding : 0,
      gstAmount,
      netRevenue,
      netProfit,
      payments,
      expenses,
      journals: mappedJournals,
    };
  }

  // ═══════════════════════════════════
  // PROFIT & LOSS
  // ═══════════════════════════════════
  async getProfitLoss({ tenantId, environmentId, startDate, endDate }) {
    const { sequelize, Payment, Booking } = require("../models");
    const { Op } = require("sequelize");
    
    let dateClause = '';
    const replacements = { tenantId, environmentId };
    
    if (startDate && endDate) {
      dateClause = 'AND j."createdAt" BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    // ── ACCRUAL BASIS (from journal entries — full booking amounts) ──
    const query = `
      SELECT 
        c.code, c.name, c."type",
        COALESCE(SUM(l.debit), 0) as "totalDebit",
        COALESCE(SUM(l.credit), 0) as "totalCredit"
      FROM "JournalEntryLines" l
      JOIN "ChartOfAccounts" c ON l."accountId" = c.id
      JOIN "JournalEntries" j ON l."journalEntryId" = j.id
      WHERE j."tenantId" = :tenantId 
        AND j."environmentId" = :environmentId
        AND j.status = 'Posted'
        AND c."type" IN ('Income', 'Expense')
        ${dateClause}
      GROUP BY c.code, c.name, c."type"
      ORDER BY c.code
    `;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const incomeItems = [];
    let totalIncome = 0;
    const expenseItems = [];
    let totalExpenses = 0;

    results.forEach(row => {
      const debit = parseFloat(row.totalDebit);
      const credit = parseFloat(row.totalCredit);
      
      if (row.type === 'Income') {
        const balance = credit - debit;
        if (balance !== 0) {
          incomeItems.push({ code: row.code, name: row.name, amount: balance });
          totalIncome += balance;
        }
      } else if (row.type === 'Expense') {
        const balance = debit - credit;
        if (balance !== 0) {
          expenseItems.push({ code: row.code, name: row.name, amount: balance });
          totalExpenses += balance;
        }
      }
    });

    // ── CASH BASIS (from actual completed payments — real money received) ──
    const { VendorPayment } = require("../models");
    
    let paymentWhere = { tenantId, environmentId, status: "Completed" };
    if (startDate && endDate) {
      paymentWhere.paymentDate = { [Op.between]: [startDate, endDate] };
    }

    const totalReceived = await Payment.sum("amount", { where: paymentWhere }) || 0;

    // Get breakdown by payment mode
    const paymentsByMode = await Payment.findAll({
      where: paymentWhere,
      attributes: [
        "paymentMode",
        [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: ["paymentMode"],
      raw: true
    });

    // Get total booked amount (what customers owe)
    let bookingWhere = { tenantId, environmentId, status: { [Op.notIn]: ["Draft", "Cancelled"] } };
    if (startDate && endDate) {
      bookingWhere.date = { [Op.between]: [startDate, endDate] };
    }
    const totalBooked = await Booking.sum("totalAmount", { where: bookingWhere }) || 0;

    const totalOutstanding = totalBooked - totalReceived;

    // ── VENDOR PAYMENTS (income from vendors — e.g. catering teams paying auditorium) ──
    let vendorPaymentWhere = { tenantId, environmentId, status: "Completed" };
    if (startDate && endDate) {
      vendorPaymentWhere.date = { [Op.between]: [startDate, endDate] };
    }

    const totalVendorPayments = await VendorPayment.sum("amount", { where: vendorPaymentWhere }) || 0;

    // Get vendor payments breakdown by payment mode
    const vendorPaymentsByMode = await VendorPayment.findAll({
      where: vendorPaymentWhere,
      attributes: [
        "paymentMode",
        [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      group: ["paymentMode"],
      raw: true
    });

    // Vendor payments are INCOME (vendors pay the auditorium)
    const totalAllReceived = totalReceived + totalVendorPayments;

    // Merge vendor payment modes into customer payment modes for unified income display
    const allPaymentsByMode = [...paymentsByMode.map(p => ({
      mode: p.paymentMode,
      total: parseInt(p.total) || 0,
      count: parseInt(p.count) || 0
    }))];
    
    // Add vendor payments by mode (tagged separately)
    vendorPaymentsByMode.forEach(vp => {
      const existing = allPaymentsByMode.find(p => p.mode === vp.paymentMode);
      if (existing) {
        existing.total += parseInt(vp.total) || 0;
        existing.count += parseInt(vp.count) || 0;
      } else {
        allPaymentsByMode.push({
          mode: vp.paymentMode,
          total: parseInt(vp.total) || 0,
          count: parseInt(vp.count) || 0
        });
      }
    });

    return {
      // Accrual basis (journal ledgers)
      income: incomeItems,
      totalIncome,
      expenses: expenseItems,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      // Cash basis (actual payments + vendor income)
      cashBasis: {
        totalReceived: totalAllReceived,
        totalCustomerReceived: totalReceived,
        totalVendorReceived: totalVendorPayments,
        totalBooked,
        totalOutstanding,
        paymentsByMode: allPaymentsByMode,
        vendorPaymentsByMode: vendorPaymentsByMode.map(p => ({
          mode: p.paymentMode,
          total: parseInt(p.total) || 0,
          count: parseInt(p.count) || 0
        })),
        netCashProfit: totalAllReceived - totalExpenses,
      }
    };
  }

  // ═══════════════════════════════════
  // OUTSTANDING / BOOKING PAYMENTS REPORT
  // ═══════════════════════════════════
  async getOutstandingReport({ tenantId, environmentId, onlyOutstanding = false }) {
    const { Op } = require("sequelize");
    const { Booking, Payment, Customer } = require("../models");
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
