import React, { useState } from "react";
import { Users, Search, Plus, UserCheck, UserX, Clock, Briefcase, Filter } from "lucide-react";

const DEMO_STAFF = [
  { id: "STF-001", name: "Suresh Kumar", role: "Manager", status: "Present", shift: "Morning (09:00 - 17:00)", phone: "+91 9447056789" },
  { id: "STF-002", name: "Anitha Nair", role: "Sales", status: "Present", shift: "Morning (09:00 - 17:00)", phone: "+91 9447098765" },
  { id: "STF-003", name: "Siddique", role: "Accountant", status: "Present", shift: "Morning (09:00 - 17:00)", phone: "+91 9447011111" },
  { id: "STF-004", name: "Rahul M", role: "Reception", status: "Present", shift: "Morning (09:00 - 17:00)", phone: "+91 9447022222" },
  { id: "STF-005", name: "Biju P", role: "Coordinator", status: "Absent", shift: "Morning (09:00 - 17:00)", phone: "+91 9447033333" },
  { id: "STF-006", name: "Ramesh", role: "Security", status: "Present", shift: "Night (17:00 - 02:00)", phone: "+91 9447044444" },
  { id: "STF-007", name: "Sajith", role: "Technician", status: "Present", shift: "Evening (14:00 - 22:00)", phone: "+91 9447055555" },
  { id: "STF-008", name: "Latha", role: "Cleaner", status: "On Leave", shift: "Morning (08:00 - 16:00)", phone: "+91 9447066666" },
  { id: "STF-009", name: "Mini", role: "Cleaner", status: "Present", shift: "Morning (08:00 - 16:00)", phone: "+91 9447077777" }
];

export default function Staff() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  const roles = ["All", "Manager", "Sales", "Reception", "Coordinator", "Accountant", "Security", "Technician", "Cleaner"];

  const filteredStaff = DEMO_STAFF.filter(s => {
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
        <button style={{
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(27,67,50,0.2)", fontSize: 14
        }}>
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Staff</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{DEMO_STAFF.length}</div>
          </div>
        </div>
        
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Present Today</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>7</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
            <UserX size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Absent / Leave</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>2</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eaeaea", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
            <Briefcase size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>On Active Job</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>4</div>
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
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{staff.name}</h3>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{staff.role}</div>
                </div>
              </div>
              <div style={{
                background: staff.status === "Present" ? "#dcfce7" : staff.status === "Absent" ? "#fee2e2" : "#fef3c7",
                color: staff.status === "Present" ? "#16a34a" : staff.status === "Absent" ? "#dc2626" : "#d97706",
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: "uppercase"
              }}>
                {staff.status}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
                <Clock size={16} color="#94a3b8" />
                <span>{staff.shift}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
                <Users size={16} color="#94a3b8" />
                <span>{staff.phone}</span>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "8px 0", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>View Profile</button>
              <button style={{ flex: 1, padding: "8px 0", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#1B4332", cursor: "pointer" }}>Assign Job</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
