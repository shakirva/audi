import { useState, useEffect } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import Logo from "../components/Logo";
import { useToast } from "../components/Toast";
import { useRole } from "../context/RoleContext";
import { settingsAPI, usersAPI } from "../services/api";
import { useConfirm } from "../components/ConfirmProvider";

// Import Tabs
import GeneralTab from "./settings/GeneralTab";
import BookingTab from "./settings/BookingTab";
import HallsTab from "./settings/HallsTab";
import AvailabilityTab from "./settings/AvailabilityTab";
import TeamTab from "./settings/TeamTab";
import FormsTab from "./settings/FormsTab";
import OnlinePresenceTab from "./settings/OnlinePresenceTab";

const INIT_HALLS = [
  { name: "Main Hall",  icon: "🏛️", price: 15000, capacity: 600, description: "Grand ballroom with full AV setup", gstRate: 18 },
  { name: "Mini Hall",  icon: "🏠", price: 6000,  capacity: 150, description: "Intimate setting for smaller events", gstRate: 18 },
  { name: "Open Stage", icon: "🌿", price: 8000,  capacity: 300, description: "Outdoor stage with natural surroundings", gstRate: 18 },
];

export default function Settings() {
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const { role, tenant, activeEnvironment, setVenueInfo, moduleAccess, setModuleAccess } = useRole();
  const isOwner = role === "Owner";
  const isAdminRole = ["Owner", "Manager", "SuperAdmin"].includes(role);

  // --- Tab Management ---
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "general";
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, "", `?tab=${tabId}`);
  };

  const tabs = [
    { id: "general", label: "General", show: isAdminRole },
    { id: "booking", label: "Booking", show: isAdminRole },
    { id: "halls", label: "Halls & Pricing", show: isAdminRole },
    { id: "availability", label: "Availability", show: isAdminRole },
    { id: "team", label: "Team & Access", show: isAdminRole },
    { id: "forms", label: "Forms & Options", show: isAdminRole },
    { id: "online", label: "Online Presence", show: isAdminRole },
  ].filter(t => t.show);

  // --- Global State ---
  const [settingsId, setSettingsId] = useState(null);
  const [maxHalls, setMaxHalls] = useState(null);
  const [maxUsers, setMaxUsers] = useState(null);

  const [venue, setVenue] = useState({
    name: "", owner: "", location: "", phone: "", email: "", gstin: "",
    bookingPrefix: "BK", receiptPrefix: "PAY", logoUrl: "",
    legalName: "", bankName: "", accountName: "", accountNumber: "", ifscCode: "",
    allowPastDateBooking: false, gstMode: "inclusive",
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [halls, setHalls] = useState(INIT_HALLS);
  const [blackoutDates, setBlackoutDates] = useState([]);
  
  const [eventTypes, setEventTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [places, setPlaces] = useState(["Kannur", "Thalassery", "Iritty", "Kuthuparamba", "Payyanur"]);
  const [reminderDays, setReminderDays] = useState([3, 7]);

  const [galleryItems, setGalleryItems] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

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
      setMaxHalls(data._maxHalls !== undefined ? data._maxHalls : null);
      setMaxUsers(data._maxUsers !== undefined ? data._maxUsers : null);
      setVenue({
        name: data.venueName || "", owner: data.ownerName || "", location: data.location || "",
        phone: data.phone || "", email: data.email || "", gstin: data.gstin || "",
        bookingPrefix: data.bookingPrefix || "BK", receiptPrefix: data.receiptPrefix || "PAY",
        logoUrl: data.logoUrl || "", legalName: data.legalName || "", bankName: data.bankName || "",
        accountName: data.accountName || "", accountNumber: data.accountNumber || "", ifscCode: data.ifscCode || "",
        allowPastDateBooking: data.allowPastDateBooking || false, gstMode: data.gstMode || "inclusive",
      });
      if (data.halls && data.halls.length > 0) setHalls(data.halls);
      if (data.gallery && data.gallery.length > 0) setGalleryItems(data.gallery);
      if (data.blackoutDates) setBlackoutDates(data.blackoutDates);
      if (data.eventTypes) setEventTypes(data.eventTypes);
      if (data.sessions) setSessions(data.sessions);
      if (data.places && data.places.length > 0) setPlaces(data.places);
      if (data.reminderDays && data.reminderDays.length > 0) setReminderDays(data.reminderDays);
      if (data.moduleAccess) setModuleAccess(data.moduleAccess);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  // --- Venue Handlers ---
  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenue(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addToast("Image size must be less than 5MB", "error"); return; }
    const formData = new FormData();
    formData.append("logo", file);
    setIsUploadingLogo(true);
    try {
      const res = await settingsAPI.uploadLogo(formData);
      if (res.data && res.data.url) {
        setVenue(prev => ({ ...prev, logoUrl: res.data.url }));
        addToast("Logo uploaded successfully", "success");
      }
    } catch (err) { addToast("Failed to upload logo", "error"); } 
    finally { setIsUploadingLogo(false); }
  };

  const handleSaveVenue = async () => {
    try {
      await settingsAPI.update({ 
        venueName: venue.name, ownerName: venue.owner, location: venue.location, phone: venue.phone, email: venue.email, 
        gstin: venue.gstin, bookingPrefix: venue.bookingPrefix, receiptPrefix: venue.receiptPrefix,
        logoUrl: venue.logoUrl, legalName: venue.legalName, bankName: venue.bankName, accountName: venue.accountName, accountNumber: venue.accountNumber, ifscCode: venue.ifscCode 
      });
      setVenueInfo({ name: venue.name, subtitle: "Auditorium", owner: venue.owner, logoUrl: venue.logoUrl });
      addToast("Venue settings saved! 🏛️", "success");
    } catch (e) { addToast("Failed to save", "error"); }
  };

  return (
    <div className="hm-settings-container" style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>
            Settings Center
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, margin: 0 }}>
            Manage your venue, bookings, pricing, team and online presence.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      {tabs.length > 0 && (
        <div style={{ 
          display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 24, 
          borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, background: "#f8fafc", zIndex: 10, paddingTop: 10
        }}>
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                style={{
                  padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: isActive ? 700 : 600,
                  border: "none",
                  background: isActive ? "#1B4332" : "transparent",
                  color: isActive ? "#fff" : "#475569",
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.2s ease"
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      <div style={{ minHeight: "50vh" }}>
        {activeTab === "general" && isAdminRole && (
          <GeneralTab 
            venue={venue} handleVenueChange={handleVenueChange} 
            handleLogoUpload={handleLogoUpload} isUploadingLogo={isUploadingLogo} 
            handleSaveVenue={handleSaveVenue} 
          />
        )}
        
        {activeTab === "booking" && isAdminRole && (
          <BookingTab venue={venue} setVenue={setVenue} addToast={addToast} />
        )}
        
        {activeTab === "halls" && isAdminRole && (
          <HallsTab 
            halls={halls} setHalls={setHalls} 
            maxHalls={maxHalls} globalSessions={sessions} addToast={addToast} 
          />
        )}

        {activeTab === "availability" && isAdminRole && (
          <AvailabilityTab 
            blackoutDates={blackoutDates} setBlackoutDates={setBlackoutDates} addToast={addToast} 
          />
        )}

        {activeTab === "team" && isAdminRole && (
          <TeamTab 
            dbUsers={dbUsers} loadUsers={loadUsers} maxUsers={maxUsers} 
            isOwner={isOwner} activeEnvironment={activeEnvironment} 
            moduleAccess={moduleAccess} setModuleAccess={setModuleAccess} addToast={addToast} 
          />
        )}

        {activeTab === "forms" && isAdminRole && (
          <FormsTab 
            eventTypes={eventTypes} setEventTypes={setEventTypes}
            sessions={sessions} setSessions={setSessions}
            places={places} setPlaces={setPlaces}
            reminderDays={reminderDays} setReminderDays={setReminderDays}
            addToast={addToast}
          />
        )}

        {activeTab === "online" && isAdminRole && (
          <OnlinePresenceTab 
            settingsId={settingsId} galleryItems={galleryItems} setGalleryItems={setGalleryItems} addToast={addToast}
          />
        )}

      </div>

      {/* App Info Footer */}
      <div style={{ 
        marginTop: 40, padding: 24, borderRadius: 12, 
        background: "linear-gradient(135deg, #0D2418, #1B4332)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 
      }}>
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
  );
}
