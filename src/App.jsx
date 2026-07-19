import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import CommandPalette from "./components/CommandPalette";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Calendar from "./pages/Calendar";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import HallReports from "./pages/HallReports";
import SalesReports from "./pages/SalesReports";
import BookingReports from "./pages/BookingReports";
import AccountsReports from "./pages/AccountsReports";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Expenses from "./pages/Expenses";
import PublicBooking from "./pages/PublicBooking";
import Login from "./pages/Login";
import SuperAdminTenants from "./pages/SuperAdminTenants";
import CRM from "./pages/CRM";
import Agreements from "./pages/Agreements";
import Jobs from "./pages/Jobs";
import Masters from "./pages/Masters";
import Roadmap from "./pages/Roadmap";
import Vendors from "./pages/Vendors";
import Purchases from "./pages/Purchases";
import Staff from "./pages/Staff";
import AccountsLite from "./pages/AccountsLite";
import { BookingsProvider } from "./context/BookingsContext";
import { RoleProvider, useRole } from "./context/RoleContext";
import { usePWA } from "./hooks/usePWA";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import OfflineBanner from "./components/OfflineBanner";

const pageTitles = {
  "/": "Dashboard",
  "/bookings": "Bookings",
  "/calendar": "Calendar",
  "/customers": "Customers",
  "/payments": "Payments",
  "/reports": "Reports",
  "/expenses": "Expenses",
  "/settings": "Settings",
  "/notifications": "Notifications",
  "/crm": "CRM (Pipeline)",
  "/agreements": "Agreements",
  "/jobs": "Job Management",
  "/masters": "Master Settings",
  "/roadmap": "ERP Roadmap",
  "/vendors": "Vendor Management",
  "/purchases": "Purchase Orders",
  "/staff": "Staff & HR",
  "/accounts": "Accounts Lite",
};

// Guard: redirects to dashboard if current role lacks permission
function ProtectedRoute({ permission, children }) {
  const { can } = useRole();
  return can(permission) ? children : <Navigate to="/" replace />;
}

function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = pageTitles[location.pathname] || "Venueza";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4EF", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="hm-main-content" style={{ flex: 1, overflowY: "auto" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/payments"  element={<ProtectedRoute permission="canViewPayments"><Payments /></ProtectedRoute>} />
            <Route path="/reports"   element={<ProtectedRoute permission="canViewReports"><Reports /></ProtectedRoute>} />
            <Route path="/reports/sales"   element={<ProtectedRoute permission="canViewReports"><SalesReports /></ProtectedRoute>} />
            <Route path="/reports/booking"   element={<ProtectedRoute permission="canViewReports"><BookingReports /></ProtectedRoute>} />
            <Route path="/reports/accounts"   element={<ProtectedRoute permission="canViewReports"><AccountsReports /></ProtectedRoute>} />
            <Route path="/reports/hall"   element={<ProtectedRoute permission="canViewReports"><HallReports /></ProtectedRoute>} />
            <Route path="/expenses"  element={<ProtectedRoute permission="canViewReports"><Expenses /></ProtectedRoute>} />
            <Route path="/settings"  element={<ProtectedRoute permission="canViewSettings"><Settings /></ProtectedRoute>} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/superadmin/tenants" element={<ProtectedRoute permission="canManageTenants"><SuperAdminTenants /></ProtectedRoute>} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/agreements" element={<Agreements />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/masters" element={<ProtectedRoute permission="canViewSettings"><Masters /></ProtectedRoute>} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/accounts" element={<AccountsLite />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

// Gate: shows Login if not authenticated, otherwise shows the admin shell
function AppGate() {
  const { isLoggedIn } = useRole();
  if (!isLoggedIn) return <Login />;
  return (
    <Routes>
      <Route path="/book/:slug" element={<PublicBooking />} />
      <Route path="/*" element={<AdminLayout />} />
    </Routes>
  );
}



export default function App() {
  const { isOnline, isInstallable, hasUpdate, installApp, applyUpdate, dismissUpdate } = usePWA();

  return (
    <>
      {!isOnline && <OfflineBanner />}
      {isInstallable && <PWAInstallPrompt onInstall={installApp} onDismiss={() => {}} />}
      {hasUpdate && <PWAUpdatePrompt onUpdate={applyUpdate} onDismiss={dismissUpdate} />}
      
      <RoleProvider>
        <BookingsProvider>
          <CommandPalette />
          <Routes>
            <Route path="/book/:slug" element={<PublicBooking />} />
            {/* Main app */}
            <Route path="/*" element={<AppGate />} />
          </Routes>
        </BookingsProvider>
      </RoleProvider>
    </>
  );
}
