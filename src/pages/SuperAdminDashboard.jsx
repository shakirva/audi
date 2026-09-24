import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building, Activity, Shield, Users, CreditCard, TrendingUp, AlertTriangle, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { adminAPI } from "../services/api";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const BRAND = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  accent: "#D4A017",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#0ea5e9",
  danger: "#ef4444"
};

const PLAN_PRICES = {
  trial: 0,
  starter: 999,
  professional: 3999,
  business: 6999,
  lifetime: 0
};

const PLAN_COLORS = {
  trial: { bg: "#f3f4f6", color: "#6b7280", chart: "#9ca3af" },
  starter: { bg: "#dcfce7", color: "#15803d", chart: "#22c55e" },
  professional: { bg: "#ede9fe", color: "#7c3aed", chart: "#8b5cf6" },
  business: { bg: "#ffedd5", color: "#ea580c", chart: "#f97316" },
  lifetime: { bg: "#fef3c7", color: "#d97706", chart: "#eab308" },
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tenantsRes, leadsRes] = await Promise.all([
        adminAPI.getTenants(),
        api.get("/admin/leads").catch(() => ({ data: [] }))
      ]);
      setTenants(tenantsRes.data || []);
      setLeads(leadsRes.data || []);
    } catch (err) {
      console.error("Failed to load SuperAdmin data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          Loading Platform Data...
        </motion.div>
      </div>
    );
  }

  // ── Compute Metrics ──
  const activeTenants = tenants.filter(t => t.status === "active");
  const suspendedTenants = tenants.filter(t => t.status !== "active");
  const newLeads = leads.filter(l => l.status === "New");

  const planDistribution = {};
  tenants.forEach(t => {
    const plan = (t.Subscriptions?.[0]?.plan || "trial").toLowerCase();
    planDistribution[plan] = (planDistribution[plan] || 0) + 1;
  });

  const mrr = tenants.reduce((sum, t) => {
    const sub = t.Subscriptions?.[0];
    if (!sub || t.status !== "active") return sum;
    const plan = (sub.plan || "trial").toLowerCase();
    const price = PLAN_PRICES[plan] || 0;
    const period = parseInt(sub.billingPeriodMonths) || 1;
    // MRR = monthly equivalent
    return sum + (price / (period > 0 ? 1 : 1)); // Already monthly price
  }, 0);

  // Expiring soon (within 30 days)
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoon = tenants.filter(t => {
    const sub = t.Subscriptions?.[0];
    if (!sub?.subscriptionEndDate || sub.plan === "lifetime") return false;
    const endDate = new Date(sub.subscriptionEndDate);
    return endDate <= thirtyDaysLater && endDate >= now;
  });

  // Plan distribution chart data
  const pieData = Object.entries(planDistribution).map(([plan, count]) => ({
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    value: count,
    color: PLAN_COLORS[plan]?.chart || "#9ca3af"
  }));

  const formatCurrency = (val) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(val || 0);

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, #0D2418, #1B4332)",
          borderRadius: 24, padding: "32px 36px", marginBottom: 28,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
        }}
      >
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
            Platform Command Center
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: 0, fontWeight: 500 }}>
            Monitor your SaaS business health, tenants, and revenue.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/tenants")}
            style={{
              padding: "10px 20px", borderRadius: 12, border: "none",
              background: BRAND.accent, color: BRAND.primary, fontWeight: 700,
              fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}
          >
            <Building size={16} /> Manage Tenants
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
        {[
          { title: "Total Tenants", value: tenants.length, icon: Building, gradient: ["#1B4332", "#2D6A4F"], delay: 0.1 },
          { title: "Active Tenants", value: activeTenants.length, icon: Activity, gradient: ["#059669", "#10b981"], delay: 0.15 },
          { title: "Monthly Revenue", value: formatCurrency(mrr), icon: CreditCard, gradient: ["#D4A017", "#f59e0b"], delay: 0.2 },
          { title: "Open Demo Requests", value: newLeads.length, icon: Users, gradient: ["#0ea5e9", "#38bdf8"], delay: 0.25 },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay }}
            style={{
              background: `linear-gradient(135deg, ${card.gradient[0]}, ${card.gradient[1]})`,
              borderRadius: 20, padding: "24px 28px", color: "#fff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.9, textTransform: "uppercase", letterSpacing: 0.5 }}>{card.title}</span>
              <card.icon size={20} opacity={0.7} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Row 2: Plan Distribution + Subscription Alerts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>

        {/* Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb" }}
        >
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Plan Distribution</h3>
          {pieData.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No tenants yet</div>
          )}

          {/* Plan badge row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {Object.entries(planDistribution).map(([plan, count]) => {
              const style = PLAN_COLORS[plan] || PLAN_COLORS.trial;
              return (
                <div key={plan} style={{
                  background: style.bg, color: style.color,
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                  textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6
                }}>
                  {plan}: {count}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Subscription Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Subscription Alerts</h3>
            {expiringSoon.length > 0 && (
              <span style={{ background: "#fef2f2", color: "#ef4444", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                {expiringSoon.length} Expiring
              </span>
            )}
          </div>

          {expiringSoon.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
              <CheckCircle size={32} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>All subscriptions are healthy!</p>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>No tenants expiring in the next 30 days.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {expiringSoon.map(t => {
                const sub = t.Subscriptions?.[0];
                const daysLeft = Math.ceil((new Date(sub.subscriptionEndDate) - now) / (1000 * 60 * 60 * 24));
                return (
                  <div key={t.id} style={{
                    background: daysLeft <= 7 ? "#fef2f2" : "#fffbeb",
                    padding: "14px 16px", borderRadius: 14,
                    border: `1px solid ${daysLeft <= 7 ? "#fecaca" : "#fde68a"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {sub.plan?.toUpperCase()} · Ends {sub.subscriptionEndDate}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 800,
                      color: daysLeft <= 7 ? "#ef4444" : "#d97706",
                      display: "flex", alignItems: "center", gap: 4
                    }}>
                      <AlertTriangle size={14} /> {daysLeft}d left
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Row 3: Recent Leads + Tenant Overview ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Pending Demo Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Recent Demo Requests</h3>
            <button
              onClick={() => navigate("/leads")}
              style={{ background: "none", border: "none", color: BRAND.info, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {leads.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
              No demo requests yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} style={{
                  background: "#f8fafc", padding: "14px 16px", borderRadius: 14, border: "1px solid #e2e8f0",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{lead.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{lead.venueName} · {lead.city}</div>
                  </div>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                    background: lead.status === "New" ? "#eff6ff" : lead.status === "Contacted" ? "#fef3c7" : lead.status === "Approved" ? "#dcfce7" : "#fef2f2",
                    color: lead.status === "New" ? "#1d4ed8" : lead.status === "Contacted" ? "#b45309" : lead.status === "Approved" ? "#15803d" : "#b91c1c",
                  }}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tenant Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Tenant Directory</h3>
            <button
              onClick={() => navigate("/tenants")}
              style={{ background: "none", border: "none", color: BRAND.info, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              Manage <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tenants.slice(0, 5).map(t => {
              const sub = t.Subscriptions?.[0];
              const plan = sub?.plan || "trial";
              const planStyle = PLAN_COLORS[plan] || PLAN_COLORS.trial;
              return (
                <div key={t.id} style={{
                  background: "#f8fafc", padding: "14px 16px", borderRadius: 14, border: "1px solid #e2e8f0",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building size={18} color="#0284c7" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{t.ownerName} · {t.slug}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      background: planStyle.bg, color: planStyle.color,
                      padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase"
                    }}>
                      {plan}
                    </span>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: t.status === "active" ? "#22c55e" : "#ef4444"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
