import React, { useState, useEffect } from "react";
import { BookOpen, DollarSign, Activity, FileText, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, CheckCircle, Clock, Calendar, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { accountsAPI } from "../services/api";

function MetricCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div style={{ background: "#fff", padding: "24px", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</p>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: color }}>
          <Icon size={20} />
        </div>
      </div>
      <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{value}</h3>
    </div>
  );
}

export default function AccountsLite() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [vouchersData, setVouchersData] = useState([]);
  const [plData, setPlData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const res = await accountsAPI.getDashboard();
        setDashboardData(res.data.data);
      } else if (activeTab === "ledger") {
        const res = await accountsAPI.getLedger();
        setLedgerData(res.data.data.data || []);
      } else if (activeTab === "vouchers") {
        const res = await accountsAPI.getVouchers();
        setVouchersData(res.data.data.data || []);
      } else if (activeTab === "profit-loss") {
        const res = await accountsAPI.getProfitLoss();
        setPlData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch accounts data", err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const renderDashboard = () => {
    if (!dashboardData) return null;
    const { summary, recentTransactions } = dashboardData;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          <MetricCard title="Net Balance" value={formatMoney(summary.netBalance)} icon={Activity} color="#16a34a" bg="#dcfce7" />
          <MetricCard title="Cash Balance" value={formatMoney(summary.cashBalance)} icon={DollarSign} color="#0ea5e9" bg="#e0f2fe" />
          <MetricCard title="Bank Balance" value={formatMoney(summary.bankBalance)} icon={Wallet} color="#8b5cf6" bg="#ede9fe" />
          <MetricCard title="Outstanding" value={formatMoney(summary.outstanding)} icon={Clock} color="#ef4444" bg="#fee2e2" />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
           <MetricCard title="Monthly Revenue" value={formatMoney(summary.monthlyRevenue)} icon={TrendingUp} color="#10b981" bg="#d1fae5" />
           <MetricCard title="Monthly Expenses" value={formatMoney(summary.monthlyExpense)} icon={ArrowDownRight} color="#f59e0b" bg="#fef3c7" />
           <MetricCard title="Net Profit (Month)" value={formatMoney(summary.netProfit)} icon={BarChart2} color="#3b82f6" bg="#dbeafe" />
        </div>

        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>Recent Journal Entries</h3>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden" }}>
             <table style={{ width: "100%", borderCollapse: "collapse" }}>
               <thead>
                 <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                   <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                   <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Voucher No</th>
                   <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Description</th>
                   <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Debit A/c</th>
                   <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Credit A/c</th>
                   <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                 </tr>
               </thead>
               <tbody>
                 {recentTransactions.slice(0, 10).map((txn, idx) => (
                   <tr key={txn.id} style={{ borderBottom: idx < recentTransactions.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                     <td style={{ padding: "16px 20px", fontSize: 13, color: "#475569", fontWeight: 500 }}>{formatDate(txn.date)}</td>
                     <td style={{ padding: "16px 20px" }}>
                       <span style={{ fontSize: 12, fontWeight: 700, color: "#1B4332", background: "#eefcf4", padding: "4px 8px", borderRadius: 6 }}>{txn.journalNumber}</span>
                     </td>
                     <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{txn.description}</td>
                     <td style={{ padding: "16px 20px", fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{txn.DebitAccount?.name}</td>
                     <td style={{ padding: "16px 20px", fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{txn.CreditAccount?.name}</td>
                     <td style={{ padding: "16px 20px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{formatMoney(txn.amount)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLedger = () => (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden" }}>
       <table style={{ width: "100%", borderCollapse: "collapse" }}>
         <thead>
           <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Date</th>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Journal Ref</th>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Description</th>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Debit A/c</th>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Credit A/c</th>
             <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
           </tr>
         </thead>
         <tbody>
           {ledgerData.map((txn, idx) => (
             <tr key={txn.id} style={{ borderBottom: idx < ledgerData.length - 1 ? "1px solid #f1f5f9" : "none" }}>
               <td style={{ padding: "16px 20px", fontSize: 13, color: "#475569", fontWeight: 500 }}>{formatDate(txn.date)}</td>
               <td style={{ padding: "16px 20px" }}>
                 <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "4px 8px", borderRadius: 6 }}>{txn.journalNumber}</span>
               </td>
               <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{txn.description}</td>
               <td style={{ padding: "16px 20px", fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{txn.DebitAccount?.name}</td>
               <td style={{ padding: "16px 20px", fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{txn.CreditAccount?.name}</td>
               <td style={{ padding: "16px 20px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{formatMoney(txn.amount)}</td>
             </tr>
           ))}
         </tbody>
       </table>
    </div>
  );

  const renderVouchers = () => (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden" }}>
       <table style={{ width: "100%", borderCollapse: "collapse" }}>
         <thead>
           <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Date</th>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Voucher No</th>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Type</th>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Description</th>
             <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Customer/Ref</th>
             <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
           </tr>
         </thead>
         <tbody>
           {vouchersData.map((txn, idx) => (
             <tr key={txn.id} style={{ borderBottom: idx < vouchersData.length - 1 ? "1px solid #f1f5f9" : "none" }}>
               <td style={{ padding: "16px 20px", fontSize: 13, color: "#475569", fontWeight: 500 }}>{formatDate(txn.date)}</td>
               <td style={{ padding: "16px 20px" }}>
                 <span style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9", background: "#e0f2fe", padding: "4px 8px", borderRadius: 6 }}>{txn.voucherNumber}</span>
               </td>
               <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 700, color: "#64748b" }}>{txn.voucherType}</td>
               <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{txn.description}</td>
               <td style={{ padding: "16px 20px", fontSize: 13, color: "#475569", fontWeight: 500 }}>{txn.Customer?.name || "-"}</td>
               <td style={{ padding: "16px 20px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{formatMoney(txn.amount)}</td>
             </tr>
           ))}
         </tbody>
       </table>
    </div>
  );

  const renderPL = () => {
    if (!plData) return null;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#16a34a" }}>Income</h3>
          {plData.income.map(item => (
            <div key={item.code} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#475569" }}>{item.name}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{formatMoney(item.amount)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 8, borderTop: "2px solid #e2e8f0" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Total Income</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{formatMoney(plData.totalIncome)}</span>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#ef4444" }}>Expenses</h3>
          {plData.expenses.map(item => (
            <div key={item.code} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#475569" }}>{item.name}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{formatMoney(item.amount)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 0", marginTop: 8, borderTop: "2px solid #e2e8f0" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Total Expenses</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>{formatMoney(plData.totalExpenses)}</span>
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1", background: plData.netProfit >= 0 ? "#f0fdf4" : "#fef2f2", padding: 24, borderRadius: 20, border: `1px solid ${plData.netProfit >= 0 ? "#bbf7d0" : "#fecaca"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: plData.netProfit >= 0 ? "#166534" : "#991b1b" }}>Net Profit</h3>
          <span style={{ fontSize: 28, fontWeight: 800, color: plData.netProfit >= 0 ? "#16a34a" : "#dc2626" }}>{formatMoney(plData.netProfit)}</span>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart2 },
    { id: "ledger", label: "General Ledger", icon: BookOpen },
    { id: "vouchers", label: "Vouchers", icon: FileText },
    { id: "profit-loss", label: "Profit & Loss", icon: Activity },
  ];

  return (
    <div style={{ padding: "30px 40px", maxWidth: 1400, margin: "0 auto", fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #1B4332, #2D6A4F)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 12px rgba(27,67,50,0.2)" }}>
              <BookOpen size={20} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#0f172a", fontFamily: "'Playfair Display', serif" }}>Financial Accounting</h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Full double-entry ledger, vouchers, and real-time P&L.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 32, background: "#fff", padding: 8, borderRadius: 16, border: "1px solid #f1f5f9", display: "inline-flex" }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12,
                border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, transition: "all 0.2s",
                background: active ? "#1B4332" : "transparent",
                color: active ? "#fff" : "#64748b"
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ padding: 100, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "ledger" && renderLedger()}
          {activeTab === "vouchers" && renderVouchers()}
          {activeTab === "profit-loss" && renderPL()}
        </motion.div>
      )}
    </div>
  );
}
