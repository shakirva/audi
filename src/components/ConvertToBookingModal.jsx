import React, { useState, useEffect } from "react";
import { X, Heart, Image, Utensils, Mic, IndianRupee, Settings } from "lucide-react";
import { bookingsAPI, enquiriesAPI } from "../services/api";
import { useToast } from "../components/Toast";

export default function ConvertToBookingModal({ open, enquiry, onClose }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    brideName: "",
    groomName: "",
    fatherName: "",
    motherName: "",
    whatsapp: "",
    eventType: "",
    hall: "",
    date: "",
    session: "Full Day",
    guests: 0,
    decoration: "Standard",
    catering: "In-house Veg",
    sound: "Standard",
    package: "Gold Package",
    discount: 0,
    totalAmount: 0,
    advance: 0,
    specialInstructions: "",
    notes: ""
  });

  useEffect(() => {
    if (open && enquiry) {
      setFormData({
        customerName: enquiry.Customer?.name || enquiry.customerName || "",
        phone: enquiry.Customer?.phone || enquiry.phone || "",
        email: enquiry.Customer?.email || "",
        address: enquiry.Customer?.address || "",
        brideName: "",
        groomName: "",
        fatherName: "",
        motherName: "",
        whatsapp: "",
        eventType: enquiry.eventType || "Wedding",
        hall: enquiry.hallPreference || "Emerald Hall",
        date: enquiry.tentativeDate || "",
        session: enquiry.session || "Full Day",
        guests: enquiry.guestCount || 500,
        decoration: "Standard",
        catering: "In-house Veg",
        sound: "Standard",
        package: "Gold Package",
        discount: 0,
        totalAmount: enquiry.budget || 0,
        advance: 0,
        specialInstructions: "",
        notes: enquiry.remarks || ""
      });
    }
  }, [open, enquiry]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.date || !formData.hall) {
      addToast("Name, Phone, Date, and Hall are required", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the booking
      await bookingsAPI.create({
        ...formData,
        status: "Confirmed" // Automatically Confirmed!
      });

      // 2. Mark the Enquiry as converted
      if (enquiry && enquiry.id) {
        await enquiriesAPI.updateStatus(enquiry.id, "Booking Confirmed");
      }

      addToast("Successfully converted to Booking! 🎉", "success");
      onClose(); // Will trigger refresh in CRM
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to convert", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", width: 800, borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#fff" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Convert to Booking</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.8 }}>Collect comprehensive details to confirm the event.</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", borderRadius: 8, padding: 6 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
          <form id="convert-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            
            {/* Customer Details */}
            <div>
              <h3 style={{ fontSize: 15, color: "#111", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1px solid #eaeaea" }}>
                <Heart size={18} color="#0284c7" /> Contact Details
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Customer Name *</label>
                  <input type="text" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Phone Number *</label>
                  <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Bride Name</label>
                  <input type="text" value={formData.brideName} onChange={e => setFormData({...formData, brideName: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Groom Name</label>
                  <input type="text" value={formData.groomName} onChange={e => setFormData({...formData, groomName: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Father Name</label>
                  <input type="text" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Mother Name</label>
                  <input type="text" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>WhatsApp Number</label>
                  <input type="text" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Complete Address</label>
                  <textarea rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box", resize: "none" }}></textarea>
                </div>
              </div>
            </div>

            {/* Event Requirements */}
            <div>
              <h3 style={{ fontSize: 15, color: "#111", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1px solid #eaeaea" }}>
                <Settings size={18} color="#d97706" /> Event Requirements
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Event Type *</label>
                  <select value={formData.eventType} onChange={e => setFormData({...formData, eventType: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}>
                    <option value="Wedding">Wedding</option>
                    <option value="Reception">Reception</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Event Date *</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Hall Preference *</label>
                  <select value={formData.hall} onChange={e => setFormData({...formData, hall: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}>
                    <option value="Emerald Hall">Emerald Hall</option>
                    <option value="Orchid Hall">Orchid Hall</option>
                    <option value="Ruby Hall">Ruby Hall</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Session *</label>
                  <select value={formData.session} onChange={e => setFormData({...formData, session: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}><Image size={12}/> Decoration</label>
                  <select value={formData.decoration} onChange={e => setFormData({...formData, decoration: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}>
                    <option value="Standard">Standard Package</option>
                    <option value="Premium">Premium Theme</option>
                    <option value="External">External Decorator</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}><Utensils size={12}/> Catering</label>
                  <select value={formData.catering} onChange={e => setFormData({...formData, catering: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}>
                    <option value="In-house Veg">In-house Veg</option>
                    <option value="In-house Non-Veg">In-house Non-Veg</option>
                    <option value="External Caterer">External Caterer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}><Mic size={12}/> Sound / Audio</label>
                  <input type="text" value={formData.sound} onChange={e => setFormData({...formData, sound: e.target.value})} placeholder="DJ / Live Band / Standard" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Guest Count (Expected)</label>
                  <input type="number" value={formData.guests} onChange={e => setFormData({...formData, guests: Number(e.target.value)})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Special Instructions</label>
                  <textarea rows="2" value={formData.specialInstructions} onChange={e => setFormData({...formData, specialInstructions: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box", resize: "none" }}></textarea>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div>
              <h3 style={{ fontSize: 15, color: "#111", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1px solid #eaeaea" }}>
                <IndianRupee size={18} color="#166534" /> Financials
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Package Type</label>
                  <select value={formData.package} onChange={e => setFormData({...formData, package: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}>
                    <option value="Gold Package">Gold Package</option>
                    <option value="Platinum Package">Platinum Package</option>
                    <option value="Custom Pricing">Custom Pricing</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Discount Applied (₹)</label>
                  <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Total Contract Value (₹) *</label>
                  <input type="number" required value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box", fontSize: 16, fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Advance Payment Received (₹) *</label>
                  <input type="number" required value={formData.advance} onChange={e => setFormData({...formData, advance: Number(e.target.value)})} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box", fontSize: 16, fontWeight: 700 }} />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #eaeaea", display: "flex", justifyContent: "flex-end", gap: 12, background: "#f8f9fa" }}>
          <button type="button" onClick={onClose} disabled={loading} style={{ padding: "10px 20px", borderRadius: 8, background: "#fff", border: "1px solid #ddd", fontWeight: 700, cursor: "pointer", color: "#555" }}>Cancel</button>
          <button type="submit" form="convert-form" disabled={loading} style={{ padding: "10px 24px", borderRadius: 8, background: "#1B4332", border: "none", fontWeight: 700, cursor: "pointer", color: "#fff", boxShadow: "0 4px 12px rgba(27,67,50,0.2)", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Confirming..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
