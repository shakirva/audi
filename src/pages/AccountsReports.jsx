import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Area } from "recharts";
import { Download, Wallet, CreditCard, Banknote, PiggyBank, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/Toast";
import api, { bookingsAPI, settingsAPI, isPlanRestriction } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 };

export default function AccountsReports() {
  const { addToast } = useToast();
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
      const [bookingsRes, expensesRes, settingsRes] = await Promise.all([
        bookingsAPI.getAll(),
        api.get("/v1/expenses").catch(() => ({ data: { data: [] } })),
        settingsAPI.get().catch(() => ({ data: { data: { halls: [] } } }))
      ]);

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

  const filteredBookings = bookings.filter(b => {
    if (filterHall !== "All Halls" && b.hall !== filterHall) return false;
    const execName = b.SalesExecutive?.name || b.salesExecutiveName;
    if (filterExecutive !== "All Staff" && execName !== filterExecutive) return false;
    const placeName = b.Customer?.city || b.place || b.address;
    if (filterPlace !== "All Locations" && placeName !== filterPlace) return false;
    
    if (filterDate !== "All Time") {
      const bDate = new Date(b.date || b.createdAt);
      const now = new Date();
      if (filterDate === "This Month") {
        if (bDate.getMonth() !== now.getMonth() || bDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === "Last Month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (bDate.getMonth() !== lastMonth.getMonth() || bDate.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (filterDate === "This Year") {
        if (bDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === "Custom Date") {
        const bTime = bDate.getTime();
        if (customStartDate && bTime < new Date(customStartDate).getTime()) return false;
        // add 86400000 (1 day) to include the end date entirely
        if (customEndDate && bTime > new Date(customEndDate).getTime() + 86400000) return false;
      }
    }
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    // For expenses, we might only be able to filter by Date and Hall (if it has bookingId and we join it, but it might just be date)
    if (filterDate !== "All Time") {
      const eDate = new Date(e.date || e.createdAt);
      const now = new Date();
      if (filterDate === "This Month") {
        if (eDate.getMonth() !== now.getMonth() || eDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === "Last Month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (eDate.getMonth() !== lastMonth.getMonth() || eDate.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (filterDate === "This Year") {
        if (eDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === "Custom Date") {
        const eTime = eDate.getTime();
        if (customStartDate && eTime < new Date(customStartDate).getTime()) return false;
        if (customEndDate && eTime > new Date(customEndDate).getTime() + 86400000) return false;
      }
    }
    return true;
  });

  let totalRev = 0;
  let totalExp = 0;

  const trendData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleString('en-US', { month: 'short' });
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendData.push({ month: monthStr, key, revenue: 0, expense: 0, profit: 0 });
  }

  filteredBookings.forEach(b => {
    if (b.status !== "Cancelled" && (b.date || b.createdAt)) {
      totalRev += (b.totalAmount || 0);
      const bd = new Date(b.date || b.createdAt);
      if (!isNaN(bd)) {
         const key = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}`;
         const t = trendData.find(x => x.key === key);
         if (t) t.revenue += (b.totalAmount || 0);
      }
    }
  });

  filteredExpenses.forEach(e => {
    if (e.date || e.createdAt) {
      totalExp += (e.amount || 0);
      const ed = new Date(e.date || e.createdAt);
      if (!isNaN(ed)) {
         const key = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}`;
         const t = trendData.find(x => x.key === key);
         if (t) t.expense += (e.amount || 0);
      }
    }
  });

  trendData.forEach(t => t.profit = t.revenue - t.expense);

  const netProfit = totalRev - totalExp;
  const margin = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0;
  const cashInHand = totalRev * 0.1;

  const formatLakhs = (val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val.toLocaleString()}`;

  const handleExportPDF = () => {
    addToast("Preparing report for export...", "success");
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Accounts & Finance Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Date: ${new Date().toLocaleDateString()} | Filter: ${filterDate}`, 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Net Revenue: ${formatLakhs(totalRev)}`, 14, 40);
    doc.text(`Total Expenses: ${formatLakhs(totalExp)}`, 105, 40);
    doc.text(`Net Profit: ${formatLakhs(netProfit)}`, 14, 48);
    doc.text(`Margin: ${margin}%`, 105, 48);

    const tableColumn = ["Date", "Type", "Category/Event", "Details", "Amount"];
    const tableRows = [];

    filteredBookings.forEach(b => {
      const date = new Date(b.date || b.createdAt).toLocaleDateString();
      const name = b.Customer?.name || b.customerName || "N/A";
      const event = b.eventType || "N/A";
      const total = b.totalAmount ? `+ Rs ${b.totalAmount}` : "0";
      tableRows.push([date, "Income", event, name, total]);
    });

    filteredExpenses.forEach(e => {
      const date = new Date(e.date || e.createdAt).toLocaleDateString();
      const category = e.category || "N/A";
      const desc = e.description || "N/A";
      const amount = e.amount ? `- Rs ${e.amount}` : "0";
      tableRows.push([date, "Expense", category, desc, amount]);
    });

    tableRows.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 67, 50] }
    });

    doc.save(`Accounts_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #accounts-report-content, #accounts-report-content * { visibility: visible; }
            #accounts-report-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
            }
            .print-hide { display: none !important; }
            .print-show { display: block !important; }
          }
        `}
      </style>
      <div className="print-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Accounts & Finance
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Comprehensive financial overview, cash flow, and profitability</p>
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
        <div className="flex sm:hidden items-center gap-2 mb-2 text-[#1B4332] font-bold text-sm w-full border-b border-gray-100 pb-2">
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
        {/* Title for Print Only */}
        <div style={{ display: "none" }} className="print-show">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>Accounts & Finance Reports</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px 0" }}>Report Date: {new Date().toLocaleDateString()} | Filter: {filterDate}</p>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Net Revenue", value: formatLakhs(totalRev), sub: filterDate, icon: Wallet, color: "#1B4332", bg: "#f0faf4" },
          { label: "Total Expenses", value: formatLakhs(totalExp), sub: "Operational costs", icon: CreditCard, color: "#dc2626", bg: "#fef2f2" },
          { label: "Net Profit", value: formatLakhs(netProfit), sub: `${margin}% Margin`, icon: PiggyBank, color: "#059669", bg: "#dcfce7" },
          { label: "Est. Cash in Hand", value: formatLakhs(cashInHand), sub: "Petty Cash", icon: Banknote, color: "#D4A017", bg: "#fffbeb" },
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

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 20 }}>
        
        {/* Cash Flow */}
        <div style={cardSt}>
          <p style={sTitle}>Cash Flow & Profitability</p>
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
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v}`} />
              <Tooltip cursor={{ fill: "#f9fafb" }} formatter={v => [v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v.toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1B4332" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
    </div>
  );
}
