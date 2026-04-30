import { useState } from "react";
import { CheckCircle, MessageCircle } from "lucide-react";
import { useToast } from "../components/Toast";
import { useBookings } from "../context/BookingsContext";

const today = new Date();

function daysDue(dateStr) {
  const d = new Date(dateStr);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

function urgencyStyle(days) {
  if (days < 0)   return { bg: "#fee2e2", color: "#b91c1c", label: "Overdue" };
  if (days <= 7)  return { bg: "#fee2e2", color: "#b91c1c", label: `${days}d left` };
  if (days <= 15) return { bg: "#fef9c3", color: "#a16207", label: `${days}d left` };
  return              { bg: "#dcfce7", color: "#15803d", label: `${days}d left` };
}

export default function Payments() {
  const { addToast } = useToast();
  const { bookings, updateStatus } = useBookings();
  const [paid, setPaid] = useState({});

  const pending = bookings.filter(b => b.status === "Pending Payment");
  const confirmed = bookings.filter(b => b.status === "Confirmed" || b.status === "Completed");

  const totalRevenue  = confirmed.reduce((s, b) => s + b.totalAmount, 0);
  const totalAdvance  = confirmed.reduce((s, b) => s + b.advance, 0);
  const totalBalance  = confirmed.reduce((s, b) => s + (b.totalAmount - b.advance), 0);
  const pendingAmount = pending.reduce((s, b) => s + (b.totalAmount - b.advance), 0);

  const handleMarkPaid = (id) => {
    setPaid(p => ({ ...p, [id]: true }));
    updateStatus(id, "Confirmed");
    addToast("Payment marked as received ✅", "success");
  };

  const handleSendReminder = (b) => {
    const balance = b.totalAmount - Number(b.advance ?? b.advancePaid ?? 0);
    const days = daysDue(b.date);
    const eventDate = new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const msg = encodeURIComponent(
      `Dear ${b.customerName},\n\nThis is a gentle reminder that a balance payment of ₹${balance.toLocaleString()} is due for your upcoming ${b.eventType} on ${eventDate} at ${b.hall}.\n\nKindly make the payment ${days <= 0 ? "at the earliest" : `within ${days} day${days > 1 ? "s" : ""}`}.\n\nThank you! 🙏\n— Sreelakshmi Convention Centre`
    );
    window.open(`https://wa.me/91${b.phone}?text=${msg}`, "_blank");
    addToast(`Reminder sent to ${b.customerName} 📱`, "success");
  };

  // Bookings with event ≤7 days away and still pending
  const urgentReminders = pending.filter(b => !paid[b.id] && daysDue(b.date) <= 7);

  const card = { background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: 24 };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Revenue",    value: `₹${(totalRevenue/100000).toFixed(1)}L`,    icon: "💰", bg: "#f0faf4", color: "#1B4332" },
          { label: "Advance Collected",value: `₹${(totalAdvance/100000).toFixed(1)}L`,    icon: "✅", bg: "#fffbeb", color: "#D4A017" },
          { label: "Balance Due",      value: `₹${(totalBalance/1000).toFixed(0)}k`,      icon: "🕐", bg: "#eff6ff", color: "#2563eb" },
          { label: "Pending Dues",     value: `₹${(pendingAmount/1000).toFixed(0)}k`,     icon: "⚠️", bg: "#fff5f5", color: "#C0392B" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADVANCE REMINDER BANNER ── */}
      {urgentReminders.length > 0 && (
        <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 14, padding: "14px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#c2410c" }}>
                {urgentReminders.length} urgent payment{urgentReminders.length > 1 ? "s" : ""} — event within 7 days!
              </p>
              <p style={{ fontSize: 11, color: "#9a3412" }}>Send WhatsApp reminders to collect balance before the event.</p>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {urgentReminders.map(b => {
              const days = daysDue(b.date);
              const balance = b.totalAmount - Number(b.advance ?? b.advancePaid ?? 0);
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "8px 14px", border: "1px solid #fed7aa", flexShrink: 0 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{b.customerName}</p>
                    <p style={{ fontSize: 11, color: "#9a3412" }}>
                      ₹{balance.toLocaleString()} due · {days <= 0 ? "Overdue!" : `${days}d left`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSendReminder(b)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: "#25D366", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <MessageCircle size={12} /> Send Reminder
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PENDING DUES TABLE ── */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Pending Payments
          </h3>
          <span style={{ fontSize: 11, fontWeight: 700, background: "#fee2e2", color: "#b91c1c", padding: "3px 12px", borderRadius: 20 }}>
            {pending.filter(b => !paid[b.id]).length} pending
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Customer", "Event", "Date", "Total", "Advance", "Balance", "Due In", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.map(b => {
                const isPaid  = paid[b.id];
                const balance = b.totalAmount - b.advance;
                const days    = daysDue(b.date);
                const urg     = urgencyStyle(days);
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f9fafb", background: isPaid ? "#f0faf4" : "#fff" }}
                    onMouseEnter={e => { if (!isPaid) e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isPaid ? "#f0faf4" : "#fff"; }}
                  >
                    <td style={{ padding: "11px 14px" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{b.customerName}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>{b.phone}</p>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{b.eventType} · {b.hall}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>
                      {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>₹{b.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#15803d", whiteSpace: "nowrap" }}>₹{b.advance.toLocaleString()}</td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#b91c1c", whiteSpace: "nowrap" }}>₹{balance.toLocaleString()}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: urg.bg, color: urg.color, padding: "3px 10px", borderRadius: 12 }}>{urg.label}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {isPaid ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                          <CheckCircle size={14} /> Paid
                        </span>
                      ) : (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "nowrap" }}>
                          <button onClick={() => handleMarkPaid(b.id)}
                            style={{ padding: "5px 12px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#163829"}
                            onMouseLeave={e => e.currentTarget.style.background = "#1B4332"}
                          >
                            Mark Paid
                          </button>
                          {days <= 7 && (
                            <button onClick={() => handleSendReminder(b)}
                              style={{ padding: "5px 10px", borderRadius: 8, background: "#25D366", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
                              title="Send WhatsApp reminder"
                            >
                              <MessageCircle size={12} /> Remind
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAYMENT HISTORY ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        <div style={card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
            Payment History
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {confirmed.slice(0, 10).map((b, idx) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: idx < 9 ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle size={16} style={{ color: "#15803d" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{b.customerName}</p>
                  <p style={{ fontSize: 11, color: "#6b7280" }}>{b.eventType} · {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1B4332" }}>₹{b.totalAmount.toLocaleString()}</p>
                  <p style={{ fontSize: 10, color: "#9ca3af" }}>Full</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GST Summary */}
        <div style={card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
            GST Summary
          </h3>
          {[
            { label: "Gross Revenue",  value: `₹${totalRevenue.toLocaleString()}`,                          color: "#111827" },
            { label: "CGST (9%)",      value: `₹${Math.round(totalRevenue * 0.09).toLocaleString()}`,        color: "#D4A017" },
            { label: "SGST (9%)",      value: `₹${Math.round(totalRevenue * 0.09).toLocaleString()}`,        color: "#D4A017" },
            { label: "Total GST",      value: `₹${Math.round(totalRevenue * 0.18).toLocaleString()}`,        color: "#C0392B" },
            { label: "Net Revenue",    value: `₹${Math.round(totalRevenue * 0.82).toLocaleString()}`,        color: "#1B4332" },
          ].map((row, i) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 4 ? "1px solid #f3f4f6" : "none" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 14, background: "#F0F4EF", borderRadius: 10, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#6b7280" }}>Q2 FY 2025-26</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#1B4332", marginTop: 4 }}>
              ₹{Math.round(totalRevenue * 0.82).toLocaleString()}
            </p>
            <p style={{ fontSize: 11, color: "#6b7280" }}>Net Taxable Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}
