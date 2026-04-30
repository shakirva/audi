// Permission matrix — keep in a separate file to satisfy Fast Refresh rules

// Roles: "Owner" | "Manager"  (Staff has no dashboard)
export const ROLES = ["Owner", "Manager", "Staff"];

// Hardcoded demo credentials (Owner & Manager only)
export const CREDENTIALS = {
  Owner:   "owner123",
  Manager: "manager123",
};

export const ROLE_COLORS = {
  Owner:   { bg: "#fef3c7", text: "#92400e", dot: "#D4A017" },
  Manager: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  Staff:   { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" },
};

export const PERMISSIONS = {
  Owner: {
    canViewRevenue:   true,
    canViewPayments:  true,
    canViewReports:   true,
    canViewSettings:  true,
    canAddBooking:    true,
    canEditBooking:   true,
    canDeleteBooking: true,
  },
  Manager: {
    canViewRevenue:   true,   // overridden dynamically by owner toggle
    canViewPayments:  true,   // overridden dynamically by owner toggle
    canViewReports:   true,   // overridden dynamically by owner toggle
    canViewSettings:  true,   // Manager has their own limited settings view
    canAddBooking:    true,
    canEditBooking:   true,
    canDeleteBooking: false,
  },
  Staff: {
    canViewRevenue:   false,
    canViewPayments:  false,
    canViewReports:   false,
    canViewSettings:  false,
    canAddBooking:    false,
    canEditBooking:   false,
    canDeleteBooking: false,
  },
};
