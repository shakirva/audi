import { useState } from "react";
import { X, FileText, MessageCircle, Pencil, XCircle } from "lucide-react";
import { useToast } from "./Toast";
import { useBookings } from "../context/BookingsContext";

const STATUS_FLOW = {
  Enquiry:          { next: "Confirmed",  label: "✅ Confirm Booking",  color: "#15803d", bg: "#dcfce7" },
  Confirmed:        { next: "Completed",  label: "🏁 Mark Completed",   color: "#1d4ed8", bg: "#dbeafe" },
  "Pending Payment":{ next: "Confirmed",  label: "💰 Mark Paid",        color: "#a16207", bg: "#fef9c3" },
  Completed:        { next: null, label: null, color: null, bg: null },
  Cancelled:        { next: null, label: null, color: null, bg: null },
};

const STATUS_STYLE = {
  Confirmed:        { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Pending Payment":{ bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
  Enquiry:          { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Completed:        { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
  Cancelled:        { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
};

const EVENT_ICON = {
  Wedding:"💍", Reception:"🥂", Engagement:"💑", Birthday:"🎂",
  Corporate:"💼", Conference:"💼", Baptism:"✝️", Seemantham:"🙏",
  "Annual Day":"🎓", Other:"🎉",
};

export default function BookingDetailModal({ booking: initialBooking, onClose, onInvoice, onEdit }) {
  const { addToast } = useToast();
  const { updateStatus } = useBookings();
  const [booking, setBooking] = useState(initialBooking);
  if (!booking) return null;

  const advance = Number(booking.advance ?? booking.advancePaid ?? 0);
  const balance = booking.totalAmount - advance;

  const formattedDate = (() => {
    try { return new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return booking.date; }
  })();

  const flow = STATUS_FLOW[booking.status];

  const handleStatusChange = (newStatus) => {
    updateStatus(booking.id, newStatus);
    setBooking(prev => ({ ...prev, status: newStatus }));
    const msgs = { Confirmed: "Booking confirmed! ✅", Completed: "Booking completed! 🏁" };
    addToast(msgs[newStatus] || "Status updated", "success");
  };

  const handleCancel = () => {
    updateStatus(booking.id, "Cancelled");
    setBooking(prev => ({ ...prev, status: "Cancelled" }));
    addToast("Booking cancelled", "error");
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Dear ${booking.customerName},\n\nYour booking at our auditorium is confirmed! 🎉\n\n📅 Date: ${formattedDate}\n🏛️ Hall: ${booking.hall}\n⏰ Session: ${booking.session}\n👥 Guests: ${booking.guests}\n💰 Total: ₹${booking.totalAmount.toLocaleString()}\n✅ Advance: ₹${advance.toLocaleString()}\n⚠️ Balance Due: ₹${balance.toLocaleString()}\n\nThank you for choosing us! 🙏`
    );
    window.open(`https://wa.me/91${booking.phone}?text=${msg}`, "_blank");
  };

  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );

  const st = STATUS_STYLE[booking.status] || STATUS_STYLE.Enquiry;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "22px 24px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{EVENT_ICON[booking.eventType] || "🎉"}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,160,23,0.9)", background: "rgba(212,160,23,0.12)", padding: "2px 10px", borderRadius: 20, letterSpacing: "0.07em" }}>
                  {booking.id}
                </span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
                {booking.customerName}
              </h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                {booking.eventType} · {formattedDate} · {booking.phone}
              </p>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ marginTop: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color, padding: "5px 14px", borderRadius: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.dot }} />
              {booking.status}
            </span>
          </div>
        </div>

        <div style={{ padding: 24 }}>

          {/* ── STATUS FLOW ── */}
          {(flow?.next || (booking.status !== "Cancelled" && booking.status !== "Completed")) && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Update Status
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {flow?.next && (
                  <button onClick={() => handleStatusChange(flow.next)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
                    borderRadius: 10, border: "none", cursor: "pointer",
                    background: flow.bg, color: flow.color, fontSize: 12, fontWeight: 700,
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    {flow.label}
                  </button>
                )}
                {booking.status !== "Cancelled" && booking.status !== "Completed" && (
                  <button onClick={handleCancel} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
                    borderRadius: 10, border: "1.5px solid #fee2e2", cursor: "pointer",
                    background: "#fff", color: "#b91c1c", fontSize: 12, fontWeight: 700,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <XCircle size={13} /> Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── BOOKING DETAILS ── */}
          <div style={{ background: "#f9fafb", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Booking Details</p>
            {row("Hall", booking.hall)}
            {row("Session", booking.session)}
            {row("Guests", `${booking.guests} persons`)}
            {row("Event Type", `${EVENT_ICON[booking.eventType] || "🎉"} ${booking.eventType}`)}
            {row("Date", formattedDate)}
            {booking.notes && row("Notes", booking.notes)}
          </div>

          {/* ── PAYMENT SUMMARY ── */}
          <div style={{ background: "#f0faf4", borderRadius: 14, padding: "14px 16px", border: "1px solid #bbf7d0", marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Payment Summary</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#374151" }}>Total Amount</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>₹{booking.totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#15803d" }}>Advance Paid</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>₹{advance.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px dashed #86efac" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: balance > 0 ? "#b91c1c" : "#15803d" }}>
                {balance > 0 ? "Balance Due" : "✅ Fully Paid"}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: balance > 0 ? "#b91c1c" : "#15803d" }}>
                ₹{balance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => { onInvoice && onInvoice(booking); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, background: "#1B4332", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#163829"}
              onMouseLeave={e => e.currentTarget.style.background = "#1B4332"}>
              <FileText size={14} /> Invoice
            </button>
            <button onClick={handleWhatsApp}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, background: "#22c55e", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#16a34a"}
              onMouseLeave={e => e.currentTarget.style.background = "#22c55e"}>
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button onClick={() => { onEdit && onEdit(booking); onClose(); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", gridColumn: "1 / -1" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              <Pencil size={14} /> Edit Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
