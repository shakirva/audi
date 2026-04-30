import { useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Calendar, Users, IndianRupee, Clock } from "lucide-react";
import StatCard from "../components/StatCard";
import BookingModal from "../components/BookingModal";
import { monthlyRevenue, eventTypes } from "../data/dummyData";
import { useNavigate } from "react-router-dom";
import { useBookings } from "../context/BookingsContext";
import { useRole } from "../context/RoleContext";

const todayStr = new Date().toISOString().split("T")[0];
const PIE_COLORS = ["#1B4332", "#2D6A4F", "#D4A017", "#40916C", "#74C69D", "#95d5b2"];

function getDateRange(filter) {
  const now = new Date();
  const pad = (d) => d.toISOString().split("T")[0];
  if (filter === "Today") return { from: pad(now), to: pad(now) };
  if (filter === "Week") {
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: pad(mon), to: pad(sun) };
  }
  if (filter === "Year") {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  }
  // Month (default)
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${lastDay}` };
}

const S = {
  card: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
    padding: 24,
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 16,
  },
};

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState("Month");
  const navigate = useNavigate();
  const { bookings } = useBookings();
  const { can } = useRole();

  const { from, to } = getDateRange(dateFilter);
  const filtered = bookings.filter((b) => b.date >= from && b.date <= to);

  const pending = filtered.filter((b) => b.status === "Pending Payment").length;
  const totalRevenue = filtered
    .filter((b) => b.status === "Confirmed" || b.status === "Completed")
    .reduce((s, b) => s + b.totalAmount, 0);
  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const upcoming = [...bookings]
    .filter((b) => b.date >= todayStr && b.status !== "Cancelled")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const DATE_FILTERS = ["Today", "Week", "Month", "Year"];

  const quickActions = [
    { label: "New Booking", emoji: "📅", color: "#1B4332", onClick: () => setShowModal(true),       permission: "canAddBooking" },
    { label: "Calendar",    emoji: "📆", color: "#2D6A4F", onClick: () => navigate("/calendar"),     permission: null },
    { label: "Payments",    emoji: "💰", color: "#b45309", onClick: () => navigate("/payments"),     permission: "canViewPayments" },
    { label: "Reports",     emoji: "📊", color: "#1d4ed8", onClick: () => navigate("/reports"),      permission: "canViewReports" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 1400 }}>

      {/* ── DATE FILTER TOGGLE ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 4 }}>
        {DATE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            style={{
              padding: "6px 16px", borderRadius: 20, border: "1.5px solid",
              borderColor: dateFilter === f ? "#1B4332" : "#e5e7eb",
              background: dateFilter === f ? "#1B4332" : "#fff",
              color: dateFilter === f ? "#fff" : "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}
          >{f}</button>
        ))}
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard title="Total Bookings" value={filtered.length}  sub={dateFilter}          icon={Calendar}      color="green" trend="+12%" trendUp />
        {can("canViewRevenue") && <StatCard title="Revenue"       value={`₹${(totalRevenue / 100000).toFixed(1)}L`} sub="Confirmed" icon={IndianRupee} color="gold" trend="+8%" trendUp />}
        {can("canViewRevenue") && <StatCard title="Pending"       value={pending}         sub="Awaiting payment"   icon={Clock}         color="red"   trend={`${pending} due`} trendUp={false} />}
        <StatCard title="Customers"       value={new Set(filtered.map((b) => b.phone)).size} sub="Unique clients" icon={Users}  color="blue"  trend="+5 new" trendUp />
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: can("canViewRevenue") ? "1fr 380px" : "1fr", gap: 16, marginBottom: 24 }}>

        {/* Bar Chart — Owner/Manager only */}
        {can("canViewRevenue") && (
        <div style={S.card}>
          <p style={S.sectionTitle}>Monthly Revenue (₹)</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyRevenue} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 12 }}
                cursor={{ fill: "rgba(27,67,50,0.05)" }}
              />
              <Bar dataKey="revenue" fill="#1B4332" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        )}

        {/* Pie Chart */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Event Types</p>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={eventTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={42} paddingAngle={3}>
                {eventTypes.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
            {eventTypes.map((e, i) => (
              <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#6b7280", flex: 1 }}>{e.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>

        {/* Today's Events + Upcoming */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Today's Events */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ ...S.sectionTitle, marginBottom: 0 }}>Today's Events</p>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#F0F4EF", color: "#1B4332", padding: "3px 12px", borderRadius: 20 }}>
                {todayBookings.length} booked
              </span>
            </div>
            {todayBookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0", color: "#d1d5db" }}>
                <Calendar size={36} style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, color: "#9ca3af" }}>No events scheduled for today</p>
              </div>
            ) : (
              todayBookings.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F0F4EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {b.eventType === "Wedding" ? "💍" : b.eventType === "Conference" ? "💼" : b.eventType === "Birthday" ? "🎂" : "🎉"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{b.customerName}</p>
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{b.eventType} · {b.session} · {b.hall}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1B4332" }}>{b.guests} guests</p>
                    {can("canViewRevenue") && <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>₹{b.totalAmount.toLocaleString()}</p>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Upcoming Bookings */}
          <div style={S.card}>
            <p style={S.sectionTitle}>Upcoming Bookings</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {upcoming.map((b, idx) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: idx < upcoming.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ textAlign: "center", minWidth: 40, background: "#F0F4EF", borderRadius: 10, padding: "6px 8px", flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#1B4332", lineHeight: 1 }}>{new Date(b.date).getDate()}</p>
                    <p style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>
                      {new Date(b.date).toLocaleString("en", { month: "short" })}
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.customerName}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{b.eventType} · {b.hall}</p>
                  </div>
                  {can("canViewRevenue") && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1B4332", background: "#F0F4EF", padding: "3px 10px", borderRadius: 8, flexShrink: 0 }}>
                    ₹{b.totalAmount.toLocaleString()}
                  </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Quick Actions</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {quickActions.filter(a => !a.permission || can(a.permission)).map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                style={{
                  padding: "20px 10px",
                  borderRadius: 14,
                  border: "1.5px solid " + a.color + "22",
                  background: a.color + "0a",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: a.color,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = a.color + "18";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px " + a.color + "22";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = a.color + "0a";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: 26 }}>{a.emoji}</span>
                {a.label}
              </button>
            ))}
          </div>

          {/* Summary stats */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {dateFilter === "Today" ? "Today" : dateFilter === "Week" ? "This Week" : dateFilter === "Year" ? "This Year" : "This Month"}
            </p>
            {[
              { label: "New bookings",   value: filtered.length, color: "#1B4332" },
              ...(can("canViewRevenue") ? [{ label: "Revenue", value: "₹" + filtered.filter(b => b.status === "Confirmed" || b.status === "Completed").reduce((s,b)=>s+b.totalAmount,0).toLocaleString(), color: "#D4A017" }] : []),
              { label: "Pending dues",   value: pending + " bookings", color: "#C0392B" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {showModal && <BookingModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
