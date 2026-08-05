import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, CreditCard, Menu } from "lucide-react";
import { useRole } from "../context/RoleContext";

const allItems = [
  { to: "/",          icon: LayoutDashboard, label: "Home",     permission: null },
  { to: "/crm",       icon: Users,           label: "CRM",      permission: null },
  { to: "/calendar",  icon: CalendarDays,     label: "Calendar", permission: null },
  { to: "/finance/payments",  icon: CreditCard,       label: "Finance", permission: "canViewPayments" },
];

export default function BottomNav() {
  const { can } = useRole();
  const items = allItems.filter(item => !item.permission || can(item.permission));

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      background: "#fff", borderTop: "1px solid #e5e7eb",
      display: "flex",
      fontFamily: "'DM Sans', sans-serif",
    }} className="hallmaster-bottomnav hm-bottom-nav">
      {items.map((item) => {
        const NavIcon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={({ isActive }) => ({
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "8px 4px 6px", gap: 2,
              fontSize: 10, fontWeight: 700, textDecoration: "none",
              color: isActive ? "#1B4332" : "#9ca3af", transition: "color 0.15s",
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{ padding: 6, borderRadius: 12, background: isActive ? "#dcfce7" : "transparent" }}>
                  <NavIcon size={18} />
                </div>
                {item.label}
              </>
            )}
          </NavLink>
        );
      })}
      
      {/* Menu Toggle Button */}
      <button 
        onClick={() => window.dispatchEvent(new Event('toggleSidebar'))}
        style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "8px 4px 6px", gap: 2,
          fontSize: 10, fontWeight: 700, border: "none", background: "transparent",
          color: "#9ca3af", cursor: "pointer", transition: "color 0.15s",
        }}
      >
        <div style={{ padding: 6, borderRadius: 12, background: "transparent" }}>
          <Menu size={18} />
        </div>
        Menu
      </button>
      <style>{`@media (min-width: 1024px) { .hallmaster-bottomnav { display: none !important; } }`}</style>
    </nav>
  );
}
