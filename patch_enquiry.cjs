const fs = require('fs');

const path = './src/pages/PublicBooking.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldEnquiryForm = content.substring(content.indexOf('function EnquiryForm({'), content.indexOf('function PublicBookingInner() {'));

const newEnquiryForm = `function EnquiryForm({ dateStr, onClose, onSubmit, eventTypes, sessions, halls }) {
  const defaultEvent = eventTypes?.[0] || "Wedding";
  const defaultSession = sessions?.find(s => s.name === "Full Day")?.name || sessions?.[0]?.name || "Morning";
  const defaultHall = halls?.[0]?.name || "";
  
  const [form, setForm] = useState({ name: "", phone: "", gender: "Male", place: "", address: "", eventType: defaultEvent, session: defaultSession, hallPreference: defaultHall, guests: "", budget: "", notes: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const iStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151", background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
  const labelSt = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };

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
                    <div key={h.name} onClick={() => set("hallPreference", h.name)} style={{ position: "relative", flex: 1, minWidth: 140, padding: "18px 12px", borderRadius: 12, border: \`1.5px solid \${isSelected ? "#1B4332" : "#e5e7eb"}\`, background: isSelected ? "#f0faf4" : t.bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#111", textAlign: "center" }}>{h.name}</div>
                      {(Number(h.price) > 0 || Number(h.pricePerPax) > 0 || h.pricingType === "slab") && (
                        <div style={{ fontSize: 10, color: "#6b7280", textAlign: "center" }}>
                          {h.pricingType === "per_pax" ? \`₹\${h.pricePerPax} / pax\` : h.pricingType === "slab" ? "Slab-Based Pricing" : \`₹\${h.price} / session\`}
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
                {(sessions || []).map(s => (
                  <div key={s.name} onClick={() => set("session", s.name)} style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 8, border: \`1.5px solid \${form.session === s.name ? "#1B4332" : "#e5e7eb"}\`, background: form.session === s.name ? "#1B4332" : "#fff", color: form.session === s.name ? "#fff" : "#374151", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s.name}</div>
                    {s.time && <div style={{ fontSize: 10, opacity: form.session === s.name ? 0.9 : 0.6 }}>{s.time}</div>}
                  </div>
                ))}
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
                  <select value={form.eventType} onChange={e => set("eventType", e.target.value)} required style={{ ...iStyle, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                    <option value="" disabled>-- Select --</option>
                    {(eventTypes || []).map(t => (typeof t === "string" ? t : t.name)).map(t => <option key={t}>{t}</option>)}
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
                  <label style={labelSt}>Budget (₹) *</label>
                  <input type="number" value={form.budget} onChange={e => set("budget", e.target.value)} placeholder="e.g. 150000" required style={iStyle} onFocus={e => e.target.style.borderColor = "#1B4332"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
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
`;

fs.writeFileSync(path, content.replace(oldEnquiryForm, newEnquiryForm));
console.log('Replaced EnquiryForm');
