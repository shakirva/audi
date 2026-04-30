import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, CalendarDays, CreditCard, BarChart3 } from "lucide-react";
import { useRole } from "../context/RoleContext";

const allItems = [
  { to: "/",          icon: LayoutDashboard, label: "Home",     permission: null },
  { to: "/bookings",  icon: BookOpen,         label: "Bookings", permission: null },
  { to: "/calendar",  icon: CalendarDays,     label: "Calendar", permission: null },
  { to: "/payments",  icon: CreditCard,       label: "Payments", permission: "canViewPayments" },
  { to: "/reports",   icon: BarChart3,        label: "Reports",  permission: "canViewReports" },
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
    }} className="hallmaster-bottomnav">
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
      <style>{`@media (min-width: 1024px) { .hallmaster-bottomnav { display: none !important; } }`}</style>
    </nav>
  );
}
