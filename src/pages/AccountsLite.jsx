import React, { useState } from "react";
import { BookOpen, DollarSign, Activity, FileText, ArrowUpRight, ArrowDownRight, Search, Download, Filter } from "lucide-react";

const DEMO_LEDGER = [
  { id: "TXN-101", date: "2026-07-18", ref: "BK042", description: "Advance received - Arun & Divya", type: "Credit", amount: 50000, balance: 1895000, category: "Booking Advance" },
  { id: "TXN-102", date: "2026-07-17", ref: "EXP-89", description: "Payment to Royal Catering", type: "Debit", amount: 120000, balance: 1845000, category: "Vendor Payment" },
  { id: "TXN-103", date: "2026-07-16", ref: "BK038", description: "Final settlement - Muhammed Rafi", type: "Credit", amount: 145000, balance: 1965000, category: "Final Settlement" },
  { id: "TXN-104", date: "2026-07-15", ref: "UTIL-07", description: "Electricity Bill (KSEB)", type: "Debit", amount: 28500, balance: 1820000, category: "Utilities" },
  { id: "TXN-105", date: "2026-07-14", ref: "PAY-07", description: "Staff Salary Processing", type: "Debit", amount: 245000, balance: 1848500, category: "Payroll" },
  { id: "TXN-106", date: "2026-07-12", ref: "BK045", description: "Advance received - Sneha", type: "Credit", amount: 25000, balance: 2093500, category: "Booking Advance" },
];

export default function AccountsLite() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  const filtered = DEMO_LEDGER.filter(t => {
    if (filterType !== "All" && t.type !== filterType) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.ref.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: "30px 40px", maxWidth: 1400, margin: "0 auto", fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #1B4332, #2D6A4F)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 12px rgba(27,67,50,0.2)" }}>
              <BookOpen size={20} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#0f172a", fontFamily: "'Playfair Display', serif" }}>Accounts & Ledger</h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Track daily cash flow, vendor payments, and customer settlements.</p>
        </div>
        <button style={{
          background: "#fff", color: "#1B4332", border: "1px solid #1B4332", borderRadius: 10,
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, cursor: "pointer",
          fontSize: 13, transition: "background 0.2s"
        }} onMouseEnter={e => e.currentTarget.style.background = "#f0faf4"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
          <Download size={16} /> Export Statement
        </button>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 30 }}>
        {[
          { label: "Total Balance", val: "₹18,45,000", color: "#1B4332", icon: Activity, bg: "#eefcf4" },
          { label: "Cash in Hand", val: "₹2,50,000", color: "#0ea5e9", icon: DollarSign, bg: "#f0f9ff" },
          { label: "Pending Receivables", val: "₹4,20,000", color: "#d97706", icon: ArrowUpRight, bg: "#fffbeb" },
          { label: "Pending Payables", val: "₹1,80,000", color: "#ef4444", icon: ArrowDownRight, bg: "#fef2f2" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} style={{ background: "#fff", padding: "20px", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.label}</p>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color }}>
                  <Icon size={16} />
                </div>
              </div>
              <h3 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{kpi.val}</h3>
            </div>
          )
        })}
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center", background: "#fff", padding: 12, borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <div style={{ position: "relative", width: 320 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: 12, color: "#94a3b8" }} />
          <input 
            type="text" placeholder="Search transactions, ref..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["All", "Credit", "Debit"].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
              background: filterType === t ? "#1B4332" : "#f1f5f9", color: filterType === t ? "#fff" : "#475569", transition: "all 0.2s"
            }}>
              {t}
            </button>
          ))}
        </div>
        <button style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
          <Filter size={14} /> Filter Date
        </button>
      </div>

      {/* LEDGER TABLE */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Date</th>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Ref ID</th>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Description</th>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Category</th>
              <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Debit / Credit</th>
              <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Running Bal.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((txn, idx) => (
              <tr key={txn.id} style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#fafafa"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#475569", fontWeight: 500 }}>{new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td style={{ padding: "16px 20px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1B4332", background: "#eefcf4", padding: "4px 8px", borderRadius: 6 }}>{txn.ref}</span>
                </td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{txn.description}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Txn ID: {txn.id}</div>
                </td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>{txn.category}</td>
                <td style={{ padding: "16px 20px", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontSize: 14, fontWeight: 700, color: txn.type === "Credit" ? "#16a34a" : "#dc2626" }}>
                    {txn.type === "Credit" ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    {txn.type === "Credit" ? "+" : "-"} ₹{txn.amount.toLocaleString("en-IN")}
                  </div>
                </td>
                <td style={{ padding: "16px 20px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
                  ₹{txn.balance.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center" }}>
            <FileText size={40} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#475569" }}>No transactions found</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
