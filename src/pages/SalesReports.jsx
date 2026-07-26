import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { Download, Users, TrendingUp, Crosshair, Trophy, Filter } from "lucide-react";
import { useToast } from "../components/Toast";
import { enquiriesAPI, settingsAPI } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, margin: 0 };

const COLORS = ["#1B4332", "#D4A017", "#2563eb", "#7c3aed", "#059669"];

export default function SalesReports() {
  const { addToast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState("This Month");
  const [filterHall, setFilterHall] = useState("All Halls");
  const [filterExecutive, setFilterExecutive] = useState("All Staff");
  const [filterPlace, setFilterPlace] = useState("All Locations");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, settingsRes] = await Promise.all([
        enquiriesAPI.getAll(),
        settingsAPI.get().catch(() => ({ data: { data: { halls: [] } } }))
      ]);
      setEnquiries(res.data?.data || []);
      setHalls(settingsRes.data?.data?.halls || []);
    } catch (err) {
      console.error(err);
      addToast("Failed to load report data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter calculations
  const uniqueExecutives = Array.from(new Set(enquiries.map(e => e.SalesExecutive?.name || e.salesExecutiveName).filter(Boolean)));
  const uniquePlaces = Array.from(new Set(enquiries.map(e => e.Customer?.city || e.place).filter(Boolean)));

  const filteredEnquiries = enquiries.filter(e => {
    if (filterHall !== "All Halls" && e.hallPreference !== filterHall && e.hall !== filterHall) return false;
    
    const execName = e.SalesExecutive?.name || e.salesExecutiveName;
    if (filterExecutive !== "All Staff" && execName !== filterExecutive) return false;
    
    const placeName = e.Customer?.city || e.place;
    if (filterPlace !== "All Locations" && placeName !== filterPlace) return false;
    
    if (filterDate !== "All Time") {
      const eDate = new Date(e.createdAt);
      const now = new Date();
      if (filterDate === "This Month") {
        if (eDate.getMonth() !== now.getMonth() || eDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === "Last Month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (eDate.getMonth() !== lastMonth.getMonth() || eDate.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (filterDate === "This Year") {
        if (eDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const totalEnquiries = filteredEnquiries.length;
  const converted = filteredEnquiries.filter(e => e.status === "Booking Confirmed").length;
  const conversionRate = totalEnquiries > 0 ? Math.round((converted / totalEnquiries) * 100) : 0;
  
  const avgDealSize = converted > 0 ? Math.round(filteredEnquiries.filter(e => e.status === "Booking Confirmed").reduce((sum, e) => sum + (e.budget || 0), 0) / converted) : 0;
  const formattedAvgDeal = avgDealSize >= 100000 ? `₹${(avgDealSize / 100000).toFixed(1)}L` : `₹${avgDealSize.toLocaleString()}`;

  const sourceCount = {};
  filteredEnquiries.forEach(e => {
    const src = e.source || "Other";
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  });
  const sourceData = Object.keys(sourceCount).map(k => ({ name: k, value: sourceCount[k] })).sort((a,b) => b.value - a.value);
  const topSource = sourceData.length > 0 ? sourceData[0].name : "N/A";
  const topSourcePercent = totalEnquiries > 0 && sourceData.length > 0 ? Math.round((sourceData[0].value / totalEnquiries) * 100) : 0;

  // Process last 6 months for trend chart
  const trendData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleString('en-US', { month: 'short' });
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendData.push({ month: monthStr, key: yearMonth, enquiries: 0, converted: 0 });
  }

  filteredEnquiries.forEach(e => {
    if (e.createdAt) {
      const d = new Date(e.createdAt);
      if (!isNaN(d)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const trendItem = trendData.find(t => t.key === key);
        if (trendItem) {
          trendItem.enquiries += 1;
          if (e.status === "Booking Confirmed") trendItem.converted += 1;
        }
      }
    }
  });

  const handleExportPDF = () => {
    addToast("Preparing report for export...", "success");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #sales-report-content, #sales-report-content * { visibility: visible; }
            #sales-report-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
            }
            .print-hide { display: none !important; }
          }
        `}
      </style>
      <div className="print-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Sales & CRM Reports
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Track lead generation, conversion rates, and sales performance</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button 
            onClick={handleExportPDF}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="print-hide" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1B4332", fontWeight: 700, fontSize: 13, paddingRight: 10, borderRight: "1px solid #e5e7eb" }}>
          <Filter size={16} /> Filters
        </div>
        
        <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Time">Date: All Time</option>
          <option value="This Month">Date: This Month</option>
          <option value="Last Month">Date: Last Month</option>
          <option value="This Year">Date: This Year</option>
        </select>
        
        <select value={filterHall} onChange={(e) => setFilterHall(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Halls">Hall: All Halls</option>
          {halls.map((h, i) => (
            <option key={i} value={h.name}>{h.name}</option>
          ))}
        </select>
        
        <select value={filterExecutive} onChange={(e) => setFilterExecutive(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Staff">Executive: All Staff</option>
          {uniqueExecutives.map((exec, i) => (
            <option key={i} value={exec}>{exec}</option>
          ))}
        </select>
        
        <select value={filterPlace} onChange={(e) => setFilterPlace(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Locations">Place: All Locations</option>
          {uniquePlaces.map((place, i) => (
            <option key={i} value={place}>{place}</option>
          ))}
        </select>
      </div>

      <div id="sales-report-content" style={{ padding: "10px 0" }}>
        {/* Title for Print Only */}
        <div style={{ display: "none" }} className="print-show">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>Sales & CRM Reports</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px 0" }}>Report Date: {new Date().toLocaleDateString()} | Filter: {filterDate}</p>
        </div>
        <style>{`@media print { .print-show { display: block !important; } }`}</style>
        
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Total Enquiries", value: totalEnquiries, sub: filterDate, icon: Users, color: "#1B4332", bg: "#f0faf4" },
          { label: "Avg. Budgets", value: formattedAvgDeal, sub: "For confirmed leads", icon: TrendingUp, color: "#2563eb", bg: "#eff6ff" },
          { label: "Top Source", value: topSource, sub: `${topSourcePercent}% of leads`, icon: Trophy, color: "#7c3aed", bg: "#f5f3ff" },
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
        
        {/* Conversion Trend */}
        <div style={cardSt}>
          <p style={sTitle}>Enquiry vs Conversion Trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorEnq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A017" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#D4A017" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Area type="monotone" dataKey="enquiries" name="Enquiries" stroke="#1B4332" fillOpacity={1} fill="url(#colorEnq)" strokeWidth={2} />
              <Area type="monotone" dataKey="converted" name="Converted" stroke="#D4A017" fillOpacity={1} fill="url(#colorConv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div style={cardSt}>
          <p style={sTitle}>Lead Sources</p>
          <ResponsiveContainer width="100%" height={220}>
            {sourceData.length > 0 ? (
              <BarChart data={sourceData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {sourceData.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 13 }}>No data</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      </div>
    </div>
  );
}
