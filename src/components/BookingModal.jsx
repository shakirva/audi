import { useState } from "react";
import { X, User, Phone, CalendarDays, Building2, Users, IndianRupee, FileText, CheckCircle } from "lucide-react";
import { useToast } from "./Toast";
import { useBookings } from "../context/BookingsContext";

const eventTypeOptions = [
  { label: "💍 Wedding", value: "Wedding" },
  { label: "🥂 Reception", value: "Reception" },
  { label: "💑 Engagement", value: "Engagement" },
  { label: "✝️ Baptism", value: "Baptism" },
  { label: "🎂 Birthday", value: "Birthday" },
  { label: "🙏 Seemantham", value: "Seemantham" },
  { label: "💼 Corporate", value: "Corporate" },
  { label: "🎤 Conference", value: "Conference" },
  { label: "🎓 Annual Day", value: "Annual Day" },
  { label: "🎉 Other", value: "Other" },
];

const hallOptions = [
  { name: "Main Hall",   price: 15000, capacity: 600, icon: "🏛️" },
  { name: "Mini Hall",   price: 6000,  capacity: 150, icon: "🏠" },
  { name: "Open Stage",  price: 8000,  capacity: 300, icon: "🌿" },
];

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
    eventType: editData?.eventType ?? "Wedding",
    hall: editData?.hall ?? "Main Hall",
    date: editData?.date ?? prefillDate,
    session: editData?.session ?? "Full Day",
    guests: editData?.guests ?? "",
    advance: editData?.advance ?? "",
    totalAmount: editData?.totalAmount ?? "",
    notes: editData?.notes ?? "",
  });

  const selectedHall = hallOptions.find(h => h.name === form.hall);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "hall" || name === "session") {
        const hall = hallOptions.find(h => h.name === updated.hall);
        if (hall) {
          updated.totalAmount = String(hall.price * (updated.session === "Full Day" ? 2 : 1));
        }
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customerName || !form.phone || !form.date) {
      addToast("Please fill all required fields", "error");
      return;
    }
    if (editData) {
      updateBooking(editData.id, form);
      addToast("Booking updated successfully! ✏️", "success");
    } else {
      addBooking({ ...form, status: "Enquiry" });
      addToast("Booking saved successfully! 🎉", "success");
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
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{editData ? "Edit Booking" : "New Booking"}</h3>
              <p style={{ fontSize: 12, color: "rgba(212,160,23,0.9)", marginTop: 3 }}>{editData ? `Editing booking ${editData.id}` : "Fill in the details to create a booking"}</p>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelSt}><User size={11} /> Customer Name *</label>
                <input name="customerName" value={form.customerName} onChange={handleChange}
                  placeholder="e.g. Arun & Divya" style={iStyle} required
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelSt}><Phone size={11} /> Phone Number *</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="9447012345" style={iStyle} required
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>
          </div>

          {/* ── SECTION: Event ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <CalendarDays size={13} /> Event Details
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
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
                  <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>₹{h.price.toLocaleString()} / session</p>
                  <p style={{ fontSize: 10, color: "#9ca3af" }}>Up to {h.capacity} guests</p>
                  {form.hall === h.name && <CheckCircle size={14} style={{ color: "#1B4332", marginTop: 4 }} />}
                </button>
              ))}
            </div>
            {/* Session */}
            <div>
              <label style={labelSt}>Session</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Morning", "Evening", "Full Day"].map(s => (
                  <label key={s} style={{
                    flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${form.session === s ? "#1B4332" : "#e5e7eb"}`,
                    background: form.session === s ? "#1B4332" : "#fff",
                    color: form.session === s ? "#fff" : "#6b7280",
                    fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                  }}>
                    <input type="radio" name="session" value={s} checked={form.session === s} onChange={handleChange} style={{ display: "none" }} />
                    {s === "Morning" ? "🌅" : s === "Evening" ? "🌆" : "☀️"} {s}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION: Payment ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <IndianRupee size={13} /> Guests & Payment
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelSt}><Users size={11} /> Expected Guests</label>
                <input type="number" name="guests" value={form.guests} onChange={handleChange}
                  placeholder="e.g. 450" style={iStyle}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelSt}><IndianRupee size={11} /> Advance (₹)</label>
                <input type="number" name="advance" value={form.advance} onChange={handleChange}
                  placeholder="10000" style={iStyle}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelSt}><IndianRupee size={11} /> Total Amount (₹)</label>
                <input type="number" name="totalAmount" value={form.totalAmount} onChange={handleChange}
                  placeholder="Auto-calculated" style={{ ...iStyle, background: "#f9fafb" }}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>
            {/* Auto-calc hint */}
            {selectedHall && (
              <div style={{ background: "#f0faf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <p style={{ fontSize: 11, color: "#15803d", margin: 0 }}>
                  <strong>{selectedHall.name}</strong> — {form.session}: ₹{(selectedHall.price * (form.session === "Full Day" ? 2 : 1)).toLocaleString()} (auto-calculated)
                </p>
              </div>
            )}
          </div>

          {/* ── SECTION: Notes ── */}
          <div style={{ marginBottom: 24 }}>
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
              ✅ {editData ? "Update Booking" : "Save Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
