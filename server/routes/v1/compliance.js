const express = require("express");
const router = express.Router();
const { ComplianceDocument, User, AuditLog } = require("../../models");
const { auth } = require("../../middleware/auth");
const { tenantScope } = require("../../middleware/tenantScope");
const { subscriptionGuard } = require("../../middleware/subscriptionGuard");
const { planGate } = require("../../middleware/planGate");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

router.use(auth, tenantScope, subscriptionGuard, planGate);

// ── File upload config ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../public/uploads/compliance", String(req.tenantId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `doc_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Allowed: ${allowed.join(", ")}`));
    }
  },
});

// ── Helper: compute status from dates ──
function computeStatus(doc) {
  if (!doc.hasExpiry) return "VALID";
  if (!doc.expiryDate) return "NOT_SET";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(doc.expiryDate + "T00:00:00");
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= (doc.reminderDays || 90)) return "EXPIRING_SOON";
  return "VALID";
}

function enrichDocument(doc) {
  const plain = doc.toJSON ? doc.toJSON() : { ...doc };
  plain.status = computeStatus(plain);

  // Human-readable message
  if (plain.status === "VALID" && plain.hasExpiry && plain.expiryDate) {
    const exp = new Date(plain.expiryDate + "T00:00:00");
    plain.statusMessage = `Valid until ${exp.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  } else if (plain.status === "EXPIRING_SOON") {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp = new Date(plain.expiryDate + "T00:00:00");
    const days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    plain.statusMessage = days <= 0 ? "Expires today" : `Expires in ${days} day${days !== 1 ? "s" : ""}`;
    plain.daysUntilExpiry = days;
  } else if (plain.status === "EXPIRED") {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp = new Date(plain.expiryDate + "T00:00:00");
    const days = Math.ceil((today.getTime() - exp.getTime()) / (1000 * 60 * 60 * 24));
    plain.statusMessage = `Expired ${days} day${days !== 1 ? "s" : ""} ago`;
    plain.daysOverdue = days;
  } else if (plain.status === "NOT_SET") {
    plain.statusMessage = "Expiry date not set";
  } else if (!plain.hasExpiry) {
    plain.statusMessage = "No expiry";
  }

  return plain;
}

// ═══════════════════════════════════
// GET /summary — Dashboard summary
// ═══════════════════════════════════
router.get("/summary", async (req, res) => {
  try {
    const docs = await ComplianceDocument.findAll({
      where: { tenantId: req.tenantId, environmentId: req.environmentId },
      include: [{ model: User, as: "ResponsibleUser", attributes: ["id", "name"] }],
      order: [["expiryDate", "ASC"]],
    });

    const enriched = docs.map(enrichDocument);

    let valid = 0, expiringSoon = 0, expired = 0, notSet = 0;
    const urgentItems = [];

    enriched.forEach(d => {
      if (d.status === "VALID") valid++;
      else if (d.status === "EXPIRING_SOON") { expiringSoon++; urgentItems.push(d); }
      else if (d.status === "EXPIRED") { expired++; urgentItems.push(d); }
      else if (d.status === "NOT_SET") notSet++;
    });

    // Sort urgent: expired first (most overdue first), then expiring soon (closest first)
    urgentItems.sort((a, b) => {
      if (a.status === "EXPIRED" && b.status !== "EXPIRED") return -1;
      if (a.status !== "EXPIRED" && b.status === "EXPIRED") return 1;
      if (a.status === "EXPIRED" && b.status === "EXPIRED") return (b.daysOverdue || 0) - (a.daysOverdue || 0);
      return (a.daysUntilExpiry || 0) - (b.daysUntilExpiry || 0);
    });

    res.json({
      success: true,
      data: {
        total: enriched.length,
        valid,
        expiringSoon,
        expired,
        notSet,
        urgentItems: urgentItems.slice(0, 5), // Top 5 most urgent
      },
    });
  } catch (err) {
    console.error("Compliance summary error:", err);
    res.status(500).json({ error: "Failed to load compliance summary" });
  }
});

// ═══════════════════════════════════
// GET / — List all documents
// ═══════════════════════════════════
router.get("/", async (req, res) => {
  try {
    const { status, documentType, search } = req.query;

    const where = { tenantId: req.tenantId, environmentId: req.environmentId };
    if (documentType) where.documentType = documentType;
    if (search) {
      where[Op.or] = [
        { documentName: { [Op.iLike]: `%${search}%` } },
        { documentNumber: { [Op.iLike]: `%${search}%` } },
        { issuingAuthority: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const docs = await ComplianceDocument.findAll({
      where,
      include: [{ model: User, as: "ResponsibleUser", attributes: ["id", "name"] }],
      order: [["expiryDate", "ASC NULLS LAST"], ["documentName", "ASC"]],
    });

    let enriched = docs.map(enrichDocument);

    // Filter by computed status
    if (status) {
      enriched = enriched.filter(d => d.status === status);
    }

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error("Compliance list error:", err);
    res.status(500).json({ error: "Failed to load compliance documents" });
  }
});

// ═══════════════════════════════════
// GET /:id — Get single document
// ═══════════════════════════════════
router.get("/:id", async (req, res) => {
  try {
    const doc = await ComplianceDocument.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
      include: [{ model: User, as: "ResponsibleUser", attributes: ["id", "name"] }],
    });
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json({ success: true, data: enrichDocument(doc) });
  } catch (err) {
    console.error("Compliance get error:", err);
    res.status(500).json({ error: "Failed to load document" });
  }
});

// ═══════════════════════════════════
// POST / — Create document
// ═══════════════════════════════════
router.post("/", async (req, res) => {
  try {
    const { documentType, documentName, documentNumber, issuingAuthority, issueDate, expiryDate, hasExpiry, reminderDays, responsibleUserId, notes } = req.body;

    if (!documentName || !documentType) {
      return res.status(400).json({ error: "Document name and type are required" });
    }

    const doc = await ComplianceDocument.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      documentType,
      documentName,
      documentNumber: documentNumber || null,
      issuingAuthority: issuingAuthority || null,
      issueDate: issueDate || null,
      expiryDate: hasExpiry === false ? null : (expiryDate || null),
      hasExpiry: hasExpiry !== false,
      reminderDays: reminderDays || 90,
      responsibleUserId: responsibleUserId || null,
      notes: notes || null,
      createdBy: req.user?.id || null,
    });

    // Audit log
    await AuditLog.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      userId: req.user?.id,
      action: "COMPLIANCE_DOCUMENT_CREATED",
      resource: "ComplianceDocument",
      details: { id: doc.id, documentName, documentType },
    }).catch(() => {});

    const enriched = enrichDocument(doc);
    res.status(201).json({ success: true, data: enriched });
  } catch (err) {
    console.error("Compliance create error:", err);
    res.status(500).json({ error: "Failed to create compliance document" });
  }
});

// ═══════════════════════════════════
// PUT /:id — Update document
// ═══════════════════════════════════
router.put("/:id", async (req, res) => {
  try {
    const doc = await ComplianceDocument.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
    });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const { documentType, documentName, documentNumber, issuingAuthority, issueDate, expiryDate, hasExpiry, reminderDays, responsibleUserId, notes } = req.body;

    await doc.update({
      documentType: documentType || doc.documentType,
      documentName: documentName || doc.documentName,
      documentNumber: documentNumber === "" ? null : (documentNumber !== undefined ? documentNumber : doc.documentNumber),
      issuingAuthority: issuingAuthority === "" ? null : (issuingAuthority !== undefined ? issuingAuthority : doc.issuingAuthority),
      issueDate: issueDate === "" ? null : (issueDate !== undefined ? issueDate : doc.issueDate),
      expiryDate: hasExpiry === false ? null : (expiryDate === "" ? null : (expiryDate !== undefined ? expiryDate : doc.expiryDate)),
      hasExpiry: hasExpiry !== undefined ? hasExpiry : doc.hasExpiry,
      reminderDays: reminderDays !== undefined ? reminderDays : doc.reminderDays,
      responsibleUserId: responsibleUserId === "" ? null : (responsibleUserId !== undefined ? responsibleUserId : doc.responsibleUserId),
      notes: notes === "" ? null : (notes !== undefined ? notes : doc.notes),
      updatedBy: req.user?.id || null,
    });

    await AuditLog.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      userId: req.user?.id,
      action: "COMPLIANCE_DOCUMENT_UPDATED",
      resource: "ComplianceDocument",
      details: { id: doc.id, documentName: doc.documentName },
    }).catch(() => {});

    const updated = await ComplianceDocument.findByPk(doc.id, {
      include: [{ model: User, as: "ResponsibleUser", attributes: ["id", "name"] }],
    });
    res.json({ success: true, data: enrichDocument(updated) });
  } catch (err) {
    console.error("Compliance update error:", err);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// ═══════════════════════════════════
// POST /:id/upload — Upload attachment
// ═══════════════════════════════════
router.post("/:id/upload", upload.single("file"), async (req, res) => {
  try {
    const doc = await ComplianceDocument.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
    });
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Remove old file if exists
    if (doc.attachmentUrl) {
      const oldPath = path.join(__dirname, "../../public", doc.attachmentUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const relativeUrl = `/uploads/compliance/${req.tenantId}/${req.file.filename}`;
    await doc.update({
      attachmentUrl: relativeUrl,
      attachmentName: req.file.originalname,
      updatedBy: req.user?.id || null,
    });

    await AuditLog.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      userId: req.user?.id,
      action: "COMPLIANCE_ATTACHMENT_UPLOADED",
      resource: "ComplianceDocument",
      details: { id: doc.id, filename: req.file.originalname },
    }).catch(() => {});

    res.json({ success: true, data: { attachmentUrl: relativeUrl, attachmentName: req.file.originalname } });
  } catch (err) {
    console.error("Compliance upload error:", err);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// ═══════════════════════════════════
// DELETE /:id — Delete document
// ═══════════════════════════════════
router.delete("/:id", async (req, res) => {
  try {
    const doc = await ComplianceDocument.findOne({
      where: { id: req.params.id, tenantId: req.tenantId, environmentId: req.environmentId },
    });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const name = doc.documentName;
    await doc.destroy(); // Soft delete (paranoid)

    await AuditLog.create({
      tenantId: req.tenantId,
      environmentId: req.environmentId,
      userId: req.user?.id,
      action: "COMPLIANCE_DOCUMENT_DELETED",
      resource: "ComplianceDocument",
      details: { id: doc.id, documentName: name },
    }).catch(() => {});

    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    console.error("Compliance delete error:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// ═══════════════════════════════════
// GET /types/defaults — Default document types
// ═══════════════════════════════════
router.get("/types/defaults", async (req, res) => {
  res.json({
    success: true,
    data: [
      "Water Testing",
      "Panchayat License",
      "Fire License",
      "Water Chlorination",
      "GST Registration",
      "FSSAI Registration",
      "Pollution / Environmental Certificate",
      "Electrical Safety Certificate",
      "Lift Certificate",
      "Generator Inspection",
      "Trade License",
      "Food Safety Certificate",
      "Insurance",
      "Building Approval",
    ],
  });
});

module.exports = router;
