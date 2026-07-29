import { useState } from "react";
import { Eye, EyeOff, LogIn, ShieldAlert, Mail } from "lucide-react";
import { useRole } from "../context/RoleContext";
import Logo from "../components/Logo";

export default function Login() {
  const { login } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const accentColor = "#D4A017";

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }
    setLoading(true);
    
    let tenantSlug = window.location.pathname.replace(/^\/([^/]+).*/, "$1");
    if (!tenantSlug || tenantSlug === "login" || tenantSlug === "dashboard") tenantSlug = null;

    const result = await login(email.trim(), password, tenantSlug);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
    }
    // if ok, App.jsx re-renders to show dashboard
  };

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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Logo size={64} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
            Venueza
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
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 6px", textAlign: "center" }}>
            Sign In
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 24px", textAlign: "center" }}>
            Enter your credentials to access the dashboard
          </p>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <Mail size={11} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="owner@venueza.com"
              autoComplete="email"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: `1.5px solid ${error ? "#C0392B" : "rgba(255,255,255,0.15)"}`,
                background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14,
                outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = accentColor; }}
              onBlur={e => { if (!error) e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Enter password..."
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "12px 44px 12px 14px", borderRadius: 12,
                  border: `1.5px solid ${error ? "#C0392B" : "rgba(255,255,255,0.15)"}`,
                  background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14,
                  outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = accentColor; }}
                onBlur={e => { if (!error) e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
              />
              <button
                onClick={() => setShowPass(v => !v)}
                type="button"
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

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading
                ? "rgba(212,160,23,0.3)"
                : "linear-gradient(135deg, #D4A017, #e8b820)",
              color: "#0D2418",
              fontSize: 14, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(212,160,23,0.3)",
              transition: "all 0.15s",
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #0D2418", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Signing in...
              </>
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>

        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 20 }}>
          © 2026 Venueza SaaS
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
