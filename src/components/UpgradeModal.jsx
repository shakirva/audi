import React, { useState, useEffect } from "react";
import { Lock, ArrowRight, X } from "lucide-react";

export default function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const handleUpgradeRequired = (e) => {
      setDetail(e.detail);
      setOpen(true);
    };

    window.addEventListener("plan-upgrade-required", handleUpgradeRequired);
    return () => window.removeEventListener("plan-upgrade-required", handleUpgradeRequired);
  }, []);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 450, borderRadius: 16, overflow: "hidden", position: "relative", animation: "slideUp 0.3s ease-out" }}>
        
        <div style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={32} color="#fff" />
          </div>
        </div>
        
        <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={18} />
        </button>

        <div style={{ padding: "32px 24px" }}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 22, color: "#111", textAlign: "center" }}>Upgrade Required</h2>
          
          <p style={{ margin: "0 0 24px 0", fontSize: 15, color: "#4b5563", textAlign: "center", lineHeight: 1.5 }}>
            {detail?.message || "This feature requires a higher plan to access. Upgrade your workspace to unlock advanced tools and scale your operations."}
          </p>
          
          <div style={{ display: "flex", gap: 12 }}>
            <button 
              onClick={() => setOpen(false)}
              style={{ flex: 1, padding: "12px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer" }}
            >
              Maybe Later
            </button>
            <button 
              onClick={() => {
                setOpen(false);
                window.location.href = "/settings?tab=Billing";
              }}
              style={{ flex: 1, padding: "12px", background: "#d97706", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              View Plans <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
