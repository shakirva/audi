import React, { useState } from "react";
import { Settings, CheckSquare, Users, CreditCard, Tag, Box, DollarSign } from "lucide-react";

const masterCategories = [
  { id: "halls", icon: Box, label: "Hall Management", count: 3 },
  { id: "packages", icon: Tag, label: "Packages", count: 5 },
  { id: "services", icon: CheckSquare, label: "Services", count: 12 },
  { id: "event_types", icon: Settings, label: "Event Types", count: 8 },
  { id: "lead_sources", icon: Users, label: "Lead Sources", count: 6 },
  { id: "payment_modes", icon: CreditCard, label: "Payment Modes", count: 4 },
  { id: "expense_categories", icon: DollarSign, label: "Expense Categories", count: 10 },
];

export default function Masters() {
  const [activeTab, setActiveTab] = useState("halls");

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#0D2418" }}>Master Configuration</h1>
        <p style={{ color: "#666", margin: 0, fontSize: 14 }}>Configure the foundational data for Venueza ERP.</p>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Sidebar Tabs */}
        <div style={{ width: 260, flexShrink: 0 }}>
          {masterCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: isActive ? "#1B4332" : "transparent",
                  color: isActive ? "#fff" : "#444",
                  fontWeight: isActive ? 600 : 500,
                  marginBottom: 4, transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={18} opacity={isActive ? 1 : 0.6} />
                  {cat.label}
                </div>
                <span style={{ 
                  background: isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9", 
                  color: isActive ? "#fff" : "#666",
                  padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 
                }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", padding: 24, minHeight: 400 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#333", textTransform: "capitalize" }}>
              {activeTab.replace("_", " ")} Settings
            </h2>
            <button style={{
              background: "#D4A017", color: "#0D2418", border: "none", borderRadius: 8,
              padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13
            }}>
              Add New
            </button>
          </div>
          
          <div style={{
            padding: 40, textAlign: "center", border: "2px dashed #eaeaea", borderRadius: 12, color: "#999"
          }}>
            <Settings size={40} opacity={0.2} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Select an item to view or edit configuration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
