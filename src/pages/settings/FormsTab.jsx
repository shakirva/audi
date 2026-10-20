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
  reminderDays = [3, 7], setReminderDays,
  reminderBeforeDays = [3, 7], setReminderBeforeDays,
  reminderTiming = "after", setReminderTiming,
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
  const [newEventSessions, setNewEventSessions] = useState([]);

  const handleAddEventType = async () => {
    const name = newEventTypeName.trim();
    if (!name) return addToast("Event type name is required.", "error");
    if (eventTypes.some(et => {
      if (!et) return false;
      const etName = typeof et === 'string' ? et : et.name;
      return etName ? etName.toLowerCase() === name.toLowerCase() : false;
    })) {
      return addToast("Event type already exists.", "error");
    }
    
    // Map selected session names to their full objects
    const selectedSessionsData = newEventSessions.map(sessName => {
      const match = sessions.find(s => s.name === sessName);
      return match ? { name: match.name, time: match.time } : null;
    }).filter(Boolean);
    
    const newEvents = [...eventTypes, { name, sessions: selectedSessionsData }];
    if (await handleSaveData({ eventTypes: newEvents })) {
      setEventTypes(newEvents);
      setEventTypeModalOpen(false);
      setNewEventTypeName("");
      setNewEventSessions([]);
      addToast("Event type added successfully.", "success");
    }
  };

  const toggleNewEventSession = (sessionName) => {
    setNewEventSessions(prev => 
      prev.includes(sessionName) 
        ? prev.filter(n => n !== sessionName) 
        : [...prev, sessionName]
    );
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
    const name = typeof activeEt === 'string' ? activeEt : activeEt.name;
    const etSessions = [...(activeEt.sessions || [])];
    
    if (!selectedExistingSession) return addToast("Please select a session.", "error");
    const matched = sessions.find(s => s.name === selectedExistingSession);
    if (!matched) return;
    if (etSessions.some(s => s.name === matched.name)) return addToast("Session already added.", "error");
    
    etSessions.push({ name: matched.name, time: matched.time });

    const updatedEvents = [...eventTypes];
    updatedEvents[activeEventIdx] = { name, sessions: etSessions };
    
    if (await handleSaveData({ eventTypes: updatedEvents })) {
      setEventTypes(updatedEvents);
      setSelectedExistingSession("");
      addToast("Session added to event.", "success");
    }
  };

  const handleRemoveSessionFromEvent = async (sessIdxToRemove) => {
    if (activeEventIdx === null) return;
    const activeEt = eventTypes[activeEventIdx];
    const name = typeof activeEt === 'string' ? activeEt : activeEt.name;
    const etSessions = (activeEt.sessions || []).filter((_, i) => i !== sessIdxToRemove);
    
    const updatedEvents = [...eventTypes];
    updatedEvents[activeEventIdx] = { name, sessions: etSessions };
    
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

  // --- Reminder Handlers (Before & After Event) ---
  const [newReminderDay, setNewReminderDay] = useState("");
  const [newReminderBeforeDay, setNewReminderBeforeDay] = useState("");

  const handleToggleTiming = async (timing) => {
    if (await handleSaveData({ reminderTiming: timing })) {
      setReminderTiming(timing);
      const label = timing === "both" ? "Before & After Event" : timing === "before" ? "Before Event" : "After Event";
      addToast(`Reminder timing set to ${label}.`, "success");
    }
  };

  const handleAddReminder = async (timing = "after") => {
    const isBefore = timing === "before";
    const val = isBefore ? newReminderBeforeDay : newReminderDay;
    const d = parseInt(val, 10);
    if (!d || d < 1 || d > 365) return;
    
    const currentList = isBefore ? (reminderBeforeDays || []) : (reminderDays || []);
    if (currentList.includes(d)) return;
    
    const sorted = [...currentList, d].sort((a, b) => a - b);
    const key = isBefore ? "reminderBeforeDays" : "reminderDays";
    if (await handleSaveData({ [key]: sorted })) {
      if (isBefore) {
        setReminderBeforeDays(sorted);
        setNewReminderBeforeDay("");
      } else {
        setReminderDays(sorted);
        setNewReminderDay("");
      }
      addToast("Reminder schedule updated.", "success");
    }
  };

  const handleDeleteReminder = async (day, timing = "after") => {
    const isBefore = timing === "before";
    const currentList = isBefore ? (reminderBeforeDays || []) : (reminderDays || []);
    const sorted = currentList.filter(d => d !== day);
    const key = isBefore ? "reminderBeforeDays" : "reminderDays";
    if (await handleSaveData({ [key]: sorted })) {
      if (isBefore) setReminderBeforeDays(sorted);
      else setReminderDays(sorted);
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
          <div style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "12px 16px" }}>Session Name</th>
                  <th style={{ padding: "12px 16px" }}>Time Window</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", width: 140, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess, idx) => {
                  const isIncomplete = !sess.startTime || !sess.endTime;
                  return (
                    <tr key={idx} style={{ borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{sess.name}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: "#475569", fontFamily: "monospace", fontSize: 13, background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>
                          {sess.time ? sess.time : "--:-- – --:--"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {isIncomplete ? (
                          <span style={{ fontSize: 11, background: "#fef2f2", color: "#b91c1c", padding: "3px 8px", borderRadius: 20, fontWeight: 700, border: "1px solid #fecaca" }}>
                            Incomplete
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: 20, fontWeight: 700, border: "1px solid #bbf7d0" }}>
                            Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button onClick={() => openSessionModal(idx)} style={{ padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", color: "#334155", fontSize: 12, fontWeight: 700 }}>Edit</button>
                          <button onClick={() => handleDeleteSession(idx)} style={{ padding: "6px 12px", background: "#fef2f2", border: "none", borderRadius: 6, cursor: "pointer", color: "#ef4444", fontSize: 12, fontWeight: 700 }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          <div style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "12px 16px" }}>Event Type</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Sessions</th>
                  <th style={{ padding: "12px 16px" }}>Configuration Status</th>
                  <th style={{ padding: "12px 16px", width: 140, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventTypes.map((et, idx) => {
                  const name = typeof et === 'string' ? et : et.name;
                  const sessionCount = et.sessions ? et.sessions.length : 0;
                  return (
                    <tr key={idx} style={{ borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{name}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: "#475569", fontSize: 13 }}>
                          {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {sessionCount > 0 ? (
                          <span style={{ fontSize: 11, background: "#f0fdf4", color: "#166534", padding: "3px 10px", borderRadius: 20, fontWeight: 700, border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}></span>
                            Configured
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, background: "#f8fafc", color: "#64748b", padding: "3px 10px", borderRadius: 20, fontWeight: 600, border: "1px solid #e2e8f0", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1" }}></span>
                            Not configured
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button onClick={() => openEditEventModal(idx)} style={{ padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", color: "#334155", fontSize: 12, fontWeight: 700 }}>Edit</button>
                          <button onClick={() => handleDeleteEventType(idx)} style={{ padding: "6px 12px", background: "#fef2f2", border: "none", borderRadius: 6, cursor: "pointer", color: "#ef4444", fontSize: 12, fontWeight: 700 }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarClock size={18} color="#d97706" />
              </div>
              <h3 style={sectionTitle}>Automated Reminder Schedule</h3>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Configure automated payment balance reminder intervals for your bookings.</p>
          </div>

          {/* Timing Toggle (Before / After / Both) */}
          <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 4, borderRadius: 10, border: "1px solid #cbd5e1", gap: 4 }}>
            {[
              { id: "before", label: "Before Event", icon: "⏳" },
              { id: "after", label: "After Event", icon: "⌛" },
              { id: "both", label: "Both (Before & After)", icon: "🔄" },
            ].map(t => {
              const active = reminderTiming === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleToggleTiming(t.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: active ? "#1B4332" : "transparent",
                    color: active ? "#fff" : "#475569",
                    boxShadow: active ? "0 2px 6px rgba(27,67,50,0.25)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Informational banner */}
        <div style={{ 
          background: reminderTiming === "before" ? "#eff6ff" : reminderTiming === "both" ? "#f5f3ff" : "#fff7ed", 
          border: `1px solid ${reminderTiming === "before" ? "#bfdbfe" : reminderTiming === "both" ? "#ddd6fe" : "#fed7aa"}`, 
          borderRadius: 10, 
          padding: "10px 14px", 
          fontSize: 12, 
          fontWeight: 600,
          color: reminderTiming === "before" ? "#1e40af" : reminderTiming === "both" ? "#6d28d9" : "#c2410c",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>💡</span>
          <span>
            {reminderTiming === "before" && "Active Mode: Reminders alert customers with pending balances BEFORE their upcoming event date."}
            {reminderTiming === "after" && "Active Mode: Reminders alert customers with pending balances AFTER their event date for post-event settlement."}
            {reminderTiming === "both" && "Active Mode: Reminders alert customers BOTH before upcoming events (advance/due collection) and after events (final settlement)."}
          </span>
        </div>

        {/* BEFORE EVENT SCHEDULE */}
        {(reminderTiming === "before" || reminderTiming === "both") && (
          <div style={{ 
            background: "#f8fafc", 
            border: "1px solid #e2e8f0", 
            borderRadius: 12, 
            padding: 16, 
            marginBottom: reminderTiming === "both" ? 16 : 0 
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>⏳</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Before Event Schedule</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 12 }}>
                  {(reminderBeforeDays || []).length} Alert{ (reminderBeforeDays || []).length !== 1 ? 's' : '' }
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px 0" }}>
              Number of days before an event to flag pending balance reminders.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              {(reminderBeforeDays || []).length === 0 ? (
                <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No before-event intervals added yet.</span>
              ) : (
                (reminderBeforeDays || []).map(d => (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1px solid #bfdbfe", padding: "6px 14px", borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>{d} Days Before</span>
                    <button 
                      type="button"
                      onClick={() => handleDeleteReminder(d, "before")} 
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: "#ef4444" }}
                      title="Remove"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input 
                type="number" 
                min="1" 
                max="365" 
                value={newReminderBeforeDay} 
                onChange={e => setNewReminderBeforeDay(e.target.value)} 
                onKeyDown={e => { if (e.key === "Enter") handleAddReminder("before"); }} 
                placeholder="Days" 
                style={{ ...iStyle, width: 90, textAlign: "center" }} 
              />
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>days before event</span>
              <button 
                type="button"
                onClick={() => handleAddReminder("before")} 
                style={{ padding: "8px 16px", borderRadius: 8, background: "#1e293b", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                + Add Before
              </button>
            </div>
          </div>
        )}

        {/* AFTER EVENT SCHEDULE */}
        {(reminderTiming === "after" || reminderTiming === "both") && (
          <div style={{ 
            background: "#f8fafc", 
            border: "1px solid #e2e8f0", 
            borderRadius: 12, 
            padding: 16 
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>⌛</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>After Event Schedule</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#ffedd5", color: "#c2410c", padding: "2px 8px", borderRadius: 12 }}>
                  {(reminderDays || []).length} Alert{ (reminderDays || []).length !== 1 ? 's' : '' }
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px 0" }}>
              Number of days after an event to flag pending balance reminders.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              {(reminderDays || []).length === 0 ? (
                <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No after-event intervals added yet.</span>
              ) : (
                (reminderDays || []).map(d => (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff7ed", border: "1px solid #fed7aa", padding: "6px 14px", borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#c2410c" }}>{d} Days After</span>
                    <button 
                      type="button"
                      onClick={() => handleDeleteReminder(d, "after")} 
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: "#ef4444" }}
                      title="Remove"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input 
                type="number" 
                min="1" 
                max="365" 
                value={newReminderDay} 
                onChange={e => setNewReminderDay(e.target.value)} 
                onKeyDown={e => { if (e.key === "Enter") handleAddReminder("after"); }} 
                placeholder="Days" 
                style={{ ...iStyle, width: 90, textAlign: "center" }} 
              />
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>days after event</span>
              <button 
                type="button"
                onClick={() => handleAddReminder("after")} 
                style={{ padding: "8px 16px", borderRadius: 8, background: "#1e293b", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                + Add After
              </button>
            </div>
          </div>
        )}
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
          {sessions.length > 0 && (
            <div>
              <label style={labelSt}>Supported Sessions (Optional)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc", padding: "12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                {sessions.map((s, idx) => (
                  <label key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={newEventSessions.includes(s.name)} 
                      onChange={() => toggleNewEventSession(s.name)} 
                      style={{ accentColor: "#1B4332", width: 16, height: 16 }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{s.time}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
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
