import React, { useState, useEffect } from "react";
import { Plus, X, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Edit3, Search } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmProvider";

// Mock API — SCOPED BY TENANT to prevent cross-tenant data leakage
const getStorageKey = (tenantSlug) => `hm_leaves_${tenantSlug || 'default'}`;
const getMockLeaves = (tenantSlug) => JSON.parse(localStorage.getItem(getStorageKey(tenantSlug)) || "[]");
const saveMockLeaves = (tenantSlug, data) => localStorage.setItem(getStorageKey(tenantSlug), JSON.stringify(data));

function NewLeaveModal({ open, onClose, onSuccess, user, role, initialData }) {
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });

  useEffect(() => {
    if (initialData) {
      setForm({ startDate: initialData.startDate, endDate: initialData.endDate, reason: initialData.reason });
    } else {
      setForm({ startDate: "", endDate: "", reason: "" });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Get tenant slug from URL for scoping
    const parts = window.location.pathname.split('/').filter(Boolean);
    const tenantSlug = parts.length > 0 ? parts[0] : 'default';
    const data = getMockLeaves(tenantSlug);
    
    if (initialData) {
      const idx = data.findIndex(l => l.id === initialData.id);
      if (idx !== -1) {
        data[idx].startDate = form.startDate;
        data[idx].endDate = form.endDate;
        data[idx].reason = form.reason;
      }
      saveMockLeaves(tenantSlug, data);
    } else {
      const newEntry = {
        id: Date.now(),
        tenantSlug: tenantSlug,
        userId: user?.id || Date.now(),
        userName: user?.name || "Unknown User",
        role: role,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        status: "Pending",
        appliedOn: new Date().toISOString().split("T")[0],
      };
      saveMockLeaves(tenantSlug, [newEntry, ...data]);
    }
    
    onSuccess();
    setForm({ startDate: "", endDate: "", reason: "" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 500, borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>Apply for Leave</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Start Date *</label>
              <input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>End Date *</label>
              <input required type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Reason *</label>
            <textarea required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", resize: "none" }} placeholder="Reason for leave..." />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "none", borderRadius: 8, fontWeight: 700, color: "#475569", cursor: "pointer" }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: "12px", background: "#1B4332", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeaveRequests() {
  const { confirm } = useConfirm();
  const { user, role, tenant } = useRole();
  const tenantSlug = tenant?.slug || 'default';
  const { addToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      let data = getMockLeaves(tenantSlug);
      if (role === "Sales" || role === "Operations") {
        data = data.filter(l => l.userId === user?.id || l.userName === user?.name);
      }
      setLeaves(data);
      setLoading(false);
    }, 400);
  };

  const handleUpdateStatus = (id, status) => {
    const data = getMockLeaves(tenantSlug);
    const idx = data.findIndex(l => l.id === id);
    if (idx !== -1) {
      data[idx].status = status;
      saveMockLeaves(tenantSlug, data);
      addToast(`Leave request ${status.toLowerCase()}!`, "success");
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm("Are you sure you want to delete this leave request?"))) return;
    const data = getMockLeaves(tenantSlug).filter(l => l.id !== id);
    saveMockLeaves(tenantSlug, data);
    addToast("Leave request deleted", "success");
    fetchData();
  };

  const handleEdit = (leave) => {
    setEditingLeave(leave);
    setModalOpen(true);
  };

  const filteredLeaves = leaves.filter(l => l.userName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", color: "#0D2418" }}>
            {role === "Sales" || role === "Operations" ? "My Leave Requests" : "Staff Leave Requests"}
          </h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Manage absences and time-off requests.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {role !== "Sales" && role !== "Operations" && (
            <div style={{ position: "relative" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", width: 220 }}
              />
            </div>
          )}
          <button onClick={fetchData} style={{ background: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => { setEditingLeave(null); setModalOpen(true); }} style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Apply Leave
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #eaeaea", textAlign: "left" }}>
              <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Applied On</th>
              {role !== "Sales" && role !== "Operations" && <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Staff Member</th>}
              <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Dates</th>
              <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Reason</th>
              <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Status</th>
              {role !== "Sales" && role !== "Operations" && <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555", textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#999" }}>Loading...</td></tr>
            ) : filteredLeaves.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#999" }}>No leave requests found.</td></tr>
            ) : (
              filteredLeaves.map(l => (
                <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", color: "#666", fontWeight: 500 }}>{new Date(l.appliedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  {role !== "Sales" && role !== "Operations" && <td style={{ padding: "16px 20px", color: "#111", fontWeight: 600 }}>{l.userName} <span style={{ fontSize: 12, color: "#666", fontWeight: 400 }}>({l.role})</span></td>}
                  <td style={{ padding: "16px 20px", color: "#333", fontWeight: 600 }}>{new Date(l.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} to {new Date(l.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td style={{ padding: "16px 20px", color: "#555", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={l.reason}>{l.reason}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ 
                      background: l.status === "Approved" ? "#dcfce7" : l.status === "Rejected" ? "#fee2e2" : "#fef3c7", 
                      color: l.status === "Approved" ? "#166534" : l.status === "Rejected" ? "#dc2626" : "#b45309", 
                      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 
                    }}>{l.status}</span>
                  </td>
                  {role !== "Sales" && role !== "Operations" && (
                    <td style={{ padding: "16px 20px", textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      {l.status === "Pending" && (
                        <>
                          <button onClick={() => handleUpdateStatus(l.id, "Approved")} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={14} /> Approve</button>
                          <button onClick={() => handleUpdateStatus(l.id, "Rejected")} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><XCircle size={14} /> Reject</button>
                        </>
                      )}
                      <button onClick={() => handleEdit(l)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(l.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NewLeaveModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => { setModalOpen(false); addToast(`Leave request ${editingLeave ? 'updated' : 'submitted'} successfully!`, "success"); fetchData(); }}
        user={user}
        role={role}
        initialData={editingLeave}
      />
    </div>
  );
}
