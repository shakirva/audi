import { useState } from "react";
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, Clock, IndianRupee, Calendar } from "lucide-react";
import { useBookings } from "../context/BookingsContext";

const todayStr = new Date().toISOString().split("T")[0];

const TYPE_CONFIG = {
  warning:  { icon: AlertTriangle, color: "#C0392B", bg: "#fef2f2", label: "Warning" },
  info:     { icon: Info,          color: "#2563eb", bg: "#eff6ff", label: "Info" },
  reminder: { icon: Clock,         color: "#D4A017", bg: "#fffbeb", label: "Reminder" },
  payment:  { icon: IndianRupee,   color: "#1B4332", bg: "#f0faf4", label: "Payment" },
  booking:  { icon: Calendar,      color: "#7c3aed", bg: "#f5f3ff", label: "Booking" },
};

function buildNotifications(bookings) {
  const items = [];

  // Pending payments
  bookings.filter(b => b.status === "Pending Payment").forEach(b => {
    const balance = b.totalAmount - Number(b.advance ?? b.advancePaid ?? 0);
    items.push({
      id: `pay-${b.id}`,
      type: "payment",
      title: "Balance Payment Due",
      message: `${b.customerName} owes ₹${balance.toLocaleString()} for ${b.eventType} on ${new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
      time: "Pending",
      read: false,
    });
  });

  // Upcoming events in next 3 days
  const soon = new Date(); soon.setDate(soon.getDate() + 3);
  const soonStr = soon.toISOString().split("T")[0];
  bookings.filter(b => b.date >= todayStr && b.date <= soonStr && b.status !== "Cancelled").forEach(b => {
    items.push({
      id: `evt-${b.id}`,
      type: "reminder",
      title: "Upcoming Event",
      message: `${b.eventType} for ${b.customerName} at ${b.hall} — ${new Date(b.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} (${b.session})`,
      time: b.date === todayStr ? "Today" : "In 1-3 days",
      read: false,
    });
  });

  // Enquiries
  bookings.filter(b => b.status === "Enquiry").forEach(b => {
    items.push({
      id: `enq-${b.id}`,
      type: "info",
      title: "New Enquiry",
      message: `${b.customerName} has an enquiry for ${b.eventType} on ${new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
      time: "Recent",
      read: false,
    });
  });

  // Static notifications for showcase
  items.push(
    { id: "s1", type: "info",    title: "System Update",    message: "HallMaster has been updated to v2.4.1 — New invoice templates & WhatsApp sharing added.", time: "2h ago",  read: true },
    { id: "s2", type: "warning", title: "Low Advance Alert", message: "3 bookings have advance below ₹2,000. Consider sending reminders.", time: "5h ago",  read: true },
    { id: "s3", type: "booking", title: "Booking Confirmed", message: "Booking BK003 for Priya & Vishnu has been confirmed successfully.", time: "Yesterday", read: true },
    { id: "s4", type: "payment", title: "Payment Received",  message: "Full payment received from St. Mary's Church — ₹8,000.", time: "2 days ago", read: true },
  );

  return items;
}

export default function Notifications() {
  const { bookings } = useBookings();
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState(() => buildNotifications(bookings));

  const FILTERS = ["All", "Unread", "Payment", "Reminder", "Info", "Warning", "Booking"];

  const displayed = items.filter(n => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return n.type === filter.toLowerCase();
  });

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const remove = (id) => setItems(prev => prev.filter(n => n.id !== id));

  const unreadCount = items.filter(n => !n.read).length;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 800, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#1B4332", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>Notifications</h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{unreadCount} unread notifications</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1.5px solid #1B4332", background: "#fff", color: "#1B4332", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* ── Filter pills ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "5px 14px", borderRadius: 20, border: "1.5px solid",
              borderColor: filter === f ? "#1B4332" : "#e5e7eb",
              background: filter === f ? "#1B4332" : "#fff",
              color: filter === f ? "#fff" : "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
          >
            {f}{f === "Unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <Bell size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#9ca3af" }}>No notifications in this category</p>
          </div>
        ) : (
          displayed.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  background: n.read ? "#fff" : "#fefce8",
                  borderRadius: 14, padding: "14px 18px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  border: `1.5px solid ${n.read ? "#f3f4f6" : "#fde68a"}`,
                  cursor: "pointer", transition: "all 0.15s",
                  position: "relative",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={cfg.color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: n.read ? 600 : 700, color: "#111827" }}>{n.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "2px 8px", borderRadius: 20 }}>{cfg.label}</span>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{n.time}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                  style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#d1d5db", flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#d1d5db"; e.currentTarget.style.background = "transparent"; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
