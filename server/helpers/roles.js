/**
 * Role constants for Venueza ERP.
 * 
 * Single source of truth for all role names and permissions.
 * Used by middleware, validators, and frontend.
 * 
 * IMPORTANT: Existing roles (SuperAdmin, Owner, Manager, Staff, Tester) 
 * remain unchanged. New roles are additive only.
 */

const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  OWNER: "Owner",
  MANAGER: "Manager",
  SALES: "Sales",
  RECEPTION: "Reception",
  ACCOUNTS: "Accounts",
  OPERATIONS: "Operations",
  COORDINATOR: "Coordinator",
  SECURITY: "Security",
  TECHNICIAN: "Technician",
  CLEANER: "Cleaner",
  STAFF: "Staff",
  TESTER: "Tester",
};

// All valid role values
const ALL_ROLES = Object.values(ROLES);

// Roles that can access sandbox environment
const SANDBOX_ROLES = [ROLES.OWNER, ROLES.SUPER_ADMIN, ROLES.TESTER];

// Roles with management privileges (can create/update/delete critical data)
const MANAGEMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER];

// Roles that can view financial data
const FINANCIAL_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTS];

// Roles that can manage bookings
const BOOKING_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.SALES, ROLES.RECEPTION, ROLES.TESTER];

// Roles that can manage staff assignments
const STAFF_ASSIGNMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER];

// Role hierarchy (higher index = higher privilege)
const ROLE_HIERARCHY = [
  ROLES.CLEANER,
  ROLES.TECHNICIAN,
  ROLES.SECURITY,
  ROLES.STAFF,
  ROLES.COORDINATOR,
  ROLES.OPERATIONS,
  ROLES.RECEPTION,
  ROLES.SALES,
  ROLES.ACCOUNTS,
  ROLES.MANAGER,
  ROLES.OWNER,
  ROLES.SUPER_ADMIN,
];

/**
 * Check if a role has at least the given privilege level.
 */
function hasMinimumRole(userRole, minimumRole) {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const minLevel = ROLE_HIERARCHY.indexOf(minimumRole);
  if (userLevel === -1 || minLevel === -1) return false;
  return userLevel >= minLevel;
}

module.exports = {
  ROLES,
  ALL_ROLES,
  SANDBOX_ROLES,
  MANAGEMENT_ROLES,
  FINANCIAL_ROLES,
  BOOKING_ROLES,
  STAFF_ASSIGNMENT_ROLES,
  ROLE_HIERARCHY,
  hasMinimumRole,
};
