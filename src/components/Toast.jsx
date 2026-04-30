import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_CONFIG = {
  success: {
    bg: "linear-gradient(135deg, #1B4332, #2D6A4F)",
    border: "rgba(34,197,94,0.3)",
    icon: CheckCircle,
    iconColor: "#86efac",
    barColor: "#22c55e",
  },
  error: {
    bg: "linear-gradient(135deg, #7f1d1d, #991b1b)",
    border: "rgba(239,68,68,0.3)",
    icon: XCircle,
    iconColor: "#fca5a5",
    barColor: "#ef4444",
  },
  info: {
    bg: "linear-gradient(135deg, #1e3a5f, #1d4ed8)",
    border: "rgba(59,130,246,0.3)",
    icon: Info,
    iconColor: "#93c5fd",
    barColor: "#3b82f6",
  },
  warning: {
    bg: "linear-gradient(135deg, #78350f, #b45309)",
    border: "rgba(234,179,8,0.3)",
    icon: AlertTriangle,
    iconColor: "#fde68a",
    barColor: "#eab308",
  },
};

function ToastItem({ toast, onRemove }) {
  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.success;
  const Icon = cfg.icon;

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      minWidth: 300,
      maxWidth: 380,
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
      animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {/* Progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 3,
        background: cfg.barColor, opacity: 0.7,
        animation: "toastProgress 4s linear forwards",
        borderRadius: "0 0 14px 14px",
      }} />

      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: "rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={17} style={{ color: cfg.iconColor }} />
      </div>

      {/* Message */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.4 }}>
          {toast.message}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6,
          padding: 4, cursor: "pointer", display: "flex", flexShrink: 0, color: "rgba(255,255,255,0.6)",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
      >
        <X size={12} />
      </button>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 10,
      pointerEvents: "none",
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "all" }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

