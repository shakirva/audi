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
  Confirmed:        { bg: "#dcfce7", color: "#15803d", border: "#86efac", label: "Confirmed" },
  "Pending Payment":{ bg: "#fef9c3", color: "#a16207", border: "#fde047", label: "Pending" },
  Enquiry:          { bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc", label: "Enquiry" },
  Completed:        { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: "Completed" },
  Cancelled:        { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5", label: "Cancelled" },
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

  // Compute availability badge info for a day
  const getDayAvailability = (day) => {
    const dateStr = getDayDateStr(day);
    if (blackoutDates.includes(dateStr)) {
      return { 
        statusKey: "blocked", 
        badgeText: "Blocked", 
        bg: "#f3f4f6", 
        border: "#9ca3af", 
        textColor: "#64748b" 
      };
    }

    const dayItems = allCalendarData.filter(b => b.date === dateStr);
    const activeConfirmed = dayItems.filter(b => b.status !== "Enquiry" && b.status !== "Cancelled");
    const activeEnquiries = dayItems.filter(b => b.status === "Enquiry");

    if (activeConfirmed.length === 0 && activeEnquiries.length === 0) {
      return { 
        statusKey: "free", 
        badgeText: "Available", 
        bg: "#f0fdf4", 
        border: "#86efac", 
        textColor: "#166534" 
      };
    }

    if (activeConfirmed.length === 0 && activeEnquiries.length > 0) {
      return { 
        statusKey: "enquiry", 
        badgeText: `${activeEnquiries.length} Enq`, 
        bg: "#f0f9ff", 
        border: "#bae6fd", 
        textColor: "#0369a1" 
      };
    }

    const bookedHallsCount = new Set(activeConfirmed.map(b => b.hall)).size;
    if (bookedHallsCount >= totalHallsCount) {
      return { 
        statusKey: "full", 
        badgeText: "Fully Booked", 
        bg: "#fef2f2", 
        border: "#fca5a5", 
        textColor: "#991b1b" 
      };
    }

    return { 
      statusKey: "partial", 
      badgeText: `${bookedHallsCount}/${totalHallsCount} Booked`, 
      bg: "#fffbeb", 
      border: "#fde68a", 
      textColor: "#92400e" 
    };
  };

  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="hm-calendar-layout" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── MAIN CALENDAR VIEW ── */}
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        
        {/* Navigation & Controls Bar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: "linear-gradient(to right, #ffffff, #fafcfb)" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", overflow: "hidden" }}>
              <button 
                onClick={prev} 
                style={{ width: 34, height: 34, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155" }}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={goToToday}
                style={{ padding: "0 10px", height: 34, borderLeft: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9", borderTop: "none", borderBottom: "none", background: "#f8fafc", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#1B4332" }}
                title="Go to Today"
              >
                Today
              </button>
              <button 
                onClick={next} 
                style={{ width: 34, height: 34, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155" }}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              {MONTHS[month]} <span style={{ color: "#1B4332" }}>{year}</span>
            </h2>
          </div>

          {/* Hall Filter Pill Select */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

        {/* Weekday Labels Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          {WEEKDAYS.map((d, i) => (
            <div 
              key={d} 
              style={{ 
                textAlign: "center", 
                padding: "10px 4px", 
                fontSize: 11, 
                fontWeight: 800, 
                color: i === 0 || i === 6 ? "#ef4444" : "#475569", 
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day Grid Cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#f1f5f9", padding: 1 }}>
          {cells.map((day, i) => {
            if (!day) {
              return (
                <div 
                  key={`empty-${i}`} 
                  style={{ background: "#fafafa", minHeight: 90, opacity: 0.4 }} 
                />
              );
            }

            const dateStr = getDayDateStr(day);
            const isToday = dateStr === todayStr;
            const isSelected = day === selected;
            const isWeekend = [0, 6].includes((firstDay + day - 1) % 7);
            const isBlocked = blackoutDates.includes(dateStr);
            const isPast = new Date(dateStr) < new Date(todayStr);
            const isDisabled = isBlocked || (isPast && !allowPastDates);
            const avail = getDayAvailability(day);
            const dayItems = visibleCalendarData.filter(b => b.date === dateStr);

            return (
              <div 
                key={`day-${day}`}
                onClick={() => {
                  if (!isDisabled) {
                    setSelected(day === selected ? null : day);
                  }
                }}
                style={{
                  background: isBlocked 
                    ? "repeating-linear-gradient(135deg, #f8fafc, #f8fafc 6px, #e2e8f0 6px, #e2e8f0 12px)"
                    : isSelected 
                      ? "#f0fdf4" 
                      : "#ffffff",
                  minHeight: 92,
                  padding: "6px 8px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  position: "relative",
                  transition: "all 0.15s ease",
                  border: isSelected ? "2px solid #16a34a" : "none",
                  boxShadow: isSelected ? "inset 0 0 0 1px #16a34a" : "none",
                  opacity: isBlocked ? 0.6 : isPast ? 0.65 : 1,
                }}
                onMouseEnter={e => {
                  if (!isSelected && !isDisabled) {
                    e.currentTarget.style.background = "#f8fafc";
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected && !isDisabled) {
                    e.currentTarget.style.background = "#ffffff";
                  }
                }}
              >
                {/* Top Row: Date Number & Availability Status Chip */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span 
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: isToday ? 900 : 700,
                      background: isToday ? "#1B4332" : "transparent",
                      color: isToday ? "#fff" : isWeekend ? "#dc2626" : "#1e293b",
                    }}
                  >
                    {day}
                  </span>

                  {/* Clear Status Chip (No confusing tiny dots) */}
                  {!isBlocked && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: avail.bg,
                        color: avail.textColor,
                        border: `1px solid ${avail.border}`,
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                      }}
                    >
                      {avail.badgeText}
                    </span>
                  )}
                  {isBlocked && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#94a3b8" }}>🚫 Blocked</span>
                  )}
                </div>

                {/* Day Details: Real Event / Customer Preview Badges */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
                  {dayItems.slice(0, 2).map((item, idx) => {
                    const isEnq = item.status === "Enquiry";
                    const isConf = item.status === "Confirmed";
                    return (
                      <div
                        key={idx}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 5px",
                          borderRadius: 4,
                          background: isConf ? "#dcfce7" : isEnq ? "#e0f2fe" : "#fef9c3",
                          color: isConf ? "#15803d" : isEnq ? "#0369a1" : "#a16207",
                          border: `1px solid ${isConf ? "#bbf7d0" : isEnq ? "#bae6fd" : "#fde047"}`,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineHeight: 1.2,
                        }}
                        title={`${item.customerName} (${item.hall || "Hall"} · ${item.session || "Session"})`}
                      >
                        {isConf ? "👑" : isEnq ? "💬" : "⏳"} {item.customerName}
                      </div>
                    );
                  })}
                  {dayItems.length > 2 && (
                    <div style={{ fontSize: 9, fontWeight: 800, color: "#166534", paddingLeft: 2 }}>
                      +{dayItems.length - 2} more event{dayItems.length - 2 > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Small indicator bar at bottom of cell */}
                <div style={{ height: 3, borderRadius: 2, background: isSelected ? "#16a34a" : isToday ? "#1B4332" : "transparent", marginTop: 4 }} />
              </div>
            );
          })}
        </div>

        {/* Explanatory Legend Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Status Guide:</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>Available (Free)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#eab308" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>Partial (Some halls free)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>Fully Booked</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0284c7" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>Enquiry Lead</span>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#64748b" }}>
            Click any date cell to view complete details or add an enquiry.
          </div>
        </div>

      </div>

      {/* ── SIDE PANEL: DATE INSPECTOR & REVENUE SNAPSHOT ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Date Inspector Card */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", padding: 18 }}>
          {selected ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#166534", letterSpacing: "0.05em" }}>
                    Selected Date
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>
                    {MONTHS[month]} {selected}, {year}
                  </h3>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {selectedDayItems.length === 0 ? "✨ All halls are open and available" : `${selectedDayItems.length} active item(s)`}
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 12px",
                    borderRadius: 8,
                    background: "#1B4332",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    boxShadow: "0 2px 6px rgba(27,67,50,0.25)"
                  }}
                >
                  <Plus size={13} /> Add Enquiry
                </button>
              </div>

              {selectedDayItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "26px 12px", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                  <CalendarIcon size={26} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: 0 }}>This date is completely open!</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 12px" }}>Ready to accept new bookings or customer enquiries.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      background: "#fff",
                      border: "1px solid #1B4332",
                      color: "#1B4332",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "6px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Create Booking / Enquiry
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
                  {selectedDayItems.map((b) => {
                    const st = STATUS_STYLE[b.status] || STATUS_STYLE.Enquiry;
                    return (
                      <div 
                        key={b.id} 
                        style={{ 
                          background: "#f8fafc", 
                          border: `1.5px solid ${st.border}`, 
                          borderRadius: 12, 
                          padding: 12,
                          transition: "transform 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>
                              {b.customerName}
                            </div>
                            {b.customerPhone && (
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                📞 {b.customerPhone}
                              </div>
                            )}
                          </div>
                          <span 
                            style={{ 
                              fontSize: 10, 
                              fontWeight: 800, 
                              background: st.bg, 
                              color: st.color, 
                              padding: "2px 8px", 
                              borderRadius: 6,
                              border: `1px solid ${st.border}`
                            }}
                          >
                            {st.label}
                          </span>
                        </div>

                        <div style={{ fontSize: 11, color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 6, background: "#fff", padding: "6px 8px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                          <div><strong>Hall:</strong> {b.hall || "Main Hall"}</div>
                          <div><strong>Session:</strong> {b.session || "Full Day"}</div>
                          <div><strong>Event:</strong> {b.eventType || "Function"}</div>
                          <div><strong>Guests:</strong> {b.guests || 0}</div>
                        </div>

                        {b.totalAmount > 0 && (
                          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Budget / Total:</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#1B4332" }}>
                              ₹{Number(b.totalAmount).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <CalendarIcon size={22} />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Inspect Any Date</h4>
              <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                Click on any calendar day to inspect booked sessions, customer details, and hall availability.
              </p>
            </div>
          )}
        </div>

        {/* Monthly Summary Statistics */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {MONTHS[month]} Overview
            </h4>
            <span style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: 4 }}>
              Monthly
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#475569" }}>Total Entries</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{monthStats.total}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: 12, color: "#166534", display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={13} /> Confirmed Bookings
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>{monthStats.confirmed}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#fef9c3", borderRadius: 8, border: "1px solid #fde047" }}>
              <span style={{ fontSize: 12, color: "#a16207", display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={13} /> Pending Payment
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#a16207" }}>{monthStats.pending}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#e0f2fe", borderRadius: 8, border: "1px solid #bae6fd" }}>
              <span style={{ fontSize: 12, color: "#0369a1", display: "flex", alignItems: "center", gap: 5 }}>
                <Sparkles size={13} /> Active Enquiries
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0369a1" }}>{monthStats.enqs}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "linear-gradient(135deg, #1B4332, #2d6a4f)", color: "#fff", borderRadius: 10, marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Total Month Revenue</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>₹{monthStats.revenue.toLocaleString()}</span>
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

