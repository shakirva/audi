import React from 'react';
import { Building2, User, MapPin, ImagePlus, UploadCloud, Loader, Save } from "lucide-react";

export default function GeneralTab({
  venue,
  handleVenueChange,
  handleLogoUpload,
  isUploadingLogo,
  handleSaveVenue
}) {
  const iStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e5e7eb", fontSize: 13, color: "#374151",
    background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };
  const labelSt = {
    fontSize: 11, fontWeight: 700, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.07em",
    display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
  };
  const cardSt = {
    background: "#fff", borderRadius: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 24, marginBottom: 16,
  };
  const sectionTitle = {
    fontFamily: "'Playfair Display', serif", fontSize: 16,
    fontWeight: 700, color: "#111827", marginBottom: 4, margin: 0,
  };

  return (
    <div style={cardSt}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={20} color="#1B4332" />
        </div>
        <div>
          <p style={sectionTitle}>Venue Information</p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Your auditorium's public profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <label style={labelSt}><Building2 size={13} /> Auditorium Name</label>
          <input name="name" value={venue.name} onChange={handleVenueChange} style={iStyle}
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>
        <div>
          <label style={labelSt}><User size={13} /> Owner Name</label>
          <input name="owner" value={venue.owner} onChange={handleVenueChange} style={iStyle}
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelSt}><MapPin size={13} /> Location</label>
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
          <input name="gstin" value={venue.gstin} onChange={handleVenueChange} style={iStyle}
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>
        <div>
          <label style={labelSt}>🔢 Booking ID Prefix</label>
          <input name="bookingPrefix" value={venue.bookingPrefix} onChange={handleVenueChange} style={iStyle} placeholder="e.g. BK, LGE, etc."
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>Used when auto-generating new Booking IDs (e.g. {venue.bookingPrefix || "BK"}001)</p>
        </div>
        <div>
          <label style={labelSt}>🧾 Receipt ID Prefix</label>
          <input name="receiptPrefix" value={venue.receiptPrefix} onChange={handleVenueChange} style={iStyle} placeholder="e.g. PAY, RCP, etc."
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>Used when auto-generating new Receipt IDs (e.g. {venue.receiptPrefix || "PAY"}00046)</p>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelSt}><ImagePlus size={13} /> Logo URL</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input name="logoUrl" value={venue.logoUrl} onChange={handleVenueChange} style={{ ...iStyle, flex: 1 }} placeholder="https://..."
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "0 20px", background: "#f1f5f9", border: "1px solid #e2e8f0", 
              borderRadius: 8, cursor: isUploadingLogo ? "not-allowed" : "pointer", 
              color: "#475569", fontWeight: 600, fontSize: 13,
              opacity: isUploadingLogo ? 0.7 : 1
            }}>
              {isUploadingLogo ? <Loader size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              Upload
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} disabled={isUploadingLogo} />
            </label>
          </div>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>Used in PDF Receipts and Invoices</p>
        </div>

        <div style={{ gridColumn: "1 / -1", marginTop: 24, marginBottom: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}>Billing & Bank Details</p>
        </div>

        <div>
          <label style={labelSt}>🏛️ Legal Entity Name</label>
          <input name="legalName" value={venue.legalName} onChange={handleVenueChange} style={iStyle} placeholder="Legal name if different"
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>
        <div>
          <label style={labelSt}>🏦 Bank Name</label>
          <input name="bankName" value={venue.bankName} onChange={handleVenueChange} style={iStyle} placeholder="e.g. HDFC Bank"
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>
        <div>
          <label style={labelSt}>👤 Account Name</label>
          <input name="accountName" value={venue.accountName} onChange={handleVenueChange} style={iStyle} placeholder="e.g. Venueza Event Management"
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>
        <div>
          <label style={labelSt}>💳 Account Number</label>
          <input name="accountNumber" value={venue.accountNumber} onChange={handleVenueChange} style={iStyle} placeholder="0000 0000 0000"
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>
        <div>
          <label style={labelSt}>🔢 IFSC Code</label>
          <input name="ifscCode" value={venue.ifscCode} onChange={handleVenueChange} style={iStyle} placeholder="e.g. HDFC0001234"
            onFocus={e => e.target.style.borderColor = "#1B4332"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        </div>
      </div>

      <button onClick={handleSaveVenue} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 24px", borderRadius: 8, border: "none",
        background: "#1B4332", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 2px 10px rgba(27,67,50,0.2)",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#163829"}
        onMouseLeave={e => e.currentTarget.style.background = "#1B4332"}>
        <Save size={16} /> Save Venue Info
      </button>
    </div>
  );
}
