import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { PERMISSIONS } from "./rolePermissions";

const RoleContext = createContext(null);

// ─── Helpers ────────────────────────────────────────────────
// Reserved route names that are NOT tenant slugs
const RESERVED_ROUTES = [
  "book", "dashboard", "bookings", "calendar", "customers", "finance",
  "reports", "settings", "notifications", "tenants", "subscriptions",
  "crm", "agreements", "jobs", "vendors", "masters", "roadmap", "staff",
  "profile", "attendance", "leaves", "login"
];

/** Extract the tenant slug from the current browser URL. Returns null if on root or a reserved route. */
function getUrlSlug() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length > 0 && !RESERVED_ROUTES.includes(parts[0])) {
    return parts[0];
  }
  return null;
}

/** Clear all auth data from browser storage */
function clearAuthStorage() {
  localStorage.removeItem("hm_token");
  localStorage.removeItem("hm_user");
  localStorage.removeItem("hm_tenant");
  localStorage.removeItem("hm_venue");
  localStorage.removeItem("hm_logged_in");
  localStorage.removeItem("hm_role");
  sessionStorage.removeItem("hm_environment");
}

// ─── Provider ───────────────────────────────────────────────
export function RoleProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("hm_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [tenant, setTenant] = useState(() => {
    try {
      const stored = localStorage.getItem("hm_tenant");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [venueInfo, setVenueInfoState] = useState(() => {
    try {
      const stored = localStorage.getItem("hm_venue");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [activeEnvironment, setActiveEnvironmentState] = useState(() => {
    return sessionStorage.getItem("hm_environment") || "production";
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("hm_token"));

  const role = user?.role || "Owner";

  // Owner-controlled toggle: can Manager see revenue/payments/reports?
  const [managerRevenueEnabled, setManagerRevenueEnabledState] = useState(
    () => localStorage.getItem("hm_mgr_revenue") !== "false"
  );

  // ─── Token verification on mount ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("hm_token");
    if (!token) return;

    const urlSlug = getUrlSlug();
    const cachedTenant = tenant;

    // CRITICAL CHECK: If we're on a tenant URL but the cached token belongs
    // to a DIFFERENT tenant, clear everything and force re-login.
    if (urlSlug && cachedTenant?.slug && cachedTenant.slug !== urlSlug) {
      clearAuthStorage();
      setUser(null);
      setTenant(null);
      setVenueInfoState(null);
      setIsLoggedIn(false);
      return;
    }

    if (!user) {
      authAPI.getMe()
        .then((response) => {
          // V1 API wraps response in .data
          const payload = response.data?.success ? response.data.data : response.data;
          
          // SECOND CHECK: verify server-returned tenant matches URL
          if (urlSlug && payload.tenant?.slug && payload.tenant.slug !== urlSlug) {
            clearAuthStorage();
            setUser(null);
            setTenant(null);
            setIsLoggedIn(false);
            return;
          }

          setUser(payload.user);
          setTenant(payload.tenant);
          localStorage.setItem("hm_user", JSON.stringify(payload.user));
          if (payload.tenant) {
            localStorage.setItem("hm_tenant", JSON.stringify(payload.tenant));
            // Redirect non-SuperAdmin users to their slug URL if needed
            if (payload.user.role !== "SuperAdmin" && payload.tenant.slug) {
              const expectedPrefix = `/${payload.tenant.slug}`;
              if (!window.location.pathname.startsWith(expectedPrefix)) {
                window.location.href = `${expectedPrefix}/dashboard`;
              }
            }
          }
        })
        .catch(() => {
          clearAuthStorage();
          setIsLoggedIn(false);
        });
    }
  }, []);

  // ─── Login ────────────────────────────────────────────────
  const login = async (email, password, tenantSlug) => {
    try {
      const response = await authAPI.login(email, password, tenantSlug);
      // V1 API wraps response in .data
      const payload = response.data?.success ? response.data.data : response.data;

      localStorage.setItem("hm_token", payload.token);
      localStorage.setItem("hm_user", JSON.stringify(payload.user));
      if (payload.tenant) localStorage.setItem("hm_tenant", JSON.stringify(payload.tenant));
      const defaultEnv = payload.user.role === "Tester" ? "sandbox" : "production";
      sessionStorage.setItem("hm_environment", defaultEnv);

      // Redirect non-SuperAdmin to their tenant slug URL
      if (payload.tenant && payload.user.role !== "SuperAdmin" && payload.tenant.slug) {
        const expectedPrefix = `/${payload.tenant.slug}`;
        if (!window.location.pathname.startsWith(expectedPrefix)) {
          window.location.href = `${expectedPrefix}/dashboard`;
          return { ok: true };
        }
      }

      setUser(payload.user);
      setTenant(payload.tenant);
      setActiveEnvironmentState(defaultEnv);
      setIsLoggedIn(true);
      return { ok: true, user: payload.user };
    } catch (err) {
      console.error("Login Error:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Login failed";
      return { ok: false, error: msg };
    }
  };

  // ─── Other helpers ────────────────────────────────────────
  const setVenueInfo = (info) => {
    setVenueInfoState(info);
    localStorage.setItem("hm_venue", JSON.stringify(info));
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setTenant(null);
    setVenueInfoState(null);
    setActiveEnvironmentState("production");
    setIsLoggedIn(false);

    // Try to clear PWA caches in the background (non-blocking)
    try {
      if ("caches" in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
      }
    } catch (e) {
      // Ignore — logout already happened
    }
  };

  const switchEnvironment = (env) => {
    sessionStorage.setItem("hm_environment", env);
    setActiveEnvironmentState(env);
    // Reload page to reset all queries and state safely
    window.location.reload();
  };

  const setManagerRevenueEnabled = (val) => {
    localStorage.setItem("hm_mgr_revenue", val ? "true" : "false");
    setManagerRevenueEnabledState(val);
  };

  const can = (permission) => {
    if (role === "Manager" && !managerRevenueEnabled) {
      if (["canViewRevenue", "canViewPayments", "canViewReports"].includes(permission)) {
        return false;
      }
    }
    return PERMISSIONS[role]?.[permission] ?? false;
  };

  return (
    <RoleContext.Provider value={{
      role,
      user,
      tenant,
      venueInfo,
      setVenueInfo,
      isLoggedIn,
      activeEnvironment,
      switchEnvironment,
      login,
      logout,
      can,
      managerRevenueEnabled,
      setManagerRevenueEnabled,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
