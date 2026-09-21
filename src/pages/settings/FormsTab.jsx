import React, { useState, useEffect } from 'react';
import { X, Trash2, CalendarClock, Plus, Edit3, Clock, MapPin, CalendarHeart, AlertCircle } from "lucide-react";
import { settingsAPI } from "../../services/api";
import { useConfirm } from "../../components/ConfirmProvider";

const iStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  border: "1px solid #e2e8f0", fontSize: 13, color: "#1e293b",
  background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", transition: "all 0.2s"
};

const labelSt = {
  fontSize: 11, fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.05em",
  display: "block", marginBottom: 6,
};

const cardSt = {
  background: "#fff", borderRadius: 12,
  boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 24, marginBottom: 24,
  border: "1px solid #e2e8f0"
};

const sectionTitle = {
  fontFamily: "'Playfair Display', serif", fontSize: 18,
  fontWeight: 700, color: "#0f172a", marginBottom: 4, margin: 0,
};

const ModalBase = ({ open, title, onClose, children, width = 450 }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: width, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default function FormsTab({
  eventTypes, setEventTypes,
  sessions, setSessions,
  places, setPlaces,
  reminderDays, setReminderDays,
  addToast
}) {
  const { confirm } = useConfirm();

  const handleSaveData = async (dataToSave) => {
    try {
      await settingsAPI.update(dataToSave);
      return true;
    } catch (e) {
      addToast("Failed to save changes. Please try again.", "error");
      return false;
    }
  };

  const formatTime12h = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  // --- Session Modal State ---
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSessionIdx, setEditingSessionIdx] = useState(null);
  const [sessionForm, setSessionForm] = useState({ name: "", startTime: "", endTime: "" });

  const openSessionModal = (idx = null) => {
    if (idx !== null) {
      setEditingSessionIdx(idx);
      setSessionForm({
        name: sessions[idx].name || "",
        startTime: sessions[idx].startTime || "",
        endTime: sessions[idx].endTime || ""
      });
    } else {
      setEditingSessionIdx(null);
      setSessionForm({ name: "", startTime: "", endTime: "" });
    }
    setSessionModalOpen(true);
  };

  const handleSaveSession = async () => {
    if (!sessionForm.name.trim()) return addToast("Session name is required.", "error");
    if (!sessionForm.startTime || !sessionForm.endTime) return addToast("Start and end time are required.", "error");

    const timeLabel = `${formatTime12h(sessionForm.startTime)} – ${formatTime12h(sessionForm.endTime)}`;
    const newSessionObj = { name: sessionForm.name.trim(), startTime: sessionForm.startTime, endTime: sessionForm.endTime, time: timeLabel };
    
    let updatedSessions = [...sessions];
    
    if (editingSessionIdx !== null) {
      // Check for duplicate name if name changed
      const oldName = sessions[editingSessionIdx].name;
      if (oldName.toLowerCase() !== newSessionObj.name.toLowerCase() && updatedSessions.some(s => s.name.toLowerCase() === newSessionObj.name.toLowerCase())) {
        return addToast("A session with this name already exists.", "error");
      }
      updatedSessions[editingSessionIdx] = newSessionObj;
      
      // We also need to update event types that might be referencing the old time
      // But renaming a session might break event type refs if they use name.
      // We will assume backend uses name as key for now.
    } else {
      if (updatedSessions.some(s => s.name.toLowerCase() === newSessionObj.name.toLowerCase())) {
        return addToast("A session with this name already exists.", "error");
      }
      updatedSessions.push(newSessionObj);
    }

    if (await handleSaveData({ sessions: updatedSessions })) {
      setSessions(updatedSessions);
      setSessionModalOpen(false);
      addToast(`Session ${editingSessionIdx !== null ? 'updated' : 'added'} successfully.`, "success");
    }
  };

  const handleDeleteSession = async (idx) => {
    const sessionToDelete = sessions[idx];
    // Dependency check for Event Types
    const usedByEvents = eventTypes.filter(et => et.sessions && et.sessions.some(s => s.name === sessionToDelete.name));
    
    let msg = `Are you sure you want to delete "${sessionToDelete.name}"?`;
    if (usedByEvents.length > 0) {
      msg = `This session is currently assigned to ${usedByEvents.length} event type(s). Deleting it will remove it from those configurations. Are you sure you want to proceed?`;
    }

    if (await confirm(msg, { title: "Delete Session?", confirmText: "Delete Session", isDanger: true })) {
      const updatedSessions = sessions.filter((_, i) => i !== idx);
      
      // Clean up event types referencing this session
      let updatedEventTypes = eventTypes;
      if (usedByEvents.length > 0) {
        updatedEventTypes = eventTypes.map(et => {
          if (et.sessions) {
            return { ...et, sessions: et.sessions.filter(s => s.name !== sessionToDelete.name) };
          }
          return et;
        });
      }

      if (await handleSaveData({ sessions: updatedSessions, eventTypes: updatedEventTypes })) {
        setSessions(updatedSessions);
        setEventTypes(updatedEventTypes);
        addToast("Session deleted successfully.", "success");
      }
    }
  };

  // --- Event Type Modal State ---
  const [eventTypeModalOpen, setEventTypeModalOpen] = useState(false);
  const [newEventTypeName, setNewEventTypeName] = useState("");

  const handleAddEventType = async () => {
    const name = newEventTypeName.trim();
    if (!name) return addToast("Event type name is required.", "error");
    if (eventTypes.some(et => (typeof et === 'string' ? et : et.name).toLowerCase() === name.toLowerCase())) {
      return addToast("Event type already exists.", "error");
    }
    
    const newEvents = [...eventTypes, { name, sessions: [] }];
    if (await handleSaveData({ eventTypes: newEvents })) {
      setEventTypes(newEvents);
      setEventTypeModalOpen(false);
      setNewEventTypeName("");
      addToast("Event type added successfully.", "success");
    }
  };

  const handleDeleteEventType = async (idx) => {
    const et = eventTypes[idx];
    const name = typeof et === 'string' ? et : et.name;
    const sessionCount = et.sessions ? et.sessions.length : 0;
    
    let msg = `Are you sure you want to delete "${name}"?`;
    if (sessionCount > 0) {
      msg = `This event type has ${sessionCount} configured sessions. Deleting it will remove this event type from booking options.`;
    }

    if (await confirm(msg, { title: "Delete Event Type?", confirmText: "Delete Event Type", isDanger: true })) {
      const updatedEvents = eventTypes.filter((_, i) => i !== idx);
      if (await handleSaveData({ eventTypes: updatedEvents })) {
        setEventTypes(updatedEvents);
        addToast("Event type deleted successfully.", "success");
      }
    }
  };

  // --- Edit Event Type Modal State ---
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [activeEventIdx, setActiveEventIdx] = useState(null);
  const [selectedExistingSession, setSelectedExistingSession] = useState("");

  const openEditEventModal = (idx) => {
    setActiveEventIdx(idx);
    setEditEventModalOpen(true);
    setSelectedExistingSession("");
  };

  const handleAddSessionToEvent = async () => {
    if (activeEventIdx === null) return;
    const activeEt = eventTypes[activeEventIdx];
    const etSessions = [...(activeEt.sessions || [])];
    
    if (!selectedExistingSession) return addToast("Please select a session.", "error");
    const matched = sessions.find(s => s.name === selectedExistingSession);
    if (!matched) return;
    if (etSessions.some(s => s.name === matched.name)) return addToast("Session already added.", "error");
    
    etSessions.push({ name: matched.name, time: matched.time });

    const updatedEvents = [...eventTypes];
    updatedEvents[activeEventIdx] = { ...activeEt, sessions: etSessions };
    
    if (await handleSaveData({ eventTypes: updatedEvents })) {
      setEventTypes(updatedEvents);
      setSelectedExistingSession("");
      addToast("Session added to event.", "success");
    }
  };

  const handleRemoveSessionFromEvent = async (sessIdxToRemove) => {
    if (activeEventIdx === null) return;
    const activeEt = eventTypes[activeEventIdx];
    const etSessions = activeEt.sessions.filter((_, i) => i !== sessIdxToRemove);
    
    const updatedEvents = [...eventTypes];
    updatedEvents[activeEventIdx] = { ...activeEt, sessions: etSessions };
    
    if (await handleSaveData({ eventTypes: updatedEvents })) {
      setEventTypes(updatedEvents);
      addToast("Session removed from event.", "success");
    }
  };

  // --- Place Modal State ---
  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");

  const handleAddPlace = async () => {
    const p = newPlaceName.trim();
    if (!p) return;
    if (places.includes(p)) return addToast("Place already exists.", "error");
    
    const updatedPlaces = [...places, p];
    if (await handleSaveData({ places: updatedPlaces })) {
      setPlaces(updatedPlaces);
      setPlaceModalOpen(false);
      setNewPlaceName("");
      addToast("Place added successfully.", "success");
    }
  };

  const handleDeletePlace = async (placeName) => {
    if (await confirm(`Are you sure you want to delete "${placeName}"? Existing records using this place will remain intact.`, { title: "Delete Place?", confirmText: "Delete", isDanger: true })) {
      const updatedPlaces = places.filter(p => p !== placeName);
      if (await handleSaveData({ places: updatedPlaces })) {
        setPlaces(updatedPlaces);
        addToast("Place deleted successfully.", "success");
      }
    }
  };

  // --- Reminder Add ---
  const [newReminderDay, setNewReminderDay] = useState("");
  const handleAddReminder = async () => {
    const d = parseInt(newReminderDay, 10);
    if (!d || d < 1 || d > 365) return;
    if (reminderDays.includes(d)) return;
    
    const sorted = [...reminderDays, d].sort((a, b) => a - b);
    if (await handleSaveData({ reminderDays: sorted })) {
      setReminderDays(sorted);
      setNewReminderDay("");
      addToast("Reminder schedule updated.", "success");
    }
  };

  const handleDeleteReminder = async (day) => {
    const sorted = reminderDays.filter(d => d !== day);
    if (await handleSaveData({ reminderDays: sorted })) {
      setReminderDays(sorted);
      addToast("Reminder removed.", "success");
    }
  };

  return (
    <>
      {/* GLOBAL SESSIONS SECTION */}
      <div style={cardSt}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={18} color="#0d9488" />
              </div>
              <h3 style={sectionTitle}>Global Sessions</h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Configure standard time slots available across your venue.</p>
          </div>
          <button onClick={() => openSessionModal()} style={{ padding: "8px 16px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Session
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px 0" }}>No sessions configured.</p>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Create time slots such as Morning, Afternoon or Evening for your venue.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            {sessions.map((sess, idx) => {
              const isIncomplete = !sess.startTime || !sess.endTime;
              return (
                <div key={idx} style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: idx < sessions.length - 1 ? "1px solid #e2e8f0" : "none", background: isIncomplete ? "#fef2f2" : "#fff" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      {sess.name}
                      {isIncomplete && <span style={{ fontSize: 10, background: "#fecaca", color: "#991b1b", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>Incomplete</span>}
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontFamily: "monospace" }}>
                      {sess.time ? sess.time : "--:-- – --:--"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openSessionModal(idx)} style={{ padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", color: "#334155", fontSize: 12, fontWeight: 700 }}>Edit</button>
                    <button onClick={() => handleDeleteSession(idx)} style={{ padding: "6px 12px", background: "#fef2f2", border: "none", borderRadius: 6, cursor: "pointer", color: "#ef4444", fontSize: 12, fontWeight: 700 }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EVENT TYPES SECTION */}
      <div style={cardSt}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarHeart size={18} color="#c026d3" />
              </div>
              <h3 style={sectionTitle}>Event Types</h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Categorize bookings and restrict available sessions per event.</p>
          </div>
          <button onClick={() => setEventTypeModalOpen(true)} style={{ padding: "8px 16px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Event Type
          </button>
        </div>

        {eventTypes.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px 0" }}>No event types configured.</p>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Create event categories used during booking (e.g. Wedding, Reception).</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            {eventTypes.map((et, idx) => {
              const name = typeof et === 'string' ? et : et.name;
              const sessionCount = et.sessions ? et.sessions.length : 0;
              return (
                <div key={idx} style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: idx < eventTypes.length - 1 ? "1px solid #e2e8f0" : "none", background: "#fff" }}>
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", alignItems: "center", gap: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{name}</h4>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: sessionCount > 0 ? "#059669" : "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: sessionCount > 0 ? "#10b981" : "#cbd5e1" }}></div>
                      {sessionCount > 0 ? "Configured" : "Not configured"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEditEventModal(idx)} style={{ padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", color: "#334155", fontSize: 12, fontWeight: 700 }}>Edit</button>
                    <button onClick={() => handleDeleteEventType(idx)} style={{ padding: "6px 12px", background: "#fef2f2", border: "none", borderRadius: 6, cursor: "pointer", color: "#ef4444", fontSize: 12, fontWeight: 700 }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PLACES SECTION */}
      <div style={cardSt}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={18} color="#2563eb" />
              </div>
              <h3 style={sectionTitle}>Places / Areas</h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Common customer locations for dropdown selection in enquiries.</p>
          </div>
          <button onClick={() => setPlaceModalOpen(true)} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Place
          </button>
        </div>

        {places.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", fontSize: 13, color: "#64748b" }}>
            No places configured. Add common customer locations used in enquiries.
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {places.map((place, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{place}</span>
                <button onClick={() => handleDeletePlace(place)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: "#94a3b8" }} title="Remove">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REMINDERS SECTION */}
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CalendarClock size={18} color="#d97706" />
          </div>
          <h3 style={sectionTitle}>Automated Reminder Schedule</h3>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Number of days before an event to send automated payment reminders.</p>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          {reminderDays.map(d => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{d} Days</span>
              <button onClick={() => handleDeleteReminder(d)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: "#ef4444" }}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input type="number" min="1" max="365" value={newReminderDay} onChange={e => setNewReminderDay(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAddReminder(); }} placeholder="Days" style={{ ...iStyle, width: 100, textAlign: "center" }} />
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>days before event</span>
          <button onClick={handleAddReminder} style={{ padding: "10px 20px", borderRadius: 8, background: "#1e293b", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
        </div>
      </div>

      {/* --- MODALS --- */}
      <ModalBase open={sessionModalOpen} title={editingSessionIdx !== null ? "Edit Session" : "Add Session"} onClose={() => setSessionModalOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelSt}>Session Name *</label>
            <input value={sessionForm.name} onChange={e => setSessionForm({...sessionForm, name: e.target.value})} placeholder="e.g. Morning" style={iStyle} />
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelSt}>Start Time *</label>
              <input type="time" value={sessionForm.startTime} onChange={e => setSessionForm({...sessionForm, startTime: e.target.value})} style={iStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelSt}>End Time *</label>
              <input type="time" value={sessionForm.endTime} onChange={e => setSessionForm({...sessionForm, endTime: e.target.value})} style={iStyle} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button onClick={() => setSessionModalOpen(false)} style={{ padding: "10px 20px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSaveSession} style={{ padding: "10px 20px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{editingSessionIdx !== null ? 'Save Changes' : 'Add Session'}</button>
          </div>
        </div>
      </ModalBase>

      <ModalBase open={eventTypeModalOpen} title="Add Event Type" onClose={() => setEventTypeModalOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelSt}>Event Type Name *</label>
            <input value={newEventTypeName} onChange={e => setNewEventTypeName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAddEventType(); }} placeholder="e.g. Wedding" style={iStyle} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button onClick={() => setEventTypeModalOpen(false)} style={{ padding: "10px 20px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleAddEventType} style={{ padding: "10px 20px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Event Type</button>
          </div>
        </div>
      </ModalBase>

      <ModalBase open={editEventModalOpen} title={`Edit Event Type: ${activeEventIdx !== null ? (typeof eventTypes[activeEventIdx] === 'string' ? eventTypes[activeEventIdx] : eventTypes[activeEventIdx].name) : ''}`} width={550} onClose={() => setEditEventModalOpen(false)}>
        {activeEventIdx !== null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <label style={labelSt}>Configured Sessions</label>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                {(!eventTypes[activeEventIdx].sessions || eventTypes[activeEventIdx].sessions.length === 0) ? (
                  <div style={{ padding: "16px", textAlign: "center", background: "#f8fafc", fontSize: 13, color: "#64748b" }}>
                    No sessions configured for this event type.
                  </div>
                ) : (
                  eventTypes[activeEventIdx].sessions.map((sess, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#fff", borderBottom: i < eventTypes[activeEventIdx].sessions.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{sess.name}</span>
                        <span style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{sess.time}</span>
                      </div>
                      <button onClick={() => handleRemoveSessionFromEvent(i)} style={{ padding: "6px 10px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Remove</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "16px" }}>
              <label style={labelSt}>Add Session to Event</label>
              
              <div style={{ display: "flex", gap: 10 }}>
                <select value={selectedExistingSession} onChange={e => setSelectedExistingSession(e.target.value)} style={{ ...iStyle, flex: 1 }}>
                  <option value="">-- Select Session --</option>
                  {sessions.map((s, i) => (
                    <option key={i} value={s.name}>{s.name} ({s.time})</option>
                  ))}
                </select>
                <button onClick={handleAddSessionToEvent} style={{ padding: "10px 16px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add</button>
              </div>
            </div>
          </div>
        )}
      </ModalBase>

      <ModalBase open={placeModalOpen} title="Add Place" onClose={() => setPlaceModalOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelSt}>Place Name *</label>
            <input value={newPlaceName} onChange={e => setNewPlaceName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAddPlace(); }} placeholder="e.g. Kannur" style={iStyle} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button onClick={() => setPlaceModalOpen(false)} style={{ padding: "10px 20px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleAddPlace} style={{ padding: "10px 20px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Place</button>
          </div>
        </div>
      </ModalBase>
    </>
  );
}
