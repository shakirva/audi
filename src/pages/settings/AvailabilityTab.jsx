import React, { useState } from 'react';
import { Calendar, Trash2, Plus } from "lucide-react";
import { settingsAPI } from "../../services/api";

export default function AvailabilityTab({
  blackoutDates,
  setBlackoutDates,
  addToast
}) {
  const [blackoutInput, setBlackoutInput] = useState("");

  const addBlackout = async () => {
    if (!blackoutInput) return;
    if (blackoutDates.includes(blackoutInput)) { addToast("Date already blocked!", "error"); return; }
    const newDates = [...blackoutDates, blackoutInput].sort();
    setBlackoutDates(newDates);
    setBlackoutInput("");
    try {
      await settingsAPI.update({ blackoutDates: newDates });
      addToast("Date blocked! 🚫", "success");
    } catch (e) { addToast("Failed to block", "error"); }
  };

  const removeBlackout = async (d) => {
    const newDates = blackoutDates.filter(x => x !== d);
    setBlackoutDates(newDates);
    try {
      await settingsAPI.update({ blackoutDates: newDates });
      addToast("Date unblocked ✅", "success");
    } catch (e) { addToast("Failed to unblock", "error"); }
  };

  const cardSt = {
    background: "#fff", borderRadius: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20, marginBottom: 16,
  };
  const sectionTitle = {
    fontFamily: "'Playfair Display', serif", fontSize: 16,
    fontWeight: 700, color: "#111827", marginBottom: 4, margin: 0,
  };
  const iStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1px solid #e5e7eb", fontSize: 13, color: "#374151",
    background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };

  return (
    <div style={cardSt}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calendar size={20} color="#dc2626" />
        </div>
        <div>
          <p style={sectionTitle}>Blackout Dates</p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Prevent bookings on specific dates</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input 
          type="date" 
          value={blackoutInput} 
          onChange={e => setBlackoutInput(e.target.value)} 
          style={{ ...iStyle, flex: 1, maxWidth: 300 }}
          onFocus={e => e.target.style.borderColor = "#1B4332"}
          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
        />
        <button onClick={addBlackout} style={{
          padding: "0 20px", borderRadius: 8, background: "#dc2626", color: "#fff",
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 2px 8px rgba(220,38,38,0.2)"
        }}>
          <Plus size={16} /> Block Date
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {blackoutDates.map(d => (
          <div key={d} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px"
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#991b1b" }}>
              {new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <button onClick={() => removeBlackout(d)} style={{
              background: "none", border: "none", padding: 4, cursor: "pointer", color: "#ef4444",
              display: "flex", alignItems: "center", justifyContent: "center"
            }} title="Unblock Date">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {blackoutDates.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 14 }}>
            No blackout dates configured. The venue is available every day.
          </div>
        )}
      </div>
    </div>
  );
}
