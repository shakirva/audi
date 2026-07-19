import React from "react";
import { motion } from "framer-motion";

export default function MetricCard({ title, value, icon: Icon, color = "#0ea5e9", delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
      style={{ 
        background: "#fff", 
        padding: 24, 
        borderRadius: 24, 
        display: "flex", 
        flexDirection: "column",
        boxShadow: "0 10px 30px rgba(0,0,0,0.02)", 
        border: "1px solid #f1f5f9"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={24} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
    </motion.div>
  );
}
