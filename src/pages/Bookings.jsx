import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Filter, Calendar, MapPin, Pencil, LayoutGrid, List, Users, IndianRupee, Eye, Trash2, MessageCircle } from "lucide-react";
import BookingDetailModal from "../components/BookingDetailModal";
import EditBookingModal from "../components/EditBookingModal";
import SafeDeleteModal from "../components/SafeDeleteModal";
import { useBookings } from "../context/BookingsContext";
import { useRole } from "../context/RoleContext";
import { useToast } from "../components/Toast";
import { bookingsAPI } from "../services/api";

export default function Bookings() {
  const { user, role } = useRole();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const { bookings, refetch } = useBookings();

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":            return { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" };
      case "Advance Pending":  return { bg: "#fef08a", text: "#a16207", dot: "#eab308" };
      case "Ready For Job":    return { bg: "#dcfce7", text: "#166534", dot: "#22c55e" };
      case "Confirmed":        return { bg: "#e0f2fe", text: "#0369a1", dot: "#0ea5e9" };
      case "Completed":        return { bg: "#f3e8ff", text: "#6d28d9", dot: "#7c3aed" };
      case "Cancelled":        return { bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444" };
      default:                 return { bg: "#f8f9fa", text: "#666",    dot: "#ccc" };
    }
  };

  const sendPaymentReminder = (b) => {
    const total = Number(b.totalAmount) || 0;
    const collected = (Number(b.advance) || 0) + (Number(b.depositAmount) || 0);
    const balance = Math.max(0, total - collected);
    
    if (balance <= 0) {
      alert("No pending balance for this booking.");
      return;
    }
    
    const msg = `Hello ${b.customerName},\n\nThis is a gentle reminder regarding your upcoming event '${b.eventType}' at Laural Garden Auditorium on ${new Date(b.date).toLocaleDateString("en-IN")}.\n\nYour current pending balance is ₹${balance.toLocaleString()}.\n\nPlease arrange the payment at your earliest convenience. Thank you!`;
    
    const num = (b.whatsapp || b.phone || "").replace(/\D/g, "");
    if (num) {
      const phoneNum = num.length === 10 ? `91${num}` : num;
      const text = encodeURIComponent(msg);
      const waUrl = `https://wa.me/${phoneNum}?text=${text}`;
      window.open(waUrl, "_blank");
    } else {
      alert("No phone number available for this customer.");
    }
  };

  const filtered = useMemo(() => {
    let baseBookings = bookings;
    if (role === "Sales") {
      baseBookings = baseBookings.filter(b => 
        b.createdBy === user?.name || 
        b.salesExecutiveName === user?.name || 
        b.bookedBy === user?.name ||
        b.userId === user?.id || 
        b.salesExecutiveId === user?.id
      );
    }
    return baseBookings.filter(b => {
      const nameMatch = !search || (b.customerName || "").toLowerCase().includes(search.toLowerCase())
        || (b.eventType || "").toLowerCase().includes(search.toLowerCase())
        || (b.hall || "").toLowerCase().includes(search.toLowerCase());
      const statusMatch = !statusFilter || b.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [bookings, search, statusFilter, role, user]);

  const uniqueStatuses = [...new Set(bookings.map(b => b.status).filter(Boolean))];

  const eventIcon = (type) => {
    if (!type) return "🎉";
    const t = type.toLowerCase();
    if (t.includes("wedding") || t.includes("nikkah")) return "💍";
    if (t.includes("birthday")) return "🎂";
    if (t.includes("corporate") || t.includes("conference")) return "💼";
    if (t.includes("reception")) return "🥂";
    return "🎉";
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1600, margin: "0 auto", fontFamily: "'DM Sans', 'Inter', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 4px", color: "#0f172a", letterSpacing: "-1px" }}>Bookings</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b", fontWeight: 500 }}>
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""} found
          </p>
        </motion.div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 340 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: 11, color: "#94a3b8" }} />
          <input type="text" placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", outline: "none", fontSize: 13, fontWeight: 500, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Status Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
            <option value="">All Status</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* View Toggle */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 2 }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                background: viewMode === "grid" ? "#fff" : "transparent",
                border: "none", borderRadius: 8, padding: "7px 14px",
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                fontWeight: 700, fontSize: 13,
                color: viewMode === "grid" ? "#1B4332" : "#64748b",
                boxShadow: viewMode === "grid" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                background: viewMode === "list" ? "#fff" : "transparent",
                border: "none", borderRadius: 8, padding: "7px 14px",
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                fontWeight: 700, fontSize: 13,
                color: viewMode === "list" ? "#1B4332" : "#64748b",
                boxShadow: viewMode === "list" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              <List size={15} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* ── GRID VIEW ── */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
          {filtered.map((b, i) => {
            const st = getStatusColor(b.status);
            const balance = (b.totalAmount || 0) - (b.advance || 0) - (b.depositAmount || 0);
            const paid = (b.totalAmount || 0) > 0 ? Math.round(((b.advance || 0) + (b.depositAmount || 0)) / (b.totalAmount || 1) * 100) : 0;

            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(0,0,0,0.08)" }}
                onClick={() => setDetail(b)}
                style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f1f5f9", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 0 }}
              >
                {/* Card top */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "#f8fafc", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9" }}>
                      {eventIcon(b.eventType)}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{b.eventType || "—"}</div>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{b.customerName || b.bookedBy || "—"}</div>
                    </div>
                  </div>
                  <div style={{ background: st.bg, color: st.text, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 8, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                    {b.status || "Draft"}
                  </div>
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Calendar size={13} color="#94a3b8" />
                    <div>
                      <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>Date</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                        {b.date ? new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <MapPin size={13} color="#94a3b8" />
                    <div>
                      <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>Hall · Session</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{b.hall || "—"} {b.session ? `· ${b.session}` : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Users size={13} color="#94a3b8" />
                    <div>
                      <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>Guests</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{b.guests || "—"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <IndianRupee size={13} color="#94a3b8" />
                    <div>
                      <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>Balance</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: balance > 0 ? "#ef4444" : "#10b981" }}>
                        ₹{Number(balance).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>PAID</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: paid >= 100 ? "#10b981" : "#f59e0b" }}>{paid}%</span>
                  </div>
                  <div style={{ height: 5, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(paid, 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      style={{ height: "100%", background: paid >= 100 ? "#10b981" : "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: 10 }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setDetail(b)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Eye size={13} /> View
                  </button>
                  {balance > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); sendPaymentReminder(b); }}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <MessageCircle size={13} /> Alert
                    </button>
                  )}
                  <button onClick={() => setEditBooking(b)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: b.bookingId || b.id, name: `${b.eventType} — ${b.customerName}` });
                  }}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>No bookings found</p>
              <p style={{ fontSize: 13 }}>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ── LIST / TABLE VIEW ── */}
      {viewMode === "list" && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e5e7eb" }}>
                {["#", "Customer", "Event Type", "Hall", "Session", "Date", "Guests", "Total (₹)", "Balance (₹)", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const st = getStatusColor(b.status);
                const balance = (b.totalAmount || 0) - (b.advance || 0) - (b.depositAmount || 0);
                return (
                  <motion.tr key={b.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1B4332", fontSize: 12 }}>
                      {b.bookingNumber || `#${b.id}`}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "#111827" }}>{b.customerName || "—"}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.phone || ""}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {eventIcon(b.eventType)} {b.eventType || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151", fontWeight: 600 }}>{b.hall || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{b.session || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#374151", whiteSpace: "nowrap" }}>
                      {b.date ? new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{b.guests || "—"}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#374151" }}>
                      {b.totalAmount ? `₹${Number(b.totalAmount).toLocaleString()}` : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 800, color: balance > 0 ? "#dc2626" : "#16a34a" }}>
                      ₹{Number(balance).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: st.bg, color: st.text, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />
                        {b.status || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {balance > 0 && (
                          <button onClick={e => { e.stopPropagation(); sendPaymentReminder(b); }}
                            style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <MessageCircle size={11} /> Alert
                          </button>
                        )}
                        <button onClick={e => { e.stopPropagation(); setDetail(b); }}
                          style={{ background: "#f8fafc", color: "#374151", border: "1px solid #e5e7eb", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Eye size={11} /> View
                        </button>
                        <button onClick={e => { e.stopPropagation(); setEditBooking(b); }}
                          style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: b.bookingId || b.id, name: `${b.eventType} — ${b.customerName}` });
                        }}
                          style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>No bookings found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <BookingDetailModal 
          booking={detail} 
          onClose={() => setDetail(null)} 
          onEdit={(b) => { setDetail(null); setEditBooking(b); }} 
          onDelete={(id) => {
            setDetail(null);
            setDeleteTarget({ id, name: `${detail.eventType} — ${detail.customerName}` });
          }}
        />
      )}
      <EditBookingModal
        open={!!editBooking}
        booking={editBooking}
        onClose={() => setEditBooking(null)}
        onSaved={() => { setEditBooking(null); refetch?.(); }}
      />
      <SafeDeleteModal
        type="booking"
        id={deleteTarget?.id}
        name={deleteTarget?.name}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { setDeleteTarget(null); refetch?.(); }}
        addToast={addToast}
      />
    </div>
  );
}
