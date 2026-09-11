import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, RefreshCw, Wallet, ArrowUpRight, Banknote, CreditCard, Calendar, Clock, LayoutGrid, List, MessageCircle, Printer } from "lucide-react";
import { bookingsAPI, paymentsAPI, accountsAPI, settingsAPI, vendorsAPI, isPlanRestriction } from "../../services/api";
import { useToast } from "../../components/Toast";
import CollectPaymentModal from "./CollectPaymentModal";
import PaymentHistoryModal from "./PaymentHistoryModal";
import { generateVendorReceipt } from "../../utils/documentGenerator";

export default function PaymentsAndReceipts() {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [settings, setSettings] = useState({});
  
  // Modal states
  const [collectPaymentBooking, setCollectPaymentBooking] = useState(null);
  const [historyBooking, setHistoryBooking] = useState(null);
  const [collectPaymentVendor, setCollectPaymentVendor] = useState(null);
  const [historyVendor, setHistoryVendor] = useState(null);
  const [venueName, setVenueName] = useState("Our Auditorium");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetching up to 100 recent bookings to show payments pending
      const [bookingsRes, dashboardRes, settingsRes, vendorsRes] = await Promise.all([
        bookingsAPI.getAll({ limit: 100 }),
        accountsAPI.getDashboard(),
        settingsAPI.get().catch(() => ({ data: { data: {} } })),
        vendorsAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);
      setBookings(bookingsRes.data.data || []);
      setDashboardData(dashboardRes.data.data || null);
      setSettings(settingsRes.data?.data || {});
      setVendors(vendorsRes.data?.data || []);
    } catch (err) {
      if (!isPlanRestriction(err)) addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    settingsAPI.get().then(res => {
      const name = res.data?.data?.venueName;
      if (name) setVenueName(name);
    }).catch(() => {});
  }, []);

  const sendPaymentReminder = (b) => {
    const total = Number(b.totalAmount) || 0;
    const collected = (Number(b.advance) || 0) + (Number(b.depositAmount) || 0);
    const balance = Math.max(0, total - collected);
    
    if (balance <= 0) {
      alert("No pending balance for this booking.");
      return;
    }
    
    const venueName = settings?.venueName || "Our Auditorium";
    const msg = `Hello ${b.customerName},\n\nThis is a gentle reminder regarding your upcoming event '${b.eventType}' at ${venueName} on ${new Date(b.date).toLocaleDateString("en-IN")}.\n\nYour current pending balance is ₹${balance.toLocaleString()}.\n\nPlease arrange the payment at your earliest convenience. Thank you!`;
    
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

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (b.customerName || "").toLowerCase().includes(q) ||
        (b.id || "").toLowerCase().includes(q) ||
        (b.bookingNumber || "").toLowerCase().includes(q)
      );
    });
  }, [bookings, search]);

  // Aggregate metrics
  const totalCollected = bookings.reduce((sum, b) => sum + (Number(b.advance) || 0) + (Number(b.depositAmount) || 0), 0);
  const totalOutstanding = bookings.reduce((sum, b) => {
    const total = Number(b.totalAmount) || 0;
    const paid = (Number(b.advance) || 0) + (Number(b.depositAmount) || 0);
    return sum + Math.max(0, total - paid);
  }, 0);

  const handlePaymentSuccess = () => {
    setCollectPaymentBooking(null);
    fetchBookings();
  };

  const handleVendorPaymentSuccess = () => {
    setCollectPaymentVendor(null);
    fetchBookings();
  };

  // Helper functions
  const formatMoney = (amount) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="hm-bookings-wrapper">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, background: "#f0fdf4", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={24} color="#166534" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", color: "#0f172a", letterSpacing: "-0.5px" }}>Payments & Receipts</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#64748b", fontWeight: 500 }}>
              Complete booking financial center. Track, collect, and manage all payments.
            </p>
          </div>
        </div>
      </div>

      {/* Top Section */}
      <div className="hm-payments-top-section" style={{ display: "flex", flexDirection: "column" }}>
        
        {/* KPI Cards */}
        <div className="hm-payments-balances" style={{ order: window.innerWidth < 768 ? 2 : 1 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 36, height: 36, background: "#f0fdf4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <ArrowUpRight size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{formatMoney(totalCollected)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Collected</div>
        </div>
        <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 36, height: 36, background: "#fef2f2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <ArrowUpRight size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{formatMoney(totalOutstanding)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Outstanding Balance</div>
        </div>
        <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 36, height: 36, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Banknote size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            {dashboardData?.summary?.cashBalance !== undefined ? formatMoney(dashboardData.summary.cashBalance) : "—"}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Cash Balance</div>
        </div>
        <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 36, height: 36, background: "#faf5ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <CreditCard size={18} color="#9333ea" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            {dashboardData?.summary?.bankBalance !== undefined ? formatMoney(dashboardData.summary.bankBalance) : "—"}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Bank Balance</div>
        </div>
      </div>

        </div>

        {/* Toolbar */}
        <div className="hm-payments-toolbar" style={{ order: window.innerWidth < 768 ? 1 : 2 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, flex: 1, justifyContent: "flex-end" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 350 }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: 12, color: "#94a3b8" }} />
            <input 
              type="text" 
              placeholder="Search booking, customer..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 16px 10px 42px", borderRadius: 10, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, fontWeight: 500, boxSizing: "border-box" }}
            />
          </div>
          <button style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "0 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Filter size={16} /> Filter
          </button>
        </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No bookings found.</div>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden md:block hm-hide-scrollbar" style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflowX: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Booking</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Event Date</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Total Amount</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Collected</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Outstanding</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Progress</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const total = Number(b.totalAmount) || 0;
                  const collected = (Number(b.advance) || 0) + (Number(b.depositAmount) || 0);
                  const outstanding = Math.max(0, total - collected);
                  const progress = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
                  return (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{b.customerName || "Unknown"}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{b.bookingNumber || b.id}</div>
                      </td>
                      <td style={{ padding: "16px 20px", color: "#64748b", fontWeight: 500 }}>
                        {b.date ? new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: "#334155" }}>{formatMoney(total)}</td>
                      <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>{formatMoney(collected)}</td>
                      <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{formatMoney(outstanding)}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <span style={{ background: progress === 100 ? "#dcfce7" : "#eff6ff", color: progress === 100 ? "#166534" : "#1d4ed8", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                          {progress}%
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          {outstanding > 0 && (
                            <button onClick={() => sendPaymentReminder(b)} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "6px 12px", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }} title="Send Balance Alert"><MessageCircle size={14} /></button>
                          )}
                          <button onClick={() => setHistoryBooking(b)} style={{ background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>History</button>
                          <button onClick={() => setCollectPaymentBooking(b)} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Collect</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden flex flex-col gap-4">
            {filtered.map(b => {
              const total = Number(b.totalAmount) || 0;
              const collected = (Number(b.advance) || 0) + (Number(b.depositAmount) || 0);
              const outstanding = Math.max(0, total - collected);
              const progress = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
              
              return (
                <div key={b.id} style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", overflow: "hidden", wordBreak: "break-word" }}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fffbeb", border: "1px solid #fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", flexShrink: 0 }}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{b.customerName || "Unknown Customer"}</span>
                          <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>{b.bookingNumber || b.id}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Clock size={13} />
                          {b.date ? new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBD"}
                          <span>•</span>
                          {b.eventType || "Event"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                      {outstanding > 0 && (
                        <button 
                          onClick={() => sendPaymentReminder(b)}
                          style={{ flex: "1 1 auto", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "8px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                        >
                          <MessageCircle size={16} /> Alert
                        </button>
                      )}
                      <button 
                        onClick={() => setHistoryBooking(b)}
                        style={{ flex: "1 1 auto", background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                      >
                        History
                      </button>
                      <button 
                        onClick={() => setCollectPaymentBooking(b)}
                        style={{ flex: "1 1 auto", background: "#0f172a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 4px rgba(15,23,42,0.2)" }}
                      >
                        Collect
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:flex md:gap-10 gap-4 mb-5">
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Booking Amount</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#334155" }}>{formatMoney(total)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Collected</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>{formatMoney(collected)}</div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Outstanding</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>{formatMoney(outstanding)}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Payment Progress</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>{progress}%</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#16a34a" : "#3b82f6", borderRadius: 6 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      {/* Vendor Receipts Section */}
      {vendors.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "#fff7ed", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowUpRight size={18} color="#ea580c" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Vendor Receipts</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Income received from vendors (catering, services, etc.)</p>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:block" style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Vendor</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Phone / Email</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Total Amount</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Collected</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Outstanding</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Progress</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "#64748b", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(vendor => {
                  const total = Number(vendor.totalBilled) || 0;
                  const collected = Number(vendor.totalPaid) || 0;
                  const outstanding = Math.max(0, total - collected);
                  const progress = total > 0 ? Math.round((collected / total) * 100) : 0;
                  return (
                    <tr key={vendor.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{vendor.name}</span>
                        <span style={{ background: "#fff7ed", color: "#ea580c", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, marginLeft: 8, border: "1px solid #fed7aa" }}>Vendor</span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 13 }}>{vendor.phone || vendor.email || "—"}</td>
                      <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "#334155" }}>{formatMoney(total)}</td>
                      <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>{formatMoney(collected)}</td>
                      <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "#dc2626" }}>{formatMoney(outstanding)}</td>
                      <td style={{ padding: "14px 20px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: progress === 100 ? "#dcfce7" : "#f1f5f9", padding: "4px 10px", borderRadius: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: progress === 100 ? "#166534" : "#475569" }}>{progress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button onClick={() => setHistoryVendor(vendor)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            History
                          </button>
                          <button onClick={() => setCollectPaymentVendor(vendor)} style={{ background: "#0f172a", border: "none", padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                            Collect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                  <td colSpan={4} style={{ padding: "14px 20px", fontWeight: 800, color: "#0f172a", fontSize: 14 }}>Total Vendor Income</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 800, color: "#16a34a", fontSize: 16 }}>{formatMoney(vendors.reduce((s, v) => s + Number(v.totalPaid || 0), 0))}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile */}
          <div className="block md:hidden flex flex-col gap-3">
            {vendors.map(vendor => {
              const total = Number(vendor.totalBilled) || 0;
              const collected = Number(vendor.totalPaid) || 0;
              const outstanding = Math.max(0, total - collected);
              const progress = total > 0 ? Math.round((collected / total) * 100) : 0;
              return (
                <div key={vendor.id} style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 16 }}>{vendor.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{vendor.phone || vendor.email || "—"}</div>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: progress === 100 ? "#dcfce7" : "#f1f5f9", padding: "4px 10px", borderRadius: 12, height: "fit-content" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: progress === 100 ? "#166534" : "#475569" }}>{progress}%</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Collected</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>{formatMoney(collected)}</div>
                    </div>
                    <div style={{ background: "#fff1f2", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9f1239", textTransform: "uppercase", marginBottom: 4 }}>Outstanding</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>{formatMoney(outstanding)}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setHistoryVendor(vendor)} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      History
                    </button>
                    <button onClick={() => setCollectPaymentVendor(vendor)} style={{ flex: 1, background: "#0f172a", border: "none", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Collect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collect Payment Modal (Bookings) */}
      <CollectPaymentModal
        open={!!collectPaymentBooking}
        booking={collectPaymentBooking}
        onClose={() => setCollectPaymentBooking(null)}
        onSuccess={handlePaymentSuccess}
      />
      
      {/* Payment History Modal (Bookings) */}
      <PaymentHistoryModal
        open={!!historyBooking}
        booking={historyBooking}
        onClose={() => setHistoryBooking(null)}
      />

      {/* Collect Payment Modal (Vendors) */}
      <CollectPaymentModal
        open={!!collectPaymentVendor}
        vendor={collectPaymentVendor}
        onClose={() => setCollectPaymentVendor(null)}
        onSuccess={handleVendorPaymentSuccess}
      />
      
      {/* Payment History Modal (Vendors) */}
      <PaymentHistoryModal
        open={!!historyVendor}
        vendor={historyVendor}
        onClose={() => setHistoryVendor(null)}
      />

    </div>
  );
}
