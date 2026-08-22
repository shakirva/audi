// Permission matrix — keep in a separate file to satisfy Fast Refresh rules

// Roles: "Owner" | "Manager"  (Staff has no dashboard)
export const ROLES = ["SuperAdmin", "Admin", "Owner", "Manager", "Sales", "Reception", "Accounts", "Operations", "Staff", "Tester"];

// Hardcoded demo credentials (Owner & Manager only)
export const CREDENTIALS = {
  Owner:   "owner123",
  Manager: "manager123",
};

export const ROLE_COLORS = {
  SuperAdmin: { bg: "#fce7f3", text: "#9d174d", dot: "#ec4899" },
  Admin:      { bg: "#fce7f3", text: "#9d174d", dot: "#ec4899" },
  Owner:      { bg: "#fef3c7", text: "#92400e", dot: "#D4A017" },
  Manager:    { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  Sales:      { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  Reception:  { bg: "#f3e8ff", text: "#7e22ce", dot: "#a855f7" },
  Accounts:   { bg: "#ffedd5", text: "#c2410c", dot: "#f97316" },
  Operations: { bg: "#e0e7ff", text: "#4338ca", dot: "#6366f1" },
  Staff:      { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" },
  Tester:     { bg: "#f3e8ff", text: "#7e22ce", dot: "#a855f7" },
};

export const PERMISSIONS = {
  SuperAdmin: {
    canViewRevenue:   true,
    canViewPayments:  true,
    canViewReports:   true,
    canViewSettings:  true,
    canAddBooking:    true,
    canEditBooking:   true,
    canDeleteBooking: true,
    canManageTenants: true,
  },
  Admin: {
    canViewRevenue:   true,
    canViewPayments:  true,
    canViewReports:   true,
    canViewSettings:  true,
    canAddBooking:    true,
    canEditBooking:   true,
    canDeleteBooking: true,
    canManageTenants: false,
  },
  Owner: {
    canViewRevenue:   true,
    canViewPayments:  true,
    canViewReports:   true,
    canViewSettings:  true,
    canAddBooking:    true,
    canEditBooking:   true,
    canDeleteBooking: true,
    canManageTenants: false,
  },
  Manager: {
    canViewRevenue:   true,   // overridden dynamically by owner toggle
    canViewPayments:  true,   // overridden dynamically by owner toggle
    canViewReports:   true,   // overridden dynamically by owner toggle
    canViewSettings:  true,   
    canAddBooking:    true,
    canEditBooking:   true,
    canDeleteBooking: false,
    canManageTenants: false,
  },
  Sales: {
    canViewRevenue:   false,
    canViewPayments:  false,
    canViewReports:   false,
    canViewSettings:  false,
    canAddBooking:    true,
    canEditBooking:   true,
    canDeleteBooking: false,
    canManageTenants: false,
  },
  Reception: {
    canViewRevenue:   false,
    canViewPayments:  false,
    canViewReports:   false,
    canViewSettings:  false,
    canAddBooking:    true,
    canEditBooking:   false,
    canDeleteBooking: false,
    canManageTenants: false,
  },
  Accounts: {
    canViewRevenue:   true,
    canViewPayments:  true,
    canViewReports:   true,
    canViewSettings:  false,
    canAddBooking:    false,
    canEditBooking:   false,
    canDeleteBooking: false,
    canManageTenants: false,
  },
  Operations: {
    canViewRevenue:   false,
    canViewPayments:  false,
    canViewReports:   false,
    canViewSettings:  false,
    canAddBooking:    false,
    canEditBooking:   false,
    canDeleteBooking: false,
    canManageTenants: false,
  },
  Staff: {
    canViewRevenue:   false,
    canViewPayments:  false,
    canViewReports:   false,
    canViewSettings:  false,
    canAddBooking:    false,
    canEditBooking:   false,
    canDeleteBooking: false,
    canManageTenants: false,
  },
  Tester: {
    canViewRevenue:   true,
    canViewPayments:  true,
    canViewReports:   true,
    canViewSettings:  true,
    canAddBooking:    true,
    canEditBooking:   true,
    canDeleteBooking: true,
    canManageTenants: false,
  },
};
