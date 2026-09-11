const express = require("express");
const router = express.Router();
const { Vendor, VendorBill, VendorPayment, ChartOfAccount, Booking } = require("../../models");
const { auth } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate } = require("../../middleware/planGate");
const accountingEngine = require("../../services/accountingEngine.service");
const sequelize = require("../../db");
const { Op } = require("sequelize");

router.use(auth, tenantScope, subscriptionGuard, planGate);

// ═══════════════════════════════════
// GET /api/v1/vendors — List all vendors with real financial data
// ═══════════════════════════════════
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      where: { tenantId: req.tenantId, environmentId: req.environmentId },
      order: [["name", "ASC"]],
    });

    // Compute real totalBilled / totalPaid for each vendor
    const vendorIds = vendors.map(v => v.id);

    const billTotals = await VendorBill.findAll({
      where: { vendorId: { [Op.in]: vendorIds }, status: { [Op.ne]: "Cancelled" } },
      attributes: ["vendorId", [sequelize.fn("SUM", sequelize.col("amount")), "totalBilled"]],
      group: ["vendorId"],
      raw: true,
    });

    const paymentTotals = await VendorPayment.findAll({
      where: { vendorId: { [Op.in]: vendorIds }, status: "Completed" },
      attributes: ["vendorId", [sequelize.fn("SUM", sequelize.col("amount")), "totalPaid"]],
      group: ["vendorId"],
      raw: true,
    });

    const billMap = {};
    billTotals.forEach(b => { billMap[b.vendorId] = parseFloat(b.totalBilled) || 0; });
    const payMap = {};
    paymentTotals.forEach(p => { payMap[p.vendorId] = parseFloat(p.totalPaid) || 0; });

    const formatted = vendors.map(v => {
      const totalBilled = billMap[v.id] || 0;
      const totalPaid = payMap[v.id] || 0;
      return {
        ...v.toJSON(),
        location: v.address,
        rating: 5.0,
        jobs: 0,
        totalBilled,
        totalPaid,
        balanceDue: totalBilled - totalPaid,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Fetch vendors error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch vendors" });
  }
});

// ═══════════════════════════════════
// GET /api/v1/vendors/all-payments — All vendor payments (for Collections Register)
// ═══════════════════════════════════
router.get("/all-payments", async (req, res) => {
  try {
    const payments = await VendorPayment.findAll({
      where: { tenantId: req.tenantId, environmentId: req.environmentId, status: "Completed" },
      include: [{ model: Vendor, attributes: ["id", "name", "phone"] }],
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    const formatted = payments.map(p => ({
      id: `vp-${p.id}`,
      _vendorPaymentId: p.id,
      paymentNumber: p.paymentNumber,
      paymentDate: p.date,
      paymentMode: p.paymentMode,
      amount: p.amount,
      referenceNumber: p.referenceNumber,
      notes: p.description,
      createdAt: p.createdAt,
      isVendorPayment: true,
      vendorId: p.vendorId,
      Vendor: p.Vendor,
      Customer: p.Vendor ? { name: p.Vendor.name } : null,
      Booking: null,
    }));

    res.json({ success: true, data: { data: formatted, total: formatted.length } });
  } catch (error) {
    console.error("Fetch all vendor payments error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch vendor payments" });
  }
});

// ═══════════════════════════════════
// POST /api/v1/vendors — Create vendor
// ═══════════════════════════════════
router.post("/", async (req, res) => {
  try {
    const { name, category, phone, location, email, tags } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, error: "Name and category are required" });
    }
    const newVendor = await Vendor.create({
      tenantId: req.tenantId, environmentId: req.environmentId,
      name, category, phone, address: location, email, tags: tags || [], status: "Active"
    });
    const formatted = {
      ...newVendor.toJSON(), location: newVendor.address, rating: 5.0,
      jobs: 0, totalBilled: 0, totalPaid: 0, balanceDue: 0,
    };
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Create vendor error:", error);
    res.status(500).json({ success: false, error: "Failed to create vendor" });
  }
});

// ═══════════════════════════════════
// PUT /api/v1/vendors/:id — Update vendor
// ═══════════════════════════════════
router.put("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId }
    });
    if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });

    const { name, category, phone, location, email, tags, status } = req.body;
    await vendor.update({
      name: name || vendor.name, category: category || vendor.category,
      phone: phone !== undefined ? phone : vendor.phone, address: location !== undefined ? location : vendor.address,
      email: email !== undefined ? email : vendor.email, tags: tags || vendor.tags,
      ...(status ? { status } : {}),
    });
    const formatted = {
      ...vendor.toJSON(), location: vendor.address, rating: 5.0,
      jobs: 0, totalBilled: 0, totalPaid: 0, balanceDue: 0,
    };
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Update vendor error:", error);
    res.status(500).json({ success: false, error: "Failed to update vendor" });
  }
});

// ═══════════════════════════════════
// DELETE /api/v1/vendors/:id — Delete vendor
// ═══════════════════════════════════
router.delete("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId }
    });
    if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });
    await vendor.destroy();
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    console.error("Delete vendor error:", error);
    res.status(500).json({ success: false, error: "Failed to delete vendor" });
  }
});

// ═══════════════════════════════════
// VENDOR BILLS
// ═══════════════════════════════════

// GET /api/v1/vendors/:id/bills
router.get("/:id/bills", async (req, res) => {
  try {
    const bills = await VendorBill.findAll({
      where: { vendorId: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
      include: [{ model: VendorPayment, required: false }],
      order: [["date", "DESC"]],
    });
    res.json({ success: true, data: bills });
  } catch (error) {
    console.error("Fetch vendor bills error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch vendor bills" });
  }
});

// POST /api/v1/vendors/:id/bills
router.post("/:id/bills", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const vendor = await Vendor.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
      transaction: t,
    });
    if (!vendor) { await t.rollback(); return res.status(404).json({ success: false, error: "Vendor not found" }); }

    const { date, dueDate, description, amount, bookingId, notes } = req.body;
    if (!description || !amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Description and valid amount are required" });
    }

    // Ensure COA account 2005 exists (create if missing)
    await ensureVendorPayableAccount(req.tenantId, req.environmentId, t);

    const bill = await VendorBill.create({
      tenantId: req.tenantId, environmentId: req.environmentId,
      vendorId: vendor.id,
      date: date && date !== "" ? new Date(date) : new Date(),
      dueDate: dueDate && dueDate !== "" ? new Date(dueDate) : null,
      description, amount,
      bookingId: bookingId || null,
      notes: notes || null,
      createdBy: req.user.id,
    }, { transaction: t });

    // Post to accounting engine
    await accountingEngine.onVendorBillCreated(bill, vendor, {
      tenantId: req.tenantId, environmentId: req.environmentId,
      createdBy: req.user.id, transaction: t,
    });

    await t.commit();
    res.json({ success: true, data: bill });
  } catch (error) {
    await t.rollback();
    console.error("Create vendor bill error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create vendor bill" });
  }
});

// DELETE /api/v1/vendors/:id/bills/:billId
router.delete("/:id/bills/:billId", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const bill = await VendorBill.findOne({
      where: { id: req.params.billId, vendorId: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
      transaction: t,
    });
    if (!bill) { await t.rollback(); return res.status(404).json({ success: false, error: "Bill not found" }); }

    // Reverse accounting entry
    await accountingEngine.reverseVendorBill(bill.id, req.user.id, "Bill cancelled", req.tenantId, req.environmentId, t);

    await bill.update({ status: "Cancelled" }, { transaction: t });
    await t.commit();
    res.json({ success: true, data: { id: bill.id } });
  } catch (error) {
    await t.rollback();
    console.error("Cancel vendor bill error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to cancel vendor bill" });
  }
});

// ═══════════════════════════════════
// VENDOR PAYMENTS
// ═══════════════════════════════════

// GET /api/v1/vendors/:id/payments
router.get("/:id/payments", async (req, res) => {
  try {
    const payments = await VendorPayment.findAll({
      where: { vendorId: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
      order: [["date", "DESC"]],
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error("Fetch vendor payments error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch vendor payments" });
  }
});

// POST /api/v1/vendors/:id/payments
router.post("/:id/payments", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const vendor = await Vendor.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
      transaction: t,
    });
    if (!vendor) { await t.rollback(); return res.status(404).json({ success: false, error: "Vendor not found" }); }

    const { date, amount, paymentMode, referenceNumber, description, vendorBillId } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Valid amount is required" });
    }
    const validModes = ["Cash", "UPI", "Bank Transfer", "Cheque"];
    if (!paymentMode || !validModes.includes(paymentMode)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Payment mode is required. Must be one of: ${validModes.join(", ")}` });
    }

    // Ensure COA account 2005 exists
    await ensureVendorPayableAccount(req.tenantId, req.environmentId, t);

    const payment = await VendorPayment.create({
      tenantId: req.tenantId, environmentId: req.environmentId,
      vendorId: vendor.id, vendorBillId: vendorBillId || null,
      date: date && date !== "" ? new Date(date) : new Date(),
      amount, paymentMode,
      referenceNumber: referenceNumber || null,
      description: description || null,
      createdBy: req.user.id,
    }, { transaction: t });

    // Post to accounting engine
    await accountingEngine.onVendorPaymentMade(payment, vendor, {
      tenantId: req.tenantId, environmentId: req.environmentId,
      createdBy: req.user.id, transaction: t,
    });

    // If linked to a bill, update bill status
    if (vendorBillId) {
      await updateBillStatus(vendorBillId, t);
    }

    await t.commit();
    res.json({ success: true, data: payment });
  } catch (error) {
    await t.rollback();
    console.error("Create vendor payment error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create vendor payment" });
  }
});

// DELETE /api/v1/vendors/:id/payments/:paymentId
router.delete("/:id/payments/:paymentId", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const payment = await VendorPayment.findOne({
      where: { id: req.params.paymentId, vendorId: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
      transaction: t,
    });
    if (!payment) { await t.rollback(); return res.status(404).json({ success: false, error: "Payment not found" }); }

    // Reverse accounting entry
    await accountingEngine.reverseVendorPayment(payment.id, req.user.id, "Payment cancelled", req.tenantId, req.environmentId, t);

    await payment.update({ status: "Cancelled" }, { transaction: t });

    // Update bill status if linked
    if (payment.vendorBillId) {
      await updateBillStatus(payment.vendorBillId, t);
    }

    await t.commit();
    res.json({ success: true, data: { id: payment.id } });
  } catch (error) {
    await t.rollback();
    console.error("Cancel vendor payment error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to cancel vendor payment" });
  }
});

// GET /api/v1/vendors/:id/ledger — Full vendor financial ledger
router.get("/:id/ledger", async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
    });
    if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });

    const bills = await VendorBill.findAll({
      where: { vendorId: vendor.id, status: { [Op.ne]: "Cancelled" } },
      order: [["date", "ASC"]],
      raw: true,
    });
    const payments = await VendorPayment.findAll({
      where: { vendorId: vendor.id, status: "Completed" },
      order: [["date", "ASC"]],
      raw: true,
    });

    // Merge into chronological ledger
    const ledger = [];
    bills.forEach(b => ledger.push({ type: "Bill", date: b.date, number: b.billNumber, description: b.description, debit: parseFloat(b.amount), credit: 0, paymentMode: null, referenceNumber: null }));
    payments.forEach(p => ledger.push({ type: "Payment", date: p.date, number: p.paymentNumber, description: p.description || `Payment via ${p.paymentMode}`, debit: 0, credit: parseFloat(p.amount), paymentMode: p.paymentMode, referenceNumber: p.referenceNumber }));
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    ledger.forEach(l => { balance += l.debit - l.credit; l.balance = balance; });

    const totalBilled = bills.reduce((s, b) => s + parseFloat(b.amount), 0);
    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);

    res.json({
      success: true,
      data: {
        vendor: vendor.toJSON(),
        totalBilled, totalPaid, balanceDue: totalBilled - totalPaid,
        ledger,
      }
    });
  } catch (error) {
    console.error("Fetch vendor ledger error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch vendor ledger" });
  }
});

// ═══════════════════════════════════
// HELPERS
// ═══════════════════════════════════

async function ensureVendorPayableAccount(tenantId, environmentId, transaction) {
  const existing = await ChartOfAccount.findOne({
    where: { code: "2005", tenantId, environmentId },
    transaction,
  });
  if (!existing) {
    await ChartOfAccount.create({
      tenantId, environmentId,
      code: "2005", systemKey: "VENDOR_PAYABLE",
      name: "Vendor Payable (Accounts Payable)",
      type: "Liability", subType: "Current Liability",
      isSystem: true, isActive: true, openingBalance: 0,
    }, { transaction });
    console.log(`[Vendor] Created COA account 2005 (Vendor Payable) for tenant ${tenantId}`);
  }
}

async function updateBillStatus(billId, transaction) {
  const bill = await VendorBill.findByPk(billId, { transaction });
  if (!bill || bill.status === "Cancelled") return;

  const totalPaidResult = await VendorPayment.findOne({
    where: { vendorBillId: billId, status: "Completed" },
    attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "totalPaid"]],
    raw: true,
    transaction,
  });

  const totalPaid = parseFloat(totalPaidResult?.totalPaid) || 0;
  const billAmount = parseFloat(bill.amount);

  let newStatus = "Unpaid";
  if (totalPaid >= billAmount) newStatus = "Paid";
  else if (totalPaid > 0) newStatus = "Partial";

  await bill.update({ status: newStatus }, { transaction });
}

module.exports = router;
