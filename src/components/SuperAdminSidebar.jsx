import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Building, CreditCard, Users, MessageSquare, ScrollText, LogOut, ChevronRight, Tent } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SA_NAV = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Platform Dashboard" },
  { path: "/tenants",   icon: Building,         label: "Tenants" },
  { path: "/subscriptions", icon: CreditCard,   label: "Subscriptions" },
  { path: "/leads",     icon: Users,            label: "Demo Requests" },
  { path: "/feedback",  icon: MessageSquare,    label: "User Feedback" },
  { path: "/system/activity-logs", icon: ScrollText, label: "Activity Logs" },
];

const PRIMARY_COLOR = "#0D2418";
const ACCENT_COLOR  = "#D4A017";

export default function SuperAdminSidebar({ open, onClose }) {
  const location = useLocation();
  const { user, logout } = useRole();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className={`fixed inset-y-0 left-0 z-50 lg:sticky lg:top-0 h-screen flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: PRIMARY_COLOR, color: "#fff", fontFamily: "'Inter', 'DM Sans', sans-serif" }}
      >

        {/* Brand */}
        <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => setCollapsed(!collapsed)}>
          <div style={{ width: 40, height: 40, background: ACCENT_COLOR, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: PRIMARY_COLOR, flexShrink: 0 }}>
            <Tent size={24} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>Venueza</div>
                <div style={{ fontSize: 11, color: ACCENT_COLOR, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Platform Admin</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ margin: "0 24px 16px", height: 1, background: "rgba(255,255,255,0.1)" }} />

        {/* Navigation */}
        <div style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
          {SA_NAV.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: "none" }} onClick={onClose}>
                <motion.div
                  whileHover={{ background: "rgba(255,255,255,0.1)" }}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 12,
                    background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                    transition: "all 0.2s"
                  }}
                >
                  <item.icon size={20} color={isActive ? ACCENT_COLOR : "rgba(255,255,255,0.7)"} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <span style={{ fontSize: 15, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div style={{ margin: "16px 24px 0", height: 1, background: "rgba(255,255,255,0.1)" }} />

        {/* User Footer */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT_COLOR, color: PRIMARY_COLOR, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
              {user?.name?.charAt(0) || "S"}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Platform Admin"}</div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button onClick={logout} style={{ width: "100%", padding: "8px", background: "rgba(239, 68, 68, 0.1)", border: "none", borderRadius: 8, color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <LogOut size={14} /> Logout
            </button>
          )}
        </div>

      </motion.div>
    </>
  );
}
