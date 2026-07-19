import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { Download, Wallet, CreditCard, Banknote, PiggyBank, Filter } from "lucide-react";
import { useToast } from "../components/Toast";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, margin: 0 };

const MOCK_FINANCE = [
  { month: "Jan", revenue: 850, expense: 220, profit: 630 },
  { month: "Feb", revenue: 920, expense: 280, profit: 640 },
  { month: "Mar", revenue: 1100, expense: 310, profit: 790 },
  { month: "Apr", revenue: 890, expense: 250, profit: 640 },
  { month: "May", revenue: 1250, expense: 420, profit: 830 },
  { month: "Jun", revenue: 1400, expense: 380, profit: 1020 },
];

export default function AccountsReports() {
  const { addToast } = useToast();
  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Accounts & Finance
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Comprehensive financial overview, cash flow, and profitability</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#D4A017", background: "rgba(212,160,23,0.1)", padding: "6px 12px", borderRadius: 8, border: "1px dashed #D4A017" }}>
            STATIC PROTOTYPE
          </span>
          <button 
            onClick={() => {
              window.print();
              addToast("Report exported successfully!", "success");
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar (Mock) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1B4332", fontWeight: 700, fontSize: 13, paddingRight: 10, borderRight: "1px solid #e5e7eb" }}>
          <Filter size={16} /> Filters
        </div>
        
        <select style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option>Date: This Month</option><option>Date: Last Month</option><option>Date: This Year</option><option>Date: Custom Range...</option>
        </select>
        <select style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option>Hall: All Halls</option><option>Emerald Hall</option><option>Royal Hall</option><option>Orchid Hall</option>
        </select>
        <select style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option>Executive: All Staff</option><option>Rajan P.K.</option><option>Muhammed Rafi</option><option>Sarah K.</option>
        </select>
        <select style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option>Place: All Locations</option><option>Kannur</option><option>Thalassery</option><option>Kuthuparamba</option>
        </select>
        <select style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option>Gender: All</option><option>Male</option><option>Female</option>
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Net Revenue", value: "₹64.1L", sub: "Year to Date", icon: Wallet, color: "#1B4332", bg: "#f0faf4" },
          { label: "Total Expenses", value: "₹18.6L", sub: "Operational costs", icon: CreditCard, color: "#dc2626", bg: "#fef2f2" },
          { label: "Net Profit", value: "₹45.5L", sub: "71% Margin", icon: PiggyBank, color: "#059669", bg: "#dcfce7" },
          { label: "Cash in Hand", value: "₹4.2L", sub: "Petty Cash", icon: Banknote, color: "#D4A017", bg: "#fffbeb" },
        ].map(k => (
          <div key={k.label} style={{ ...cardSt, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, color: k.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={22} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{k.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "2px 0" }}>{k.value}</p>
              <p style={{ fontSize: 11, color: k.color, fontWeight: 600, margin: 0 }}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 20 }}>
        
        {/* Cash Flow */}
        <div style={cardSt}>
          <p style={sTitle}>Cash Flow & Profitability</p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={MOCK_FINANCE}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}k`} />
              <Tooltip cursor={{ fill: "#f9fafb" }} formatter={v => [`₹${v}k`, ""]} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1B4332" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
