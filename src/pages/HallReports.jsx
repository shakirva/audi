import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Download, Calendar, TrendingUp, AlertCircle, Building2, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/Toast";
import { bookingsAPI, settingsAPI, reportsAPI, isPlanRestriction } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 };

const COLORS = ["#1B4332", "#D4A017", "#2563eb", "#7c3aed", "#059669"];

export default function HallReports() {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState("All Time");
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
      const [bookRes, settingsRes] = await Promise.all([
        bookingsAPI.getAll(),
        settingsAPI.get().catch(() => ({ data: { data: { halls: [] } } }))
      ]);
      setBookings(bookRes.data?.data || []);
      setHalls(settingsRes.data?.data?.halls || []);
    } catch (err) {
      console.error(err);
      if (!isPlanRestriction(err)) addToast("Failed to load hall data", "error");
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
      }
    }
    return true;
  });

  const hallMap = {};
  
  halls.forEach(h => {
    hallMap[h.name] = { name: h.name, revenue: 0, bookings: 0 };
  });

  let totalBookings = 0;
  
  filteredBookings.forEach(b => {
    if (b.status !== "Cancelled") {
      const h = b.hall;
      if (h) {
        if (!hallMap[h]) hallMap[h] = { name: h, revenue: 0, bookings: 0 };
        hallMap[h].bookings += 1;
        hallMap[h].revenue += (b.totalAmount || 0);
        totalBookings += 1;
      }
    }
  });

  let hallData = Object.values(hallMap).sort((a,b) => b.revenue - a.revenue);
  if (halls.length > 0) {
    hallData = hallData.filter(h => halls.some(m => m.name === h.name));
  } else {
    hallData = hallData.filter(h => h.bookings > 0);
  }
  
  const topHall = hallData.length > 0 ? hallData[0] : null;
  const topHallName = topHall ? topHall.name : "N/A";
  const topHallRev = topHall ? (topHall.revenue >= 100000 ? `₹${(topHall.revenue / 100000).toFixed(1)}L` : `₹${topHall.revenue.toLocaleString()}`) : "₹0";

  const handleExportPDF = () => {
    addToast("Preparing report for export...", "success");
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Hall Performance Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Date: ${new Date().toLocaleDateString()} | Filter: ${filterDate}`, 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Top Performing Hall: ${topHallName}`, 14, 40);
    doc.text(`Total Hall Bookings: ${totalBookings}`, 100, 40);

    const tableColumn = ["Hall", "Bookings", "Total Revenue"];
    const tableRows = [];

    hallData.forEach(h => {
      tableRows.push([h.name, h.bookings, `Rs ${h.revenue}`]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [27, 67, 50] }
    });

    doc.save(`Hall_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #hall-report-content, #hall-report-content * { visibility: visible; }
            #hall-report-content {
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
            Hall Performance
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Compare revenue, occupancy, and utilization across venues</p>
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
        </select>
        
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

      <div id="hall-report-content" style={{ padding: "10px 0" }}>
        {/* Title for Print Only */}
        <div style={{ display: "none" }} className="print-show">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>Hall Performance Reports</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px 0" }}>Report Date: {new Date().toLocaleDateString()} | Filter: {filterDate}</p>
        </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Top Performing Hall", value: topHallName, sub: `${topHallRev} Revenue`, icon: Building2, color: "#1B4332", bg: "#f0faf4" },
          { label: "Total Hall Bookings", value: totalBookings, sub: "Across all halls", icon: Calendar, color: "#2563eb", bg: "#eff6ff" },
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
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
        
        {/* Revenue Comparison */}
        <div style={cardSt}>
          <p style={sTitle}>Revenue Comparison</p>
          <ResponsiveContainer width="100%" height={260}>
            {hallData.length > 0 ? (
              <BarChart data={hallData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 100000 ? `₹${v/100000}L` : `₹${v}`} />
                <Tooltip cursor={{ fill: "#f9fafb" }} formatter={v => [v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {hallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 13 }}>No data</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Occupancy Share */}
        <div style={cardSt}>
          <p style={sTitle}>Booking Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            {hallData.length > 0 ? (
              <PieChart>
                <Pie data={hallData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="bookings">
                  {hallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 13 }}>No data</div>
            )}
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {hallData.map((h, i) => (
              <div key={h.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151", fontWeight: 500 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length] }} /> {h.name}
                </span>
                <span style={{ fontWeight: 700, color: "#111827" }}>{h.bookings}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
