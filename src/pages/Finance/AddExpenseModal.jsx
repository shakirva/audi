import React, { useState, useEffect } from "react";
import { X, Receipt } from "lucide-react";
import { expensesAPI, bookingsAPI } from "../../services/api";
import { useToast } from "../../components/Toast";

export default function AddExpenseModal({ open, onClose, onSuccess, defaultBookingId }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [expenseType, setExpenseType] = useState(defaultBookingId ? "booking" : "general"); // "general" or "booking"
  const [formData, setFormData] = useState({
    category: "Office Expense",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    bookingId: defaultBookingId || "",
  });

  useEffect(() => {
    if (open) {
      bookingsAPI.getAll({ limit: 100 }).then(res => {
        setBookings(res.data.data?.data || res.data.data || []);
      }).catch(err => console.error("Failed to load bookings", err));
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description) {
      addToast("Cost purpose (description) is required", "error");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      addToast("Amount must be greater than zero", "error");
      return;
    }
    if (expenseType === "booking" && !formData.bookingId) {
      addToast("Booking ID is required for Booking Expenses", "error");
      return;
    }

    try {
      setLoading(true);
      await expensesAPI.create({
        category: formData.category,
        description: formData.description,
        amount: Number(formData.amount),
        date: new Date(formData.date).toISOString(),
        bookingId: expenseType === "booking" ? formData.bookingId : null,
        paymentMode: "Cash" // Default for now
      });
      addToast("Expense recorded successfully", "success");
      onSuccess();
    } catch (error) {
      addToast("Failed to record expense", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      
      <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "#fff", borderRadius: 20, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", fontFamily: "'DM Sans', sans-serif" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: "#e0e7ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5" }}>
              <Receipt size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Record Expense</h2>
              <div style={{ fontSize: 13, color: "#64748b" }}>Post a new purchase or bill</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          
          {!defaultBookingId && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Expense Type</label>
              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                  <input type="radio" name="expenseType" checked={expenseType === "general"} onChange={() => setExpenseType("general")} />
                  General Business
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                  <input type="radio" name="expenseType" checked={expenseType === "booking"} onChange={() => setExpenseType("booking")} />
                  Booking
                </label>
              </div>
            </div>
          )}

          {expenseType === "booking" && !defaultBookingId && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Select Booking *</label>
              <select 
                value={formData.bookingId}
                onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" }}
                required={expenseType === "booking"}
              >
                <option value="">-- Select Booking --</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>{b.bookingNumber || b.id} - {b.customerName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Category</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" }}
            >
              <option value="Electricity">Electricity</option>
              <option value="Staff Salary">Staff Salary</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Marketing">Marketing</option>
              <option value="Fuel">Fuel</option>
              <option value="Office Expense">Office Expense</option>
              <option value="Misc Expense">Misc Expense</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Cost Purpose (Description) *</label>
            <input 
              type="text" 
              placeholder="E.g., Bought printer ink"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Amount (₹) *</label>
              <input 
                type="number" 
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Date</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                required
              />
            </div>
          </div>

        </form>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12, background: "#f8fafc" }}>
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "10px 16px", borderRadius: 8, fontWeight: 600, color: "#475569", cursor: "pointer", fontSize: 14 }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: "#4f46e5", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Saving..." : "Record Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
