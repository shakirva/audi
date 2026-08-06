import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { accountsAPI } from "../../services/api";
import { useToast } from "../../components/Toast";

export default function FinanceReports() {
  const { addToast } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await accountsAPI.getProfitLoss({});
      setReport(res.data.data);
    } catch (error) {
      addToast("Failed to fetch profit & loss report", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Finance Reports</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Real-time Profit & Loss statement based on double-entry ledgers.</p>
        </div>
      </div>

      {loading && !report ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading report data...</div>
      ) : report ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Revenue */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ padding: 24, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "#dcfce7", padding: 8, borderRadius: 8, color: "#16a34a" }}><TrendingUp size={20} /></div>
              <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Income & Revenue</h2>
            </div>
            <div style={{ padding: 24 }}>
              {(!report.income || report.income.length === 0) ? (
                <p style={{ color: "#94a3b8", margin: 0 }}>No revenue recorded.</p>
              ) : (
                report.income.map((item) => (
                  <div key={item.code} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed #e2e8f0" }}>
                    <span style={{ color: "#475569", fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>₹{Number(item.amount).toLocaleString()}</span>
                  </div>
                ))
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 12 }}>
                <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 16 }}>Total Revenue</span>
                <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 18 }}>₹{Number(report.totalIncome || 0).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                * Revenue is shown after deducting GST (GST goes to Taxes Payable liability)
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
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>₹{Number(item.amount).toLocaleString()}</span>
                  </div>
                ))
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 12 }}>
                <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 16 }}>Total Expenses</span>
                <span style={{ color: "#dc2626", fontWeight: 800, fontSize: 18 }}>₹{Number(report.totalExpenses || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Profit Summary */}
          <div style={{ gridColumn: "1 / -1", background: "#0f172a", borderRadius: 12, padding: 32, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
            <div>
              <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Net Profit / Loss (After GST & Expenses)</p>
              <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: (report.netProfit || 0) >= 0 ? "#4ade80" : "#f87171" }}>
                {(report.netProfit || 0) >= 0 ? "+" : "-"} ₹{Math.abs(report.netProfit || 0).toLocaleString()}
              </h1>
            </div>
            <div className="hidden md:block" style={{ background: "rgba(255,255,255,0.1)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
              <BarChart3 size={48} color="#fff" style={{ opacity: 0.8 }} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
