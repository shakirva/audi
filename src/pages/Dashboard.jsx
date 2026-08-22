import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend,
  FunnelChart, Funnel, LabelList
} from "recharts";
import { Clock, TrendingUp, Calendar, Plus, MessageCircle, MapPin, CheckSquare, Truck, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import { bookingsAPI, enquiriesAPI } from "../services/api";
import { CreditCard, FileText } from "lucide-react";

const BRAND = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  accent: "#D4A017",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#0ea5e9",
  danger: "#ef4444"
};

const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

const GradientCard = ({ title, value, gradient, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay }}
    className="hm-card" 
    style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, color: "#fff", display: "flex", flexDirection: "column", gap: 8, padding: 24, borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
  >
    <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
  </motion.div>
);

// --- CHARTS DATA MOCKS ---
const revenueData = [
  { name: "Jan", rev: 450000, exp: 200000 },
  { name: "Feb", rev: 520000, exp: 210000 },
  { name: "Mar", rev: 380000, exp: 180000 },
  { name: "Apr", rev: 850000, exp: 300000 },
  { name: "May", rev: 680000, exp: 250000 },
  { name: "Jun", rev: 950000, exp: 280000 }
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. MANAGER / OWNER MODE (Executive Command Center)
// ─────────────────────────────────────────────────────────────────────────────



function ExecutiveCockpit() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    confirmedCount: 0,
    pendingAmount: 0,
    enquiryCount: 0,
    upcomingCount: 0,
  });

  const [revData, setRevData] = React.useState([]);
  const [distData, setDistData] = React.useState([]);
  const [todaysEvents, setTodaysEvents] = React.useState([]);
  const [thisWeeksEvents, setThisWeeksEvents] = React.useState([]);

  React.useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, bookingsRes, enqRes] = await Promise.all([
        bookingsAPI.getStats(),
        bookingsAPI.getAll({ limit: 1000 }),
        enquiriesAPI.getAll({ limit: 1000 })
      ]);

      const allBookings = bookingsRes.data?.data || [];
      const allEnquiries = enqRes.data?.data || [];
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);
      
      // Compute upcoming bookings (future dates)
      const upcomingCount = allBookings.filter(b => {
        if (!b.date) return false;
        if (b.status === 'Cancelled' || b.status === 'Enquiry') return false;
        return new Date(b.date) >= startOfToday;
      }).length;

      // Compute Pending Payments Amount
      const pendingAmount = allBookings.reduce((sum, b) => {
        if (b.status === 'Cancelled') return sum;
        const total = Number(b.totalAmount) || 0;
        const paid = Number(b.advance) || 0;
        if (total > paid) {
          return sum + (total - paid);
        }
        return sum;
      }, 0);

      // Compute Active Enquiries
      const enquiryCount = allEnquiries.filter(e => e.status !== 'Lost' && e.status !== 'Cancelled').length;

      if (statsRes.data?.data) {
        const ts = statsRes.data.data;
        const healthScore = ts.totalBookings > 0 
          ? Math.round((ts.confirmedCount / ts.totalBookings) * 100) 
          : 100;
        setStats({ ...ts, upcomingCount, pendingAmount, enquiryCount, healthScore });
      } else {
        // Fallback if stats API fails or is empty
        setStats(prev => ({ ...prev, upcomingCount, pendingAmount, enquiryCount }));
      }

      // Compute Today's Events
      const todayEvts = allBookings.filter(b => {
        if (!b.date) return false;
        const d = new Date(b.date);
        return d >= startOfToday && d <= endOfToday;
      });
      setTodaysEvents(todayEvts);

      // Compute Event Distribution
      const distMap = {};
      allBookings.forEach(b => {
        if (!b.eventType) return;
        distMap[b.eventType] = (distMap[b.eventType] || 0) + 1;
      });
      const colors = [BRAND.primary, BRAND.primaryLight, BRAND.accent, BRAND.info, BRAND.warning, BRAND.success];
      const distArr = Object.keys(distMap).map((k, i) => ({
        name: k,
        value: distMap[k],
        color: colors[i % colors.length]
      }));
      if (distArr.length === 0) {
        distArr.push({ name: "No Events", value: 1, color: "#e2e8f0" });
      }
      setDistData(distArr);

      // Compute Revenue Trend (Last 6 months)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const revMap = {};
      allBookings.forEach(b => {
        if (b.status === "Confirmed" || b.status === "Completed") {
          if (b.date) {
            const m = new Date(b.date).getMonth();
            revMap[m] = (revMap[m] || 0) + (Number(b.totalAmount) || 0);
          }
        }
      });
      // Just take 6 recent months for demo, or all 12
      const currentMonth = new Date().getMonth();
      const revArr = [];
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        if (m < 0) m += 12;
        revArr.push({ name: monthNames[m], uv: revMap[m] || 0 });
      }
      setRevData(revArr);

      // Compute This Week's Events
      const weekEvts = allBookings.filter(b => {
        if (!b.date) return false;
        if (b.status === 'Cancelled' || b.status === 'Enquiry') return false;
        const d = new Date(b.date);
        return d >= startOfToday && d <= endOfWeek;
      }).sort((a,b) => new Date(a.date) - new Date(b.date));
      
      setThisWeeksEvents(weekEvts);

    } catch(err) {
      console.error("Failed to load dashboard data", err);
    }
  };

  const formatLakhs = (val) => `₹${(val / 100000).toFixed(1)}L`;

  const { user } = useRole();

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="hm-dash-greeting" style={{ background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
        <div>
          <h1 className="hm-dash-title">Hi, {user?.name?.split(' ')[0] || "User"} 👋</h1>
          <p style={{ margin: 0, fontSize: 16, color: "#64748b", fontWeight: 500 }}>Here's what's happening with your business today.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", background: "#f8fafc", padding: "12px 24px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Health Score</div>
            <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><TrendingUp size={14}/> Conversion Rate</div>
          </div>
          <div style={{ position: "relative", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="60" height="60" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <motion.circle cx="50" cy="50" r="40" fill="none" stroke={BRAND.success} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (stats.healthScore || 100)/100)} />
            </svg>
            <div style={{ position: "absolute", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{stats.healthScore || 100}%</div>
          </div>
        </div>
      </motion.div>

      <div className="hm-dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <GradientCard title="Total Revenue" value={formatLakhs(stats.totalRevenue || 0)} gradient={["#1B4332", "#2D6A4F"]} delay={0.1} />
        <GradientCard title="Total Bookings" value={stats.totalBookings} gradient={["#2D6A4F", "#40916C"]} delay={0.2} />
        <GradientCard title="Enquiries" value={stats.enquiryCount} gradient={["#52B788", "#74C69D"]} delay={0.3} />
        <GradientCard title="Pending Pmt" value={formatLakhs(stats.pendingAmount || 0)} gradient={["#d97706", "#f59e0b"]} delay={0.4} />
        <GradientCard title="Upcoming" value={stats.upcomingCount} gradient={["#0ea5e9", "#38bdf8"]} delay={0.5} />
      </div>
      {/* Row 1: Revenue (8 cols) + Today's Events (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
        <div className="hm-card" style={{ borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)", overflow: "hidden" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Revenue Trend</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revData.length ? revData : revenueData}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                <Area type="monotone" dataKey="uv" stroke={BRAND.primary} strokeWidth={4} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hm-card" style={{ borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}><Calendar size={18} color={BRAND.accent} /> Today's Events</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {todaysEvents.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 14 }}>No events scheduled for today.</div>
            ) : todaysEvents.map((evt) => (
              <div key={evt.id} style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{evt.eventType} - {evt.hall}</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 2 }}>{evt.customerName}</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{evt.session}</div>
                </div>
                <div style={{ background: evt.status === "Confirmed" || evt.status === "Ongoing" ? "#dcfce7" : "#fef3c7", color: evt.status === "Confirmed" || evt.status === "Ongoing" ? "#166534" : "#b45309", padding: "4px 8px", borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                  {evt.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Event Distribution (4 cols) + Urgent Enquiries (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mb-6">
        
        <div className="hm-card" style={{ borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)", overflow: "hidden" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Event Distribution</h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distData.length ? distData : eventDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                  {(distData.length ? distData : eventDistData).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip trigger="click" />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hm-card" style={{ borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}><Calendar size={18} color={BRAND.primary} /> This Week's Functions</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {thisWeeksEvents.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 14 }}>No events scheduled for the next 7 days.</div>
            ) : thisWeeksEvents.map((evt) => {
              // Convert date string to a readable format
              const evtDate = new Date(evt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div key={evt.id} style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{evt.eventType} - {evt.hall}</div>
                    <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{evt.customerName} • {evt.session} • {evtDate}</div>
                  </div>
                  <div style={{ background: evt.status === "Confirmed" || evt.status === "Ongoing" ? "#dcfce7" : "#fef3c7", color: evt.status === "Confirmed" || evt.status === "Ongoing" ? "#166534" : "#b45309", padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                    {evt.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION & OPERATIONS FALLBACKS (Kept Minimal for now)
// ─────────────────────────────────────────────────────────────────────────────

function ReceptionCockpit() {
  const navigate = useNavigate();
  const { user } = useRole();
  const [events, setEvents] = React.useState([]);
  const [enquiries, setEnquiries] = React.useState([]);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsRes, enquiriesRes] = await Promise.all([
        bookingsAPI.getAll({ limit: 1000 }),
        enquiriesAPI.getAll({ limit: 1000 })
      ]);
      const allBookings = bookingsRes.data?.data || [];
      const allEnquiries = enquiriesRes.data?.data || [];
      const filteredBookings = allBookings.filter(b => b.createdBy === user?.id || b.salesExecutiveId === user?.id || b.salesExecutiveName === user?.name || b.bookedBy === user?.name || b.userId === user?.id);
      const filteredEnquiries = allEnquiries.filter(e => e.createdBy === user?.id || e.salesExecutiveId === user?.id || e.salesExecutiveName === user?.name || e.assignedTo === user?.name || e.userId === user?.id);

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const todaysEvents = filteredBookings.filter(b => {
        if (!b.date) return false;
        const d = new Date(b.date);
        return d >= startOfToday && d <= endOfToday;
      });
      setEvents(todaysEvents);
      
      setEnquiries(filteredEnquiries);
    } catch(err) {
      console.error("Failed to load reception data", err);
    }
  };

  const getStatusColumn = (columnType) => {
    if (columnType === "Open") return enquiries.filter(e => ["New Enquiry", "Contacted"].includes(e.status));
    if (columnType === "Follow Up") return enquiries.filter(e => ["Follow-up", "Customer Visit", "Interested"].includes(e.status));
    if (columnType === "Closed") return enquiries.filter(e => ["Booking Confirmed", "Cancelled", "Lost"].includes(e.status));
    return [];
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hm-dash-greeting" style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", color: "#fff", boxShadow: "0 20px 40px rgba(13,36,24,0.2)", display: "block" }}>
          <h1 className="hm-dash-title" style={{ color: "#fff" }}>Reception Desk 👋</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>Fast creation and calendar view.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button onClick={() => navigate("/calendar")} style={{ padding: "16px", background: BRAND.accent, color: BRAND.primary, border: "none", borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Plus size={20} /> New Enquiry
            </button>
            <button onClick={() => navigate("/calendar")} style={{ padding: "16px", background: "#fff", color: BRAND.primary, border: "none", borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Calendar size={20} /> Check Availability
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hm-dash-greeting" style={{ background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.02)", display: "block" }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 24px" }}>Today's Live Events</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {events.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 14 }}>No events scheduled for today.</div>
            ) : events.map((evt) => (
              <div key={evt.id} style={{ background: "#f8fafc", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{evt.eventType} - {evt.hall}</div>
                  <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{evt.customerName} • {evt.session}</div>
                </div>
                <div style={{ background: evt.status === "Confirmed" ? "#dcfce7" : "#fef3c7", color: evt.status === "Confirmed" ? "#166534" : "#b45309", padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                  {evt.status}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div style={{ background: "#fff", borderRadius: 32, padding: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 24px" }}>Follow-up Queue (CRM)</h3>
        <div className="hm-crm-columns">
          {[
            { label: "New / Open", status: "Open" }, 
            { label: "Follow Up", status: "Follow Up" }, 
            { label: "Converted / Closed", status: "Closed" }
          ].map((col, i) => (
            <div key={i} style={{ background: "#f1f5f9", borderRadius: 24, padding: 24, minHeight: 300 }}>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: 16, letterSpacing: 1 }}>{col.label}</div>
              {getStatusColumn(col.status).length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No enquiries</div>
              ) : getStatusColumn(col.status).map(enq => (
                <div key={enq.id} style={{ background: "#fff", padding: 16, borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{enq.enquirerName || enq.Customer?.name || enq.enquiryNumber}</div>
                    <span style={{ fontSize: 10, background: "#e2e8f0", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>{enq.eventType}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Date: {enq.tentativeDate || "TBD"}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4, fontWeight: 600, color: "#d4a017" }}>{enq.status}</div>
                  {enq.remarks && <div style={{ fontSize: 12, color: "#475569", marginTop: 8, fontStyle: "italic", borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>"{enq.remarks}"</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function OperationsCockpit() {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hm-dash-greeting" style={{ background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
        <div>
          <h1 className="hm-dash-title">Operations Command 🛠️</h1>
          <p style={{ margin: 0, fontSize: 16, color: "#64748b", fontWeight: 500 }}>Track live jobs, vendors, and hall logistics.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GradientCard title="Active Jobs" value="8" gradient={["#1B4332", "#2D6A4F"]} delay={0.1} />
        <GradientCard title="Vendor Arrivals" value="12" gradient={["#D4A017", "#f59e0b"]} delay={0.2} />
        <GradientCard title="Checklists Pending" value="4" gradient={["#52B788", "#74C69D"]} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
        <div style={{ background: "#fff", borderRadius: 32, padding: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 24px", display: "flex", alignItems: "center", gap: 8 }}><Workflow size={20} color="#0ea5e9"/> Job Board</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { id: "JOB-1142", title: "Wedding Logistics", hall: "Emerald Hall", progress: 85 },
              { id: "JOB-1143", title: "Corporate Setup", hall: "Royal Hall", progress: 60 }
            ].map(job => (
              <div key={job.id} style={{ border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0ea5e9", marginBottom: 4 }}>{job.id}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{job.title}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={16}/> {job.hall}</div>
                </div>
                <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${job.progress}%` }} transition={{ duration: 1 }} style={{ height: "100%", background: "#0ea5e9" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 32, padding: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 24px", display: "flex", alignItems: "center", gap: 8 }}><Truck size={20} color="#f59e0b"/> Vendors</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { name: "Alpha Catering", eta: "Arrived", color: "#10b981" },
              { name: "Lumina Decorators", eta: "ETA 2:00 PM", color: "#f59e0b" }
            ].map((v, i) => (
              <div key={i} style={{ background: "#f8fafc", padding: 16, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{v.name}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: v.color }}>{v.eta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { role } = useRole();

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8">
      <div className="max-w-screen-2xl mx-auto">
        {role === "Owner" || role === "Manager" || role === "Admin" ? (
          <ExecutiveCockpit />
        ) : role === "Sales" ? (
          <ReceptionCockpit />
        ) : role === "Operations" ? (
          <OperationsCockpit />
        ) : (
          <ExecutiveCockpit />
        )}
      </div>
    </div>
  );
}
