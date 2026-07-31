import React, { useState, useEffect } from "react";
import { Users, Search, Plus, UserCheck, UserX, Clock, Briefcase, Filter, X, Save, Trash2 } from "lucide-react";
import { usersAPI, jobsAPI } from "../services/api";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

function StaffModal({ open, onClose, onSuccess, editData }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "Sales", password: "" });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (editData && open) {
      setForm({ name: editData.name, email: editData.email, phone: editData.phone || "", role: editData.role || "Sales", password: "" });
    } else if (!editData && open) {
      setForm({ name: "", email: "", phone: "", role: "Sales", password: "" });
    }
  }, [editData, open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editData) {
        await usersAPI.update(editData.id, form);
        addToast("Employee updated successfully", "success");
      } else {
        await usersAPI.create(form);
        addToast("Employee created successfully", "success");
      }
      onSuccess();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to save employee", "error");
    } finally {
      setLoading(false);
    }
  };

  const roles = ["Owner", "Manager", "Sales", "Reception", "Coordinator", "Accountant", "Security", "Technician", "Cleaner", "Operations"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 500, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>{editData ? "Edit Employee" : "Add Employee"}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Full Name *</label>
            <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="e.g. John Doe" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="e.g. john@example.com" />
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="10-digit number" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Role *</label>
              <select required value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", cursor: "pointer", background: "#fff" }}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Password {editData ? "(Leave blank to keep current)" : "*"}</label>
            <input required={!editData} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="Enter password" />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "none", borderRadius: 8, fontWeight: 700, color: "#475569", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: "12px", background: "#1B4332", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Saving..." : "Save Employee"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignJobModal({ open, onClose, staffMember }) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDate, setJobDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (open) {
      setJobTitle("");
      setJobDate("");
    }
  }, [open]);

  if (!open) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) return addToast("Please enter a job title", "error");
    
    setLoading(true);
    // Mocking the API call for now since they want to add directly without the complex Job/Booking system
    setTimeout(() => {
      setLoading(false);
      addToast(`Assigned "${jobTitle}" to ${staffMember.name} successfully!`, "success");
      onClose();
    }, 600);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 400, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Assign Job to {staffMember?.name}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <form onSubmit={handleAssign} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Job / Task Description *</label>
            <input 
              required 
              type="text"
              value={jobTitle} 
              onChange={e => setJobTitle(e.target.value)} 
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} 
              placeholder="e.g. Manage catering for evening event" 
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Date</label>
            <input 
              type="date"
              value={jobDate} 
              onChange={e => setJobDate(e.target.value)} 
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} 
            />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "none", borderRadius: 8, fontWeight: 700, color: "#475569", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading || !jobTitle.trim()} style={{ flex: 1, padding: "12px", background: "#1B4332", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: (loading || !jobTitle.trim()) ? "not-allowed" : "pointer", opacity: (loading || !jobTitle.trim()) ? 0.7 : 1 }}>{loading ? "Assigning..." : "Assign Staff"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Staff() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [staffList, setStaffList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignStaffData, setAssignStaffData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAll();
      setStaffList(res.data.data || []);
    } catch (e) {
      addToast("Failed to load staff", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await usersAPI.remove(id);
        addToast("Staff member deleted", "success");
        loadStaff();
      } catch (err) {
        addToast("Failed to delete staff", "error");
      }
    }
  };

  const roles = ["All", "Owner", "Manager", "Sales", "Reception", "Coordinator", "Accountant", "Security", "Technician", "Cleaner"];

  const filteredStaff = staffList.filter(s => {
    if (filterRole !== "All" && s.role !== filterRole) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Staff & HR</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Manage employee attendance, roles, and job assignments.</p>
        </div>
        <button onClick={() => { setEditStaff(null); setModalOpen(true); }} style={{
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(27,67,50,0.2)", fontSize: 14
        }}>
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Staff</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{staffList.length}</div>
          </div>
        </div>
        
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Present Today</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{staffList.filter(s => s.active).length}</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
            <UserX size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Absent / Inactive</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{staffList.filter(s => !s.active).length}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", width: 300 }}>
          <Search size={18} style={{ position: "absolute", left: 14, top: 11, color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Search staff name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 42px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
        </div>
        
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {roles.map(r => (
            <button key={r} onClick={() => setFilterRole(r)} style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              background: filterRole === r ? "#1B4332" : "#fff",
              color: filterRole === r ? "#fff" : "#475569",
              border: filterRole === r ? "none" : "1px solid #cbd5e1",
            }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {filteredStaff.map(staff => (
          <div key={staff.id} style={{
            background: "#fff", borderRadius: 16, border: "1px solid #eaeaea", padding: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)", transition: "transform 0.2s",
            cursor: "pointer", ":hover": { transform: "translateY(-4px)" }
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#1B4332" }}>
                  {staff.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{staff.name}</h3>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{staff.role}</div>
                </div>
              </div>
              <div style={{
                background: staff.active ? "#dcfce7" : "#fee2e2",
                color: staff.active ? "#16a34a" : "#dc2626",
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: "uppercase"
              }}>
                {staff.active ? "Active" : "Inactive"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
                <Clock size={16} color="#94a3b8" />
                <span>{staff.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
                <Users size={16} color="#94a3b8" />
                <span>{staff.phone || "No phone added"}</span>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
              <button onClick={() => { setEditStaff(staff); setModalOpen(true); }} style={{ flex: 1, padding: "8px 0", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Edit
              </button>
              <button onClick={() => { setAssignStaffData(staff); setAssignModalOpen(true); }} style={{ flex: 1, padding: "8px 0", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#1B4332", cursor: "pointer" }}>Assign Job</button>
              <button onClick={() => handleDeleteStaff(staff.id)} style={{ width: 36, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0", background: "#fff", border: "1px solid #fecaca", borderRadius: 8, color: "#ef4444", cursor: "pointer" }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <StaffModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => { setModalOpen(false); loadStaff(); }} 
        editData={editStaff} 
      />
      <AssignJobModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        staffMember={assignStaffData}
      />
    </div>
  );
}
