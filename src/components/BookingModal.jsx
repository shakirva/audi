import { useState, useEffect, useRef } from "react";
import { X, User, Phone, CalendarDays, Building2, Users, IndianRupee, FileText, CheckCircle, Tag, MapPin } from "lucide-react";
import { useToast } from "./Toast";
import { useBookings } from "../context/BookingsContext";
import { settingsAPI } from "../services/api";

const iStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151",
  background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.15s",
};
const labelSt = {
  fontSize: 10, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.08em",
  display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
};

export default function BookingModal({ onClose, prefillDate = "", editData = null }) {
  const { addToast } = useToast();
  const { addBooking, updateBooking } = useBookings();

  const [form, setForm] = useState({
    customerName: editData?.customerName ?? "",
    phone: editData?.phone ?? "",
    gender: editData?.gender ?? "Male",
    place: editData?.place ?? "",
    address: editData?.address ?? "",
    eventType: editData?.eventType ?? "Wedding",
    hall: editData?.hall ?? "Main Hall",
    date: editData?.date ?? prefillDate,
    session: editData?.session ?? "Full Day",
    guests: editData?.guests ?? "",
    notes: editData?.notes ?? "",
    status: "Enquiry",
  });

  const [settings, setSettings] = useState(null);
  const [places, setPlaces] = useState(["Kannur", "Thalassery", "Iritty", "Kuthuparamba", "Payyanur"]);
  const [placeQuery, setPlaceQuery] = useState(editData?.place ?? "");
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const placeRef = useRef(null);

  useEffect(() => {
    settingsAPI.get().then(res => {
      setSettings(res.data);
      if (res.data?.places && res.data.places.length > 0) {
        setPlaces(res.data.places);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (placeRef.current && !placeRef.current.contains(e.target)) {
        setShowPlaceDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!settings) return null;

  const eventTypeOptions = (settings.eventTypes || []).map(e => ({ label: e, value: e }));
  const hallOptions = settings.halls || [];
  const sessionOptions = settings.sessions || [];

  const selectedHall = hallOptions.find(h => h.name === form.hall);

  const filteredPlaces = (places || []).filter(p => {
    if (typeof p !== 'string') return false;
    return p.toLowerCase().includes((placeQuery || "").toLowerCase());
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customerName || !form.phone || !form.date || !form.guests) {
      addToast("Please fill all required fields", "error");
      return;
    }
    
    const gst = Number(form.guests || 0);

    if (gst < 1) {
      addToast("Expected guests must be at least 1", "error");
      return;
    }

    if (editData) {
      updateBooking(editData.id, form);
      addToast("Enquiry updated successfully! ✏️", "success");
    } else {
      addBooking({ ...form, status: "Enquiry", advance: 0, totalAmount: 0 });
      addToast("Enquiry saved successfully! 🎉", "success");
    }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "22px 24px", borderRadius: "20px 20px 0 0", position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{editData ? "Edit Enquiry" : "New Enquiry"}</h3>
              <p style={{ fontSize: 12, color: "rgba(212,160,23,0.9)", marginTop: 3 }}>{editData ? `Editing enquiry ${editData.id}` : "Capture details for a new lead"}</p>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>

          {/* ── SECTION: Customer ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <User size={13} /> Customer Details
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label style={labelSt}><User size={11} /> Customer Name *</label>
                <input name="customerName" value={form.customerName} onChange={handleChange}
                  placeholder="e.g. Arun & Divya" style={iStyle} required minLength={3}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelSt}><Phone size={11} /> Phone Number *</label>
                <input name="phone" value={form.phone} onChange={handleChange} type="tel"
                  placeholder="e.g. 9447012345" style={iStyle} required minLength={10} pattern="[0-9]{10,15}"
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label style={labelSt}>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  style={{ ...iStyle, cursor: "pointer" }}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Place with autocomplete */}
              <div ref={placeRef} style={{ position: "relative" }}>
                <label style={labelSt}>
                  <MapPin size={10} style={{ display: "inline", marginRight: 3 }} /> Place / Area
                </label>
                <input
                  type="text"
                  name="place"
                  value={placeQuery || form.place}
                  onChange={e => {
                    setPlaceQuery(e.target.value);
                    setForm(prev => ({ ...prev, place: e.target.value }));
                    setShowPlaceDropdown(true);
                  }}
                  onFocus={() => setShowPlaceDropdown(true)}
                  placeholder="e.g. Kannur"
                  style={iStyle}
                  autoComplete="off"
                />
                {showPlaceDropdown && filteredPlaces.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                    background: "#fff", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    border: "1.5px solid #e5e7eb", maxHeight: 180, overflowY: "auto", marginTop: 4
                  }}>
                    {filteredPlaces.map(p => (
                      <div
                        key={p}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setForm(prev => ({ ...prev, place: p }));
                          setPlaceQuery(p);
                          setShowPlaceDropdown(false);
                        }}
                        style={{
                          padding: "10px 14px", fontSize: 13, color: "#374151", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 8,
                          borderBottom: "1px solid #f3f4f6"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0faf4"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        <MapPin size={13} color="#1B4332" />
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelSt}>Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                placeholder="House / Building, Street, Town..."
                style={{ ...iStyle, resize: "none", lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
          </div>

          {/* ── SECTION: Event ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarDays size={13} /> Event Details
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label style={labelSt}>Event Type</label>
                <select name="eventType" value={form.eventType} onChange={handleChange}
                  style={{ ...iStyle, cursor: "pointer" }}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                  {eventTypeOptions.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}><CalendarDays size={11} /> Event Date *</label>
                <input type="date" name="date" value={form.date} onChange={handleChange}
                  style={{ ...iStyle, cursor: "pointer" }} required
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>
          </div>

          {/* ── SECTION: Hall ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Building2 size={13} /> Hall & Session
            </p>
            {/* Hall cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {hallOptions.map(h => (
                <button type="button" key={h.name} onClick={() => handleChange({ target: { name: "hall", value: h.name } })}
                  style={{
                    padding: "12px 10px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                    border: `2px solid ${form.hall === h.name ? "#1B4332" : "#e5e7eb"}`,
                    background: form.hall === h.name ? "#f0faf4" : "#fafafa",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{h.icon}</div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: form.hall === h.name ? "#1B4332" : "#374151", margin: 0 }}>{h.name}</p>
                  <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>₹{(h.price || 0).toLocaleString()} / session</p>
                  <p style={{ fontSize: 10, color: "#9ca3af" }}>Up to {h.capacity} guests</p>
                  {form.hall === h.name && <CheckCircle size={14} style={{ color: "#1B4332", marginTop: 4 }} />}
                </button>
              ))}
            </div>
            {/* Session */}
            <div>
              <label style={labelSt}>Session</label>
              <div style={{ display: "flex", gap: 8 }}>
                {sessionOptions.map(s => (
                  <label key={s.name} style={{
                    flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${form.session === s.name ? "#1B4332" : "#e5e7eb"}`,
                    background: form.session === s.name ? "#1B4332" : "#fff",
                    color: form.session === s.name ? "#fff" : "#6b7280",
                    fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                  }}>
                    <input type="radio" name="session" value={s.name} checked={form.session === s.name} onChange={handleChange} style={{ display: "none" }} />
                    <div style={{ marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 9, fontWeight: 500, opacity: 0.8 }}>{s.time}</div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION: Additional Details ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={13} /> Additional Details
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              <div>
                <label style={labelSt}><Users size={11} /> Expected Guests *</label>
                <input type="number" name="guests" value={form.guests} onChange={handleChange}
                  placeholder="e.g. 450" style={iStyle} required min="1"
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>
          </div>

          {/* ── SECTION: Notes ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelSt}><FileText size={11} /> Special Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={3} placeholder="Any special requirements (decorations, catering, parking, etc.)…"
              style={{ ...iStyle, resize: "none", lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>



          {/* ── ACTIONS ── */}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "13px 0", borderRadius: 12, border: "1.5px solid #e5e7eb",
              background: "#fff", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              Cancel
            </button>
            <button type="submit" style={{
              flex: 2, padding: "13px 0", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(27,67,50,0.35)",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.92"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              ✅ {editData ? "Update Enquiry" : "Save Enquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
