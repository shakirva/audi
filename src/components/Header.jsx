import { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, Monitor, Database, AlertTriangle, MessageSquarePlus, X, User as UserIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
const notifications = [];

const notifIcons = { warning: "⚠️", info: "ℹ️", reminder: "🔔" };

export default function Header({ title, onMenuClick }) {
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();
  const { user, tenant, activeEnvironment, switchEnvironment, role, logout } = useRole();

  const isSandbox = activeEnvironment === "sandbox";
  const canSwitch = tenant?.allowEnvironmentSwitch && (role === "Owner" || role === "SuperAdmin");

  const [showEnvDropdown, setShowEnvDropdown] = useState(false);
  const [showSandboxConfirm, setShowSandboxConfirm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEnterSandbox = () => {
    setShowSandboxConfirm(false);
    setShowEnvDropdown(false);
    switchEnvironment("sandbox");
  };

  return (
    <>
      {isSandbox && role !== "Tester" && (
        <div style={{ background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "8px 24px", fontSize: 13, zIndex: 40, position: "relative", boxShadow: "0 2px 10px rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={16} />
          <div>
            <strong style={{ fontWeight: 800 }}>SANDBOX MODE — Training Environment.</strong>
            <span style={{ marginLeft: 6, opacity: 0.9 }}>Changes here never affect Production.</span>
          </div>
        </div>
      )}
      <header style={{
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 24px",
      position: "sticky",
      top: 0,
      zIndex: 30,
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="hm-hamburger"
        style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, border: "none", background: "#f3f4f6", cursor: "pointer", color: "#6b7280" }}
      >
        <Menu size={20} />
      </button>

      {/* Page Title */}
      <h2 style={{ flex: 1, fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>
        {title}
      </h2>



      {/* Feedback Button */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        style={{
          padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          background: "rgba(212,160,23,0.15)", color: "#a16207", marginRight: 8
        }}
      >
        <MessageSquarePlus size={16} />
        Feedback
      </button>

      {/* Environment Switcher */}
      {canSwitch && (
        <div style={{ position: "relative", marginRight: 8 }}>
          <button
            onClick={() => setShowEnvDropdown(!showEnvDropdown)}
            style={{
              padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #e5e7eb", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              background: "#fff", color: "#111827", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            {isSandbox ? <><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} /> Sandbox</> : <><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} /> Production</>}
            <ChevronDown size={14} style={{ color: "#6b7280" }} />
          </button>
          
          {showEnvDropdown && (
            <div style={{ position: "absolute", top: 40, right: 0, width: 200, background: "#fff", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #f3f4f6", overflow: "hidden", zIndex: 50 }}>
              <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f9fafb" }}>
                Environment
              </div>
              <div style={{ padding: 6 }}>
                {!isSandbox ? (
                  <button onClick={() => setShowSandboxConfirm(true)} style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Database size={14} color="#f59e0b" /> Enter Sandbox
                  </button>
                ) : (
                  <button onClick={() => { setShowEnvDropdown(false); switchEnvironment("production"); }} style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Monitor size={14} color="#10b981" /> Return to Production
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Avatar */}
      <div ref={profileMenuRef} style={{ position: "relative" }}>
        <div onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 8px", borderRadius: 10, background: showProfileMenu ? "#f3f4f6" : "transparent", transition: "all 0.2s" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14,
            boxShadow: "0 2px 8px rgba(27,67,50,0.35)"
          }}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
          <span className="hm-avatar-name" style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{user?.role === "Tester" && user?.name === "Sandbox Auditor" ? "Manager" : user?.name || "User"}</span>
          <ChevronDown size={13} style={{ color: "#9ca3af" }} />
        </div>

        {showProfileMenu && (
          <div style={{ position: "absolute", top: 48, right: 0, width: 220, background: "#fff", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #f3f4f6", overflow: "hidden", zIndex: 50 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{user?.name || "User"}</p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{user?.email || ""}</p>
            </div>
            <div style={{ padding: 6 }}>
              <button 
                onClick={() => { setShowProfileMenu(false); navigate("/profile"); }} 
                style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 10 }} 
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} 
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <UserIcon size={16} /> My Profile
              </button>
              <div style={{ height: 1, background: "#f3f4f6", margin: "4px 0" }} />
              <button 
                onClick={() => { setShowProfileMenu(false); logout(); }} 
                style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }} 
                onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"} 
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>

      {/* Sandbox Confirmation Modal */}
      {showSandboxConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", width: 400, borderRadius: 20, padding: 24, boxShadow: "0 25px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={24} color="#d97706" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0, fontFamily: "'Playfair Display', serif" }}>Enter Sandbox?</h3>
            </div>
            <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.5, marginBottom: 24 }}>
              You are about to enter the Sandbox environment. All bookings created here are for <strong>training purposes only</strong> and will not affect your live Production data.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setShowSandboxConfirm(false)} style={{ padding: "10px 16px", borderRadius: 10, background: "#f3f4f6", color: "#374151", border: "none", fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleEnterSandbox} style={{ padding: "10px 20px", borderRadius: 10, background: "#f59e0b", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}>
                Enter Sandbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", width: 500, borderRadius: 20, padding: 24, boxShadow: "0 25px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>What would you like to improve?</h3>
              <button onClick={() => setShowFeedbackModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 16 }}>Your feedback helps us shape the next phase of Venueza ERP.</p>
            <textarea
              placeholder="Describe your ideas, workflows, or requested features here..."
              style={{ width: "100%", height: 120, padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 14, resize: "none", marginBottom: 16, fontFamily: "inherit" }}
            />
            <button onClick={() => setShowFeedbackModal(false)} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "#1B4332", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(27,67,50,0.2)" }}>
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </>
  );
}
