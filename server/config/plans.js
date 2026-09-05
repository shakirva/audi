/**
 * Venueza Plan Configuration — Single Source of Truth
 * 
 * All plan definitions, limits, and feature entitlements are defined here.
 * Do NOT scatter plan checks throughout the codebase.
 * 
 * Usage:
 *   const { getPlan, checkFeature, checkLimit } = require("../config/plans");
 *   const plan = getPlan("professional");
 *   if (!checkFeature("professional", "advanced_accounting")) { ... }
 *   if (!checkLimit("starter", "maxUsers", currentCount)) { ... }
 */

const PLANS = {
  trial: {
    name: "Free Trial",
    displayName: "14-Day Trial",
    tier: 0,
    limits: {
      maxUsers: 3,
      maxHalls: 3,
      maxBranches: 1,
    },
    features: {
      // Core — available to all
      booking: true,
      crm: true,
      calendar: true,
      customer_management: true,
      enquiry_management: true,
      followups: true,
      agreements: true,
      payments: true,
      receipts: true,
      basic_finance: true,
      basic_reports: true,
      masters: true,
      availability: true,
      expenses: true,

      // Professional features — available during trial so users experience full value
      advanced_accounting: true,
      chart_of_accounts: true,
      vouchers: true,
      journal_entries: true,
      general_ledger: true,
      trial_balance: true,
      profit_loss: true,
      balance_sheet: true,
      cash_book: true,
      bank_book: true,
      customer_statements: true,
      vendor_statements: true,
      financial_periods: true,
      tax_invoices: true,
      finance_reports: true,
      staff_management: true,
      attendance: true,
      leave_management: true,
      jobs: true,
      vendors: true,
      inventory: true,
      advanced_reports: true,
      role_access: true,
      revenue_privacy: true,
      custom_branding: true,
      sandbox: true,
      audit_logs: true,

      // Business features — NOT available during trial
      data_export: false,
      api_access: false,
      multi_branch: false,
    },
    trialDays: 14,
  },

  starter: {
    name: "Starter",
    displayName: "Starter — ₹999/mo",
    tier: 1,
    monthlyPrice: 999,
    annualPrice: 9999,
    limits: {
      maxUsers: 3,
      maxHalls: 1,
      maxBranches: 1,
    },
    features: {
      // Core — all available
      booking: true,
      crm: true,
      calendar: true,
      customer_management: true,
      enquiry_management: true,
      followups: true,
      agreements: true,
      payments: true,
      receipts: true,
      basic_finance: true,
      basic_reports: true,
      masters: true,
      availability: true,
      expenses: true,

      // Professional features — NOT available on Starter
      advanced_accounting: false,
      chart_of_accounts: false,
      vouchers: false,
      journal_entries: false,
      general_ledger: false,
      trial_balance: false,
      profit_loss: false,
      balance_sheet: false,
      cash_book: false,
      bank_book: false,
      customer_statements: false,
      vendor_statements: false,
      financial_periods: false,
      tax_invoices: false,
      finance_reports: false,
      staff_management: false,
      attendance: false,
      leave_management: false,
      jobs: false,
      vendors: false,
      inventory: false,
      advanced_reports: false,
      role_access: false,
      revenue_privacy: false,
      custom_branding: false,
      sandbox: false,
      audit_logs: false,

      // Business features — NOT available
      data_export: false,
      api_access: false,
      multi_branch: false,
    },
  },

  professional: {
    name: "Professional",
    displayName: "Professional — ₹3,999/mo",
    tier: 2,
    monthlyPrice: 3999,
    annualPrice: 39999,
    limits: {
      maxUsers: 10,
      maxHalls: 5,
      maxBranches: 1,
    },
    features: {
      // Core
      booking: true,
      crm: true,
      calendar: true,
      customer_management: true,
      enquiry_management: true,
      followups: true,
      agreements: true,
      payments: true,
      receipts: true,
      basic_finance: true,
      basic_reports: true,
      masters: true,
      availability: true,
      expenses: true,

      // Professional features — all available
      advanced_accounting: true,
      chart_of_accounts: true,
      vouchers: true,
      journal_entries: true,
      general_ledger: true,
      trial_balance: true,
      profit_loss: true,
      balance_sheet: true,
      cash_book: true,
      bank_book: true,
      customer_statements: true,
      vendor_statements: true,
      financial_periods: true,
      tax_invoices: true,
      finance_reports: true,
      staff_management: true,
      attendance: true,
      leave_management: true,
      jobs: true,
      vendors: true,
      inventory: true,
      advanced_reports: true,
      role_access: true,
      revenue_privacy: true,
      custom_branding: true,
      sandbox: true,
      audit_logs: true,

      // Business features — NOT available
      data_export: false,
      api_access: false,
      multi_branch: false,
    },
  },

  business: {
    name: "Business",
    displayName: "Business — from ₹6,999/mo",
    tier: 3,
    monthlyPrice: 6999,
    annualPrice: 69999,
    limits: {
      maxUsers: 999,    // "Unlimited" commercially, but capped at 999 for infrastructure safety
      maxHalls: 99,     // "Unlimited" commercially, but capped at 99 for infrastructure safety
      maxBranches: 10,
    },
    features: {
      // Everything available
      booking: true,
      crm: true,
      calendar: true,
      customer_management: true,
      enquiry_management: true,
      followups: true,
      agreements: true,
      payments: true,
      receipts: true,
      basic_finance: true,
      basic_reports: true,
      masters: true,
      availability: true,
      expenses: true,

      advanced_accounting: true,
      chart_of_accounts: true,
      vouchers: true,
      journal_entries: true,
      general_ledger: true,
      trial_balance: true,
      profit_loss: true,
      balance_sheet: true,
      cash_book: true,
      bank_book: true,
      customer_statements: true,
      vendor_statements: true,
      financial_periods: true,
      tax_invoices: true,
      finance_reports: true,
      staff_management: true,
      attendance: true,
      leave_management: true,
      jobs: true,
      vendors: true,
      inventory: true,
      advanced_reports: true,
      role_access: true,
      revenue_privacy: true,
      custom_branding: true,
      sandbox: true,
      audit_logs: true,

      data_export: true,
      api_access: true,
      multi_branch: true,
    },
  },

  // Special plan for founding customers #1 and #2
  lifetime: {
    name: "Lifetime",
    displayName: "Lifetime (Founding Customer)",
    tier: 99,
    limits: {
      maxUsers: 999,
      maxHalls: 99,
      maxBranches: 10,
    },
    features: {
      booking: true, crm: true, calendar: true, customer_management: true,
      enquiry_management: true, followups: true, agreements: true, payments: true,
      receipts: true, basic_finance: true, basic_reports: true, masters: true,
      availability: true, expenses: true,
      advanced_accounting: true, chart_of_accounts: true, vouchers: true,
      journal_entries: true, general_ledger: true, trial_balance: true,
      profit_loss: true, balance_sheet: true, cash_book: true, bank_book: true,
      customer_statements: true, vendor_statements: true, financial_periods: true,
      tax_invoices: true, finance_reports: true, staff_management: true,
      attendance: true, leave_management: true, jobs: true, vendors: true,
      inventory: true, advanced_reports: true, role_access: true,
      revenue_privacy: true, custom_branding: true, sandbox: true, audit_logs: true,
      data_export: true, api_access: true, multi_branch: true,
    },
  },
};

// Valid plan keys for database ENUM
const PLAN_KEYS = Object.keys(PLANS);

/**
 * Get plan configuration by key
 */
function getPlan(planKey) {
  return PLANS[planKey] || null;
}

/**
 * Check if a plan has access to a specific feature
 */
function checkFeature(planKey, featureKey) {
  const plan = PLANS[planKey];
  if (!plan) return false;
  return plan.features[featureKey] === true;
}

/**
 * Check if adding one more item would exceed the plan limit.
 * Returns true if the current count is BELOW the limit (i.e., can add more).
 */
function checkLimit(planKey, limitKey, currentCount) {
  const plan = PLANS[planKey];
  if (!plan) return false;
  const max = plan.limits[limitKey];
  if (max === undefined || max === null) return true;
  return currentCount < max;
}

/**
 * Get the limit value for a plan
 */
function getLimit(planKey, limitKey) {
  const plan = PLANS[planKey];
  if (!plan) return 0;
  return plan.limits[limitKey] || 0;
}

/**
 * Map feature keys to the route prefixes they protect.
 * Used by planGate middleware to auto-detect which feature a route requires.
 */
const ROUTE_FEATURE_MAP = {
  "/accounts": "advanced_accounting",
  "/attendance": "attendance",
  "/leaves": "leave_management",
  "/jobs": "jobs",
  "/inventory": "inventory",
  "/audit-logs": "audit_logs",
  "/api-access": "api_access",
  "/reports": "advanced_reports",
};

module.exports = {
  PLANS,
  PLAN_KEYS,
  getPlan,
  checkFeature,
  checkLimit,
  getLimit,
  ROUTE_FEATURE_MAP,
};
