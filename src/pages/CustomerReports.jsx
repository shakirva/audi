import React, { useState, useEffect } from "react";
import { Download, Users, Filter, CheckCircle2, UserCheck, Heart } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/Toast";
import { bookingsAPI } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 };

export default function CustomerReports() {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState("All Time");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await bookingsAPI.getAll();
      setBookings(res.data?.data || []);
    } catch (err) {
      console.error(err);
      addToast("Failed to load customer data", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
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

  const totalCustomers = filteredBookings.length;
  const weddings = filteredBookings.filter(b => (b.eventType || "").toLowerCase().includes("wedding") || (b.eventType || "").toLowerCase().includes("nikkah")).length;
  const completed = filteredBookings.filter(b => b.status === "Completed").length;

  const handleExportPDF = () => {
    addToast("Preparing report for export...", "success");
    
    const doc = new jsPDF("landscape");
    
    doc.setFontSize(18);
    doc.text("Customer & Event Details Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Date: ${new Date().toLocaleDateString()} | Filter: ${filterDate}`, 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Total Customers: ${totalCustomers}`, 14, 40);
    doc.text(`Weddings: ${weddings}`, 70, 40);

    const tableColumn = ["ID", "Customer", "Phone", "Event", "Date", "Hall", "Bride Name", "Groom Name", "City"];
    const tableRows = [];

    filteredBookings.forEach(b => {
      const id = b.bookingId || "N/A";
      const name = b.Customer?.name || b.customerName || "N/A";
      const phone = b.Customer?.phone || b.phone || "N/A";
      const event = b.eventType || "N/A";
      const date = new Date(b.date || b.createdAt).toLocaleDateString();
      const hall = b.hall || "N/A";
      const bride = b.brideName || "N/A";
      const groom = b.groomName || "N/A";
      const city = b.Customer?.city || b.place || b.address || "N/A";
      
      tableRows.push([id, name, phone, event, date, hall, bride, groom, city]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 67, 50] }
    });

    doc.save(`Customer_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Customer Reports
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Detailed report of customers, events, bride, and groom information</p>
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

      {/* Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1B4332", fontWeight: 700, fontSize: 13, paddingRight: 10, borderRight: "1px solid #e5e7eb" }}>
          <Filter size={16} /> Filters
        </div>
        
        <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Time">Date: All Time</option>
          <option value="This Month">Date: This Month</option>
          <option value="Last Month">Date: Last Month</option>
          <option value="This Year">Date: This Year</option>
        </select>
      </div>

      <div style={{ padding: "10px 0" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Total Customers", value: totalCustomers, sub: filterDate, icon: Users, color: "#1B4332", bg: "#f0faf4" },
            { label: "Weddings", value: weddings, sub: "Total Wedding Events", icon: Heart, color: "#dc2626", bg: "#fef2f2" },
            { label: "Completed Events", value: completed, sub: "Successfully Executed", icon: CheckCircle2, color: "#059669", bg: "#dcfce7" },
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

        {/* Data Table */}
        <div style={{ ...cardSt, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ ...sTitle, margin: 0 }}>Customer Directory</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left", fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 24px", fontWeight: 700 }}>Customer Name</th>
                  <th style={{ padding: "12px 24px", fontWeight: 700 }}>Phone</th>
                  <th style={{ padding: "12px 24px", fontWeight: 700 }}>Event</th>
                  <th style={{ padding: "12px 24px", fontWeight: 700 }}>Bride & Groom</th>
                  <th style={{ padding: "12px 24px", fontWeight: 700 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: 30, color: "#9ca3af", fontSize: 14 }}>
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b, i) => (
                    <tr key={b.id || i} style={{ borderBottom: "1px solid #f3f4f6", fontSize: 13, color: "#374151" }}>
                      <td style={{ padding: "16px 24px", fontWeight: 600, color: "#111827" }}>
                        {b.customerName || b.Customer?.name || "N/A"}
                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginTop: 4 }}>{b.Customer?.city || b.place || b.address || ""}</div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>{b.phone || b.Customer?.phone || "N/A"}</td>
                      <td style={{ padding: "16px 24px", fontWeight: 600 }}>{b.eventType || "N/A"}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {b.brideName ? <div><span style={{ color: "#ec4899", fontWeight: 600 }}>B:</span> {b.brideName}</div> : null}
                          {b.groomName ? <div><span style={{ color: "#3b82f6", fontWeight: 600 }}>G:</span> {b.groomName}</div> : null}
                          {!b.brideName && !b.groomName && <span style={{ color: "#9ca3af" }}>-</span>}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>{new Date(b.date || b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
