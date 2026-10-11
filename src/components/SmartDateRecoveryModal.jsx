import React, { useState } from "react";
import { Sparkles, Phone, MessageSquare, Calendar, User, Clock, CheckCircle2, X, ArrowUpRight, DollarSign } from "lucide-react";
import { enquiriesAPI } from "../services/api";

export default function SmartDateRecoveryModal({ 
  open, 
  onClose, 
  dateReleased, 
  hall, 
  candidates = [],
  onOpenConvert,
  addToast 
}) {
  const [candidateList, setCandidateList] = useState(candidates);
  const [updatingId, setUpdatingId] = useState(null);

  React.useEffect(() => {
    setCandidateList(candidates);
  }, [candidates]);

  if (!open || !candidates || candidates.length === 0) return null;

  const handleMarkContacted = async (candidateId) => {
    setUpdatingId(candidateId);
    try {
      await enquiriesAPI.updateWaitlistStatus(candidateId, "Contacted");
      setCandidateList(prev => prev.map(c => c.id === candidateId ? { ...c, waitlistStatus: "Contacted" } : c));
      addToast?.("Marked candidate as Contacted 📞", "success");
    } catch (err) {
      addToast?.("Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (amt) => {
    const num = Math.round(Number(amt) || 0);
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const openWhatsApp = (cand) => {
    const phone = cand.enquirerPhone || cand.Customer?.phone || "";
    const name = cand.enquirerName || cand.Customer?.name || "Customer";
    if (!phone) {
      addToast?.("No phone number available for WhatsApp", "error");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const message = `Dear ${name},\n\nGood news from our auditorium! The date ${dateReleased}${hall ? ` (${hall})` : ""} that you previously enquired for is now available!\n\nWould you like to confirm your booking with us? Please let us know as soon as possible.`;
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(5px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      padding: 16
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 24,
        width: "100%",
        maxWidth: 580,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        border: "1px solid #fde68a",
        overflow: "hidden",
        animation: "slideUp 0.25s ease-out"
      }}>
        
        {/* Luxury Gold/Emerald Header */}
        <div style={{
          background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #b45309 100%)",
          padding: "22px 24px",
          color: "#fff",
          position: "relative"
        }}>
          <button 
            onClick={onClose}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              background: "rgba(254, 243, 199, 0.25)",
              color: "#fef08a",
              border: "1px solid rgba(254, 243, 199, 0.4)",
              borderRadius: 12,
              padding: "3px 10px",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <Sparkles size={12} color="#fef08a" /> Smart Date Recovery
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              {candidateList.length} Matching {candidateList.length === 1 ? "Customer" : "Customers"}
            </span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            Date Released: Re-Capture This Booking!
          </h2>

          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
            Booking for <strong style={{ color: "#fef08a" }}>{dateReleased}</strong> {hall ? `(${hall})` : ""} was just cancelled. Contact previous waitlisted enquiries right now before they book elsewhere!
          </p>
        </div>

        {/* Candidates List */}
        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {candidateList.map((cand, idx) => {
            const name = cand.enquirerName || cand.Customer?.name || "Customer";
            const phone = cand.enquirerPhone || cand.Customer?.phone || "";
            const isContacted = cand.waitlistStatus === "Contacted";

            return (
              <div 
                key={cand.id}
                style={{
                  background: isContacted ? "#f8fafc" : "#fffbeb",
                  border: `1.5px solid ${isContacted ? "#e2e8f0" : "#fcd34d"}`,
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  position: "relative"
                }}
              >
                {/* Priority Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: idx === 0 ? "#b45309" : "#1B4332",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800
                    }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                        {name}
                      </h4>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {cand.enquiryNumber || `ENQ${String(cand.id).padStart(3, "0")}`} • {cand.eventType || "Event"} ({cand.session || "Session"})
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 10,
                    background: isContacted ? "#e0f2fe" : "#fef3c7",
                    color: isContacted ? "#0369a1" : "#92400e",
                    border: `1px solid ${isContacted ? "#bae6fd" : "#fde68a"}`
                  }}>
                    {isContacted ? "✓ Contacted" : "⏳ Priority Match"}
                  </span>
                </div>

                {/* Details Row */}
                <div style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  padding: "8px 0",
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  margin: "8px 0 12px",
                  fontSize: 12,
                  color: "#334155"
                }}>
                  {phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Phone size={12} color="#64748b" />
                      <strong>+91 {phone.replace(/\D/g, "").slice(-10)}</strong>
                    </div>
                  )}
                  {Number(cand.budget) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <DollarSign size={12} color="#166534" />
                      <span>Budget: <strong style={{ color: "#166534" }}>{formatCurrency(cand.budget)}</strong></span>
                    </div>
                  )}
                  {cand.enquirerArea && (
                    <div>
                      Area: <strong>{cand.enquirerArea}</strong>
                    </div>
                  )}
                </div>

                {/* Action Row */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      onClick={() => handleMarkContacted(cand.id)}
                      style={{
                        flex: "1 1 auto",
                        padding: "8px 12px",
                        background: "#fff",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0f172a",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      <Phone size={13} color="#1B4332" /> Call Customer
                    </a>
                  )}

                  {phone && (
                    <button
                      onClick={() => {
                        openWhatsApp(cand);
                        handleMarkContacted(cand.id);
                      }}
                      style={{
                        flex: "1 1 auto",
                        padding: "8px 12px",
                        background: "#25d366",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      onOpenConvert?.(cand);
                    }}
                    style={{
                      flex: "1 1 auto",
                      padding: "8px 14px",
                      background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(27,67,50,0.2)"
                    }}
                  >
                    <ArrowUpRight size={13} /> Convert to Booking
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            Auditorium Revenue Protection Active
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              background: "#e2e8f0",
              border: "none",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer"
            }}
          >
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
}
