import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Users, CreditCard,
  BarChart3, BookOpen, Settings, LogOut, Building2, X, Wallet,
} from "lucide-react";
import { auditoriumInfo, bookings } from "../data/dummyData";
import { useToast } from "./Toast";
import { useRole } from "../context/RoleContext";
import { ROLE_COLORS } from "../context/rolePermissions";

const pendingCount = bookings.filter(b => b.status === "Pending Payment").length;

const allNavItems = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard",  badge: null,          permission: null },
  { to: "/bookings",  icon: BookOpen,         label: "Bookings",   badge: pendingCount,  permission: null },
  { to: "/calendar",  icon: CalendarDays,     label: "Calendar",   badge: null,          permission: null },
  { to: "/customers", icon: Users,            label: "Customers",  badge: null,          permission: null },
  { to: "/payments",  icon: CreditCard,       label: "Payments",   badge: pendingCount,  permission: "canViewPayments" },
  { to: "/expenses",  icon: Wallet,           label: "Expenses",   badge: null,          permission: "canViewReports" },
  { to: "/reports",   icon: BarChart3,        label: "Reports",    badge: null,          permission: "canViewReports" },
];

export default function Sidebar({ open, onClose }) {
  const { addToast } = useToast();
  const { role, logout, can } = useRole();
  const rc = ROLE_COLORS[role] || ROLE_COLORS.Staff;
  const navItems = allNavItems.filter(item => !item.permission || can(item.permission));

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 40, backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
      )}

      <aside style={{
        position: "fixed", top: 0, left: 0, width: 260, height: "100vh", zIndex: 50,
        display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg, #0D2418 0%, #0a1e12 60%, #071510 100%)",
        boxShadow: "4px 0 30px rgba(0,0,0,0.4)",
        fontFamily: "'DM Sans', sans-serif",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }} className="hallmaster-sidebar">

        {/* ── LOGO ── */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(212,160,23,0.15)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, #D4A017, #f0c040)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(212,160,23,0.4)", flexShrink: 0,
            }}>
              <Building2 size={22} style={{ color: "#0D2418" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>
                HallMaster
              </h1>
              <p style={{ fontSize: 11, color: "#D4A017", letterSpacing: 1, marginTop: 2, margin: 0 }}>ഹാൾ മാസ്റ്റർ</p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}
              className="sidebar-close-btn"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── VENUE CARD ── */}
        <div style={{ padding: "12px 14px 6px", flexShrink: 0 }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(212,160,23,0.1), rgba(27,67,50,0.35))",
            border: "1px solid rgba(212,160,23,0.18)",
            borderRadius: 12, padding: "11px 13px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 16 }}>🏛️</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {auditoriumInfo.name}
              </p>
              <p style={{ fontSize: 10, color: "rgba(212,160,23,0.8)", margin: "2px 0 0" }}>
                📍 {auditoriumInfo.location || "Kerala, India"}
              </p>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", flexShrink: 0 }} />
          </div>
        </div>

        {/* ── NAV LABEL ── */}
        <p style={{ fontSize: 9, letterSpacing: 2.5, color: "rgba(255,255,255,0.22)", fontWeight: 700, padding: "12px 20px 5px", margin: 0, flexShrink: 0 }}>
          NAVIGATION
        </p>

        {/* ── NAV ITEMS ── */}
        <nav style={{ flex: 1, padding: "0 10px 8px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const NavIcon = item.icon;
            const { to, label, badge } = item;
            return (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 11,
                fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                textDecoration: "none", marginBottom: 3,
                transition: "all 0.18s ease",
                ...(isActive
                  ? {
                      background: "linear-gradient(135deg, rgba(27,67,50,0.95), rgba(45,106,79,0.5))",
                      color: "#fff",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                      borderLeft: "3px solid #D4A017",
                      paddingLeft: 9,
                    }
                  : {
                      color: "rgba(255,255,255,0.58)",
                      borderLeft: "3px solid transparent",
                    }
                ),
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.borderLeftColor.includes("D4A017")) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.borderLeftColor.includes("D4A017")) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.58)";
                }
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.06)",
              }}>
                <NavIcon size={16} />
              </div>
              <span style={{ flex: 1 }}>{label}</span>
              {badge > 0 && (
                <span style={{
                  background: "#D4A017", color: "#0D2418", fontSize: 10, fontWeight: 800,
                  borderRadius: 20, padding: "2px 7px", lineHeight: 1.4,
                }}>
                  {badge}
                </span>
              )}
            </NavLink>
            );
          })}
        </nav>

        {/* ── DIVIDER ── */}
        <div style={{ height: 1, background: "rgba(212,160,23,0.1)", margin: "0 16px", flexShrink: 0 }} />

        {/* ── USER PROFILE + ACTIONS ── */}
        <div style={{ padding: "12px 14px 16px", flexShrink: 0 }}>
          {/* Profile row */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "10px 12px",
            display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #1B4332, #40916C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800, color: "#D4A017", flexShrink: 0,
            }}>
              {auditoriumInfo.owner.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>{auditoriumInfo.owner}</p>
              {/* Role badge */}
              <span style={{ fontSize: 9, fontWeight: 800, background: rc.bg, color: rc.text, borderRadius: 6, padding: "2px 7px", letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-block", marginTop: 3 }}>
                ● {role}
              </span>
            </div>
          </div>

          {/* Role badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: rc.dot, background: `${rc.dot}22`, border: `1px solid ${rc.dot}44`, padding: "3px 10px", borderRadius: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {role}
            </span>
          </div>

          {/* Settings & Logout */}
          <div style={{ display: "flex", gap: 8 }}>
            {can("canViewSettings") && (
              <NavLink
                to="/settings"
                onClick={onClose}
                style={({ isActive }) => ({
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 0", borderRadius: 9,
                  background: isActive ? "rgba(212,160,23,0.15)" : "rgba(255,255,255,0.05)",
                  border: isActive ? "1px solid rgba(212,160,23,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer", fontSize: 11.5, fontWeight: 500, textDecoration: "none",
                  color: isActive ? "#D4A017" : "rgba(255,255,255,0.48)", transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                })}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.48)"; }}
              >
                <Settings size={13} /> Settings
              </NavLink>
            )}
            <button
              onClick={() => { logout(); addToast("Logged out successfully 👋", "info"); }}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 0", borderRadius: 9,
                background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.18)",
                cursor: "pointer", fontSize: 11.5, fontWeight: 500,
                color: "rgba(255,110,90,0.8)", transition: "all 0.15s",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,57,43,0.22)"; e.currentTarget.style.color = "#ff7b6b"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(192,57,43,0.1)"; e.currentTarget.style.color = "rgba(255,110,90,0.8)"; }}
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop spacer — keeps content from going under sidebar */}
      <div className="hallmaster-spacer" style={{ width: 260, flexShrink: 0 }} />

      <style>{`
        @media (max-width: 1023px) {
          .hallmaster-spacer { display: none !important; }
          .sidebar-close-btn { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .hallmaster-sidebar { transform: translateX(0) !important; }
          .sidebar-close-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}
