import { useState, useEffect } from "react";
import { Save, Building2, User, MapPin, IndianRupee, Users, CheckCircle, X, Copy, Link, ShieldCheck, ImagePlus, Trash2, Play, Film, ToggleLeft, ToggleRight, Eye, EyeOff, Database } from "lucide-react";
import Logo from "../components/Logo";
import { useToast } from "../components/Toast";
import { useRole } from "../context/RoleContext";
import { useBookings } from "../context/BookingsContext";
import { settingsAPI } from "../services/api";

const INIT_HALLS = [
  { name: "Main Hall",  icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup" },
  { name: "Mini Hall",  icon: "🏠", price: 6000,  capacity: 150, description: "Intimate setting for smaller events" },
  { name: "Open Stage", icon: "🌿", price: 8000,  capacity: 300, description: "Outdoor stage with natural surroundings" },
];

const iStyle = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: "1px solid #e5e7eb", fontSize: 12, color: "#374151",
  background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
};
const labelSt = {
  fontSize: 10, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.07em",
  display: "flex", alignItems: "center", gap: 4, marginBottom: 5,
};
const cardSt = {
  background: "#fff", borderRadius: 12,
  boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 14, marginBottom: 12,
};
const sectionTitle = {
  fontFamily: "'Playfair Display', serif", fontSize: 14,
  fontWeight: 700, color: "#111827", marginBottom: 10, margin: 0,
};

export default function Settings() {
  const { addToast } = useToast();
  const { role, managerRevenueEnabled, setManagerRevenueEnabled, tenant, activeEnvironment } = useRole();
  const { bookings, deleteBooking } = useBookings();
  const isOwner = role === "Owner";
  const isAdminRole = role === "Owner" || role === "Manager"; // both see full settings

  const [settingsId, setSettingsId] = useState(null);

  // ── Venue Info ──
  const [venue, setVenue] = useState({
    name:     "",
    owner:    "",
    location: "",
    phone:    "",
    email:    "",
    gstin:    "",
  });

  // ── Hall Pricing ──
  const [halls, setHalls] = useState(INIT_HALLS);

  // ── Notification Prefs ──
  const [notifs, setNotifs] = useState({
    sms: true, email: false, whatsapp: true, reminders: true,
  });

  const [blackoutInput, setBlackoutInput] = useState("");
  const [blackoutDates, setBlackoutDates] = useState([]);

  // ── Dynamic Lists ──
  const [eventTypes, setEventTypes]           = useState([]);
  const [sessions, setSessions]               = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [places, setPlaces]                   = useState(["Kannur", "Thalassery", "Iritty", "Kuthuparamba", "Payyanur"]);

  const [testerCreds, setTesterCreds] = useState(null);
  const [testerForm, setTesterForm] = useState({ name: "", email: "", password: "" });

  // ── WhatsApp Reminder Days ──
  const [reminderDays, setReminderDays]       = useState([3, 7]);  // default: 3 & 7 days before event

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setSettingsId(data.id);
      setVenue({
        name: data.venueName || "",
        owner: data.ownerName || "",
        location: data.location || "",
        phone: data.phone || "",
        email: data.email || "",
        gstin: data.gstin || "",
      });
      if (data.halls && data.halls.length > 0) setHalls(data.halls);
      if (data.gallery && data.gallery.length > 0) setGalleryItems(data.gallery);
      if (data.notifications) setNotifs(data.notifications);
      if (data.blackoutDates) setBlackoutDates(data.blackoutDates);
      if (data.eventTypes) setEventTypes(data.eventTypes);
      if (data.sessions) setSessions(data.sessions);
      if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
      if (data.places && data.places.length > 0) setPlaces(data.places);
      if (data.reminderDays && data.reminderDays.length > 0) setReminderDays(data.reminderDays);
      if (data.staff) setStaff(data.staff);
      setManagerRevenueEnabled(data.managerRevenueEnabled !== false);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenue(prev => ({ ...prev, [name]: value }));
  };

  const handleHallChange = (idx, field, value) => {
    setHalls(prev => prev.map((h, i) => i === idx ? { ...h, [field]: field === "price" || field === "capacity" ? Number(value) : value } : h));
  };

  const handleAddHall = () => {
    setHalls(prev => [...prev, { name: "New Hall", icon: "✨", price: 0, capacity: 0, description: "" }]);
  };

  const handleDeleteHall = (idx) => {
    setHalls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveVenue = async () => {
    try {
      await settingsAPI.update({ venueName: venue.name, ownerName: venue.owner, location: venue.location, phone: venue.phone, email: venue.email, gstin: venue.gstin });
      addToast("Venue settings saved! 🏛️", "success");
    } catch (e) { addToast("Failed to save", "error"); }
  };

  const handleSaveHalls = async () => {
    try {
      await settingsAPI.update({ halls });
      addToast("Hall pricing updated! ✅", "success");
    } catch (e) { addToast("Failed to save", "error"); }
  };

  const handleSaveNotifs = async () => {
    try {
      await settingsAPI.update({ notifications: notifs });
      addToast("Notification preferences saved!", "success");
    } catch (e) { addToast("Failed to save", "error"); }
  };

  const handleSaveReminderDays = async () => {
    const sorted = [...reminderDays].sort((a, b) => a - b);
    setReminderDays(sorted);
    try {
      await settingsAPI.update({ reminderDays: sorted });
      addToast("Reminder schedule saved! 📅", "success");
    } catch (e) { addToast("Failed to save", "error"); }
  };

  const toggleReminderDay = (day) => {
    setReminderDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

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

  const handleSaveLists = async () => {
    try {
      await settingsAPI.update({ eventTypes, sessions, expenseCategories, places });
      addToast("Lists saved successfully! ✅", "success");
    } catch (e) { addToast("Failed to save lists", "error"); }
  };

  // ── Staff Roles ──
  const [staff, setStaff] = useState([]);

  const handleSaveStaff = async (newStaffList) => {
    try {
      await settingsAPI.update({ staff: newStaffList });
      addToast("Staff updated successfully! ✅", "success");
    } catch (e) { addToast("Failed to save staff", "error"); }
  };

  // ── Gallery Management ──
  const GALLERY_CATEGORIES = ["Halls", "Events", "Decor", "Videos"];

  const [galleryItems, setGalleryItems] = useState([]);

  const [newMedia, setNewMedia] = useState({ type: "image", src: "", label: "", category: "Halls" });
  const [mediaError, setMediaError] = useState("");

  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleAddMedia = async () => {
    setMediaError("");
    if (!newMedia.src.trim()) { setMediaError("Please enter a URL."); return; }
    if (!newMedia.label.trim()) { setMediaError("Please enter a label."); return; }
    let newItems = [];
    if (newMedia.type === "video") {
      const ytId = getYouTubeId(newMedia.src);
      if (!ytId) { setMediaError("Please enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)."); return; }
      const embedSrc = `https://www.youtube.com/embed/${ytId}`;
      const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      newItems = [...galleryItems, { id: Date.now(), type: "video", src: embedSrc, thumb, label: newMedia.label, category: newMedia.category }];
    } else {
      newItems = [...galleryItems, { id: Date.now(), type: "image", src: newMedia.src.trim(), label: newMedia.label, category: newMedia.category }];
    }
    setGalleryItems(newItems);
    setNewMedia({ type: "image", src: "", label: "", category: "Halls" });
    try {
      await settingsAPI.update({ gallery: newItems });
      addToast("Media added to gallery! 🖼️", "success");
    } catch (e) { addToast("Failed to save gallery", "error"); }
  };

  const handleDeleteMedia = async (id) => {
    const newItems = galleryItems.filter(g => g.id !== id);
    setGalleryItems(newItems);
    try {
      await settingsAPI.update({ gallery: newItems });
      addToast("Removed from gallery.", "info");
    } catch (e) { addToast("Failed to save gallery", "error"); }
  };

  const ListEditor = ({ title, desc, items, setItems }) => {
    const [newVal, setNewVal] = useState("");
    return (
      <div style={{ marginBottom: 20 }}>
        <label style={labelSt}>{title}</label>
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, marginTop: -2 }}>{desc}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {items.map(item => (
            <div key={item} style={{ padding: "5px 12px", background: "#f3f4f6", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
              {item}
              <button onClick={() => setItems(items.filter(i => i !== item))} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}><X size={12} color="#C0392B" /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newVal} onChange={e => setNewVal(e.target.value)} style={{ ...iStyle, flex: 1 }} placeholder="Type new option..." onKeyDown={e => { if(e.key === "Enter") { e.preventDefault(); if(newVal && !items.includes(newVal)){ setItems([...items, newVal]); setNewVal(""); } } }} />
          <button onClick={() => { if(newVal && !items.includes(newVal)){ setItems([...items, newVal]); setNewVal(""); } }} style={{ padding: "8px 16px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Add</button>
        </div>
      </div>
    );
  };

  const StaffAdder = () => {
    const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "Staff", access: "View Only" });
    const add = () => {
      if (!newStaff.name || !newStaff.email) return;
      const updated = [...staff, newStaff];
      setStaff(updated);
      handleSaveStaff(updated);
      setNewStaff({ name: "", email: "", role: "Staff", access: "View Only" });
    };
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap", background: "#f9fafb", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <input value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} placeholder="Name" style={{ ...iStyle, width: 140 }} />
        <input value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} placeholder="Email" style={{ ...iStyle, width: 180 }} />
        <select value={newStaff.role} onChange={e => setNewStaff(p => ({ ...p, role: e.target.value, access: e.target.value === "Owner" ? "Full" : e.target.value === "Manager" ? "Bookings & Reports" : "View Only" }))} style={{ ...iStyle, width: 120 }}>
          <option value="Owner">Owner</option>
          <option value="Manager">Manager</option>
          <option value="Staff">Staff</option>
        </select>
        <button onClick={add} style={{
          padding: "10px 16px", borderRadius: 8, border: "none",
          background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>+ Invite Member</button>
      </div>
    );
  };

  const ReminderDayAdder = () => {
    const [newDay, setNewDay] = useState("");
    const addDay = () => {
      const d = parseInt(newDay, 10);
      if (!d || d < 1 || d > 365) return;
      if (!reminderDays.includes(d)) setReminderDays(prev => [...prev, d]);
      setNewDay("");
    };
    return (
      <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center" }}>
        <input
          type="number" min="1" max="365"
          value={newDay}
          onChange={e => setNewDay(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDay(); } }}
          placeholder="e.g. 3"
          style={{ ...iStyle, width: 100, textAlign: "center", fontSize: 14, fontWeight: 700 }}
        />
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>days before event</span>
        <button onClick={addDay} style={{
          padding: "8px 18px", borderRadius: 8, background: "#1B4332", color: "#fff",
          border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>+ Add</button>
      </div>
    );
  };

  const SessionEditor = ({ title, desc, items, setItems }) => {
    const [newName, setNewName] = useState("");
    const [newTime, setNewTime] = useState("");
    return (
      <div style={{ marginBottom: 20 }}>
        <label style={labelSt}>{title}</label>
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, marginTop: -2 }}>{desc}</p>
        <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
          {items.map(item => (
            <div key={item.name} style={{ padding: "8px 12px", background: "#f3f4f6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{item.name}</span>
                <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>{item.time}</span>
              </div>
              <button onClick={() => setItems(items.filter(i => i.name !== item.name))} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}><X size={14} color="#C0392B" /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} style={{ ...iStyle, flex: 1 }} placeholder="Name (e.g. Morning)" />
          <input value={newTime} onChange={e => setNewTime(e.target.value)} style={{ ...iStyle, flex: 1 }} placeholder="Time (e.g. 09:00 AM - 02:00 PM)" onKeyDown={e => { if(e.key === "Enter") { e.preventDefault(); if(newName && newTime && !items.find(i=>i.name===newName)){ setItems([...items, {name: newName, time: newTime}]); setNewName(""); setNewTime(""); } } }} />
          <button onClick={() => { if(newName && newTime && !items.find(i=>i.name===newName)){ setItems([...items, {name: newName, time: newTime}]); setNewName(""); setNewTime(""); } }} style={{ padding: "8px 16px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Add</button>
        </div>
      </div>
    );
  };

  return (
    <div className="hm-settings-container" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
          Manage your auditorium profile, hall pricing and preferences
        </p>
      </div>

      {/* ── MANAGER ACCESS CONTROL (Owner only) ── */}
      {isOwner && (
        <div style={{ ...cardSt, border: "1.5px solid #fde68a", background: "linear-gradient(135deg, #fffbeb, #fefce8)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="#92400e" />
            </div>
            <div>
              <p style={{ ...sectionTitle, color: "#92400e" }}>Manager Access Control</p>
              <p style={{ fontSize: 12, color: "#a16207", margin: 0 }}>Control what Managers can see on their dashboard</p>
            </div>
          </div>

          {/* Revenue toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1.5px solid #fde68a", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: managerRevenueEnabled ? "#d1fae5" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {managerRevenueEnabled ? <Eye size={16} color="#15803d" /> : <EyeOff size={16} color="#C0392B" />}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: 0 }}>Revenue &amp; Financial Reports</p>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {managerRevenueEnabled
                    ? "Managers can see revenue stats, payments & reports"
                    : "Managers cannot see revenue stats, payments or reports"}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const newVal = !managerRevenueEnabled;
                setManagerRevenueEnabled(newVal);
                try {
                  await settingsAPI.update({ managerRevenueEnabled: newVal });
                  addToast(
                    newVal ? "Manager revenue access enabled ✅" : "Manager revenue access disabled 🔒",
                    newVal ? "success" : "error"
                  );
                } catch (e) { addToast("Update failed", "error"); }
              }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
            >
              {managerRevenueEnabled
                ? <ToggleRight size={38} color="#1B4332" />
                : <ToggleLeft size={38} color="#9ca3af" />}
            </button>
          </div>

          <div style={{ background: "#fef3c7", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              Changes take effect immediately. Manager will see or lose access to <strong>Revenue stats, Payments & Reports</strong> on their next page load.
            </p>
          </div>
        </div>
      )}

      {/* ── SANDBOX MANAGEMENT (Owner only) ── */}
      {isOwner && activeEnvironment === "sandbox" && (
        <div style={{ ...cardSt, border: "1.5px solid #fecaca", background: "linear-gradient(135deg, #fef2f2, #fff1f2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Database size={18} color="#991b1b" />
            </div>
            <div>
              <p style={{ ...sectionTitle, color: "#991b1b" }}>Sandbox Management</p>
              <p style={{ fontSize: 12, color: "#b91c1c", margin: 0 }}>Reset your training data</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1.5px solid #fecaca", marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: 0 }}>Reset Sandbox</p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                Delete all sandbox bookings and restore default training data. Production will remain untouched.
              </p>
            </div>
            <button
              onClick={async () => {
                if (window.confirm("Are you sure you want to reset the Sandbox? All current training data will be lost. (Production is safe).")) {
                  try {
                    await settingsAPI.resetSandbox();
                    addToast("Sandbox reset successfully!", "success");
                    window.location.reload();
                  } catch(e) {
                    addToast("Failed to reset sandbox", "error");
                  }
                }
              }}
              style={{ padding: "8px 16px", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Reset Data
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1.5px solid #fecaca" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: 0 }}>Tester / Auditor Account</p>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  Generate a login that is permanently locked to this Sandbox. The red Sandbox warning will be hidden from them.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="text"
                  placeholder="Custom Name (optional)"
                  value={testerForm.name}
                  onChange={e => setTesterForm({ ...testerForm, name: e.target.value })}
                  style={{ ...iStyle, padding: "8px 12px" }}
                />
                <input
                  type="email"
                  placeholder="Custom Email (optional)"
                  value={testerForm.email}
                  onChange={e => setTesterForm({ ...testerForm, email: e.target.value })}
                  style={{ ...iStyle, padding: "8px 12px" }}
                />
                <input
                  type="text"
                  placeholder="Custom Password (optional)"
                  value={testerForm.password}
                  onChange={e => setTesterForm({ ...testerForm, password: e.target.value })}
                  style={{ ...iStyle, padding: "8px 12px" }}
                />
                <button
                  onClick={async () => {
                    try {
                      const { data } = await settingsAPI.generateTester(testerForm);
                      setTesterCreds(data);
                      setTesterForm({ name: "", email: "", password: "" });
                      addToast("Tester credentials generated!", "success");
                    } catch(e) {
                      addToast("Failed to generate credentials", "error");
                    }
                  }}
                  style={{ padding: "8px 16px", borderRadius: 8, background: "#b91c1c", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", alignSelf: "flex-end" }}
                >
                  Generate Credentials
                </button>
              </div>
            </div>
            
            {testerCreds && (
              <div style={{ background: "#fef2f2", padding: "12px", borderRadius: 8, border: "1px dashed #fca5a5", marginTop: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", margin: "0 0 8px 0" }}>Share these securely with the inspector/tester:</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, color: "#b91c1c", fontWeight: 700, textTransform: "uppercase" }}>Email</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "monospace" }}>{testerCreds.email}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "#b91c1c", fontWeight: 700, textTransform: "uppercase" }}>Password</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "monospace" }}>{testerCreds.password}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── VENUE INFO CARD (Owner & Manager) ── */}
      {isAdminRole && (
        <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={18} color="#1B4332" />
          </div>
          <div>
            <p style={sectionTitle}>Venue Information</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Your auditorium's public profile</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelSt}><Building2 size={11} /> Auditorium Name</label>
            <input name="name" value={venue.name} onChange={handleVenueChange} style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div>
            <label style={labelSt}><User size={11} /> Owner Name</label>
            <input name="owner" value={venue.owner} onChange={handleVenueChange} style={iStyle}
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelSt}><MapPin size={11} /> Location</label>
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
        </div>

        <button onClick={handleSaveVenue} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#1B4332", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 2px 10px rgba(27,67,50,0.3)",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#163829"}
          onMouseLeave={e => e.currentTarget.style.background = "#1B4332"}>
          <Save size={14} /> Save Venue Info
        </button>
      </div>
      )}

      {/* ── HALL PRICING CARD (Owner & Manager) ── */}
      {isAdminRole && (
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={18} color="#D4A017" />
          </div>
          <div>
            <p style={sectionTitle}>Hall Pricing & Capacity</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Set per-session pricing and guest limits</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {halls.map((hall, idx) => (
            <div key={idx} style={{
              border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "16px 18px",
              background: "#fafafa", position: "relative"
            }}>
              <button onClick={() => handleDeleteHall(idx)} title="Delete Hall" style={{ position: "absolute", top: 12, right: 12, background: "#fee2e2", border: "none", borderRadius: 6, cursor: "pointer", padding: 6, display: "flex" }}>
                <Trash2 size={14} color="#ef4444" />
              </button>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, alignItems: "end", paddingRight: 32 }}>
                <div style={{ maxWidth: 80 }}>
                  <label style={labelSt}>Icon</label>
                  <input value={hall.icon} onChange={e => handleHallChange(idx, "icon", e.target.value)}
                    style={{...iStyle, textAlign: "center", fontSize: 16}}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelSt}>Hall Name</label>
                  <input value={hall.name} onChange={e => handleHallChange(idx, "name", e.target.value)}
                    style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div style={{ gridColumn: "span 3" }}>
                  <label style={labelSt}>Description</label>
                  <input value={hall.description} onChange={e => handleHallChange(idx, "description", e.target.value)}
                    style={{ ...iStyle, fontSize: 12 }}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelSt}><IndianRupee size={11} /> Price (₹)</label>
                  <input type="number" value={hall.price} onChange={e => handleHallChange(idx, "price", e.target.value)}
                    style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelSt}><Users size={11} /> Max Guests</label>
                  <input type="number" value={hall.capacity} onChange={e => handleHallChange(idx, "capacity", e.target.value)}
                    style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleAddHall} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 16px", borderRadius: 10, border: "1.5px solid #D4A017",
            background: "#fffbeb", color: "#b4860b", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            + Add New Hall
          </button>
          
          <button onClick={handleSaveHalls} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "#D4A017", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 10px rgba(212,160,23,0.3)",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#b8890e"}
            onMouseLeave={e => e.currentTarget.style.background = "#D4A017"}>
            <Save size={14} /> Update Hall Pricing
          </button>
        </div>
      </div>
      )}

      {/* ── WHATSAPP REMINDER SCHEDULE ── */}
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>📲</span>
          </div>
          <div>
            <p style={sectionTitle}>WhatsApp Reminder Schedule</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Auto-send balance payment reminders before the event date</p>
          </div>
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
          Send reminder automatically on these days before event:
        </p>

        {/* Current tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {reminderDays.sort((a, b) => a - b).map(day => (
            <div key={day} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: "#dcfce7", color: "#15803d", border: "2px solid #25D366",
            }}>
              {day} {day === 1 ? "day" : "days"} before
              <button onClick={() => toggleReminderDay(day)} style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                display: "flex", alignItems: "center", lineHeight: 1,
              }}><X size={12} color="#15803d" /></button>
            </div>
          ))}
          {reminderDays.length === 0 && (
            <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No days added yet — type a number below and press Add</span>
          )}
        </div>

        {/* Number input to add a day */}
        <ReminderDayAdder />

        <div style={{ background: "#f0faf4", borderRadius: 10, padding: "12px 16px", marginBottom: 18, border: "1px solid #bbf7d0" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#15803d", margin: 0 }}>
            ✅ Currently configured: {reminderDays.length === 0
              ? "No reminders set"
              : reminderDays.sort((a,b)=>a-b).map(d => `${d} ${d===1?"day":"days"} before`).join(" + ")}
          </p>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4, margin: "4px 0 0" }}>
            Reminders are shown on the Payments page and can also be triggered manually for each booking.
          </p>
        </div>

        <button onClick={handleSaveReminderDays} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#25D366", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 2px 10px rgba(37,211,102,0.35)",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#1ebe58"}
          onMouseLeave={e => e.currentTarget.style.background = "#25D366"}>
          <Save size={14} /> Save Reminder Schedule
        </button>
      </div>

      {/* ── BLACKOUT DATES & STAFF ROLES (Owner & Manager) ── */}
      {isAdminRole && (<>
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>🚫</span>
          </div>
          <div>
            <p style={sectionTitle}>Blackout Dates</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Block specific dates — no bookings will be accepted</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <input type="date" value={blackoutInput} onChange={e => setBlackoutInput(e.target.value)}
            style={{ ...iStyle, flex: 1 }}
            onFocus={e => e.target.style.borderColor = "#C0392B"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          <button onClick={addBlackout} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "#C0392B", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
          }}>
            Block Date
          </button>
        </div>

        {blackoutDates.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>No dates blocked yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {blackoutDates.map(d => (
              <div key={d} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 14px",
                borderRadius: 20, border: "1.5px solid #fecaca", background: "#fef2f2",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#C0392B" }}>
                  {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button onClick={() => removeBlackout(d)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", padding: 0, display: "flex", alignItems: "center" }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── STAFF & ROLES ── */}
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="#7c3aed" />
            </div>
            <div>
              <p style={sectionTitle}>Staff & Roles</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Manage team members and access permissions</p>
            </div>
          </div>
        </div>

        {/* Add Staff Form */}
        <StaffAdder />

        <div style={{ border: "1.5px solid #f3f4f6", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr 100px 40px", background: "#f9fafb", padding: "10px 16px", gap: 12 }}>
            {["Name", "Role", "Access", "Status", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
            ))}
          </div>
          {staff.length === 0 ? (
            <p style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#9ca3af", margin: 0 }}>No staff members added.</p>
          ) : staff.map((s, i) => {
            const roleColors = { Owner: { bg: "#f0faf4", color: "#1B4332" }, Manager: { bg: "#fffbeb", color: "#D4A017" }, Staff: { bg: "#eff6ff", color: "#2563eb" } };
            const rc = roleColors[s.role] || roleColors.Staff;
            return (
              <div key={s.email + i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr 100px 40px", padding: "12px 16px", gap: 12, borderTop: i > 0 ? "1px solid #f3f4f6" : "none", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>{s.email}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: rc.color, background: rc.bg, padding: "3px 10px", borderRadius: 20, textAlign: "center" }}>{s.role}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{s.access}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d", background: "#dcfce7", padding: "3px 10px", borderRadius: 20, textAlign: "center" }}>Active</span>
                <button onClick={() => {
                  const updated = staff.filter((_, idx) => idx !== i);
                  setStaff(updated);
                  handleSaveStaff(updated);
                }} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: "#ef4444", display: "flex", justifyContent: "center" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ── LISTS MANAGEMENT (Owner & Manager) ── */}
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>📋</span>
          </div>
          <div>
            <p style={sectionTitle}>Dropdown Options</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Manage options for forms throughout the app</p>
          </div>
        </div>

        <ListEditor title="Event Types" desc="Available events in booking forms" items={eventTypes} setItems={setEventTypes} />
        <SessionEditor title="Sessions" desc="Available time slots for bookings with specific timings" items={sessions} setItems={setSessions} />
        <ListEditor title="Expense Categories" desc="Categories for tracking auditorium expenses" items={expenseCategories} setItems={setExpenseCategories} />
        <ListEditor title="📍 Places / Areas" desc="Customer locations shown as suggestions in the New Enquiry form (e.g. Kannur, Thalassery)" items={places} setItems={setPlaces} />

        <button onClick={handleSaveLists} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#1B4332", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 2px 10px rgba(27,67,50,0.3)", marginTop: 8,
        }}>
          <Save size={14} /> Save Options
        </button>
      </div>

      </>)}

      {/* ── ONLINE BOOKING LINK ── */}
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link size={18} color="#1B4332" />
          </div>
          <div>
            <p style={sectionTitle}>Online Booking Link</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Share this link for customers to submit enquiries online</p>
          </div>
        </div>

        <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px", marginBottom: 16, border: "1.5px dashed #d1fae5" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Your Booking URL</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <code style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1B4332", background: "#e7f7ef", padding: "8px 14px", borderRadius: 8, overflow: "auto", whiteSpace: "nowrap" }}>
              {window.location.origin}/book/{tenant?.slug || "venue"}
            </code>
            <button
              onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/book/${tenant?.slug || "venue"}`); addToast("Link copied! 📋", "success"); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "none", background: "#1B4332", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
            >
              <Copy size={13} /> Copy
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1.5px solid #d1fae5", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${window.location.origin}/book/${tenant?.slug || "venue"}&bgcolor=ffffff&color=1B4332&margin=10`}
              alt="QR Code for booking page"
              width={160} height={160}
              style={{ borderRadius: 8, display: "block" }}
            />
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", margin: 0 }}>Scan to Open Booking Page</p>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Share with customers</p>
            <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>Customers scan the QR code or open the link to see real-time availability and send enquiries directly to you on WhatsApp.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Share on WhatsApp", emoji: "📱", color: "#25D366", onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent("Book your event at " + (venue.name || "our venue") + " 🏛️\n" + window.location.origin + "/book/" + (tenant?.slug || "venue"))}`, "_blank") },
            { label: "Open Booking Page", emoji: "🌐", color: "#1B4332", onClick: () => window.open(`${window.location.origin}/book/${tenant?.slug || "venue"}`, "_blank") },
          ].map(a => (
            <button key={a.label} onClick={a.onClick} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
              borderRadius: 10, border: `1.5px solid ${a.color}33`,
              background: `${a.color}0d`, color: a.color,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── GALLERY MANAGEMENT (Owner & Manager) ── */}
      {isAdminRole && (
      <div style={cardSt}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImagePlus size={18} color="#1B4332" />
          </div>
          <div>
            <p style={sectionTitle}>Gallery Management</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Add or remove photos and videos shown on your public booking page</p>
          </div>
        </div>

        {/* ── Add New Media Form ── */}
        <div style={{ background: "#f9fafb", borderRadius: 12, padding: 18, marginBottom: 20, border: "1.5px dashed #d1fae5" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <ImagePlus size={13} color="#1B4332" /> Add New Image / Video
          </p>

          {/* Type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["image", "video"].map(t => (
              <button key={t} onClick={() => setNewMedia(p => ({ ...p, type: t, src: "" }))} style={{
                padding: "6px 18px", borderRadius: 20, border: `1.5px solid ${newMedia.type === t ? "#1B4332" : "#e5e7eb"}`,
                background: newMedia.type === t ? "#1B4332" : "#fff",
                color: newMedia.type === t ? "#fff" : "#6b7280",
                fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {t === "image" ? <ImagePlus size={12} /> : <Film size={12} />}
                {t === "image" ? "Image URL" : "YouTube Video"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelSt}>{newMedia.type === "image" ? "🖼️ Image URL" : "🎬 YouTube URL"}</label>
              <input
                value={newMedia.src}
                onChange={e => setNewMedia(p => ({ ...p, src: e.target.value }))}
                placeholder={newMedia.type === "image" ? "https://images.unsplash.com/..." : "https://youtube.com/watch?v=..."}
                style={iStyle}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div>
              <label style={labelSt}>🏷️ Label / Caption</label>
              <input
                value={newMedia.label}
                onChange={e => setNewMedia(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Wedding Ceremony"
                style={iStyle}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div>
              <label style={labelSt}>📂 Category</label>
              <select
                value={newMedia.category}
                onChange={e => setNewMedia(p => ({ ...p, category: e.target.value }))}
                style={{ ...iStyle, appearance: "none" }}
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              >
                {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Preview thumbnail for image/video */}
          {newMedia.src && newMedia.type === "image" && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</p>
              <img src={newMedia.src} alt="preview" onError={e => e.target.style.display="none"} style={{ height: 90, borderRadius: 8, objectFit: "cover", border: "1.5px solid #e5e7eb" }} />
            </div>
          )}
          {newMedia.src && newMedia.type === "video" && getYouTubeId(newMedia.src) && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</p>
              <img src={`https://img.youtube.com/vi/${getYouTubeId(newMedia.src)}/hqdefault.jpg`} alt="yt preview" style={{ height: 90, borderRadius: 8, objectFit: "cover", border: "1.5px solid #e5e7eb" }} />
            </div>
          )}

          {mediaError && <p style={{ fontSize: 12, color: "#C0392B", marginBottom: 10, fontWeight: 600 }}>⚠️ {mediaError}</p>}

          <button onClick={handleAddMedia} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
            borderRadius: 10, border: "none", background: "#1B4332", color: "#fff",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>
            <ImagePlus size={14} /> Add to Gallery
          </button>
        </div>

        {/* ── Existing gallery grid ── */}
        {galleryItems.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No media yet. Add your first image or video above.</p>
        ) : (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Current Gallery ({galleryItems.length} item{galleryItems.length !== 1 ? "s" : ""})
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {galleryItems.map(item => (
                <div key={item.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid #e5e7eb", background: "#f9fafb" }}>
                  {/* Thumbnail */}
                  <div style={{ position: "relative", height: 100 }}>
                    <img
                      src={item.type === "video" ? item.thumb : item.src}
                      alt={item.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {item.type === "video" && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(212,160,23,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={13} fill="#0D2418" color="#0D2418" style={{ marginLeft: 2 }} />
                        </div>
                      </div>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      style={{ position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: "50%", background: "rgba(192,57,43,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Remove"
                    >
                      <Trash2 size={11} color="#fff" />
                    </button>
                    {/* Category badge */}
                    <span style={{ position: "absolute", bottom: 5, left: 5, fontSize: 9, fontWeight: 700, background: "rgba(212,160,23,0.9)", color: "#0D2418", padding: "2px 6px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {item.category}
                    </span>
                  </div>
                  {/* Label */}
                  <div style={{ padding: "7px 8px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      )}

      {/* ── APP INFO ── */}
      <div style={{ ...cardSt, background: "linear-gradient(135deg, #0D2418, #1B4332)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo size={24} />
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, margin: 0, color: "#fff" }}>
                Venueza
              </p>
            </div>
            <p style={{ fontSize: 12, color: "rgba(212,160,23,0.85)", marginTop: 4 }}>
              Premium Auditorium Management — v1.0.0
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>Built for Kerala</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>© 2026 Venueza SaaS</p>
          </div>
        </div>
      </div>

    </div>
  );
}
