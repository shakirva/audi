import React from "react";

export default function StatusBadge({ status, styleMap }) {
  const config = styleMap[status] || { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" };
  
  return (
    <span style={{ 
      background: config.bg, 
      color: config.text, 
      fontSize: 11, 
      fontWeight: 800, 
      padding: "4px 10px", 
      borderRadius: 12, 
      display: "inline-flex", 
      alignItems: "center", 
      gap: 6,
      letterSpacing: 0.5,
      textTransform: "uppercase"
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.dot }} /> 
      {status}
    </span>
  );
}
