import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, X, Play, Images } from "lucide-react";
import { useBookings } from "../context/BookingsContext";
import { auditoriumInfo } from "../data/dummyData";
import { useToast, ToastProvider } from "../components/Toast";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }

const SESSIONS = ["Morning", "Evening", "Full Day"];
const EVENT_TYPES = ["Wedding", "Reception", "Engagement", "Birthday", "Conference", "Anniversary", "Baptism", "Other"];

/* ─── Availability legend ─────────────────────────────
  green  = fully available
  yellow = partially booked (1–2 sessions taken)
  red    = fully booked (all 3 sessions OR Full Day taken)
  gray   = past date
─────────────────────────────────────────────────────── */
function getDayStatus(dateStr, bookings) {
  const today = new Date().toISOString().split("T")[0];
  if (dateStr < today) return "past";
  const dayBookings = bookings.filter(b => b.date === dateStr && b.status !== "Cancelled");
  if (dayBookings.length === 0) return "available";
  const hasFullDay = dayBookings.some(b => b.session === "Full Day");
  if (hasFullDay) return "full";
  const sessions = new Set(dayBookings.map(b => b.session));
  if (sessions.size >= 2) return "full";
  return "partial";
}

const STATUS_COLORS = {
  available: { bg: "#dcfce7", border: "#86efac", text: "#15803d", dot: "#22c55e", label: "Available" },
  partial:   { bg: "#fef9c3", border: "#fde047", text: "#a16207", dot: "#eab308", label: "Partial"   },
  full:      { bg: "#fee2e2", border: "#fca5a5", text: "#b91c1c", dot: "#ef4444", label: "Full"       },
  past:      { bg: "#f3f4f6", border: "#e5e7eb", text: "#9ca3af", dot: "#d1d5db", label: "Past"       },
};

const GALLERY_ITEMS = [
  // ── Images (Unsplash — wedding/banquet hall themed) ──
  { type: "image", src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80", label: "Grand Main Hall",       category: "Halls" },
  { type: "image", src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80", label: "Wedding Ceremony",     category: "Events" },
  { type: "image", src: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=80", label: "Banquet Setup",        category: "Halls" },
  { type: "image", src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80", label: "Birthday Celebration", category: "Events" },
  { type: "image", src: "https://images.unsplash.com/photo-1621275471769-e6aa344546d5?w=800&q=80", label: "Stage & Decor",        category: "Decor" },
  { type: "image", src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80", label: "Open Stage Night",     category: "Halls" },
  { type: "image", src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80", label: "Conference Setup",    category: "Events" },
  { type: "image", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", label: "Mini Hall",            category: "Halls" },
  { type: "image", src: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=800&q=80", label: "Floral Decoration",    category: "Decor" },
  // ── YouTube Embed Videos ──
  { type: "video", src: "https://www.youtube.com/embed/K4TOrB7at0Y", thumb: "https://img.youtube.com/vi/K4TOrB7at0Y/hqdefault.jpg", label: "Wedding Highlights",   category: "Videos" },
  { type: "video", src: "https://www.youtube.com/embed/jfKfPfyJRdk", thumb: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg", label: "Venue Walkthrough",    category: "Videos" },
  { type: "video", src: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumb: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", label: "Event Celebration",    category: "Videos" },
];

const GALLERY_CATEGORIES = ["All", "Halls", "Events", "Decor", "Videos"];

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
function GallerySection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const filtered = activeCategory === "All" ? GALLERY_ITEMS : GALLERY_ITEMS.filter(g => g.category === activeCategory);

  const open = (i) => setLightboxIdx(i);
  const close = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx(i => (i - 1 + filtered.length) % filtered.length);
  const next = () => setLightboxIdx(i => (i + 1) % filtered.length);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto 56px", padding: "0 16px" }}>

      {/* Section heading */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 20, padding: "5px 16px", marginBottom: 14 }}>
          <Images size={14} color="#D4A017" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4A017", letterSpacing: "0.1em", textTransform: "uppercase" }}>Photo &amp; Video Gallery</span>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>
          A Glimpse of Our <span style={{ color: "#D4A017" }}>Venue</span>
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 10 }}>
          Browse through real events hosted at Sreelakshmi Convention Centre
        </p>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {GALLERY_CATEGORIES.map(cat => {
          const active = cat === activeCategory;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "7px 18px", borderRadius: 20, border: `1.5px solid ${active ? "#D4A017" : "rgba(255,255,255,0.2)"}`,
              background: active ? "#D4A017" : "rgba(255,255,255,0.06)",
              color: active ? "#0D2418" : "rgba(255,255,255,0.7)",
              fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {cat === "Videos" ? "🎬 " : cat === "Halls" ? "🏛️ " : cat === "Events" ? "🎉 " : cat === "Decor" ? "🌸 " : ""}{cat}
            </button>
          );
        })}
      </div>

      {/* Masonry-style grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridAutoRows: "160px",
        gridAutoFlow: "dense",
        gap: 10,
      }}>
        {filtered.map((item, i) => (
          <div
            key={i}
            onClick={() => open(i)}
            style={{
              position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer",
              gridRow: i % 5 === 0 ? "span 2" : "span 1",
              gridColumn: "span 1",
              border: "2px solid rgba(255,255,255,0.08)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)"; e.currentTarget.style.borderColor = "rgba(212,160,23,0.5)"; }}
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
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(212,160,23,0.9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}>
                <Play size={18} fill="#0D2418" color="#0D2418" style={{ marginLeft: 3 }} />
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
          <a href={`tel:${auditoriumInfo.phone}`} style={{ color: "#D4A017", textDecoration: "none", fontWeight: 700 }}>{auditoriumInfo.phone}</a>
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

function EnquiryForm({ dateStr, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", phone: "", eventType: "Wedding", session: "Full Day", guests: "", notes: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const iStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151", background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    onSubmit(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.25)", width: "100%", maxWidth: 480, overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>Send Enquiry</h3>
            <p style={{ fontSize: 12, color: "#D4A017", marginTop: 4 }}>
              📅 {new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Your Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name" required style={iStyle}
                onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Phone *</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit number" required style={iStyle}
                onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Event Type</label>
              <select value={form.eventType} onChange={e => set("eventType", e.target.value)} style={{ ...iStyle, cursor: "pointer" }}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Session</label>
              <select value={form.session} onChange={e => set("session", e.target.value)} style={{ ...iStyle, cursor: "pointer" }}>
                {SESSIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Expected Guests</label>
            <input type="number" value={form.guests} onChange={e => set("guests", e.target.value)} placeholder="e.g. 200" style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Message (optional)</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Any special requirements…"
              style={{ ...iStyle, resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>

          <button type="submit" style={{
            padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 16px rgba(27,67,50,0.35)",
          }}>
            📩 Send Enquiry via WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}

function PublicBookingInner() {
  const { bookings } = useBookings();
  const { addToast } = useToast();
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
    const status = getDayStatus(ds, bookings);
    if (status === "full") { addToast("This date is fully booked. Please choose another date.", "error"); return; }
    setSelectedDate(ds);
    setShowForm(true);
  };

  const handleSubmit = (form) => {
    const msg = encodeURIComponent(
      `🏛️ *New Booking Enquiry*\n\n👤 Name: ${form.name}\n📞 Phone: ${form.phone}\n📅 Date: ${new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n🎉 Event: ${form.eventType}\n🕐 Session: ${form.session}\n👥 Guests: ${form.guests || "Not specified"}\n📝 Notes: ${form.notes || "None"}\n\nPlease confirm availability. Thank you!`
    );
    window.open(`https://wa.me/${auditoriumInfo.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
    setShowForm(false);
    setSubmitted(true);
    addToast("Enquiry sent on WhatsApp! We'll confirm shortly. 🎉", "success");
  };

  // Count bookings per day for the current month
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthBookings = bookings.filter(b => b.date.startsWith(monthStr) && b.status !== "Cancelled");

  const halls = auditoriumInfo.halls || [];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0D2418 0%, #1B4332 40%, #2D6A4F 100%)", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#D4A017", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏛️</div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{auditoriumInfo.name}</p>
            <p style={{ fontSize: 11, color: "#D4A017", margin: 0 }}>📍 {auditoriumInfo.location}</p>
          </div>
        </div>
        <a href={`tel:${auditoriumInfo.phone}`} style={{ padding: "8px 18px", borderRadius: 20, border: "1.5px solid #D4A017", background: "transparent", color: "#D4A017", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          📞 {auditoriumInfo.phone}
        </a>
      </nav>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", padding: "40px 24px 32px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
          Check Availability &<br />
          <span style={{ color: "#D4A017" }}>Book Your Event</span>
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>
          Click any available date to send us an enquiry. We'll confirm within 2 hours.
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

          {/* Legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "12px 24px 4px", flexWrap: "wrap" }}>
            {Object.entries(STATUS_COLORS).filter(([k]) => k !== "past").map(([key, val]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: val.dot }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{val.label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d1d5db" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Past / Unavailable</span>
            </div>
          </div>

          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 20px 0" }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ textAlign: "center", padding: "8px 0 4px", fontSize: 11, fontWeight: 700, color: d === "Sun" || d === "Sat" ? "#ef4444" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "4px 16px 20px", gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const ds = getDateStr(day);
              const status = getDayStatus(ds, bookings);
              const sc = STATUS_COLORS[status];
              const isToday = ds === todayStr;
              const isWeekend = [0, 6].includes((firstDay + day - 1) % 7);
              const isPast = status === "past";
              const dayBks = bookings.filter(b => b.date === ds && b.status !== "Cancelled");

              return (
                <div
                  key={day}
                  onClick={() => !isPast && handleDayClick(day)}
                  style={{
                    borderRadius: 12, padding: "8px 4px 10px",
                    cursor: isPast ? "default" : "pointer",
                    minHeight: 70,
                    background: sc.bg,
                    border: `2px solid ${isToday ? "#1B4332" : sc.border}`,
                    opacity: isPast ? 0.5 : 1,
                    transition: "all 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={e => { if (!isPast) { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                  title={isPast ? "Past date" : status === "full" ? "Fully booked" : "Click to enquire"}
                >
                  {/* Today badge */}
                  {isToday && <div style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#1B4332" }} />}

                  <div style={{ textAlign: "center", fontSize: 14, fontWeight: isToday ? 800 : 600, color: isWeekend && !isPast ? "#b91c1c" : sc.text }}>
                    {day}
                  </div>

                  {/* Session pills */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, marginTop: 4 }}>
                    {dayBks.length > 0 && dayBks.slice(0, 2).map((b, bi) => (
                      <div key={bi} style={{ fontSize: 8, fontWeight: 700, background: "rgba(0,0,0,0.08)", color: sc.text, padding: "1px 5px", borderRadius: 6, whiteSpace: "nowrap", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.session === "Full Day" ? "Full" : b.session.slice(0, 3)}
                      </div>
                    ))}
                    {dayBks.length > 2 && <div style={{ fontSize: 8, color: sc.text, fontWeight: 700 }}>+{dayBks.length - 2}</div>}
                  </div>

                  {/* Status dot */}
                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, margin: "0 auto" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month stats */}
          <div style={{ borderTop: "1px solid #f3f4f6", padding: "14px 28px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Total Booked", value: monthBookings.length, color: "#1B4332" },
              { label: "Full Days",    value: monthBookings.filter(b => b.session === "Full Day").length, color: "#b91c1c" },
              { label: "Mornings",     value: monthBookings.filter(b => b.session === "Morning").length, color: "#D4A017" },
              { label: "Evenings",     value: monthBookings.filter(b => b.session === "Evening").length, color: "#2563eb" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Success state */}
        {submitted && (
          <div style={{ marginTop: 20, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(212,160,23,0.4)", display: "flex", alignItems: "center", gap: 14 }}>
            <CheckCircle size={32} color="#D4A017" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Enquiry Sent Successfully!</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>We've received your request. We'll confirm via WhatsApp within 2 hours.</p>
            </div>
            <button onClick={() => setSubmitted(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── GALLERY ── */}
      <GallerySection />

      {/* ── FOOTER ── */}
      <div style={{ textAlign: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© 2026 {auditoriumInfo.name} · Powered by HallMaster</p>
      </div>

      {showForm && selectedDate && (
        <EnquiryForm
          dateStr={selectedDate}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
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
