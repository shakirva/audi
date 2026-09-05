import React, { useState, useEffect } from "react";
import { Wallet, Search, ArrowRight, Printer, Trash2, Edit2 } from "lucide-react";
import { paymentsAPI, isPlanRestriction } from "../../services/api";
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
  
  // New Filter States
  const [filterDate, setFilterDate] = useState("All Time");
  const [filterMode, setFilterMode] = useState("All Modes");
  const [filterCollectedBy, setFilterCollectedBy] = useState("All Staff");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
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
      if (!isPlanRestriction(error)) addToast("Failed to fetch collections", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    const isConfirmed = await confirm(
      "Are you sure you want to delete this payment collection? This will permanently remove it and affect associated ledgers.",
      {
        title: "Delete Collection",
        confirmText: "Delete",
        isDanger: true
      }
    );

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

  const uniqueModes = Array.from(new Set(payments.map(p => p.paymentMode).filter(Boolean)));
  const uniqueCollectors = Array.from(new Set(payments.map(p => {
    if (p.notes && p.notes.includes("Collected By:")) {
      const match = p.notes.match(/Collected By:\s*([^\n]+)/);
      if (match && match[1]) return match[1].trim();
    }
    return p.Booking?.receivedBy || p.creator?.name || p.User?.name || "System";
  }).filter(Boolean)));

  const filtered = payments.filter(p => {
    const sTerm = searchTerm.toLowerCase();
    // 1. Search filter
    const matchesSearch = 
      (p.paymentNumber || "").toLowerCase().includes(sTerm) || 
      (p.Booking?.bookingId || "").toLowerCase().includes(sTerm) ||
      (p.amount ? p.amount.toString().includes(searchTerm) : false) ||
      (p.Customer?.name || "").toLowerCase().includes(sTerm);
    
    if (!matchesSearch) return false;

    // 2. Mode filter
    if (filterMode !== "All Modes" && p.paymentMode !== filterMode) return false;

    // 3. Collected By filter
    if (filterCollectedBy !== "All Staff") {
      let collector = p.Booking?.receivedBy || p.creator?.name || p.User?.name || "System";
      if (p.notes && p.notes.includes("Collected By:")) {
        const match = p.notes.match(/Collected By:\s*([^\n]+)/);
        if (match && match[1]) collector = match[1].trim();
      }
      if (collector !== filterCollectedBy) return false;
    }

    // 4. Date filter
    if (filterDate !== "All Time") {
      const pDate = new Date(p.paymentDate || p.createdAt);
      const now = new Date();
      if (filterDate === "This Month") {
        if (pDate.getMonth() !== now.getMonth() || pDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === "Last Month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (pDate.getMonth() !== lastMonth.getMonth() || pDate.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (filterDate === "This Year") {
        if (pDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === "Custom Date") {
        if (customStartDate && pDate < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (pDate > end) return false;
        }
      }
    }

    return true;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Collections Register</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Track and reconcile all received payments.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto" style={{ gap: 12, alignItems: "stretch" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search by ID, Booking, Amount..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
            />
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="flex flex-col sm:flex-row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 24, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1 }}>
          <select className="w-full sm:w-auto" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#334155", outline: "none", cursor: "pointer", background: "#f8fafc" }}>
            <option value="All Time">Date: All Time</option>
            <option value="This Month">Date: This Month</option>
            <option value="Last Month">Date: Last Month</option>
            <option value="This Year">Date: This Year</option>
            <option value="Custom Date">Date: Custom Date</option>
          </select>

          {filterDate === "Custom Date" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }} />
              <span style={{ color: "#64748b", fontSize: 13 }}>to</span>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }} />
            </div>
          )}
        </div>
        
        <select className="w-full sm:w-auto" value={filterMode} onChange={(e) => setFilterMode(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#334155", outline: "none", cursor: "pointer", background: "#f8fafc" }}>
          <option value="All Modes">Mode: All Modes</option>
          {uniqueModes.map((m, i) => (
            <option key={i} value={m}>{m}</option>
          ))}
        </select>
        
        <select className="w-full sm:w-auto" value={filterCollectedBy} onChange={(e) => setFilterCollectedBy(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#334155", outline: "none", cursor: "pointer", background: "#f8fafc" }}>
          <option value="All Staff">Collected By: All Staff</option>
          {uniqueCollectors.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
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

      {/* Mobile Card View */}
      <div className="block md:hidden flex flex-col gap-4">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading collections...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No collections found.</div>
        ) : (
          filtered.map((p) => {
            const collector = (() => {
              if (p.notes && p.notes.includes("Collected By:")) {
                const match = p.notes.match(/Collected By:\s*([^\n]+)/);
                if (match && match[1]) return match[1].trim();
              }
              return p.Booking?.receivedBy || p.creator?.name || p.User?.name || "System";
            })();
            
            return (
              <div key={p.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>{p.Booking?.bookingId || "-"}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{p.Customer?.name || "-"}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                    ₹{Number(p.amount).toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4" style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Receipt ID</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{p.Receipts && p.Receipts.length > 0 ? p.Receipts[0].receiptNumber : p.paymentNumber}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Date</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Mode</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{p.paymentMode}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Collected By</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{collector}</div>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    onClick={() => generateReceipt(p, { ...p.Booking, Customer: p.Customer })}
                    style={{ flex: 1, border: "1px solid #e2e8f0", background: "#fff", padding: "8px", borderRadius: 8, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#334155" }}
                  >
                    <Printer size={16} /> Receipt
                  </button>
                  <button onClick={() => setEditPayment(p)} style={{ border: "1px solid #e2e8f0", background: "#fff", padding: "8px", borderRadius: 8, cursor: "pointer", color: "#3b82f6" }} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeletePayment(p.id)} style={{ border: "1px solid #e2e8f0", background: "#fee2e2", padding: "8px", borderRadius: 8, cursor: "pointer", color: "#ef4444" }} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
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
