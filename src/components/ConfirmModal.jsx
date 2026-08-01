import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Trash2, CheckCircle2 } from "lucide-react";

export default function ConfirmModal({ open, title, message, onConfirm, onClose, confirmText = "Confirm", isDanger = true }) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "absolute", inset: 0 }} />
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{ width: "95%", maxWidth: 420, background: "#fff", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,0.2)", position: "relative", zIndex: 1, overflow: "hidden" }}>
            
            <div style={{ background: isDanger ? "linear-gradient(135deg,#fef2f2,#fff1f2)" : "linear-gradient(135deg,#f0fdf4,#f8fafc)", borderBottom: `1px solid ${isDanger ? "#fecaca" : "#e2e8f0"}`, padding: "24px 28px", borderRadius: "20px 20px 0 0", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: isDanger ? "#fee2e2" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={22} color={isDanger ? "#dc2626" : "#16a34a"} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: isDanger ? "#991b1b" : "#1e293b" }}>{title || "Confirm Action"}</h3>
                <p style={{ margin: 0, fontSize: 14, color: isDanger ? "#7f1d1d" : "#475569", lineHeight: 1.5 }}>{message}</p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: isDanger ? "#991b1b" : "#64748b", padding: 4 }}><X size={20} /></button>
            </div>

            <div style={{ padding: "24px 28px", display: "flex", gap: 12 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#374151", cursor: "pointer", transition: "all 0.15s" }}>
                Cancel
              </button>
              <button onClick={onConfirm} style={{ flex: 1, padding: "12px", background: isDanger ? "#dc2626" : "#1B4332", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {isDanger ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}
                {confirmText}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
