import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Receipt, Printer, FileText, ArrowDownToLine, RefreshCw } from "lucide-react";
import { paymentsAPI } from "../../services/api";
import { useToast } from "../../components/Toast";
import { generateReceipt, generateInvoice } from "../../utils/documentGenerator";

export default function PaymentHistoryModal({ open, booking, onClose }) {
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open && booking) {
      fetchPayments();
    }
  }, [open, booking]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentsAPI.getAll({ bookingId: booking._id || booking.id });
      const fetched = res.data.data || [];
      
      const sumPayments = fetched.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalAdvance = (Number(booking.advance) || 0) + (Number(booking.depositAmount) || 0);
      
      if (sumPayments < totalAdvance) {
        fetched.push({
          id: "synthetic-advance",
          amount: totalAdvance - sumPayments,
          paymentMode: "Advance (Booking Time)",
          paymentDate: booking.createdAt,
          referenceNumber: "Auto-recorded",
          createdAt: booking.createdAt
        });
      }
      
      fetched.sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));
      setPayments(fetched);
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch payments", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateSyntheticReceipt = async (syntheticPayment) => {
    setGenerating(true);
    try {
      // Create a real payment record to match the advance
      const res = await paymentsAPI.create({
        bookingId: booking._id || booking.id,
        amount: Number(syntheticPayment.amount),
        paymentMode: "Cash", // Defaulting to Cash for legacy advance
        referenceNumber: "Auto-recorded Advance",
        notes: "Generated from initial booking advance",
        paymentDate: syntheticPayment.paymentDate
      });
      addToast("Receipt generated successfully!", "success");
      await fetchPayments(); // Refresh to get the real payment ID
    } catch (err) {
      console.error(err);
      addToast("Failed to generate receipt", "error");
    } finally {
      setGenerating(false);
    }
  };

  const printReceipt = (p) => {
    generateReceipt(p, booking);
  };

  const printFinalInvoice = () => {
    addToast("Generating Final Invoice...", "success");
    const sumPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = Number(booking.totalAmount || 0) - sumPayments;
    generateInvoice({
      booking,
      payments,
      totalPaid: sumPayments,
      outstanding
    });
  };

  if (!open || !booking) return null;

  return (
    <AnimatePresence>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ width: "100%", maxWidth: 650, background: "#fff", borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", position: "relative", zIndex: 1, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
          
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Payment History</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{booking.customerName} • {booking.bookingNumber || booking.id}</p>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={24} /></button>
          </div>

          <div style={{ padding: 32, overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading history...</div>
            ) : payments.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
                <Receipt size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: "#64748b", margin: 0 }}>No payments recorded yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {payments.map((p, i) => (
                  <div key={p.id || i} style={{ border: "1px solid #f1f5f9", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                        <ArrowDownToLine size={18} color="#16a34a" />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>₹{Number(p.amount).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginTop: 4 }}>
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {p.paymentMode || "Cash"} {p.referenceNumber ? `(${p.referenceNumber})` : ""}
                        </div>
                      </div>
                    </div>
                    {p.id !== "synthetic-advance" ? (
                      <button 
                        onClick={() => printReceipt(p)}
                        style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#334155", fontWeight: 600, fontSize: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}
                      >
                        <Printer size={14} /> Receipt
                      </button>
                    ) : (
                      <button 
                        onClick={() => generateSyntheticReceipt(p)}
                        disabled={generating}
                        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 600, fontSize: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}
                      >
                        {generating ? <RefreshCw size={14} className="animate-spin" /> : <Printer size={14} />} Convert & Print
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ padding: "16px 32px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "flex-end" }}>
            <button 
              onClick={printFinalInvoice}
              style={{ background: "#0f172a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 4px rgba(15,23,42,0.2)" }}
            >
              <FileText size={16} /> Print Final Invoice
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
