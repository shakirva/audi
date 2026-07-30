import React, { useState, useEffect } from "react";
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Edit3, Search } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useToast } from "../components/Toast";

// Mock API for now
const getMockAttendance = () => JSON.parse(localStorage.getItem("hm_attendance_mock") || "[]");
const saveMockAttendance = (data) => localStorage.setItem("hm_attendance_mock", JSON.stringify(data));

export default function Attendance() {
  const { user, role } = useRole();
  const { addToast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // For owner/admin:
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      let data = getMockAttendance();
      
      // If it's a staff member, they only see their own attendance
      if (role === "Sales" || role === "Operations") {
        data = data.filter(a => a.userId === user?.id || a.userName === user?.name);
      } else {
        // Owner/Admin sees attendance for the selected date
        data = data.filter(a => a.date === selectedDate);
      }
      setAttendance(data);
      setLoading(false);
    }, 400);
  };

  const handleCheckIn = () => {
    const data = getMockAttendance();
    const today = new Date().toISOString().split("T")[0];
    const existing = data.find(a => (a.userId === user?.id || a.userName === user?.name) && a.date === today);
    if (existing && existing.checkIn) {
      addToast("You have already checked in today.", "error");
      return;
    }
    
    const newEntry = {
      id: Date.now(),
      userId: user?.id || Date.now(),
      userName: user?.name || "Unknown User",
      role: role,
      date: today,
      checkIn: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      checkOut: null,
      status: "Present",
    };
    saveMockAttendance([...data, newEntry]);
    addToast("Checked in successfully!", "success");
    fetchData();
  };

  const handleCheckOut = () => {
    const data = getMockAttendance();
    const today = new Date().toISOString().split("T")[0];
    const index = data.findIndex(a => (a.userId === user?.id || a.userName === user?.name) && a.date === today);
    if (index === -1 || !data[index].checkIn) {
      addToast("You need to check in first.", "error");
      return;
    }
    if (data[index].checkOut) {
      addToast("You have already checked out.", "error");
      return;
    }

    data[index].checkOut = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    saveMockAttendance(data);
    addToast("Checked out successfully!", "success");
    fetchData();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const data = getMockAttendance().filter(a => a.id !== id);
    saveMockAttendance(data);
    addToast("Record deleted", "success");
    fetchData();
  };

  const handleEdit = (record) => {
    const newCheckIn = window.prompt("Enter Check In time (e.g., 09:00 AM)", record.checkIn || "");
    const newCheckOut = window.prompt("Enter Check Out time (e.g., 06:00 PM)", record.checkOut || "");
    
    if (newCheckIn !== null || newCheckOut !== null) {
      const data = getMockAttendance();
      const idx = data.findIndex(a => a.id === record.id);
      if (idx !== -1) {
        if (newCheckIn !== null) data[idx].checkIn = newCheckIn;
        if (newCheckOut !== null) data[idx].checkOut = newCheckOut;
        saveMockAttendance(data);
        addToast("Record updated", "success");
        fetchData();
      }
    }
  };

  // Check if current user checked in today
  const todayEntry = attendance.find(a => (a.userId === user?.id || a.userName === user?.name) && a.date === new Date().toISOString().split("T")[0]);

  const filteredAttendance = attendance.filter(a => a.userName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", color: "#0D2418" }}>
            {role === "Sales" || role === "Operations" ? "My Attendance" : "Staff Attendance"}
          </h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Track daily check-ins and working hours.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={fetchData} style={{ background: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {(role === "Sales" || role === "Operations") && (
        <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #eaeaea", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111" }}>Today's Status</h3>
            <div style={{ fontSize: 14, color: "#666", display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarIcon size={14} /> {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button 
              onClick={handleCheckIn}
              disabled={!!todayEntry?.checkIn}
              style={{ background: todayEntry?.checkIn ? "#f1f5f9" : "#1B4332", color: todayEntry?.checkIn ? "#94a3b8" : "#fff", padding: "12px 24px", borderRadius: 10, fontWeight: 700, border: "none", cursor: todayEntry?.checkIn ? "not-allowed" : "pointer", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
            >
              <CheckCircle size={18} /> {todayEntry?.checkIn ? `Checked In at ${todayEntry.checkIn}` : "Check In"}
            </button>
            <button 
              onClick={handleCheckOut}
              disabled={!todayEntry?.checkIn || !!todayEntry?.checkOut}
              style={{ background: !todayEntry?.checkIn || todayEntry?.checkOut ? "#f1f5f9" : "#dc2626", color: !todayEntry?.checkIn || todayEntry?.checkOut ? "#94a3b8" : "#fff", padding: "12px 24px", borderRadius: 10, fontWeight: 700, border: "none", cursor: (!todayEntry?.checkIn || todayEntry?.checkOut) ? "not-allowed" : "pointer", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
            >
              <XCircle size={18} /> {todayEntry?.checkOut ? `Checked Out at ${todayEntry.checkOut}` : "Check Out"}
            </button>
          </div>
        </div>
      )}

      {role !== "Sales" && role !== "Operations" && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>Select Date:</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search staff by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 16px 8px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", width: 250 }}
            />
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #eaeaea", textAlign: "left" }}>
              <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Date</th>
              {role !== "Sales" && role !== "Operations" && <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Staff Member</th>}
              <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Status</th>
              <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Check In</th>
              <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Check Out</th>
              {role !== "Sales" && role !== "Operations" && <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555", textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#999" }}>Loading...</td></tr>
            ) : filteredAttendance.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#999" }}>No attendance records found.</td></tr>
            ) : (
              filteredAttendance.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 600, color: "#333" }}>{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  {role !== "Sales" && role !== "Operations" && <td style={{ padding: "16px 20px", color: "#111", fontWeight: 600 }}>{a.userName} <span style={{ fontSize: 12, color: "#666", fontWeight: 400 }}>({a.role})</span></td>}
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ background: a.status === "Present" ? "#dcfce7" : "#fee2e2", color: a.status === "Present" ? "#166534" : "#dc2626", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{a.status}</span>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#555", fontWeight: 500 }}>{a.checkIn || "—"}</td>
                  <td style={{ padding: "16px 20px", color: "#555", fontWeight: 500 }}>{a.checkOut || "—"}</td>
                  {role !== "Sales" && role !== "Operations" && (
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <button onClick={() => handleEdit(a)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", marginRight: 8 }}><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(a.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
