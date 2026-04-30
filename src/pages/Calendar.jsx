import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { hallColors } from "../data/dummyData";
import BookingModal from "../components/BookingModal";
import { useBookings } from "../context/BookingsContext";

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
  const { bookings } = useBookings();
  const [year,  setYear]        = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const todayStr    = now.toISOString().split("T")[0];

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const next = () => { if (month === 11){ setMonth(0);  setYear(y => y+1); } else setMonth(m => m+1); };

  const bookingsOnDay = (day) => {
    const d = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return bookings.filter(b => b.date === d);
  };

  const selectedDateStr = selected
    ? `${year}-${String(month+1).padStart(2,"0")}-${String(selected).padStart(2,"0")}`
    : null;
  const selectedBookings = selected ? bookingsOnDay(selected) : [];

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
    const dayBookings = bookingsOnDay(day).filter(b => b.status !== "Enquiry");
    const uniqueHalls = new Set(dayBookings.map(b => b.hall)).size;
    if (uniqueHalls === 0) return { bg: "#dcfce7", border: "#22c55e", label: "Available" };
    if (uniqueHalls < TOTAL_HALLS) return { bg: "#fef9c3", border: "#eab308", label: "Partial" };
    return { bg: "#fee2e2", border: "#ef4444", label: "Full" };
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

      {/* ── CALENDAR CARD ── */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <button onClick={prev} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#111827" }}>
            {MONTHS[month]} {year}
          </h2>
          <button onClick={next} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 16px" }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ textAlign: "center", padding: "10px 0 6px", fontSize: 11, fontWeight: 700, color: d === "Sun" || d === "Sat" ? "#ef4444" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 12px 16px", gap: 3 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dayBookings = bookingsOnDay(day);
            const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday    = dateStr === todayStr;
            const isSelected = day === selected;
            const isWeekend  = [0, 6].includes((firstDay + day - 1) % 7);
            const avail      = availColor(day);

            return (
              <div key={day} onClick={() => setSelected(day === selected ? null : day)}
                style={{
                  borderRadius: 10, padding: "6px 4px 8px", cursor: "pointer", minHeight: 62,
                  background: isSelected ? "#1B4332" : isToday ? "#F0F4EF" : avail.bg,
                  border: isSelected ? "2px solid transparent" : isToday ? `2px solid #1B4332` : `2px solid ${avail.border}`,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.opacity = "0.8"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                <div style={{
                  textAlign: "center", fontSize: 13, fontWeight: isToday ? 800 : 500,
                  color: isSelected ? "#fff" : isToday ? "#1B4332" : isWeekend ? "#ef4444" : "#374151",
                  marginBottom: 4,
                }}>
                  {day}
                </div>
                {/* Booking dots */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
                  {dayBookings.slice(0, 3).map((b, bi) => (
                    <div key={bi} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: isSelected ? "rgba(255,255,255,0.8)" : (hallColorMap[b.hall] || "#1B4332"),
                    }} title={b.customerName} />
                  ))}
                  {dayBookings.length > 3 && (
                    <span style={{ fontSize: 9, color: isSelected ? "rgba(255,255,255,0.7)" : "#9ca3af", lineHeight: 1 }}>
                      +{dayBookings.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { color: "#22c55e", bg: "#dcfce7", label: "Available" },
            { color: "#eab308", bg: "#fef9c3", label: "Partially Booked" },
            { color: "#ef4444", bg: "#fee2e2", label: "Fully Booked" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: item.bg, border: `2px solid ${item.color}` }} />
              <span style={{ fontSize: 11, color: "#6b7280" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SIDE PANEL ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Date info */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: 20 }}>
          {selected ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827" }}>
                    {MONTHS[month]} {selected}, {year}
                  </p>
                  <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                    {selectedBookings.length === 0 ? "No bookings" : `${selectedBookings.length} booking${selectedBookings.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  <Plus size={13} /> Add
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
                    <div key={b.id} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{b.customerName}</p>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color, padding: "2px 8px", borderRadius: 12 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />
                          {b.status}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "#6b7280" }}>💍 {b.eventType} · {b.hall}</p>
                      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>🕐 {b.session} · {b.guests} guests</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1B4332", marginTop: 4 }}>₹{b.totalAmount.toLocaleString()}</p>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: 28, marginBottom: 10 }}>📅</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Select a date</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Click any day to view bookings</p>
            </div>
          )}
        </div>

        {/* Monthly summary */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: 20 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14 }}>
            {MONTHS[month]} Summary
          </p>
          {(() => {
            const monthStr = `${year}-${String(month+1).padStart(2,"0")}`;
            const mb = bookings.filter(b => b.date.startsWith(monthStr));
            return [
              { label: "Total bookings", value: mb.length, color: "#1B4332" },
              { label: "Confirmed",      value: mb.filter(b => b.status === "Confirmed").length, color: "#15803d" },
              { label: "Pending",        value: mb.filter(b => b.status === "Pending Payment").length, color: "#b45309" },
              { label: "Revenue",        value: "₹" + mb.filter(b=>b.status==="Confirmed"||b.status==="Completed").reduce((s,b)=>s+b.totalAmount,0).toLocaleString(), color: "#D4A017" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {showModal && <BookingModal onClose={() => setShowModal(false)} prefillDate={selectedDateStr} />}
    </div>
  );
}
