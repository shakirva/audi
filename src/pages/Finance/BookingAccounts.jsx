import React, { useState, useEffect } from "react";
import { BookOpen, Search, ArrowRight, ExternalLink } from "lucide-react";
import { bookingsAPI } from "../../services/api";
import { useToast } from "../../components/Toast";
import { Link } from "react-router-dom";

export default function BookingAccounts() {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsAPI.getAll({ limit: 50 });
      setBookings(res.data.data?.data || res.data.data || []);
    } catch (error) {
      addToast("Failed to fetch booking accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter(b => {
    const matchesSearch = b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.bookingId || b.id)?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Booking Accounts</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>The single source of truth for every booking's financials.</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", width: 250 }}
            />
          </div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", color: "#334155", fontWeight: 500, cursor: "pointer" }}
          >
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Tentative">Tentative</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Booking ID</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Customer</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Event Date</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Amount</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Advance</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading bookings...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No bookings found.</td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b._id || b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "#334155" }}>{b.bookingId || b.id}</td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{b.customerName}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{b.phone}</div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>{new Date(b.date).toLocaleDateString()}</td>
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "#0f172a" }}>₹{Number(b.totalAmount || 0).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px", color: "#16a34a", fontWeight: 500 }}>₹{Number(b.advance || 0).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <Link 
                        to={`/finance/booking-accounts/${b.id}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f1f5f9", color: "#334155", borderRadius: 6, textDecoration: "none", fontSize: 13, fontWeight: 600 }}
                      >
                        Dashboard <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
