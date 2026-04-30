import { useState, useMemo } from "react";
import { Search, Phone, MessageCircle, ChevronDown, ChevronUp, User } from "lucide-react";
import { useBookings } from "../context/BookingsContext";

// Build unique customers from bookings
const buildCustomers = (bookings) => {
  const map = {};
  bookings.forEach(b => {
    if (!map[b.phone]) {
      map[b.phone] = { name: b.customerName, phone: b.phone, bookings: [] };
    }
    map[b.phone].bookings.push(b);
  });
  return Object.values(map).sort((a, b) => b.bookings.length - a.bookings.length);
};

const STATUS_DOT = {
  Confirmed: "#22c55e", "Pending Payment": "#eab308",
  Enquiry: "#3b82f6", Completed: "#9ca3af", Cancelled: "#ef4444",
};

export default function Customers() {
  const { bookings } = useBookings();
  const customers = useMemo(() => buildCustomers(bookings), [bookings]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const toggle = (phone) => setExpanded(e => e === phone ? null : phone);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer name or phone…"
            style={{ width: "100%", height: 40, paddingLeft: 34, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, color: "#374151", outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          />
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{filtered.length} customers</div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Customers", value: customers.length, icon: "👥", color: "#1B4332", bg: "#f0faf4" },
          { label: "Total Bookings",  value: bookings.length, icon: "📅", color: "#D4A017", bg: "#fffbeb" },
          { label: "Total Revenue",   value: "₹" + bookings.filter(b=>b.status==="Confirmed"||b.status==="Completed").reduce((s,b)=>s+b.totalAmount,0).toLocaleString(), icon: "💰", color: "#1d4ed8", bg: "#eff6ff" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(c => {
          const isOpen = expanded === c.phone;
          const totalSpent = c.bookings.filter(b => b.status === "Confirmed" || b.status === "Completed").reduce((s, b) => s + b.totalAmount, 0);
          const lastEvent  = [...c.bookings].sort((a, b) => b.date.localeCompare(a.date))[0];
          const initials   = c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

          return (
            <div key={c.phone} style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #f3f4f6" }}>
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer" }}
                onClick={() => toggle(c.phone)}
              >
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📞 {c.phone}</p>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 17, fontWeight: 800, color: "#1B4332" }}>{c.bookings.length}</p>
                    <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>BOOKINGS</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#D4A017" }}>₹{totalSpent.toLocaleString()}</p>
                    <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>SPENT</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{lastEvent ? new Date(lastEvent.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "-"}</p>
                    <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>LAST EVENT</p>
                  </div>
                </div>

                {/* WhatsApp */}
                <a href={`https://wa.me/91${c.phone}`} target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "#25D366", color: "#fff", textDecoration: "none" }}
                  title="WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>

                {/* Expand chevron */}
                <div style={{ color: "#9ca3af", marginLeft: 4 }}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded booking history */}
              {isOpen && (
                <div style={{ padding: "0 20px 16px", borderTop: "1px solid #f9fafb" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", padding: "12px 0 8px" }}>
                    Booking History
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {c.bookings.sort((a, b) => b.date.localeCompare(a.date)).map(b => (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "#f9fafb" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_DOT[b.status] || "#9ca3af", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{b.eventType}</span>
                          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8 }}>{b.hall}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1B4332" }}>₹{b.totalAmount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
