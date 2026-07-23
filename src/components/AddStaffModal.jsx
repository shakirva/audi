import React, { useState } from "react";
import { X, User, Mail, Phone, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";

const ROLES_INFO = [
  { value: "Manager", label: "Manager", desc: "Full access to bookings, reports & settings", color: "#D4A017", bg: "#fffbeb" },
  { value: "Sales", label: "Sales", desc: "Manage enquiries and convert to bookings", color: "#2563eb", bg: "#eff6ff" },
  { value: "Reception", label: "Reception", desc: "View and create bookings only", color: "#7c3aed", bg: "#f5f3ff" },
  { value: "Accounts", label: "Accounts", desc: "Access to finance and payment records", color: "#15803d", bg: "#f0faf4" },
  { value: "Operations", label: "Operations", desc: "Manage operations and job schedules", color: "#ea580c", bg: "#fff7ed" },
  { value: "Staff", label: "Staff", desc: "Basic access — view only", color: "#6b7280", bg: "#f9fafb" },
];

const iStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1.5px solid #e5e7eb", fontSize: 13, color: "#374151",
  background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", transition: "border-color 0.15s",
};

const labelSt = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 6,
};

export default function AddStaffModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "Staff" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Name, Email and Password are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await onSave(form);
      setForm({ name: "", email: "", phone: "", password: "", role: "Staff" });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create user. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES_INFO.find(r => r.value === form.role);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 25px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: 520, overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #4c1d95, #7c3aed)", padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>Add New Staff</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>Create a user account with role-based access</p>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Name & Phone row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelSt}><User size={10} style={{ display: "inline", marginRight: 4 }} />Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Rajan P.K." style={iStyle}
                  onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label style={labelSt}><Phone size={10} style={{ display: "inline", marginRight: 4 }} />Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 9876543210" style={iStyle}
                  onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelSt}><Mail size={10} style={{ display: "inline", marginRight: 4 }} />Email Address *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. rajan@laural.com" style={iStyle}
                onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>

            {/* Password */}
            <div>
              <label style={labelSt}><Lock size={10} style={{ display: "inline", marginRight: 4 }} />Password *</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters" style={{ ...iStyle, paddingRight: 42 }}
                  onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label style={labelSt}><ShieldCheck size={10} style={{ display: "inline", marginRight: 4 }} />Access Role *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ROLES_INFO.map(r => (
                  <div key={r.value} onClick={() => setForm(prev => ({ ...prev, role: r.value }))}
                    style={{
                      padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${form.role === r.value ? r.color : "#e5e7eb"}`,
                      background: form.role === r.value ? r.bg : "#fff",
                      transition: "all 0.15s"
                    }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: form.role === r.value ? r.color : "#374151" }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Role description */}
            {selectedRole && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: selectedRole.bg, border: `1px solid ${selectedRole.color}30`, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={14} color={selectedRole.color} />
                <span style={{ fontSize: 12, color: selectedRole.color, fontWeight: 600 }}>{selectedRole.label}: {selectedRole.desc}</span>
              </div>
            )}

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12, color: "#dc2626", fontWeight: 500 }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          <div style={{ padding: "16px 24px", borderTop: "1px solid #eaeaea", background: "#f9fafb", display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "12px 24px", borderRadius: 10, background: "#fff", border: "1.5px solid #e5e7eb", fontWeight: 700, color: "#374151", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: "12px 28px", borderRadius: 10, background: loading ? "#9ca3af" : "linear-gradient(135deg, #4c1d95, #7c3aed)", border: "none", fontWeight: 700, color: "#fff", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.25)" }}>
              {loading ? "Creating..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
