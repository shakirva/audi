import { useState, useEffect } from "react";
import { Save, Building2, User, MapPin, IndianRupee, Users, CheckCircle, X, Copy, Link, ShieldCheck, ImagePlus, Trash2, Play, Film, ToggleLeft, ToggleRight, Eye, EyeOff, Database, Edit, Edit3, UploadCloud, Loader } from "lucide-react";
import Logo from "../components/Logo";
import { useToast } from "../components/Toast";
import { useRole } from "../context/RoleContext";
import { useBookings } from "../context/BookingsContext";
import { authAPI, settingsAPI, usersAPI, mastersAPI } from "../services/api";
import { useConfirm } from "../components/ConfirmProvider";
import CreateHallModal from "../components/CreateHallModal";
import AddStaffModal from "../components/AddStaffModal";
import { BASE_NAVIGATION } from "../constants/navigation";

const INIT_HALLS = [
  { name: "Main Hall",  icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup", gstRate: 18 },
  { name: "Mini Hall",  icon: "🏠", price: 6000,  capacity: 150, description: "Intimate setting for smaller events", gstRate: 18 },
  { name: "Open Stage", icon: "🌿", price: 8000,  capacity: 300, description: "Outdoor stage with natural surroundings", gstRate: 18 },
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

const RoleAccessEditor = ({ moduleAccess, setModuleAccess }) => {
  const [activeRole, setActiveRole] = useState("Manager");
  const { addToast } = useToast();

  const handleToggle = (path) => {
    const current = moduleAccess[activeRole] || BASE_NAVIGATION.flatMap(item => [item.path, ...(item.children?.map(c => c.path) || [])]).filter(Boolean);
    let updated;
    if (current.includes(path)) {
      updated = current.filter(p => p !== path);
    } else {
      updated = [...current, path];
    }
    const newAccess = { ...moduleAccess, [activeRole]: updated };
    setModuleAccess(newAccess);
  };

  const saveAccess = async () => {
    try {
      await settingsAPI.update({ moduleAccess });
      addToast("Role access configured! 🔒", "success");
    } catch (e) {
      addToast("Failed to save role access", "error");
    }
  };

  // Default permissions if not set in DB
  const defaultPaths = BASE_NAVIGATION.flatMap(item => {
    if (item.roles.includes(activeRole)) {
      return [item.path, ...(item.children?.map(c => c.path) || [])];
    }
    return [];
  }).filter(Boolean);

  const activePaths = moduleAccess[activeRole] || defaultPaths;

  // Filter BASE_NAVIGATION to only show modules this role COULD theoretically access, or just show all non-SuperAdmin modules?
  // It's better to show all modules (except SaaS Platform) so the Owner can grant access to anything.
  const configurableNav = BASE_NAVIGATION.filter(item => item.label !== "SaaS Platform");

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
        {["Manager", "Sales", "Reception", "Accounts", "Operations", "Coordinator", "Staff", "Security", "Technician", "Cleaner"].map(r => {
          const isActive = activeRole === r;
          return (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: isActive ? 700 : 600,
                border: isActive ? "1px solid #1B4332" : "1px solid #e2e8f0",
                background: isActive ? "#f0faf4" : "#fff", 
                color: isActive ? "#0D2418" : "#64748b", 
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
        {configurableNav.map(group => {
          const isGroupLink = group.type === "link";
          const hasAccessToMain = activePaths.includes(group.path);
          
          return (
            <div key={group.label} style={{ background: "#f9fafb", padding: 12, borderRadius: 10, border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input 
                  type="checkbox" 
                  checked={hasAccessToMain || (group.children && group.children.some(c => activePaths.includes(c.path)))}
                  onChange={() => {
                    if (isGroupLink) {
                      handleToggle(group.path);
                    } else {
                      // Toggle all children
                      const allChildrenPaths = group.children.map(c => c.path);
                      const allChecked = allChildrenPaths.every(p => activePaths.includes(p));
                      
                      let newPaths = [...activePaths];
                      if (allChecked) {
                        newPaths = newPaths.filter(p => !allChildrenPaths.includes(p));
                      } else {
                        newPaths = [...new Set([...newPaths, ...allChildrenPaths])];
                      }
                      setModuleAccess({ ...moduleAccess, [activeRole]: newPaths });
                    }
                  }}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1B4332" }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{group.label}</span>
              </div>
              
              {group.children && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 24 }}>
                  {group.children.map(child => (
                    <label key={child.path} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={activePaths.includes(child.path)}
                        onChange={() => handleToggle(child.path)}
                        style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#1B4332" }}
                      />
                      <span style={{ fontSize: 12, color: "#4b5563" }}>{child.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
        <button onClick={saveAccess} style={{ padding: "8px 20px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
          Save Access for {activeRole}
        </button>
      </div>
    </div>
  );
};

export default function Settings() {
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const { role, managerRevenueEnabled, setManagerRevenueEnabled, tenant, activeEnvironment, setVenueInfo, moduleAccess, setModuleAccess } = useRole();
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
    bookingPrefix: "",
    logoUrl: "",
    legalName: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
  });
  const [showCreateHallModal, setShowCreateHallModal] = useState(false);
  const [editHallIndex, setEditHallIndex] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [dbUsers, setDbUsers] = useState([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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

  const [facilities, setFacilities] = useState([]);
  const [newFacility, setNewFacility] = useState({ name: "", price: "", gst: "" });

  useEffect(() => {
    loadSettings();
    loadUsers();
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const res = await mastersAPI.getByType("services");
      setFacilities(res.data?.data || []);
    } catch (e) {
      console.error("Failed to load facilities:", e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setDbUsers(res.data.data || []);
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const data = response.data.data;
      setSettingsId(data.id);
      setVenue({
        name: data.venueName || "",
        owner: data.ownerName || "",
        location: data.location || "",
        phone: data.phone || "",
        email: data.email || "",
        gstin: data.gstin || "",
        bookingPrefix: data.bookingPrefix || "BK",
        logoUrl: data.logoUrl || "",
        legalName: data.legalName || "",
        bankName: data.bankName || "",
        accountName: data.accountName || "",
        accountNumber: data.accountNumber || "",
        ifscCode: data.ifscCode || "",
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
      if (data.moduleAccess) setModuleAccess(data.moduleAccess);
      setManagerRevenueEnabled(data.managerRevenueEnabled !== false);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenue(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast("Image size must be less than 5MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    setIsUploadingLogo(true);
    try {
      const res = await settingsAPI.uploadLogo(formData);
      if (res.data && res.data.url) {
        setVenue(prev => ({ ...prev, logoUrl: res.data.url }));
        addToast("Logo uploaded successfully", "success");
      }
    } catch (err) {
      addToast("Failed to upload logo", "error");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleHallChange = (idx, field, value) => {
    setHalls(prev => prev.map((h, i) => {
      if (i !== idx) return h;
      const updated = { ...h, [field]: field === "price" || field === "pricePerPax" || field === "capacity" ? Number(value) : value };
      if (field === "pricingType") {
         if (value === "flat") { updated.pricePerPax = 0; updated.slabs = []; }
         else if (value === "per_pax") { updated.price = 0; updated.slabs = []; }
      }
      return updated;
    }));
  };

  const handleAddHall = () => {
    setEditHallIndex(null);
    setShowCreateHallModal(true);
  };

  const handleEditHall = (idx) => {
    setEditHallIndex(idx);
    setShowCreateHallModal(true);
  };

  const handleDeleteHall = (idx) => {
    setHalls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveVenue = async () => {
    try {
      await settingsAPI.update({ 
        venueName: venue.name, ownerName: venue.owner, location: venue.location, phone: venue.phone, email: venue.email, 
        gstin: venue.gstin, bookingPrefix: venue.bookingPrefix,
        logoUrl: venue.logoUrl, legalName: venue.legalName, bankName: venue.bankName, accountName: venue.accountName, accountNumber: venue.accountNumber, ifscCode: venue.ifscCode 
      });
      // Update shared venueInfo so Sidebar/Header reflect changes immediately
      setVenueInfo({ name: venue.name, subtitle: "Auditorium", owner: venue.owner, logoUrl: venue.logoUrl });
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
      await settingsAPI.update({ eventTypes, sessions, places });
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

  const [editFacilityId, setEditFacilityId] = useState(null);
  const [editFacilityData, setEditFacilityData] = useState({ name: "", price: "", gst: "" });

  const handleAddFacility = async () => {
    if (!newFacility.name.trim()) return;
    try {
      await mastersAPI.create({ name: newFacility.name, price: Number(newFacility.price) || 0, type: "services", gst: Number(newFacility.gst) || 0 });
      setNewFacility({ name: "", price: "", gst: "" });
      loadFacilities();
      addToast("Facility added! 🛠️", "success");
    } catch (e) {
      addToast("Failed to add facility", "error");
    }
  };

  const handleUpdateFacility = async () => {
    if (!editFacilityData.name.trim()) return;
    try {
      await mastersAPI.update("services", editFacilityId, { name: editFacilityData.name, price: Number(editFacilityData.price) || 0, gst: Number(editFacilityData.gst) || 0 });
      setEditFacilityId(null);
      setEditFacilityData({ name: "", price: "", gst: "" });
      loadFacilities();
      addToast("Facility updated!", "success");
    } catch (e) {
      addToast("Failed to update facility", "error");
    }
  };

  const handleDeleteFacility = async (id) => {
    if (!(await confirm("Delete this facility?"))) return;
    try {
      await mastersAPI.remove("services", id);
      loadFacilities();
      addToast("Facility deleted", "info");
    } catch (e) {
      addToast("Failed to delete facility", "error");
    }
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
        {items.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db", fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
            No items added yet.
          </div>
        )}
        {items.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {items.map(item => (
              <div key={item} style={{ padding: "5px 12px", background: "#f3f4f6", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                {item}
                <button onClick={() => setItems(items.filter(i => i !== item))} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}><X size={12} color="#C0392B" /></button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newVal} onChange={e => setNewVal(e.target.value)} style={{ ...iStyle, flex: 1 }} placeholder="Type new option..." onKeyDown={e => { if(e.key === "Enter") { e.preventDefault(); if(newVal && !items.includes(newVal)){ setItems([...items, newVal]); setNewVal(""); } } }} />
          <button onClick={() => { if(newVal && !items.includes(newVal)){ setItems([...items, newVal]); setNewVal(""); } }} style={{ padding: "8px 16px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Add</button>
        </div>
      </div>
    );
  };

  const EventTypeEditor = ({ title, desc, items, setItems, globalSessions }) => {
    const [newName, setNewName] = useState("");
    
    // Normalize items to objects if they are strings, and convert old pill sessions to object array
    const normalizedItems = items.map(item => {
      if (typeof item === "string") return { name: item, sessions: [] };
      if (!item.sessions) {
        const oldAllowed = item.allowedSessions || [];
        const mappedSessions = oldAllowed.map(sName => {
          const match = globalSessions.find(s => s.name === sName);
          return { name: sName, time: match ? match.time : "" };
        });
        return { ...item, sessions: mappedSessions };
      }
      return item;
    });

    return (
      <div style={{ marginBottom: 20 }}>
        <label style={labelSt}>{title}</label>
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, marginTop: -2 }}>{desc}</p>
        {normalizedItems.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db", fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
            No event types added yet.
          </div>
        )}
        {normalizedItems.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {normalizedItems.map(item => (
              <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: 12, background: "#fff", padding: "14px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.name}</span>
                  <button onClick={() => setItems(normalizedItems.filter(i => i.name !== item.name))} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
                    <X size={14} color="#C0392B" />
                  </button>
                </div>
                
                <div style={{ paddingLeft: 12, borderLeft: "2px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 6 }}>
                  {item.sessions && item.sessions.length > 0 ? item.sessions.map((sess, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", minWidth: 80 }}>{sess.name}</span>
                      <input 
                        value={sess.time || ""}
                        onChange={(e) => {
                          const newSessions = [...item.sessions];
                          newSessions[idx] = { ...sess, time: e.target.value };
                          setItems(normalizedItems.map(i => i.name === item.name ? { ...i, sessions: newSessions } : i));
                        }}
                        style={{ ...iStyle, padding: "4px 8px", fontSize: 11, flex: 1, borderColor: "#e5e7eb" }}
                        placeholder="Time (e.g. 9am - 1pm)"
                      />
                      <button onClick={() => {
                        const newSessions = item.sessions.filter((_, i) => i !== idx);
                        setItems(normalizedItems.map(i => i.name === item.name ? { ...i, sessions: newSessions } : i));
                      }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}><X size={12} color="#C0392B" /></button>
                    </div>
                  )) : (
                    <span style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>No sessions configured for this event.</span>
                  )}
                  
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <select id={`sess_name_${item.name}`} style={{ ...iStyle, padding: "4px 8px", fontSize: 11, flex: 1, borderColor: "#e5e7eb", background: "#f9fafb" }}>
                      <option value="">-- Select Session --</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                      <option value="Full Day">Full Day</option>
                    </select>
                    <input id={`sess_time_${item.name}`} placeholder="Time (e.g. 9am - 2pm)" style={{ ...iStyle, padding: "4px 8px", fontSize: 11, flex: 1, borderColor: "#e5e7eb" }} onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const sName = document.getElementById(`sess_name_${item.name}`).value;
                        const sTime = document.getElementById(`sess_time_${item.name}`).value;
                        if (sName) {
                          const newSessions = [...(item.sessions || []), { name: sName, time: sTime }];
                          setItems(normalizedItems.map(i => i.name === item.name ? { ...i, sessions: newSessions } : i));
                          document.getElementById(`sess_name_${item.name}`).value = "";
                          document.getElementById(`sess_time_${item.name}`).value = "";
                        }
                      }
                    }} />
                    <button onClick={() => {
                      const sName = document.getElementById(`sess_name_${item.name}`).value;
                      const sTime = document.getElementById(`sess_time_${item.name}`).value;
                      if (sName) {
                        const newSessions = [...(item.sessions || []), { name: sName, time: sTime }];
                        setItems(normalizedItems.map(i => i.name === item.name ? { ...i, sessions: newSessions } : i));
                        document.getElementById(`sess_name_${item.name}`).value = "";
                        document.getElementById(`sess_time_${item.name}`).value = "";
                      }
                    }} style={{ padding: "4px 10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600, color: "#374151" }}>Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} style={{ ...iStyle, flex: 1 }} placeholder="Type new event type..." onKeyDown={e => { if(e.key === "Enter") { e.preventDefault(); if(newName && !normalizedItems.find(i => i.name === newName)){ setItems([...normalizedItems, { name: newName, sessions: [] }]); setNewName(""); } } }} />
          <button onClick={() => { if(newName && !normalizedItems.find(i => i.name === newName)){ setItems([...normalizedItems, { name: newName, sessions: [] }]); setNewName(""); } }} style={{ padding: "8px 16px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Add Event Type</button>
        </div>
      </div>
    );
  };

  const StaffAdder = () => (
    <button
      onClick={() => { setEditingStaff(null); setShowAddStaffModal(true); }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 18px", borderRadius: 10, border: "none",
        background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
        color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
        boxShadow: "0 4px 12px rgba(124,58,237,0.25)", marginBottom: 18,
      }}>
      + Add Staff / Create User
    </button>
  );

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



  return (
    <div className="hm-settings-container" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="hm-page-heading">Settings</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
          Manage your auditorium profile, hall pricing and preferences
        </p>
      </div>

      {/* ── QUICK NAV (Mobile) ── */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 16, marginBottom: 24, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", position: "sticky", top: 60, background: "#fff", zIndex: 20 }} className="hm-hide-scrollbar">
        {[
          { id: "roles", label: "Roles" },
          { id: "sandbox", label: "Sandbox" },
          { id: "venue", label: "Venue" },
          { id: "halls", label: "Halls" },
          { id: "pricing", label: "Pricing" },
          { id: "reminders", label: "Reminders" },
          { id: "staff", label: "Staff" },
          { id: "gallery", label: "Gallery" }
        ].map(n => (
          <button key={n.id} onClick={() => {
            const el = document.getElementById(n.id);
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 120;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }} style={{ padding: "8px 16px", borderRadius: 20, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#333", cursor: "pointer" }}>{n.label}</button>
        ))}
      </div>



      {/* ── ROLE-BASED MODULE ACCESS (Owner only) ── */}
      {isOwner && (
        <div id="roles" style={{ ...cardSt, border: "1.5px solid #e2e8f0", background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} color="#0D2418" />
            </div>
            <div>
              <p style={{ ...sectionTitle, color: "#0D2418" }}>Role-Based Module Access</p>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Configure which modules are visible to each staff role</p>
            </div>
          </div>



          <RoleAccessEditor moduleAccess={moduleAccess || {}} setModuleAccess={setModuleAccess} />
        </div>
      )}

      {/* ── SANDBOX MANAGEMENT (Owner only) ── */}
      {isOwner && activeEnvironment === "sandbox" && (
        <div id="sandbox" style={{ ...cardSt, border: "1.5px solid #fecaca", background: "linear-gradient(135deg, #fef2f2, #fff1f2)" }}>
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
                if (await confirm("Are you sure you want to reset the Sandbox? All current training data will be lost. (Production is safe).")) {
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
                      setTesterCreds(data.data);
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
                    <span style={{ fontSize: 10, color: "#b91c1c", fontWeight: 700, textTransform: "uppercase" }}>Name</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "monospace" }}>{testerCreds.name}</p>
                  </div>
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
        <div id="venue" style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={18} color="#1B4332" />
          </div>
          <div>
            <p style={sectionTitle}>Venue Information</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Your auditorium's public profile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          <div>
            <label style={labelSt}>🔢 Booking ID Prefix</label>
            <input name="bookingPrefix" value={venue.bookingPrefix} onChange={handleVenueChange} style={iStyle} placeholder="e.g. BK, LGE, etc."
              onFocus={e => e.target.style.borderColor = "#1B4332"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0" }}>Used when auto-generating new Booking IDs (e.g. {venue.bookingPrefix || "BK"}001)</p>
          </div>
          <div>
            <label style={labelSt}><ImagePlus size={11} /> Logo URL</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="logoUrl" value={venue.logoUrl} onChange={handleVenueChange} style={{ ...iStyle, flex: 1 }} placeholder="https://..."
                onFocus={e => e.target.style.borderColor = "#1B4332"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              <label style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "0 16px", background: "#f1f5f9", border: "1px solid #e2e8f0", 
                borderRadius: 12, cursor: isUploadingLogo ? "not-allowed" : "pointer", 
                color: "#475569", fontWeight: 600, fontSize: 13,
                opacity: isUploadingLogo ? 0.7 : 1
              }}>
                {isUploadingLogo ? <Loader size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                Upload
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} disabled={isUploadingLogo} />
              </label>
            </div>
            <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0" }}>Used in PDF Receipts and Invoices</p>
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: 12, marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: 6 }}>Billing & Bank Details</p>
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

      {/* ── HALL MANAGEMENT (Owner & Manager) ── */}
      {isAdminRole && (
      <div id="halls" style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={18} color="#4b5563" />
          </div>
          <div>
            <p style={sectionTitle}>Hall Management</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Create halls and define their capacities</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {halls.map((hall, idx) => (
            <div key={idx} style={{
              border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "16px 18px",
              background: "#fafafa", position: "relative"
            }}>
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                <button onClick={() => handleEditHall(idx)} title="Edit Hall" style={{ background: "#e0f2fe", border: "none", borderRadius: 6, cursor: "pointer", padding: 6, display: "flex" }}>
                  <Edit size={14} color="#0284c7" />
                </button>
                <button onClick={() => handleDeleteHall(idx)} title="Delete Hall" style={{ background: "#fee2e2", border: "none", borderRadius: 6, cursor: "pointer", padding: 6, display: "flex" }}>
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 12, paddingRight: 32 }}>
                <div style={{ width: 60 }}>
                  <label style={labelSt}>Icon</label>
                  <input value={hall.icon} onChange={e => handleHallChange(idx, "icon", e.target.value)}
                    style={{...iStyle, textAlign: "center", fontSize: 16}}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div style={{ flex: "1 1 180px" }}>
                  <label style={labelSt}>Hall Name</label>
                  <input value={hall.name} onChange={e => handleHallChange(idx, "name", e.target.value)}
                    style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <label style={labelSt}><Users size={11} /> Guests Cap.</label>
                  <input type="number" value={hall.capacity} onChange={e => handleHallChange(idx, "capacity", e.target.value)}
                    style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <label style={labelSt}>Pricing Model</label>
                  <select value={hall.pricingType || "flat"} onChange={e => handleHallChange(idx, "pricingType", e.target.value)}
                    style={{ ...iStyle, cursor: "pointer" }}>
                    <option value="flat">Flat Rate</option>
                    <option value="per_pax">Per Pax Rate</option>
                    <option value="slab">Slab / Package Wise</option>
                  </select>
                </div>
                <div style={{ flex: "1 1 80px" }}>
                  <label style={labelSt}>GST %</label>
                  <input type="number" value={hall.gstRate ?? 18} onChange={e => handleHallChange(idx, "gstRate", Number(e.target.value))}
                    style={iStyle}
                    onFocus={e => e.target.style.borderColor = "#1B4332"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
              <div style={{ paddingRight: 32 }}>
                <label style={labelSt}>Description</label>
                <input value={hall.description} onChange={e => handleHallChange(idx, "description", e.target.value)}
                  style={{ ...iStyle, fontSize: 12 }}
                  onFocus={e => e.target.style.borderColor = "#1B4332"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleAddHall} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 16px", borderRadius: 10, border: "1.5px solid #d1d5db",
            background: "#f3f4f6", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            + Add New Hall
          </button>
          
          <button onClick={handleSaveHalls} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "#4b5563", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 10px rgba(75,85,99,0.3)",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#374151"}
            onMouseLeave={e => e.currentTarget.style.background = "#4b5563"}>
            <Save size={14} /> Save Halls
          </button>
        </div>
      </div>
      )}

      {/* ── FACILITIES & ADD-ONS (Owner & Manager) ── */}
      {isAdminRole && (
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>🛠️</span>
          </div>
          <div>
            <p style={sectionTitle}>Facilities & Add-ons</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Create extra services that clients can add to their bookings</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {facilities.map((fac) => (
            <div key={fac.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px",
              background: "#fafafa"
            }}>
              {editFacilityId === fac.id ? (
                <div style={{ display: "flex", gap: 12, flex: 1, alignItems: "flex-end", marginRight: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, marginBottom: 4, display: "block" }}>Name</label>
                    <input value={editFacilityData.name} onChange={e => setEditFacilityData({ ...editFacilityData, name: e.target.value })} style={iStyle} />
                  </div>
                  <div style={{ width: 100 }}>
                    <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, marginBottom: 4, display: "block" }}>Price (₹)</label>
                    <input type="number" value={editFacilityData.price} onChange={e => setEditFacilityData({ ...editFacilityData, price: e.target.value })} style={iStyle} />
                  </div>
                  <div style={{ width: 80 }}>
                    <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, marginBottom: 4, display: "block" }}>GST (%)</label>
                    <input type="number" value={editFacilityData.gst} onChange={e => setEditFacilityData({ ...editFacilityData, gst: e.target.value })} style={iStyle} />
                  </div>
                  <button onClick={handleUpdateFacility} style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 35 }}>Save</button>
                  <button onClick={() => setEditFacilityId(null)} style={{ background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 35 }}>Cancel</button>
                </div>
              ) : (
                <>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>{fac.name}</p>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "4px 0 0" }}>
                      {fac.price > 0 && <p style={{ margin: 0, fontSize: 13, color: "#166534", fontWeight: 600 }}>₹{fac.price.toLocaleString()}</p>}
                      {fac.gst > 0 && <span style={{ fontSize: 11, background: "#e0e7ff", color: "#3730a3", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>{fac.gst}% GST</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditFacilityId(fac.id); setEditFacilityData({ name: fac.name, price: fac.price, gst: fac.gst || "" }); }} style={{ background: "#e0f2fe", border: "none", borderRadius: 6, cursor: "pointer", padding: 6, display: "flex" }}>
                      <Edit3 size={14} color="#0284c7" />
                    </button>
                    <button onClick={() => handleDeleteFacility(fac.id)} style={{ background: "#fee2e2", border: "none", borderRadius: 6, cursor: "pointer", padding: 6, display: "flex" }}>
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {facilities.length === 0 && (
            <div style={{ padding: "16px", textAlign: "center", background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db", fontSize: 12, color: "#6b7280" }}>
              No facilities added yet.
            </div>
          )}
        </div>

        {editFacilityId === null && (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelSt}>New Facility Name</label>
              <input value={newFacility.name} onChange={e => setNewFacility({ ...newFacility, name: e.target.value })} style={iStyle} placeholder="e.g. LED Wall, Stage Decor" />
            </div>
            <div style={{ width: 150 }}>
              <label style={labelSt}>Price (₹)</label>
              <input type="number" value={newFacility.price} onChange={e => setNewFacility({ ...newFacility, price: e.target.value })} style={iStyle} placeholder="0" />
            </div>
            <div style={{ width: 100 }}>
              <label style={labelSt}>GST (%)</label>
              <input type="number" value={newFacility.gst} onChange={e => setNewFacility({ ...newFacility, gst: e.target.value })} style={iStyle} placeholder="e.g. 18" />
            </div>
            <button onClick={handleAddFacility} style={{
              padding: "8px 16px", borderRadius: 8, background: "#1B4332", color: "#fff",
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", height: 35
            }}>+ Add</button>
          </div>
        )}
      </div>
      )}

      {/* ── HALL PRICING CONFIGURATION (Owner & Manager) ── */}
      {isAdminRole && (
      <div id="pricing" style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={18} color="#D4A017" />
          </div>
          <div>
            <p style={sectionTitle}>Hall Pricing Configuration</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Configure specific rates and slab pricing based on models</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {halls.map((hall, idx) => (
            <div key={idx} style={{
              border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "16px 18px",
              background: "#fafafa"
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1B4332", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{hall.icon}</span> {hall.name} 
                <span style={{ fontSize: 10, color: "#6b7280", background: "#e5e7eb", padding: "2px 6px", borderRadius: 4 }}>
                  {hall.pricingType === "slab" ? "Slab Wise" : hall.pricingType === "per_pax" ? "Per Pax" : "Flat Rate"}
                </span>
              </div>
              
              {(!hall.pricingType || hall.pricingType === "flat") && (
                <div style={{ width: 200 }}>
                  <label style={labelSt}><IndianRupee size={11} /> Flat Rate per Session</label>
                  <input type="number" value={hall.price} onChange={e => handleHallChange(idx, "price", e.target.value)} style={iStyle} />
                </div>
              )}

              {hall.pricingType === "per_pax" && (
                <div style={{ width: 200 }}>
                  <label style={labelSt}><IndianRupee size={11} /> Rate per Pax</label>
                  <input type="number" value={hall.pricePerPax || 0} onChange={e => handleHallChange(idx, "pricePerPax", e.target.value)} style={iStyle} />
                </div>
              )}

              {hall.pricingType === "slab" && (
                <div>
                  <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>Configure guest slabs (e.g. Up to 300 guests = Rs. 390,000)</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(hall.slabs || []).map((slab, sIdx) => (
                      <div key={sIdx} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, color: "#6b7280" }}>Up to Guests</label>
                          <input type="number" value={slab.guests || ""} onChange={e => {
                            const newSlabs = [...(hall.slabs || [])];
                            newSlabs[sIdx].guests = Number(e.target.value);
                            const g = newSlabs[sIdx].guests || 0;
                            const t = newSlabs[sIdx].totalAmount || 0;
                            const b = newSlabs[sIdx].baseAmount || 0;
                            if (g > 0) newSlabs[sIdx].perPerson = Math.round((t - b) / g);
                            handleHallChange(idx, "slabs", newSlabs);
                          }} style={iStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, color: "#6b7280" }}>Total Amount (₹)</label>
                          <input type="number" value={slab.totalAmount || ""} onChange={e => {
                            const newSlabs = [...(hall.slabs || [])];
                            newSlabs[sIdx].totalAmount = Number(e.target.value);
                            const g = newSlabs[sIdx].guests || 0;
                            const t = newSlabs[sIdx].totalAmount || 0;
                            const b = newSlabs[sIdx].baseAmount || 0;
                            if (g > 0) newSlabs[sIdx].perPerson = Math.round((t - b) / g);
                            handleHallChange(idx, "slabs", newSlabs);
                          }} style={iStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, color: "#6b7280" }}>Hall Price</label>
                          <input type="number" value={slab.baseAmount || ""} onChange={e => {
                            const newSlabs = [...(hall.slabs || [])];
                            newSlabs[sIdx].baseAmount = Number(e.target.value);
                            const g = newSlabs[sIdx].guests || 0;
                            const t = newSlabs[sIdx].totalAmount || 0;
                            const b = newSlabs[sIdx].baseAmount || 0;
                            if (g > 0) newSlabs[sIdx].perPerson = Math.round((t - b) / g);
                            handleHallChange(idx, "slabs", newSlabs);
                          }} style={iStyle} placeholder="₹" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, color: "#6b7280" }}>Per Person</label>
                          <input type="number" value={slab.perPerson || ""} onChange={e => {
                            const newSlabs = [...(hall.slabs || [])];
                            newSlabs[sIdx].perPerson = Number(e.target.value);
                            handleHallChange(idx, "slabs", newSlabs);
                          }} style={iStyle} placeholder="₹" />
                        </div>
                        <button onClick={() => {
                          const newSlabs = (hall.slabs || []).filter((_, i) => i !== sIdx);
                          handleHallChange(idx, "slabs", newSlabs);
                        }} style={{ padding: 8, background: "#fee2e2", border: "none", borderRadius: 8, cursor: "pointer", height: 35 }}>
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newSlabs = [...(hall.slabs || []), { guests: 0, totalAmount: 0, baseAmount: 0, perPerson: 0 }];
                      handleHallChange(idx, "slabs", newSlabs);
                    }} style={{ padding: "6px 12px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", width: "fit-content", marginTop: 4 }}>
                      + Add Slab
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex" }}>
          <button onClick={handleSaveHalls} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "#D4A017", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 10px rgba(212,160,23,0.3)",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#b8890e"}
            onMouseLeave={e => e.currentTarget.style.background = "#D4A017"}>
            <Save size={14} /> Save Pricing Configuration
          </button>
        </div>
      </div>
      )}

      {/* ── WHATSAPP REMINDER SCHEDULE ── */}
      <div id="reminders" style={cardSt}>
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
      <div id="staff" style={cardSt}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 1fr 100px 80px", background: "#f9fafb", padding: "10px 16px", gap: 12 }}>
            {["Name", "Password", "Role", "Access", "Status", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: h === "" ? "right" : "left" }}>{h}</span>
            ))}
          </div>
          {dbUsers.length === 0 ? (
            <p style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#9ca3af", margin: 0 }}>No staff members added.</p>
          ) : dbUsers.map((s, i) => {
            const roleColors = { Owner: { bg: "#f0faf4", color: "#1B4332" }, Manager: { bg: "#fffbeb", color: "#D4A017" }, Staff: { bg: "#eff6ff", color: "#2563eb" } };
            const rc = roleColors[s.role] || roleColors.Staff;
            return (
              <div key={s.id || i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 1fr 100px 80px", padding: "12px 16px", gap: 12, borderTop: i > 0 ? "1px solid #f3f4f6" : "none", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{s.email}</p>
                </div>
                <div style={{ fontSize: 12, fontFamily: "monospace", color: "#4b5563", background: "#f3f4f6", padding: "4px 8px", borderRadius: 6, display: "inline-block", wordBreak: "break-all" }}>
                  {s.plainPassword || "********"}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: rc.color, background: rc.bg, padding: "3px 10px", borderRadius: 20, textAlign: "center" }}>{s.role}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{s.role === "Owner" || s.role === "Manager" ? "Full Access" : s.role === "Sales" ? "CRM Only" : "Basic"}</span>
                <button onClick={async () => {
                  try {
                    await usersAPI.toggle(s.id);
                    loadUsers();
                    addToast(`User ${s.active ? 'deactivated' : 'activated'}`, "success");
                  } catch(e) {
                    addToast("Failed to toggle user status", "error");
                  }
                }} style={{ cursor: "pointer", border: "none", background: "none", fontSize: 11, fontWeight: 600, color: s.active ? "#15803d" : "#ef4444", background: s.active ? "#dcfce7" : "#fee2e2", padding: "3px 10px", borderRadius: 20, textAlign: "center" }}>
                  {s.active ? "Active" : "Inactive"}
                </button>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
                  <button onClick={() => { setEditingStaff(s); setShowAddStaffModal(true); }} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: "#6366f1", display: "flex", justifyContent: "center" }}>
                    <Edit size={14} />
                  </button>
                  <button onClick={async () => {
                    if (!isOwner) {
                      addToast("Only Owners can delete users", "error");
                      return;
                    }
                    if (s.role === "Owner") {
                      addToast("Cannot delete Owner account", "error");
                      return;
                    }
                    if (await confirm("Are you sure you want to delete this user?")) {
                      try {
                        await usersAPI.remove(s.id);
                        loadUsers();
                        addToast("User deleted successfully", "success");
                      } catch(e) {
                        addToast("Failed to delete user", "error");
                      }
                    }
                  }} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: (!isOwner || s.role === "Owner") ? "#cbd5e1" : "#ef4444", display: "flex", justifyContent: "center" }} disabled={!isOwner || s.role === "Owner"}>
                    <Trash2 size={14} />
                  </button>
                </div>
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
        <EventTypeEditor title="Event Types" desc="Available events in booking forms and their specific sessions" items={eventTypes} setItems={setEventTypes} globalSessions={sessions} />
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
      <div id="gallery" style={cardSt}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

      <CreateHallModal
        open={showCreateHallModal}
        editData={editHallIndex !== null ? halls[editHallIndex] : null}
        onClose={() => {
          setShowCreateHallModal(false);
          setEditHallIndex(null);
        }}
        onSave={async (newHall) => {
          let updatedHalls = [];
          if (editHallIndex !== null) {
            updatedHalls = halls.map((h, i) => i === editHallIndex ? { ...h, ...newHall } : h);
            setHalls(updatedHalls);
            addToast(`${newHall.name} updated successfully!`, "success");
          } else {
            updatedHalls = [...halls, newHall];
            setHalls(updatedHalls);
            addToast(`${newHall.name} added successfully!`, "success");
          }
          setEditHallIndex(null);
          
          try {
            await settingsAPI.update({ halls: updatedHalls });
          } catch(e) {
            console.error("Failed to auto-save halls to db", e);
          }
        }}
      />
      <AddStaffModal 
        open={showAddStaffModal}
        onClose={() => { setShowAddStaffModal(false); setEditingStaff(null); }}
        editingUser={editingStaff}
        onSave={async (staffData, id) => {
          if (id) {
            await usersAPI.update(id, staffData);
            addToast("Staff updated successfully!", "success");
          } else {
            await usersAPI.create(staffData);
            addToast("Staff created successfully!", "success");
          }
          loadUsers();
          setShowAddStaffModal(false);
          setEditingStaff(null);
        }}
      />
    </div>
  );
}
