import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend,
  FunnelChart, Funnel, LabelList
} from "recharts";
import { Clock, TrendingUp, Calendar, Plus, MessageCircle, MapPin, CheckSquare, Truck, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS & MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const BRAND = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  accent: "#D4A017",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#0ea5e9",
  danger: "#ef4444"
};

const revenueData = [ { name: "Jan", uv: 4500 }, { name: "Feb", uv: 5200 }, { name: "Mar", uv: 3800 }, { name: "Apr", uv: 2100 }, { name: "May", uv: 6800 }, { name: "Jun", uv: 8500 } ];
const eventDistData = [ { name: "Wedding", value: 65, color: BRAND.primary }, { name: "Reception", value: 45, color: BRAND.primaryLight }, { name: "Corporate", value: 20, color: BRAND.accent }, { name: "Birthday", value: 10, color: BRAND.info } ];
const occupancyData = [ { name: "Hall A", uv: 88, fill: BRAND.success }, { name: "Hall B", uv: 72, fill: BRAND.warning } ];
const funnelData = [ { name: "Enquiry", value: 100, fill: "#e2e8f0" }, { name: "Booking", value: 25, fill: BRAND.success } ];

const GradientCard = ({ title, value, gradient, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }} whileHover={{ y: -5, scale: 1.02 }}
    style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, padding: 20, borderRadius: 20, color: "#fff", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. MANAGER / OWNER MODE (Executive Cockpit)
// ─────────────────────────────────────────────────────────────────────────────

import { bookingsAPI, enquiriesAPI } from "../services/api";

function ExecutiveCockpit() {
  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    totalBookings: 0,
    confirmedCount: 0,
    pendingCount: 0,
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
        bookingsAPI.getAll(),
        enquiriesAPI.getAll()
      ]);

      const allBookings = bookingsRes.data?.data || [];
      const today = new Date().toISOString().split('T')[0];
      
      // Compute upcoming bookings (future dates)
      const upcomingCount = allBookings.filter(b => b.date && b.date >= today && b.status !== 'Cancelled' && b.status !== 'Enquiry').length;

      if (statsRes.data?.data) {
        const ts = statsRes.data.data;
        const healthScore = ts.totalBookings > 0 
          ? Math.round((ts.confirmedCount / ts.totalBookings) * 100) 
          : 100;
        setStats({ ...ts, upcomingCount, healthScore });
      }

      // Compute Today's Events
      const todayEvts = allBookings.filter(b => b.date && b.date.startsWith(today));
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
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
      
      const weekEvts = allBookings.filter(b => b.date && b.date >= today && b.date <= endOfWeekStr && b.status !== 'Cancelled' && b.status !== 'Enquiry')
                                  .sort((a,b) => new Date(a.date) - new Date(b.date));
      
      setThisWeeksEvents(weekEvts);

    } catch(err) {
      console.error("Failed to load dashboard data", err);
    }
  };

  const formatLakhs = (val) => `₹${(val / 100000).toFixed(1)}L`;

  const { user } = useRole();

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: "#fff", borderRadius: 24, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", color: "#0f172a", letterSpacing: "-1px" }}>Hi, {user?.name?.split(' ')[0] || "User"} 👋</h1>
          <p style={{ margin: 0, fontSize: 16, color: "#64748b", fontWeight: 500 }}>Here's what's happening with your business today.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, background: "#f8fafc", padding: "12px 24px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 24, marginBottom: 24 }}>
        <GradientCard title="Total Revenue" value={formatLakhs(stats.totalRevenue)} gradient={["#1B4332", "#2D6A4F"]} delay={0.1} />
        <GradientCard title="Total Bookings" value={stats.totalBookings} gradient={["#2D6A4F", "#40916C"]} delay={0.2} />
        <GradientCard title="Confirmed" value={stats.confirmedCount} gradient={["#40916C", "#52B788"]} delay={0.3} />
        <GradientCard title="Enquiries" value={stats.enquiryCount} gradient={["#52B788", "#74C69D"]} delay={0.4} />
        <GradientCard title="Pending Pmt" value={stats.pendingCount} gradient={["#d97706", "#f59e0b"]} delay={0.5} />
        <GradientCard title="Upcoming" value={stats.upcomingCount} gradient={["#0ea5e9", "#38bdf8"]} delay={0.6} />
      </div>

      {/* Row 1: Revenue (8 cols) + Today's Events (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
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

        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
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
        
        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Event Distribution</h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distData.length ? distData : eventDistData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {(distData.length ? distData : eventDistData).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
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
// 2. RECEPTION MODE (Sales & Enquiries)
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
        bookingsAPI.getAll(),
        enquiriesAPI.getAll()
      ]);
      const allBookings = bookingsRes.data?.data || [];
      const allEnquiries = enquiriesRes.data?.data || [];
      const today = new Date().toISOString().split('T')[0];
      
      const filteredBookings = allBookings.filter(b => b.createdBy === user?.name || b.salesExecutiveName === user?.name || b.bookedBy === user?.name || b.userId === user?.id || b.salesExecutiveId === user?.id);
      const filteredEnquiries = allEnquiries.filter(e => e.createdBy === user?.name || e.salesExecutiveName === user?.name || e.assignedTo === user?.name || e.userId === user?.id || e.salesExecutiveId === user?.id);

      const todaysEvents = filteredBookings.filter(b => b.date && b.date.startsWith(today));
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
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", color: "#fff", borderRadius: 32, padding: 40, boxShadow: "0 20px 40px rgba(13,36,24,0.2)" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 16px", letterSpacing: "-1px" }}>Reception Desk 👋</h1>
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

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: "#fff", borderRadius: 32, padding: 40, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
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

// ─────────────────────────────────────────────────────────────────────────────
// 3. OPERATIONS MODE (Jobs & Vendors)
// ─────────────────────────────────────────────────────────────────────────────

function OperationsCockpit() {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", borderRadius: 32, padding: 40, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: "0 0 16px", color: "#0f172a", letterSpacing: "-1px" }}>Operations Command 🛠️</h1>
          <p style={{ margin: 0, fontSize: 18, color: "#64748b", fontWeight: 500 }}>Track live jobs, vendors, and hall logistics.</p>
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
    <div style={{ padding: "24px 32px", maxWidth: 1600, margin: "0 auto", fontFamily: "'Inter', 'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
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
  );
}
