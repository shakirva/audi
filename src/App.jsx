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
import PaymentsAndReceipts from "./pages/Finance/PaymentsAndReceipts";
import BookingAccounts from "./pages/Finance/BookingAccounts";
import BookingFinancialDashboard from "./pages/Finance/BookingFinancialDashboard";
import Collections from "./pages/Finance/Collections";
import PurchasesAndExpenses from "./pages/Finance/PurchasesAndExpenses";
import FinanceReports from "./pages/Finance/FinanceReports";
import AdvancedAccounting from "./pages/Finance/AdvancedAccounting";
import Reports from "./pages/Reports";
import HallReports from "./pages/HallReports";
import AccountsReports from "./pages/AccountsReports";
import SalesReports from "./pages/SalesReports";
import BookingReports from "./pages/BookingReports";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import PublicBooking from "./pages/PublicBooking";
import Login from "./pages/Login";
import SuperAdminTenants from "./pages/SuperAdminTenants";
import CRM from "./pages/CRM";
import Agreements from "./pages/Agreements";
import Jobs from "./pages/Jobs";
import Masters from "./pages/Masters";
import Staff from "./pages/Staff";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import LeaveRequests from "./pages/LeaveRequests";
import Vendors from "./pages/Vendors";
import Subscriptions from "./pages/Subscriptions";
import Feedback from "./pages/Feedback";
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
  "/finance/payments": "Payments & Receipts",
  "/finance/booking-accounts": "Booking Accounts",
  "/finance/collections": "Collections",
  "/finance/expenses": "Purchases & Expenses",
  "/finance/reports": "Finance Reports",
  "/finance/advanced": "Advanced Accounting",
};

// Guard: redirects to dashboard if current role lacks permission
function ProtectedRoute({ permission, children }) {
  const { can, role, moduleAccess } = useRole();
  const location = useLocation();

  if (role === "SuperAdmin" || role === "Owner") {
    return can(permission) ? children : <Navigate to="/" replace />;
  }

  const customAccess = moduleAccess?.[role];
  if (customAccess) {
    const hasAccess = customAccess.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));
    if (hasAccess) return children;
    return <Navigate to="/" replace />;
  }

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
            <Route path="/finance/payments"  element={<ProtectedRoute permission="canViewPayments"><PaymentsAndReceipts /></ProtectedRoute>} />
            <Route path="/finance/booking-accounts" element={<ProtectedRoute permission="canViewPayments"><BookingAccounts /></ProtectedRoute>} />
            <Route path="/finance/booking-accounts/:id" element={<ProtectedRoute permission="canViewPayments"><BookingFinancialDashboard /></ProtectedRoute>} />
            <Route path="/finance/collections" element={<ProtectedRoute permission="canViewPayments"><Collections /></ProtectedRoute>} />
            <Route path="/finance/expenses" element={<ProtectedRoute permission="canViewPayments"><PurchasesAndExpenses /></ProtectedRoute>} />
            <Route path="/finance/reports" element={<ProtectedRoute permission="canViewReports"><FinanceReports /></ProtectedRoute>} />
            <Route path="/finance/advanced" element={<ProtectedRoute permission="canViewReports"><AdvancedAccounting /></ProtectedRoute>} />
            
            {/* Keeping non-finance routes below */}
            <Route path="/reports"         element={<ProtectedRoute permission="canViewReports"><Reports /></ProtectedRoute>} />
            <Route path="/reports/sales"   element={<ProtectedRoute permission="canViewReports"><SalesReports /></ProtectedRoute>} />
            <Route path="/reports/booking" element={<ProtectedRoute permission="canViewReports"><BookingReports /></ProtectedRoute>} />
            <Route path="/reports/hall"    element={<ProtectedRoute permission="canViewReports"><HallReports /></ProtectedRoute>} />
            <Route path="/reports/accounts" element={<ProtectedRoute permission="canViewReports"><AccountsReports /></ProtectedRoute>} />
            <Route path="/settings"  element={<ProtectedRoute permission="canViewSettings"><Settings /></ProtectedRoute>} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/tenants" element={<SuperAdminTenants />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/agreements" element={<Agreements />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/masters" element={<ProtectedRoute permission="canViewSettings"><Masters /></ProtectedRoute>} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leaves" element={<LeaveRequests />} />
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
