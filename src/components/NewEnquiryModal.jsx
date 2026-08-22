import React, { useState, useEffect, useRef } from "react";
import { X, Users, Calendar, Building2, Phone, User, FileText, AlertCircle, MapPin, ChevronDown, Plus, CheckCircle2 } from "lucide-react";
import { enquiriesAPI, customersAPI, settingsAPI, availabilityAPI } from "../services/api";
import { useToast } from "./Toast";
import SmartDatePicker from "./SmartDatePicker";
import { useRole } from "../context/RoleContext";

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

export default function NewEnquiryModal({ open, onClose, onSuccess, prefillDate = "", editData = null }) {
  const { user, role } = useRole();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Place autocomplete
  const [places, setPlaces] = useState(["Kannur", "Thalassery", "Iritty", "Kuthuparamba", "Payyanur"]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const placeRef = useRef(null);

  const [users, setUsers] = useState([]);
  
  // Custom confirmation popup state
  const [placeToConfirm, setPlaceToConfirm] = useState(null);
  
  // Event Type autocomplete
  const [eventTypeQuery, setEventTypeQuery] = useState("");
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const eventTypeRef = useRef(null);
  const [eventTypeToConfirm, setEventTypeToConfirm] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState(["Morning"]);
  
  // Dynamic settings
  const [settingsHalls, setSettingsHalls] = useState([]);
  const [settingsEventTypes, setSettingsEventTypes] = useState([]);
  const [settingsSessions, setSettingsSessions] = useState([]);
  
  const [availability, setAvailability] = useState({ morning: "available", evening: "available", fullDay: "available", status: "Available" });
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [allowPastDates, setAllowPastDates] = useState(false);
  const [venueName, setVenueName] = useState("Our Auditorium");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    address: "",
    place: "",
    eventType: "",
    tentativeDate: prefillDate,
    session: "",
    hallPreference: "",
    guestCount: "",
    budget: "",
    leadScore: "",
    remarks: "",
    source: "",
    salesExecutiveId: "",
  });

  // When editData changes, pre-fill the form
  useEffect(() => {
    if (editData && open) {
      setForm({
        name: editData.enquirerName || editData.Customer?.name || editData.name || "",
        phone: editData.enquirerPhone || editData.Customer?.phone || editData.phone || "",
        gender: editData.gender || editData.Customer?.gender || "",
        address: editData.enquirerAddress || editData.Customer?.address || "",
        place: editData.enquirerArea || editData.Customer?.city || "",
        eventType: editData.eventType || "",
        tentativeDate: editData.tentativeDate ? editData.tentativeDate.split("T")[0] : "",
        session: editData.session || "",
        hallPreference: editData.hallPreference || "",
        guestCount: editData.guestCount || "",
        budget: editData.budget || "",
        leadScore: editData.leadScore || "",
        remarks: editData.remarks || "",
        source: editData.source || "",
        salesExecutiveId: editData.salesExecutiveId || (role === "Sales" && user ? user.id : ""),
      });
      setPlaceQuery(editData.enquirerArea || editData.Customer?.city || "");
      setEventTypeQuery(editData.eventType || "");
      setUserEditedBudget(editData.budget ? true : false);
    } else if (!editData && open) {
      // Reset for new enquiry
      setForm({ name: "", phone: "", gender: "", address: "", place: "", eventType: "", tentativeDate: prefillDate, session: "", hallPreference: "", guestCount: "", budget: "", leadScore: "", remarks: "", source: "", salesExecutiveId: (role === "Sales" && user) ? user.id : "" });
      setPlaceQuery("");
      setEventTypeQuery("");
      setUserEditedBudget(false);
    }
  }, [editData, open, role, user]);

  const [userEditedBudget, setUserEditedBudget] = useState(false);

  // Calculation logic
  const getCalculatedPrice = () => {
    const h = settingsHalls.find(x => x.name === form.hallPreference);
    if (!h) return 0;

    if (h.pricingType === "slab" && h.slabs && h.slabs.length > 0) {
      const g = Number(form.guestCount) || 0;
      const sortedSlabs = [...h.slabs].sort((a, b) => a.guests - b.guests);
      const matchedSlab = sortedSlabs.find(s => g <= s.guests);
      if (matchedSlab) {
        return matchedSlab.totalAmount;
      } else {
        return sortedSlabs[sortedSlabs.length - 1].totalAmount;
      }
    } else if (h.pricingType === "per_pax") {
      const g = Number(form.guestCount) || 0;
      return (h.pricePerPax || 0) * g;
    } else {
      return h.price || 0;
    }
  };

  useEffect(() => {
    const price = getCalculatedPrice();
    if (price > 0 && !userEditedBudget) {
      setForm(prev => ({ ...prev, budget: price }));
    }
  }, [form.hallPreference, form.guestCount, form.session, settingsHalls, userEditedBudget]);

  // Load places and users
  useEffect(() => {
    if (!open) return;
    
    // Fetch settings
    settingsAPI.get()
      .then(res => {
        const data = res.data.data; // Fixed to parse the nested data wrapper
        if (data && data.places && data.places.length > 0) setPlaces(data.places);
        if (data && data.halls && data.halls.length > 0) {
          setSettingsHalls(data.halls);
        }
        if (data && data.eventTypes && data.eventTypes.length > 0) {
          setSettingsEventTypes(data.eventTypes);
        }
        if (data && data.sessions && data.sessions.length > 0) {
          setSettingsSessions(data.sessions);
        }
        if (data) setAllowPastDates(data.allowPastDateBooking === true);
        if (data && data.venueName) setVenueName(data.venueName);
      })
      .catch(() => {});

    // Fetch users for salesman dropdown
    if (settingsAPI.getUsers) {
      settingsAPI.getUsers()
        .then(res => {
          if (res.data.data && res.data.data.length > 0) {
            setUsers(res.data.data.filter(u => u.active !== false));
          }
        })
        .catch(() => {});
    }
  }, [open]);

  // Auto-correct session if not allowed by event type or hall
  useEffect(() => {
    let allowedSessionNames = [];
    
    if (settingsEventTypes.length > 0) {
      const currentEv = settingsEventTypes.find(t => (typeof t === "string" ? t : t.name) === form.eventType);
      if (currentEv) {
        allowedSessionNames = currentEv.sessions ? currentEv.sessions.map(s => s.name) : (currentEv.allowedSessions || []);
      }
    }
    
    const selectedHall = settingsHalls.find(h => h.name === form.hallPreference);
    if (selectedHall && selectedHall.allowedSessions && selectedHall.allowedSessions.length > 0) {
       if (allowedSessionNames.length > 0) {
          allowedSessionNames = allowedSessionNames.filter(s => selectedHall.allowedSessions.includes(s));
          if (allowedSessionNames.length === 0) allowedSessionNames = [...selectedHall.allowedSessions];
       } else {
          allowedSessionNames = [...selectedHall.allowedSessions];
       }
    }

    if (form.session && allowedSessionNames.length > 0 && !allowedSessionNames.includes(form.session)) {
      setForm(prev => ({ ...prev, session: "" }));
    }
  }, [form.eventType, form.hallPreference, settingsEventTypes, settingsHalls]);

  // Fetch real-time availability
  useEffect(() => {
    if (form.tentativeDate && form.hallPreference) {
      setFetchingAvailability(true);
      availabilityAPI.check(form.hallPreference, form.tentativeDate, editData ? editData.id : null)
        .then(res => {
          const avail = res.data.data;
          setAvailability(avail);
          // Auto clear selected session if it's no longer available
          if (form.session === "Morning" && avail.morning === "booked") setForm(prev => ({ ...prev, session: "" }));
          if (form.session === "Evening" && avail.evening === "booked") setForm(prev => ({ ...prev, session: "" }));
          if (form.session === "Full Day" && avail.fullDay === "booked") setForm(prev => ({ ...prev, session: "" }));
        })
        .catch(console.error)
        .finally(() => setFetchingAvailability(false));
    } else {
      setAvailability({ morning: "available", evening: "available", fullDay: "available", status: "Available" });
    }
  }, [form.tentativeDate, form.hallPreference, editData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (placeRef.current && !placeRef.current.contains(e.target)) {
        setShowPlaceDropdown(false);
      }
      if (eventTypeRef.current && !eventTypeRef.current.contains(e.target)) {
        setShowEventTypeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "budget") setUserEditedBudget(true); // Stop auto-calc if user manually edits
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const filteredPlaces = (places || []).filter(p => {
    if (typeof p !== 'string') return false;
    return p.toLowerCase().includes((placeQuery || "").toLowerCase());
  });

  const filteredEventTypes = (settingsEventTypes.length > 0 ? settingsEventTypes.map(t => typeof t === "string" ? t : t.name) : EVENT_TYPES)
    .filter(t => t.toLowerCase().includes((eventTypeQuery || "").toLowerCase()));

  const isFormValid = Boolean(
    form.name?.trim() &&
    form.phone?.trim() &&
    form.gender &&
    form.place?.trim() &&
    form.address?.trim() &&
    form.eventType?.trim() &&
    form.tentativeDate &&
    form.hallPreference &&
    form.session &&
    form.guestCount !== "" &&
    form.budget !== "" &&
    form.leadScore &&
    form.salesExecutiveId &&
    form.source
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError("Please fill all mandatory fields marked with (*).");
      return;
    }
    const cleanPhone = (form.phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        // ── EDIT MODE ── Update enquiry fields directly
        await enquiriesAPI.update(editData.id, {
          enquirerName: form.name.trim(),
          enquirerPhone: form.phone.replace(/\D/g, "").slice(-10),
          enquirerArea: form.place.trim(),
          enquirerAddress: form.address.trim(),
          eventType: form.eventType,
          tentativeDate: form.tentativeDate || undefined,
          session: form.session,
          hallPreference: form.hallPreference,
          guestCount: parseInt(form.guestCount) || 0,
          budget: parseInt(form.budget) || 0,
          leadScore: form.leadScore || undefined,
          remarks: form.remarks || undefined,
          source: form.source || undefined,
          salesExecutiveId: parseInt(form.salesExecutiveId) || undefined,
        });
        addToast("Enquiry updated successfully! ✏️", "success");
      } else {
        // ── CREATE MODE ── Create enquiry directly
        await enquiriesAPI.create({
          enquirerName: form.name.trim(),
          enquirerPhone: form.phone.replace(/\D/g, "").slice(-10),
          enquirerArea: form.place.trim(),
          enquirerAddress: form.address.trim(),
          eventType: form.eventType,
          tentativeDate: form.tentativeDate || undefined,
          session: form.session,
          hallPreference: form.hallPreference,
          guestCount: parseInt(form.guestCount) || 0,
          budget: parseInt(form.budget) || 0,
          leadScore: form.leadScore || undefined,
          remarks: form.remarks || undefined,
          source: form.source || undefined,
          status: "New Enquiry",
          salesExecutiveId: parseInt(form.salesExecutiveId) || undefined,
        });
      }

      setForm({ name: "", phone: "", gender: "", address: "", place: "", eventType: "", tentativeDate: prefillDate, session: "", hallPreference: "", guestCount: "", budget: "", leadScore: "", remarks: "", source: "", salesExecutiveId: "" });
      setPlaceQuery("");
      onSuccess?.();
      
      // WhatsApp Redirect
      if (sendWhatsApp) {
        const message = editData 
          ? `Hello ${form.name},\n\nYour enquiry details have been updated for ${form.hallPreference}.`
          : `Hello ${form.name},\n\nThank you for enquiring at ${venueName}.\nEvent: ${form.eventType}\nHall: ${form.hallPreference}\nDate: ${form.tentativeDate}\n\nWe will get back to you shortly.`;
        
        const phoneNum = `91${form.phone.replace(/\\D/g, "").slice(-10)}`;
        const text = encodeURIComponent(message);
        const waUrl = `https://wa.me/${phoneNum}?text=${text}`;
        window.open(waUrl, "_blank");
      }

    } catch (err) {
      console.error("Enquiry submission error:", err.response?.data);
      
      let msg = "Failed to save enquiry. Please try again.";
      
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // If it's a Zod validation error array, show the first specific field error
        const firstErr = err.response.data.errors[0];
        msg = firstErr.message ? `${firstErr.path?.join('.')} : ${firstErr.message}` : "Validation failed check all fields";
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
        <div style={{ background: "#fff", width: "100%", maxWidth: 620, borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" }}>
        
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
              {editData ? "✏️ Edit Enquiry" : "New Enquiry"}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(212,160,23,0.9)" }}>
              {editData ? `Editing ${editData.enquiryNumber || "enquiry"} — ${editData.Customer?.name || ""}` : "Capture lead details — booking can be done later"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
          
          <form id="new-enquiry-form" noValidate onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* ── Customer Info ── */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <User size={12} /> Enquirer Information
              </p>

              {/* Row 1: Name + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Enquired By *</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Muhammed Rafi" style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} type="tel" maxLength={10}
                    placeholder="e.g. 9447012345" style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>

              {/* Row 2: Gender + Place */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Gender *</label>
                  <select required name="gender" value={form.gender} onChange={handleChange}
                    style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    <option value="" disabled>-- Select --</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {/* Place with autocomplete dropdown */}
                <div ref={placeRef} style={{ position: "relative" }}>
                  <label style={labelSt}>
                    <MapPin size={10} style={{ display: "inline", marginRight: 3 }} /> Place / Area *
                  </label>
                  <input
                    required
                    type="text"
                    name="place"
                    value={placeQuery || form.place}
                    onChange={e => {
                      setPlaceQuery(e.target.value);
                      setForm(prev => ({ ...prev, place: e.target.value }));
                      setShowPlaceDropdown(true);
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#1B4332";
                      setShowPlaceDropdown(true);
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      // Use timeout to allow click events on dropdown items to fire
                      setTimeout(() => setShowPlaceDropdown(false), 150);
                    }}
                    placeholder="e.g. Kannur"
                    style={iStyle}
                    autoComplete="off"
                  />
                  {showPlaceDropdown && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                      background: "#fff", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      border: "1.5px solid #e5e7eb", maxHeight: 180, overflowY: "auto", marginTop: 4
                    }}>
                      {filteredPlaces.length > 0 ? (
                        filteredPlaces.map(p => (
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
                        ))
                      ) : (
                        placeQuery.trim() !== "" && (
                          <div
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setPlaceToConfirm(placeQuery.trim());
                              setShowPlaceDropdown(false);
                            }}
                            style={{
                              padding: "10px 14px", fontSize: 13, color: "#0284c7", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 8, fontWeight: 600
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#e0f2fe"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                          >
                            <Plus size={14} /> Add "{placeQuery}" as new place
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Address */}
              <div>
                <label style={labelSt}>Address *</label>
                <textarea
                  required
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

            {/* ── Hall & Session ── */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={12} /> Hall & Session *
              </p>
              
              {/* Hall Cards */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {(settingsHalls.length > 0 ? settingsHalls : HALLS.map(h => ({ name: h }))).map((h, index) => {
                  const themes = [
                    { icon: "🏛️", bg: "#fafafa" }, 
                    { icon: "🏠", bg: "#fffaf0" }, 
                    { icon: "✨", bg: "#f8fafc" },
                    { icon: "🎪", bg: "#fdf4ff" },
                    { icon: "🏰", bg: "#eff6ff" }
                  ];
                  const t = themes[index % themes.length];
                  const isSelected = form.hallPreference === h.name;
                  
                  return (
                  <div
                    key={h.name}
                    onClick={() => {
                      setForm(prev => ({ ...prev, hallPreference: h.name }));
                      setUserEditedBudget(false);
                    }}
                    style={{
                      position: "relative",
                      flex: 1, minWidth: 140, padding: "18px 12px", borderRadius: 12, 
                      border: `1.5px solid ${isSelected ? "#1B4332" : "#e5e7eb"}`,
                      background: isSelected ? "#f0faf4" : t.bg, 
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s"
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#111", textAlign: "center" }}>{h.name}</div>
                    
                    {(Number(h.price) > 0 || Number(h.pricePerPax) > 0 || h.pricingType === "slab") ? (
                      <div style={{ fontSize: 10, color: "#6b7280", textAlign: "center" }}>
                        {h.pricingType === "per_pax" ? `₹${h.pricePerPax} / pax` : h.pricingType === "slab" ? "Slab-Based Pricing" : `₹${h.price} / session`}
                      </div>
                    ) : null}
                    {h.capacity > 0 && <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center" }}>Up to {h.capacity} guests</div>}
                    
                    {isSelected && (
                      <div style={{ position: "absolute", bottom: 10, left: 10 }}>
                        <CheckCircle2 size={16} color="#1B4332" />
                      </div>
                    )}
                  </div>
                )})}
              </div>

              {/* Session Pills */}
              <div style={{ marginTop: 20 }}>
                <label style={labelSt}>SESSION *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {(() => {
                    let allowed = [];
                    if (settingsEventTypes.length > 0) {
                      const currentEv = settingsEventTypes.find(t => (typeof t === "string" ? t : t.name) === form.eventType);
                      if (currentEv && currentEv.sessions) {
                        allowed = currentEv.sessions;
                      } else if (currentEv && currentEv.allowedSessions) {
                        allowed = currentEv.allowedSessions.map(s => ({ name: s }));
                      } else {
                        allowed = settingsSessions.length > 0 ? settingsSessions : SESSIONS.map(s => ({ name: s }));
                      }
                    } else {
                      allowed = settingsSessions.length > 0 ? settingsSessions : SESSIONS.map(s => ({ name: s }));
                    }

                    const selectedHall = settingsHalls.find(h => h.name === form.hallPreference);
                    if (selectedHall && selectedHall.allowedSessions && selectedHall.allowedSessions.length > 0) {
                       allowed = allowed.filter(s => selectedHall.allowedSessions.includes(s.name));
                       if (allowed.length === 0) {
                         allowed = selectedHall.allowedSessions.map(s => ({ name: s }));
                       }
                    }
                    return allowed.map(s => {
                      let isBooked = false;
                      if (s.name === "Morning" && availability.morning === "booked") isBooked = true;
                      if (s.name === "Evening" && availability.evening === "booked") isBooked = true;
                      if (s.name === "Full Day" && availability.fullDay === "booked") isBooked = true;
                      if (s.name === "Afternoon" && availability.morning === "booked") isBooked = true; // simplifying logic
                      
                      return (
                      <div
                        key={s.name}
                        onClick={() => !isBooked && setForm(prev => ({ ...prev, session: s.name }))}
                        style={{
                          flex: 1, minWidth: 100, padding: "12px", borderRadius: 8, 
                          border: `1.5px solid ${form.session === s.name ? "#1B4332" : "#e5e7eb"}`,
                          background: form.session === s.name ? "#1B4332" : isBooked ? "#f1f5f9" : "#fff",
                          color: form.session === s.name ? "#fff" : isBooked ? "#94a3b8" : "#374151",
                          cursor: isBooked ? "not-allowed" : "pointer", textAlign: "center", transition: "all 0.2s"
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s.name}</div>
                        {isBooked ? (
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444" }}>Booked</div>
                        ) : (
                          s.time && <div style={{ fontSize: 10, opacity: form.session === s.name ? 0.9 : 0.6 }}>{s.time}</div>
                        )}
                      </div>
                    )});
                  })()}
                </div>
                {availability.status === "Fully Booked" && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                    No sessions available on this date for the selected hall.
                  </div>
                )}
              </div>
            </div>

            {/* ── Event Info ── */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={12} /> Event Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div ref={eventTypeRef} style={{ position: "relative" }}>
                  <label style={labelSt}>Event Type *</label>
                  <input
                    required
                    type="text"
                    name="eventType"
                    value={eventTypeQuery || form.eventType}
                    onChange={e => {
                      setEventTypeQuery(e.target.value);
                      setForm(prev => ({ ...prev, eventType: e.target.value }));
                      setShowEventTypeDropdown(true);
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#1B4332";
                      setShowEventTypeDropdown(true);
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      setTimeout(() => setShowEventTypeDropdown(false), 150);
                    }}
                    placeholder="e.g. Wedding"
                    style={iStyle}
                    autoComplete="off"
                  />
                  {showEventTypeDropdown && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                      background: "#fff", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      border: "1.5px solid #e5e7eb", maxHeight: 180, overflowY: "auto", marginTop: 4
                    }}>
                      {filteredEventTypes.length > 0 ? (
                        filteredEventTypes.map(t => (
                          <div
                            key={t}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setForm(prev => ({ ...prev, eventType: t }));
                              setEventTypeQuery(t);
                              setShowEventTypeDropdown(false);
                            }}
                            style={{
                              padding: "10px 14px", fontSize: 13, color: "#374151", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 8,
                              borderBottom: "1px solid #f3f4f6"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f0faf4"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                          >
                            {t}
                          </div>
                        ))
                      ) : (
                        eventTypeQuery.trim() !== "" && (
                          <div
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setEventTypeToConfirm(eventTypeQuery.trim());
                              setShowEventTypeDropdown(false);
                            }}
                            style={{
                              padding: "10px 14px", fontSize: 13, color: "#0284c7", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 8, fontWeight: 600
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#e0f2fe"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                          >
                            <Plus size={14} /> Add "{eventTypeQuery}" as new Event Type
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <label style={labelSt}>Event Date *</label>
                  <SmartDatePicker 
                    value={form.tentativeDate} 
                    onChange={handleChange} 
                    hallPreference={form.hallPreference}
                    allowPastDates={allowPastDates}
                    style={{ ...iStyle, padding: "8px 12px", height: 40, fontWeight: 700, borderColor: form.tentativeDate ? "#e2e8f0" : "#e5e7eb" }}
                  />
                  {form.tentativeDate && form.hallPreference && (
                    <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: availability.status === "Fully Booked" ? "#dc2626" : availability.status === "Partially Booked" ? "#d97706" : "#16a34a" }}>
                      {fetchingAvailability ? "Checking availability..." : availability.status}
                    </div>
                  )}
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
                  <label style={labelSt}>Est. Guests *</label>
                  <input required type="number" name="guestCount" value={form.guestCount} onChange={handleChange}
                    placeholder="e.g. 400" style={iStyle} min="0"
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Budget (₹) *</label>
                  <input required type="number" name="budget" value={form.budget} onChange={(e) => { handleChange(e); setUserEditedBudget(true); }}
                    placeholder="e.g. 150000" style={iStyle} min="0"
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Lead Score *</label>
                  <select required name="leadScore" value={form.leadScore} onChange={handleChange} style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    <option value="" disabled>-- Select --</option>
                    {LEAD_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
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

            {/* ── Additional Details ── */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={12} /> Assignment & Remarks
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Salesman (Assigned To) *</label>
                  <select required name="salesExecutiveId" value={form.salesExecutiveId} onChange={handleChange} style={{ ...iStyle, cursor: role === "Sales" ? "not-allowed" : "pointer", background: role === "Sales" ? "#f1f5f9" : "#fff" }}
                    disabled={role === "Sales"}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    <option value="" disabled>-- Select Salesman --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Lead Source *</label>
                  <select required name="source" value={form.source} onChange={handleChange} style={{ ...iStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    <option value="" disabled>-- Select --</option>
                    {["Walk-in", "Phone Call", "Website", "Social Media", "Referral", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelSt}><FileText size={11} style={{ display: "inline", marginRight: 4 }} />Remarks</label>
                <textarea name="remarks" value={form.remarks} onChange={handleChange}
                  rows={2} placeholder="Any notes from the initial call or visit..."
                  style={{ ...iStyle, resize: "none", lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div style={{ marginTop: 8, padding: "12px", background: "#f0faf4", border: "1px solid #d1fae5", borderRadius: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#166534", fontWeight: 700 }}>
                  <input type="checkbox" checked={sendWhatsApp} onChange={(e) => setSendWhatsApp(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#166534", cursor: "pointer" }} />
                  Send WhatsApp Confirmation Message to Customer
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ background: "#f8f9fa", borderTop: "1px solid #eaeaea", display: "flex", flexDirection: "column" }}>
          {error && (
            <div style={{ margin: "16px 24px 0 24px", display: "flex", alignItems: "center", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px" }}>
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{error}</span>
            </div>
          )}
          <div style={{ padding: "16px 24px", display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#fff", border: "1.5px solid #e5e7eb", fontWeight: 700, cursor: "pointer", color: "#555", fontSize: 14 }}>
              Cancel
            </button>
            <button type="submit" form="new-enquiry-form" disabled={loading}
              style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: loading ? "#9ca3af" : "linear-gradient(135deg, #1B4332, #2D6A4F)", border: "none", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", color: "#fff", fontSize: 14, boxShadow: loading ? "none" : "0 4px 12px rgba(27,67,50,0.25)" }}>
              {loading ? "Saving..." : editData ? "✏️ Update Enquiry" : "✅ Save Enquiry"}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* ── Custom Place Confirmation Modal ── */}
      {placeToConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(4px)",
          zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={24} color="#15803d" />
              </div>
            </div>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#111827", textAlign: "center" }}>
              Add New Place?
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#4b5563", textAlign: "center", lineHeight: 1.5 }}>
              Are you sure you want to permanently add <strong>"{placeToConfirm}"</strong> to your system's Place dropdown list?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setPlaceToConfirm(null)}
                style={{ flex: 1, padding: "12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const newPlace = placeToConfirm;
                  const newPlaces = [...places, newPlace];
                  setPlaces(newPlaces);
                  setForm(prev => ({ ...prev, place: newPlace }));
                  setPlaceQuery(newPlace);
                  setPlaceToConfirm(null);
                  try {
                    await settingsAPI.update({ places: newPlaces });
                    addToast(`"${newPlace}" added to places!`, "success");
                  } catch(e) {}
                }}
                style={{ flex: 1, padding: "12px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Yes, Add It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Event Type Confirmation Modal ── */}
      {eventTypeToConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(4px)",
          zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={24} color="#15803d" />
              </div>
            </div>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#111827", textAlign: "center" }}>
              Add New Event Type?
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#4b5563", textAlign: "center", lineHeight: 1.5 }}>
              Permanently add <strong>"{eventTypeToConfirm}"</strong>? Please select available sessions for this event. (You can customize timings later in Settings)
            </p>

            <div style={{ marginBottom: 24, textAlign: "left" }}>
               <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Available Sessions *</label>
               <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                 {["Morning", "Afternoon", "Evening", "Night", "Full Day"].map(s => (
                   <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: selectedSessions.includes(s) ? "#f0faf4" : "#f9fafb", padding: "6px 12px", borderRadius: 8, border: `1px solid ${selectedSessions.includes(s) ? "#1B4332" : "#e5e7eb"}` }}>
                     <input type="checkbox" checked={selectedSessions.includes(s)} onChange={(e) => {
                       if (e.target.checked) setSelectedSessions([...selectedSessions, s]);
                       else setSelectedSessions(selectedSessions.filter(x => x !== s));
                     }} style={{ margin: 0, accentColor: "#1B4332" }} />
                     <span style={{ fontSize: 13, fontWeight: 600, color: selectedSessions.includes(s) ? "#1B4332" : "#4b5563" }}>{s}</span>
                   </label>
                 ))}
               </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setEventTypeToConfirm(null)}
                style={{ flex: 1, padding: "12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                disabled={selectedSessions.length === 0}
                onClick={async () => {
                  const newEvt = eventTypeToConfirm;
                  const newSessions = selectedSessions.map(s => ({ name: s, time: "" }));
                  const newEventTypes = [...settingsEventTypes, { name: newEvt, sessions: newSessions }];
                  setSettingsEventTypes(newEventTypes);
                  setForm(prev => ({ ...prev, eventType: newEvt, session: selectedSessions[0] }));
                  setEventTypeQuery(newEvt);
                  setEventTypeToConfirm(null);
                  try {
                    await settingsAPI.update({ eventTypes: newEventTypes });
                    addToast(`"${newEvt}" added to Event Types!`, "success");
                  } catch(e) {}
                }}
                style={{ flex: 1, padding: "12px", background: selectedSessions.length === 0 ? "#9ca3af" : "#1B4332", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: selectedSessions.length === 0 ? "not-allowed" : "pointer" }}
              >
                Yes, Add It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
