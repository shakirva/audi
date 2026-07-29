import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { paymentsAPI } from "../../services/api";
import { useToast } from "../../components/Toast";

export default function CollectPaymentModal({ open, booking, onClose, onSuccess }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Payment form state
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [upiName, setUpiName] = useState("");
  const [bankName, setBankName] = useState("");

  if (!open || !booking) return null;

  const total = Number(booking.totalAmount) || 0;
  const collected = (Number(booking.advance) || 0) + (Number(booking.depositAmount) || 0);
  const outstanding = Math.max(0, total - collected);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) {
      addToast("Please enter a valid amount", "error");
      return;
    }

    setLoading(true);
    try {
      let finalRef = reference;
      if (method === "UPI") {
        finalRef = upiName ? `${upiName} - ${reference}` : reference;
      } else if (method === "Bank Transfer") {
        finalRef = bankName ? `${bankName} - ${reference}` : reference;
      }
      
      let finalNotes = notes;
      if (collectedBy) {
        finalNotes = `Collected By: ${collectedBy}\n${notes}`;
      }

      await paymentsAPI.create({
        bookingId: booking._id || booking.id, // Use integer ID
        amount: Number(amount),
        paymentMode: method,
        referenceNumber: finalRef,
        notes: finalNotes,
        paymentDate: new Date().toISOString()
      });
      addToast("Payment collected successfully!", "success");
      onSuccess();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || "Failed to collect payment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ width: "100%", maxWidth: 500, background: "#fff", borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", position: "relative", zIndex: 1, overflow: "hidden" }}>
          
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Collect Payment</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{booking.customerName} • {booking.bookingNumber || booking.id}</p>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "32px" }}>
            
            <div style={{ display: "flex", gap: 16, marginBottom: 24, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Outstanding</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>₹{outstanding.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Total Booking</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#334155" }}>₹{total.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Amount Received (₹) <span style={{ color: "#ef4444" }}>*</span></label>
              <input 
                type="number" 
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 16, fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Payment Method</label>
                <select 
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, fontWeight: 500, outline: "none", background: "#fff", cursor: "pointer", boxSizing: "border-box" }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI (GPay, PhonePe)</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Collected By <span style={{ color: "#ef4444" }}>*</span></label>
                <input 
                  type="text" 
                  value={collectedBy}
                  onChange={e => setCollectedBy(e.target.value)}
                  placeholder="Staff Name..."
                  required
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {method === "UPI" && (
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>UPI App / Name</label>
                  <input 
                    type="text" 
                    value={upiName}
                    onChange={e => setUpiName(e.target.value)}
                    placeholder="e.g. GPay, PhonePe"
                    list="upi-apps"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                  <datalist id="upi-apps">
                    <option value="GPay" />
                    <option value="PhonePe" />
                    <option value="Paytm" />
                    <option value="BHIM" />
                  </datalist>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Transaction Ref No.</label>
                  <input 
                    type="text" 
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="UPI Txn ID..."
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            {method === "Bank Transfer" && (
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Bank Name</label>
                  <input 
                    type="text" 
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. SBI, HDFC"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Transaction Ref No.</label>
                  <input 
                    type="text" 
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="NEFT/RTGS Ref..."
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            {["Cheque", "Card"].includes(method) && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Reference No.</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Cheque No. / Card Last 4 digits..."
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any remarks about this payment..."
                rows={2}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: "14px", background: "#1B4332", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Processing..." : <><CheckCircle2 size={18} /> Confirm Payment</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
