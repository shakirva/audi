import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownRight, Wallet, AlertCircle, RefreshCw, ChevronRight, FileText, Download, CheckCircle, CreditCard, User, Calendar, Receipt, FileDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/ui/PageHeader";
import MetricCard from "../components/ui/MetricCard";
import { accountsAPI, paymentsAPI } from "../services/api";
import { useToast } from "../components/Toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Payments() {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  
  // Modals / Drawers
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);

  // Dynamic Data for Drawer
  const [bookingPayments, setBookingPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Form State for Collect Payment
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "Cash",
    referenceNumber: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch individual booking payments when drawer opens
  useEffect(() => {
    if (selectedBooking) {
      fetchBookingPayments(selectedBooking.id);
    }
  }, [selectedBooking]);

  const fetchBookingPayments = async (bookingId) => {
    setLoadingPayments(true);
    try {
      const res = await paymentsAPI.getAll({ bookingId });
      setBookingPayments(res.data.data || []);
    } catch (err) {
      console.error("Failed to load booking payments", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [outRes, dashRes] = await Promise.all([
        accountsAPI.getOutstanding({ onlyOutstanding: false }),
        accountsAPI.getDashboard()
      ]);
      
      let data = outRes.data.data || [];
      if (search) {
        data = data.filter(b => 
          (b.bookingId || "").toLowerCase().includes(search.toLowerCase()) || 
          (b.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
          (b.phone || "").toLowerCase().includes(search.toLowerCase())
        );
      }
      setBookings(data);
      setDashboardMetrics(dashRes.data.data.summary);
    } catch (err) {
      console.error("Failed to load payments", err);
      addToast("Failed to load payment data", "error");
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    setSubmitting(true);
    try {
      await paymentsAPI.create({
        bookingId: selectedBooking.id,
        customerId: selectedBooking.customerId,
        amount: Number(paymentForm.amount),
        paymentMode: paymentForm.paymentMode,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
        paymentDate: new Date().toISOString()
      });
      addToast("Payment collected successfully!", "success");
      setIsCollectPaymentOpen(false);
      setPaymentForm({ amount: "", paymentMode: "Cash", referenceNumber: "", notes: "" });
      fetchData(); // Refresh the list
      fetchBookingPayments(selectedBooking.id); // Refresh drawer payments
    } catch (err) {
      console.error("Failed to collect payment", err);
      addToast(err.response?.data?.message || "Failed to collect payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadStatement = () => {
    if (!selectedBooking) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Customer Statement", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Customer: ${selectedBooking.customerName}`, 14, 32);
    doc.text(`Booking ID: ${selectedBooking.bookingId}`, 14, 38);
    doc.text(`Event: ${selectedBooking.eventType} on ${new Date(selectedBooking.date).toLocaleDateString("en-IN")}`, 14, 44);
    
    doc.text(`Booking Amount: ${formatMoney(selectedBooking.totalAmount)}`, 140, 32);
    doc.text(`Total Paid: ${formatMoney(selectedBooking.totalPaid)}`, 140, 38);
    doc.text(`Outstanding: ${formatMoney(selectedBooking.outstanding)}`, 140, 44);

    const tableData = bookingPayments.map(p => [
      new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN"),
      p.paymentNumber,
      p.paymentMode,
      p.referenceNumber || "-",
      formatMoney(p.amount)
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Date', 'Receipt No', 'Mode', 'Reference', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [27, 67, 50] } // Theme color
    });

    doc.save(`Statement_${selectedBooking.bookingId}.pdf`);
  };

  const formatMoney = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div style={{ padding: "40px", maxWidth: 1600, margin: "0 auto", fontFamily: "'Inter', 'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      
      <PageHeader 
        title="Payments & Receipts" 
        subtitle="Complete booking financial center. Track, collect, and manage all payments."
        icon={Wallet}
        color="#1B4332"
      />

      {/* Top Level Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Collected" value={dashboardMetrics ? formatMoney(dashboardMetrics.todayCollection) : "Loading..."} icon={ArrowDownRight} color="#10b981" delay={0.1} />
        <MetricCard title="Outstanding Balance" value={dashboardMetrics ? formatMoney(dashboardMetrics.outstanding) : "Loading..."} icon={ArrowUpRight} color="#ef4444" delay={0.2} />
        <MetricCard title="Cash Balance" value={dashboardMetrics ? formatMoney(dashboardMetrics.cashBalance) : "Loading..."} icon={Wallet} color="#3b82f6" delay={0.3} />
        <MetricCard title="Bank Balance" value={dashboardMetrics ? formatMoney(dashboardMetrics.bankBalance) : "Loading..."} icon={CreditCard} color="#8b5cf6" delay={0.4} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: 14, color: "#94a3b8" }} />
            <input type="text" placeholder="Search booking, customer..." value={search} onChange={e => setSearch(e.target.value)} 
              style={{ padding: "12px 20px 12px 44px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", width: 340, outline: "none", fontSize: 15, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }} />
          </div>
          <button style={{ padding: "12px 20px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, color: "#475569" }}>
            <Filter size={16} /> Filter
          </button>
        </div>
        <button onClick={fetchData} style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: "#f1f5f9", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#475569" }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Booking Payment Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading booking financials...</div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", background: "#fff", borderRadius: 24 }}>
            <Receipt size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>No bookings found</p>
          </div>
        ) : (
          bookings.map((b, idx) => {
            const percentPaid = b.totalAmount > 0 ? (b.totalPaid / b.totalAmount) * 100 : 0;
            const isFullyPaid = b.outstanding <= 0;
            
            return (
              <motion.div 
                key={b.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                whileHover={{ scale: 1.005, boxShadow: "0 10px 30px rgba(0,0,0,0.04)", borderColor: "#cbd5e1" }}
                onClick={() => setSelectedBooking(b)}
                style={{ background: "#fff", borderRadius: 20, padding: "24px 32px", border: "1px solid #f1f5f9", cursor: "pointer", transition: "all 0.2s" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: isFullyPaid ? "#dcfce7" : "#fffbeb", color: isFullyPaid ? "#16a34a" : "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isFullyPaid ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{b.customerName}</h3>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: 6 }}>{b.bookingId}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#64748b", fontWeight: 500 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={14} /> {new Date(b.date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}</span>
                        <span>•</span>
                        <span>{b.eventType}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={{ padding: "8px 16px", borderRadius: 10, background: "#f1f5f9", color: "#0f172a", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>View History</button>
                    {!isFullyPaid && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); setIsCollectPaymentOpen(true); }}
                        style={{ padding: "8px 16px", borderRadius: 10, background: "#1B4332", color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        Collect Payment
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, padding: "16px 20px", background: "#f8fafc", borderRadius: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Booking Amount</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{formatMoney(b.totalAmount)}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>Collected</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{formatMoney(b.totalPaid)}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#ef4444", textTransform: "uppercase" }}>Outstanding</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#ef4444" }}>{formatMoney(b.outstanding)}</p>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
                    <span>Payment Progress</span>
                    <span>{Math.round(percentPaid)}%</span>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${percentPaid}%`, height: "100%", background: isFullyPaid ? "#16a34a" : "#3b82f6", borderRadius: 4 }} />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Side Drawer for Booking Details */}
      <AnimatePresence>
        {selectedBooking && !isCollectPaymentOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBooking(null)}
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 90 }} />
            
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 600, background: "#fff", zIndex: 100, boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ padding: "32px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{selectedBooking.customerName}</h2>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontWeight: 500 }}>{selectedBooking.bookingId} • {selectedBooking.eventType}</p>
                  </div>
                  <button onClick={() => setSelectedBooking(null)} style={{ background: "#e2e8f0", border: "none", width: 32, height: 32, borderRadius: 16, cursor: "pointer", fontWeight: 800 }}>✕</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Collected</p>
                    <p style={{ margin: "4px 0 0", fontSize: 20, color: "#16a34a", fontWeight: 800 }}>{formatMoney(selectedBooking.totalPaid)}</p>
                  </div>
                  <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Outstanding</p>
                    <p style={{ margin: "4px 0 0", fontSize: 20, color: "#ef4444", fontWeight: 800 }}>{formatMoney(selectedBooking.outstanding)}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: 32, flex: 1, overflowY: "auto" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Payment History & Receipts</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loadingPayments ? (
                    <div style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>Loading history...</div>
                  ) : bookingPayments.length === 0 ? (
                    <div style={{ padding: 20, border: "1px dashed #cbd5e1", borderRadius: 16, textAlign: "center", color: "#64748b" }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>No payments received yet.</p>
                    </div>
                  ) : (
                    bookingPayments.map(p => (
                      <div key={p.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{p.paymentNumber}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>{p.status}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                            {new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN")} • {p.paymentMode} {p.referenceNumber && `• ${p.referenceNumber}`}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{formatMoney(p.amount)}</span>
                          <button style={{ marginTop: 4, background: "none", border: "none", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <FileDown size={14} /> Receipt
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ padding: 32, borderTop: "1px solid #f1f5f9", display: "flex", gap: 16 }}>
                <button onClick={() => { setPaymentForm(prev => ({...prev, amount: selectedBooking.outstanding})); setIsCollectPaymentOpen(true); }} style={{ flex: 1, background: "#1B4332", color: "#fff", border: "none", padding: "16px", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: selectedBooking.outstanding > 0 ? 1 : 0.5 }} disabled={selectedBooking.outstanding <= 0}>
                  Collect Payment
                </button>
                <button onClick={downloadStatement} style={{ flex: 1, background: "#fff", color: "#0f172a", border: "1px solid #cbd5e1", padding: "16px", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                  <Download size={16} /> Download Statement
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Collect Payment Modal placeholder for next steps */}
      <AnimatePresence>
        {isCollectPaymentOpen && selectedBooking && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ background: "#fff", width: 500, borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
              <h2 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Collect Payment</h2>
              <p style={{ color: "#475569", marginBottom: 24 }}>You are receiving payment for <strong>{selectedBooking.customerName}</strong> ({selectedBooking.bookingId}). Outstanding: <strong>{formatMoney(selectedBooking.outstanding)}</strong></p>
              
              <form onSubmit={handleCollectPayment}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Amount (₹)</label>
                    <input type="number" required max={selectedBooking.outstanding} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Payment Mode</label>
                    <select required value={paymentForm.paymentMode} onChange={e => setPaymentForm({...paymentForm, paymentMode: e.target.value})} 
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15, boxSizing: "border-box" }}>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Reference Number (Optional)</label>
                    <input type="text" value={paymentForm.referenceNumber} onChange={e => setPaymentForm({...paymentForm, referenceNumber: e.target.value})} placeholder="UPI Ref, Cheque No, etc."
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Notes (Optional)</label>
                    <textarea value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="Any additional notes..."
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15, boxSizing: "border-box", minHeight: 80 }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
                   <button type="button" onClick={() => { setIsCollectPaymentOpen(false); }} style={{ flex: 1, padding: "14px", border: "none", background: "#f1f5f9", borderRadius: 12, fontWeight: 700, cursor: "pointer", color: "#475569" }}>Cancel</button>
                   <button type="submit" disabled={submitting} style={{ flex: 1, padding: "14px", border: "none", background: "#1B4332", color: "#fff", borderRadius: 12, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>
                     {submitting ? "Processing..." : "Record Payment"}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
