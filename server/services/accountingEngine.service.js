/**
 * Accounting Engine — Central service for all accounting operations.
 * All modules (Payments, Expenses, Bookings) call this engine to create
 * proper double-entry journal entries, vouchers, and update ledgers.
 */

const { ChartOfAccount, JournalEntry, JournalEntryLine, Voucher, CashBook, BankBook, AccountStatement, Booking, Payment, Expense, Customer, Receipt, FinancialPeriod } = require("../models");
const sequelize = require("../db");
const { Op } = require("sequelize");

class AccountingEngine {
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
        c."systemKey", 
        c."type",
        COALESCE(SUM(l.debit), 0) as "totalDebit",
        COALESCE(SUM(l.credit), 0) as "totalCredit"
      FROM "JournalEntryLines" l
      JOIN "ChartOfAccounts" c ON l."accountId" = c.id
      JOIN "JournalEntries" j ON l."journalEntryId" = j.id
      WHERE j."tenantId" = :tenantId 
        AND j."environmentId" = :environmentId
        AND j.status = 'Posted'
      GROUP BY c."systemKey", c."type"
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
      
      if (b.systemKey === "CASH_IN_HAND") cashBalance = debit - credit;
      if (b.systemKey === "BANK_ACCOUNT") bankBalance = debit - credit;
      if (b.systemKey === "ACCOUNTS_RECEIVABLE") outstandingReceivables = debit - credit;
      
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
        AND c."systemKey" IN ('CASH_IN_HAND', 'BANK_ACCOUNT')
    `;

    const [{ todayCollection }] = await sequelize.query(todayQuery, {
      replacements: { tenantId, environmentId, startOfDay },
      type: sequelize.QueryTypes.SELECT
    });

    return {
      summary: {
        cashBalance,
        bankBalance,
        totalBalance: cashBalance + bankBalance,
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
  async getLedger({ tenantId, environmentId, accountCode, startDate, endDate, page = 1, limit = 50 }) {
    const { sequelize } = require("../models");
    const where = { tenantId, environmentId, status: "Posted" };

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const includeConfig = [
      { 
        model: JournalEntryLine, as: "lines", 
        include: [{ model: ChartOfAccount, as: "account", attributes: ["code", "name", "type"] }],
        ...(accountCode ? { where: { '$lines.account.code$': accountCode }, required: true } : {})
      },
      { model: Customer, attributes: ["id", "name"], required: false },
      { model: Voucher, attributes: ["voucherNumber", "voucherType"], required: false },
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

  async deleteVoucher(id, { tenantId, environmentId }) {
    const voucher = await Voucher.findOne({ where: { id, tenantId, environmentId } });
    if (!voucher) throw new Error("Voucher not found");
    
    // If voucher was auto-generated from a Payment, delete the Payment to ensure 
    // all cashbooks, receipts, and booking advances are properly reverted
    if (voucher.sourceModule === 'Payment' && voucher.sourceId) {
      const paymentService = require("./payment.service");
      try {
        await paymentService.removePayment(voucher.sourceId, { tenantId, environmentId });
        return { success: true, message: "Associated payment and voucher deleted" };
      } catch (e) {
        console.warn("[AccountingEngine] Payment already deleted or error:", e.message);
      }
    }

    // If voucher was auto-generated from an Expense, delete the Expense
    if (voucher.sourceModule === 'Expense' && voucher.sourceId) {
      const expenseService = require("./expense.service");
      try {
        await expenseService.deleteExpense(voucher.sourceId, { tenantId, environmentId });
      } catch (e) {
        console.warn("[AccountingEngine] Expense already deleted or error:", e.message);
      }
    }

    // Fallback: Delete manually created voucher or orphan voucher
    const t = await sequelize.transaction();
    try {
      // Delete associated journal entries
      await JournalEntry.destroy({
        where: { voucherId: voucher.id, tenantId, environmentId },
        transaction: t
      });
      
      // Delete the voucher itself
      await voucher.destroy({ transaction: t });
      
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
        { model: Voucher, attributes: ["voucherNumber", "voucherType"], required: false }
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
        { model: Voucher, attributes: ["voucherNumber", "voucherType"], required: false }
      ],
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    const totalPaid = payments.filter(p => p.status === "Completed").reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const outstanding = (booking.totalAmount || 0) - totalPaid;
    const gstAmount = Number(booking.taxes) || 0;
    const netRevenue = (booking.totalAmount || 0) - gstAmount; // What owner actually earns
    const netProfit = netRevenue - totalExpenses;

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
      journals,
    };
  }

  // ═══════════════════════════════════
  // PROFIT & LOSS
  // ═══════════════════════════════════
  async getProfitLoss({ tenantId, environmentId, startDate, endDate }) {
    const { sequelize } = require("../models");
    
    let dateClause = '';
    const replacements = { tenantId, environmentId };
    
    if (startDate && endDate) {
      dateClause = 'AND j."createdAt" BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

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
