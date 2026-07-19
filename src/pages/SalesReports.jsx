import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { Download, Users, TrendingUp, Crosshair, Trophy, Filter } from "lucide-react";
import { useToast } from "../components/Toast";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, margin: 0 };

const MOCK_TREND = [
  { month: "Jan", enquiries: 45, converted: 20 },
  { month: "Feb", enquiries: 52, converted: 25 },
  { month: "Mar", enquiries: 61, converted: 32 },
  { month: "Apr", enquiries: 48, converted: 28 },
  { month: "May", enquiries: 75, converted: 42 },
  { month: "Jun", enquiries: 82, converted: 48 },
];

const MOCK_SOURCES = [
  { name: "Walk-in", value: 45 },
  { name: "Referral", value: 25 },
  { name: "Website", value: 15 },
  { name: "Social Media", value: 10 },
  { name: "Phone", value: 5 },
];

const COLORS = ["#1B4332", "#D4A017", "#2563eb", "#7c3aed", "#059669"];

export default function SalesReports() {
  const { addToast } = useToast();
  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Sales & CRM Reports
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Track lead generation, conversion rates, and sales performance</p>
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
          { label: "Total Enquiries", value: "363", sub: "+18% from last quarter", icon: Users, color: "#1B4332", bg: "#f0faf4" },
          { label: "Conversion Rate", value: "54%", sub: "Target: 60%", icon: Crosshair, color: "#D4A017", bg: "#fffbeb" },
          { label: "Avg. Deal Size", value: "₹2.4L", sub: "+5% from last month", icon: TrendingUp, color: "#2563eb", bg: "#eff6ff" },
          { label: "Top Source", value: "Walk-in", sub: "45% of total leads", icon: Trophy, color: "#7c3aed", bg: "#f5f3ff" },
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
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
        
        {/* Conversion Trend */}
        <div style={cardSt}>
          <p style={sTitle}>Enquiry vs Conversion Trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={MOCK_TREND}>
              <defs>
                <linearGradient id="colorEnq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A017" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#D4A017" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Area type="monotone" dataKey="enquiries" name="Enquiries" stroke="#1B4332" fillOpacity={1} fill="url(#colorEnq)" strokeWidth={2} />
              <Area type="monotone" dataKey="converted" name="Converted" stroke="#D4A017" fillOpacity={1} fill="url(#colorConv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div style={cardSt}>
          <p style={sTitle}>Lead Sources</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_SOURCES} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {MOCK_SOURCES.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
