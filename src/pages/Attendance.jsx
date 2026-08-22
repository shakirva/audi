import React, { useState, useEffect } from "react";
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Edit3, Search } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmProvider";
import { generateAttendanceReport } from "../utils/documentGenerator";

import { attendanceAPI, usersAPI } from "../services/api";
export default function Attendance() {
  const { confirm } = useConfirm();
  const { user, role } = useRole();
  const { addToast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isStaffView = role !== "Owner" && role !== "SuperAdmin";

  // For owner/admin:
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Admin/Owner view for selected date
      const params = {};
      if (!isStaffView) {
        params.date = selectedDate;
      }
      
      const [attRes, userRes] = await Promise.all([
        attendanceAPI.getAll(params),
        !isStaffView ? usersAPI.getAll() : Promise.resolve({ data: { success: true, data: [] } })
      ]);

      let attData = attRes.data?.success ? attRes.data.data : [];
      
      if (!isStaffView && userRes.data?.success) {
        const allUsers = userRes.data.data.filter(u => u.status !== false && u.role !== "SuperAdmin");
        const combined = allUsers.map(u => {
          const record = attData.find(a => a.userId === u.id);
          if (record) return record;
          return {
            id: `virtual-${u.id}`,
            userId: u.id,
            User: { id: u.id, name: u.name, role: u.role },
            date: selectedDate,
            status: "Not Marked",
            checkIn: null,
            checkOut: null
          };
        });
        setAttendance(combined);
      } else {
        setAttendance(attData);
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch attendance data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await attendanceAPI.checkIn();
      if (res.data?.success) {
        addToast("Checked in successfully!", "success");
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to check in", "error");
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await attendanceAPI.checkOut();
      if (res.data?.success) {
        addToast("Checked out successfully!", "success");
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to check out", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm("Are you sure you want to delete this record?"))) return;
    try {
      await attendanceAPI.remove(id);
      addToast("Record deleted", "success");
      fetchData();
    } catch (err) {
      addToast("Failed to delete record", "error");
    }
  };

  const handleEdit = async (record) => {
    const newCheckIn = window.prompt("Enter Check In time (e.g., 09:00 AM)", record.checkIn || "");
    if (newCheckIn === null) return;
    const newCheckOut = window.prompt("Enter Check Out time (e.g., 06:00 PM)", record.checkOut || "");
    if (newCheckOut === null) return;
    
    try {
      await attendanceAPI.update(record.id, { checkIn: newCheckIn, checkOut: newCheckOut });
      addToast("Record updated", "success");
      fetchData();
    } catch (err) {
      addToast("Failed to update record", "error");
    }
  };

  const handleAdminCheckIn = async (userId, userDate) => {
    try {
      const res = await attendanceAPI.checkIn({ userId, date: userDate });
      if (res.data?.success) {
        addToast("Staff checked in successfully", "success");
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to check in staff", "error");
    }
  };

  const handleAdminCheckOut = async (userId, userDate) => {
    try {
      const res = await attendanceAPI.checkOut({ userId, date: userDate });
      if (res.data?.success) {
        addToast("Staff checked out successfully", "success");
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to check out staff", "error");
    }
  };

  const handleExportMonthly = async () => {
    try {
      const dateObj = new Date(selectedDate);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1; // 1-12
      const monthName = dateObj.toLocaleString('default', { month: 'long' });

      addToast("Generating report...", "info");

      const [attRes, userRes] = await Promise.all([
        attendanceAPI.getAll({ month, year }),
        usersAPI.getAll()
      ]);

      const attData = attRes.data?.success ? attRes.data.data : [];
      const allUsers = userRes.data?.success ? userRes.data.data.filter(u => u.status !== false && u.role !== "SuperAdmin") : [];

      await generateAttendanceReport(monthName, year, attData, allUsers);
      addToast("Report generated successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to generate report", "error");
    }
  };

  const todayEntry = attendance.find(a => a.userId === user?.id && a.date === new Date().toISOString().split("T")[0]);

  const filteredAttendance = attendance.filter(a => a.User?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 sm:p-6" style={{ maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", color: "#0D2418" }}>
            {isStaffView ? "My Attendance" : "Staff Attendance"}
          </h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Track daily check-ins and working hours.</p>
        </div>
      </div>

      {isStaffView && (
        <div className="flex flex-col sm:flex-row" style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #eaeaea", marginBottom: 24, justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111" }}>Today's Status</h3>
            <div style={{ fontSize: 14, color: "#666", display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarIcon size={14} /> {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div className="w-full sm:w-auto grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ display: "flex" }}>
            <button 
              onClick={handleCheckIn}
              disabled={!!todayEntry?.checkIn}
              className="w-full sm:w-auto justify-center"
              style={{ background: todayEntry?.checkIn ? "#f1f5f9" : "#1B4332", color: todayEntry?.checkIn ? "#94a3b8" : "#fff", padding: "12px 24px", borderRadius: 10, fontWeight: 700, border: "none", cursor: todayEntry?.checkIn ? "not-allowed" : "pointer", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
            >
              <CheckCircle size={18} /> {todayEntry?.checkIn ? `Checked In at ${todayEntry.checkIn}` : "Check In"}
            </button>
            <button 
              onClick={handleCheckOut}
              disabled={!todayEntry?.checkIn || !!todayEntry?.checkOut}
              className="w-full sm:w-auto justify-center"
              style={{ background: !todayEntry?.checkIn || todayEntry?.checkOut ? "#f1f5f9" : "#dc2626", color: !todayEntry?.checkIn || todayEntry?.checkOut ? "#94a3b8" : "#fff", padding: "12px 24px", borderRadius: 10, fontWeight: 700, border: "none", cursor: (!todayEntry?.checkIn || todayEntry?.checkOut) ? "not-allowed" : "pointer", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
            >
              <XCircle size={18} /> {todayEntry?.checkOut ? `Checked Out at ${todayEntry.checkOut}` : "Check Out"}
            </button>
          </div>
        </div>
      )}

      {!isStaffView && (
        <div className="flex flex-col sm:flex-row gap-4" style={{ marginBottom: 20, alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>Select Date:</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" }}
              />
            </div>
            <button onClick={handleExportMonthly} style={{ background: "#1B4332", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              Export Monthly Report
            </button>
          </div>
          <div style={{ position: "relative" }} className="w-full sm:w-72">
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search staff by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 16px 8px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", width: "100%" }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>Loading...</div>
      ) : filteredAttendance.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#999", background: "#fff", borderRadius: 12, border: "1px solid #eaeaea" }}>No attendance records found.</div>
      ) : (
        <>
          <div className="hidden md:block" style={{ background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #eaeaea", textAlign: "left" }}>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Date</th>
                  {!isStaffView && <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Staff Member</th>}
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Status</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Check In</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555" }}>Check Out</th>
                  {!isStaffView && <th style={{ padding: "16px 20px", fontWeight: 700, color: "#555", textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 20px", fontWeight: 600, color: "#333" }}>{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    {!isStaffView && <td style={{ padding: "16px 20px", color: "#111", fontWeight: 600 }}>{a.User?.name} <span style={{ fontSize: 12, color: "#666", fontWeight: 400 }}>({a.User?.role})</span></td>}
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ background: a.status === "Present" ? "#dcfce7" : a.status === "Not Marked" ? "#f1f5f9" : "#fee2e2", color: a.status === "Present" ? "#166534" : a.status === "Not Marked" ? "#64748b" : "#dc2626", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{a.status}</span>
                    </td>
                    <td style={{ padding: "16px 20px", color: "#555", fontWeight: 500 }}>{a.checkIn || "—"}</td>
                    <td style={{ padding: "16px 20px", color: "#555", fontWeight: 500 }}>{a.checkOut || "—"}</td>
                    {!isStaffView && (
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                          {!a.checkIn ? (
                            <button onClick={() => handleAdminCheckIn(a.userId, a.date)} style={{ background: "#1B4332", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Check In</button>
                          ) : !a.checkOut ? (
                            <button onClick={() => handleAdminCheckOut(a.userId, a.date)} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Check Out</button>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", padding: "6px 12px" }}>Completed</span>
                          )}
                          
                          {a.id && !a.id.toString().startsWith("virtual") && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => handleEdit(a)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}><Edit3 size={16} /></button>
                              <button onClick={() => handleDelete(a.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 0 }}><Trash2 size={16} /></button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden flex flex-col gap-4">
            {filteredAttendance.map(a => (
              <div key={a.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    {!isStaffView ? (
                      <>
                        <div style={{ fontWeight: 700, color: "#111", fontSize: 15 }}>{a.User?.name}</div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{a.User?.role} • {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      </>
                    ) : (
                      <div style={{ fontWeight: 700, color: "#111", fontSize: 15 }}>{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    )}
                  </div>
                  <div>
                    <span style={{ background: a.status === "Present" ? "#dcfce7" : a.status === "Not Marked" ? "#f1f5f9" : "#fee2e2", color: a.status === "Present" ? "#166534" : a.status === "Not Marked" ? "#64748b" : "#dc2626", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, display: "inline-block" }}>{a.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4" style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Check In</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{a.checkIn || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Check Out</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{a.checkOut || "—"}</div>
                  </div>
                </div>

                {!isStaffView && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #e2e8f0", paddingTop: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {!a.checkIn ? (
                        <button onClick={() => handleAdminCheckIn(a.userId, a.date)} style={{ background: "#1B4332", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Check In</button>
                      ) : !a.checkOut ? (
                        <button onClick={() => handleAdminCheckOut(a.userId, a.date)} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Check Out</button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Completed</span>
                      )}
                    </div>
                    {a.id && !a.id.toString().startsWith("virtual") && (
                      <div style={{ display: "flex", gap: 16 }}>
                        <button onClick={() => handleEdit(a)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}><Edit3 size={18} /></button>
                        <button onClick={() => handleDelete(a.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 0 }}><Trash2 size={18} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
