import { useState } from "react";
import { Building2, Eye, EyeOff, LogIn, ShieldAlert } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { ROLE_COLORS } from "../context/rolePermissions";

const ROLE_INFO = {
  Owner: {
    emoji: "👑",
    name: "Rajan P.K.",
    subtitle: "Full access — venue, revenue, team & all settings",
    hint: "owner123",
  },
  Manager: {
    emoji: "🧑‍💼",
    name: "Suresh Kumar",
    subtitle: "Bookings, calendar, customers & settings",
    hint: "manager123",
  },
};

export default function Login() {
  const { login } = useRole();
  const [selectedRole, setSelectedRole] = useState("Owner");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError("");
    if (!password.trim()) { setError("Please enter your password."); return; }
    setLoading(true);
    setTimeout(() => {
      const result = login(selectedRole, password);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
      }
      // if ok, App.jsx re-renders to show dashboard
    }, 400);
  };

  const rc = ROLE_COLORS[selectedRole];
  const info = ROLE_INFO[selectedRole];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(145deg, #071510 0%, #0D2418 50%, #0a1e12 100%)",
      fontFamily: "'DM Sans', sans-serif", padding: 20,
    }}>

      {/* Background decoration */}
      <div style={{ position: "fixed", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(27,67,50,0.6) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "linear-gradient(135deg, #D4A017, #f0c040)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 30px rgba(212,160,23,0.35)", marginBottom: 16,
          }}>
            <Building2 size={30} color="#0D2418" />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
            HallMaster
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
            Auditorium Management System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24, padding: 32, backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 20px", textAlign: "center" }}>
            Sign in to your dashboard
          </h2>

          {/* Role selector */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Select Role</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["Owner", "Manager"].map(r => {
                const c = ROLE_COLORS[r];
                const ri = ROLE_INFO[r];
                const active = selectedRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => { setSelectedRole(r); setPassword(""); setError(""); }}
                    style={{
                      padding: "14px 12px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                      border: `2px solid ${active ? c.dot : "rgba(255,255,255,0.1)"}`,
                      background: active ? `rgba(${r === "Owner" ? "212,160,23" : "59,130,246"},0.12)` : "rgba(255,255,255,0.03)",
                      transition: "all 0.18s",
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 5 }}>{ri.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? c.dot : "rgba(255,255,255,0.6)" }}>{r}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2, lineHeight: 1.4 }}>{ri.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected role info */}
          <div style={{
            background: `rgba(${selectedRole === "Owner" ? "212,160,23" : "59,130,246"},0.08)`,
            border: `1px solid ${rc.dot}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ fontSize: 20 }}>{info.emoji}</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: rc.dot, margin: 0 }}>{info.name} · {selectedRole}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0", lineHeight: 1.4 }}>{info.subtitle}</p>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Enter password..."
                style={{
                  width: "100%", padding: "12px 44px 12px 14px", borderRadius: 12,
                  border: `1.5px solid ${error ? "#C0392B" : "rgba(255,255,255,0.15)"}`,
                  background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14,
                  outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = rc.dot; }}
                onBlur={e => { if (!error) e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
              />
              <button
                onClick={() => setShowPass(v => !v)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p style={{ fontSize: 12, color: "#ff7b6b", marginTop: 7, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <ShieldAlert size={13} /> {error}
              </p>
            )}
          </div>

          {/* Demo hint */}
          <div style={{ background: "rgba(212,160,23,0.07)", border: "1px dashed rgba(212,160,23,0.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: "rgba(212,160,23,0.7)", margin: 0 }}>
              🔑 <strong>Demo password:</strong> <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>{info.hint}</code>
            </p>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none", cursor: loading ? "wait" : "pointer",
              background: loading ? "rgba(212,160,23,0.5)" : "linear-gradient(135deg, #D4A017, #e8b820)",
              color: "#0D2418", fontSize: 14, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(212,160,23,0.3)", transition: "all 0.15s",
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #0D2418", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Signing in...
              </>
            ) : (
              <><LogIn size={16} /> Sign In as {selectedRole}</>
            )}
          </button>
        </div>

        {/* Staff note */}
        <div style={{ marginTop: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <ShieldAlert size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 0 3px" }}>Staff members</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0, lineHeight: 1.5 }}>
              Staff do not have dashboard access. Contact your Owner or Manager for assistance.
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 20 }}>
          © 2026 HallMaster SaaS · Sreelakshmi Convention Centre
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
