import React, { useState, useEffect } from "react";
import { CreditCard, Calendar, CheckCircle2, ShieldCheck, Users, Store, ArrowRight, Check, X, AlertTriangle } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { settingsAPI, usersAPI } from "../services/api";

const PLANS_CONFIG = {
  trial: {
    key: "trial",
    name: "14-Day Trial",
    price: "Free",
    billingCycle: "",
    limits: { halls: 3, users: 3 },
    tier: 0
  },
  starter: {
    key: "starter",
    name: "Starter",
    price: "₹999",
    billingCycle: "/ month",
    limits: { halls: 1, users: 3 },
    features: [
      { name: "Core CRM & Operations", included: true },
      { name: "Enquiries & Bookings", included: true },
      { name: "Calendar & Availability", included: true },
      { name: "Accounting & Ledgers", included: false },
      { name: "Staff & HR", included: false },
      { name: "Jobs & Inventory", included: false },
      { name: "API & Data Exports", included: false },
    ],
    tier: 1
  },
  professional: {
    key: "professional",
    name: "Professional",
    price: "₹3,999",
    billingCycle: "/ month",
    limits: { halls: 5, users: 10 },
    features: [
      { name: "Core CRM & Operations", included: true },
      { name: "Enquiries & Bookings", included: true },
      { name: "Calendar & Availability", included: true },
      { name: "Accounting & Ledgers", included: true },
      { name: "Staff & HR", included: true },
      { name: "Jobs & Inventory", included: true },
      { name: "API & Data Exports", included: false },
    ],
    tier: 2
  },
  business: {
    key: "business",
    name: "Business",
    price: "₹6,999",
    billingCycle: "/ month",
    limits: { halls: 99, users: 999 },
    limitsText: { halls: "Unlimited", users: "Unlimited" },
    features: [
      { name: "Core CRM & Operations", included: true },
      { name: "Enquiries & Bookings", included: true },
      { name: "Calendar & Availability", included: true },
      { name: "Accounting & Ledgers", included: true },
      { name: "Staff & HR", included: true },
      { name: "Jobs & Inventory", included: true },
      { name: "API & Data Exports", included: true },
    ],
    tier: 3
  },
  lifetime: {
    key: "lifetime",
    name: "Lifetime / Legacy",
    price: "Custom",
    billingCycle: "",
    limits: { halls: 99, users: 999 },
    limitsText: { halls: "Unlimited", users: "Unlimited" },
    features: [
      { name: "Core CRM & Operations", included: true },
      { name: "Enquiries & Bookings", included: true },
      { name: "Calendar & Availability", included: true },
      { name: "Accounting & Ledgers", included: true },
      { name: "Staff & HR", included: true },
      { name: "Jobs & Inventory", included: true },
      { name: "API & Data Exports", included: true },
    ],
    tier: 99
  }
};

export default function Subscriptions() {
  const { subscription } = useRole();
  const [usage, setUsage] = useState({ halls: 0, users: 0, loading: true });
  const [upgradeFlow, setUpgradeFlow] = useState(null);

  useEffect(() => {
    if (subscription) {
      Promise.all([
        settingsAPI.get().catch(() => ({ data: { data: { halls: [] } } })),
        usersAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]).then(([settingsRes, usersRes]) => {
        const hallsData = settingsRes.data?.data?.halls || [];
        const usersData = usersRes.data?.data || [];
        const activeUsersCount = usersData.filter(u => u.active).length;
        setUsage({
          halls: hallsData.length,
          users: activeUsersCount,
          loading: false
        });
      });
    } else {
      setUsage(prev => ({ ...prev, loading: false }));
    }
  }, [subscription]);

  const currentPlanKey = subscription?.plan || "starter";
  const currentPlanConfig = PLANS_CONFIG[currentPlanKey] || PLANS_CONFIG.starter;
  const planTier = currentPlanConfig.tier;

  const getLimitColor = (used, max) => {
    if (max > 50) return "#16a34a"; // practically unlimited
    const ratio = used / max;
    if (ratio >= 1) return "#dc2626";
    if (ratio >= 0.8) return "#ea580c";
    return "#16a34a";
  };

  const getHallLimitMessage = () => {
    if (currentPlanConfig.limits.halls > 50) return null;
    if (usage.halls >= currentPlanConfig.limits.halls) {
      if (currentPlanKey === "starter") return "You have reached your Hall limit on the Starter plan. Upgrade to Professional for up to 5 halls.";
      if (currentPlanKey === "professional") return "You have reached your Hall limit on the Professional plan. Upgrade to Business for unlimited halls.";
    }
    return null;
  };

  const getUserLimitMessage = () => {
    if (currentPlanConfig.limits.users > 100) return null;
    if (usage.users >= currentPlanConfig.limits.users) {
      if (currentPlanKey === "starter") return "You have reached your User limit on the Starter plan. Upgrade to Professional for up to 10 users.";
      if (currentPlanKey === "professional") return "You have reached your User limit on the Professional plan. Upgrade to Business for unlimited users.";
    }
    return null;
  };

  const hallLimitMsg = getHallLimitMessage();
  const userLimitMsg = getUserLimitMessage();

  if (usage.loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading subscription details...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, fontFamily: "'Playfair Display', serif" }}>Subscription & Billing</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 14 }}>Manage your Venueza SaaS plan and feature access</p>
        </div>
      </div>
      
      {/* CURRENT PLAN CARD */}
      {subscription && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 32, marginBottom: 32, display: "flex", gap: 32, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <ShieldCheck size={24} color="#0D2418" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>Current Plan</h2>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
              {currentPlanConfig.name} <span style={{ fontSize: 18, color: "#6b7280", fontWeight: 600 }}>· {currentPlanConfig.price}{currentPlanConfig.billingCycle}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: subscription.status === 'active' ? "#16a34a" : (subscription.status === 'trialing' ? "#ea580c" : "#dc2626"), fontWeight: 700, fontSize: 14, marginTop: 12 }}>
              <CheckCircle2 size={16} /> {subscription.status.toUpperCase()}
            </div>
            {subscription.trialEndDate && new Date(subscription.trialEndDate) > new Date() && (
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8, fontWeight: 600 }}>
                Trial ends on {new Date(subscription.trialEndDate).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 20, borderLeft: "1px solid #e5e7eb", paddingLeft: 32 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Store size={16} /> Halls Used
                </h3>
                <span style={{ fontSize: 14, fontWeight: 800, color: getLimitColor(usage.halls, currentPlanConfig.limits.halls) }}>
                  {usage.halls} / {currentPlanConfig.limitsText?.halls || currentPlanConfig.limits.halls}
                </span>
              </div>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: getLimitColor(usage.halls, currentPlanConfig.limits.halls), width: `${Math.min(100, (usage.halls / currentPlanConfig.limits.halls) * 100)}%`, transition: "width 0.3s ease" }}></div>
              </div>
              {hallLimitMsg && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, color: "#b91c1c", fontSize: 12, fontWeight: 600, background: "#fef2f2", padding: "6px 10px", borderRadius: 6 }}>
                  <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{hallLimitMsg}</span>
                </div>
              )}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={16} /> Users Active
                </h3>
                <span style={{ fontSize: 14, fontWeight: 800, color: getLimitColor(usage.users, currentPlanConfig.limits.users) }}>
                  {usage.users} / {currentPlanConfig.limitsText?.users || currentPlanConfig.limits.users}
                </span>
              </div>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: getLimitColor(usage.users, currentPlanConfig.limits.users), width: `${Math.min(100, (usage.users / currentPlanConfig.limits.users) * 100)}%`, transition: "width 0.3s ease" }}></div>
              </div>
              {userLimitMsg && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, color: "#b91c1c", fontSize: 12, fontWeight: 600, background: "#fef2f2", padding: "6px 10px", borderRadius: 6 }}>
                  <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{userLimitMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE CONTACT MODAL */}
      {upgradeFlow && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 450, maxWidth: "90%", padding: 32, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>Upgrade to {upgradeFlow.name}</h2>
            <p style={{ color: "#4b5563", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              The {upgradeFlow.name} plan unlocks up to <strong>{upgradeFlow.limitsText?.halls || upgradeFlow.limits.halls} halls</strong> and <strong>{upgradeFlow.limitsText?.users || upgradeFlow.limits.users} users</strong>, along with premium features designed to scale your venue business.
            </p>
            <div style={{ background: "#f3f4f6", padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Please contact support to complete your upgrade.</p>
              <p style={{ fontSize: 14, color: "#4b5563", margin: 0 }}>Our team will adjust your billing and instantly unlock your new features.</p>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setUpgradeFlow(null)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <a href="mailto:support@venueza.cloud?subject=Plan Upgrade Request" style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0D2418", color: "#fff", fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>Contact Support</a>
            </div>
          </div>
        </div>
      )}

      {/* PLAN COMPARISON */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <CreditCard size={20} /> Available Plans
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {["starter", "professional", "business"].map(planKey => {
            const pConfig = PLANS_CONFIG[planKey];
            const isCurrent = currentPlanKey === planKey || (currentPlanKey === 'lifetime' && planKey === 'business');
            const isLower = pConfig.tier < planTier;
            const isHigher = pConfig.tier > planTier;
            
            return (
              <div key={planKey} style={{ background: "#fff", borderRadius: 16, border: isCurrent ? "2px solid #0D2418" : "1px solid #e5e7eb", padding: 24, display: "flex", flexDirection: "column", position: "relative" }}>
                {isCurrent && (
                  <div style={{ position: "absolute", top: -12, left: 24, background: "#0D2418", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 }}>
                    Current Plan
                  </div>
                )}
                
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "12px 0 8px" }}>{pConfig.name}</h3>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 24 }}>
                  {pConfig.price} <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>{pConfig.billingCycle}</span>
                </div>
                
                <div style={{ background: "#f9fafb", padding: 16, borderRadius: 12, marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: "#4b5563", fontWeight: 600 }}>Halls Included:</span>
                    <span style={{ color: "#111827", fontWeight: 800 }}>{pConfig.limitsText?.halls || pConfig.limits.halls}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#4b5563", fontWeight: 600 }}>Users Included:</span>
                    <span style={{ color: "#111827", fontWeight: 800 }}>{pConfig.limitsText?.users || pConfig.limits.users}</span>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  {pConfig.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12, fontSize: 14, color: f.included ? "#374151" : "#9ca3af", fontWeight: f.included ? 600 : 400 }}>
                      {f.included ? <Check size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} /> : <X size={18} color="#d1d5db" style={{ flexShrink: 0, marginTop: 2 }} />}
                      <span>{f.name}</span>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: 24 }}>
                  {isCurrent ? (
                    <button disabled style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f3f4f6", color: "#6b7280", fontWeight: 700, cursor: "not-allowed" }}>Active Plan</button>
                  ) : isHigher ? (
                    <button onClick={() => setUpgradeFlow(pConfig)} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#0D2418", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      Upgrade to {pConfig.name} <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#9ca3af", fontWeight: 700, cursor: "not-allowed" }}>Contact support to downgrade</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
