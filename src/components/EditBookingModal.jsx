import React, { useState, useEffect } from "react";
import { X, Building2, Users, IndianRupee, CreditCard, Smartphone, Banknote, CheckCircle2, User, Phone, MapPin, Calendar, Plus, CheckSquare } from "lucide-react";
import { bookingsAPI } from "../services/api";
import { useToast } from "./Toast";

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
const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Cheque"];

export default function EditBookingModal({ open, booking, onClose, onSaved }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [facilitiesList, setFacilitiesList] = useState([]);

  useEffect(() => {
    // Fetch facilities from master
    import("../services/api").then(({ mastersAPI }) => {
      mastersAPI.getByType("services").then(res => setFacilitiesList(res.data?.data || []));
    });
  }, []);

  useEffect(() => {
    if (open && booking) {
      setForm({
        // Contact
        customerName: booking.customerName || "",
        phone: booking.phone || "",
        whatsapp: booking.whatsapp || "",
        address: booking.address || "",
        clientGstNumber: booking.clientGstNumber || "",
        pincode: booking.pincode || "",
        bookedBy: booking.bookedBy || "",
        bookingParty: booking.bookingParty || "",
        // Bride
        brideName: booking.brideName || "",
        brideFatherName: booking.brideFatherName || "",
        brideMotherName: booking.brideMotherName || "",
        bridePhone: booking.bridePhone || "",
        brideAddress: booking.brideAddress || "",
        // Groom
        groomName: booking.groomName || "",
        groomFatherName: booking.groomFatherName || "",
        groomMotherName: booking.groomMotherName || "",
        groomPhone: booking.groomPhone || "",
        groomAddress: booking.groomAddress || "",
        // Event
        eventType: booking.eventType || "",
        hall: booking.hall || "",
        date: booking.date ? booking.date.split("T")[0] : "",
        session: booking.session || "",
        guests: booking.guests || "",
        extraArrangements: booking.extraArrangements || "",
        facilities: booking.facilities || [],
        // Financial (GST is inclusive: quotedAmount = totalAmount + discount)
        quotedAmount: (Number(booking.totalAmount || 0) + Number(booking.discount || 0)) || "",
        discount: booking.discount || "",
        taxes: booking.taxes || "",
        taxPercentage: booking.taxes && booking.totalAmount ? Math.round((Number(booking.taxes) / (Number(booking.totalAmount) - Number(booking.taxes))) * 100) : "",
        totalAmount: booking.totalAmount || "",
        advance: booking.advance || "",
        depositAmount: booking.depositAmount || "",
        balanceAmount: (Number(booking.totalAmount || 0) - Number(booking.advance || 0) - Number(booking.depositAmount || 0)) || "",
        // Payment
        paymentMethod: booking.paymentMethod || "",
        receivedBy: booking.receivedBy || "",
        upiId: booking.upiId || "",
        upiName: booking.upiName || "",
        upiAmount: booking.upiAmount || "",
        accountName: booking.accountName || "",
        paymentRemarks: booking.paymentRemarks || "",
        // Notes
        specialInstructions: booking.specialInstructions || booking.notes || "",
      });
    }
  }, [open, booking]);

  if (!open || !booking) return null;

  const handleMoneyChange = (field, value, extraState = {}) => {
    let updated = { ...form, [field]: value, ...extraState };
    
    const quoted = Number(updated.quotedAmount) || 0;
    const disc = Number(updated.discount) || 0;
    const baseAmount = Math.max(0, quoted - disc);

    // Auto-calculate GST (Exclusive): GST = Base × Rate / 100
    const pct = Number(updated.taxPercentage) || 0;
    
    let facilitiesTotal = 0;
    let facilitiesTax = 0;
    if (updated.facilities && updated.facilities.length > 0) {
      updated.facilities.forEach(f => {
        const fPrice = Number(f.price) || 0;
        const fGst = Number(f.gst) || 0;
        facilitiesTotal += fPrice;
        if (fGst > 0) {
          facilitiesTax += (fPrice * fGst) / 100;
        }
      });
    }

    if (field === "quotedAmount" || field === "discount" || field === "taxPercentage") {
      updated.totalAmount = baseAmount; // Total remains Quoted - Discount
      const hallTotal = Math.max(0, baseAmount - facilitiesTotal);
      const hallTax = pct > 0 ? (hallTotal * pct) / 100 : 0;
      updated.taxes = Math.round(hallTax + facilitiesTax);
    }
    
    const adv = Number(updated.advance) || 0;
    const dep = Number(updated.depositAmount) || 0;
    const total = Number(updated.totalAmount) || 0;
    updated.balanceAmount = Math.max(0, total - adv - dep);
    setForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.phone) {
      addToast("Customer name and phone are required", "error");
      return;
    }
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      addToast("Phone number must be exactly 10 digits", "error");
      return;
    }
    setLoading(true);
    try {
      await bookingsAPI.update(booking.id, form);
      addToast("Booking updated successfully! ✏️", "success");
      onSaved?.();
      onClose();

      const message = `Hello ${form.customerName},\n\nYour booking details at Laural Garden Auditorium have been updated.\n\nEvent: ${form.eventType}\nHall: ${form.hall}\nDate: ${form.date}\nTotal Amount: ₹${Number(form.totalAmount).toLocaleString()}\nBalance: ₹${Number(form.balanceAmount || 0).toLocaleString()}\n\nThank you!`;
      const waPhone = form.whatsapp ? form.whatsapp : form.phone;
      const phoneNum = `91${waPhone.replace(/\D/g, "").slice(-10)}`;
      const text = encodeURIComponent(message);
      const waUrl = `https://wa.me/${phoneNum}?text=${text}`;
      window.open(waUrl, "_blank");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update booking", "error");
    } finally {
      setLoading(false);
    }
  };

  const inp = (field, opts = {}) => (
    <input
      {...opts}
      value={form[field] ?? ""}
      onChange={e => opts.money
        ? handleMoneyChange(field, e.target.value)
        : setForm({ ...form, [field]: e.target.value })}
      style={iStyle}
      onFocus={e => e.target.style.borderColor = "#1B4332"}
      onBlur={e => e.target.style.borderColor = "#e5e7eb"}
    />
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 820, borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "94vh" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #0D2418, #1B4332)", color: "#fff" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>✏️ Edit Booking</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(212,160,23,0.9)" }}>
              {booking.bookingNumber || booking.id} — {booking.customerName} · {booking.eventType}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", borderRadius: 8, padding: 6 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
          <form id="edit-booking-form" noValidate onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* ── CONTACT ── */}
            <div>
              <p style={sectionHead}><User size={14} /> Contact Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Customer Name *</label>
                  {inp("customerName", { required: true, placeholder: "Customer name" })}
                </div>
                <div>
                  <label style={labelSt}>Booked By</label>
                  {inp("bookedBy", { placeholder: "Person who confirmed booking" })}
                </div>
                <div>
                  <label style={labelSt}><Phone size={10} /> Phone *</label>
                  {inp("phone", { required: true, type: "tel", maxLength: 10 })}
                </div>
                <div>
                  <label style={labelSt}>WhatsApp</label>
                  {inp("whatsapp", { type: "tel", placeholder: "If different", maxLength: 10 })}
                </div>
                <div>
                  <label style={labelSt}>Booking Party</label>
                  <select value={form.bookingParty || ""} onChange={e => setForm({ ...form, bookingParty: e.target.value })} style={iStyle}>
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
                <div>
                  <label style={labelSt}>🔖 Client GST Number</label>
                  {inp("clientGstNumber", { placeholder: "e.g. 32AABCU9603R1ZJ" })}
                </div>
              </div>
            </div>

            {/* ── BRIDE ── */}
            <div>
              <p style={sectionHead}><User size={14} /> Bride Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={labelSt}>Bride Name</label>{inp("brideName")}</div>
                <div><label style={labelSt}>Father Name</label>{inp("brideFatherName")}</div>
                <div><label style={labelSt}>Mother Name</label>{inp("brideMotherName")}</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mb-6">
                <div><label style={labelSt}>Phone</label>{inp("bridePhone", { type: "tel", maxLength: 10 })}</div>
                <div><label style={labelSt}>Address</label>{inp("brideAddress")}</div>
              </div>
            </div>

            {/* ── GROOM ── */}
            <div>
              <p style={sectionHead}><User size={14} /> Groom Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={labelSt}>Groom Name</label>{inp("groomName")}</div>
                <div><label style={labelSt}>Father Name</label>{inp("groomFatherName")}</div>
                <div><label style={labelSt}>Mother Name</label>{inp("groomMotherName")}</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mb-6">
                <div><label style={labelSt}>Phone</label>{inp("groomPhone", { type: "tel", maxLength: 10 })}</div>
                <div><label style={labelSt}>Address</label>{inp("groomAddress")}</div>
              </div>
            </div>

            {/* ── EVENT ── */}
            <div>
              <p style={sectionHead}><Building2 size={14} /> Event Details</p>
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
                  <label style={labelSt}><Calendar size={10} /> Event Date</label>
                  <div style={{ ...iStyle, padding: "8px 12px", height: 38, background: "#f8fafc", display: "flex", alignItems: "center", color: "#475569", fontWeight: 700, cursor: "not-allowed", border: "1.5px solid #e2e8f0" }}>
                    {form.date ? new Date(form.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date selected'}
                  </div>
                </div>
                <div>
                  <label style={labelSt}>Event Type</label>
                  {inp("eventType", { placeholder: "Wedding, Nikkah..." })}
                </div>
                <div>
                  <label style={labelSt}><Users size={10} /> No. of Guests</label>
                  {inp("guests", { type: "number", min: 0, placeholder: "e.g. 500" })}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={labelSt}>Special Instructions</label>
                <textarea
                  value={form.specialInstructions || ""}
                  onChange={e => setForm({ ...form, specialInstructions: e.target.value })}
                  rows={2} placeholder="Any special notes..."
                  style={{ ...iStyle, resize: "none", lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
            </div>

            {/* ── FACILITIES ── */}
            {facilitiesList.length > 0 && (
              <div>
                <p style={sectionHead}><CheckSquare size={14} /> Facilities & Add-ons</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {facilitiesList.map(f => {
                    const checked = form.facilities?.some(x => x.id === f.id);
                    return (
                      <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: checked ? "#f0faf4" : "#f8fafc", padding: "12px", borderRadius: 10, border: `1.5px solid ${checked ? "#1B4332" : "#e5e7eb"}`, transition: "all 0.15s" }}>
                        <input type="checkbox" checked={checked} onChange={(e) => {
                          let newFac = [...(form.facilities || [])];
                          let newQuoted = Number(form.quotedAmount || 0);
                          if (e.target.checked) {
                            newFac.push({ id: f.id, name: f.name, price: f.price, gst: f.gst || 0 });
                            newQuoted += Number(f.price || 0);
                          } else {
                            newFac = newFac.filter(x => x.id !== f.id);
                            newQuoted -= Number(f.price || 0);
                          }
                          handleMoneyChange("quotedAmount", newQuoted, { facilities: newFac });
                        }} style={{ width: 16, height: 16, accentColor: "#1B4332", cursor: "pointer" }} />
                        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: checked ? "#1B4332" : "#374151" }}>{f.name}</div>
                          {f.price > 0 && <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>₹{Number(f.price).toLocaleString()} {f.gst > 0 ? ` (+ ${f.gst}% GST)` : ""}</div>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── FINANCIALS ── */}
            <div>
              <p style={sectionHead}><IndianRupee size={14} /> Financial Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelSt}>Quoted Amount (₹)</label>
                  <input type="number" min={0} value={form.quotedAmount || ""}
                    onChange={e => handleMoneyChange("quotedAmount", e.target.value)}
                    style={{ ...iStyle, fontWeight: 700, fontSize: 14 }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Discount (₹)</label>
                  <input type="number" min={0} value={form.discount || ""}
                    onChange={e => handleMoneyChange("discount", e.target.value)}
                    style={{ ...iStyle, fontWeight: 700, color: "#d97706" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Final Total Amount (₹)</label>
                  <input type="number" min={0} value={form.totalAmount || ""}
                    onChange={e => handleMoneyChange("totalAmount", e.target.value)}
                    style={{ ...iStyle, fontWeight: 800, fontSize: 15, background: "#f8fafc" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelSt}>Tax / GST Rate (%)</label>
                  <input type="number" min={0} value={form.taxPercentage || ""}
                    onChange={e => handleMoneyChange("taxPercentage", e.target.value)}
                    style={{ ...iStyle, fontWeight: 700 }}
                    placeholder="e.g. 18"
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Tax Amount (₹)</label>
                  <input type="number" min={0} value={form.taxes || ""}
                    onChange={e => handleMoneyChange("taxes", e.target.value)}
                    style={{ ...iStyle, fontWeight: 700, color: "#991b1b" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={labelSt}>Advance Paid (₹)</label>
                  <input type="number" min={0} value={form.advance || ""}
                    onChange={e => handleMoneyChange("advance", e.target.value)}
                    style={{ ...iStyle, fontWeight: 700, color: "#166534" }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelSt}>Deposit Amount (₹)</label>
                  <input type="number" min={0} value={form.depositAmount || ""}
                    onChange={e => handleMoneyChange("depositAmount", e.target.value)}
                    style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
              <div style={{ marginTop: 12, padding: "12px 16px", background: Number(form.balanceAmount) > 0 ? "#fef2f2" : "#f0faf4", borderRadius: 10, border: `1px solid ${Number(form.balanceAmount) > 0 ? "#fecaca" : "#bbf7d0"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#374151", fontSize: 13 }}>Balance Amount Payable</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: Number(form.balanceAmount) > 0 ? "#dc2626" : "#166534" }}>
                  ₹{Number(form.balanceAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── PAYMENT ── */}
            <div>
              <p style={sectionHead}><CreditCard size={14} /> Payment Details</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {PAYMENT_METHODS.map(method => {
                  const icons = { Cash: <Banknote size={16} />, UPI: <Smartphone size={16} />, "Bank Transfer": <Building2 size={16} />, Cheque: <CreditCard size={16} /> };
                  const selected = form.paymentMethod === method;
                  return (
                    <button key={method} type="button"
                      onClick={() => setForm({ ...form, paymentMethod: method })}
                      style={{
                        flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                        border: `2px solid ${selected ? "#1B4332" : "#e5e7eb"}`,
                        background: selected ? "#1B4332" : "#fff",
                        color: selected ? "#fff" : "#6b7280",
                        fontWeight: 700, fontSize: 12, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 4, transition: "all 0.2s",
                      }}>
                      {icons[method]}
                      {method}
                      {selected && <CheckCircle2 size={12} style={{ marginTop: 2 }} />}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {form.paymentMethod === "UPI" && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelSt}>UPI Payments (ID, Name, Amount & Collector)</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(form.upiId || "").split(",").map((id, index, arr) => {
                        const upiNames = (form.upiName || "").split(",");
                        const upiName = upiNames[index] || "";
                        const collectors = (form.receivedBy || "").split(",");
                        const collector = collectors[index] || "";
                        const upiAmounts = (form.upiAmount || "").split(",");
                        const upiAmt = upiAmounts[index] || "";
                        
                        return (
                          <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10 }}>
                            <input 
                              value={id.trim()} 
                              onChange={(e) => {
                                const newArr = [...arr];
                                newArr[index] = e.target.value.replace(/,/g, "");
                                setForm({ ...form, upiId: newArr.join(",") });
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
                                setForm({ ...form, upiName: newArr.join(",") });
                              }} 
                              style={iStyle}
                              placeholder="UPI Name" 
                              onFocus={e => e.target.style.borderColor = "#1B4332"}
                              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                            />
                            <input 
                              type="number"
                              min={0}
                              value={upiAmt.trim()} 
                              onChange={(e) => {
                                const newArr = [...upiAmounts];
                                newArr[index] = e.target.value.replace(/,/g, "");
                                setForm({ ...form, upiAmount: newArr.join(",") });
                              }} 
                              style={iStyle}
                              placeholder="Amount (₹)" 
                              onFocus={e => e.target.style.borderColor = "#1B4332"}
                              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                            />
                            <input 
                              value={collector.trim()} 
                              onChange={(e) => {
                                const newArr = [...collectors];
                                newArr[index] = e.target.value.replace(/,/g, "");
                                setForm({ ...form, receivedBy: newArr.join(",") });
                              }} 
                              style={iStyle}
                              placeholder="Collected By" 
                              onFocus={e => e.target.style.borderColor = "#1B4332"}
                              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                            />
                            <div style={{ display: "flex", alignItems: "center" }}>
                              {index === arr.length - 1 ? (
                                <button type="button" onClick={() => setForm({ 
                                  ...form, 
                                  upiId: form.upiId ? form.upiId + "," : ",",
                                  upiName: form.upiName ? form.upiName + "," : ",",
                                  receivedBy: form.receivedBy ? form.receivedBy + "," : ",",
                                  upiAmount: form.upiAmount ? form.upiAmount + "," : ","
                                })} style={{ height: 37, padding: "0 12px", background: "#f3f4f6", border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Add another UPI entry">
                                  <Plus size={16} color="#374151" />
                                </button>
                              ) : (
                                <button type="button" onClick={() => setForm({ 
                                  ...form, 
                                  upiId: arr.filter((_, i) => i !== index).join(","),
                                  upiName: upiNames.filter((_, i) => i !== index).join(","),
                                  receivedBy: collectors.filter((_, i) => i !== index).join(","),
                                  upiAmount: upiAmounts.filter((_, i) => i !== index).join(",")
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
                {form.paymentMethod === "Bank Transfer" && (
                  <div>
                    <label style={labelSt}>Account Holder / Bank Name</label>
                    {inp("accountName", { placeholder: "e.g. Muhammed Rafi — SBI" })}
                  </div>
                )}
                {form.paymentMethod !== "UPI" && (
                  <div>
                    <label style={labelSt}>Collected By</label>
                    {inp("receivedBy", { placeholder: "Collected By" })}
                  </div>
                )}
                <div>
                  <label style={labelSt}>Payment Remarks</label>
                  {inp("paymentRemarks", { placeholder: "e.g. Balance paid by GPay on 22/07/26" })}
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #eaeaea", display: "flex", justifyContent: "flex-end", gap: 12, background: "#f8f9fa" }}>
          <button type="button" onClick={onClose} disabled={loading}
            style={{ padding: "10px 20px", borderRadius: 8, background: "#fff", border: "1px solid #ddd", fontWeight: 700, cursor: "pointer", color: "#555" }}>
            Cancel
          </button>
          <button type="submit" form="edit-booking-form" disabled={loading}
            style={{ padding: "10px 28px", borderRadius: 8, background: "linear-gradient(135deg, #1B4332, #2D6A4F)", border: "none", fontWeight: 700, cursor: "pointer", color: "#fff", boxShadow: "0 4px 12px rgba(27,67,50,0.25)", opacity: loading ? 0.7 : 1, fontSize: 14 }}>
            {loading ? "Saving..." : "✅ Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
