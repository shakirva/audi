import React, { useState, useEffect } from "react";
import { Download, Filter, FileText, Search, User, BookOpen, Calculator } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/Toast";
import api, { accountsAPI, customersAPI, reportsAPI, isPlanRestriction } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 };

export default function LedgerReports() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Data
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Reload ledger data whenever filters change
    loadLedgerData();
  }, [startDate, endDate, selectedCustomer, selectedAccount]);

  const fetchAllPages = async (url, params = {}) => {
    let allData = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      try {
        const res = await api.get(url, { params: { ...params, page, limit: 100 } });
        const items = res.data?.data || [];
        allData = [...allData, ...items];
        if (items.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (err) {
        console.error(`Failed to fetch ${url} page ${page}`, err);
        hasMore = false;
      }
    }
    return allData;
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await reportsAPI.checkAccess();
      
      const [customersRes, accountsRes] = await Promise.all([
        customersAPI.getAll({ limit: 1000 }), // Get max customers for dropdown
        accountsAPI.getChartOfAccounts()
      ]);
      
      setCustomers(customersRes.data?.data || []);
      setAccounts(accountsRes.data?.data || []);
    } catch (err) {
      console.error(err);
      if (!isPlanRestriction(err)) addToast("Failed to load filter data", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadLedgerData = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedCustomer) params.customerId = selectedCustomer;
      if (selectedAccount) params.accountCode = selectedAccount;

      const allLedgerEntries = await fetchAllPages("/v1/accounts/ledger", params);
      
      // Sort entries by date ascending for proper running balance calculation
      const sorted = allLedgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      setTransactions(sorted);
    } catch (err) {
      console.error(err);
      addToast("Failed to load ledger data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (val) => {
    if (!val) return "₹0";
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const prefix = isNegative ? "-₹" : "₹";
    return absVal >= 100000 ? `${prefix}${(absVal / 100000).toFixed(1)}L` : `${prefix}${absVal.toLocaleString()}`;
  };

  // Calculate Running Balances
  // If we are viewing a specific account, we can calculate true running balance
  // If no account is selected, it's just a general transaction list (journal view)
  let runningBalance = 0;
  
  const processedTransactions = transactions.map(entry => {
    // For a simple view, we just show the total debit/credit of the entry
    // However, if an account code is selected, we should calculate relative to that account
    let entryDebit = 0;
    let entryCredit = 0;
    
    if (selectedAccount && entry.lines) {
      // Find the specific line for the selected account
      const line = entry.lines.find(l => l.account?.code === selectedAccount);
      if (line) {
        entryDebit = parseFloat(line.debit || 0);
        entryCredit = parseFloat(line.credit || 0);
      }
    } else {
      // General view: sum all debits (which should equal credits)
      entryDebit = entry.lines ? entry.lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0) : 0;
      entryCredit = entry.lines ? entry.lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0) : 0;
    }

    // Ledger logic: Debits increase balance for Assets/Expenses, Credits decrease.
    // Vice versa for Liabilities/Income.
    // For simplicity in a general report without strict account typing context in the loop,
    // we just do Debit - Credit.
    const netChange = entryDebit - entryCredit;
    
    // Only calculate running balance if a specific account or customer is selected
    if (selectedAccount || selectedCustomer) {
       runningBalance += netChange;
    }

    return {
      ...entry,
      displayDebit: entryDebit,
      displayCredit: entryCredit,
      runningBalance: (selectedAccount || selectedCustomer) ? runningBalance : null
    };
  });

  const totalDebit = processedTransactions.reduce((s, t) => s + t.displayDebit, 0);
  const totalCredit = processedTransactions.reduce((s, t) => s + t.displayCredit, 0);

  const filterText = (startDate || endDate) ? `${startDate || "..."} to ${endDate || "..."}` : "All Time";
  const customerText = selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : "All Customers";
  const accountText = selectedAccount ? accounts.find(a => a.code === selectedAccount)?.name : "All Accounts";

  const handleExportPDF = () => {
    addToast("Preparing ledger report...", "success");
    
    const doc = new jsPDF("landscape");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(27, 67, 50);
    doc.text("Ledger Report", 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Period: ${filterText} | Customer: ${customerText} | Account: ${accountText}`, 14, 36);
    
    doc.setDrawColor(220);
    doc.line(14, 40, 280, 40);
    
    const tableColumn = ["Date", "Journal No", "Description", "Customer", "Debit", "Credit"];
    if (selectedAccount || selectedCustomer) {
      tableColumn.push("Balance");
    }
    
    const tableRows = [];

    processedTransactions.forEach(t => {
      const date = new Date(t.date || t.createdAt).toLocaleDateString();
      const ref = t.journalNumber || "-";
      const desc = t.description || "-";
      const custName = t.Customer?.name || "-";
      const debit = t.displayDebit > 0 ? `Rs. ${t.displayDebit.toLocaleString()}` : "-";
      const credit = t.displayCredit > 0 ? `Rs. ${t.displayCredit.toLocaleString()}` : "-";
      
      const row = [date, ref, desc, custName, debit, credit];
      if (selectedAccount || selectedCustomer) {
        row.push(`Rs. ${t.runningBalance.toLocaleString()}`);
      }
      tableRows.push(row);
    });

    if (tableRows.length === 0) {
      const emptyRow = ["-", "-", "No transactions found", "-", "-", "-"];
      if (selectedAccount || selectedCustomer) emptyRow.push("-");
      tableRows.push(emptyRow);
    } else {
      const totalRow = ["", "", "", "Totals:", `Rs. ${totalDebit.toLocaleString()}`, `Rs. ${totalCredit.toLocaleString()}`];
      if (selectedAccount || selectedCustomer) totalRow.push(`Rs. ${runningBalance.toLocaleString()}`);
      tableRows.push(totalRow);
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 67, 50] },
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1 && tableRows.length > 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 249, 244];
        }
      },
    });

    doc.save(`Ledger_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div className="print-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Ledger Reports
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Comprehensive transaction ledgers with advanced filtering.</p>
        </div>
        <div className="w-full sm:w-auto" style={{ display: "flex", gap: 10 }}>
          <button className="w-full sm:w-auto justify-center" 
            onClick={handleExportPDF}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="print-hide flex flex-col sm:flex-row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 24, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div className="hidden sm:flex" style={{ alignItems: "center", gap: 8, color: "#1B4332", fontWeight: 700, fontSize: 13, paddingRight: 10, borderRight: "1px solid #e5e7eb" }}>
          <Filter size={16} /> Filters
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>From:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", background: "#f9fafb" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>To:</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", background: "#f9fafb" }} />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ marginLeft: 8, padding: "4px 8px", fontSize: 11, background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", color: "#64748b" }}>Clear</button>
          )}
        </div>
        
        <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
          ))}
        </select>
        
        <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="">All Accounts (General Journal)</option>
          {accounts.map((a) => (
            <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
          ))}
        </select>
      </div>

      <div id="ledger-report-content" style={{ padding: "10px 0" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Transactions", value: processedTransactions.length.toString(), sub: filterText, icon: BookOpen, color: "#1B4332", bg: "#f0faf4" },
          { label: "Total Debits", value: formatCurrency(totalDebit), sub: "Period Total", icon: Calculator, color: "#059669", bg: "#dcfce7" },
          { label: "Total Credits", value: formatCurrency(totalCredit), sub: "Period Total", icon: Calculator, color: "#2563eb", bg: "#eff6ff" },
        ].map(k => (
          <div key={k.label} style={{ ...cardSt, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, color: k.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={22} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{k.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "4px 0" }}>{k.value}</p>
              <p style={{ fontSize: 12, color: k.color, fontWeight: 700, margin: 0 }}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {processedTransactions.length === 0 && !loading ? (
        <div style={{ ...cardSt, padding: 60, textAlign: "center" }}>
          <FileText size={48} color="#e5e7eb" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ margin: "0 0 8px", color: "#111827", fontSize: 18, fontWeight: 600 }}>No Transactions Found</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>There are no ledger entries matching your selected filters.</p>
        </div>
      ) : (
        <div style={{ ...cardSt, marginTop: 24, padding: "20px 0 0 0", overflow: "hidden" }}>
          <div style={{ padding: "0 20px 16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={sTitle}>
              {selectedAccount ? `Ledger: ${accountText}` : (selectedCustomer ? `Customer Ledger: ${customerText}` : "General Journal")}
            </p>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{processedTransactions.length} Entries</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                  <th style={{ padding: "12px 20px", fontWeight: 600 }}>Date</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600 }}>Journal No.</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600 }}>Description</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Debit</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Credit</th>
                  {(selectedAccount || selectedCustomer) && (
                    <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Balance</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading && processedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={selectedAccount || selectedCustomer ? 7 : 6} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                      Loading ledger data...
                    </td>
                  </tr>
                ) : processedTransactions.map((t, i) => {
                  const date = new Date(t.date || t.createdAt).toLocaleDateString();
                  const ref = t.journalNumber || "-";
                  const desc = t.description || "-";
                  const custName = t.Customer?.name || "-";
                  
                  return (
                    <tr key={t.id || i} style={{ borderBottom: "1px solid #f3f4f6" }} className="hover:bg-gray-50 transition-colors">
                      <td style={{ padding: "12px 20px", color: "#374151", whiteSpace: "nowrap" }}>{date}</td>
                      <td style={{ padding: "12px 20px", color: "#111827", fontWeight: 500, whiteSpace: "nowrap" }}>{ref}</td>
                      <td style={{ padding: "12px 20px", color: "#4b5563", maxWidth: 300, wordBreak: "break-word" }}>{desc}</td>
                      <td style={{ padding: "12px 20px", color: "#4b5563" }}>
                        {custName !== "-" ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <User size={14} color="#9ca3af" /> {custName}
                          </span>
                        ) : "-"}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: t.displayDebit > 0 ? "#111827" : "#e5e7eb" }}>
                        {t.displayDebit > 0 ? t.displayDebit.toLocaleString() : "-"}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: t.displayCredit > 0 ? "#111827" : "#e5e7eb" }}>
                        {t.displayCredit > 0 ? t.displayCredit.toLocaleString() : "-"}
                      </td>
                      {(selectedAccount || selectedCustomer) && (
                        <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 700, color: "#059669" }}>
                          {t.runningBalance.toLocaleString()}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Footer with Totals */}
              {!loading && processedTransactions.length > 0 && (
                <tfoot style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                  <tr>
                    <td colSpan="4" style={{ padding: "16px 20px", fontWeight: 700, color: "#374151", textAlign: "right" }}>
                      Totals:
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#111827" }}>
                      ₹{totalDebit.toLocaleString()}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#111827" }}>
                      ₹{totalCredit.toLocaleString()}
                    </td>
                    {(selectedAccount || selectedCustomer) && (
                      <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 800, fontSize: 15, color: "#059669" }}>
                        ₹{runningBalance.toLocaleString()}
                      </td>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
