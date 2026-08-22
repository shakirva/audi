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
  const [filterBalance, setFilterBalance] = useState("All");

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
                          
    let matchesBalance = true;
    if (filterBalance === "Pending") {
      matchesBalance = Number(b.advance || 0) < Number(b.totalAmount || 0);
    } else if (filterBalance === "Paid") {
      matchesBalance = Number(b.advance || 0) >= Number(b.totalAmount || 0) && Number(b.totalAmount || 0) > 0;
    }
    
    return matchesSearch && matchesBalance;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Booking Accounts</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>The single source of truth for every booking's financials.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto" style={{ gap: 12, alignItems: "stretch" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
            />
          </div>
          <select 
            value={filterBalance} 
            onChange={(e) => setFilterBalance(e.target.value)}
            className="w-full sm:w-auto"
            style={{ padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", color: "#334155", fontWeight: 500, cursor: "pointer" }}
          >
            <option value="All">All Balances</option>
            <option value="Pending">Pending Balance</option>
            <option value="Paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Unified Responsive Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div style={{ gridColumn: "1 / -1", padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 16 }}>Loading booking accounts...</div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 16 }}>No booking accounts found.</div>
        ) : (
          filtered.map((b) => {
            const total = Number(b.totalAmount || 0);
            const advance = Number(b.advance || 0) + Number(b.depositAmount || 0);
            const balance = total - advance;
            const isPaid = balance <= 0 && total > 0;

            return (
              <div key={b._id || b.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: 20, transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{b.bookingId || b.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isPaid ? "#16a34a" : "#f59e0b" }}>{isPaid ? "Fully Paid" : "Balance Due"}</span>
                    </div>
                    <h3 style={{ margin: "4px 0", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{b.customerName}</h3>
                    <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                      {new Date(b.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Total Amount</div>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 18 }}>₹{total.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Received</div>
                    <div style={{ fontWeight: 800, color: "#16a34a", fontSize: 18 }}>₹{advance.toLocaleString()}</div>
                  </div>
                </div>

                <Link 
                  to={`/finance/booking-accounts/${b.id}`}
                  style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px", background: "#0D2418", color: "#fff", borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: 700, width: "100%", boxSizing: "border-box", transition: "background 0.2s", marginTop: "auto" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1B4332"}
                  onMouseLeave={e => e.currentTarget.style.background = "#0D2418"}
                >
                  <BookOpen size={18} /> Open Financial Dashboard <ExternalLink size={16} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
