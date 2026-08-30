import { LayoutDashboard, Users, Briefcase, CreditCard, UsersRound, CheckSquare, BarChart3, Settings, Database } from "lucide-react";

export const BASE_NAVIGATION = [
  { type: "link", path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["SuperAdmin", "Admin", "Owner", "Manager", "Tester", "Sales", "Operations", "Reception", "Accounts"] },
  { 
    type: "group", label: "CRM", icon: Users, id: "crm", roles: ["SuperAdmin", "Admin", "Owner", "Manager", "Tester", "Sales", "Reception"],
    children: [
      { path: "/calendar", label: "Calendar" },
      { path: "/crm", label: "Enquiries" },
      { path: "/customers", label: "Customers" },
      { path: "/bookings", label: "Bookings" },
      { path: "/agreements", label: "Agreements" }
    ]
  },
  { 
    type: "group", label: "Operations", icon: Briefcase, id: "ops", roles: ["SuperAdmin", "Admin", "Owner", "Manager", "Tester", "Sales", "Operations"],
    children: [
      { path: "/vendors", label: "Vendor Management" },
      { path: "/inventory", label: "Inventory Management" }
    ]
  },
  { 
    type: "group", label: "Finance", icon: CreditCard, id: "finance", roles: ["SuperAdmin", "Admin", "Owner", "Manager", "Tester", "Accounts"],
    children: [
      { path: "/finance/payments", label: "Payments & Receipts" },
      { path: "/finance/booking-accounts", label: "Booking Accounts" },
      { path: "/finance/collections", label: "Collections" },
      { path: "/finance/expenses", label: "Purchases & Expenses" },
      { path: "/finance/reports", label: "Financial Statements" },
      { path: "/finance/advanced", label: "Advanced Accounting" }
    ]
  },
  { 
    type: "group", label: "Staff & HR", icon: UsersRound, id: "external", roles: ["SuperAdmin", "Admin", "Owner", "Manager", "Tester"],
    children: [
      { path: "/staff", label: "Staff Management" },
      { path: "/attendance", label: "Attendance" },
      { path: "/leaves", label: "Leave Requests" }
    ]
  },
  { 
    type: "group", label: "Attendance & Leaves", icon: CheckSquare, id: "staff-actions", roles: ["Sales", "Operations", "Reception", "Accounts", "Staff"],
    children: [
      { path: "/attendance", label: "My Attendance" },
      { path: "/leaves", label: "Leave Requests" }
    ]
  },
  { 
    type: "group", label: "Reports Center", icon: BarChart3, id: "reports", roles: ["SuperAdmin", "Admin", "Owner", "Manager", "Tester", "Accounts"],
    children: [
      { path: "/reports", label: "Report Dashboard" },
      { path: "/reports/sales", label: "Sales Reports" },
      { path: "/reports/booking", label: "Booking Reports" },
      { path: "/reports/accounts", label: "Accounts Reports" },
      { path: "/reports/hall", label: "Hall Reports" },
      { path: "/reports/customer", label: "Customer Reports" }
    ]
  },
  { 
    type: "group", label: "System", icon: Settings, id: "system", roles: ["SuperAdmin", "Admin", "Owner", "Manager", "Tester"],
    children: [
      { path: "/settings", label: "Masters Configuration" },
      { path: "/system/activity-logs", label: "Activity Logs" }
    ]
  },
  { 
    type: "group", label: "SaaS Platform", icon: Database, id: "saas", roles: ["SuperAdmin"],
    children: [
      { path: "/tenants", label: "Tenant Manager" },
      { path: "/leads", label: "Demo Requests" },
      { path: "/subscriptions", label: "Subscriptions" },
      { path: "/feedback", label: "User Feedback" }
    ]
  }
];
