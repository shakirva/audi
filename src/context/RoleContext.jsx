import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { PERMISSIONS } from "./rolePermissions";

const RoleContext = createContext(null);

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

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem("hm_token");
    if (token && !user) {
      authAPI.getMe()
        .then(({ data }) => {
          setUser(data.user);
          setTenant(data.tenant);
          localStorage.setItem("hm_user", JSON.stringify(data.user));
          if (data.tenant) {
            localStorage.setItem("hm_tenant", JSON.stringify(data.tenant));
            const expectedPrefix = `/${data.tenant.slug}`;
            if (!window.location.pathname.startsWith(expectedPrefix)) {
              window.location.href = `${expectedPrefix}/dashboard`;
            }
          }
        })
        .catch(() => {
          // Token invalid — clear and stay logged out
          localStorage.removeItem("hm_token");
          localStorage.removeItem("hm_user");
          localStorage.removeItem("hm_tenant");
          setIsLoggedIn(false);
        });
    }
  }, []);

  const login = async (email, password, tenantSlug) => {
    try {
      const { data } = await authAPI.login(email, password, tenantSlug);
      localStorage.setItem("hm_token", data.token);
      localStorage.setItem("hm_user", JSON.stringify(data.user));
      if (data.tenant) localStorage.setItem("hm_tenant", JSON.stringify(data.tenant));
      const defaultEnv = data.user.role === "Tester" ? "sandbox" : "production";
      sessionStorage.setItem("hm_environment", defaultEnv);
      
      if (data.tenant) {
        const expectedPrefix = `/${data.tenant.slug}`;
        if (!window.location.pathname.startsWith(expectedPrefix)) {
          window.location.href = `${expectedPrefix}/dashboard`;
          return { ok: true };
        }
      }

      setUser(data.user);
      setTenant(data.tenant);
      setActiveEnvironmentState(defaultEnv);
      setIsLoggedIn(true);
      return { ok: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed";
      return { ok: false, error: msg };
    }
  };

  const setVenueInfo = (info) => {
    setVenueInfoState(info);
    localStorage.setItem("hm_venue", JSON.stringify(info));
  };

  const logout = () => {
    // Immediately clear all auth data
    localStorage.removeItem("hm_token");
    localStorage.removeItem("hm_user");
    localStorage.removeItem("hm_tenant");
    localStorage.removeItem("hm_venue");
    sessionStorage.removeItem("hm_environment");
    localStorage.removeItem("hm_logged_in");
    localStorage.removeItem("hm_role");
    
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
