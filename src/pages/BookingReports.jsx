import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line } from "recharts";
import { Download, CalendarCheck, Ban, CalendarDays, CheckCircle2, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/Toast";
import { bookingsAPI, settingsAPI, reportsAPI, isPlanRestriction } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 };

const COLORS = ["#1B4332", "#D4A017", "#2563eb", "#7c3aed"];

export default function BookingReports() {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterHall, setFilterHall] = useState("All Halls");
  const [filterExecutive, setFilterExecutive] = useState("All Staff");
  const [filterPlace, setFilterPlace] = useState("All Locations");
  const [filterParty, setFilterParty] = useState("All Parties");

  useEffect(() => {
    loadData();
  }, []);

  const fetchAllPages = async (params = {}) => {
    let allData = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      try {
        const res = await bookingsAPI.getAll({ ...params, page, limit: 100 });
        const items = res.data?.data || [];
        allData = [...allData, ...items];
        if (items.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (err) {
        console.error(`Failed to fetch bookings page ${page}`, err);
        hasMore = false;
      }
    }
    return allData;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await reportsAPI.checkAccess();
      const [allBookings, settingsRes] = await Promise.all([
        fetchAllPages(),
        settingsAPI.get().catch(() => ({ data: { data: { halls: [] } } }))
      ]);
      setBookings(allBookings);
      setHalls(settingsRes.data?.data?.halls || []);
    } catch (err) {
      console.error(err);
      if (!isPlanRestriction(err)) addToast("Failed to load booking data", "error");
    } finally {
      setLoading(false);
    }
  };

  const uniqueExecutives = Array.from(new Set(bookings.map(b => b.SalesExecutive?.name || b.salesExecutiveName).filter(Boolean)));
  const uniquePlaces = Array.from(new Set(bookings.map(b => b.Customer?.city || b.place || b.address).filter(Boolean)));
  const standardParties = ["Bride Team", "Groom Team", "Both (Shared Booking)", "Other"];

  const filteredBookings = bookings.filter(b => {
    if (filterHall !== "All Halls" && b.hall !== filterHall) return false;
    
    const execName = b.SalesExecutive?.name || b.salesExecutiveName;
    if (filterExecutive !== "All Staff" && execName !== filterExecutive) return false;
    
    const placeName = b.Customer?.city || b.place || b.address;
    if (filterPlace !== "All Locations" && placeName !== filterPlace) return false;
    
    const partyName = b.bookingParty;
    if (filterParty !== "All Parties" && partyName !== filterParty) return false;
    
    if (startDate || endDate) {
      const bDate = new Date(b.date || b.createdAt);
      bDate.setHours(0, 0, 0, 0);
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (bDate < sDate) return false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(0, 0, 0, 0);
        if (bDate > eDate) return false;
      }
    }
    return true;
  });

  const totalBookings = filteredBookings.length;
  const completed = filteredBookings.filter(b => b.status === "Completed").length;
  const upcoming = filteredBookings.filter(b => b.status === "Confirmed").length;
  const cancelled = filteredBookings.filter(b => b.status === "Cancelled").length;
  const cancelRate = totalBookings > 0 ? ((cancelled / totalBookings) * 100).toFixed(1) : 0;

  // Monthly Volume (last 6 months)
  const trendData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleString('en-US', { month: 'short' });
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendData.push({ month: monthStr, key: yearMonth, bookings: 0 });
  }

  const eventCounts = {};
  
  filteredBookings.forEach(b => {
    // Trend
    if (b.date || b.createdAt) {
      const d = new Date(b.date || b.createdAt);
      if (!isNaN(d)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const trendItem = trendData.find(t => t.key === key);
        if (trendItem) trendItem.bookings += 1;
      }
    }
    
    // Events
    const type = b.eventType || "Other";
    eventCounts[type] = (eventCounts[type] || 0) + 1;
  });

  const eventData = Object.keys(eventCounts).map(k => ({ name: k, value: eventCounts[k] })).sort((a,b) => b.value - a.value);

  const filterText = (startDate || endDate) ? `${startDate || "..."} to ${endDate || "..."}` : "All Time";

  const handleExportPDF = () => {
    addToast("Preparing report for export...", "success");
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Booking Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Date: ${new Date().toLocaleDateString()} | Filter: ${filterText}`, 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Total Bookings: ${totalBookings}`, 14, 40);
    doc.text(`Completed: ${completed}`, 60, 40);
    doc.text(`Upcoming: ${upcoming}`, 100, 40);
    doc.text(`Cancelled: ${cancelled} (${cancelRate}%)`, 140, 40);

    const tableColumn = ["Date", "ID", "Customer", "Event", "Hall", "Status", "Advance", "Total"];
    const tableRows = [];

    filteredBookings.forEach(b => {
      const date = new Date(b.date || b.createdAt).toLocaleDateString();
      const id = b.bookingId || "N/A";
      const name = b.Customer?.name || b.customerName || "N/A";
      const event = b.eventType || "N/A";
      const hall = b.hall || "N/A";
      const status = b.status || "N/A";
      const adv = b.advance ? `Rs ${b.advance}` : "0";
      const total = b.totalAmount ? `Rs ${b.totalAmount}` : "0";
      
      tableRows.push([date, id, name, event, hall, status, adv, total]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 67, 50] }
    });

    doc.save(`Booking_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #booking-report-content, #booking-report-content * { visibility: visible; }
            #booking-report-content {
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
            Booking Reports
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Analyze booking volumes, event types, and cancellations</p>
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
        
        <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Parties">Booked By: All</option>
          {standardParties.map((party, i) => (
            <option key={i} value={party}>{party}</option>
          ))}
        </select>
      </div>

      <div id="booking-report-content" style={{ padding: "10px 0" }}>
        {/* Title for Print Only */}
        <div style={{ display: "none" }} className="print-show">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>Booking Reports</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px 0" }}>Report Date: {new Date().toLocaleDateString()} | Filter: {filterText}</p>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Total Bookings", value: totalBookings, sub: filterText, icon: CalendarDays, color: "#1B4332", bg: "#f0faf4" },
          { label: "Completed", value: completed, sub: "Successfully Executed", icon: CheckCircle2, color: "#059669", bg: "#dcfce7" },
          { label: "Upcoming", value: upcoming, sub: "Scheduled Events", icon: CalendarCheck, color: "#2563eb", bg: "#eff6ff" },
          { label: "Cancelled", value: cancelled, sub: `${cancelRate}% Cancel Rate`, icon: Ban, color: "#dc2626", bg: "#fef2f2" },
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
        
        {/* Booking Volume */}
        <div style={cardSt}>
          <p style={sTitle}>Monthly Booking Volume</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Line type="monotone" dataKey="bookings" stroke="#1B4332" strokeWidth={3} dot={{ fill: "#1B4332", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event Types */}
        <div style={cardSt}>
          <p style={sTitle}>Events Breakdown</p>
          <ResponsiveContainer width="100%" height={260}>
            {eventData.length > 0 ? (
              <BarChart data={eventData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
                  {eventData.slice(0, 5).map((entry, index) => (
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
      {/* Bookings Table */}
      <div style={{ ...cardSt, marginTop: 24, padding: "20px 0 0 0", overflow: "hidden" }}>
        <div style={{ padding: "0 20px 16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={sTitle}>Booking Details</p>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{filteredBookings.length} Records</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>ID</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Customer</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Event / Hall</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Advance</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>No bookings found for this period</td>
                </tr>
              ) : (
                filteredBookings.map((b, i) => {
                  const date = new Date(b.date || b.createdAt).toLocaleDateString();
                  const id = b.bookingId || "N/A";
                  const name = b.Customer?.name || b.customerName || "N/A";
                  const event = b.eventType || "N/A";
                  const hall = b.hall || "N/A";
                  const status = b.status || "N/A";
                  const adv = b.advance ? `₹${b.advance.toLocaleString()}` : "0";
                  const total = b.totalAmount ? `₹${b.totalAmount.toLocaleString()}` : "0";
                  
                  // Color coding for status
                  let statusBg = "#f3f4f6";
                  let statusColor = "#4b5563";
                  if (status === "Completed") { statusBg = "#dcfce7"; statusColor = "#059669"; }
                  else if (status === "Cancelled") { statusBg = "#fef2f2"; statusColor = "#dc2626"; }
                  else if (status === "Confirmed" || status === "Upcoming") { statusBg = "#eff6ff"; statusColor = "#2563eb"; }
                  
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }} className="hover:bg-gray-50">
                      <td style={{ padding: "12px 20px", color: "#374151" }}>{date}</td>
                      <td style={{ padding: "12px 20px", color: "#6b7280", fontSize: 12 }}>{id}</td>
                      <td style={{ padding: "12px 20px", color: "#111827", fontWeight: 500 }}>{name}</td>
                      <td style={{ padding: "12px 20px", color: "#4b5563" }}>{event}<br/><span style={{ fontSize: 11, color: "#9ca3af" }}>{hall}</span></td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: statusBg, color: statusColor }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "#4b5563" }}>{adv}</td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 700, color: "#111827" }}>{total}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Totals */}
            {filteredBookings.length > 0 && (
              <tfoot style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                <tr>
                  <td colSpan="4" style={{ padding: "16px 20px" }}></td>
                  <td style={{ padding: "16px 20px", fontWeight: 700, color: "#374151", textAlign: "right" }}>
                    Grand Totals:
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#4b5563" }}>
                    ₹{filteredBookings.reduce((sum, b) => sum + (Number(b.advance) || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 800, fontSize: 15, color: "#111827" }}>
                    ₹{filteredBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0).toLocaleString()}
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
