import React from 'react';
import { Calendar, ToggleRight, ToggleLeft } from "lucide-react";
import { settingsAPI } from "../../services/api";
import { useConfirm } from "../../components/ConfirmProvider";

export default function BookingTab({
  venue,
  setVenue,
  addToast
}) {
  const cardSt = {
    background: "#fff", borderRadius: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20, marginBottom: 16,
  };
  const sectionTitle = {
    fontFamily: "'Playfair Display', serif", fontSize: 16,
    fontWeight: 700, color: "#111827", margin: 0,
  };
  const { confirm } = useConfirm();

  return (
    <div style={cardSt}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calendar size={20} color="#2563eb" />
        </div>
        <div>
          <p style={sectionTitle}>Booking Preferences</p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Control booking rules and calculations</p>
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderRadius: 12, background: "#f8fafc", border: "1.5px solid #e2e8f0"
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Allow Past Date Bookings</p>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginBottom: 0, lineHeight: 1.4 }}>
            When enabled, staff can create enquiries and bookings on past dates. Useful for backfilling previous-year accounting data. <span style={{ fontWeight: 700, color: "#d97706" }}>Turn OFF once done.</span>
          </p>
        </div>
        <button
          onClick={async () => {
            const newVal = !venue.allowPastDateBooking;
            const ok = await confirm(
              newVal 
                ? "Are you sure you want to enable past date bookings? This is usually only done for backfilling old data."
                : "Are you sure you want to disable past date bookings?",
              { title: "Confirm Change", confirmText: newVal ? "Enable" : "Disable", isDanger: newVal }
            );
            if (!ok) return;

            try {
              await settingsAPI.update({ allowPastDateBooking: newVal });
              setVenue(prev => ({ ...prev, allowPastDateBooking: newVal }));
              addToast(newVal ? "Past date bookings enabled! 📅" : "Past date bookings disabled 🔒", "success");
            } catch (e) {
              addToast("Failed to update setting", "error");
            }
          }}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 8,
            display: "flex", alignItems: "center", flexShrink: 0
          }}
        >
          {venue.allowPastDateBooking ? (
            <ToggleRight size={40} color="#16a34a" strokeWidth={1.8} />
          ) : (
            <ToggleLeft size={40} color="#9ca3af" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {/* GST Mode Toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderRadius: 12, background: "#f8fafc", border: "1.5px solid #e2e8f0",
        marginTop: 16
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>GST Calculation Mode</p>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginBottom: 0, lineHeight: 1.4 }}>
            <strong>Inclusive:</strong> GST is already included in the quoted amount.<br/>
            <strong>Exclusive:</strong> GST is added on top of the quoted amount.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
          {["inclusive", "exclusive"].map(mode => (
            <button
              key={mode}
              onClick={async () => {
                if (venue.gstMode === mode) return;

                const ok = await confirm(
                  `Are you sure you want to change the global GST mode to ${mode === "inclusive" ? "Inclusive" : "Exclusive"}? This will permanently change how taxes are calculated on all new bookings moving forward.`,
                  { title: "Change GST Mode", confirmText: "Yes, Change Mode", isDanger: true }
                );
                if (!ok) return;

                try {
                  await settingsAPI.update({ gstMode: mode });
                  setVenue(prev => ({ ...prev, gstMode: mode }));
                  addToast(`GST mode set to ${mode === "inclusive" ? "Inclusive" : "Exclusive"}`, "success");
                } catch (e) {
                  addToast("Failed to update GST mode", "error");
                }
              }}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: venue.gstMode === mode ? "2px solid #1B4332" : "1.5px solid #d1d5db",
                background: venue.gstMode === mode ? "#1B4332" : "#fff",
                color: venue.gstMode === mode ? "#fff" : "#6b7280",
                textTransform: "capitalize",
                transition: "all 0.2s"
              }}
            >
              {mode === "inclusive" ? "Inclusive" : "Exclusive"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
