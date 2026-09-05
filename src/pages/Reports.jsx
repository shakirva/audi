import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import { useBookings } from "../context/BookingsContext";
import { settingsAPI, reportsAPI } from "../services/api";

const card = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 14 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12, margin: 0 };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PEAK_DAYS = ["Sat", "Sun", "Fri"];


export default function Reports() {
  const { addToast } = useToast();
  const { bookings: ctxBookings } = useBookings();

  const currentYear = new Date().getFullYear();
  const defaultFrom = `${currentYear}-01-01`;
  const defaultTo = `${currentYear}-12-31`;
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [halls, setHalls] = useState([]);

  useEffect(() => {
    reportsAPI.checkAccess().then(() => {
      settingsAPI.get().then(res => {
        setHalls(res.data?.data?.halls || []);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  const bookings = ctxBookings.filter(b => b.date >= fromDate && b.date <= toDate);

  const totalRevenue = bookings.filter(b => b.status === "Confirmed" || b.status === "Completed").reduce((s, b) => s + (b.totalAmount || 0), 0);
  const confirmed    = bookings.filter(b => b.status === "Confirmed").length || 1; // avoid /0

  const peakData = WEEKDAYS.map(day => {
    const bCount = bookings.filter(b => {
      if (!b.date) return false;
      const d = new Date(b.date);
      if (isNaN(d)) return false;
      return d.toLocaleString('en-US', { weekday: 'short' }) === day;
    }).length;
    return { day, bookings: bCount, peak: PEAK_DAYS.includes(day) };
  });

  const hallMap = {};
  bookings.forEach(b => {
    // Only count if it's a real hall (or if real halls haven't loaded yet)
    if (halls.length === 0 || halls.some(h => h.name === b.hall)) {
      hallMap[b.hall] = (hallMap[b.hall] || 0) + 1;
    }
  });
  const validBookingCountForHalls = Object.values(hallMap).reduce((a, b) => a + b, 0);
  const hallData = Object.keys(hallMap).map(h => ({ hall: h, pct: Math.round((hallMap[h]/(validBookingCountForHalls || 1))*100) }));

  const eventTypeMap = {};
  bookings.forEach(b => eventTypeMap[b.eventType] = (eventTypeMap[b.eventType] || 0) + 1);
  const eventTypes = Object.keys(eventTypeMap).map(e => ({ name: e, value: eventTypeMap[e] }));

  const revenueMap = {};
  bookings.forEach(b => {
    if (b.status === "Confirmed" || b.status === "Completed") {
      if (b.date) {
        const d = new Date(b.date);
        if (!isNaN(d)) {
          const monthStr = d.toLocaleString('default', { month: 'short' });
          revenueMap[monthStr] = (revenueMap[monthStr] || 0) + (b.totalAmount || 0);
        }
      }
    }
  });
  const monthlyRevenue = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentYear, i, 1);
    const m = d.toLocaleString('default', { month: 'short' });
    monthlyRevenue.push({ month: m, revenue: revenueMap[m] || 0 });
  }



  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── DATE RANGE FILTER ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>📅</span> Date Range Filter
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#1B4332", background: "#f0faf4", padding: "4px 10px", borderRadius: 20 }}>
            {bookings.length} found
          </span>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-end">
          <div className="flex-1 min-w-[120px]">
            <label style={{ display: "block", fontSize: 10, color: "#6b7280", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#374151", outline: "none", background: "#f9fafb" }} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label style={{ display: "block", fontSize: 10, color: "#6b7280", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#374151", outline: "none", background: "#f9fafb" }} />
          </div>
          <button onClick={() => { setFromDate(defaultFrom); setToDate(defaultTo); }}
            className="w-full sm:w-auto flex-none"
            style={{ padding: "0 16px", height: "35px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 11, fontWeight: 700, color: "#64748b", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Reset Filter
          </button>
        </div>
      </div>



      {/* ── CHARTS ROW ── */}
      <div className="hm-2col-grid" style={{ marginBottom: 12 }}>

        {/* Revenue Trend */}
        <div style={card}>
          <p style={sTitle}>Revenue Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/100000}L`} />
              <Tooltip formatter={v => [`₹${(v/100000).toFixed(1)}L`, "Revenue"]} contentStyle={{ borderRadius: 6, border: "none", fontSize: 11 }} />
              <Line type="monotone" dataKey="revenue" stroke="#1B4332" strokeWidth={2} dot={{ fill: "#1B4332", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Days */}
        <div style={card}>
          <p style={sTitle}>Bookings by Day</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={peakData} barCategoryGap="35%">
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 6, border: "none", fontSize: 11 }} />
              <Bar dataKey="bookings" radius={[4, 4, 0, 0]}>
                {peakData.map((d, i) => (
                  <Cell key={i} fill={d.peak ? "#D4A017" : "#1B4332"} opacity={d.peak ? 1 : 0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#D4A017" }} />
              <span style={{ fontSize: 10, color: "#6b7280" }}>Peak</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#1B4332", opacity: 0.5 }} />
              <span style={{ fontSize: 10, color: "#6b7280" }}>Regular</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── UTILIZATION + EVENT TYPES ── */}
      <div className="hm-2col-grid" style={{ marginBottom: 12 }}>

        {/* Hall Utilization */}
        <div style={card}>
          <p style={sTitle}>Hall Utilization</p>
          {hallData.map((h, i) => (
            <div key={h.hall} style={{ marginBottom: i < hallData.length - 1 ? 12 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{h.hall}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1B4332" }}>{h.pct}%</span>
              </div>
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${h.pct}%`, borderRadius: 8, background: h.pct >= 80 ? "#1B4332" : h.pct >= 60 ? "#D4A017" : "#2563eb", transition: "width 0.6s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Event Types Breakdown */}
        <div style={card}>
          <p style={sTitle}>Event Types</p>
          {eventTypes.map((e, i) => {
            const total = eventTypes.reduce((s, x) => s + x.value, 0);
            const pct   = Math.round((e.value / total) * 100);
            const colors = ["#1B4332","#2D6A4F","#D4A017","#40916C","#2563eb","#7c3aed"];
            return (
              <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i % colors.length], flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#374151", flex: 1, minWidth: 0 }}>{e.name}</span>
                <div style={{ width: 50, height: 4, background: "#f3f4f6", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: colors[i % colors.length], borderRadius: 8 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", minWidth: 22, textAlign: "right", flexShrink: 0 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}
