import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Filter, CircleDashed, CheckCircle2, ChevronRight, X, Calendar, MapPin } from "lucide-react";
import BookingDetailModal from "../components/BookingDetailModal";
import { useBookings } from "../context/BookingsContext";

export default function Bookings() {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const { bookings } = useBookings();

  const getStatusColor = (status) => {
    switch(status) {
      case "Draft": return { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" };
      case "Advance Pending": return { bg: "#fef08a", text: "#a16207", dot: "#eab308" };
      case "Ready For Job": return { bg: "#dcfce7", text: "#166534", dot: "#22c55e" };
      case "Confirmed": return { bg: "#e0f2fe", text: "#0369a1", dot: "#0ea5e9" };
      default: return { bg: "#f8f9fa", text: "#666", dot: "#ccc" };
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: 1600, margin: "0 auto", fontFamily: "'Inter', 'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 8px", color: "#0f172a", letterSpacing: "-1px" }}>Bookings</h1>
          <p style={{ margin: 0, fontSize: 16, color: "#64748b", fontWeight: 500 }}>Manage your event pipeline and operational handoffs.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: 14, color: "#94a3b8" }} />
            <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} 
              style={{ padding: "12px 20px 12px 44px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", width: 280, outline: "none", fontSize: 15, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }} />
          </div>
          <button style={{ padding: "12px 20px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, color: "#475569", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
            <Filter size={18} /> Filters
          </button>
        </motion.div>
      </div>

      {/* ── AIRBNB STYLE GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 32 }}>
        
        {bookings.map((b, i) => {
          const st = getStatusColor(b.status);
          const balance = b.totalAmount - b.advance;
          const progress = b.advance > 0 ? 82 : 45; // Mock progress
          
          return (
            <motion.div key={b.id} 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -8, scale: 1.01, boxShadow: "0 25px 50px rgba(0,0,0,0.06)" }}
              onClick={() => setDetail(b)} 
              style={{ background: "#fff", borderRadius: 24, padding: 24, border: "1px solid #f1f5f9", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}
            >
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: "#f8fafc", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9" }}>
                  {b.eventType === "Wedding" ? "💍" : "🎉"}
                </div>
                <div style={{ background: st.bg, color: st.text, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.dot }} /> {b.status}
                </div>
              </div>
              
              <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>{b.eventType}</h3>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: "#64748b", fontWeight: 600 }}>{b.customerName}</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24, padding: "16px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><Calendar size={14}/></div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Date</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><MapPin size={14}/></div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Hall</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{b.hall}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Remaining</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: balance > 0 ? "#ef4444" : "#10b981" }}>₹{balance.toLocaleString()}</div>
                </div>
                
                {/* Circular Progress Indicator (SVG) */}
                <div style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="40" height="40" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <motion.circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
                      strokeDasharray="251.2" strokeDashoffset="251.2"
                      animate={{ strokeDashoffset: 251.2 - (251.2 * (progress/100)) }} transition={{ duration: 1, delay: i * 0.1 }} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", fontSize: 11, fontWeight: 800, color: "#0f172a" }}>{progress}%</div>
                </div>
              </div>

            </motion.div>
          );
        })}

        {/* Empty State / Create Booking Hook */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bookings.length * 0.05 }}
          style={{ background: "#f8fafc", borderRadius: 32, padding: 32, border: "2px dashed #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 320 }}>
          <div style={{ width: 64, height: 64, borderRadius: 24, background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Plus size={32} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Need a new booking?</h3>
          <p style={{ margin: "0 0 32px", fontSize: 15, color: "#64748b", fontWeight: 500 }}>All operational bookings must originate from a CRM enquiry to ensure data integrity.</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: "14px 28px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 16, fontWeight: 700, cursor: "pointer", fontSize: 16 }}>Go to CRM Pipeline</motion.button>
        </motion.div>

      </div>

      {detail && <BookingDetailModal booking={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
