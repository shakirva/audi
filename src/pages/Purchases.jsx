import React from "react";
import { ShoppingCart, Plus, Filter, Search, CheckCircle, PackageOpen, CreditCard, ChevronRight, Download } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";

const MOCK_PURCHASES = [
  { id: "PO-2024-001", date: "Oct 12, 2024", supplier: "Supreme Furniture Ltd", item: "Banquet Chairs (x150)", amount: "₹4,50,000", status: "Delivered", statusColor: "#22c55e", bg: "#dcfce7" },
  { id: "PO-2024-002", date: "Oct 14, 2024", supplier: "Fresh Farms Wholesale", item: "Vegetables & Groceries (Bulk)", amount: "₹85,000", status: "Pending GRN", statusColor: "#f59e0b", bg: "#fef3c7" },
  { id: "PO-2024-003", date: "Oct 15, 2024", supplier: "ElectroSound Systems", item: "JBL Line Array Speakers (x4)", amount: "₹12,00,000", status: "Approved", statusColor: "#3b82f6", bg: "#dbeafe" },
  { id: "PO-2024-004", date: "Oct 18, 2024", supplier: "Crystal Decorators", item: "Stage Setup Materials", amount: "₹1,20,000", status: "Draft", statusColor: "#64748b", bg: "#f1f5f9" },
];

export default function Purchases() {
  return (
    <div style={{ padding: "40px", maxWidth: 1600, margin: "0 auto", fontFamily: "'Inter', 'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <PageHeader 
          title="Purchase Orders" 
          subtitle="Manage vendor POs, track deliveries (GRN), and process supplier payments."
          icon={ShoppingCart}
          color="#0ea5e9"
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#D4A017", background: "rgba(212,160,23,0.1)", padding: "8px 14px", borderRadius: 10, border: "1px dashed #D4A017", letterSpacing: 1 }}>
            STATIC PROTOTYPE
          </span>
          <button style={{ padding: "10px 18px", borderRadius: 12, background: "#0ea5e9", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 4px 12px rgba(14,165,233,0.3)" }}>
            <Plus size={16} /> New PO
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 24 }}>
        {[
          { label: "Pending Deliveries", value: "3", sub: "Awaiting GRN", icon: PackageOpen, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Approved Value", value: "₹12.8L", sub: "This Month", icon: CheckCircle, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Outstanding Dues", value: "₹4.5L", sub: "To Suppliers", icon: CreditCard, color: "#ef4444", bg: "#fef2f2" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: k.bg, color: k.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={24} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{k.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>{k.value}</p>
              <p style={{ fontSize: 12, color: k.color, fontWeight: 600, margin: 0 }}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Filter Bar (Mock) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0ea5e9", fontWeight: 700, fontSize: 13, paddingRight: 10, borderRight: "1px solid #e2e8f0" }}>
          <Filter size={16} /> Filters
        </div>
        
        <div style={{ position: "relative", marginLeft: 10 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "#94a3b8" }} />
          <input type="text" placeholder="Search POs..." style={{ padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", width: 200, background: "#f8fafc" }} />
        </div>
        
        <select style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#475569", outline: "none", cursor: "pointer", background: "#f8fafc" }}>
          <option>Supplier: All</option><option>Supreme Furniture</option><option>Fresh Farms</option>
        </select>
        <select style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#475569", outline: "none", cursor: "pointer", background: "#f8fafc" }}>
          <option>Status: All</option><option>Draft</option><option>Approved</option><option>Pending GRN</option><option>Delivered</option>
        </select>
        <select style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#475569", outline: "none", cursor: "pointer", background: "#f8fafc" }}>
          <option>Date: This Month</option><option>Last Month</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <tr>
              <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>PO Number</th>
              <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Supplier</th>
              <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Item Description</th>
              <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
              <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PURCHASES.map((po, i) => (
              <tr key={po.id} style={{ borderBottom: i !== MOCK_PURCHASES.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{po.id}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{po.date}</div>
                </td>
                <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600, color: "#334155" }}>{po.supplier}</td>
                <td style={{ padding: "16px 20px", fontSize: 14, color: "#475569" }}>{po.item}</td>
                <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{po.amount}</td>
                <td style={{ padding: "16px 20px" }}>
                  <span style={{ background: po.bg, color: po.statusColor, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 20, letterSpacing: 0.5 }}>
                    {po.status}
                  </span>
                </td>
                <td style={{ padding: "16px 20px", textAlign: "right" }}>
                  <button onClick={() => window.print()} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", marginRight: 12 }} title="Download PO">
                    <Download size={18} />
                  </button>
                  <button style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
