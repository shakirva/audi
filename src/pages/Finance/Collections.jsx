import React, { useState, useEffect } from "react";
import { Wallet, Search, ArrowRight, Printer, Trash2, Edit2 } from "lucide-react";
import { paymentsAPI } from "../../services/api";
import { useToast } from "../../components/Toast";
import { generateReceipt } from "../../utils/documentGenerator";
import EditPaymentModal from "../../components/EditPaymentModal";
import { useConfirm } from "../../components/ConfirmProvider";

export default function Collections() {
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editPayment, setEditPayment] = useState(null);
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentsAPI.getAll({ limit: 100 });
      setPayments(res.data.data?.data || res.data.data || []);
    } catch (error) {
      addToast("Failed to fetch collections", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete Collection",
      message: "Are you sure you want to delete this payment collection? This will permanently remove it and affect associated ledgers.",
      confirmText: "Delete",
      type: "danger"
    });

    if (isConfirmed) {
      try {
        await paymentsAPI.remove(id);
        addToast("Collection deleted successfully", "success");
        fetchPayments();
      } catch (err) {
        addToast(err.response?.data?.message || "Failed to delete collection", "error");
      }
    }
  };

  const filtered = payments.filter(p => 
    p.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.Booking?.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Collections Register</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Track and reconcile all received payments.</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search by ID or Customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", width: 250 }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Receipt ID</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Date</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Booking</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Mode</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Amount</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Collected By</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Print</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading collections...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No collections found.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "#334155" }}>
                      {p.Receipts && p.Receipts.length > 0 ? p.Receipts[0].receiptNumber : p.paymentNumber}
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{p.Booking?.bookingId || "-"}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.Customer?.name || "-"}</div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      <span style={{ display: "inline-block", padding: "4px 8px", background: "#f1f5f9", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {p.paymentMode}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#16a34a", fontWeight: 700 }}>₹{Number(p.amount).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      <span style={{ background: "#f8fafc", padding: "4px 8px", borderRadius: 4, fontSize: 12, border: "1px solid #e2e8f0" }}>
                        {(() => {
                          if (p.notes && p.notes.includes("Collected By:")) {
                            const match = p.notes.match(/Collected By:\s*([^\n]+)/);
                            if (match && match[1]) return match[1].trim();
                          }
                          return p.Booking?.receivedBy || p.creator?.name || p.User?.name || "System";
                        })()}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <button 
                        onClick={() => generateReceipt(p, { ...p.Booking, Customer: p.Customer })}
                        style={{ border: "1px solid #e2e8f0", background: "#fff", padding: "6px 12px", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}
                      >
                        <Printer size={14} /> Receipt
                      </button>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button onClick={() => setEditPayment(p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6", marginRight: 12 }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeletePayment(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <EditPaymentModal 
        open={!!editPayment} 
        payment={editPayment} 
        onClose={() => setEditPayment(null)} 
        onSuccess={() => { setEditPayment(null); fetchPayments(); }} 
      />

    </div>
  );
}
