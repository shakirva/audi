import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, FileText, IndianRupee, Store, Settings, LogOut, CheckSquare, ChevronRight, Briefcase, Calculator, UsersRound, CreditCard, ShoppingCart, BarChart3, Map, Tent, Database } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { settingsAPI } from "../services/api";
import { BASE_NAVIGATION } from "../constants/navigation";

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { role, user, logout, venueInfo, setVenueInfo, activeEnvironment, moduleAccess } = useRole();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState("");

  // Load venue info from settings API on mount (if not already cached)
  useEffect(() => {
    if (!venueInfo) {
      settingsAPI.get().then(res => {
        const d = res.data.data;
        if (d) {
          setVenueInfo({
            name: d.venueName || "",
            subtitle: d.venueSubtitle || "Auditorium",
            owner: d.ownerName || "",
            logoUrl: d.logoUrl || null,
          });
        }
      }).catch(() => {});
    }
  }, []);

  const PRIMARY_COLOR = "#0D2418";
  const ACCENT_COLOR = "#D4A017";

  const getFilteredNavigation = () => {
    const roleAccess = moduleAccess && moduleAccess[role] ? moduleAccess[role] : null;

    return BASE_NAVIGATION.map(item => {
      // Environment specific hides
      if (activeEnvironment === "sandbox" && (item.label === "Staff & HR" || item.label === "Attendance & Leaves")) return null;
      // SaaS Platform is ALWAYS restricted to SuperAdmin, regardless of custom access config
      if (item.label === "SaaS Platform" && role !== "SuperAdmin") return null;

      let currentItem = { ...item };
      
      if (currentItem.type === "group" && activeEnvironment === "sandbox") {
        currentItem.children = currentItem.children.filter(child => child.label !== "Activity Logs");
      }

      // 1. Custom Role-Based Module Access override
      if (roleAccess) {
        // Deduplicate attendance menus based on role type
        const isAdminRole = ["SuperAdmin", "Admin", "Owner", "Manager", "Tester"].includes(role);
        if (currentItem.label === "Staff & HR" && !isAdminRole) return null;
        if (currentItem.label === "Attendance & Leaves" && isAdminRole) return null;

        if (currentItem.type === "link") {
          if (!roleAccess.includes(currentItem.path)) return null;
          return currentItem;
        } else if (currentItem.type === "group") {
          const allowedChildren = currentItem.children.filter(child => roleAccess.includes(child.path));
          if (allowedChildren.length === 0) return null;
          return { ...currentItem, children: allowedChildren };
        }
      }

      // 2. Default Fallback (if no custom RBAC saved in DB for this role)
      if (!currentItem.roles.includes(role)) return null;
      
      return currentItem;
    }).filter(Boolean);
  };

  const NAVIGATION = getFilteredNavigation();

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
        animate={{ 
          width: collapsed ? 80 : 280
        }}
        className={`fixed inset-y-0 left-0 z-50 lg:sticky lg:top-0 h-screen flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ 
          background: PRIMARY_COLOR, 
          color: "#fff", 
          fontFamily: "'Inter', 'DM Sans', sans-serif",
        }}
      >
        
        {/* Brand */}
        <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => setCollapsed(!collapsed)}>
        <div style={{ width: 40, height: 40, background: venueInfo?.logoUrl ? "transparent" : ACCENT_COLOR, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: PRIMARY_COLOR, overflow: "hidden" }}>
          {venueInfo?.logoUrl ? (
            <img 
              src={venueInfo.logoUrl.startsWith('http') || venueInfo.logoUrl.startsWith('/') ? venueInfo.logoUrl : `https://venueza.cloud/uploads/${venueInfo.logoUrl}`} 
              alt="Logo" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }} 
            />
          ) : (
            <Tent size={24} />
          )}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>{venueInfo?.name || "Venueza"}</div>
              <div style={{ fontSize: 11, color: ACCENT_COLOR, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{venueInfo?.subtitle || "Auditorium"}</div>
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



      {/* User Profile Footer */}
      <div style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: ACCENT_COLOR, color: PRIMARY_COLOR, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
            {user?.name?.charAt(0) || "U"}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Venueza User"}</div>
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
    </>
  );
}
