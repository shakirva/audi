import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line } from "recharts";
import { Download, CalendarCheck, Ban, CalendarDays, CheckCircle2, Filter } from "lucide-react";
import { useToast } from "../components/Toast";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, margin: 0 };

const MOCK_MONTHS = [
  { month: "Jan", bookings: 12 },
  { month: "Feb", bookings: 18 },
  { month: "Mar", bookings: 25 },
  { month: "Apr", bookings: 15 },
  { month: "May", bookings: 30 },
  { month: "Jun", bookings: 28 },
];

const MOCK_EVENTS = [
  { name: "Wedding", value: 45 },
  { name: "Reception", value: 30 },
  { name: "Corporate", value: 15 },
  { name: "Birthday", value: 10 },
];

const COLORS = ["#1B4332", "#D4A017", "#2563eb", "#7c3aed"];

export default function BookingReports() {
  const { addToast } = useToast();
  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Booking Reports
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Analyze booking volumes, event types, and cancellations</p>
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
          { label: "Total Bookings", value: "128", sub: "This Year", icon: CalendarDays, color: "#1B4332", bg: "#f0faf4" },
          { label: "Completed", value: "85", sub: "Successfully Executed", icon: CheckCircle2, color: "#059669", bg: "#dcfce7" },
          { label: "Upcoming", value: "38", sub: "Scheduled Events", icon: CalendarCheck, color: "#2563eb", bg: "#eff6ff" },
          { label: "Cancelled", value: "5", sub: "3.9% Cancel Rate", icon: Ban, color: "#dc2626", bg: "#fef2f2" },
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
        
        {/* Booking Volume */}
        <div style={cardSt}>
          <p style={sTitle}>Monthly Booking Volume</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={MOCK_MONTHS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Line type="monotone" dataKey="bookings" stroke="#1B4332" strokeWidth={3} dot={{ fill: "#1B4332", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event Types */}
        <div style={cardSt}>
          <p style={sTitle}>Events Breakdown</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MOCK_EVENTS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
                {MOCK_EVENTS.map((entry, index) => (
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
