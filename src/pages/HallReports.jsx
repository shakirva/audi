import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Download, Calendar, TrendingUp, AlertCircle, Building2, Filter } from "lucide-react";
import { useToast } from "../components/Toast";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, margin: 0 };

const MOCK_HALL_DATA = [
  { name: "Emerald Hall", revenue: 850000, bookings: 42, occupancy: 85 },
  { name: "Royal Hall", revenue: 620000, bookings: 38, occupancy: 70 },
  { name: "Orchid Hall", revenue: 210000, bookings: 25, occupancy: 45 },
];

const COLORS = ["#1B4332", "#D4A017", "#2563eb"];

export default function HallReports() {
  const { addToast } = useToast();
  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Hall Performance
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Compare revenue, occupancy, and utilization across venues</p>
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
          { label: "Top Performing Hall", value: "Emerald Hall", sub: "₹8.5L Revenue", icon: Building2, color: "#1B4332", bg: "#f0faf4" },
          { label: "Overall Occupancy", value: "68%", sub: "+12% from last month", icon: TrendingUp, color: "#D4A017", bg: "#fffbeb" },
          { label: "Total Hall Bookings", value: "105", sub: "Across all halls", icon: Calendar, color: "#2563eb", bg: "#eff6ff" },
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
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
        
        {/* Revenue Comparison */}
        <div style={cardSt}>
          <p style={sTitle}>Revenue Comparison</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MOCK_HALL_DATA} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/100000}L`} />
              <Tooltip cursor={{ fill: "#f9fafb" }} formatter={v => [`₹${(v/100000).toFixed(1)}L`, "Revenue"]} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {MOCK_HALL_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Share */}
        <div style={cardSt}>
          <p style={sTitle}>Booking Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={MOCK_HALL_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="bookings">
                {MOCK_HALL_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {MOCK_HALL_DATA.map((h, i) => (
              <div key={h.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151", fontWeight: 500 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i] }} /> {h.name}
                </span>
                <span style={{ fontWeight: 700, color: "#111827" }}>{h.bookings}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
