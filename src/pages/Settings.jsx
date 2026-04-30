import { useState } from "react";
import { Save, Building2, User, MapPin, IndianRupee, Users, CheckCircle, X, Copy, Link, ShieldCheck, ImagePlus, Trash2, Play, Film, ToggleLeft, ToggleRight, Eye, EyeOff } from "lucide-react";
import { auditoriumInfo } from "../data/dummyData";
import { useToast } from "../components/Toast";
import { useRole } from "../context/RoleContext";

const INIT_HALLS = [
  { name: "Main Hall",  icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup" },
  { name: "Mini Hall",  icon: "🏠", price: 6000,  capacity: 150, description: "Intimate setting for smaller events" },
  { name: "Open Stage", icon: "🌿", price: 8000,  capacity: 300, description: "Outdoor stage with natural surroundings" },
];

const iStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151",
  background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
};
const labelSt = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.08em",
  display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
};
const cardSt = {
  background: "#fff", borderRadius: 16,
  boxShadow: "0 2px 16px rgba(0,0,0,0.06)", padding: 24, marginBottom: 24,
};
const sectionTitle = {
  fontFamily: "'Playfair Display', serif", fontSize: 16,
  fontWeight: 700, color: "#111827", marginBottom: 6,
};

export default function Settings() {
  const { addToast } = useToast();
  const { role, managerRevenueEnabled, setManagerRevenueEnabled } = useRole();
  const isOwner = role === "Owner";
  const isAdminRole = role === "Owner" || role === "Manager"; // both see full settings

  // ── Venue Info ──
  const [venue, setVenue] = useState({
    name:     auditoriumInfo.name     || "Sharada Auditorium",
    owner:    auditoriumInfo.owner    || "Rajesh Menon",
    location: auditoriumInfo.location || "Taliparamba, Kannur, Kerala",
    phone:    auditoriumInfo.phone    || "9447012345",
    email:    auditoriumInfo.email    || "info@sharada.com",
    gst:      auditoriumInfo.gst      || "32AABCT3518Q1Z5",
  });

  // ── Hall Pricing ──
  const [halls, setHalls] = useState(INIT_HALLS);

  // ── Notification Prefs ──
  const [notifs, setNotifs] = useState({
    sms: true, email: false, whatsapp: true, reminders: true,
  });

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenue(prev => ({ ...prev, [name]: value }));
  };

  const handleHallChange = (idx, field, value) => {
    setHalls(prev => prev.map((h, i) => i === idx ? { ...h, [field]: field === "price" || field === "capacity" ? Number(value) : value } : h));
  };

  const handleSaveVenue = () => {
    addToast("Venue settings saved! 🏛️", "success");
  };

  const handleSaveHalls = () => {
    addToast("Hall pricing updated! ✅", "success");
  };

  const handleSaveNotifs = () => {
    addToast("Notification preferences saved!", "success");
  };

  // ── Blackout Dates ──
  const [blackoutInput, setBlackoutInput] = useState("");
  const [blackoutDates, setBlackoutDates] = useState([
    "2026-06-15", "2026-07-20", "2026-08-01",
  ]);

  const addBlackout = () => {
    if (!blackoutInput) return;
    if (blackoutDates.includes(blackoutInput)) { addToast("Date already blocked!", "error"); return; }
    setBlackoutDates(prev => [...prev, blackoutInput].sort());
    setBlackoutInput("");
    addToast("Date blocked! 🚫", "success");
  };

  const removeBlackout = (d) => {
    setBlackoutDates(prev => prev.filter(x => x !== d));
    addToast("Date unblocked ✅", "success");
  };

  // ── Staff Roles ──
  const [staff] = useState([
    { name: "Rajan P.K.",   role: "Owner",   email: "rajan@sharada.com",  access: "Full" },
    { name: "Suresh Kumar", role: "Manager", email: "suresh@sharada.com", access: "Bookings & Reports" },
    { name: "Anitha Nair",  role: "Staff",   email: "anitha@sharada.com", access: "View Only" },
  ]);

  // ── Gallery Management ──
  const GALLERY_CATEGORIES = ["Halls", "Events", "Decor", "Videos"];

  const [galleryItems, setGalleryItems] = useState([
    { id: 1, type: "image", src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80", label: "Grand Main Hall",    category: "Halls" },
    { id: 2, type: "image", src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80", label: "Wedding Ceremony",   category: "Events" },
    { id: 3, type: "image", src: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=400&q=80", label: "Floral Decoration",  category: "Decor" },
    { id: 4, type: "video", src: "https://www.youtube.com/embed/K4TOrB7at0Y", thumb: "https://img.youtube.com/vi/K4TOrB7at0Y/hqdefault.jpg", label: "Wedding Highlights", category: "Videos" },
  ]);

  const [newMedia, setNewMedia] = useState({ type: "image", src: "", label: "", category: "Halls" });
  const [mediaError, setMediaError] = useState("");

  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleAddMedia = () => {
    setMediaError("");
    if (!newMedia.src.trim()) { setMediaError("Please enter a URL."); return; }
    if (!newMedia.label.trim()) { setMediaError("Please enter a label."); return; }
    if (newMedia.type === "video") {
      const ytId = getYouTubeId(newMedia.src);
      if (!ytId) { setMediaError("Please enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)."); return; }
      const embedSrc = `https://www.youtube.com/embed/${ytId}`;
      const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      setGalleryItems(prev => [...prev, { id: Date.now(), type: "video", src: embedSrc, thumb, label: newMedia.label, category: newMedia.category }]);
    } else {
      setGalleryItems(prev => [...prev, { id: Date.now(), type: "image", src: newMedia.src.trim(), label: newMedia.label, category: newMedia.category }]);
    }
    setNewMedia({ type: "image", src: "", label: "", category: "Halls" });
    addToast("Media added to gallery! 🖼️", "success");
  };

  const handleDeleteMedia = (id) => {
    setGalleryItems(prev => prev.filter(g => g.id !== id));
    addToast("Removed from gallery.", "info");
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 820 }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
          Manage your auditorium profile, hall pricing and preferences
        </p>
      </div>

      {/* ── MANAGER ACCESS CONTROL (Owner only) ── */}
      {isOwner && (
        <div style={{ ...cardSt, border: "1.5px solid #fde68a", background: "linear-gradient(135deg, #fffbeb, #fefce8)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="#92400e" />
            </div>
            <div>
              <p style={{ ...sectionTitle, color: "#92400e" }}>Manager Access Control</p>
              <p style={{ fontSize: 12, color: "#a16207", margin: 0 }}>Control what Managers can see on their dashboard</p>
            </div>
          </div>

          {/* Revenue toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1.5px solid #fde68a", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: managerRevenueEnabled ? "#d1fae5" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {managerRevenueEnabled ? <Eye size={16} color="#15803d" /> : <EyeOff size={16} color="#C0392B" />}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: 0 }}>Revenue &amp; Financial Reports</p>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {managerRevenueEnabled
                    ? "Managers can see revenue stats, payments & reports"
                    : "Managers cannot see revenue stats, payments or reports"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setManagerRevenueEnabled(!managerRevenueEnabled);
                addToast(
                  managerRevenueEnabled ? "Manager revenue access disabled 🔒" : "Manager revenue access enabled ✅",
                  managerRevenueEnabled ? "error" : "success"
                );
              }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
            >
              {managerRevenueEnabled
                ? <ToggleRight size={38} color="#1B4332" />
                : <ToggleLeft size={38} color="#9ca3af" />}
            </button>
          </div>

          <div style={{ background: "#fef3c7", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              Changes take effect immediately. Manager will see or lose access to <strong>Revenue stats, Payments & Reports</strong> on their next page load.
            </p>
          </div>
        </div>
      )}

      {/* ── VENUE INFO CARD (Owner & Manager) ── */}
      {isAdminRole && (
        <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={18} color="#1B4332" />
          </div>
          <div>
            <p style={sectionTitle}>Venue Information</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Your auditorium's public profile</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelSt}><Building2 size={11} /> Auditorium Name</label>
            <input name="name" value={venue.name} onChange={handleVenueChange} style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div>
            <label style={labelSt}><User size={11} /> Owner Name</label>
            <input name="owner" value={venue.owner} onChange={handleVenueChange} style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelSt}><MapPin size={11} /> Location</label>
            <input name="location" value={venue.location} onChange={handleVenueChange} style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div>
            <label style={labelSt}>📞 Contact Phone</label>
            <input name="phone" value={venue.phone} onChange={handleVenueChange} style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div>
            <label style={labelSt}>✉️ Email</label>
            <input name="email" value={venue.email} onChange={handleVenueChange} style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelSt}>🔖 GST Number</label>
            <input name="gst" value={venue.gst} onChange={handleVenueChange} style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
        </div>

        <button onClick={handleSaveVenue} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#1B4332", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 2px 10px rgba(27,67,50,0.3)",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#163829"}
          onMouseLeave={e => e.currentTarget.style.background = "#1B4332"}>
          <Save size={14} /> Save Venue Info
        </button>
      </div>
      )}

      {/* ── HALL PRICING CARD (Owner & Manager) ── */}
      {isAdminRole && (
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={18} color="#D4A017" />
          </div>
          <div>
            <p style={sectionTitle}>Hall Pricing & Capacity</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Set per-session pricing and guest limits</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {halls.map((hall, idx) => (
            <div key={hall.name} style={{
              border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "16px 18px",
              background: "#fafafa", display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 16, alignItems: "center",
            }}>
              {/* Icon + Name */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>{hall.icon}</div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#1B4332", margin: "4px 0 0", whiteSpace: "nowrap" }}>{hall.name}</p>
              </div>

              {/* Description */}
              <div>
                <label style={labelSt}>Description</label>
                <input value={hall.description} onChange={e => handleHallChange(idx, "description", e.target.value)}
                  style={{ ...iStyle, fontSize: 12 }}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>

              {/* Price */}
              <div>
                <label style={labelSt}><IndianRupee size={11} /> Price / Session (₹)</label>
                <input type="number" value={hall.price} onChange={e => handleHallChange(idx, "price", e.target.value)}
                  style={iStyle}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>

              {/* Capacity */}
              <div>
                <label style={labelSt}><Users size={11} /> Max Guests</label>
                <input type="number" value={hall.capacity} onChange={e => handleHallChange(idx, "capacity", e.target.value)}
                  style={iStyle}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSaveHalls} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#D4A017", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 2px 10px rgba(212,160,23,0.3)",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#b8890e"}
          onMouseLeave={e => e.currentTarget.style.background = "#D4A017"}>
          <Save size={14} /> Update Hall Pricing
        </button>
      </div>
      )}

      {/* ── NOTIFICATION PREFS ── */}
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>🔔</span>
          </div>
          <div>
            <p style={sectionTitle}>Notification Preferences</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Choose how you receive alerts</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { key: "sms",       label: "SMS Alerts",          icon: "💬", desc: "Receive booking confirmations via SMS" },
            { key: "email",     label: "Email Notifications", icon: "✉️", desc: "Daily digest and booking emails" },
            { key: "whatsapp",  label: "WhatsApp Messages",   icon: "📱", desc: "Instant booking alerts on WhatsApp" },
            { key: "reminders", label: "Event Reminders",     icon: "⏰", desc: "Reminders 24h before each booking" },
          ].map(item => (
            <div key={item.key} onClick={() => setNotifs(p => ({ ...p, [item.key]: !p[item.key] }))}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
                borderRadius: 12, cursor: "pointer", transition: "all 0.15s",
                border: `1.5px solid ${notifs[item.key] ? "#1B4332" : "#e5e7eb"}`,
                background: notifs[item.key] ? "#f0faf4" : "#fafafa",
              }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{item.desc}</p>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                background: notifs[item.key] ? "#1B4332" : "#e5e7eb",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {notifs[item.key] && <CheckCircle size={13} color="#fff" />}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSaveNotifs} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 2px 10px rgba(37,99,235,0.3)",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#1d4ed8"}
          onMouseLeave={e => e.currentTarget.style.background = "#2563eb"}>
          <Save size={14} /> Save Preferences
        </button>
      </div>

      {/* ── BLACKOUT DATES & STAFF ROLES (Owner & Manager) ── */}
      {isAdminRole && (<>
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>🚫</span>
          </div>
          <div>
            <p style={sectionTitle}>Blackout Dates</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Block specific dates — no bookings will be accepted</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <input type="date" value={blackoutInput} onChange={e => setBlackoutInput(e.target.value)}
            style={{ ...iStyle, flex: 1 }}
            onFocus={e => e.target.style.borderColor = "#C0392B"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          <button onClick={addBlackout} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "#C0392B", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
          }}>
            Block Date
          </button>
        </div>

        {blackoutDates.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>No dates blocked yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {blackoutDates.map(d => (
              <div key={d} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 14px",
                borderRadius: 20, border: "1.5px solid #fecaca", background: "#fef2f2",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#C0392B" }}>
                  {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button onClick={() => removeBlackout(d)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", padding: 0, display: "flex", alignItems: "center" }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── STAFF & ROLES ── */}
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="#7c3aed" />
            </div>
            <div>
              <p style={sectionTitle}>Staff & Roles</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Manage team members and access permissions</p>
            </div>
          </div>
          <button style={{
            padding: "7px 14px", borderRadius: 9, border: "1.5px solid #7c3aed",
            background: "#f5f3ff", color: "#7c3aed", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            + Invite Member
          </button>
        </div>

        <div style={{ border: "1.5px solid #f3f4f6", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr 100px", background: "#f9fafb", padding: "10px 16px", gap: 12 }}>
            {["Name", "Role", "Access", "Status"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
            ))}
          </div>
          {staff.map((s, i) => {
            const roleColors = { Owner: { bg: "#f0faf4", color: "#1B4332" }, Manager: { bg: "#fffbeb", color: "#D4A017" }, Staff: { bg: "#eff6ff", color: "#2563eb" } };
            const rc = roleColors[s.role] || roleColors.Staff;
            return (
              <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr 100px", padding: "12px 16px", gap: 12, borderTop: i > 0 ? "1px solid #f3f4f6" : "none", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>{s.email}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: rc.color, background: rc.bg, padding: "3px 10px", borderRadius: 20, textAlign: "center" }}>{s.role}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{s.access}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d", background: "#dcfce7", padding: "3px 10px", borderRadius: 20, textAlign: "center" }}>Active</span>
              </div>
            );
          })}
        </div>
      </div>
      </>)}

      {/* ── ONLINE BOOKING LINK ── */}
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link size={18} color="#1B4332" />
          </div>
          <div>
            <p style={sectionTitle}>Online Booking Link</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Share this link for customers to submit enquiries online</p>
          </div>
        </div>

        <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px", marginBottom: 16, border: "1.5px dashed #d1fae5" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Your Booking URL</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <code style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1B4332", background: "#e7f7ef", padding: "8px 14px", borderRadius: 8, overflow: "auto", whiteSpace: "nowrap" }}>
              localhost:5173/book
            </code>
            <button
              onClick={() => { navigator.clipboard?.writeText("http://localhost:5173/book"); addToast("Link copied! 📋", "success"); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "none", background: "#1B4332", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
            >
              <Copy size={13} /> Copy
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1.5px solid #d1fae5", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=http://localhost:5173/book&bgcolor=ffffff&color=1B4332&margin=10"
              alt="QR Code for booking page"
              width={160} height={160}
              style={{ borderRadius: 8, display: "block" }}
            />
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", margin: 0 }}>Scan to Open Booking Page</p>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Share with customers</p>
            <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>Customers scan the QR code or open the link to see real-time availability and send enquiries directly to you on WhatsApp.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Share on WhatsApp", emoji: "📱", color: "#25D366", onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent("Book your event at Sreelakshmi Convention Centre 🏛️\nhttp://localhost:5173/book")}`, "_blank") },
            { label: "Open Booking Page", emoji: "�", color: "#1B4332", onClick: () => window.open("http://localhost:5173/book", "_blank") },
          ].map(a => (
            <button key={a.label} onClick={a.onClick} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
              borderRadius: 10, border: `1.5px solid ${a.color}33`,
              background: `${a.color}0d`, color: a.color,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── GALLERY MANAGEMENT (Owner & Manager) ── */}
      {isAdminRole && (
      <div style={cardSt}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImagePlus size={18} color="#1B4332" />
          </div>
          <div>
            <p style={sectionTitle}>Gallery Management</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Add or remove photos and videos shown on your public booking page</p>
          </div>
        </div>

        {/* ── Add New Media Form ── */}
        <div style={{ background: "#f9fafb", borderRadius: 12, padding: 18, marginBottom: 20, border: "1.5px dashed #d1fae5" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <ImagePlus size={13} color="#1B4332" /> Add New Image / Video
          </p>

          {/* Type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["image", "video"].map(t => (
              <button key={t} onClick={() => setNewMedia(p => ({ ...p, type: t, src: "" }))} style={{
                padding: "6px 18px", borderRadius: 20, border: `1.5px solid ${newMedia.type === t ? "#1B4332" : "#e5e7eb"}`,
                background: newMedia.type === t ? "#1B4332" : "#fff",
                color: newMedia.type === t ? "#fff" : "#6b7280",
                fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {t === "image" ? <ImagePlus size={12} /> : <Film size={12} />}
                {t === "image" ? "Image URL" : "YouTube Video"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelSt}>{newMedia.type === "image" ? "🖼️ Image URL" : "🎬 YouTube URL"}</label>
              <input
                value={newMedia.src}
                onChange={e => setNewMedia(p => ({ ...p, src: e.target.value }))}
                placeholder={newMedia.type === "image" ? "https://images.unsplash.com/..." : "https://youtube.com/watch?v=..."}
                style={iStyle}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div>
              <label style={labelSt}>🏷️ Label / Caption</label>
              <input
                value={newMedia.label}
                onChange={e => setNewMedia(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Wedding Ceremony"
                style={iStyle}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div>
              <label style={labelSt}>📂 Category</label>
              <select
                value={newMedia.category}
                onChange={e => setNewMedia(p => ({ ...p, category: e.target.value }))}
                style={{ ...iStyle, appearance: "none" }}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              >
                {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Preview thumbnail for image/video */}
          {newMedia.src && newMedia.type === "image" && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</p>
              <img src={newMedia.src} alt="preview" onError={e => e.target.style.display="none"} style={{ height: 90, borderRadius: 8, objectFit: "cover", border: "1.5px solid #e5e7eb" }} />
            </div>
          )}
          {newMedia.src && newMedia.type === "video" && getYouTubeId(newMedia.src) && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</p>
              <img src={`https://img.youtube.com/vi/${getYouTubeId(newMedia.src)}/hqdefault.jpg`} alt="yt preview" style={{ height: 90, borderRadius: 8, objectFit: "cover", border: "1.5px solid #e5e7eb" }} />
            </div>
          )}

          {mediaError && <p style={{ fontSize: 12, color: "#C0392B", marginBottom: 10, fontWeight: 600 }}>⚠️ {mediaError}</p>}

          <button onClick={handleAddMedia} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
            borderRadius: 10, border: "none", background: "#1B4332", color: "#fff",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>
            <ImagePlus size={14} /> Add to Gallery
          </button>
        </div>

        {/* ── Existing gallery grid ── */}
        {galleryItems.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No media yet. Add your first image or video above.</p>
        ) : (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Current Gallery ({galleryItems.length} item{galleryItems.length !== 1 ? "s" : ""})
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {galleryItems.map(item => (
                <div key={item.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid #e5e7eb", background: "#f9fafb" }}>
                  {/* Thumbnail */}
                  <div style={{ position: "relative", height: 100 }}>
                    <img
                      src={item.type === "video" ? item.thumb : item.src}
                      alt={item.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {item.type === "video" && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(212,160,23,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={13} fill="#0D2418" color="#0D2418" style={{ marginLeft: 2 }} />
                        </div>
                      </div>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      style={{ position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: "50%", background: "rgba(192,57,43,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Remove"
                    >
                      <Trash2 size={11} color="#fff" />
                    </button>
                    {/* Category badge */}
                    <span style={{ position: "absolute", bottom: 5, left: 5, fontSize: 9, fontWeight: 700, background: "rgba(212,160,23,0.9)", color: "#0D2418", padding: "2px 6px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {item.category}
                    </span>
                  </div>
                  {/* Label */}
                  <div style={{ padding: "7px 8px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      )}

      {/* ── APP INFO ── */}
      <div style={{ ...cardSt, background: "linear-gradient(135deg, #0D2418, #1B4332)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, margin: 0, color: "#fff" }}>
              🏛️ HallMaster
            </p>
            <p style={{ fontSize: 12, color: "rgba(212,160,23,0.85)", marginTop: 4 }}>
              Premium Auditorium Management — v1.0.0
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>Built for Kerala</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>© 2026 HallMaster SaaS</p>
          </div>
        </div>
      </div>

    </div>
  );
}
