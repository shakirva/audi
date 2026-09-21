import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, X, Trash2, CalendarClock } from "lucide-react";
import { settingsAPI } from "../../services/api";
import { useConfirm } from "../../components/ConfirmProvider";

export default function FormsTab({
  eventTypes, setEventTypes,
  sessions, setSessions,
  places, setPlaces,
  reminderDays, setReminderDays,
  addToast
}) {
  const { confirm } = useConfirm();
  
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

  const handleSaveLists = async (dataToSave) => {
    try {
      await settingsAPI.update(dataToSave);
    } catch (e) {
      addToast("Failed to save lists", "error");
    }
  };

  // --- ListEditor ---
  const ListEditor = ({ title, desc, items, setItems, stateKey }) => {
    const [newVal, setNewVal] = useState("");
    return (
      <div style={{ marginBottom: 24 }}>
        <label style={labelSt}>{title}</label>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, marginTop: -2 }}>{desc}</p>
        
        {items.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {items.map(item => (
              <div key={item} style={{ padding: "6px 14px", background: "#f1f5f9", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 8, border: "1px solid #e2e8f0" }}>
                {item}
                <button onClick={async () => {
                  const newItems = items.filter(i => i !== item);
                  setItems(newItems);
                  await handleSaveLists({ [stateKey]: newItems });
                }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <X size={14} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "16px", textAlign: "center", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1", fontSize: 13, color: "#64748b", marginBottom: 14 }}>
            No items added yet.
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newVal} onChange={e => setNewVal(e.target.value)} style={{ ...iStyle, flex: 1 }} placeholder="Type new option..." onKeyDown={async e => { 
            if(e.key === "Enter") { 
              e.preventDefault(); 
              if(newVal && !items.includes(newVal)){ 
                const newItems = [...items, newVal];
                setItems(newItems); 
                setNewVal(""); 
                await handleSaveLists({ [stateKey]: newItems });
              } 
            } 
          }} />
          <button onClick={async () => { 
            if(newVal && !items.includes(newVal)){ 
              const newItems = [...items, newVal];
              setItems(newItems); 
              setNewVal(""); 
              await handleSaveLists({ [stateKey]: newItems });
            } 
          }} style={{ padding: "8px 20px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            Add
          </button>
        </div>
      </div>
    );
  };

  // --- SessionTimeEditor ---
  const SessionTimeEditor = () => {
    const [newName, setNewName] = useState("");
    const [newStart, setNewStart] = useState("");
    const [newEnd, setNewEnd] = useState("");

    const parseTimeLabel = (timeStr) => {
      if (!timeStr) return { startTime: "", endTime: "" };
      const parts = timeStr.split(/\s*[–\-]\s*/);
      if (parts.length !== 2) return { startTime: "", endTime: "" };
      const parse12h = (s) => {
        const match = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) return "";
        let h = parseInt(match[1], 10);
        const m = match[2];
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        return `${String(h).padStart(2, "0")}:${m}`;
      };
      return { startTime: parse12h(parts[0]), endTime: parse12h(parts[1]) };
    };

    const normalized = (sessions || []).map(item => {
      if (typeof item === "string") return { name: item, startTime: "", endTime: "", time: "" };
      const name = item.name || "";
      let startTime = item.startTime || "";
      let endTime = item.endTime || "";
      const time = item.time || "";
      if (time && (!startTime || !endTime)) {
        const parsed = parseTimeLabel(time);
        if (!startTime && parsed.startTime) startTime = parsed.startTime;
        if (!endTime && parsed.endTime) endTime = parsed.endTime;
      }
      return { name, startTime, endTime, time };
    });

    const formatTime12h = (t) => {
      if (!t) return "";
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hr = h % 12 || 12;
      return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    const handleAdd = async () => {
      if (!newName.trim()) return;
      if (normalized.find(s => s.name.toLowerCase() === newName.trim().toLowerCase())) return;
      const timeLabel = (newStart && newEnd) ? `${formatTime12h(newStart)} – ${formatTime12h(newEnd)}` : "";
      const newSessions = [...normalized, { name: newName.trim(), startTime: newStart, endTime: newEnd, time: timeLabel }];
      setSessions(newSessions);
      setNewName(""); setNewStart(""); setNewEnd("");
      try {
        await settingsAPI.update({ sessions: newSessions });
        addToast(`"${newName.trim()}" session saved! ✅`, "success");
      } catch (e) {
        addToast("Failed to save new session", "error");
      }
    };

    const handleUpdate = async (idx, field, value) => {
      const updated = [...normalized];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === "startTime" || field === "endTime") {
        const s = updated[idx].startTime;
        const e = updated[idx].endTime;
        updated[idx].time = (s && e) ? `${formatTime12h(s)} – ${formatTime12h(e)}` : "";
      }
      setSessions(updated);
      // We don't auto-save on every keystroke, let user click a save button
    };

    const handleRemove = async (idx) => {
      const sessName = normalized[idx]?.name || "this session";
      const ok = await confirm(`Delete "${sessName}" session?`, { title: "Delete Session", confirmText: "Delete", isDanger: true });
      if (!ok) return;
      const newSessions = normalized.filter((_, i) => i !== idx);
      setSessions(newSessions);
      try {
        await settingsAPI.update({ sessions: newSessions });
        addToast(`"${sessName}" removed.`, "success");
      } catch (e) {
        addToast("Failed to remove session", "error");
      }
    };

    const handleSaveEdits = async () => {
      try {
        await settingsAPI.update({ sessions: normalized });
        addToast("Sessions updated! ✅", "success");
      } catch (e) {
        addToast("Failed to update sessions", "error");
      }
    };

    return (
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <label style={labelSt}>Global Sessions</label>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, marginTop: -2 }}>Define the time slots available for booking across the venue.</p>
          </div>
          {normalized.length > 0 && (
            <button onClick={handleSaveEdits} style={{ padding: "6px 14px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Save Edits
            </button>
          )}
        </div>

        {normalized.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1", fontSize: 13, color: "#64748b", marginBottom: 14 }}>
            No sessions configured yet.
          </div>
        )}

        {normalized.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {normalized.map((sess, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <input
                  value={sess.name}
                  onChange={e => handleUpdate(idx, "name", e.target.value)}
                  style={{ ...iStyle, flex: 1.5, fontWeight: 700, fontSize: 14, padding: "8px 12px" }}
                  placeholder="Session name"
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>FROM</span>
                  <input type="time" value={sess.startTime} onChange={e => handleUpdate(idx, "startTime", e.target.value)} style={{ ...iStyle, padding: "7px 10px", flex: 1 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>TO</span>
                  <input type="time" value={sess.endTime} onChange={e => handleUpdate(idx, "endTime", e.target.value)} style={{ ...iStyle, padding: "7px 10px", flex: 1 }} />
                </div>
                {sess.time && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1B4332", background: "#dcfce7", padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>
                    {sess.time}
                  </span>
                )}
                <button onClick={() => handleRemove(idx)} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#ef4444" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#f1f5f9", padding: "12px 16px", borderRadius: 12 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} style={{ ...iStyle, flex: 2 }} placeholder="New session (e.g. Morning)" />
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>FROM</span>
            <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} style={{ ...iStyle, padding: "7px 10px" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>TO</span>
            <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} style={{ ...iStyle, padding: "7px 10px" }} onKeyDown={e => { if(e.key === "Enter") handleAdd(); }} />
          </div>
          <button onClick={handleAdd} style={{ padding: "9px 20px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
        </div>
      </div>
    );
  };

  // --- EventTypeEditor ---
  const EventTypeEditor = () => {
    const [newName, setNewName] = useState("");
    
    const normalizedItems = eventTypes.map(item => {
      if (typeof item === "string") return { name: item, sessions: [] };
      if (!item.sessions) {
        const oldAllowed = item.allowedSessions || [];
        const mappedSessions = oldAllowed.map(sName => {
          const match = sessions.find(s => s.name === sName);
          return { name: sName, time: match ? match.time : "" };
        });
        return { ...item, sessions: mappedSessions };
      }
      return item;
    });

    const saveEvents = async (newEvents) => {
      try {
        await settingsAPI.update({ eventTypes: newEvents });
      } catch (e) { addToast("Failed to save event type", "error"); }
    };

    return (
      <div style={{ marginBottom: 24 }}>
        <label style={labelSt}>Event Types</label>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, marginTop: -2 }}>Categorize bookings and restrict available sessions per event.</p>
        
        {normalizedItems.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1", fontSize: 13, color: "#64748b", marginBottom: 14 }}>
            No event types added yet.
          </div>
        )}

        {normalizedItems.length > 0 && (
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            {normalizedItems.map(item => (
              <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: 14, background: "#f8fafc", padding: "16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{item.name}</span>
                  <button onClick={async () => {
                    const newEvents = normalizedItems.filter(i => i.name !== item.name);
                    setEventTypes(newEvents);
                    await saveEvents(newEvents);
                  }} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
                    <X size={16} color="#ef4444" />
                  </button>
                </div>
                
                <div style={{ paddingLeft: 16, borderLeft: "2px solid #cbd5e1", display: "flex", flexDirection: "column", gap: 8 }}>
                  {item.sessions && item.sessions.length > 0 ? item.sessions.map((sess, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#475569", minWidth: 90 }}>{sess.name}</span>
                      <input 
                        value={sess.time || ""}
                        onChange={(e) => {
                          const newSessions = [...item.sessions];
                          newSessions[idx] = { ...sess, time: e.target.value };
                          const newEvents = normalizedItems.map(i => i.name === item.name ? { ...i, sessions: newSessions } : i);
                          setEventTypes(newEvents);
                          // Dont auto save typing
                        }}
                        onBlur={() => saveEvents(normalizedItems)}
                        style={{ ...iStyle, padding: "6px 10px", flex: 1 }}
                        placeholder="Time (e.g. 9am - 1pm)"
                      />
                      <button onClick={async () => {
                        const newSessions = item.sessions.filter((_, i) => i !== idx);
                        const newEvents = normalizedItems.map(i => i.name === item.name ? { ...i, sessions: newSessions } : i);
                        setEventTypes(newEvents);
                        await saveEvents(newEvents);
                      }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><X size={14} /></button>
                    </div>
                  )) : (
                    <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No sessions configured for this event.</span>
                  )}
                  
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <select id={`sess_name_${item.name}`} style={{ ...iStyle, padding: "8px 10px", flex: 1, background: "#fff" }}>
                      <option value="">-- Select Session --</option>
                      {(sessions || []).map(sess => {
                        const sessName = typeof sess === "string" ? sess : sess.name;
                        const sessTime = typeof sess === "string" ? "" : (sess.time || "");
                        return <option key={sessName} value={sessName}>{sessName}{sessTime ? ` (${sessTime})` : ""}</option>;
                      })}
                    </select>
                    <input id={`sess_time_${item.name}`} placeholder="Custom Time (optional)" style={{ ...iStyle, padding: "8px 10px", flex: 1 }} />
                    <button onClick={async () => {
                      const sName = document.getElementById(`sess_name_${item.name}`).value;
                      let sTime = document.getElementById(`sess_time_${item.name}`).value;
                      if (!sTime && sName) {
                        const match = (sessions || []).find(gs => (typeof gs === "string" ? gs : gs.name) === sName);
                        if (match && typeof match !== "string" && match.time) sTime = match.time;
                      }
                      if (sName) {
                        const newSessions = [...(item.sessions || []), { name: sName, time: sTime }];
                        const newEvents = normalizedItems.map(i => i.name === item.name ? { ...i, sessions: newSessions } : i);
                        setEventTypes(newEvents);
                        await saveEvents(newEvents);
                        document.getElementById(`sess_name_${item.name}`).value = "";
                        document.getElementById(`sess_time_${item.name}`).value = "";
                      }
                    }} style={{ padding: "8px 16px", background: "#e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#334155", border: "none" }}>Add Session</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} style={{ ...iStyle, flex: 1 }} placeholder="Type new event type..." onKeyDown={async e => { 
            if(e.key === "Enter") { 
              e.preventDefault(); 
              if(newName && !normalizedItems.find(i => i.name === newName)){ 
                const newEvents = [...normalizedItems, { name: newName, sessions: [] }];
                setEventTypes(newEvents); 
                setNewName(""); 
                await saveEvents(newEvents);
              } 
            } 
          }} />
          <button onClick={async () => { 
            if(newName && !normalizedItems.find(i => i.name === newName)){ 
              const newEvents = [...normalizedItems, { name: newName, sessions: [] }];
              setEventTypes(newEvents); 
              setNewName(""); 
              await saveEvents(newEvents);
            } 
          }} style={{ padding: "10px 20px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Add Event Type</button>
        </div>
      </div>
    );
  };

  const ReminderDayAdder = () => {
    const [newDay, setNewDay] = useState("");
    const addDay = async () => {
      const d = parseInt(newDay, 10);
      if (!d || d < 1 || d > 365) return;
      if (!reminderDays.includes(d)) {
        const sorted = [...reminderDays, d].sort((a, b) => a - b);
        setReminderDays(sorted);
        setNewDay("");
        try {
          await settingsAPI.update({ reminderDays: sorted });
        } catch (e) { addToast("Failed to save", "error"); }
      }
    };
    return (
      <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
        <input
          type="number" min="1" max="365"
          value={newDay}
          onChange={e => setNewDay(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDay(); } }}
          placeholder="Days"
          style={{ ...iStyle, width: 100, textAlign: "center", fontSize: 14, fontWeight: 700 }}
        />
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>days before event</span>
        <button onClick={addDay} style={{
          padding: "10px 20px", borderRadius: 8, background: "#1e293b", color: "#fff",
          border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>+ Add</button>
      </div>
    );
  };

  return (
    <div style={cardSt}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CalendarClock size={20} color="#0f766e" />
        </div>
        <div>
          <p style={sectionTitle}>Forms & Options</p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Configure dropdown options for bookings and enquiries</p>
        </div>
      </div>

      <SessionTimeEditor />
      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "32px 0" }} />
      <EventTypeEditor />
      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "32px 0" }} />
      
      <ListEditor title="Places / Areas" desc="Locations where your customers typically come from." items={places} setItems={setPlaces} stateKey="places" />
      
      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "32px 0" }} />
      
      <div>
        <label style={labelSt}>Automated Reminder Schedule</label>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, marginTop: -2 }}>Number of days before an event to send automated payment reminders.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {reminderDays.map(d => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f1f5f9", padding: "8px 16px", borderRadius: 20, border: "1px solid #cbd5e1" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{d} Days</span>
              <button onClick={async () => {
                const sorted = reminderDays.filter(x => x !== d).sort((a,b)=>a-b);
                setReminderDays(sorted);
                await handleSaveLists({ reminderDays: sorted });
              }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: "#ef4444" }}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <ReminderDayAdder />
      </div>

    </div>
  );
}
