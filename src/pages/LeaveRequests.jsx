import React, { useState, useEffect } from "react";
import { Plus, X, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Edit3, Search } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmProvider";

import { leavesAPI } from "../services/api";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData) {
        await leavesAPI.update(initialData.id, {
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason
        });
      } else {
        await leavesAPI.create({
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason
        });
      }
      onSuccess();
      setForm({ startDate: "", endDate: "", reason: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to save leave request");
    }
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
  const { user, role } = useRole();
  const { addToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await leavesAPI.getAll();
      if (res.data?.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch leave requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await leavesAPI.update(id, { status });
      addToast(`Leave request ${status.toLowerCase()}!`, "success");
      fetchData();
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm("Are you sure you want to delete this leave request?"))) return;
    try {
      await leavesAPI.delete(id);
      addToast("Leave request deleted", "success");
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to delete", "error");
    }
  };

  const handleEdit = (leave) => {
    setEditingLeave(leave);
    setModalOpen(true);
  };

  const filteredLeaves = leaves.filter(l => l.User?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 sm:p-6" style={{ maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", color: "#0D2418" }}>
            {role === "Sales" || role === "Operations" ? "My Leave Requests" : "Staff Leave Requests"}
          </h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Manage absences and time-off requests.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-stretch sm:items-center">
          {role !== "Sales" && role !== "Operations" && (
            <div style={{ position: "relative" }} className="w-full sm:w-64">
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", width: "100%" }}
              />
            </div>
          )}
          <button onClick={() => { setEditingLeave(null); setModalOpen(true); }} className="justify-center" style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Apply Leave
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>Loading...</div>
      ) : filteredLeaves.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#999", background: "#fff", borderRadius: 12, border: "1px solid #eaeaea" }}>No leave requests found.</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block" style={{ background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", overflow: "hidden" }}>
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
                {filteredLeaves.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 20px", color: "#666", fontWeight: 500 }}>{new Date(l.appliedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    {role !== "Sales" && role !== "Operations" && <td style={{ padding: "16px 20px", color: "#111", fontWeight: 600 }}>{l.User?.name} <span style={{ fontSize: 12, color: "#666", fontWeight: 400 }}>({l.User?.role})</span></td>}
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden flex flex-col gap-4">
            {filteredLeaves.map(l => (
              <div key={l.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    {role !== "Sales" && role !== "Operations" ? (
                      <>
                        <div style={{ fontWeight: 700, color: "#111", fontSize: 15 }}>{l.User?.name}</div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{l.User?.role} • Applied: {new Date(l.appliedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      </>
                    ) : (
                      <div style={{ fontWeight: 700, color: "#111", fontSize: 15 }}>Applied: {new Date(l.appliedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    )}
                  </div>
                  <div>
                    <span style={{ 
                      background: l.status === "Approved" ? "#dcfce7" : l.status === "Rejected" ? "#fee2e2" : "#fef3c7", 
                      color: l.status === "Approved" ? "#166534" : l.status === "Rejected" ? "#dc2626" : "#b45309", 
                      padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, display: "inline-block" 
                    }}>{l.status}</span>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Dates</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    {new Date(l.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} to {new Date(l.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginTop: 8, marginBottom: 4 }}>Reason</div>
                  <div style={{ fontSize: 13, color: "#475569" }}>{l.reason}</div>
                </div>

                {role !== "Sales" && role !== "Operations" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #e2e8f0", paddingTop: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {l.status === "Pending" && (
                        <>
                          <button onClick={() => handleUpdateStatus(l.id, "Approved")} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={14} /> Approve</button>
                          <button onClick={() => handleUpdateStatus(l.id, "Rejected")} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><XCircle size={14} /> Reject</button>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <button onClick={() => handleEdit(l)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(l.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 0 }}><Trash2 size={18} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

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
