import React, { useState } from "react";
import { X, Building2, Users, IndianRupee, Clock, CheckCircle } from "lucide-react";

const iStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151",
  background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", transition: "all 0.15s"
};

const labelSt = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 6,
};

const ALL_SESSIONS = ["Morning", "Afternoon", "Evening", "Full Day"];

export default function CreateHallModal({ open, onClose, onSave, editData }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    icon: "✨",
    capacity: "",
    description: "",
    pricingType: "flat",
    price: "",
    pricePerPax: "",
    allowedSessions: ["Morning", "Afternoon", "Evening", "Full Day"],
    slabs: []
  });

  React.useEffect(() => {
    if (open && editData) {
      setForm({
        ...editData,
        capacity: editData.capacity || "",
        price: editData.price || "",
        pricePerPax: editData.pricePerPax || "",
        allowedSessions: editData.allowedSessions || ["Morning", "Afternoon", "Evening", "Full Day"],
      });
      setStep(1);
    } else if (open) {
      setForm({ name: "", icon: "✨", capacity: "", description: "", pricingType: "flat", price: "", pricePerPax: "", allowedSessions: [...ALL_SESSIONS], slabs: [] });
      setStep(1);
    }
  }, [open, editData]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleSession = (session) => {
    setForm(prev => {
      const allowed = prev.allowedSessions.includes(session)
        ? prev.allowedSessions.filter(s => s !== session)
        : [...prev.allowedSessions, session];
      return { ...prev, allowedSessions: allowed };
    });
  };

  const handleNext = () => {
    if (step === 1 && !form.name) return;
    setStep(2);
  };

  const handleSubmit = () => {
    onSave({
      ...form,
      capacity: Number(form.capacity) || 0,
      price: Number(form.price) || 0,
      pricePerPax: Number(form.pricePerPax) || 0,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: 540, overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)", padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{editData ? "Edit Hall" : "Create New Hall"}</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>Step {step} of 2: {step === 1 ? "Basic Details" : "Pricing & Sessions"}</p>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 16 }}>
                <div>
                  <label style={labelSt}>Icon</label>
                  <input name="icon" value={form.icon} onChange={handleChange} style={{ ...iStyle, textAlign: "center", fontSize: 24, padding: "8px" }} />
                </div>
                <div>
                  <label style={labelSt}>Hall Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Royal Banquet" style={iStyle} required />
                </div>
              </div>
              <div>
                <label style={labelSt}><Users size={11} style={{ display: "inline", marginRight: 4 }}/> Max Capacity</label>
                <input type="number" name="capacity" value={form.capacity} onChange={handleChange} placeholder="e.g. 500" style={iStyle} />
              </div>
              <div>
                <label style={labelSt}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Brief description of the hall..." style={{ ...iStyle, resize: "none" }} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={labelSt}>Pricing Model</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { id: "flat", label: "Flat Rate" },
                    { id: "per_pax", label: "Per Pax" },
                    { id: "slab", label: "Slab / Package Wise" }
                  ].map(p => (
                    <div key={p.id} onClick={() => setForm(prev => ({ ...prev, pricingType: p.id }))}
                      style={{
                        padding: "12px 10px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                        border: `1.5px solid ${form.pricingType === p.id ? "#1B4332" : "#e5e7eb"}`,
                        background: form.pricingType === p.id ? "#f0faf4" : "#fff",
                        color: form.pricingType === p.id ? "#1B4332" : "#6b7280",
                        fontWeight: 600, fontSize: 12, transition: "all 0.15s"
                      }}>
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>

              {form.pricingType === "flat" && (
                <div>
                  <label style={labelSt}><IndianRupee size={11} style={{ display: "inline", marginRight: 4 }}/> Base Flat Price (₹)</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="e.g. 15000" style={iStyle} />
                </div>
              )}

              {form.pricingType === "per_pax" && (
                <div>
                  <label style={labelSt}><IndianRupee size={11} style={{ display: "inline", marginRight: 4 }}/> Price Per Person (₹)</label>
                  <input type="number" name="pricePerPax" value={form.pricePerPax} onChange={handleChange} placeholder="e.g. 500" style={iStyle} />
                </div>
              )}

              {form.pricingType === "slab" && (
                <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                    ℹ️ You can configure the specific pricing slabs for this hall later from the <b>Hall Pricing Configuration</b> section.
                  </p>
                </div>
              )}

              <div>
                <label style={labelSt}><Clock size={11} style={{ display: "inline", marginRight: 4 }}/> Supported Sessions</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {ALL_SESSIONS.map(s => (
                    <div key={s} onClick={() => toggleSession(s)}
                      style={{
                        padding: "8px 14px", borderRadius: 20, cursor: "pointer",
                        border: `1.5px solid ${form.allowedSessions.includes(s) ? "#1B4332" : "#e5e7eb"}`,
                        background: form.allowedSessions.includes(s) ? "#1B4332" : "#fff",
                        color: form.allowedSessions.includes(s) ? "#fff" : "#6b7280",
                        fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
                      }}>
                      {form.allowedSessions.includes(s) && <CheckCircle size={12} color="#fff" />}
                      {s}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #eaeaea", background: "#f9fafb", display: "flex", gap: 12 }}>
          {step === 2 && (
            <button onClick={() => setStep(1)} style={{ padding: "12px 24px", borderRadius: 10, background: "#fff", border: "1.5px solid #e5e7eb", fontWeight: 700, color: "#374151", cursor: "pointer" }}>Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step === 1 ? (
            <button onClick={handleNext} disabled={!form.name} style={{ padding: "12px 32px", borderRadius: 10, background: form.name ? "#1B4332" : "#9ca3af", border: "none", fontWeight: 700, color: "#fff", cursor: form.name ? "pointer" : "not-allowed", boxShadow: form.name ? "0 4px 12px rgba(27,67,50,0.25)" : "none" }}>Next</button>
          ) : (
            <button onClick={handleSubmit} style={{ padding: "12px 32px", borderRadius: 10, background: "#1B4332", border: "none", fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(27,67,50,0.25)" }}>{editData ? "Save Changes" : "Create Hall"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
