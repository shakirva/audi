import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, ShieldCheck } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { usersAPI } from "../services/api";
import { useToast } from "../components/Toast";

const iStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid #e5e7eb", fontSize: 13, color: "#111827",
  background: "#f9fafb", outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", transition: "all 0.2s"
};
const labelSt = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.05em",
  display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
};
const cardSt = {
  background: "#fff", borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.03)", padding: 24, marginBottom: 20,
};

export default function Profile() {
  const { user, login, setUser } = useRole();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "" // password field is blank by default
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const dataToUpdate = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };
      if (formData.password.trim() !== "") {
        dataToUpdate.password = formData.password;
      }
      
      const res = await usersAPI.update(user.id, dataToUpdate);
      addToast("Profile updated successfully! ✅", "success");
      
      // Update local storage / context user by re-fetching or manually updating
      const updatedUser = { ...user, ...dataToUpdate };
      localStorage.setItem("hm_user", JSON.stringify(updatedUser));
      
      // Update global context state (no page reload needed)
      setUser(updatedUser);

    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 800, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: 20, 
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)", 
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 800, boxShadow: "0 8px 24px rgba(27,67,50,0.2)"
        }}>
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>
            My Profile
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>
            Manage your personal information and security.
          </p>
        </div>
      </div>

      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={18} color="#1B4332" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0 }}>Account Details</h3>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Current Role: <strong style={{ color: "#1B4332" }}>{user?.role}</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label style={labelSt}><User size={14} /> Full Name</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              style={iStyle}
              onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#1B4332"; }}
              onBlur={e => { e.target.style.background = "#f9fafb"; e.target.style.borderColor = "#e5e7eb"; }}
            />
          </div>
          
          <div>
            <label style={labelSt}><Mail size={14} /> Email Address</label>
            <input 
              type="email"
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              style={iStyle}
              onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#1B4332"; }}
              onBlur={e => { e.target.style.background = "#f9fafb"; e.target.style.borderColor = "#e5e7eb"; }}
            />
          </div>

          <div>
            <label style={labelSt}><Phone size={14} /> Phone Number</label>
            <input 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              style={iStyle}
              placeholder="e.g. +91 9876543210"
              onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#1B4332"; }}
              onBlur={e => { e.target.style.background = "#f9fafb"; e.target.style.borderColor = "#e5e7eb"; }}
            />
          </div>

          <div>
            <label style={labelSt}><Lock size={14} /> Change Password</label>
            <input 
              type="password"
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              style={iStyle}
              placeholder="Leave blank to keep current"
              onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#1B4332"; }}
              onBlur={e => { e.target.style.background = "#f9fafb"; e.target.style.borderColor = "#e5e7eb"; }}
            />
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={handleSave} 
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 12, border: "none",
              background: "#1B4332", color: "#fff", fontSize: 14, fontWeight: 700, 
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(27,67,50,0.2)",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s"
            }}
          >
            <Save size={16} /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
