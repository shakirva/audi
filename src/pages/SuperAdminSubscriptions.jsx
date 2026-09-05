import React, { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import { Building, Activity, Shield, ArrowRight, ExternalLink, X, Settings2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "../components/Toast";

export default function SuperAdminSubscriptions() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const [manageTenant, setManageTenant] = useState(null);
  const [editForm, setEditForm] = useState({
    plan: "starter",
    billingPeriodMonths: 1,
    status: "active",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data } = await adminAPI.getTenants();
      setTenants(data);
    } catch (error) {
      addToast("Failed to fetch tenant subscriptions", "error");
    } finally {
      setLoading(false);
    }
  };

  const getMetrics = () => {
    const metrics = {
      total: tenants.length,
      active: tenants.filter(t => t.status === "active").length,
      suspended: tenants.filter(t => t.status !== "active").length,
      plans: { trial: 0, starter: 0, professional: 0, business: 0, lifetime: 0 }
    };
    
    tenants.forEach(t => {
      const sub = t.Subscriptions?.[0] || {};
      const planKey = (sub.plan || "trial").toLowerCase();
      if (metrics.plans[planKey] !== undefined) metrics.plans[planKey]++;
    });
    return metrics;
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading SaaS subscriptions...</div>;

  const metrics = getMetrics();

  const getPlanBadgeStyle = (plan) => {
    switch ((plan || "").toLowerCase()) {
      case "starter": return { bg: "#e0f2fe", color: "#0284c7" };
      case "professional": return { bg: "#ede9fe", color: "#7c3aed" };
      case "business": return { bg: "#ffedd5", color: "#ea580c" };
      case "lifetime": return { bg: "#fef3c7", color: "#d97706" };
      case "trial": default: return { bg: "#f3f4f6", color: "#4b5563" };
    }
  };

  const formatPeriod = (periodMonths, plan) => {
    if (plan === "lifetime") return "Lifetime";
    if (periodMonths === null || periodMonths === undefined) return "—";
    const m = parseInt(periodMonths, 10);
    if (isNaN(m)) return "—";
    if (m === 1) return "1 month";
    return `${m} months`;
  };

  const calculateEndDate = (startDate, periodMonths, plan) => {
    if (!startDate || plan === "lifetime" || periodMonths === null || periodMonths === undefined || periodMonths === "") return "";
    const m = parseInt(periodMonths, 10);
    if (isNaN(m) || m <= 0) return "";
    
    const date = new Date(startDate);
    if (isNaN(date.getTime())) return "";
    
    date.setMonth(date.getMonth() + m);
    return date.toISOString().split("T")[0];
  };

  const handlePeriodChange = (e) => {
    const val = e.target.value;
    const period = val === "" ? "" : parseInt(val, 10);
    const newEnd = calculateEndDate(editForm.subscriptionStartDate, period, editForm.plan);
    setEditForm({ ...editForm, billingPeriodMonths: period, subscriptionEndDate: newEnd });
  };

  const handleStartDateChange = (e) => {
    const start = e.target.value;
    const newEnd = calculateEndDate(start, editForm.billingPeriodMonths, editForm.plan);
    setEditForm({ ...editForm, subscriptionStartDate: start, subscriptionEndDate: newEnd });
  };

  const openManageModal = (tenant) => {
    const sub = tenant.Subscriptions?.[0] || {};
    
    let resolvedMonths = sub.billingPeriodMonths;
    if (resolvedMonths === undefined && sub.billingPeriod) {
      if (sub.billingPeriod === "monthly" || sub.billingPeriod === "1_month") resolvedMonths = 1;
      else if (sub.billingPeriod === "3_months") resolvedMonths = 3;
      else if (sub.billingPeriod === "6_months") resolvedMonths = 6;
      else if (sub.billingPeriod === "annual" || sub.billingPeriod === "12_months") resolvedMonths = 12;
      else if (sub.billingPeriod === "lifetime") resolvedMonths = null;
    }

    setManageTenant(tenant);
    setEditForm({
      plan: sub.plan || "trial",
      billingPeriodMonths: resolvedMonths || 1,
      status: sub.status || "active",
      subscriptionStartDate: sub.subscriptionStartDate || new Date().toISOString().split("T")[0],
      subscriptionEndDate: sub.subscriptionEndDate || "",
      notes: sub.notes || ""
    });
  };

  const saveSubscription = async (e) => {
    e.preventDefault();
    if (manageTenant.slug === 'ktconvention' || manageTenant.slug === 'laurel-garden') {
      addToast("Cannot modify lifetime foundation customer subscriptions.", "error");
      return;
    }

    if (editForm.plan !== "lifetime") {
      const m = parseInt(editForm.billingPeriodMonths, 10);
      if (isNaN(m) || m <= 0 || m > 120) {
        addToast("Billing period must be a valid whole number of months (1-120).", "error");
        return;
      }
    }

    setSaving(true);
    try {
      await adminAPI.updateSubscription(manageTenant.id, editForm);
      addToast("Subscription updated successfully", "success");
      setManageTenant(null);
      fetchTenants();
    } catch (err) {
      addToast("Failed to update subscription", "error");
    } finally {
      setSaving(false);
    }
  };

  const isDowngrade = () => {
    const planHierarchy = { trial: 0, starter: 1, professional: 2, business: 3, lifetime: 4 };
    const currentSub = manageTenant?.Subscriptions?.[0]?.plan || "trial";
    const currentLevel = planHierarchy[currentSub] || 0;
    const newLevel = planHierarchy[editForm.plan] || 0;
    return newLevel < currentLevel;
  };

  const isProtectedCustomer = (slug) => {
    return slug === 'ktconvention' || slug === 'laurel-garden' || slug === 'kerala-cc';
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>SaaS Subscriptions</h1>
          <p style={{ color: "#6b7280", margin: 0, fontSize: 15 }}>Manage billing, plans, and active subscriptions.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, background: "#f3f4f6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563" }}><Building size={24} /></div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Total Tenants</div><div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{metrics.total}</div></div>
        </div>
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, background: "#dcfce7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}><Activity size={24} /></div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Active</div><div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{metrics.active}</div></div>
        </div>
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, background: "#fef2f2", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}><Shield size={24} /></div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Suspended</div><div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{metrics.suspended}</div></div>
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Plan Distribution</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
        {Object.entries(metrics.plans).map(([plan, count]) => {
          const style = getPlanBadgeStyle(plan);
          return (
            <div key={plan} style={{ background: "#fff", padding: "16px", borderRadius: 12, border: "1px solid #e5e7eb", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 8 }}>{plan}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: style.color }}>{count}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Tenant</th>
              <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Plan</th>
              <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Term</th>
              <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Dates</th>
              <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "16px 24px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => {
              const sub = tenant.Subscriptions?.[0] || {};
              const planStyle = getPlanBadgeStyle(sub.plan);
              
              return (
                <tr key={tenant.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{tenant.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{tenant.ownerName} &middot; {tenant.slug}</div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ background: planStyle.bg, color: planStyle.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                      {sub.plan || "Trial"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#374151", fontWeight: 600 }}>
                    {formatPeriod(sub.billingPeriodMonths, sub.plan)}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {sub.subscriptionStartDate ? (
                      <div style={{ fontSize: 13, color: "#374151" }}>
                        {sub.subscriptionStartDate} &rarr; {sub.subscriptionEndDate || "No End"}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: "#6b7280" }}>Created: {new Date(tenant.createdAt).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: tenant.status === "active" ? "#16a34a" : "#dc2626" }}>
                      {tenant.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <button 
                      onClick={() => openManageModal(tenant)}
                      style={{ border: "1px solid #e5e7eb", background: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Settings2 size={14} /> Manage Plan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {manageTenant && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", width: 600, borderRadius: 16, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Manage Subscription</h2>
                <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>{manageTenant.name}</p>
              </div>
              <button onClick={() => setManageTenant(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
            </div>
            
            <form onSubmit={saveSubscription}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Plan Tier</label>
                  <select 
                    value={editForm.plan} 
                    onChange={e => setEditForm({...editForm, plan: e.target.value})} 
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#fff" }}
                    disabled={manageTenant.slug === 'ktconvention' || manageTenant.slug === 'laurel-garden'}
                  >
                    <option value="trial">Trial</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="business">Business</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Billing Period (Months)</label>
                  <input 
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    value={editForm.billingPeriodMonths} 
                    onChange={handlePeriodChange} 
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#fff", boxSizing: "border-box" }}
                    disabled={editForm.plan === "lifetime"}
                    placeholder="e.g. 1, 6, 12, 24"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Subscription Start</label>
                  <input 
                    type="date" 
                    value={editForm.subscriptionStartDate} 
                    onChange={handleStartDateChange} 
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Subscription End</label>
                  <input 
                    type="date" 
                    value={editForm.subscriptionEndDate} 
                    onChange={e => setEditForm({...editForm, subscriptionEndDate: e.target.value})} 
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Internal Billing Notes</label>
                <textarea 
                  value={editForm.notes} 
                  onChange={e => setEditForm({...editForm, notes: e.target.value})} 
                  placeholder="e.g. Upgraded after manual payment received."
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, minHeight: 60, boxSizing: "border-box", fontFamily: "inherit" }} 
                />
              </div>

              {isDowngrade() && (
                <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: 16, marginBottom: 20, display: "flex", gap: 12 }}>
                  <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#92400e" }}>Downgrade Warning</h4>
                    <p style={{ margin: 0, fontSize: 13, color: "#b45309", lineHeight: 1.4 }}>
                      You are downgrading this tenant. Existing data (halls, users, bookings) will <strong>not</strong> be deleted, but they will need to reduce usage to meet the lower limits before creating new records.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={() => setManageTenant(null)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151" }}>Cancel</button>
                <button type="submit" disabled={saving || manageTenant.slug === 'ktconvention' || manageTenant.slug === 'laurel-garden'} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#0D2418", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : "Apply Plan Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
