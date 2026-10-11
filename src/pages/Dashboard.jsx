import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend,
  FunnelChart, Funnel, LabelList
} from "recharts";
import { 
  Clock, TrendingUp, Calendar, Plus, MessageCircle, MapPin, CheckSquare, Truck, Workflow,
  Users, CreditCard, FileText, ShieldAlert, ShieldCheck, Sparkles, Wallet, CheckCircle2,
  CalendarCheck, AlertCircle, Info, ChevronRight, Receipt, TrendingDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import { bookingsAPI, enquiriesAPI, complianceAPI, settingsAPI, expensesAPI } from "../services/api";

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

const GradientCard = ({ title, value, subtext, gradient, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay }}
    className="hm-card" 
    style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, color: "#fff", display: "flex", flexDirection: "column", gap: 6, padding: 24, borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>{title}</div>
      {subtext && <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 12, fontWeight: 700, letterSpacing: "0.5px" }}>{subtext}</span>}
    </div>
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

const eventDistData = [
  { name: "Loading", value: 1, color: "#e2e8f0" }
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const PaymentRemindersSection = ({ reminders }) => {
  if (!reminders) return null;

  return (
    <div className="hm-card" style={{ borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)", marginBottom: 24, border: "1px solid #fed7aa", background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#c2410c", display: "flex", alignItems: "center", gap: 8 }}>
          <MessageCircle size={20} color="#ea580c" /> Automated Payment Reminders
        </h3>
        <span style={{ fontSize: 12, fontWeight: 700, color: reminders.length > 0 ? "#ea580c" : "#64748b", background: reminders.length > 0 ? "#ffedd5" : "#f1f5f9", padding: "4px 8px", borderRadius: 8 }}>
          {reminders.length} Action{reminders.length !== 1 ? 's' : ''} Needed
        </span>
      </div>
      
      {reminders.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: 14, background: "#f8fafc", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
          No automated payment reminders due today.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {reminders.map(b => {
            const bal = (Number(b.totalAmount) || 0) - (Number(b.advance) || 0);
          const evtDateStr = new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const customerPhone = b.phone || b.Customer?.phone || "";
          const msg = `Hi ${b.customerName || 'Valued Customer'}, this is a gentle reminder regarding your recent event (${b.eventType}) on ${evtDateStr} at ${b.hall}. You have a pending balance of Rs. ${bal.toLocaleString('en-IN')}. Please arrange the payment at your earliest convenience. Thank you!`;
          const whatsappUrl = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;

          return (
            <div key={b.id} style={{ background: "#fff7ed", padding: 16, borderRadius: 16, border: "1px solid #fdba74", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{b.customerName}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#c2410c" }}>{b.eventType} • {evtDateStr}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Balance</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>₹{bal.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#22c55e", color: "#fff", textDecoration: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, transition: "background 0.2s" }}>
                <MessageCircle size={16} /> Send WhatsApp Reminder
              </a>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

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

  const [allBookingsList, setAllBookingsList] = React.useState([]);
  const [allEnquiriesList, setAllEnquiriesList] = React.useState([]);
  const [allExpensesList, setAllExpensesList] = React.useState([]);
  const [selectedPeriod, setSelectedPeriod] = React.useState("this_month");

  const [revData, setRevData] = React.useState([]);
  const [distData, setDistData] = React.useState([]);
  const [todaysEvents, setTodaysEvents] = React.useState([]);
  const [thisWeeksEvents, setThisWeeksEvents] = React.useState([]);
  const [complianceAlerts, setComplianceAlerts] = React.useState(null);
  const [paymentReminders, setPaymentReminders] = React.useState([]);

  React.useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, bookingsRes, enqRes, compRes, settingsRes, expensesRes] = await Promise.all([
        bookingsAPI.getStats(),
        bookingsAPI.getAll({ limit: 1000 }),
        enquiriesAPI.getAll({ limit: 1000 }),
        complianceAPI.getSummary({ hideUpgradeModal: true }).catch(() => null),
        settingsAPI.get().catch(() => null),
        expensesAPI.getAll({ limit: 1000 }).catch(() => ({ data: { data: [] } }))
      ]);

      if (compRes?.data?.data) {
        setComplianceAlerts(compRes.data.data);
      }

      const allBookings = bookingsRes.data?.data || [];
      const allEnquiries = enqRes.data?.data || [];
      const allExpenses = expensesRes.data?.data || [];
      setAllBookingsList(allBookings);
      setAllEnquiriesList(allEnquiries);
      setAllExpensesList(allExpenses);

      const settingsData = settingsRes?.data?.data || {};
      const reminderDays = settingsData.reminderDays || [];
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);
      
      // Compute Payment Reminders based on configured reminder days
      const activeReminders = allBookings.filter(b => {
        if (!b.date || b.status === 'Cancelled' || b.status === 'Enquiry' || b.status === 'Completed' || b.status === 'Closed') return false;
        
        const total = Number(b.totalAmount) || 0;
        const paid = Number(b.advance) || 0;
        const balance = total - paid;
        if (balance <= 0) return false;
        
        const eventDate = new Date(b.date);
        eventDate.setHours(0,0,0,0);
        const todayDate = new Date();
        todayDate.setHours(0,0,0,0);
        
        const diffTime = todayDate - eventDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (reminderDays.length === 0) return false;
        const minDays = Math.min(...reminderDays);
        return diffDays >= minDays;
      });
      setPaymentReminders(activeReminders);

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
        // enquiryCount already includes converted leads (since they are not Lost/Cancelled)
        // If bookings were created without enquiries, ensure we don't go over 100%
        const denominator = Math.max(ts.totalBookings, enquiryCount);
        const healthScore = denominator > 0 
          ? Math.round((ts.totalBookings / denominator) * 100) 
          : 0;
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
        if (b.status === "Confirmed" || b.status === "Completed" || b.status === "Closed") {
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

  const getPeriodMeta = (periodKey) => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    if (periodKey === "this_month") {
      const start = new Date(curYear, curMonth, 1, 0, 0, 0, 0);
      const end = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999);
      const mName = now.toLocaleString("en-US", { month: "short", year: "numeric" });
      const fullMName = now.toLocaleString("en-US", { month: "long", year: "numeric" });
      return {
        key: "this_month",
        start,
        end,
        label: "This Month",
        badge: mName,
        desc: `${fullMName} (1st – ${end.getDate()}th)`
      };
    }

    if (periodKey === "this_fy") {
      const fyStartYear = curMonth >= 3 ? curYear : curYear - 1;
      const fyEndYear = fyStartYear + 1;
      const start = new Date(fyStartYear, 3, 1, 0, 0, 0, 0);
      const end = new Date(fyEndYear, 2, 31, 23, 59, 59, 999);
      const fyShort = `FY ${String(fyStartYear).slice(-2)}-${String(fyEndYear).slice(-2)}`;
      return {
        key: "this_fy",
        start,
        end,
        label: "This FY",
        badge: fyShort,
        desc: `Financial Year ${fyStartYear}–${fyEndYear} (Apr 1 – Mar 31)`
      };
    }

    if (periodKey === "last_30_days") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      const end = new Date(curYear, curMonth, now.getDate(), 23, 59, 59, 999);
      return {
        key: "last_30_days",
        start,
        end,
        label: "Last 30D",
        badge: "Past 30D",
        desc: "Rolling past 30 days of venue activity"
      };
    }

    // Default: All Time
    return {
      key: "all_time",
      start: null,
      end: null,
      label: "All Time",
      badge: "Lifetime",
      desc: "All-time cumulative business totals"
    };
  };

  const periodInfo = getPeriodMeta(selectedPeriod);

  const formatStatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num === 0) return "₹0";
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}k`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Compute active stats dynamically based on selectedPeriod
  const currentStats = React.useMemo(() => {
    // Total expenses across all recorded expenses
    const allTimeExpenses = allExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    if (selectedPeriod === "all_time") {
      return {
        ...stats,
        totalRevenue: stats.totalRevenue || 0,
        totalBookings: stats.totalBookings || 0,
        enquiryCount: stats.enquiryCount || 0,
        pendingAmount: stats.pendingAmount || 0,
        totalExpenses: allTimeExpenses,
        healthScore: stats.healthScore || 91
      };
    }

    const { start, end } = periodInfo;
    if (!start || !end) return { ...stats, totalExpenses: allTimeExpenses };

    const pBookings = allBookingsList.filter(b => {
      const dStr = b.date || b.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= start && d <= end;
    });

    const confirmedPBookings = pBookings.filter(b => 
      b.status === "Confirmed" || b.status === "Completed" || b.status === "Closed"
    );

    const pRevenue = confirmedPBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const pEnquiries = allEnquiriesList.filter(e => {
      const dStr = e.createdAt || e.date || e.tentativeDate;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= start && d <= end;
    });

    const pPending = pBookings.reduce((sum, b) => {
      if (b.status === "Cancelled" || b.status === "Enquiry") return sum;
      const total = Number(b.totalAmount) || 0;
      const paid = Number(b.advance) || 0;
      if (total > paid) return sum + (total - paid);
      return sum;
    }, 0);

    // Filter expenses in period
    const pExpenses = allExpensesList.filter(e => {
      const dStr = e.date || e.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= start && d <= end;
    });
    const pExpensesTotal = pExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const denom = Math.max(confirmedPBookings.length, pEnquiries.length);
    const pHealthScore = denom > 0
      ? Math.min(100, Math.round((confirmedPBookings.length / denom) * 100))
      : (stats.healthScore || 91);

    return {
      totalRevenue: pRevenue,
      totalBookings: confirmedPBookings.length,
      enquiryCount: pEnquiries.length,
      pendingAmount: pPending,
      totalExpenses: pExpensesTotal,
      healthScore: pHealthScore || 91
    };
  }, [selectedPeriod, allBookingsList, allEnquiriesList, allExpensesList, stats, periodInfo]);

  const periodTabs = [
    { key: "this_month", label: "This Month" },
    { key: "this_fy", label: "This FY" },
    { key: "last_30_days", label: "Last 30D" },
    { key: "all_time", label: "All Time" },
  ];

  const { user } = useRole();

  return (
    <>
      {/* ── DESKTOP GREETING & HEADER (Pristine desktop view, preserves Image 2) ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="hidden md:flex hm-dash-greeting" 
        style={{ background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.02)", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "24px 32px", borderRadius: "24px", marginBottom: "24px" }}
      >
        <div>
          <h1 className="hm-dash-title" style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
            Hi, {user?.name?.split(' ')[0] || "User"} 👋
          </h1>
          <p style={{ margin: "0 0 16px", fontSize: 15, color: "#64748b", fontWeight: 500 }}>
            Here's what's happening with your business today.
          </p>

          {/* Desktop Period Filter Tabs */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f1f5f9", padding: "4px", borderRadius: "14px" }}>
            {periodTabs.map((tab) => {
              const active = selectedPeriod === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedPeriod(tab.key)}
                  style={{
                    padding: "6px 14px",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    background: active ? BRAND.primary : "transparent",
                    color: active ? "#fff" : "#64748b",
                    boxShadow: active ? "0 2px 8px rgba(27,67,50,0.2)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
            <span style={{ fontSize: 11, color: "#94a3b8", padding: "0 8px", fontWeight: 600 }}>
              • {periodInfo.desc}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24, background: "#f8fafc", padding: "12px 24px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Health Score</div>
            <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <TrendingUp size={14}/> Conversion Rate
            </div>
          </div>
          <div style={{ position: "relative", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="60" height="60" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <motion.circle cx="50" cy="50" r="40" fill="none" stroke={BRAND.success} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (currentStats.healthScore || 100)/100)} />
            </svg>
            <div style={{ position: "absolute", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{currentStats.healthScore || 100}%</div>
          </div>
        </div>
      </motion.div>

      {/* ── MOBILE GREETING & PERIOD SELECTOR (Creative, compact, high-value) ── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="block md:hidden"
        style={{ background: "#fff", padding: "16px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "16px", border: "1px solid #f1f5f9" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <h1 style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
              Hi, {user?.name?.split(' ')[0] || "User"} 👋
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
              Venue Executive Dashboard
            </p>
          </div>
          {/* Compact Mobile Health Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "4px 10px", borderRadius: "12px" }}>
            <TrendingUp size={12} color="#059669" />
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#065f46" }}>
              {currentStats.healthScore || 100}% Health
            </span>
          </div>
        </div>

        {/* Mobile Segmented Period Switcher */}
        <div style={{ background: "#f8fafc", padding: "4px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
            {periodTabs.map((tab) => {
              const active = selectedPeriod === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedPeriod(tab.key)}
                  style={{
                    padding: "7px 2px",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: active ? "800" : "600",
                    background: active ? BRAND.primary : "transparent",
                    color: active ? "#fff" : "#64748b",
                    boxShadow: active ? "0 2px 8px rgba(27,67,50,0.25)" : "none",
                    cursor: "pointer",
                    textAlign: "center",
                    whiteSpace: "nowrap"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "8px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
          <Info size={12} color={BRAND.primary} />
          <span>Showing: {periodInfo.desc}</span>
        </div>
      </motion.div>

      {/* ── DESKTOP KPI ROW (5 Columns — Exact replica of Image 2, never touched!) ── */}
      <div className="hidden md:grid hm-dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <GradientCard title="Total Revenue" value={formatStatCurrency(currentStats.totalRevenue)} subtext={periodInfo.badge} gradient={["#1B4332", "#2D6A4F"]} delay={0.1} />
        <GradientCard title="Total Bookings" value={currentStats.totalBookings} subtext={periodInfo.badge} gradient={["#2D6A4F", "#40916C"]} delay={0.2} />
        <GradientCard title="Enquiries" value={currentStats.enquiryCount} subtext={periodInfo.badge} gradient={["#52B788", "#74C69D"]} delay={0.3} />
        <GradientCard title="Balance Amount" value={formatStatCurrency(currentStats.pendingAmount)} subtext={periodInfo.badge} gradient={["#d97706", "#f59e0b"]} delay={0.4} />
        <GradientCard title="Total Expenses" value={formatStatCurrency(currentStats.totalExpenses)} subtext={periodInfo.badge} gradient={["#9f1239", "#e11d48"]} delay={0.5} />
      </div>

      {/* ── MOBILE KPI LAYOUT (Creative, compact, high-converting mobile UI) ── */}
      <div className="block md:hidden" style={{ marginBottom: "20px" }}>
        {/* Mobile Hero Card: Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #0D2418 0%, #1B4332 55%, #2D6A4F 100%)",
            borderRadius: "20px",
            padding: "18px 20px",
            color: "#fff",
            boxShadow: "0 10px 30px rgba(13, 36, 24, 0.2)",
            marginBottom: "12px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Soft ambient light accent */}
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(116, 198, 157, 0.25)", borderRadius: "50%", filter: "blur(25px)", pointerEvents: "none" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={14} color="#74C69D" />
              </div>
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.9)" }}>
                Total Revenue
              </span>
            </div>
            <span style={{ fontSize: "10px", fontWeight: "800", background: "rgba(255, 255, 255, 0.2)", padding: "2px 8px", borderRadius: "10px", color: "#bbf7d0", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
              {periodInfo.badge}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
            <div style={{ fontSize: "30px", fontWeight: "800", letterSpacing: "-0.5px", color: "#fff" }}>
              {formatStatCurrency(currentStats.totalRevenue)}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", fontWeight: "600" }}>
              {currentStats.totalRevenue ? `(₹${Number(currentStats.totalRevenue).toLocaleString('en-IN')})` : ""}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.12)", fontSize: "11px", color: "rgba(255, 255, 255, 0.8)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle2 size={12} color="#4ade80" /> Confirmed Venue Bookings
            </span>
            <span style={{ fontWeight: "700", color: "#bbf7d0" }}>
              {currentStats.totalBookings} Event{currentStats.totalBookings !== 1 ? "s" : ""}
            </span>
          </div>
        </motion.div>

        {/* Mobile 2x2 Balanced Operating Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {/* Card 1: Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
              borderRadius: "16px",
              padding: "14px 14px",
              color: "#fff",
              boxShadow: "0 6px 18px rgba(27, 67, 50, 0.12)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255, 255, 255, 0.85)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bookings</span>
              <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={12} color="#bbf7d0" />
              </div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#fff", marginBottom: "1px" }}>
              {currentStats.totalBookings}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.7)", fontWeight: "600" }}>
              Confirmed Events
            </div>
          </motion.div>

          {/* Card 2: Enquiries */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "linear-gradient(135deg, #2D6A4F, #40916C)",
              borderRadius: "16px",
              padding: "14px 14px",
              color: "#fff",
              boxShadow: "0 6px 18px rgba(45, 106, 79, 0.12)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255, 255, 255, 0.85)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Enquiries</span>
              <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={12} color="#bbf7d0" />
              </div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#fff", marginBottom: "1px" }}>
              {currentStats.enquiryCount}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.7)", fontWeight: "600" }}>
              Active Pipeline Leads
            </div>
          </motion.div>

          {/* Card 3: Balance Amount */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              background: "linear-gradient(135deg, #b45309, #d97706)",
              borderRadius: "16px",
              padding: "14px 14px",
              color: "#fff",
              boxShadow: "0 6px 18px rgba(217, 119, 6, 0.14)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255, 255, 255, 0.85)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Balance Amount</span>
              <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={12} color="#fde68a" />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#fff", marginBottom: "1px" }}>
              {formatStatCurrency(currentStats.pendingAmount)}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.75)", fontWeight: "600" }}>
              Pending Collection
            </div>
          </motion.div>

          {/* Card 4: Total Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: "linear-gradient(135deg, #9f1239, #e11d48)",
              borderRadius: "16px",
              padding: "14px 14px",
              color: "#fff",
              boxShadow: "0 6px 18px rgba(225, 29, 72, 0.15)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255, 255, 255, 0.85)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Expenses</span>
              <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Receipt size={12} color="#fecdd3" />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#fff", marginBottom: "1px" }}>
              {formatStatCurrency(currentStats.totalExpenses)}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.75)", fontWeight: "600" }}>
              Recorded Spend
            </div>
          </motion.div>
        </div>
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

      {/* Row 3: Payment Reminders */}
      <PaymentRemindersSection reminders={paymentReminders} />

      {/* Row 4: Compliance & Document Alerts (Show only if there are urgent items or expired items) */}
      {complianceAlerts && (complianceAlerts.urgentItems?.length > 0) && (
        <div className="hm-card" style={{ borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.02)", marginBottom: 24, border: "1px solid #fecaca", background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#991b1b", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={20} color="#ef4444" /> Compliance Action Required
            </h3>
            <button onClick={() => navigate("/compliance")} style={{ background: "#fef2f2", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
              View All Documents
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {complianceAlerts.urgentItems.map(item => (
              <div key={item.id} style={{ background: item.status === "EXPIRED" ? "#fef2f2" : "#fffbeb", padding: 16, borderRadius: 16, border: `1px solid ${item.status === "EXPIRED" ? "#fecaca" : "#fde68a"}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: item.status === "EXPIRED" ? "#ef4444" : "#d97706", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  {item.documentType}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{item.documentName}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.status === "EXPIRED" ? "#b91c1c" : "#b45309" }}>
                  {item.statusMessage}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
  const [paymentReminders, setPaymentReminders] = React.useState([]);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsRes, enquiriesRes, settingsRes] = await Promise.all([
        bookingsAPI.getAll({ limit: 1000 }),
        enquiriesAPI.getAll({ limit: 1000 }),
        settingsAPI.get().catch(() => null)
      ]);
      const allBookings = bookingsRes.data?.data || [];
      const allEnquiries = enquiriesRes.data?.data || [];
      const settingsData = settingsRes?.data?.data || {};
      const reminderDays = settingsData.reminderDays || [];

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
      
      const activeReminders = filteredBookings.filter(b => {
        if (!b.date || b.status === 'Cancelled' || b.status === 'Enquiry' || b.status === 'Completed' || b.status === 'Closed') return false;
        
        const total = Number(b.totalAmount) || 0;
        const paid = Number(b.advance) || 0;
        const balance = total - paid;
        if (balance <= 0) return false;
        
        const eventDate = new Date(b.date);
        eventDate.setHours(0,0,0,0);
        const todayDate = new Date();
        todayDate.setHours(0,0,0,0);
        
        const diffTime = todayDate - eventDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (reminderDays.length === 0) return false;
        const minDays = Math.min(...reminderDays);
        return diffDays >= minDays;
      });
      setPaymentReminders(activeReminders);

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

      <PaymentRemindersSection reminders={paymentReminders} />

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
