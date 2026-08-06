import React, { useState, useEffect } from "react";
import { Calculator, Search, Filter } from "lucide-react";
import { accountsAPI } from "../../services/api";
import { useToast } from "../../components/Toast";
import { useConfirm } from "../../components/ConfirmProvider";

export default function AdvancedAccounting() {
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await accountsAPI.getVouchers({ limit: 100 });
      setVouchers(res.data.data?.data || res.data.data || []);
    } catch (error) {
      addToast("Failed to fetch accounting vouchers", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = vouchers.filter(v => 
    v.voucherNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.voucherType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Advanced Accounting</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>General ledger, trial balance, and automatic journals.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto" style={{ gap: 12, alignItems: "stretch" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search journals..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
            />
          </div>
          <button className="w-full sm:w-auto justify-center" style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "10px 16px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Voucher</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Date</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Description</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Source</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading accounting records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No records found.</td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "#334155" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, background: v.voucherType === "RV" ? "#dcfce7" : v.voucherType === "PV" ? "#fee2e2" : "#f1f5f9", color: v.voucherType === "RV" ? "#166534" : v.voucherType === "PV" ? "#991b1b" : "#334155", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          {v.voucherType}
                        </span>
                        {v.voucherNumber}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      {new Date(v.date || v.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px 24px", color: "#1e293b", fontWeight: 500 }}>
                      {v.description}
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v.sourceModule}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>ID: {v.sourceId || "-"}</div>
                    </td>
                    <td style={{ padding: "16px 24px", fontWeight: 700, color: v.voucherType === "RV" ? "#16a34a" : v.voucherType === "PV" ? "#ef4444" : "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      ₹{Number(v.amount).toLocaleString()}
                      <button 
                        onClick={async () => {
                          if (await confirm("Are you sure you want to permanently delete this voucher and its journal entries? This may cause financial mismatches if it was auto-generated.")) {
                            try {
                              await accountsAPI.deleteVoucher(v.id);
                              addToast("Voucher deleted successfully", "success");
                              fetchVouchers();
                            } catch (e) {
                              addToast("Failed to delete voucher", "error");
                            }
                          }
                        }}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                        title="Delete Voucher"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
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
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading accounting records...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No records found.</div>
        ) : (
          filtered.map((v) => (
            <div key={v.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, background: v.voucherType === "RV" ? "#dcfce7" : v.voucherType === "PV" ? "#fee2e2" : "#f1f5f9", color: v.voucherType === "RV" ? "#166534" : v.voucherType === "PV" ? "#991b1b" : "#334155", padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>
                    {v.voucherType}
                  </span>
                  <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>{v.voucherNumber}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: v.voucherType === "RV" ? "#16a34a" : v.voucherType === "PV" ? "#ef4444" : "#0f172a" }}>
                  ₹{Number(v.amount).toLocaleString()}
                </div>
              </div>
              
              <div style={{ fontSize: 14, color: "#334155", marginBottom: 12, fontWeight: 500 }}>
                {v.description}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4" style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Date</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{new Date(v.date || v.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Source</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{v.sourceModule}</div>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                <button 
                  onClick={async () => {
                    if (await confirm("Are you sure you want to permanently delete this voucher and its journal entries? This may cause financial mismatches if it was auto-generated.")) {
                      try {
                        await accountsAPI.deleteVoucher(v.id);
                        addToast("Voucher deleted successfully", "success");
                        fetchVouchers();
                      } catch (e) {
                        addToast("Failed to delete voucher", "error");
                      }
                    }
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
