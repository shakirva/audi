import { useState } from "react";
import { Menu, Bell, ChevronDown } from "lucide-react";
import { notifications } from "../data/dummyData";
import { useNavigate } from "react-router-dom";

const notifIcons = { warning: "⚠️", info: "ℹ️", reminder: "🔔" };

export default function Header({ title, onMenuClick }) {
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();

  return (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 24px",
      position: "sticky",
      top: 0,
      zIndex: 30,
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden"
        style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "none", background: "#f3f4f6", cursor: "pointer", color: "#6b7280" }}
      >
        <Menu size={20} />
      </button>

      {/* Page Title */}
      <h2 style={{ flex: 1, fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>
        {title}
      </h2>

      {/* Notification Bell */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowNotif(!showNotif)}
          style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#6b7280", position: "relative" }}
        >
          <Bell size={18} />
          <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" }} />
        </button>

        {showNotif && (
          <div style={{
            position: "absolute", right: 0, top: 46, width: 320,
            background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            border: "1px solid #f0f0f0", zIndex: 999, overflow: "hidden"
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>Notifications</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#ef4444", padding: "2px 8px", borderRadius: 20 }}>
                {notifications.length} new
              </span>
            </div>
            {notifications.map((n) => (
              <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f9fafb", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                  {notifIcons[n.type]} {n.message}
                </p>
                <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{n.time}</p>
              </div>
            ))}
            <div style={{ padding: "10px 16px", textAlign: "center" }}>
              <button onClick={() => { setShowNotif(false); navigate("/notifications"); }} style={{ fontSize: 12, color: "#1B4332", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                View all notifications →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 14,
          boxShadow: "0 2px 8px rgba(27,67,50,0.35)"
        }}>R</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "none" }} className="md:block">Rajan P.K.</span>
        <ChevronDown size={13} style={{ color: "#9ca3af" }} />
      </div>
    </header>
  );
}
