import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5005/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token and Environment header to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const env = sessionStorage.getItem("hm_environment");
  if (env) {
    config.headers["X-Environment"] = env;
  }
  
  return config;
});

// Handle 401 responses (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("hm_token");
      localStorage.removeItem("hm_user");
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════
// AUTH
// ═══════════════════════════════════
export const authAPI = {
  login: (email, password, tenantSlug) => api.post("/v1/auth/login", { email, password, tenantSlug }),
  getMe: () => api.get("/v1/auth/me"),
  register: (data) => api.post("/v1/auth/register", data),
};

// ═══════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════
export const bookingsAPI = {
  getAll: (params) => api.get("/v1/bookings", { params }),
  getById: (id) => api.get(`/v1/bookings/${id}`),
  create: (data) => api.post("/v1/bookings", data),
  createEnquiry: (data) => api.post("/v1/bookings/enquiry", data),
  update: (id, data) => api.put(`/v1/bookings/${id}`, data),
  updateStatus: (id, status) => api.patch(`/v1/bookings/${id}/status`, { status }),
  generateInvoice: (id) => api.post(`/v1/bookings/${id}/invoice`),
  remove: (id) => api.delete(`/v1/bookings/${id}`),
  getStats: () => api.get("/v1/bookings/stats/dashboard"),
  getComparisonStats: () => api.get("/v1/bookings/stats/comparison"),
};

// ═══════════════════════════════════
// EXPENSES
// ═══════════════════════════════════
export const expensesAPI = {
  getAll: (params) => api.get("/v1/expenses", { params }),
  create: (data) => api.post("/v1/expenses", data),
  update: (id, data) => api.put(`/v1/expenses/${id}`, data),
  remove: (id) => api.delete(`/v1/expenses/${id}`),
};

// ═══════════════════════════════════
// SETTINGS
// ═══════════════════════════════════
export const availabilityAPI = {
  check: (hall, date, ignoreBookingId = null) => {
    let url = `/v1/availability?hall=${encodeURIComponent(hall)}&date=${encodeURIComponent(date)}`;
    if (ignoreBookingId) url += `&ignoreBookingId=${ignoreBookingId}`;
    return api.get(url);
  },
  getMonth: (hall, year, month) => {
    return api.get(`/v1/availability/month?hall=${encodeURIComponent(hall)}&year=${year}&month=${month}`);
  },
};

export const feedbackAPI = {
  submit: (data) => api.post("/feedback", data),
  getAll: () => api.get("/feedback")
};

export const settingsAPI = {
  get: () => api.get("/v1/settings"),
  getPublic: (slug) => api.get(`/v1/settings/public/${slug}`),
  update: (data) => api.put("/v1/settings", data),
  uploadLogo: (formData) => api.post("/v1/settings/upload-logo", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  getCustomers: () => api.get("/v1/settings/customers"),
  getUsers: () => api.get("/v1/settings/users"),
  resetSandbox: () => api.post("/v1/settings/sandbox/reset"),
  generateTester: (data) => api.post("/v1/settings/tester", data),
};

// ═══════════════════════════════════
// ENQUIRIES (CRM)
// ═══════════════════════════════════
export const enquiriesAPI = {
  getAll: (params) => api.get("/v1/enquiries", { params }),
  getById: (id) => api.get(`/v1/enquiries/${id}`),
  create: (data) => api.post("/v1/enquiries", data),
  update: (id, data) => api.put(`/v1/enquiries/${id}`, data),
  updateStatus: (id, status) => api.put(`/v1/enquiries/${id}`, { status }),
  remove: (id) => api.delete(`/v1/enquiries/${id}`),
};

// ═══════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════
export const customersAPI = {
  getAll: (params) => api.get("/v1/customers", { params }),
  getById: (id) => api.get(`/v1/customers/${id}`),
  create: (data) => api.post("/v1/customers", data),
  update: (id, data) => api.put(`/v1/customers/${id}`, data),
  remove: (id) => api.delete(`/v1/customers/${id}`),
  findOrCreate: (data) => api.post("/v1/customers/find-or-create", data),
};

// ═══════════════════════════════════
// AGREEMENTS
// ═══════════════════════════════════
export const agreementsAPI = {
  getAll: (params) => api.get("/v1/agreements", { params }),
  getById: (id) => api.get(`/v1/agreements/${id}`),
  create: (data) => api.post("/v1/agreements", data),
  update: (id, data) => api.put(`/v1/agreements/${id}`, data),
  generate: (bookingId) => api.post(`/v1/agreements/generate/${bookingId}`),
};

// ═══════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════
export const paymentsAPI = {
  getAll: (params) => api.get("/v1/payments", { params }),
  getById: (id) => api.get(`/v1/payments/${id}`),
  create: (data) => api.post("/v1/payments", data),
  update: (id, data) => api.put(`/v1/payments/${id}`, data),
  remove: (id) => api.delete(`/v1/payments/${id}`),
  getReceipt: (id) => api.get(`/v1/payments/${id}/receipt`),
};

// ═══════════════════════════════════
// JOBS
// ═══════════════════════════════════
export const jobsAPI = {
  getAll: (params) => api.get("/v1/jobs", { params }),
  getById: (id) => api.get(`/v1/jobs/${id}`),
  create: (data) => api.post("/v1/jobs", data),
  update: (id, data) => api.put(`/v1/jobs/${id}`, data),
  updateStatus: (id, status) => api.patch(`/v1/jobs/${id}/status`, { status }),
  updateChecklist: (id, data) => api.put(`/v1/jobs/${id}/checklist`, data),
  assignStaff: (id, data) => api.post(`/v1/jobs/${id}/staff`, data),
};

// ═══════════════════════════════════
// MASTERS (Halls, Event Types, etc.)
// ═══════════════════════════════════
export const mastersAPI = {
  getAll: (params) => api.get("/v1/masters", { params }), // fallback if needed, but not matching backend route
  getByType: (type) => api.get(`/v1/masters/${type}`),
  create: (data) => api.post(`/v1/masters/${data.type}`, data),
  update: (id, data) => api.put(`/v1/masters/${data.type}/${id}`, data),
  remove: (type, id) => api.delete(`/v1/masters/${type}/${id}`),
};

// ═══════════════════════════════════
// FOLLOW-UPS
// ═══════════════════════════════════
export const followupsAPI = {
  getAll: (params) => api.get("/v1/followups", { params }),
  create: (data) => api.post("/v1/followups", data),
  update: (id, data) => api.put(`/v1/followups/${id}`, data),
};

// ═══════════════════════════════════
// ACCOUNTS (Full Accounting Module)
// ═══════════════════════════════════
export const accountsAPI = {
  getCashBook: (params) => api.get("/v1/accounts/cash-book", { params }),
  getBankBook: (params) => api.get("/v1/accounts/bank-book", { params }),
  getStatement: (customerId) => api.get(`/v1/accounts/statement/${customerId}`),
  getDashboard: () => api.get("/v1/accounts/dashboard"),
  getLedger: (params) => api.get("/v1/accounts/ledger", { params }),
  getVouchers: (params) => api.get("/v1/accounts/vouchers", { params }),
  getChartOfAccounts: () => api.get("/v1/accounts/chart-of-accounts"),
  getCustomerLedger: (customerId) => api.get(`/v1/accounts/customer-ledger/${customerId}`),
  getBookingLedger: (bookingId) => api.get(`/v1/accounts/booking-ledger/${bookingId}`),
  getProfitLoss: (params) => api.get("/v1/accounts/profit-loss", { params }),
  getOutstanding: () => api.get("/v1/accounts/outstanding"),
  deleteVoucher: (id) => api.delete(`/v1/accounts/vouchers/${id}`),
};

// ═══════════════════════════════════
// ADMIN
// ═══════════════════════════════════
export const adminAPI = {
  getTenants: () => api.get("/admin/tenants"),
  createTenant: (data) => api.post("/admin/tenants", data),
  updateSubscription: (id, data) => api.put(`/admin/tenants/${id}/subscription`, data),
  toggleSandbox: (id) => api.patch(`/admin/tenants/${id}/toggle-sandbox`),
  toggleStatus: (id) => api.patch(`/admin/tenants/${id}/status`),
};

export default api;

// ═══════════════════════════════════
// USERS (Staff Management)
// ═══════════════════════════════════
export const usersAPI = {
  getAll: () => api.get("/v1/settings/users"),
  create: (data) => api.post("/v1/auth/register", data),
  update: (id, data) => api.put(`/v1/settings/users/${id}`, data),
  toggle: (id) => api.patch(`/v1/settings/users/${id}/toggle`),
  remove: (id) => api.delete(`/v1/settings/users/${id}`),
};
