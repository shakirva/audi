import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, CheckCircle2, X, Play, Images, User, Building2, Calendar, Users } from "lucide-react";
import Logo from "../components/Logo";
import { useParams } from "react-router-dom";
import { useToast, ToastProvider } from "../components/Toast";
import { settingsAPI } from "../services/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }

/* ─── Availability logic ─────────────────────────────
  MUST MATCH ERP Calendar.jsx exactly:
  green  = no halls booked (fully available)
  yellow = some halls booked but not all (partial)
  red    = ALL halls booked (fully booked)
  blue   = only enquiries, no confirmed bookings
  gray   = past / blocked date
─────────────────────────────────────────────────────── */
function getDayStatus(dateStr, bookings, blackoutDates = [], totalHalls = 3) {
  if (blackoutDates.includes(dateStr)) return "blocked";
  const today = new Date().toISOString().split("T")[0];
  if (dateStr < today) return "past";
  const dayBookings = bookings.filter(b => b.date && b.date.startsWith(dateStr) && b.status !== "Cancelled");
  if (dayBookings.length === 0) return "available";

  // Active = everything except enquiry-only statuses
  const activeBookings = dayBookings.filter(b => b.status !== "Enquiry" && b.status !== "New Enquiry");

  // Only enquiries on this day → blue
  if (dayBookings.length > 0 && activeBookings.length === 0) return "enquiry";

  // Count unique halls booked (same logic as ERP Calendar.jsx)
  const uniqueHalls = new Set(activeBookings.map(b => b.hall)).size;
  if (uniqueHalls === 0) return "available";
  if (uniqueHalls < totalHalls) return "partial";
  return "full";
}

const STATUS_COLORS = {
  available: { bg: "#dcfce7", border: "#22c55e", text: "#15803d", dot: "#22c55e", label: "Available" },
  partial:   { bg: "#fef9c3", border: "#eab308", text: "#a16207", dot: "#eab308", label: "Partial"   },
  full:      { bg: "#fee2e2", border: "#ef4444", text: "#b91c1c", dot: "#ef4444", label: "Full"       },
  enquiry:   { bg: "#dbeafe", border: "#93c5fd", text: "#1d4ed8", dot: "#3b82f6", label: "Enquiry"     },
  past:      { bg: "#f9fafb", border: "#e5e7eb", text: "#c0c4cc", dot: "#d1d5db", label: "Past"       },
  blocked:   { bg: "repeating-linear-gradient(135deg, #f9fafb, #f9fafb 4px, #e5e7eb 4px, #e5e7eb 8px)", border: "#9ca3af", text: "#9ca3af", dot: "#9ca3af", label: "Blocked" },
};

const GALLERY_CATEGORIES = ["All", "Halls", "Events", "Decor"];

/* ── Lightbox ── */
function Lightbox({ item, onClose, onPrev, onNext }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 20, right: 20, width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 10 }}
      >
        <X size={20} />
      </button>

      {/* Prev */}
      <button
        onClick={e => { e.stopPropagation(); onPrev(); }}
        style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 10 }}
      >
        <ChevronLeft size={22} />
      </button>

      {/* Content */}
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {item.type === "image" ? (
          <img src={item.src} alt={item.label} style={{ maxWidth: "88vw", maxHeight: "72vh", borderRadius: 16, objectFit: "contain", boxShadow: "0 20px 80px rgba(0,0,0,0.6)" }} />
        ) : (
          <iframe
            src={item.src + "?autoplay=1"}
            title={item.label}
            allow="autoplay; fullscreen"
            style={{ width: "min(800px, 88vw)", height: "min(450px, 50vw)", borderRadius: 16, border: "none" }}
          />
        )}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{item.label}</p>
          <p style={{ fontSize: 12, color: "#D4A017", marginTop: 2 }}>{item.category}</p>
        </div>
      </div>

      {/* Next */}
      <button
        onClick={e => { e.stopPropagation(); onNext(); }}
        style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 10 }}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

/* ── Gallery Section ── */
function GallerySection({ galleryItems, phone, venueName }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const filtered = activeCategory === "All" ? galleryItems : galleryItems.filter(g => g.category === activeCategory);

  const open = (i) => setLightboxIdx(i);
  const close = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx(i => (i - 1 + filtered.length) % filtered.length);
  const next = () => setLightboxIdx(i => (i + 1) % filtered.length);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto 56px", padding: "0 16px" }}>

      {/* Section heading */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 20, padding: "4px 12px", marginBottom: 10 }}>
          <Images size={12} color="#D4A017" />
          <span style={{ fontSize: 9, fontWeight: 700, color: "#D4A017", letterSpacing: "0.08em", textTransform: "uppercase" }}>Gallery</span>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>
          A Glimpse of <span style={{ color: "#D4A017" }}>Our Venue</span>
        </h2>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 6, margin: 0 }}>
          Real events at {venueName || "Venueza Auditorium"}
        </p>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {GALLERY_CATEGORIES.map(cat => {
          const active = cat === activeCategory;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? "#D4A017" : "rgba(255,255,255,0.2)"}`,
              background: active ? "#D4A017" : "rgba(255,255,255,0.06)",
              color: active ? "#0D2418" : "rgba(255,255,255,0.7)",
              fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
              fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
            }}>
              {cat === "Videos" ? "🎬 " : cat === "Halls" ? "🏛️ " : cat === "Events" ? "🎉 " : cat === "Decor" ? "🌸 " : ""}{cat}
            </button>
          );
        })}
      </div>

      {/* Masonry-style grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gridAutoRows: "200px",
        gridAutoFlow: "dense",
        gap: 12,
      }}>
        {filtered.map((item, i) => (
          <div
            key={i}
            onClick={() => open(i)}
            style={{
              position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer",
              gridRow: "span 1",
              gridColumn: "span 1",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)"; e.currentTarget.style.borderColor = "rgba(212,160,23,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            {/* Thumbnail */}
            <img
              src={item.type === "video" ? item.thumb : item.src}
              alt={item.label}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />

            {/* Gradient overlay */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }} />

            {/* Play icon for videos */}
            {item.type === "video" && (
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(212,160,23,0.9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}>
                <Play size={14} fill="#0D2418" color="#0D2418" style={{ marginLeft: 2 }} />
              </div>
            )}

            {/* Category badge */}
            <div style={{ position: "absolute", top: 8, left: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(212,160,23,0.85)", color: "#0D2418", padding: "2px 8px", borderRadius: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.category}
              </span>
            </div>

            {/* Label */}
            <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA strip */}
      <div style={{ textAlign: "center", marginTop: 28 }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          Want to see more? Visit us or call{" "}
          <a href={`tel:${phone}`} style={{ color: "#D4A017", textDecoration: "none", fontWeight: 700 }}>{phone}</a>
          {" "}for a live tour.
        </p>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox item={filtered[lightboxIdx]} onClose={close} onPrev={prev} onNext={next} />
      )}
    </div>
  );
}

function EnquiryForm({ dateStr, onClose, onSubmit, eventTypes, sessions, halls }) {
  const defaultEvent = eventTypes?.[0] ? (typeof eventTypes[0] === 'string' ? eventTypes[0] : eventTypes[0].name) : "Wedding";
  const defaultSession = sessions?.find(s => s.name === "Full Day")?.name || sessions?.[0]?.name || "Morning";
  const defaultHall = halls?.[0]?.name || "";
  
  const [form, setForm] = useState({ name: "", phone: "", gender: "Male", place: "", address: "", eventType: defaultEvent, session: defaultSession, hallPreference: defaultHall, guests: "", budget: "", notes: "" });
  const [userEditedBudget, setUserEditedBudget] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const iStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151", background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
  const labelSt = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };

  // Auto-calculate budget logic
  const getCalculatedPrice = () => {
    const h = (halls || []).find(x => x.name === form.hallPreference);
    if (!h) return 0;

    if (h.pricingType === "slab" && h.slabs && h.slabs.length > 0) {
      const g = Number(form.guests) || 0;
      const sortedSlabs = [...h.slabs].sort((a, b) => a.guests - b.guests);
      const matchedSlab = sortedSlabs.find(s => g <= s.guests);
      if (matchedSlab) {
        return matchedSlab.totalAmount;
      } else {
        return sortedSlabs[sortedSlabs.length - 1].totalAmount;
      }
    } else if (h.pricingType === "per_pax") {
      const g = Number(form.guests) || 0;
      return (h.pricePerPax || 0) * g;
    } else {
      return h.price || 0;
    }
  };

  useEffect(() => {
    const price = getCalculatedPrice();
    if (price > 0 && !userEditedBudget) {
      set("budget", price);
    }
  }, [form.hallPreference, form.guests, form.session, halls, userEditedBudget]);

  // Calculate available sessions based on selected Hall and Event Type
  const getAvailableSessions = () => {
    let available = (sessions || []).map(s => s.name);
    
    // Filter by selected hall
    const selectedHall = (halls || []).find(h => h.name === form.hallPreference);
    if (selectedHall && selectedHall.allowedSessions && selectedHall.allowedSessions.length > 0) {
      available = available.filter(s => selectedHall.allowedSessions.includes(s));
    }
    
    // Filter by selected event type
    const selectedEvent = (eventTypes || []).find(et => (typeof et === 'string' ? et : et.name) === form.eventType);
    if (selectedEvent && typeof selectedEvent !== 'string' && selectedEvent.sessions && selectedEvent.sessions.length > 0) {
      const eventSessionNames = selectedEvent.sessions.map(s => s.name);
      available = available.filter(s => eventSessionNames.includes(s));
    }
    
    return available;
  };

  const handleHallChange = (hallName) => {
    set("hallPreference", hallName);
    setUserEditedBudget(false);
    const selectedHall = (halls || []).find(h => h.name === hallName);
    if (selectedHall && selectedHall.allowedSessions && selectedHall.allowedSessions.length > 0) {
      if (!selectedHall.allowedSessions.includes(form.session)) {
        set("session", selectedHall.allowedSessions[0]);
      }
    }
  };

  const handleEventTypeChange = (e) => {
    const newEventType = e.target.value;
    set("eventType", newEventType);
    
    const selectedEvent = (eventTypes || []).find(et => (typeof et === 'string' ? et : et.name) === newEventType);
    if (selectedEvent && typeof selectedEvent !== 'string' && selectedEvent.sessions && selectedEvent.sessions.length > 0) {
      const eventSessionNames = selectedEvent.sessions.map(s => s.name);
      if (!eventSessionNames.includes(form.session)) {
        set("session", eventSessionNames[0]);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.hallPreference) return;
    onSubmit(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.25)", width: "100%", maxWidth: 620, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>New Enquiry</h3>
            <p style={{ fontSize: 12, color: "rgba(212,160,23,0.9)", margin: "3px 0 0" }}>
              Capture lead details — booking can be done later
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* Customer Info */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <User size={12} /> Enquirer Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Enquired By *</label>
                  <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Muhammed Rafi" required style={iStyle} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Phone Number *</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="e.g. 9447012345" type="tel" maxLength={10} required style={iStyle} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Gender *</label>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)} required style={{ ...iStyle, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    <option value="" disabled>-- Select --</option>
                    {["Male", "Female", "Other"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Place / Area *</label>
                  <input value={form.place} onChange={e => set("place", e.target.value)} placeholder="e.g. Kannur" required style={iStyle} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
              <div>
                <label style={labelSt}>Address *</label>
                <textarea value={form.address} onChange={e => set("address", e.target.value)} rows={2} placeholder="House / Building, Street, Town..." required style={{ ...iStyle, resize: "none" }} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>

            {/* Hall & Session */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={12} /> Hall & Session *
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                {(halls || []).map((h, i) => {
                  const themes = [{ icon: "🏛️", bg: "#fafafa" }, { icon: "🏠", bg: "#fffaf0" }, { icon: "✨", bg: "#f8fafc" }, { icon: "🎪", bg: "#fdf4ff" }, { icon: "🏰", bg: "#eff6ff" }];
                  const t = themes[i % themes.length];
                  const isSelected = form.hallPreference === h.name;
                  return (
                    <div key={h.name} onClick={() => handleHallChange(h.name)} style={{ position: "relative", flex: 1, minWidth: 140, padding: "18px 12px", borderRadius: 12, border: `1.5px solid ${isSelected ? "#1B4332" : "#e5e7eb"}`, background: isSelected ? "#f0faf4" : t.bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#111", textAlign: "center" }}>{h.name}</div>
                      {(Number(h.price) > 0 || Number(h.pricePerPax) > 0 || h.pricingType === "slab") && (
                        <div style={{ fontSize: 10, color: "#6b7280", textAlign: "center" }}>
                          {h.pricingType === "per_pax" ? `₹${h.pricePerPax} / pax` : h.pricingType === "slab" ? "Slab-Based Pricing" : `₹${h.price} / session`}
                        </div>
                      )}
                      {h.capacity > 0 && <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center" }}>Up to {h.capacity} guests</div>}
                      {isSelected && <div style={{ position: "absolute", bottom: 10, left: 10 }}><CheckCircle2 size={16} color="#1B4332" /></div>}
                    </div>
                  );
                })}
              </div>

              <label style={labelSt}>SESSION *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {(() => {
                  const availableSessions = getAvailableSessions();
                  if (availableSessions.length === 0) {
                    return <div style={{ fontSize: 13, color: "#ef4444", padding: "8px 0" }}>No sessions available for the selected Hall and Event Type combination.</div>;
                  }
                  return (sessions || []).filter(s => availableSessions.includes(s.name)).map(s => (
                    <div key={s.name} onClick={() => set("session", s.name)} style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 8, border: `1.5px solid ${form.session === s.name ? "#1B4332" : "#e5e7eb"}`, background: form.session === s.name ? "#1B4332" : "#fff", color: form.session === s.name ? "#fff" : "#374151", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s.name}</div>
                      {s.time && <div style={{ fontSize: 10, opacity: form.session === s.name ? 0.9 : 0.6 }}>{s.time}</div>}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Event Details */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={12} /> Event Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Event Type *</label>
                  <select value={form.eventType} onChange={handleEventTypeChange} required style={{ ...iStyle, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    <option value="" disabled>-- Select --</option>
                    {(eventTypes || []).map(t => (typeof t === "string" ? t : t.name)).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Event Date *</label>
                  <div style={{ ...iStyle, background: "#f9fafb", display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={14} color="#6b7280" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{new Date(dateStr).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={12} /> Details
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelSt}>Est. Guests *</label>
                  <input type="number" value={form.guests} onChange={e => set("guests", e.target.value)} placeholder="e.g. 400" required style={iStyle} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Est. Budget (₹)</label>
                  <input type="number" value={form.budget} onChange={e => { set("budget", e.target.value); setUserEditedBudget(true); }} placeholder="e.g. 150000" style={iStyle} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
              {getCalculatedPrice() > 0 && (
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "#f0faf4", border: "1px solid #d1fae5", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
                    💡 {form.hallPreference} — {form.session}: ₹{getCalculatedPrice().toLocaleString()} (auto-calculated)
                  </span>
                </div>
              )}
            </div>

            <button type="submit" style={{ padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(27,67,50,0.35)", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CheckCircle2 size={18} /> Save Enquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
function PublicBookingInner() {
  const { slug } = useParams();
  const { addToast } = useToast();
  
  const [venueInfo, setVenueInfo] = useState({ name: "Loading...", location: "", phone: "", halls: [], gallery: [], bookings: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getPublic(slug).then(res => {
      setVenueInfo(res.data.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [slug]);

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const todayStr    = now.toISOString().split("T")[0];

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleDayClick = (day) => {
    const ds = getDateStr(day);
    if (ds < todayStr) return;
    const status = getDayStatus(ds, venueInfo.bookings || [], venueInfo.blackoutDates || [], halls.length || 3);
    if (status === "blocked") return;
    if (status === "full") { addToast("This date is fully booked. Please choose another date.", "error"); return; }
    setSelectedDate(ds);
    setShowForm(true);
  };

  const handleSubmit = async (form) => {
    try {
      await settingsAPI.createPublicEnquiry(slug, {
        customerName: form.name,
        phone: form.phone,
        gender: form.gender,
        place: form.place,
        address: form.address,
        eventType: form.eventType,
        date: selectedDate,
        session: form.session,
        guests: form.guests,
        budget: form.budget,
        notes: form.notes,
        hallPreference: form.hallPreference
      });
    } catch (err) {
      console.error("Failed to save enquiry:", err);
      addToast("Failed to save enquiry. Please try again.", "error");
      return;
    }

    const msg = encodeURIComponent(
      `🏛️ *New Booking Enquiry*\n\n👤 Name: ${form.name}\n📞 Phone: ${form.phone}\n📅 Date: ${new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n🎉 Event: ${form.eventType}\n🕐 Session: ${form.session}\n👥 Guests: ${form.guests || "Not specified"}\n💰 Budget: ${form.budget ? `₹${form.budget}` : "Not specified"}\n📝 Notes: ${form.notes || "None"}\n\nPlease confirm availability. Thank you!`
    );
    const formattedPhone = venueInfo.phone ? venueInfo.phone.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, "_blank");
    setShowForm(false);
    setSubmitted(true);
    addToast("Enquiry sent successfully! We'll confirm shortly. 🎉", "success");
  };

  // Count bookings per day for the current month
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthBookings = (venueInfo.bookings || []).filter(b => b.date.startsWith(monthStr) && b.status !== "Cancelled");

  const halls = venueInfo.halls || [];

  if (loading) return <div style={{ minHeight: "100vh", background: "#0D2418", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading venue info...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0D2418 0%, #1B4332 40%, #2D6A4F 100%)", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={38} bgColor="#D4A017" iconColor="#0D2418" />
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{venueInfo.name}</p>
            <p style={{ fontSize: 11, color: "#D4A017", margin: 0 }}>📍 {venueInfo.location}</p>
          </div>
        </div>
        <a href={`tel:${venueInfo.phone}`} style={{ padding: "8px 18px", borderRadius: 20, border: "1.5px solid #D4A017", background: "transparent", color: "#D4A017", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          📞 {venueInfo.phone}
        </a>
      </nav>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", padding: "40px 24px 32px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
          Check Availability &<br />
          <span style={{ color: "#D4A017" }}>Book Your Event</span>
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>
          Click any available date to send us an enquiry. We will confirm soon and update soon.
        </p>
      </div>

      {/* ── HALL CARDS ── */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", padding: "0 24px 32px" }}>
        {halls.map(h => (
          <div key={h.name} style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "14px 20px", border: "1px solid rgba(255,255,255,0.15)", minWidth: 160 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{h.name}</p>
            <p style={{ fontSize: 11, color: "#D4A017", marginTop: 4 }}>👥 Up to {h.capacity} guests</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>💰 ₹{h.pricePerSession?.toLocaleString()}/session</p>
          </div>
        ))}
      </div>

      {/* ── CALENDAR CARD ── */}
      <div style={{ maxWidth: 780, margin: "0 auto 40px", padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 32px 80px rgba(0,0,0,0.4)", overflow: "hidden" }}>

          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid #f3f4f6" }}>
            <button onClick={prev} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>
              {MONTHS[month]} {year}
            </h2>
            <button onClick={next} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Legend — matches ERP calendar style */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, padding: "12px 24px 4px", flexWrap: "wrap" }}>
            {[
              { color: "#22c55e", bg: "#dcfce7",  label: "Available" },
              { color: "#eab308", bg: "#fef9c3",  label: "Partial" },
              { color: "#ef4444", bg: "#fee2e2",  label: "Full" },
              { color: "#93c5fd", bg: "#dbeafe",  label: "Enquiry only" },
              { color: "#9ca3af", bg: "#f3f4f6",  label: "Blocked" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: item.bg, border: `1.5px solid ${item.color}` }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 20px 0" }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ textAlign: "center", padding: "8px 0 4px", fontSize: 11, fontWeight: 700, color: d === "Sun" || d === "Sat" ? "#ef4444" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells — matches ERP calendar style */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 12px 12px", gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const ds = getDateStr(day);
              const status = getDayStatus(ds, venueInfo.bookings || [], venueInfo.blackoutDates || [], halls.length || 3);
              const sc = STATUS_COLORS[status];
              const isToday = ds === todayStr;
              const isWeekend = [0, 6].includes((firstDay + day - 1) % 7);
              const isPast = status === "past";
              const isBlocked = status === "blocked";
              const dayBks = (venueInfo.bookings || []).filter(b => b.date.startsWith(ds) && b.status !== "Cancelled");

              return (
                <div
                  key={day}
                  onClick={() => !isPast && !isBlocked && handleDayClick(day)}
                  style={{
                    borderRadius: 8, padding: "4px 3px 5px",
                    cursor: isPast || isBlocked ? "default" : "pointer",
                    minHeight: 52,
                    background: isBlocked ? sc.bg : isToday ? "#F0F4EF" : isPast ? "#f9fafb" : sc.bg,
                    border: isBlocked ? `2px solid ${sc.border}` : isToday ? "2px solid #1B4332" : isPast ? "2px solid #e5e7eb" : `2px solid ${sc.border}`,
                    transition: "all 0.15s",
                    opacity: isBlocked ? 0.65 : isPast ? 0.45 : 1,
                  }}
                  onMouseEnter={e => { if (!isPast && !isBlocked) e.currentTarget.style.opacity = "0.8"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = isBlocked ? "0.65" : isPast ? "0.45" : "1"; }}
                  title={isPast ? "Past date" : status === "full" ? "Fully booked" : "Click to enquire"}
                >
                  <div style={{
                    textAlign: "center", fontSize: 11, fontWeight: isToday ? 700 : 500,
                    color: isBlocked ? "#9ca3af" : isPast ? "#c0c4cc" : isToday ? "#1B4332" : isWeekend ? "#ef4444" : "#374151",
                    marginBottom: 2,
                  }}>
                    {day}
                    {isBlocked && <div style={{ fontSize: 8, color: "#9ca3af", fontWeight: 700, marginTop: 1 }}>🚫 Blocked</div>}
                  </div>
                  {/* Booking dots — matches ERP */}
                  {!isBlocked && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                      {dayBks.slice(0, 3).map((b, bi) => {
                        const dotColor = status === "enquiry" ? "#3b82f6" : status === "full" ? "#ef4444" : status === "partial" ? "#f59e0b" : "#22c55e";
                        return (
                          <div key={bi} style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: dotColor,
                          }} title={`${b.session || "Booking"}`} />
                        );
                      })}
                      {dayBks.length > 3 && (
                        <span style={{ fontSize: 7, color: "#9ca3af", lineHeight: 1 }}>+{dayBks.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Month stats */}
          <div style={{ borderTop: "1px solid #f3f4f6", padding: "14px 28px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {(() => {
              const stats = [{ label: "Total Booked", value: monthBookings.length, color: "#1B4332" }];
              // Count sessions
              const sessionCounts = {};
              monthBookings.forEach(b => {
                const s = b.session || "Unknown";
                sessionCounts[s] = (sessionCounts[s] || 0) + 1;
              });
              // Sort by count desc and take top 3
              const topSessions = Object.entries(sessionCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
                
              const colors = ["#b91c1c", "#D4A017", "#2563eb"];
              topSessions.forEach(([name, count], idx) => {
                stats.push({ label: name, value: count, color: colors[idx % colors.length] });
              });
              
              // Pad to 4 if needed
              while (stats.length < 4) {
                 stats.push({ label: "-", value: 0, color: "#9ca3af" });
              }
              
              return stats.map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Success state */}
        {submitted && (
          <div style={{ marginTop: 20, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(212,160,23,0.4)", display: "flex", alignItems: "center", gap: 14 }}>
            <CheckCircle size={32} color="#D4A017" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Enquiry Sent Successfully!</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>We've received your request. We will confirm soon and update soon via WhatsApp.</p>
            </div>
            <button onClick={() => setSubmitted(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── GALLERY ── */}
      <GallerySection galleryItems={venueInfo.gallery || []} phone={venueInfo.phone} venueName={venueInfo.name} />

      {/* ── FOOTER ── */}
      <div style={{ textAlign: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© 2026 {venueInfo.name} · Powered by Venueza</p>
      </div>

      {showForm && selectedDate && (
        <EnquiryForm
          dateStr={selectedDate}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
          eventTypes={venueInfo.eventTypes}
          sessions={venueInfo.sessions}
          halls={venueInfo.halls}
        />
      )}
    </div>
  );
}

export default function PublicBooking() {
  return (
    <ToastProvider>
      <PublicBookingInner />
    </ToastProvider>
  );
}
