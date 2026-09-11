import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Plus, Search, Filter, AlertTriangle, CheckCircle2, XCircle, FileText, UploadCloud, Calendar, User, MoreVertical, Paperclip, Download, Trash2, Edit2 } from "lucide-react";
import { complianceAPI, usersAPI } from "../services/api";
import { useConfirm } from "../components/ConfirmProvider";
import { format } from "date-fns";

const BRAND = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  accent: "#D4A017",
};

export default function Compliance() {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, VALID, EXPIRING_SOON, EXPIRED
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    documentType: "",
    documentName: "",
    documentNumber: "",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: "",
    hasExpiry: true,
    reminderDays: 90,
    responsibleUserId: "",
    notes: ""
  });
  
  const [fileToUpload, setFileToUpload] = useState(null);
  
  const [defaultTypes, setDefaultTypes] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadData();
    loadLookups();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab !== "ALL") params.status = activeTab;
      
      const [docsRes, summaryRes] = await Promise.all([
        complianceAPI.getAll(params),
        complianceAPI.getSummary()
      ]);
      
      setDocuments(docsRes.data?.data || []);
      setSummary(summaryRes.data?.data || null);
    } catch (err) {
      console.error("Failed to load compliance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [typesRes, usersRes] = await Promise.all([
        complianceAPI.getDefaultTypes(),
        usersAPI.getAll()
      ]);
      setDefaultTypes(typesRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load lookups:", err);
    }
  };

  const openModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        documentType: doc.documentType || "",
        documentName: doc.documentName || "",
        documentNumber: doc.documentNumber || "",
        issuingAuthority: doc.issuingAuthority || "",
        issueDate: doc.issueDate || "",
        expiryDate: doc.expiryDate || "",
        hasExpiry: doc.hasExpiry,
        reminderDays: doc.reminderDays || 90,
        responsibleUserId: doc.responsibleUserId || "",
        notes: doc.notes || ""
      });
    } else {
      setEditingDoc(null);
      setFormData({
        documentType: "",
        documentName: "",
        documentNumber: "",
        issuingAuthority: "",
        issueDate: "",
        expiryDate: "",
        hasExpiry: true,
        reminderDays: 90,
        responsibleUserId: "",
        notes: ""
      });
    }
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let savedDoc;
      if (editingDoc) {
        const res = await complianceAPI.update(editingDoc.id, formData);
        savedDoc = res.data.data;
      } else {
        const res = await complianceAPI.create(formData);
        savedDoc = res.data.data;
      }

      if (fileToUpload) {
        const fd = new FormData();
        fd.append("file", fileToUpload);
        await complianceAPI.uploadFile(savedDoc.id, fd);
      }

      closeModal();
      loadData();
    } catch (err) {
      console.error("Failed to save document:", err);
      alert("Failed to save document.");
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm(
      `Are you sure you want to delete '${name}'? This action cannot be undone.`,
      {
        title: "Delete Document",
        confirmText: "Delete",
        isDanger: true
      }
    );
    
    if (isConfirmed) {
      try {
        await complianceAPI.remove(id);
        loadData();
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    }
  };

  const getStatusBadge = (status, msg) => {
    if (status === "EXPIRED") return <span style={{ background: "#fef2f2", color: "#ef4444", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={12}/> EXPIRED</span>;
    if (status === "EXPIRING_SOON") return <span style={{ background: "#fffbeb", color: "#f59e0b", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12}/> EXPIRING SOON</span>;
    if (status === "VALID") return <span style={{ background: "#f0fdf4", color: "#10b981", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12}/> VALID</span>;
    return <span style={{ background: "#f1f5f9", color: "#64748b", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>NO EXPIRY</span>;
  };

  const filteredDocs = documents.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.documentName?.toLowerCase().includes(q) ||
      d.documentNumber?.toLowerCase().includes(q) ||
      d.issuingAuthority?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", paddingBottom: 100 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: "1 1 min-content" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={28} color={BRAND.primary} style={{ flexShrink: 0 }} /> Compliance
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Track venue licenses, registrations, and renewals.</p>
        </div>
        <button onClick={() => openModal()} style={{ background: BRAND.primary, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          <Plus size={18} /> Add Document
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>Total Documents</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{summary.total}</span>
          </div>
          <div style={{ background: "#f0fdf4", padding: 20, borderRadius: 16, border: "1px solid #bbf7d0", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, color: "#166534", fontWeight: 700 }}>Valid</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#15803d" }}>{summary.valid}</span>
          </div>
          <div style={{ background: "#fffbeb", padding: 20, borderRadius: 16, border: "1px solid #fde68a", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, color: "#b45309", fontWeight: 700 }}>Expiring Soon</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#d97706" }}>{summary.expiringSoon}</span>
          </div>
          <div style={{ background: "#fef2f2", padding: 20, borderRadius: 16, border: "1px solid #fecaca", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 700 }}>Expired</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#ef4444" }}>{summary.expired}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, background: "#f1f5f9", padding: 4, borderRadius: 12, overflowX: "auto", maxWidth: "100%", whiteSpace: "nowrap" }}>
          {[
            { id: "ALL", label: "All" },
            { id: "VALID", label: "Valid" },
            { id: "EXPIRING_SOON", label: "Expiring Soon" },
            { id: "EXPIRED", label: "Expired" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                background: activeTab === tab.id ? "#fff" : "transparent",
                color: activeTab === tab.id ? BRAND.primary : "#64748b",
                boxShadow: activeTab === tab.id ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ position: "relative", flex: "1 1 250px", maxWidth: "100%" }}>
          <Search size={18} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px 10px 40px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading documents...</div>
      ) : filteredDocs.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 24, border: "1px dashed #cbd5e1" }}>
          <FileText size={48} color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#0f172a" }}>No documents found</h3>
          <p style={{ margin: 0, color: "#64748b" }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
          {filteredDocs.map(doc => (
            <div key={doc.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{doc.documentType}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{doc.documentName}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {getStatusBadge(doc.status)}
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {doc.documentNumber && (
                  <div style={{ fontSize: 13, color: "#475569", display: "flex", gap: 8 }}>
                    <span style={{ color: "#94a3b8", width: 60 }}>Reg No:</span> {doc.documentNumber}
                  </div>
                )}
                {doc.issuingAuthority && (
                  <div style={{ fontSize: 13, color: "#475569", display: "flex", gap: 8 }}>
                    <span style={{ color: "#94a3b8", width: 60 }}>Authority:</span> {doc.issuingAuthority}
                  </div>
                )}
                <div style={{ fontSize: 13, color: "#475569", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#94a3b8", width: 60 }}>Expiry:</span> 
                  {doc.hasExpiry ? (
                    <span style={{ fontWeight: doc.status === "EXPIRED" || doc.status === "EXPIRING_SOON" ? 700 : 500, color: doc.status === "EXPIRED" ? "#ef4444" : doc.status === "EXPIRING_SOON" ? "#f59e0b" : "inherit" }}>
                      {doc.expiryDate ? format(new Date(doc.expiryDate), "dd MMM yyyy") : "Not Set"}
                      <span style={{ fontSize: 11, marginLeft: 8, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{doc.statusMessage}</span>
                    </span>
                  ) : "Lifetime"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {doc.attachmentUrl && (
                    <a href={doc.attachmentUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                      <button style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <Paperclip size={14} /> View File
                      </button>
                    </a>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => openModal(doc)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(doc.id, doc.documentName)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: "relative", background: "#fff", width: "100%", maxWidth: 600, borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{editingDoc ? "Edit Document" : "Add Compliance Document"}</h2>
                <button onClick={closeModal} style={{ background: "transparent", border: "none", cursor: "pointer" }}><XCircle size={24} color="#94a3b8" /></button>
              </div>

              <div style={{ padding: 32, overflowY: "auto", flex: 1 }}>
                <form id="complianceForm" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Document Type *</label>
                      <input 
                        type="text" 
                        required
                        list="docTypes"
                        value={formData.documentType}
                        onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                        placeholder="e.g. Fire License"
                      />
                      <datalist id="docTypes">
                        {defaultTypes.map(t => <option key={t} value={t} />)}
                      </datalist>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Document Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.documentName}
                        onChange={(e) => setFormData({...formData, documentName: e.target.value})}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                        placeholder="e.g. Primary Fire NOC"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Registration / Doc Number</label>
                      <input 
                        type="text" 
                        value={formData.documentNumber}
                        onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Issuing Authority</label>
                      <input 
                        type="text" 
                        value={formData.issuingAuthority}
                        onChange={(e) => setFormData({...formData, issuingAuthority: e.target.value})}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                      />
                    </div>
                  </div>

                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <input 
                        type="checkbox" 
                        id="hasExpiry"
                        checked={formData.hasExpiry}
                        onChange={(e) => setFormData({...formData, hasExpiry: e.target.checked})}
                        style={{ width: 16, height: 16, accentColor: BRAND.primary }}
                      />
                      <label htmlFor="hasExpiry" style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>Document has an expiry date</label>
                    </div>

                    {formData.hasExpiry && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Issue Date</label>
                          <input 
                            type="date" 
                            value={formData.issueDate}
                            onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Expiry Date *</label>
                          <input 
                            type="date" 
                            required={formData.hasExpiry}
                            value={formData.expiryDate}
                            onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Reminder Alert (Days before)</label>
                          <input 
                            type="number" 
                            min="1"
                            value={formData.reminderDays}
                            onChange={(e) => setFormData({...formData, reminderDays: parseInt(e.target.value) || 90})}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Responsible Staff</label>
                    <select 
                      value={formData.responsibleUserId}
                      onChange={(e) => setFormData({...formData, responsibleUserId: e.target.value})}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                    >
                      <option value="">-- Unassigned --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Attachment (PDF/Image)</label>
                    <div style={{ border: "2px dashed #cbd5e1", borderRadius: 12, padding: 20, textAlign: "center", background: "#f8fafc" }}>
                      <input 
                        type="file"
                        id="docUpload"
                        style={{ display: "none" }}
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setFileToUpload(e.target.files[0]);
                        }}
                      />
                      <label htmlFor="docUpload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <UploadCloud size={24} color="#64748b" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: BRAND.primary }}>
                          {fileToUpload ? fileToUpload.name : "Click to select a file"}
                        </span>
                        {!fileToUpload && <span style={{ fontSize: 12, color: "#94a3b8" }}>Max size 10MB</span>}
                      </label>
                    </div>
                    {editingDoc?.attachmentName && !fileToUpload && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                        Current file: {editingDoc.attachmentName}
                      </div>
                    )}
                  </div>

                </form>
              </div>

              <div style={{ padding: "16px 32px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={closeModal} style={{ padding: "12px 24px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                <button type="submit" form="complianceForm" style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: BRAND.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{editingDoc ? "Update Document" : "Save Document"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
