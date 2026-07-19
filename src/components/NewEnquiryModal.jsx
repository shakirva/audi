import React, { useState, useEffect, useRef } from "react";
import { X, Users, Calendar, Building2, Phone, User, FileText, AlertCircle, MapPin, ChevronDown } from "lucide-react";
import { enquiriesAPI, customersAPI, settingsAPI } from "../services/api";
import { useToast } from "./Toast";

const iStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151",
  background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
};

const labelSt = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 6,
};

const EVENT_TYPES = ["Wedding", "Reception", "Engagement", "Birthday", "Corporate", "Conference", "Religious", "Other"];
const SESSIONS = ["Morning", "Afternoon", "Evening", "Full Day"];
const HALLS = ["Emerald Hall", "Royal Hall", "Orchid Hall"];
const LEAD_SCORES = ["Hot", "Warm", "Cold"];
const GENDERS = ["Male", "Female", "Other"];

export default function NewEnquiryModal({ open, onClose, onSuccess }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Place autocomplete
  const [places, setPlaces] = useState(["Kannur", "Thalassery", "Iritty", "Kuthuparamba", "Payyanur"]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const placeRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "Male",
    address: "",
    place: "",
    eventType: "Wedding",
    tentativeDate: "",
    session: "Full Day",
    hallPreference: "Emerald Hall",
    guestCount: "",
    budget: "",
    leadScore: "Warm",
    remarks: "",
    source: "Walk-in",
  });

  // Load places from settings
  useEffect(() => {
    if (!open) return;
    settingsAPI.get()
      .then(res => {
        if (res.data.places && res.data.places.length > 0) {
          setPlaces(res.data.places);
        }
      })
      .catch(() => {}); // silently fail — default places are already set
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (placeRef.current && !placeRef.current.contains(e.target)) {
        setShowPlaceDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const filteredPlaces = (places || []).filter(p => {
    if (typeof p !== 'string') return false;
    return p.toLowerCase().includes((placeQuery || "").toLowerCase());
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.name.trim() || !form.phone || !form.phone.trim()) {
      setError("Customer name and phone are required.");
      return;
    }
    const cleanPhone = (form.phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Find or create the customer
      const custRes = await customersAPI.findOrCreate({
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, "").slice(-10),
        gender: form.gender,
        address: form.address.trim(),
        place: form.place.trim(),
      });
      const customerId = custRes.data.data.id;

      // Step 2: Create the enquiry
      await enquiriesAPI.create({
        customerId,
        eventType: form.eventType,
        tentativeDate: form.tentativeDate || undefined,
        session: form.session,
        hallPreference: form.hallPreference,
        guestCount: form.guestCount ? parseInt(form.guestCount) : 0,
        budget: form.budget ? parseInt(form.budget) : 0,
        leadScore: form.leadScore,
        remarks: form.remarks,
        source: form.source,
        status: "New Enquiry",
      });

      // Reset form
      setForm({ name: "", phone: "", gender: "Male", address: "", place: "", eventType: "Wedding", tentativeDate: "", session: "Full Day", hallPreference: "Emerald Hall", guestCount: "", budget: "", leadScore: "Warm", remarks: "", source: "Walk-in" });
      setPlaceQuery("");
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Failed to save enquiry. Please try again.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 620, borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" }}>
        
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" }}>New Enquiry</h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(212,160,23,0.9)" }}>Capture lead details — booking can be done later</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
          
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{error}</span>
            </div>
          )}

          <form id="new-enquiry-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* ── Customer Info ── */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <User size={12} /> Customer Information
              </p>

              {/* Row 1: Name + Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelSt}>Customer Name *</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Muhammed Rafi" style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} type="tel"
                    placeholder="e.g. 9447012345" style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>

              {/* Row 2: Gender + Place */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelSt}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}
                    style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {/* Place with autocomplete dropdown */}
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

              {/* Row 3: Address */}
              <div>
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

            {/* ── Event Info ── */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={12} /> Event Information
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelSt}>Event Type *</label>
                  <select name="eventType" value={form.eventType} onChange={handleChange} style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Tentative Date</label>
                  <input type="date" name="tentativeDate" value={form.tentativeDate} onChange={handleChange}
                    style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Session</label>
                  <select name="session" value={form.session} onChange={handleChange} style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Hall Preference</label>
                  <select name="hallPreference" value={form.hallPreference} onChange={handleChange} style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Details ── */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={12} /> Details
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelSt}>Est. Guests</label>
                  <input type="number" name="guestCount" value={form.guestCount} onChange={handleChange}
                    placeholder="e.g. 400" style={iStyle} min="0"
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Budget (₹)</label>
                  <input type="number" name="budget" value={form.budget} onChange={handleChange}
                    placeholder="e.g. 150000" style={iStyle} min="0"
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Lead Score</label>
                  <select name="leadScore" value={form.leadScore} onChange={handleChange} style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    {LEAD_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label style={labelSt}><FileText size={11} style={{ display: "inline", marginRight: 4 }} />Remarks</label>
              <textarea name="remarks" value={form.remarks} onChange={handleChange}
                rows={3} placeholder="Any notes from the initial call or visit..."
                style={{ ...iStyle, resize: "none", lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #eaeaea", display: "flex", gap: 12, background: "#f8f9fa" }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#fff", border: "1.5px solid #e5e7eb", fontWeight: 700, cursor: "pointer", color: "#555", fontSize: 14 }}>
            Cancel
          </button>
          <button type="submit" form="new-enquiry-form" disabled={loading}
            style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: loading ? "#9ca3af" : "linear-gradient(135deg, #1B4332, #2D6A4F)", border: "none", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", color: "#fff", fontSize: 14, boxShadow: loading ? "none" : "0 4px 12px rgba(27,67,50,0.25)" }}>
            {loading ? "Saving..." : "✅ Save Enquiry"}
          </button>
        </div>
      </div>
    </div>
  );
}
