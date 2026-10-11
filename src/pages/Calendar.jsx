import { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, ChevronRight, Plus, Ban, Calendar as CalendarIcon, 
  CheckCircle2, Clock, AlertCircle, Sparkles, Filter, Users, 
  IndianRupee, Building2, Eye, ShieldAlert, ArrowRight
} from "lucide-react";
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
  Confirmed:        { bg: "#dcfce7", color: "#15803d", dot: "#22c55e", label: "Confirmed" },
  "Pending Payment":{ bg: "#fef9c3", color: "#a16207", dot: "#eab308", label: "Pending" },
  Enquiry:          { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6", label: "Enquiry" },
  Completed:        { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af", label: "Completed" },
  Cancelled:        { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444", label: "Cancelled" },
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
  const [allowPastDates, setAllowPastDates] = useState(false);
  const [hallsList, setHallsList] = useState([]);
  const [selectedHallFilter, setSelectedHallFilter] = useState("all");
  const [enquiries, setEnquiries] = useState([]);

  const fetchEnquiries = () => {
    enquiriesAPI.getAll({ limit: 1000 })
      .then(res => {
        const mapped = (res.data.data || [])
          .filter(e => e.status !== "Booking Confirmed" && e.status !== "Lost" && e.status !== "Cancelled" && e.tentativeDate)
          .map(e => ({
            id: `enq-${e.id}`,
            date: e.tentativeDate,
            customerName: e.Customer?.name || e.customerName || e.enquirerName || "Enquiry Lead",
            customerPhone: e.Customer?.phone || e.phone || e.enquirerPhone || "",
            status: "Enquiry",
            eventType: e.eventType || "Event",
            hall: e.hallPreference || "Main Hall",
            session: e.session || "Full Day",
            guests: e.guestCount || 0,
            totalAmount: e.budget || 0,
            enquiryNumber: e.enquiryNumber,
            isWaitlisted: e.isWaitlisted,
          }));
        setEnquiries(mapped);
      })
      .catch(console.error);
  };

  useEffect(() => {
    settingsAPI.get()
      .then(res => { 
        const settings = res.data.data || res.data;
        if (settings?.blackoutDates) setBlackoutDates(settings.blackoutDates);
        if (settings?.allowPastDateBooking) setAllowPastDates(settings.allowPastDateBooking);
        if (settings?.halls && Array.isArray(settings.halls)) {
          setHallsList(settings.halls);
        }
      })
      .catch(console.error);
      
    fetchEnquiries();
  }, []);

  const totalHallsCount = hallsList.length || 3;

  // Filtered dataset according to user hall selection
  const filteredBookings = useMemo(() => {
    if (selectedHallFilter === "all") return bookings;
    return bookings.filter(b => b.hall === selectedHallFilter);
  }, [bookings, selectedHallFilter]);

  const filteredEnquiries = useMemo(() => {
    if (selectedHallFilter === "all") return enquiries;
    return enquiries.filter(e => e.hall === selectedHallFilter);
  }, [enquiries, selectedHallFilter]);

  const allCalendarData = useMemo(() => [...bookings, ...enquiries], [bookings, enquiries]);
  const visibleCalendarData = useMemo(() => [...filteredBookings, ...filteredEnquiries], [filteredBookings, filteredEnquiries]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const todayStr    = now.toISOString().split("T")[0];

  const prev = () => { 
    if (month === 0) { setMonth(11); setYear(y => y-1); } 
    else setMonth(m => m-1); 
  };
  const next = () => { 
    if (month === 11){ setMonth(0);  setYear(y => y+1); } 
    else setMonth(m => m+1); 
  };
  const goToToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelected(now.getDate());
  };

  const getDayDateStr = (day) => `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const selectedDateStr = selected ? getDayDateStr(selected) : null;
  const selectedDayItems = selected ? visibleCalendarData.filter(b => b.date === selectedDateStr) : [];

  // Monthly aggregated statistics
  const monthStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month+1).padStart(2,"0")}`;
    const itemsInMonth = visibleCalendarData.filter(b => b.date?.startsWith(monthPrefix));
    const confirmed = itemsInMonth.filter(b => b.status === "Confirmed").length;
    const pending = itemsInMonth.filter(b => b.status === "Pending Payment").length;
    const enqs = itemsInMonth.filter(b => b.status === "Enquiry").length;
    const revenue = itemsInMonth
      .filter(b => b.status === "Confirmed" || b.status === "Completed")
      .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

    return { total: itemsInMonth.length, confirmed, pending, enqs, revenue };
  }, [visibleCalendarData, year, month]);

  // The beloved vibrant color model for the date box
  const availColor = (day) => {
    const dateStr = getDayDateStr(day);
    if (blackoutDates.includes(dateStr)) {
      return { bg: "#f3f4f6", border: "#d1d5db", label: "Blocked", badgeBg: "#e5e7eb", badgeColor: "#6b7280" };
    }
    const dayBookings = allCalendarData.filter(b => b.date === dateStr);
    const activeBookings = dayBookings.filter(b => b.status !== "Enquiry" && b.status !== "Cancelled");
    
    // Only enquiries → Beautiful sky blue
    if (dayBookings.length > 0 && activeBookings.length === 0) {
      return { 
        bg: "#dbeafe", 
        border: "#93c5fd", 
        label: "Enquiry", 
        badgeBg: "#bfdbfe", 
        badgeColor: "#1d4ed8",
        pill: `${dayBookings.length} Enquiry`
      };
    }
    
    const uniqueHalls = new Set(activeBookings.map(b => b.hall)).size;
    
    // 0 halls booked → Vibrant green (fully open)
    if (uniqueHalls === 0) {
      return { 
        bg: "#dcfce7", 
        border: "#22c55e", 
        label: "Available", 
        badgeBg: "#bbf7d0", 
        badgeColor: "#15803d",
        pill: "Available"
      };
    }
    
    // Partial halls booked → Warm yellow / amber
    if (uniqueHalls < totalHallsCount) {
      return { 
        bg: "#fef9c3", 
        border: "#eab308", 
        label: "Partial", 
        badgeBg: "#fef08a", 
        badgeColor: "#a16207",
        pill: `${uniqueHalls}/${totalHallsCount} Booked`
      };
    }
    
    // All halls booked → Soft Red (full)
    return { 
      bg: "#fee2e2", 
      border: "#ef4444", 
      label: "Full", 
      badgeBg: "#fecaca", 
      badgeColor: "#b91c1c",
      pill: "Full"
    };
  };

  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="hm-calendar-layout" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── CALENDAR CARD ── */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        
        {/* Month Navigation & Controls Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={prev} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={goToToday}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#1B4332" }}
            >
              Today
            </button>
            <button onClick={next} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
              <ChevronRight size={16} />
            </button>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 0 6px" }}>
              {MONTHS[month]} {year}
            </h2>
          </div>

          {/* Hall Filter Select */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
              <Filter size={12} /> Hall:
            </span>
            <select
              value={selectedHallFilter}
              onChange={(e) => setSelectedHallFilter(e.target.value)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#1e293b",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">🏢 All Halls ({totalHallsCount})</option>
              {hallsList.length > 0 ? (
                hallsList.map((h, idx) => (
                  <option key={idx} value={h.name || h}>{h.name || h}</option>
                ))
              ) : (
                <>
                  <option value="Main Hall">Main Hall</option>
                  <option value="Mini Hall">Mini Hall</option>
                  <option value="Open Stage">Open Stage</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "10px 10px 4px" }}>
          {WEEKDAYS.map((d, i) => (
            <div key={d} style={{ textAlign: "center", padding: "4px 0", fontSize: 10, fontWeight: 800, color: i === 0 || i === 6 ? "#ef4444" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells with Beautiful Full-Card Colored Backgrounds */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 10px 14px", gap: 6 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} style={{ minHeight: 64 }} />;
            const dateStr = getDayDateStr(day);
            const isToday      = dateStr === todayStr;
            const isSelected   = day === selected;
            const isWeekend    = [0, 6].includes((firstDay + day - 1) % 7);
            const isBlocked    = blackoutDates.includes(dateStr);
            const isPast       = new Date(dateStr) < new Date(todayStr);
            const isDisabled   = isBlocked || (isPast && !allowPastDates);
            const avail        = availColor(day);
            const dayBookings  = visibleCalendarData.filter(b => b.date === dateStr);

            return (
              <div key={`day-${day}`}
                onClick={() => { if (!isDisabled) setSelected(day === selected ? null : day); }}
                style={{
                  borderRadius: 10,
                  padding: "6px 5px 6px",
                  minHeight: 68,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  background: isBlocked ? "repeating-linear-gradient(135deg, #f9fafb, #f9fafb 4px, #e5e7eb 4px, #e5e7eb 8px)"
                    : isSelected ? "#1B4332" 
                    : isPast ? "#f8fafc" 
                    : avail.bg,
                  border: isBlocked ? "2px solid #9ca3af"
                    : isSelected ? "2px solid #1B4332" 
                    : isToday ? `2.5px solid #1B4332` 
                    : isPast ? "1.5px solid #e2e8f0" 
                    : `2px solid ${avail.border}`,
                  transition: "all 0.15s ease",
                  opacity: isBlocked ? 0.65 : isPast ? 0.55 : 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isSelected ? "0 4px 14px rgba(27,67,50,0.3)" : "none",
                }}
                onMouseEnter={e => { if (!isSelected && !isDisabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { if (!isSelected && !isDisabled) e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {/* Top row: day number & status pill */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: isToday ? 900 : 700,
                    color: isBlocked ? "#9ca3af"
                      : isSelected ? "#fff" 
                      : isPast ? "#94a3b8" 
                      : isToday ? "#1B4332" 
                      : isWeekend ? "#dc2626" 
                      : "#1e293b",
                  }}>
                    {day}
                  </span>

                  {/* Status chip pill */}
                  {!isBlocked && (
                    <span style={{
                      fontSize: 8,
                      fontWeight: 800,
                      padding: "1px 4px",
                      borderRadius: 4,
                      background: isSelected ? "rgba(255,255,255,0.2)" : avail.badgeBg,
                      color: isSelected ? "#fff" : avail.badgeColor,
                      lineHeight: 1.2,
                    }}>
                      {avail.pill}
                    </span>
                  )}
                  {isBlocked && (
                    <span style={{ fontSize: 8, fontWeight: 800, color: "#9ca3af" }}>🚫</span>
                  )}
                </div>

                {/* Day content: Preview of booked client name or dots */}
                {!isBlocked && (
                  <div style={{ marginTop: 2 }}>
                    {dayBookings.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {dayBookings.slice(0, 1).map((b, bi) => (
                          <div 
                            key={bi} 
                            style={{ 
                              fontSize: 9, 
                              fontWeight: 700, 
                              color: isSelected ? "#fff" : "#1e293b",
                              whiteSpace: "nowrap", 
                              overflow: "hidden", 
                              textOverflow: "ellipsis",
                              lineHeight: 1.2,
                              background: isSelected ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                              padding: "1px 3px",
                              borderRadius: 3,
                            }}
                            title={`${b.customerName} (${b.status})`}
                          >
                            {b.status === "Confirmed" ? "👑" : "💬"} {b.customerName}
                          </div>
                        ))}
                        {dayBookings.length > 1 && (
                          <span style={{ fontSize: 8, fontWeight: 800, color: isSelected ? "rgba(255,255,255,0.8)" : "#64748b", lineHeight: 1 }}>
                            +{dayBookings.length - 1} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ height: 12 }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", background: "#fafcfb" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { color: "#22c55e", bg: "#dcfce7",  label: "Available (Free)" },
              { color: "#eab308", bg: "#fef9c3",  label: "Partial (Some halls free)" },
              { color: "#ef4444", bg: "#fee2e2",  label: "Full (All booked)" },
              { color: "#93c5fd", bg: "#dbeafe",  label: "Enquiry only" },
              { color: "#9ca3af", bg: "#f3f4f6",  label: "Blocked" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.bg, border: `1.5px solid ${item.color}` }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#64748b" }}>
            Click any colored date to inspect details or book.
          </div>
        </div>

      </div>

      {/* ── SIDE PANEL ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Selected Date Details Card */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: 18, border: "1px solid #e2e8f0" }}>
          {selected ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
                    {MONTHS[month]} {selected}, {year}
                  </p>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {selectedDayItems.length === 0 ? "✨ No bookings on this date" : `${selectedDayItems.length} active item${selectedDayItems.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, flexShrink: 0, boxShadow: "0 2px 6px rgba(27,67,50,0.25)" }}
                >
                  <Plus size={13} /> New Enquiry
                </button>
              </div>

              {selectedDayItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1" }}>
                  <CalendarIcon size={24} color="#94a3b8" style={{ margin: "0 auto 6px" }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: 0 }}>Date is Available!</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 10px" }}>Ready for new bookings.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    style={{ background: "#fff", border: "1px solid #1B4332", color: "#1B4332", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}
                  >
                    Add Booking / Enquiry
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
                  {selectedDayItems.map(b => {
                    const st = STATUS_STYLE[b.status] || STATUS_STYLE.Enquiry;
                    return (
                      <div key={b.id} style={{ padding: "10px", background: "#f8fafc", border: `1.5px solid ${st.bg}`, borderRadius: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, gap: 6 }}>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 13, color: "#111827", margin: 0 }}>{b.customerName}</p>
                            {b.customerPhone && <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>📞 {b.customerPhone}</p>}
                          </div>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, background: st.bg, color: st.color, padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />
                            {b.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 4, background: "#fff", padding: "6px 8px", borderRadius: 6, border: "1px solid #f1f5f9" }}>
                          <div>🏛️ <strong>Hall:</strong> {b.hall || "Main Hall"} · 🕐 {b.session || "Session"}</div>
                          <div>💍 <strong>Event:</strong> {b.eventType || "Event"} · 👥 {b.guests || 0} guests</div>
                        </div>
                        {b.totalAmount > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Amount:</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#1B4332" }}>₹{Number(b.totalAmount).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "28px 12px" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <CalendarIcon size={22} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#374151", margin: 0 }}>Select a Date</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Click any colored day to view bookings or add enquiries</p>
            </div>
          )}
        </div>

        {/* Monthly Summary Card */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: 18, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
              {MONTHS[month]} Summary
            </h4>
            <span style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: 4 }}>
              Monthly
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#f8fafc", borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>Total Bookings</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1B4332" }}>{monthStats.total}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>Confirmed</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#15803d" }}>{monthStats.confirmed}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#fef9c3", borderRadius: 6, border: "1px solid #fde047" }}>
              <span style={{ fontSize: 11, color: "#a16207", fontWeight: 600 }}>Pending</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#a16207" }}>{monthStats.pending}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#dbeafe", borderRadius: 6, border: "1px solid #bfdbfe" }}>
              <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>Enquiry</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1d4ed8" }}>{monthStats.enqs}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "linear-gradient(135deg, #1B4332, #2d6a4f)", color: "#fff", borderRadius: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>Revenue</span>
              <span style={{ fontSize: 13, fontWeight: 800 }}>₹{monthStats.revenue.toLocaleString()}</span>
            </div>
          </div>
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


