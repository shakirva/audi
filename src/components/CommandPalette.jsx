import React, { useEffect, useState } from "react";
import { Search, FileText, Users, Calendar, Settings, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const ACTIONS = [
    { id: 1, label: "Create New Enquiry", icon: Users, path: "/crm", category: "Actions" },
    { id: 2, label: "View Active Jobs", icon: Calendar, path: "/jobs", category: "Navigation" },
    { id: 3, label: "Generate Agreement", icon: FileText, path: "/agreements", category: "Actions" },
    { id: 4, label: "System Settings", icon: Settings, path: "/settings", category: "Navigation" },
  ];

  const filtered = ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "center", paddingTop: "15vh" }}>
          
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }} 
          />
          
          {/* Palette */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
            style={{ position: "relative", background: "#fff", width: 600, maxWidth: "90%", borderRadius: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden", border: "1px solid #e2e8f0" }}
          >
            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <Search size={20} color="#64748b" style={{ marginRight: 16 }} />
              <input 
                autoFocus
                placeholder="Search bookings, customers, or jump to..." 
                value={query} onChange={e => setQuery(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 18, color: "#0f172a", background: "transparent" }}
              />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", background: "#f1f5f9", padding: "4px 8px", borderRadius: 8 }}>ESC</div>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 400, overflowY: "auto", padding: 16 }}>
              {filtered.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, padding: "8px 12px" }}>Suggested Actions</div>
                  {filtered.map((action, i) => (
                    <motion.div 
                      key={action.id}
                      whileHover={{ background: "#f8fafc" }}
                      onClick={() => { navigate(action.path); setOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, cursor: "pointer", color: "#0f172a" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ background: "#f1f5f9", color: "#475569", padding: 8, borderRadius: 10 }}>
                          <action.icon size={18} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{action.label}</span>
                      </div>
                      <ArrowRight size={16} color="#cbd5e1" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 15 }}>No results found for "{query}"</div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
