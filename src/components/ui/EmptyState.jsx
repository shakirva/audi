import React from "react";
import { motion } from "framer-motion";

export default function EmptyState({ icon: Icon, title, message, primaryAction, color = "#0ea5e9" }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      style={{ background: "#fff", borderRadius: 32, padding: 48, border: "1px dashed #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 400, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}
    >
      <motion.div 
        whileHover={{ scale: 1.05, rotate: 5 }}
        style={{ width: 80, height: 80, borderRadius: 24, background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}
      >
        <Icon size={40} />
      </motion.div>
      <h3 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>{title}</h3>
      <p style={{ margin: "0 0 32px", fontSize: 16, color: "#64748b", fontWeight: 500, maxWidth: 400, lineHeight: 1.5 }}>{message}</p>
      
      {primaryAction && (
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} 
          onClick={primaryAction.onClick}
          style={{ padding: "14px 28px", background: color, color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 16, boxShadow: `0 10px 25px ${color}40`, display: "flex", alignItems: "center", gap: 8 }}
        >
          {primaryAction.icon && <primaryAction.icon size={18} />}
          {primaryAction.label}
        </motion.button>
      )}
    </motion.div>
  );
}
