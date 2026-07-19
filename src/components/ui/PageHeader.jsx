import React from "react";
import { motion } from "framer-motion";

export default function PageHeader({ title, subtitle, primaryAction, secondaryAction, icon: Icon, color = "#0f172a" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          {Icon && (
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} />
            </div>
          )}
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-1px" }}>{title}</h1>
        </div>
        {subtitle && <p style={{ margin: 0, fontSize: 16, color: "#64748b", fontWeight: 500 }}>{subtitle}</p>}
      </motion.div>

      {(primaryAction || secondaryAction) && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", gap: 12 }}>
          {secondaryAction && (
            <button onClick={secondaryAction.onClick} style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, color: "#475569", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", transition: "all 0.2s" }}>
              {secondaryAction.icon && <secondaryAction.icon size={18} />}
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button onClick={primaryAction.onClick} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: color, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, color: "#fff", boxShadow: `0 8px 20px ${color}40`, transition: "all 0.2s" }}>
              {primaryAction.icon && <primaryAction.icon size={18} />}
              {primaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
