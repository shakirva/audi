import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, RefreshCw, Wallet, ArrowDownRight, ArrowUpRight, CreditCard, Banknote, Building2, Smartphone, CircleDollarSign, AlertCircle, Lock } from "lucide-react";
import { accountsAPI, settingsAPI, isPlanRestriction } from "../../services/api";
import { useToast } from "../../components/Toast";
import { useRole } from "../../context/RoleContext";

export default function FinanceReports() {
  const { addToast } = useToast();
  const { subscription } = useRole();
  const isStarter = subscription?.plan === "starter";
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("cash"); // "cash" | "accrual"
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const [res, settingsRes] = await Promise.all([
        accountsAPI.getProfitLoss({}),
        settingsAPI.get()
      ]);
      setReport(res.data.data);
      setSettings(settingsRes.data?.data || {});
    } catch (error) {
      if (!isPlanRestriction(error)) addToast("Failed to fetch profit & loss report", "error");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  const modeIcon = (mode) => {
    switch(mode) {
      case "Cash": return <Banknote size={16} />;
      case "UPI": return <Smartphone size={16} />;
      case "Bank Transfer": return <Building2 size={16} />;
      case "Cheque": return <CreditCard size={16} />;
      case "Card": return <CreditCard size={16} />;
      default: return <CircleDollarSign size={16} />;
    }
  };

  const cash = report?.cashBasis || {};
  // Collection Rate = Customer Collections / Booked Value (vendor income is separate)
  const customerReceived = cash.totalCustomerReceived || 0;
  const collectionRate = cash.totalBooked > 0 ? ((customerReceived / cash.totalBooked) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Finance Reports</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Real-time Profit & Loss statement based on actual collections.</p>
        </div>
        {/* View Toggle */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
          <button 
            onClick={() => setViewMode("cash")}
            style={{ 
              padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: viewMode === "cash" ? "#0D2418" : "transparent",
              color: viewMode === "cash" ? "#fff" : "#64748b",
              transition: "all 0.2s"
            }}
          >
            💰 Cash Basis
          </button>
          <button 
            onClick={() => {
              if (isStarter) {
                window.dispatchEvent(
                  new CustomEvent("plan-upgrade-required", {
                    detail: { feature: "Accrual Accounting", requiredPlan: "Professional" }
                  })
                );
                return;
              }
              setViewMode("accrual");
            }}
            style={{ 
              padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: viewMode === "accrual" ? "#0D2418" : "transparent",
              color: viewMode === "accrual" ? "#fff" : "#64748b",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            📊 Accrual Basis {isStarter && <Lock size={12} style={{ opacity: 0.5 }} />}
          </button>
        </div>
      </div>

      {loading && !report ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading report data...</div>
      ) : report ? (
        <>
          {viewMode === "cash" ? (
            /* ═══════════════════════════════════════════ */
            /*            CASH BASIS VIEW                 */
            /* ═══════════════════════════════════════════ */
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* Total Income */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: "#dcfce7", padding: 8, borderRadius: 10, color: "#16a34a" }}><ArrowDownRight size={18} /></div>
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Income</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a" }}>{fmt(cash.totalReceived)}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Customers + Vendors</div>
                </div>

                {/* Customer Collections */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: "#e0e7ff", padding: 8, borderRadius: 10, color: "#4f46e5" }}><Wallet size={18} /></div>
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Booking Collections</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{fmt(customerReceived)}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>of {fmt(cash.totalBooked)} booked</div>
                </div>

                {/* Vendor Income */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: "#fff7ed", padding: 8, borderRadius: 10, color: "#ea580c" }}><ArrowUpRight size={18} /></div>
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Vendor Income</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#ea580c" }}>{fmt(cash.totalVendorReceived)}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Catering, services, etc.</div>
                </div>

                {/* Outstanding */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: "#fef3c7", padding: 8, borderRadius: 10, color: "#d97706" }}><AlertCircle size={18} /></div>
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Outstanding</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#d97706" }}>{fmt(cash.totalOutstanding)}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Booking balance due</div>
                </div>

                {/* Collection Rate */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: "#dcfce7", padding: 8, borderRadius: 10, color: "#16a34a" }}><TrendingUp size={18} /></div>
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Collection Rate</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{collectionRate}%</div>
                  <div style={{ 
                    marginTop: 8, height: 8, borderRadius: 4, background: "#f1f5f9", overflow: "hidden"
                  }}>
                    <div style={{ 
                      height: "100%", borderRadius: 4, 
                      background: collectionRate >= 80 ? "#16a34a" : collectionRate >= 50 ? "#d97706" : "#dc2626",
                      width: `${Math.min(collectionRate, 100)}%`,
                      transition: "width 0.6s ease"
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Bookings only</div>
                </div>
              </div>

              {/* Main Content: Income + Expenses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Income (Cash Received — Customers + Vendors) */}
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding: 24, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#dcfce7", padding: 8, borderRadius: 8, color: "#16a34a" }}><TrendingUp size={20} /></div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Income (Cash Received)</h2>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Customer bookings + Vendor collections</p>
                    </div>
                  </div>
                  <div style={{ padding: 24 }}>
                    {(!cash.paymentsByMode || cash.paymentsByMode.length === 0) ? (
                      <p style={{ color: "#94a3b8", margin: 0 }}>No payments received yet.</p>
                    ) : (
                      cash.paymentsByMode.map((item) => (
                        <div key={item.mode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px dashed #e2e8f0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ color: "#16a34a", opacity: 0.7 }}>{modeIcon(item.mode)}</div>
                            <div>
                              <span style={{ color: "#334155", fontWeight: 600, fontSize: 14 }}>{item.mode}</span>
                              <span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 8 }}>({item.count} payments)</span>
                            </div>
                          </div>
                          <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 15 }}>{fmt(item.total)}</span>
                        </div>
                      ))
                    )}
                    {/* Show vendor income breakdown if available */}
                    {cash.totalVendorReceived > 0 && (
                      <div style={{ marginTop: 12, padding: "12px 0", borderTop: "2px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#334155", fontWeight: 600, fontSize: 13 }}>Customer Collections</span>
                          </div>
                          <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 14 }}>{fmt(cash.totalCustomerReceived)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#334155", fontWeight: 600, fontSize: 13 }}>Vendor Collections</span>
                            <span style={{ background: "#fff7ed", color: "#ea580c", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, border: "1px solid #fed7aa" }}>Vendor</span>
                          </div>
                          <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 14 }}>{fmt(cash.totalVendorReceived)}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 12 }}>
                      <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 16 }}>Total Received</span>
                      <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 18 }}>{fmt(cash.totalReceived)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                      * Includes customer bookings + vendor payments (catering, etc.)
                    </div>
                  </div>
                </div>

                {/* Expenses */}
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding: 24, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#fee2e2", padding: 8, borderRadius: 8, color: "#dc2626" }}><TrendingDown size={20} /></div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Expenses & Direct Costs</h2>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>All recorded expenses from ledgers</p>
                    </div>
                  </div>
                  <div style={{ padding: 24 }}>
                    {(!report.expenses || report.expenses.length === 0) ? (
                      <p style={{ color: "#94a3b8", margin: 0 }}>No expenses recorded.</p>
                    ) : (
                      report.expenses.map((item) => (
                        <div key={item.code} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed #e2e8f0" }}>
                          <span style={{ color: "#475569", fontWeight: 500 }}>{item.name}</span>
                          <span style={{ color: "#dc2626", fontWeight: 700 }}>{fmt(item.amount)}</span>
                        </div>
                      ))
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 12 }}>
                      <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 16 }}>Total Expenses</span>
                      <span style={{ color: "#dc2626", fontWeight: 800, fontSize: 18 }}>{fmt(report.totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Cash Profit */}
              <div style={{ background: "#0f172a", borderRadius: 16, padding: "36px 32px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
                <div>
                  <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Net Cash Profit (Received − Expenses)</p>
                  <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: (cash.netCashProfit || 0) >= 0 ? "#4ade80" : "#f87171" }}>
                    {(cash.netCashProfit || 0) >= 0 ? "+" : "−"} {fmt(Math.abs(cash.netCashProfit || 0))}
                  </h1>
                </div>
                <div className="hidden md:block" style={{ background: "rgba(255,255,255,0.1)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <BarChart3 size={48} color="#fff" style={{ opacity: 0.8 }} />
                </div>
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════ */
            /*           ACCRUAL BASIS VIEW               */
            /* ═══════════════════════════════════════════ */
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Revenue (Journal-based) */}
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: 24, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "#dcfce7", padding: 8, borderRadius: 8, color: "#16a34a" }}><TrendingUp size={20} /></div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Income & Revenue (Accrual)</h2>
                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>From double-entry journal ledgers</p>
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  {(!report.income || report.income.length === 0) ? (
                    <p style={{ color: "#94a3b8", margin: 0 }}>No revenue recorded.</p>
                  ) : (
                    report.income.map((item) => (
                      <div key={item.code} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed #e2e8f0" }}>
                        <span style={{ color: "#475569", fontWeight: 500 }}>{item.name}</span>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>{fmt(item.amount)}</span>
                      </div>
                    ))
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 12 }}>
                    <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 16 }}>Total Contract Value (Gross)</span>
                    <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>{fmt(report.totalIncome + (report.totalTaxes || 0))}</span>
                  </div>
                  
                  {/* Explicitly show GST as a deduction to arrive at Net Revenue */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "2px solid #e2e8f0" }}>
                    <span style={{ color: "#64748b", fontWeight: 500, fontSize: 14 }}>− GST & Taxes (Liability)</span>
                    <span style={{ color: "#ef4444", fontWeight: 600, fontSize: 14 }}>{fmt(report.totalTaxes || 0)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
                    <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 15 }}>Net Earned Revenue</span>
                    <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 16 }}>{fmt(report.totalIncome)}</span>
                  </div>

                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 12 }}>
                    * GST is deducted from the gross contract value because it is owed to the government.
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: 24, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "#fee2e2", padding: 8, borderRadius: 8, color: "#dc2626" }}><TrendingDown size={20} /></div>
                  <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Expenses & Direct Costs</h2>
                </div>
                <div style={{ padding: 24 }}>
                  {(!report.expenses || report.expenses.length === 0) ? (
                    <p style={{ color: "#94a3b8", margin: 0 }}>No expenses recorded.</p>
                  ) : (
                    report.expenses.map((item) => (
                      <div key={item.code} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed #e2e8f0" }}>
                        <span style={{ color: "#475569", fontWeight: 500 }}>{item.name}</span>
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>{fmt(item.amount)}</span>
                      </div>
                    ))
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 12 }}>
                    <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 16 }}>Total Expenses</span>
                    <span style={{ color: "#dc2626", fontWeight: 800, fontSize: 18 }}>{fmt(report.totalExpenses)}</span>
                  </div>
                  </div>
                </div>
              </div>

              {/* Net Profit (Accrual) */}
              <div style={{ background: "#0f172a", borderRadius: 16, padding: "36px 32px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
                <div>
                  <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Net Profit / Loss (Accrual — After GST & Expenses)</p>
                  <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: (report.netProfit || 0) >= 0 ? "#4ade80" : "#f87171" }}>
                    {(report.netProfit || 0) >= 0 ? "+" : "−"} {fmt(Math.abs(report.netProfit || 0))}
                  </h1>
                </div>
                <div className="hidden md:block" style={{ background: "rgba(255,255,255,0.1)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <BarChart3 size={48} color="#fff" style={{ opacity: 0.8 }} />
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
