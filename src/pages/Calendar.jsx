import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Ban } from "lucide-react";
const hallColors = { "Main Hall": { hex: "#1B4332" }, "Mini Hall": { hex: "#2563eb" }, "Open Stage": { hex: "#D4A017" } };
import NewEnquiryModal from "../components/NewEnquiryModal";
import { useBookings } from "../context/BookingsContext";
import { useRole } from "../context/RoleContext";
import { settingsAPI, enquiriesAPI } from "../services/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}

const STATUS_STYLE = {
  Confirmed:        { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Pending Payment":{ bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
  Enquiry:          { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  Completed:        { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
};

export default function Calendar() {
  const now = new Date();
  const { user, role } = useRole();
  const { bookings, refetch } = useBookings();
  const [year,  setYear]          = useState(now.getFullYear());
  const [month, setMonth]         = useState(now.getMonth());
  const [selected, setSelected]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState([]);

  const [enquiries, setEnquiries] = useState([]);

  const fetchEnquiries = () => {
    enquiriesAPI.getAll({ limit: 1000 })
      .then(res => {
        const mapped = (res.data.data || [])
          .filter(e => e.status !== "Booking Confirmed" && e.status !== "Lost" && e.tentativeDate)
          .map(e => ({
            id: `enq-${e.id}`,
            date: e.tentativeDate,
            customerName: e.Customer?.name || "Unknown",
            status: "Enquiry",
            eventType: e.eventType,
            hall: e.hallPreference,
            session: e.session,
            guests: e.guestCount || 0,
            totalAmount: e.budget || 0
          }));
        setEnquiries(mapped);
      })
      .catch(console.error);
  };

  useEffect(() => {
    settingsAPI.get()
      .then(res => { if (res.data.data?.blackoutDates) setBlackoutDates(res.data.data.blackoutDates); })
      .catch(console.error);
      
    fetchEnquiries();
  }, []);

  const allCalendarData = [...bookings, ...enquiries]; // Keep all for availability calculation
  const visibleCalendarData = [...bookings, ...enquiries]; // For rendering details

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const todayStr    = now.toISOString().split("T")[0];

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const next = () => { if (month === 11){ setMonth(0);  setYear(y => y+1); } else setMonth(m => m+1); };

  const bookingsOnDay = (day) => {
    const d = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return allCalendarData.filter(b => b.date === d);
  };

  const selectedDateStr = selected
    ? `${year}-${String(month+1).padStart(2,"0")}-${String(selected).padStart(2,"0")}`
    : null;
  const selectedBookings = selected ? visibleCalendarData.filter(b => b.date === selectedDateStr) : [];

  // Total days grid (fill with nulls for leading blanks)
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i+1)];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // hallColors is an object: { "Main Hall": { hex, ... }, ... }
  const hallColorMap = {};
  Object.entries(hallColors || {}).forEach(([hall, val]) => { hallColorMap[hall] = val.hex || "#1B4332"; });

  // Availability colour: check how many unique halls are booked on a given day
  // 0 halls → green (fully available), 1-2 → yellow (partial), 3 → red (fully booked)
  const TOTAL_HALLS = 3;
  const availColor = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    // Blocked date overrides everything
    if (blackoutDates.includes(dateStr)) return { bg: "#f3f4f6", border: "#d1d5db", label: "Blocked" };
    const dayBookings = bookingsOnDay(day);
    const activeBookings = dayBookings.filter(b => b.status !== "Enquiry" && b.status !== "Cancelled");
    // Only enquiries → blue
    if (dayBookings.length > 0 && activeBookings.length === 0) {
      return { bg: "#dbeafe", border: "#93c5fd", label: "Enquiry" };
    }
    const uniqueHalls = new Set(activeBookings.map(b => b.hall)).size;
    if (uniqueHalls === 0) return { bg: "#dcfce7", border: "#22c55e", label: "Available" };
    if (uniqueHalls < TOTAL_HALLS) return { bg: "#fef9c3", border: "#eab308", label: "Partial" };
    return { bg: "#fee2e2", border: "#ef4444", label: "Full" };
  };

  return (
    <div className="hm-calendar-layout" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── CALENDAR CARD ── */}
      <div className="hm-hide-scrollbar" style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflowX: "auto", minWidth: 0 }}>
        <div style={{ minWidth: 420 }}>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 8 }}>
          <button onClick={prev} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", flexShrink: 0 }}>
            <ChevronLeft size={14} />
          </button>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
            {MONTHS[month]} {year}
          </h2>
          <button onClick={next} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", flexShrink: 0 }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 12px 4px" }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ textAlign: "center", padding: "6px 0", fontSize: 9, fontWeight: 700, color: d === "Sun" || d === "Sat" ? "#ef4444" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 10px 12px", gap: 2 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dayBookings = visibleCalendarData.filter(b => b.date === `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`);
            const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday      = dateStr === todayStr;
            const isSelected   = day === selected;
            const isWeekend    = [0, 6].includes((firstDay + day - 1) % 7);
            const isBlocked    = blackoutDates.includes(dateStr);
            const isPast       = new Date(dateStr) < new Date(todayStr);
            const isDisabled   = isBlocked || isPast;
            const avail        = availColor(day);

            return (
              <div key={`day-${day}`}
                onClick={() => { if (!isDisabled) setSelected(day === selected ? null : day); }}
                style={{
                  borderRadius: 8, padding: "4px 3px 5px", minHeight: 52,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  background: isBlocked ? "repeating-linear-gradient(135deg, #f9fafb, #f9fafb 4px, #e5e7eb 4px, #e5e7eb 8px)"
                    : isSelected ? "#1B4332" : isToday ? "#F0F4EF" : isPast ? "#f9fafb" : avail.bg,
                  border: isBlocked ? "2px solid #9ca3af"
                    : isSelected ? "2px solid transparent" : isToday ? `2px solid #1B4332` : isPast ? "2px solid #e5e7eb" : `2px solid ${avail.border}`,
                  transition: "all 0.15s",
                  opacity: isBlocked ? 0.65 : isPast ? 0.45 : 1,
                }}
                onMouseEnter={e => { if (!isSelected && !isDisabled) e.currentTarget.style.opacity = "0.8"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = isBlocked ? "0.65" : isPast ? "0.45" : "1"; }}
              >
                <div style={{
                  textAlign: "center", fontSize: 11, fontWeight: isToday ? 700 : 500,
                  color: isBlocked ? "#9ca3af"
                    : isSelected ? "#fff" : isPast ? "#c0c4cc" : isToday ? "#1B4332" : isWeekend ? "#ef4444" : "#374151",
                  marginBottom: 2,
                }}>
                  {day}
                  {isBlocked && <div style={{ fontSize: 8, color: "#9ca3af", fontWeight: 700, marginTop: 1 }}>🚫 Blocked</div>}
                </div>
                {/* Booking dots */}
                {!isBlocked && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                    {dayBookings.slice(0, 3).map((b, bi) => {
                      const statusDotColor = b.status === "Enquiry" ? "#3b82f6"
                        : b.status === "Pending Payment" ? "#f59e0b"
                        : b.status === "Confirmed" ? "#22c55e"
                        : b.status === "Completed" ? "#9ca3af"
                        : "#ef4444";
                      return (
                        <div key={bi} style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: isSelected ? "rgba(255,255,255,0.8)" : statusDotColor,
                        }} title={`${b.customerName} — ${b.status}`} />
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <span style={{ fontSize: 7, color: isSelected ? "rgba(255,255,255,0.7)" : "#9ca3af", lineHeight: 1 }}>
                        +{dayBookings.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { color: "#22c55e", bg: "#dcfce7",  label: "Available" },
              { color: "#eab308", bg: "#fef9c3",  label: "Partial" },
              { color: "#ef4444", bg: "#fee2e2",  label: "Full" },
              { color: "#93c5fd", bg: "#dbeafe",  label: "Enquiry only" },
              { color: "#9ca3af", bg: "#f3f4f6",  label: "Blocked" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: item.bg, border: `1.5px solid ${item.color}` }} />
                <span style={{ fontSize: 10, color: "#6b7280" }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { dot: "#3b82f6", label: "Enquiry" },
              { dot: "#f59e0b", label: "Pending" },
              { dot: "#22c55e", label: "Confirmed" },
              { dot: "#9ca3af", label: "Completed" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.dot }} />
                <span style={{ fontSize: 9, color: "#9ca3af" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* ── SIDE PANEL ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Date info */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: 16 }}>
          {selected ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 }}>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
                    {MONTHS[month]} {selected}, {year}
                  </p>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {selectedBookings.length === 0 ? "No bookings" : `${selectedBookings.length} booking${selectedBookings.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, flexShrink: 0 }}
                >
                  <Plus size={12} /> New Enquiry
                </button>
              </div>

              {selectedBookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#d1d5db" }}>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>No bookings on this date</p>
                </div>
              ) : (
                selectedBookings.map(b => {
                  const st = STATUS_STYLE[b.status] || STATUS_STYLE.Enquiry;
                  return (
                    <div key={b.id} style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, gap: 6 }}>
                        <p style={{ fontWeight: 600, fontSize: 11, color: "#111827", margin: 0 }}>{b.customerName}</p>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9, fontWeight: 700, background: st.bg, color: st.color, padding: "2px 6px", borderRadius: 10, flexShrink: 0, whiteSpace: "nowrap" }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: st.dot }} />
                          {b.status}
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>💍 {b.eventType} · {b.hall}</p>
                      <p style={{ fontSize: 10, color: "#6b7280", marginTop: 1, margin: 0 }}>🕐 {b.session} · {b.guests} guests</p>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#1B4332", marginTop: 3, margin: 0 }}>₹{b.totalAmount.toLocaleString()}</p>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>📅</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: 0 }}>Select a date</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Click any day to view bookings</p>
            </div>
          )}
        </div>

        {/* Monthly summary */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: 16 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12, margin: 0 }}>
            {MONTHS[month]} Summary
          </p>
          {(() => {
            const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;
            const mb = visibleCalendarData.filter(b => b.date.startsWith(monthStr));
            return [
              { label: "Total bookings", value: mb.length, color: "#1B4332" },
              { label: "Confirmed",      value: mb.filter(b => b.status === "Confirmed").length, color: "#15803d" },
              { label: "Pending",        value: mb.filter(b => b.status === "Pending Payment").length, color: "#d97706" },
              { label: "Enquiry",        value: mb.filter(b => b.status === "Enquiry").length, color: "#3b82f6" },
              { label: "Revenue",        value: "₹" + mb.filter(b=>b.status==="Confirmed"||b.status==="Completed").reduce((s,b)=>s+b.totalAmount,0).toLocaleString(), color: "#D4A017" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {showModal && selectedDateStr && !blackoutDates.includes(selectedDateStr) && (
        <NewEnquiryModal 
          open={showModal} 
          onClose={() => setShowModal(false)} 
          prefillDate={selectedDateStr} 
          onSuccess={() => {
            setShowModal(false);
            fetchEnquiries();
            if (refetch) refetch();
          }} 
        />
      )}
    </div>
  );
}
