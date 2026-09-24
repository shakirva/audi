import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { Download, Users, TrendingUp, Crosshair, Trophy, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/Toast";
import { enquiriesAPI, settingsAPI, reportsAPI, isPlanRestriction } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, margin: 0 };

const COLORS = ["#1B4332", "#D4A017", "#2563eb", "#7c3aed", "#059669"];

export default function SalesReports() {
  const { addToast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
      const [res, settingsRes] = await Promise.all([
        enquiriesAPI.getAll(),
        settingsAPI.get().catch(() => ({ data: { data: { halls: [] } } }))
      ]);
      setEnquiries(res.data?.data || []);
      setHalls(settingsRes.data?.data?.halls || []);
    } catch (err) {
      console.error(err);
      if (!isPlanRestriction(err)) addToast("Failed to load report data", "error");
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
    
    if (startDate || endDate) {
      const eDate = new Date(e.createdAt);
      eDate.setHours(0, 0, 0, 0);
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (eDate < sDate) return false;
      }
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(0, 0, 0, 0);
        if (eDate > endD) return false;
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
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Sales & CRM Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    const filterText = (startDate || endDate) ? `${startDate || "..."} to ${endDate || "..."}` : "All Time";
    doc.text(`Report Date: ${new Date().toLocaleDateString()} | Filter: ${filterText}`, 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Total Enquiries: ${totalEnquiries}`, 14, 40);
    doc.text(`Avg. Budgets: ${formattedAvgDeal}`, 80, 40);
    doc.text(`Top Source: ${topSource} (${topSourcePercent}%)`, 140, 40);

    const tableColumn = ["Date", "Customer", "Phone", "Location", "Event", "Hall", "Status", "Executive", "Budget"];
    const tableRows = [];

    filteredEnquiries.forEach(e => {
      const date = new Date(e.createdAt).toLocaleDateString();
      const name = e.Customer?.name || e.enquirerName || e.customerName || "N/A";
      const phone = e.Customer?.phone || e.enquirerPhone || e.phone || "N/A";
      const location = e.Customer?.city || e.place || "N/A";
      const event = e.eventType || "N/A";
      const hall = e.hallPreference || e.hall || "N/A";
      const status = e.status || "N/A";
      const exec = e.SalesExecutive?.name || e.salesExecutiveName || "N/A";
      const budget = e.budget ? `Rs ${e.budget}` : "N/A";
      tableRows.push([date, name, phone, location, event, hall, status, exec, budget]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 67, 50] }
    });

    doc.save(`Sales_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const filterText = (startDate || endDate) ? `${startDate || "..."} to ${endDate || "..."}` : "All Time";

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
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>From:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", background: "#f9fafb" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>To:</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", background: "#f9fafb" }} />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ marginLeft: 8, padding: "4px 8px", fontSize: 11, background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", color: "#64748b" }}>Clear</button>
          )}
        </div>
        
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

      <div id="sales-report-content" style={{ padding: "10px 0" }}>
        {/* Title for Print Only */}
        <div style={{ display: "none" }} className="print-show">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>Sales & CRM Reports</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px 0" }}>Report Date: {new Date().toLocaleDateString()} | Filter: {filterText}</p>
        </div>
        <style>{`@media print { .print-show { display: block !important; } }`}</style>
        
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Total Enquiries", value: totalEnquiries, sub: filterText, icon: Users, color: "#1B4332", bg: "#f0faf4" },
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
      {/* Enquiries Table */}
      <div style={{ ...cardSt, marginTop: 24, padding: "20px 0 0 0", overflow: "hidden" }}>
        <div style={{ padding: "0 20px 16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={sTitle}>Enquiry Details</p>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{filteredEnquiries.length} Records</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Customer</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Phone</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Location</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Event / Hall</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Executive</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Budget</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>No enquiries found for this period</td>
                </tr>
              ) : (
                filteredEnquiries.map((e, i) => {
                  const date = new Date(e.createdAt).toLocaleDateString();
                  const name = e.Customer?.name || e.enquirerName || e.customerName || "N/A";
                  const phone = e.Customer?.phone || e.enquirerPhone || e.phone || "N/A";
                  const location = e.Customer?.city || e.place || "N/A";
                  const event = e.eventType || "N/A";
                  const hall = e.hallPreference || e.hall || "N/A";
                  const status = e.status || "N/A";
                  const exec = e.SalesExecutive?.name || e.salesExecutiveName || "N/A";
                  const budget = e.budget ? `₹${e.budget.toLocaleString()}` : "N/A";
                  
                  // Color coding for status
                  let statusBg = "#f3f4f6";
                  let statusColor = "#4b5563";
                  if (status === "Booking Confirmed") { statusBg = "#dcfce7"; statusColor = "#059669"; }
                  else if (status === "Closed Lost") { statusBg = "#fef2f2"; statusColor = "#dc2626"; }
                  else if (status === "Negotiation") { statusBg = "#fffbeb"; statusColor = "#D4A017"; }
                  else if (status === "Site Visit") { statusBg = "#eff6ff"; statusColor = "#2563eb"; }
                  
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }} className="hover:bg-gray-50">
                      <td style={{ padding: "12px 20px", color: "#374151" }}>{date}</td>
                      <td style={{ padding: "12px 20px", color: "#111827", fontWeight: 500 }}>{name}</td>
                      <td style={{ padding: "12px 20px", color: "#4b5563" }}>{phone}</td>
                      <td style={{ padding: "12px 20px", color: "#4b5563" }}>{location}</td>
                      <td style={{ padding: "12px 20px", color: "#4b5563" }}>{event}<br/><span style={{ fontSize: 11, color: "#9ca3af" }}>{hall}</span></td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: statusBg, color: statusColor }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", color: "#4b5563" }}>{exec}</td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "#374151" }}>{budget}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Totals */}
            {filteredEnquiries.length > 0 && (
              <tfoot style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                <tr>
                  <td colSpan="5" style={{ padding: "16px 20px" }}></td>
                  <td style={{ padding: "16px 20px", fontWeight: 700, color: "#374151", textAlign: "right" }}>
                    Total Estimated Budget:
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 800, fontSize: 15, color: "#111827" }}>
                    ₹{filteredEnquiries.reduce((sum, e) => sum + (Number(e.budget) || 0), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
