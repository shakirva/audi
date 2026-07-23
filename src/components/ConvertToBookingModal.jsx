import React, { useState, useEffect } from "react";
import { X, Heart, Calendar, Building2, Users, IndianRupee, CreditCard, Smartphone, Banknote, User, MapPin, Phone, CheckCircle2, Plus } from "lucide-react";
import { bookingsAPI, enquiriesAPI } from "../services/api";
import { useToast } from "../components/Toast";

const iStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151",
  background: "#fff", outline: "none", boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
};
const labelSt = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
};
const sectionHead = {
  fontSize: 13, fontWeight: 800, color: "#1B4332",
  textTransform: "uppercase", letterSpacing: "0.07em",
  display: "flex", alignItems: "center", gap: 8,
  paddingBottom: 10, borderBottom: "1.5px solid #e5e7eb", marginBottom: 16,
};
const readonlyPill = {
  display: "inline-block", background: "#f0faf4", border: "1px solid #d1fae5",
  borderRadius: 6, padding: "6px 12px", fontSize: 13, fontWeight: 600,
  color: "#1B4332",
};

const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Cheque"];

export default function ConvertToBookingModal({ open, enquiry, onClose }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Contact
    customerName: "",
    phone: "",
    address: "",
    place: "",
    bookedBy: "",
    bookingParty: "",
    whatsapp: "",
    // Bride
    brideName: "", brideFatherName: "", brideMotherName: "",
    bridePhone: "", brideAddress: "",
    // Groom
    groomName: "", groomFatherName: "", groomMotherName: "",
    groomPhone: "", groomAddress: "",
    // Event (pre-filled from enquiry, editable)
    eventType: "", hall: "", date: "", session: "", guests: "", budget: "",
    source: "", leadScore: "", remarks: "",
    // Payment
    quotedAmount: "",
    discount: "",
    totalAmount: "",
    advance: "",
    paymentMethod: "",
    receivedBy: "",
    upiId: "",
    accountName: "",
    depositAmount: "",
    balanceAmount: "",
    extraArrangements: "",
    paymentRemarks: "",
  });

  useEffect(() => {
    if (open && enquiry) {
      const budget = enquiry.budget || 0;
      setFormData(prev => ({
        ...prev,
        customerName: enquiry.Customer?.name || enquiry.customerName || "",
        phone: enquiry.Customer?.phone || enquiry.phone || "",
        address: enquiry.Customer?.address || "",
        place: enquiry.Customer?.city || enquiry.place || "",
        // Event info from enquiry
        eventType: enquiry.eventType || "",
        hall: enquiry.hallPreference || "",
        date: enquiry.tentativeDate ? enquiry.tentativeDate.split("T")[0] : "",
        session: enquiry.session || "",
        guests: enquiry.guestCount || "",
        budget: budget,
        source: enquiry.source || "",
        leadScore: enquiry.leadScore || "",
        remarks: enquiry.remarks || "",
        // Financials
        quotedAmount: budget,
        discount: "",
        totalAmount: budget,
        advance: "",
        depositAmount: "",
        balanceAmount: budget,
        paymentMethod: "",
        receivedBy: "",
        upiId: "",
        accountName: "",
        extraArrangements: "",
        paymentRemarks: "",
        // Reset personal
        bookedBy: "", bookingParty: "", whatsapp: "",
        brideName: "", brideFatherName: "", brideMotherName: "", bridePhone: "", brideAddress: "",
        groomName: "", groomFatherName: "", groomMotherName: "", groomPhone: "", groomAddress: "",
      }));
    }
  }, [open, enquiry]);

  // Auto-calculate balance
  const handleMoneyChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    const quoted = Number(updated.quotedAmount) || 0;
    const disc = Number(updated.discount) || 0;
    
    // Auto calculate Total Amount if quoted or discount changes
    if (field === "quotedAmount" || field === "discount") {
      updated.totalAmount = Math.max(0, quoted - disc);
    }
    
    const total = Number(updated.totalAmount) || 0;
    const adv = Number(updated.advance) || 0;
    const dep = Number(updated.depositAmount) || 0;
    updated.balanceAmount = Math.max(0, total - adv - dep);
    setFormData(updated);
  };

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.bookedBy) {
      addToast("Enquired By, Booked By and Phone are required", "error");
      return;
    }
    if (!formData.paymentMethod) {
      addToast("Please select a Payment Method", "error");
      return;
    }

    setLoading(true);
    try {
      await bookingsAPI.create({
        ...formData,
        status: "Confirmed",
      });

      if (enquiry?.id) {
        await enquiriesAPI.updateStatus(enquiry.id, "Booking Confirmed");
      }

      addToast("Successfully converted to Booking! 🎉", "success");
      onClose();
      
      const message = `Hello ${formData.customerName},\n\nYour booking at Laural Garden Auditorium has been confirmed! 🎉\n\nEvent: ${formData.eventType}\nHall: ${formData.hall}\nDate: ${formData.date}\nTotal Amount: ₹${Number(formData.totalAmount).toLocaleString()}\nAdvance Paid: ₹${Number(formData.advance || 0).toLocaleString()}\nBalance: ₹${Number(formData.balanceAmount || 0).toLocaleString()}\n\nThank you for choosing us!`;
      const waPhone = formData.whatsapp ? formData.whatsapp : formData.phone;
      const phoneNum = `91${waPhone.replace(/\\D/g, "").slice(-10)}`;
      const text = encodeURIComponent(message);
      const waUrl = `https://wa.me/${phoneNum}?text=${text}`;
      window.open(waUrl, "_blank");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to convert", "error");
    } finally {
      setLoading(false);
    }
  };

  const inp = (field, opts = {}) => (
    <input
      {...opts}
      value={formData[field]}
      onChange={e => opts.money
        ? handleMoneyChange(field, e.target.value)
        : setFormData({ ...formData, [field]: e.target.value })}
      style={iStyle}
      onFocus={e => e.target.style.borderColor = "#1B4332"}
      onBlur={e => e.target.style.borderColor = "#e5e7eb"}
    />
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 820, borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "94vh" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #0D2418, #1B4332)", color: "#fff" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>Convert to Booking</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(212,160,23,0.9)" }}>
              {enquiry?.Customer?.name || enquiry?.customerName || "Customer"} — {enquiry?.eventType || "Event"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", borderRadius: 8, padding: 6 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
          <form id="convert-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* ── ENQUIRY SUMMARY (read-only) ── */}
            <div>
              <p style={sectionHead}><Calendar size={14} /> Enquiry Summary</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { label: "Hall", value: formData.hall || "—" },
                  { label: "Session", value: formData.session || "—" },
                  { label: "Event Date", value: formData.date || "—" },
                  { label: "Event Type", value: formData.eventType || "—" },
                  { label: "Est. Guests", value: formData.guests || "—" },
                  { label: "Budget (₹)", value: formData.budget ? `₹${Number(formData.budget).toLocaleString()}` : "—" },
                  { label: "Lead Score", value: formData.leadScore || "—" },
                  { label: "Source", value: formData.source || "—" },
                  { label: "Place", value: formData.place || "—" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1B4332" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {formData.remarks && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a", fontSize: 12, color: "#92400e" }}>
                  💬 <strong>Remarks:</strong> {formData.remarks}
                </div>
              )}
            </div>

            {/* ── CONTACT DETAILS ── */}
            <div>
              <p style={sectionHead}><Heart size={14} /> Contact Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Enquired By *</label>
                  {inp("customerName", { required: true, placeholder: "Customer name" })}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ ...labelSt, marginBottom: 0 }}>Booked By *</label>
                    <button type="button" onClick={() => setFormData({ ...formData, bookedBy: formData.customerName })} style={{ background: "none", border: "none", color: "#0284c7", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Same as Enquired</button>
                  </div>
                  {inp("bookedBy", { required: true, placeholder: "Person confirming booking" })}
                </div>
                <div>
                  <label style={labelSt}><Phone size={10} /> Phone Number *</label>
                  {inp("phone", { required: true, type: "tel", placeholder: "e.g. 9447012345" })}
                </div>
                <div>
                  <label style={labelSt}>WhatsApp Number</label>
                  {inp("whatsapp", { type: "tel", placeholder: "If different from phone" })}
                </div>
                <div>
                  <label style={labelSt}>Booking Party</label>
                  <select value={formData.bookingParty} onChange={e => setFormData({ ...formData, bookingParty: e.target.value })} style={iStyle}>
                    <option value="">-- Select --</option>
                    <option>Bride Team</option>
                    <option>Groom Team</option>
                    <option>Both (Shared Booking)</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelSt}><MapPin size={10} /> Address</label>
                  {inp("address", { placeholder: "House / Building, Street, Town..." })}
                </div>
              </div>
            </div>

            {/* ── BRIDE DETAILS ── */}
            <div>
              <p style={sectionHead}><User size={14} /> Bride Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={labelSt}>Bride Name</label>{inp("brideName", { placeholder: "e.g. Fathima" })}</div>
                <div><label style={labelSt}>Father Name</label>{inp("brideFatherName")}</div>
                <div><label style={labelSt}>Mother Name</label>{inp("brideMotherName")}</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mb-6">
                <div><label style={labelSt}>Phone</label>{inp("bridePhone", { type: "tel" })}</div>
                <div><label style={labelSt}>Address</label>{inp("brideAddress")}</div>
              </div>
            </div>

            {/* ── GROOM DETAILS ── */}
            <div>
              <p style={sectionHead}><User size={14} /> Groom Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={labelSt}>Groom Name</label>{inp("groomName", { placeholder: "e.g. Mohammed Shafiulla" })}</div>
                <div><label style={labelSt}>Father Name</label>{inp("groomFatherName")}</div>
                <div><label style={labelSt}>Mother Name</label>{inp("groomMotherName")}</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mb-6">
                <div><label style={labelSt}>Phone</label>{inp("groomPhone", { type: "tel" })}</div>
                <div><label style={labelSt}>Address</label>{inp("groomAddress")}</div>
              </div>
            </div>

            {/* ── EVENT DETAILS (editable) ── */}
            <div>
              <p style={sectionHead}><Building2 size={14} /> Event Details (Confirm / Edit)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelSt}>Hall</label>
                  {inp("hall", { placeholder: "Hall name" })}
                </div>
                <div>
                  <label style={labelSt}>Session</label>
                  {inp("session", { placeholder: "Morning / Evening / Full Day" })}
                </div>
                <div>
                  <label style={labelSt}>Event Date</label>
                  {inp("date", { type: "date" })}
                </div>
                <div>
                  <label style={labelSt}>Event Type</label>
                  {inp("eventType", { placeholder: "Wedding, Engagement..." })}
                </div>
                <div>
                  <label style={labelSt}><Users size={10} /> No. of Guests</label>
                  {inp("guests", { type: "number", min: 0, placeholder: "e.g. 500" })}
                </div>
                <div>
                  <label style={labelSt}>Extra Arrangements</label>
                  {inp("extraArrangements", { placeholder: "Decoration, DJ, etc." })}
                </div>
              </div>
            </div>

            {/* ── FINANCIAL DETAILS ── */}
            <div>
              <p style={sectionHead}><IndianRupee size={14} /> Financial Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelSt}>Quoted Amount (₹)</label>
                  <input type="number" min={0} value={formData.quotedAmount}
                    onChange={e => handleMoneyChange("quotedAmount", e.target.value)}
                    style={{ ...iStyle, fontWeight: 700, fontSize: 14 }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Discount (₹)</label>
                  <input type="number" min={0} value={formData.discount}
                    onChange={e => handleMoneyChange("discount", e.target.value)}
                    style={{ ...iStyle, fontWeight: 700, color: "#d97706" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Final Total Amount (₹)</label>
                  <input type="number" min={0} value={formData.totalAmount}
                    onChange={e => handleMoneyChange("totalAmount", e.target.value)}
                    style={{ ...iStyle, fontWeight: 800, fontSize: 15, background: "#f8fafc" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Advance Paid (₹)</label>
                  <input type="number" min={0} value={formData.advance}
                    onChange={e => handleMoneyChange("advance", e.target.value)}
                    style={{ ...iStyle, fontWeight: 700, color: "#166534" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Deposit Amount (₹)</label>
                  <input type="number" min={0} value={formData.depositAmount}
                    onChange={e => handleMoneyChange("depositAmount", e.target.value)}
                    style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>

              {/* Balance display */}
              <div style={{ marginTop: 12, padding: "12px 16px", background: Number(formData.balanceAmount) > 0 ? "#fef2f2" : "#f0faf4", borderRadius: 10, border: `1px solid ${Number(formData.balanceAmount) > 0 ? "#fecaca" : "#bbf7d0"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#374151", fontSize: 13 }}>Balance Amount Payable</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: Number(formData.balanceAmount) > 0 ? "#dc2626" : "#166534" }}>
                  ₹{Number(formData.balanceAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── PAYMENT DETAILS ── */}
            <div>
              <p style={sectionHead}><CreditCard size={14} /> Payment Details</p>

              {/* Payment method selector */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {PAYMENT_METHODS.map(method => {
                  const icons = { Cash: <Banknote size={16} />, UPI: <Smartphone size={16} />, "Bank Transfer": <Building2 size={16} />, Cheque: <CreditCard size={16} /> };
                  const selected = formData.paymentMethod === method;
                  return (
                    <button
                      key={method} type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: method })}
                      style={{
                        flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                        border: `2px solid ${selected ? "#1B4332" : "#e5e7eb"}`,
                        background: selected ? "#1B4332" : "#fff",
                        color: selected ? "#fff" : "#6b7280",
                        fontWeight: 700, fontSize: 12, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 4, transition: "all 0.2s",
                      }}
                    >
                      {icons[method]}
                      {method}
                      {selected && <CheckCircle2 size={12} style={{ marginTop: 2 }} />}
                    </button>
                  );
                })}
              </div>

              {/* Conditional UPI / Bank fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {formData.paymentMethod === "UPI" && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelSt}>UPI Payments (ID, Name & Collector)</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(formData.upiId || "").split(",").map((id, index, arr) => {
                        const upiNames = (formData.upiName || "").split(",");
                        const upiName = upiNames[index] || "";
                        const collectors = (formData.receivedBy || "").split(",");
                        const collector = collectors[index] || "";
                        
                        return (
                          <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10 }}>
                            <input 
                              value={id.trim()} 
                              onChange={(e) => {
                                const newArr = [...arr];
                                newArr[index] = e.target.value.replace(/,/g, "");
                                setFormData({ ...formData, upiId: newArr.join(",") });
                              }} 
                              style={iStyle}
                              placeholder="UPI ID / GPay" 
                              onFocus={e => e.target.style.borderColor = "#1B4332"}
                              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                            />
                            <input 
                              value={upiName.trim()} 
                              onChange={(e) => {
                                const newArr = [...upiNames];
                                newArr[index] = e.target.value.replace(/,/g, "");
                                setFormData({ ...formData, upiName: newArr.join(",") });
                              }} 
                              style={iStyle}
                              placeholder="UPI Name" 
                              onFocus={e => e.target.style.borderColor = "#1B4332"}
                              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                            />
                            <input 
                              required={index === 0}
                              value={collector.trim()} 
                              onChange={(e) => {
                                const newArr = [...collectors];
                                newArr[index] = e.target.value.replace(/,/g, "");
                                setFormData({ ...formData, receivedBy: newArr.join(",") });
                              }} 
                              style={iStyle}
                              placeholder="Collected By" 
                              onFocus={e => e.target.style.borderColor = "#1B4332"}
                              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                            />
                            <div style={{ display: "flex", alignItems: "center" }}>
                              {index === arr.length - 1 ? (
                                <button type="button" onClick={() => setFormData({ 
                                  ...formData, 
                                  upiId: formData.upiId ? formData.upiId + "," : ",",
                                  upiName: formData.upiName ? formData.upiName + "," : ",",
                                  receivedBy: formData.receivedBy ? formData.receivedBy + "," : ","
                                })} style={{ height: 37, padding: "0 12px", background: "#f3f4f6", border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Add another UPI entry">
                                  <Plus size={16} color="#374151" />
                                </button>
                              ) : (
                                <button type="button" onClick={() => setFormData({ 
                                  ...formData, 
                                  upiId: arr.filter((_, i) => i !== index).join(","),
                                  upiName: upiNames.filter((_, i) => i !== index).join(","),
                                  receivedBy: collectors.filter((_, i) => i !== index).join(",")
                                })} style={{ height: 37, padding: "0 12px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Remove">
                                  <X size={16} color="#dc2626" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {formData.paymentMethod === "Bank Transfer" && (
                  <div>
                    <label style={labelSt}>Account Holder / Bank Name</label>
                    {inp("accountName", { placeholder: "e.g. Muhammed Rafi — SBI" })}
                  </div>
                )}
                {formData.paymentMethod !== "UPI" && (
                  <div>
                    <label style={labelSt}>Collected By *</label>
                    {inp("receivedBy", { required: true, placeholder: "Collected By" })}
                  </div>
                )}
                <div style={{ gridColumn: formData.paymentMethod === "UPI" || formData.paymentMethod === "Bank Transfer" ? "auto" : "1 / -1" }}>
                  <label style={labelSt}>Payment Remarks</label>
                  {inp("paymentRemarks", { placeholder: "e.g. Paid by cash on 11/07/26. 375000 received..." })}
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #eaeaea", display: "flex", justifyContent: "flex-end", gap: 12, background: "#f8f9fa" }}>
          <button type="button" onClick={onClose} disabled={loading} style={{ padding: "10px 20px", borderRadius: 8, background: "#fff", border: "1px solid #ddd", fontWeight: 700, cursor: "pointer", color: "#555" }}>Cancel</button>
          <button type="submit" form="convert-form" disabled={loading} style={{ padding: "10px 28px", borderRadius: 8, background: "linear-gradient(135deg, #1B4332, #2D6A4F)", border: "none", fontWeight: 700, cursor: "pointer", color: "#fff", boxShadow: "0 4px 12px rgba(27,67,50,0.25)", opacity: loading ? 0.7 : 1, fontSize: 14 }}>
            {loading ? "Confirming..." : "✅ Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
