import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, FileText, IndianRupee, Store, Settings, LogOut, CheckSquare, ChevronRight, Briefcase, Calculator, UsersRound, CreditCard, ShoppingCart, BarChart3, Map, Tent } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo"; // Bring back the new logo component if it exists, or use the brand icon.

export default function Sidebar() {
  const location = useLocation();
  const { role, user, logout } = useRole();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState("");

  const PRIMARY_COLOR = "#0D2418";
  const ACCENT_COLOR = "#D4A017";

  const NAVIGATION = [
    { type: "link", path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { 
      type: "group", label: "CRM", icon: Users, id: "crm",
      children: [
        { path: "/crm", label: "Enquiries" },
        { path: "/customers", label: "Customers" }
      ]
    },
    { 
      type: "group", label: "Bookings", icon: CalendarDays, id: "bookings",
      children: [
        { path: "/calendar", label: "Calendar" },
        { path: "/bookings", label: "Bookings" },
        { path: "/agreements", label: "Agreements" }
      ]
    },
    { 
      type: "group", label: "Operations", icon: Briefcase, id: "ops",
      children: [
        { path: "/jobs", label: "Job Management" }
      ]
    },
    { 
      type: "group", label: "Finance", icon: CreditCard, id: "finance",
      children: [
        { path: "/payments", label: "Payments & Receipts" },
        { path: "/accounts", label: "Accounts Lite" },
        { path: "/vendors", label: "Vendors" },
        { path: "/purchases", label: "Purchases" }
      ]
    },
    { 
      type: "group", label: "Staff & HR", icon: UsersRound, id: "external",
      children: [
        { path: "/staff", label: "Staff Management" }
      ]
    },
    { 
      type: "group", label: "Reports Center", icon: BarChart3, id: "reports",
      children: [
        { path: "/reports", label: "Report Dashboard" },
        { path: "/reports/sales", label: "Sales Reports 🔒" },
        { path: "/reports/booking", label: "Booking Reports 🔒" },
        { path: "/reports/accounts", label: "Accounts Reports 🔒" },
        { path: "/reports/hall", label: "Hall Reports 🔒" }
      ]
    },
    { 
      type: "group", label: "System", icon: Settings, id: "system",
      children: [
        { path: "/settings", label: "Masters" },
        { path: "/roadmap", label: "ERP Roadmap" }
      ]
    }
  ];

  return (
    <motion.div 
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      style={{ 
        background: PRIMARY_COLOR, 
        color: "#fff", 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        fontFamily: "'Inter', 'DM Sans', sans-serif",
        position: "sticky",
        top: 0,
        boxShadow: "10px 0 30px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}
    >
      
      {/* Brand */}
      <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => setCollapsed(!collapsed)}>
        <div style={{ width: 40, height: 40, background: ACCENT_COLOR, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: PRIMARY_COLOR }}>
          <Tent size={24} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>Laural Garden</div>
              <div style={{ fontSize: 11, color: ACCENT_COLOR, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Auditorium</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ margin: "0 24px 16px", height: 1, background: "rgba(255,255,255,0.1)" }} />

      {/* Navigation */}
      <div style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        {NAVIGATION.map(item => {
          if (item.type === "link") {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: "none" }}>
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
                  {!collapsed && <span style={{ fontSize: 15, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>}
                </motion.div>
              </Link>
            );
          }

          if (item.type === "group") {
            const hasActiveChild = item.children.some(c => location.pathname === c.path);
            // Open if explicitly selected, OR (has active child AND hasn't been explicitly closed)
            const isOpen = openGroup === item.id || (openGroup === "" && hasActiveChild);

            return (
              <div key={item.id}>
                <motion.div 
                  whileHover={{ background: "rgba(255,255,255,0.05)" }}
                  onClick={() => { 
                    if (!collapsed) {
                      setOpenGroup(isOpen ? "NONE" : item.id);
                    }
                  }}
                  style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                    color: hasActiveChild ? "#fff" : "rgba(255,255,255,0.7)",
                    marginBottom: 2
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <item.icon size={20} color={hasActiveChild ? ACCENT_COLOR : "rgba(255,255,255,0.7)"} style={{ flexShrink: 0 }} />
                    {!collapsed && <span style={{ fontSize: 15, fontWeight: hasActiveChild ? 700 : 500 }}>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <motion.div animate={{ rotate: isOpen ? 90 : 0 }}><ChevronRight size={16} /></motion.div>
                  )}
                </motion.div>
                
                <AnimatePresence>
                  {!collapsed && isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 44, paddingBottom: 8 }}>
                        {item.children.map(child => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link key={child.path} to={child.path} style={{ textDecoration: "none" }}>
                              <div style={{ 
                                padding: "8px 12px", borderRadius: 8, fontSize: 14, 
                                color: isChildActive ? ACCENT_COLOR : "rgba(255,255,255,0.6)",
                                fontWeight: isChildActive ? 700 : 500,
                                background: isChildActive ? "rgba(212,160,23,0.1)" : "transparent"
                              }}>
                                {child.label}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
        })}
      </div>

      <div style={{ margin: "16px 24px 0", height: 1, background: "rgba(255,255,255,0.1)" }} />

      {/* Development Preview Badge */}
      {!collapsed && (
        <div style={{ margin: "16px 24px 0", padding: "8px 12px", background: "rgba(212,160,23,0.1)", borderRadius: 8, border: "1px dashed rgba(212,160,23,0.3)" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: ACCENT_COLOR, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Demo Version</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Version 2.0 Development Preview</div>
        </div>
      )}

      {/* User Profile Footer */}
      <div style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT_COLOR, color: PRIMARY_COLOR, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
            {user?.name?.charAt(0) || "U"}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Venueza User"}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{role}</div>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/settings" style={{ flex: 1, textDecoration: "none" }}>
              <button style={{ width: "100%", padding: "8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Settings size={14} /> Settings
              </button>
            </Link>
            <button onClick={logout} style={{ padding: "8px", background: "rgba(239, 68, 68, 0.1)", border: "none", borderRadius: 8, color: "#ef4444", cursor: "pointer" }}>
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

    </motion.div>
  );
}
