import React from "react";
import { CheckCircle2, Circle, CheckCircle, Clock } from "lucide-react";

const phases = [
  { phase: "Phase 1: Backend Foundation", status: "Completed", icon: CheckCircle2, color: "#22c55e" },
  { phase: "Phase 2: Masters & Customers", status: "Completed", icon: CheckCircle2, color: "#22c55e" },
  { phase: "Phase 3: CRM (Enquiries & Followups)", status: "Completed", icon: CheckCircle2, color: "#22c55e" },
  { phase: "Phase 4: Agreement & Receipt Engine", status: "Completed", icon: CheckCircle2, color: "#22c55e" },
  { phase: "Phase 5: Job Management", status: "Completed", icon: CheckCircle2, color: "#22c55e" },
  { phase: "Phase 6: Accounts Lite", status: "In Progress (90%)", icon: Clock, color: "#eab308" },
  { phase: "Phase 7: Vendor Management", status: "Next Up", icon: Circle, color: "#94a3b8" },
  { phase: "Phase 8: Purchase Management", status: "Planned", icon: Circle, color: "#94a3b8" },
  { phase: "Phase 9: Staff & Payroll", status: "Planned", icon: Circle, color: "#94a3b8" },
  { phase: "Phase 10: Reports & Analytics", status: "Planned", icon: Circle, color: "#94a3b8" },
  { phase: "Phase 11: Customer Portal & Mobile App", status: "Planned", icon: Circle, color: "#94a3b8" },
  { phase: "Phase 12: WhatsApp Automation", status: "Planned", icon: Circle, color: "#94a3b8" },
];

export default function Roadmap() {
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>🚀 Venueza Premium ERP Roadmap</h1>
        <p style={{ color: "#666", margin: 0, fontSize: 16 }}>Follow our journey to becoming the ultimate Auditorium Management ecosystem.</p>
      </div>

      <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: "1px solid #eaeaea", boxShadow: "0 8px 32px rgba(0,0,0,0.03)" }}>
        <div style={{ position: "relative", paddingLeft: 24, borderLeft: "2px dashed #e2e8f0", display: "flex", flexDirection: "column", gap: 32 }}>
          {phases.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ 
                  position: "absolute", left: -36, top: -2, width: 24, height: 24, 
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" 
                }}>
                  <Icon size={24} color={item.color} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: item.status === "Planned" ? "#64748b" : "#1e293b" }}>{item.phase}</h3>
                  <span style={{ 
                    display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 700,
                    padding: "4px 10px", borderRadius: 20, 
                    background: item.status === "Completed" ? "#dcfce7" : item.status === "In Progress (90%)" ? "#fef08a" : "#f1f5f9",
                    color: item.status === "Completed" ? "#166534" : item.status === "In Progress (90%)" ? "#a16207" : "#475569",
                  }}>
                    {item.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
