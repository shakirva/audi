import React from "react";
import { CreditCard, Calendar, CheckCircle2 } from "lucide-react";

export default function Subscriptions() {
  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, fontFamily: "'Playfair Display', serif" }}>Subscriptions</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 14 }}>Manage active SaaS plans and billing</p>
        </div>
      </div>
      
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 32, textAlign: "center", marginTop: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CreditCard size={32} color="#16a34a" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Subscription Management Coming Soon</h3>
        <p style={{ color: "#6b7280", maxWidth: 400, margin: "0 auto", fontSize: 14, lineHeight: 1.6 }}>
          Automated billing and plan management is currently being configured. 
          For now, please manage tenant billing limits manually via the Tenant Manager.
        </p>
      </div>
    </div>
  );
}
