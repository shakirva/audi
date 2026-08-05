import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { useToast } from "../components/Toast";
import { useBookings } from "../context/BookingsContext";
import { settingsAPI } from "../services/api";

const card = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 14 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12, margin: 0 };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PEAK_DAYS = ["Sat", "Sun", "Fri"];

// ── PDF generators ──
function printHTML(title, bodyHTML) {
  const name = "Venueza Auditorium";
  const location = "Kerala, India";
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;margin:0;padding:24px;color:#111;font-size:13px}
    h1{font-size:22px;margin:0 0 4px;color:#1B4332}
    .sub{font-size:12px;color:#6b7280;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{background:#1B4332;color:#fff;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
    td{padding:9px 12px;border-bottom:1px solid #f3f4f6;font-size:12px}
    tr:nth-child(even) td{background:#f9fafb}
    .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700}
    .confirmed{background:#dcfce7;color:#15803d}
    .pending{background:#fef9c3;color:#a16207}
    .completed{background:#f3f4f6;color:#374151}
    .enquiry{background:#dbeafe;color:#1d4ed8}
    .footer{margin-top:24px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px}
    @media print{body{padding:12px}}
  </style></head><body>
  <h1>${name}</h1>
  <div class="sub">📍 ${location} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
  ${bodyHTML}
  <div class="footer">Venueza — ${name} | Confidential Report</div>
  <script>window.onload=()=>{window.print();}<` + `/script>
  </body></html>`);
  w.document.close();
}

function downloadBookingReport(bookings) {
  const rows = bookings.map(b => `
    <tr>
      <td>${b.id}</td>
      <td><strong>${b.customerName}</strong><br><span style="color:#9ca3af;font-size:11px">${b.phone}</span></td>
      <td>${b.eventType}</td>
      <td>${b.hall}</td>
      <td>${new Date(b.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
      <td>${b.session}</td>
      <td style="font-weight:700">₹${b.totalAmount.toLocaleString()}</td>
      <td>₹${(b.advance??b.advancePaid??0).toLocaleString()}</td>
      <td><span class="badge ${b.status.toLowerCase().replace(" ","-")}">${b.status}</span></td>
    </tr>`).join("");
  const total = bookings.reduce((s,b)=>s+b.totalAmount,0);
  printHTML("Booking Report", `
    <h2 style="font-size:16px;margin:0 0 12px">📋 Booking Report — All ${bookings.length} Bookings</h2>
    <table>
      <thead><tr><th>ID</th><th>Customer</th><th>Event</th><th>Hall</th><th>Date</th><th>Session</th><th>Total</th><th>Advance</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="6" style="font-weight:700;padding:10px 12px">TOTAL</td><td colspan="3" style="font-weight:800;color:#1B4332;padding:10px 12px">₹${total.toLocaleString()}</td></tr></tfoot>
    </table>`);
}

function downloadRevenueReport(bookings) {
  // Compute monthly revenue dynamically
  const revenueMap = {};
  bookings.forEach(b => {
    if (b.status === "Confirmed" || b.status === "Completed") {
      if (b.date) {
        const d = new Date(b.date);
        if (!isNaN(d)) {
          const m = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          revenueMap[m] = (revenueMap[m] || 0) + (b.totalAmount || 0);
        }
      }
    }
  });
  const monthlyRevenue = Object.keys(revenueMap).map(m => ({ month: m, revenue: revenueMap[m] }));
  
  const rows = monthlyRevenue.map(m => `
    <tr>
      <td>${m.month}</td>
      <td style="font-weight:700">₹${m.revenue.toLocaleString()}</td>
      <td>₹${Math.round(m.revenue*0.09).toLocaleString()}</td>
      <td>₹${Math.round(m.revenue*0.09).toLocaleString()}</td>
      <td style="font-weight:700;color:#1B4332">₹${Math.round(m.revenue*0.82).toLocaleString()}</td>
    </tr>`).join("");
  const grandTotal = monthlyRevenue.reduce((s,m)=>s+m.revenue,0);
  printHTML("Revenue Report", `
    <h2 style="font-size:16px;margin:0 0 12px">💰 Revenue Report — Monthly Breakdown</h2>
    <table>
      <thead><tr><th>Month</th><th>Gross Revenue</th><th>CGST (9%)</th><th>SGST (9%)</th><th>Net Revenue</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td style="font-weight:700;padding:10px 12px">TOTAL</td><td style="font-weight:800;padding:10px 12px">₹${grandTotal.toLocaleString()}</td><td style="padding:10px 12px">₹${Math.round(grandTotal*0.09).toLocaleString()}</td><td style="padding:10px 12px">₹${Math.round(grandTotal*0.09).toLocaleString()}</td><td style="font-weight:800;color:#1B4332;padding:10px 12px">₹${Math.round(grandTotal*0.82).toLocaleString()}</td></tr></tfoot>
    </table>`);
}

function downloadCustomerReport(bookings) {
  const customerMap = {};
  bookings.forEach(b => {
    if (!customerMap[b.phone]) customerMap[b.phone] = { name: b.customerName, phone: b.phone, bookings: [], total: 0 };
    customerMap[b.phone].bookings.push(b);
    customerMap[b.phone].total += b.totalAmount;
  });
  const rows = Object.values(customerMap).sort((a,b)=>b.total-a.total).map(c=>`
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone}</td>
      <td style="text-align:center">${c.bookings.length}</td>
      <td>${c.bookings.map(b=>b.eventType).join(", ")}</td>
      <td style="font-weight:700;color:#1B4332">₹${c.total.toLocaleString()}</td>
      <td>${new Date(c.bookings[c.bookings.length-1].date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
    </tr>`).join("");
  printHTML("Customer Report", `
    <h2 style="font-size:16px;margin:0 0 12px">👥 Customer Report — ${Object.keys(customerMap).length} Unique Customers</h2>
    <table>
      <thead><tr><th>Name</th><th>Phone</th><th>Bookings</th><th>Event Types</th><th>Total Spent</th><th>Last Booking</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
}

function downloadHallReport(bookings) {
  const hallMap = {};
  bookings.forEach(b => {
    if (!hallMap[b.hall]) hallMap[b.hall] = { name: b.hall, bookings: 0, revenue: 0 };
    hallMap[b.hall].bookings++;
    hallMap[b.hall].revenue += b.totalAmount;
  });
  const rows = Object.values(hallMap).map(h=>`
    <tr>
      <td><strong>${h.name}</strong></td>
      <td style="text-align:center">${h.bookings}</td>
      <td style="font-weight:700;color:#1B4332">₹${h.revenue.toLocaleString()}</td>
      <td>₹${Math.round(h.revenue/h.bookings).toLocaleString()}</td>
      <td>${Math.round((h.bookings / bookings.length) * 100) || 0}%</td>
    </tr>`).join("");
  printHTML("Hall Usage Report", `
    <h2 style="font-size:16px;margin:0 0 12px">🏛️ Hall Usage Report</h2>
    <table>
      <thead><tr><th>Hall</th><th>Total Bookings</th><th>Revenue</th><th>Avg per Booking</th><th>Share of Bookings</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
}


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
    settingsAPI.get().then(res => {
      setHalls(res.data?.data?.halls || []);
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

  const reportCards = [
    { title: "Booking Report",   desc: "All bookings with details, status & revenue", icon: "📋", color: "#1B4332", onDownload: () => downloadBookingReport(bookings) },
    { title: "Revenue Report",   desc: "Monthly revenue breakdown & GST summary",     icon: "💰", color: "#D4A017", onDownload: () => downloadRevenueReport(bookings) },
    { title: "Customer Report",  desc: "Customer list with booking history",           icon: "👥", color: "#2563eb", onDownload: () => downloadCustomerReport(bookings) },
    { title: "Hall Usage Report",desc: "Hall-wise utilization & peak time analysis",  icon: "🏛️", color: "#7c3aed", onDownload: () => downloadHallReport(bookings) },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── DATE RANGE FILTER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap", background: "#fff", borderRadius: 10, padding: "10px 12px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>📅</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200, flexWrap: "wrap", paddingBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, whiteSpace: "nowrap" }}>From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: "#374151", outline: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, whiteSpace: "nowrap" }}>To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: "#374151", outline: "none" }} />
          </div>
          <button onClick={() => { setFromDate(defaultFrom); setToDate(defaultTo); }}
            style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#f9fafb", fontSize: 10, color: "#6b7280", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
            Reset
          </button>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#1B4332", background: "#F0F4EF", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
          {bookings.length} found
        </span>
      </div>

      {/* ── SUMMARY STATS ── */}
      <div className="hm-stat-grid">
        {[
          { label: "Total Bookings",  value: bookings.length,     color: "#1B4332", bg: "#f0faf4", icon: "📅" },
          { label: "Confirmed",       value: confirmed - 1,        color: "#15803d", bg: "#dcfce7", icon: "✅" },
          { label: "Total Revenue",   value: `₹${(totalRevenue/100000).toFixed(1)}L`, color: "#D4A017", bg: "#fffbeb", icon: "💰" },
          { label: "Avg. Booking",    value: `₹${Math.round(totalRevenue/confirmed/1000).toFixed(0)}k`, color: "#2563eb", bg: "#eff6ff", icon: "📊" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: s.color, marginTop: 1, margin: 0 }}>{s.value}</p>
            </div>
          </div>
        ))}
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

      {/* ── DOWNLOAD CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {reportCards.map(r => (
          <div key={r.title} style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 12, border: `1px solid ${r.color}15` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
            <p style={{ fontWeight: 700, fontSize: 12, color: "#111827", marginBottom: 4, margin: 0 }}>{r.title}</p>
            <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 10, lineHeight: 1.4, margin: "4px 0 10px 0" }}>{r.desc}</p>
            <button
              onClick={() => { r.onDownload(); addToast(`${r.title} ready — printing…`, "success"); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 12px", borderRadius: 7, background: r.color, color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, width: "100%" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <Download size={11} /> PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
