import React, { useState } from "react";
import { AlertTriangle, Clock, X, MessageSquare, CheckCircle2, ChevronRight, Ban, Calendar } from "lucide-react";
import { enquiriesAPI } from "../services/api";

export default function SlotClashResolutionModal({
  open,
  onClose,
  bookedDate,
  hall,
  competingLeads = [],
  onResolved,
  addToast,
}) {
  const [leads, setLeads] = useState(competingLeads);
  const [processingId, setProcessingId] = useState(null);
  const [sendWhatsApp, setSendWhatsApp] = useState({});

  React.useEffect(() => {
    setLeads(competingLeads);
  }, [competingLeads]);

  if (!open || !leads || leads.length === 0) return null;

  const handleMoveToWaitlist = async (lead) => {
    setProcessingId(lead.id);
    try {
      await enquiriesAPI.update(lead.id, {
        isWaitlisted: true,
        waitlistStatus: "Waiting",
        waitlistNotes: `Moved to waitlist because ${bookedDate} was confirmed by another client.`,
      });
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? { ...l, isWaitlisted: true, waitlistStatus: "Waiting", resolvedAction: "waitlist" }
            : l
        )
      );
      addToast?.("Moved to VIP Waitlist! ⏳", "success");

      // Check if WhatsApp notification should be sent
      const shouldSend = sendWhatsApp[lead.id] ?? true;
      if (shouldSend) {
        const phone = lead.enquirerPhone || lead.Customer?.phone || lead.phone;
        const name = lead.enquirerName || lead.Customer?.name || lead.customerName || "Customer";
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, "").slice(-10);
          const msg = `Dear ${name},\n\nThank you for reaching out regarding your event on ${bookedDate}${hall ? ` at ${hall}` : ""}.\n\nThis slot has just been confirmed for another booking. We have prioritized you on our VIP Date Waitlist! If this date is released or cancelled, we will notify you immediately.\n\nWould you also like to consider an alternate date? Let us know!`;
          window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      }
    } catch (err) {
      addToast?.("Failed to move to waitlist", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkLost = async (lead) => {
    setProcessingId(lead.id);
    try {
      await enquiriesAPI.update(lead.id, {
        status: "Lost",
        lostReason: "Date confirmed by another booking / Slot Clash",
      });
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? { ...l, status: "Lost", resolvedAction: "lost" }
            : l
        )
      );
      addToast?.("Enquiry marked as Lost ❌", "info");

      // Check if WhatsApp notification should be sent
      const shouldSend = sendWhatsApp[lead.id] ?? true;
      if (shouldSend) {
        const phone = lead.enquirerPhone || lead.Customer?.phone || lead.phone;
        const name = lead.enquirerName || lead.Customer?.name || lead.customerName || "Customer";
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, "").slice(-10);
          const msg = `Dear ${name},\n\nThank you for your enquiry for ${bookedDate}${hall ? ` at ${hall}` : ""}.\nUnfortunately, this slot has been booked by another party. We apologize for any inconvenience and look forward to hosting your future events!`;
          window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      }
    } catch (err) {
      addToast?.("Failed to update status", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const allResolved = leads.every((l) => l.resolvedAction);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 640,
          borderRadius: 20,
          boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          animation: "scaleUp 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #7f1d1d, #991b1b)",
            padding: "24px 28px",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={24} color="#fca5a5" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#fca5a5",
                  marginBottom: 4,
                }}
              >
                Slot Clash Resolution
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                {leads.length} Competing {leads.length === 1 ? "Lead" : "Leads"} Detected
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#fecaca" }}>
                Another booking is confirmed for{" "}
                <strong>{bookedDate}</strong>
                {hall ? ` (${hall})` : ""}. Choose how to handle competing enquiries:
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onResolved?.();
              onClose();
            }}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* List of Competing Enquiries */}
        <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {leads.map((lead) => {
            const name = lead.enquirerName || lead.Customer?.name || lead.customerName || "Enquiry";
            const phone = lead.enquirerPhone || lead.Customer?.phone || lead.phone || "No phone";
            const isProcessing = processingId === lead.id;

            return (
              <div
                key={lead.id}
                style={{
                  border: lead.resolvedAction ? "1.5px solid #bbf7d0" : "1.5px solid #fecaca",
                  background: lead.resolvedAction ? "#f0fdf4" : "#fff",
                  borderRadius: 14,
                  padding: 16,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {lead.enquiryNumber || `ENQ#${lead.id}`}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {phone} · {lead.eventType || "Event"} {lead.session ? `(${lead.session})` : ""}
                    </div>
                  </div>

                  {lead.resolvedAction && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: lead.resolvedAction === "waitlist" ? "#fef3c7" : "#fee2e2",
                        color: lead.resolvedAction === "waitlist" ? "#b45309" : "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 size={13} />
                      {lead.resolvedAction === "waitlist" ? "Moved to VIP Waitlist" : "Marked as Lost"}
                    </span>
                  )}
                </div>

                {!lead.resolvedAction && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                    {/* Send WhatsApp Checkbox Toggle */}
                    <div style={{ marginBottom: 10 }}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          color: (sendWhatsApp[lead.id] ?? true) ? "#15803d" : "#64748b",
                          background: (sendWhatsApp[lead.id] ?? true) ? "#f0fdf4" : "#f8fafc",
                          border: `1.5px solid ${(sendWhatsApp[lead.id] ?? true) ? "#86efac" : "#e2e8f0"}`,
                          borderRadius: 8,
                          padding: "6px 12px",
                          userSelect: "none",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={sendWhatsApp[lead.id] ?? true}
                          onChange={(e) => setSendWhatsApp((prev) => ({ ...prev, [lead.id]: e.target.checked }))}
                          style={{ width: 16, height: 16, accentColor: "#16a34a", cursor: "pointer" }}
                        />
                        <span>💬 Send WhatsApp notification to client</span>
                      </label>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        disabled={isProcessing}
                        onClick={() => handleMoveToWaitlist(lead)}
                      style={{
                        flex: 1,
                        minWidth: 160,
                        background: "#d97706",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "9px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 2px 6px rgba(217,119,6,0.3)",
                      }}
                    >
                      <Clock size={14} /> Move to VIP Waitlist
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleMarkLost(lead)}
                      style={{
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        borderRadius: 10,
                        padding: "9px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Ban size={14} /> Close / Lost
                    </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {allResolved ? "✅ All competing leads resolved" : "Resolving saves leads into waitlist or archives them"}
          </span>
          <button
            onClick={() => {
              onResolved?.();
              onClose();
            }}
            style={{
              background: "#1B4332",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {allResolved ? "Done" : "Close & Keep Open"}
          </button>
        </div>
      </div>
    </div>
  );
}
