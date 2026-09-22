import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Area } from "recharts";
import { Download, Wallet, CreditCard, Banknote, PiggyBank, Filter, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/Toast";
import api, { bookingsAPI, settingsAPI, reportsAPI, paymentsAPI, isPlanRestriction } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 };

export default function AccountsReports() {
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState("All Time");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterHall, setFilterHall] = useState("All Halls");
  const [filterExecutive, setFilterExecutive] = useState("All Staff");
  const [filterPlace, setFilterPlace] = useState("All Locations");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await reportsAPI.checkAccess();
      const [paymentsRes, bookingsRes, expensesRes, settingsRes] = await Promise.all([
        paymentsAPI.getAll({ limit: 10000 }).catch(() => ({ data: { data: [] } })),
        bookingsAPI.getAll().catch(() => ({ data: { data: [] } })),
        api.get("/v1/expenses").catch(() => ({ data: { data: [] } })),
        settingsAPI.get().catch(() => ({ data: { data: { halls: [] } } }))
      ]);

      setPayments(paymentsRes.data?.data || []);
      setBookings(bookingsRes.data?.data || []);
      setExpenses(expensesRes.data?.data || []);
      setHalls(settingsRes.data?.data?.halls || []);
    } catch (err) {
      console.error(err);
      if (!isPlanRestriction(err)) addToast("Failed to load accounts data", "error");
    } finally {
      setLoading(false);
    }
  };

  const uniqueExecutives = Array.from(new Set(bookings.map(b => b.SalesExecutive?.name || b.salesExecutiveName).filter(Boolean)));
  const uniquePlaces = Array.from(new Set(bookings.map(b => b.Customer?.city || b.place || b.address).filter(Boolean)));

  // Helper to check if a date falls within the selected filter
  const isDateInFilter = (dateString) => {
    if (filterDate === "All Time") return true;
    if (!dateString) return false;
    
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    
    const now = new Date();
    
    if (filterDate === "This Month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } else if (filterDate === "Last Month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    } else if (filterDate === "This Year") {
      return d.getFullYear() === now.getFullYear();
    } else if (filterDate === "Custom Date") {
      const time = d.getTime();
      if (customStartDate && time < new Date(customStartDate).getTime()) return false;
      if (customEndDate && time > new Date(customEndDate).getTime() + 86400000) return false;
      return true;
    }
    return true;
  };

  // Helper to check if a booking matches the hall/exec/place filters
  const matchesBookingFilters = (bookingId, customerId) => {
    if (filterHall === "All Halls" && filterExecutive === "All Staff" && filterPlace === "All Locations") return true;
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return false; // If there are filters but no booking, it doesn't match
    
    if (filterHall !== "All Halls" && booking.hall !== filterHall) return false;
    const execName = booking.SalesExecutive?.name || booking.salesExecutiveName;
    if (filterExecutive !== "All Staff" && execName !== filterExecutive) return false;
    const placeName = booking.Customer?.city || booking.place || booking.address;
    if (filterPlace !== "All Locations" && placeName !== filterPlace) return false;
    
    return true;
  };

  const filteredPayments = payments.filter(p => {
    if (p.status !== "Completed") return false;
    if (!isDateInFilter(p.paymentDate || p.createdAt)) return false;
    if (!matchesBookingFilters(p.bookingId, p.customerId)) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (!isDateInFilter(e.date || e.createdAt)) return false;
    // Expenses don't always have bookings, so we might just apply date filter.
    // If strict correlation is needed, we could filter expenses by event/booking if linked.
    return true; 
  });

  let totalRev = 0;
  let totalExp = 0;
  let cashInHand = 0;

  // Process Payments for KPI
  filteredPayments.forEach(p => {
    totalRev += (p.amount || 0);
    if (p.paymentMode === "Cash") {
      cashInHand += (p.amount || 0);
    }
  });

  // Process Expenses for KPI
  filteredExpenses.forEach(e => {
    totalExp += (e.amount || 0);
    // Assuming all expenses are cash out for petty cash calculation
    cashInHand -= (e.amount || 0); 
  });

  const netProfit = totalRev - totalExp;
  const margin = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0;

  // Formatting helper with negative support
  const formatLakhs = (val) => {
    if (!val) return "₹0";
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const prefix = isNegative ? "-₹" : "₹";
    return absVal >= 100000 ? `${prefix}${(absVal / 100000).toFixed(1)}L` : `${prefix}${absVal.toLocaleString()}`;
  };

  // Build dynamic chart data based on selected date filter
  const trendData = [];
  const now = new Date();
  let monthsToGenerate = 6;
  
  if (filterDate === "This Month" || filterDate === "Last Month") {
    monthsToGenerate = 1;
    // For single month, we might still show a few months context or just the single month
    // We will show 3 months context for better visual
    monthsToGenerate = 3;
  } else if (filterDate === "This Year") {
    monthsToGenerate = 12;
  }

  for (let i = monthsToGenerate - 1; i >= 0; i--) {
    let d;
    if (filterDate === "Last Month") {
      d = new Date(now.getFullYear(), now.getMonth() - 1 - i, 1);
    } else {
      d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    }
    const monthStr = d.toLocaleString('en-US', { month: 'short' });
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendData.push({ month: monthStr, key, revenue: 0, expense: 0, profit: 0 });
  }

  // Populate chart with filtered data
  filteredPayments.forEach(p => {
    const pd = new Date(p.paymentDate || p.createdAt);
    if (!isNaN(pd)) {
      const key = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
      const t = trendData.find(x => x.key === key);
      if (t) t.revenue += (p.amount || 0);
    }
  });

  filteredExpenses.forEach(e => {
    const ed = new Date(e.date || e.createdAt);
    if (!isNaN(ed)) {
      const key = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}`;
      const t = trendData.find(x => x.key === key);
      if (t) t.expense += (e.amount || 0);
    }
  });

  trendData.forEach(t => t.profit = t.revenue - t.expense);

  const handleExportPDF = () => {
    addToast("Preparing report for export...", "success");
    
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(27, 67, 50);
    doc.text("Financial Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateStr = filterDate === "Custom Date" 
      ? `${customStartDate || 'Start'} to ${customEndDate || 'End'}`
      : filterDate;
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Period: ${dateStr}`, 14, 30);
    
    doc.setDrawColor(220);
    doc.line(14, 34, 196, 34);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text("Executive Summary", 14, 42);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Gross Revenue: ${formatLakhs(totalRev)}`, 14, 50);
    doc.text(`Total Expenses: ${formatLakhs(totalExp)}`, 105, 50);
    doc.text(`Net Profit: ${formatLakhs(netProfit)}`, 14, 58);
    doc.text(`Profit Margin: ${margin}%`, 105, 58);
    doc.text(`Cash In Hand: ${formatLakhs(cashInHand)}`, 14, 66);

    const tableColumn = ["Date", "Type", "Ref / Mode", "Details", "Amount"];
    const tableRows = [];

    filteredPayments.forEach(p => {
      const date = new Date(p.paymentDate || p.createdAt).toLocaleDateString();
      const booking = bookings.find(b => b.id === p.bookingId);
      const name = booking?.Customer?.name || booking?.customerName || "Customer Payment";
      const mode = p.paymentMode || "Transfer";
      const amount = `+ ${p.amount.toLocaleString()}`;
      tableRows.push([date, "Revenue", mode, name, amount]);
    });

    filteredExpenses.forEach(e => {
      const date = new Date(e.date || e.createdAt).toLocaleDateString();
      const category = e.category || "Expense";
      const desc = e.description || "N/A";
      const amount = `- ${e.amount.toLocaleString()}`;
      tableRows.push([date, "Expense", category, desc, amount]);
    });

    tableRows.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    if (tableRows.length === 0) {
      tableRows.push(["-", "-", "No transactions found for this period", "-", "-"]);
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 67, 50] },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`Financial_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div className="print-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Accounts & Finance
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Comprehensive financial overview based on actual payments.</p>
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
        
        <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Time">Date: All Time</option>
          <option value="This Month">Date: This Month</option>
          <option value="Last Month">Date: Last Month</option>
          <option value="This Year">Date: This Year</option>
          <option value="Custom Date">Date: Custom Date</option>
        </select>
        
        {filterDate === "Custom Date" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", background: "#fff" }} />
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>to</span>
            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", background: "#fff" }} />
          </div>
        )}
        
        <select value={filterHall} onChange={(e) => setFilterHall(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Halls">Hall: All Halls</option>
          {halls.map((h, i) => (
            <option key={i} value={h.name}>{h.name}</option>
          ))}
        </select>
        
        <select value={filterExecutive} onChange={(e) => setFilterExecutive(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Staff">Executive: All Staff</option>
          {uniqueExecutives.map((exec, i) => (
            <option key={i} value={exec}>{exec}</option>
          ))}
        </select>
        
        <select value={filterPlace} onChange={(e) => setFilterPlace(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Locations">Place: All Locations</option>
          {uniquePlaces.map((place, i) => (
            <option key={i} value={place}>{place}</option>
          ))}
        </select>
      </div>

      <div id="accounts-report-content" style={{ padding: "10px 0" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Gross Revenue", value: formatLakhs(totalRev), sub: filterDate, icon: Wallet, color: "#1B4332", bg: "#f0faf4" },
          { label: "Total Expenses", value: formatLakhs(totalExp), sub: "Operational costs", icon: CreditCard, color: "#dc2626", bg: "#fef2f2" },
          { label: "Net Profit", value: formatLakhs(netProfit), sub: `${margin}% Margin`, icon: PiggyBank, color: "#059669", bg: "#dcfce7" },
          { label: "Est. Cash in Hand", value: formatLakhs(cashInHand), sub: "Cash Received - Exp", icon: Banknote, color: "#D4A017", bg: "#fffbeb" },
        ].map(k => (
          <div key={k.label} style={{ ...cardSt, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, color: k.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={22} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{k.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "2px 0" }}>{k.value}</p>
              <p style={{ fontSize: 11, color: k.color, fontWeight: 600, margin: 0 }}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State vs Chart */}
      {filteredPayments.length === 0 && filteredExpenses.length === 0 ? (
        <div style={{ ...cardSt, padding: 60, textAlign: "center" }}>
          <FileText size={48} color="#e5e7eb" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ margin: "0 0 8px", color: "#111827", fontSize: 18, fontWeight: 600 }}>No Financial Data</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>There are no payments or expenses matching your selected filters.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 20 }}>
          <div style={cardSt}>
            <p style={sTitle}>Cash Flow & Profitability Trend</p>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={trendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => formatLakhs(v)} />
                <Tooltip cursor={{ fill: "#f9fafb" }} formatter={v => [formatLakhs(v), ""]} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1B4332" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
