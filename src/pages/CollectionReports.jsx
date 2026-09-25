import React, { useState, useEffect } from "react";
import { Download, Wallet, CreditCard, Banknote, Filter, FileText, UserCheck } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/Toast";
import api, { reportsAPI, settingsAPI, isPlanRestriction } from "../services/api";

const cardSt = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20 };
const sTitle = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 16 };

export default function CollectionReports() {
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterExecutive, setFilterExecutive] = useState("All Staff");
  const [filterMode, setFilterMode] = useState("All Modes");

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      setLoading(true);
      await reportsAPI.checkAccess();
      
      const paymentsData = await fetchAllPages("/v1/payments");
      const vendorPaymentsData = await fetchAllPages("/v1/vendors/all-payments");
      
      const allPayments = [...paymentsData, ...vendorPaymentsData];
      setPayments(allPayments);
    } catch (err) {
      console.error(err);
      if (!isPlanRestriction(err)) addToast("Failed to load collections data", "error");
    } finally {
      setLoading(false);
    }
  };

  const extractCollector = (p) => {
    if (p.isVendorPayment) {
      if (p.description && p.description.includes("Collected By:")) {
        const match = p.description.match(/Collected By:\s*([^\n]+)/);
        if (match && match[1]) return match[1].trim();
      }
      return p.creator?.name || p.Vendor?.name || "Vendor";
    }
    
    let collector = p.creator?.name || p.User?.name || "System";
    if (p.notes && p.notes.includes("Collected By:")) {
      const match = p.notes.match(/Collected By:\s*([^\n]+)/);
      if (match && match[1]) collector = match[1].trim();
    }
    return collector;
  };

  const uniqueExecutives = Array.from(new Set(payments.map(p => extractCollector(p)).filter(Boolean)));
  const uniqueModes = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Other"];

  // Helper to check if a date falls within the selected filter
  const isDateInFilter = (dateString) => {
    if (!startDate && !endDate) return true;
    if (!dateString) return false;
    
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    
    d.setHours(0, 0, 0, 0);
    
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      if (d < sDate) return false;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(0, 0, 0, 0);
      if (d > eDate) return false;
    }
    return true;
  };

  const filteredPayments = payments.filter(p => {
    if (p.status !== "Completed") return false;
    
    const pDate = p.paymentDate || p.createdAt;
    if (!isDateInFilter(pDate)) return false;

    if (filterExecutive !== "All Staff") {
      const execName = extractCollector(p);
      if (execName.toLowerCase() !== filterExecutive.toLowerCase()) return false;
    }

    if (filterMode !== "All Modes") {
      if ((p.paymentMode || "").toLowerCase() !== filterMode.toLowerCase()) return false;
    }
    
    return true;
  });

  let totalCollections = 0;
  let upiCollections = 0;
  let cashCollections = 0;
  let otherCollections = 0;

  filteredPayments.forEach(p => {
    totalCollections += (p.amount || 0);
    if (p.paymentMode === "Cash") cashCollections += (p.amount || 0);
    else if (p.paymentMode === "UPI") upiCollections += (p.amount || 0);
    else otherCollections += (p.amount || 0);
  });

  // Formatting helper with negative support
  const formatLakhs = (val) => {
    if (!val) return "₹0";
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const prefix = isNegative ? "-₹" : "₹";
    return absVal >= 100000 ? `${prefix}${(absVal / 100000).toFixed(1)}L` : `${prefix}${absVal.toLocaleString()}`;
  };

  const filterText = (startDate || endDate) ? `${startDate || "..."} to ${endDate || "..."}` : "All Time";

  const handleExportPDF = () => {
    addToast("Preparing report for export...", "success");
    
    const doc = new jsPDF("landscape");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(27, 67, 50);
    doc.text("Collection & Settlement Report", 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Period: ${filterText}`, 14, 30);
    
    doc.setDrawColor(220);
    doc.line(14, 34, 280, 34);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Collection Summary", 14, 42);
    
    const cleanStr = (str) => str.replace(/₹/g, 'Rs. ');
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Collections: ${cleanStr(formatLakhs(totalCollections))}`, 14, 50);
    doc.text(`UPI/Online: ${cleanStr(formatLakhs(upiCollections))}`, 105, 50);
    doc.text(`Cash: ${cleanStr(formatLakhs(cashCollections))}`, 180, 50);

    const tableColumn = ["Date", "Receipt No", "Customer", "Collected By", "Mode", "Reference/UPI/Bank", "Notes", "Amount"];
    const tableRows = [];

    filteredPayments.forEach(p => {
      const date = new Date(p.paymentDate || p.createdAt).toLocaleDateString();
      const name = p.Customer?.name || "Customer";
      const collector = extractCollector(p);
      const mode = p.paymentMode || "Transfer";
      const receiptNo = p.paymentNumber || "-";
      const refDetails = p.referenceNumber || "-";
      const notes = (p.isVendorPayment ? p.description : p.notes) || "-";
      const amount = `+ ${p.amount.toLocaleString()}`;
      tableRows.push([date, receiptNo, name, collector, mode, refDetails, notes, amount]);
    });

    tableRows.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    if (tableRows.length === 0) {
      tableRows.push(["-", "-", "-", "No collections found for this period", "-", "-", "-", "-"]);
    } else {
      tableRows.push([
        "", "", "", "", "", "", "Total:", `Rs. ${totalCollections.toLocaleString()}`
      ]);
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 67, 50] },
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1 && tableRows.length > 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 249, 244];
        }
      },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Collection_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div className="print-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Collection Reports
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Detailed breakdown of staff collections, UPI IDs, and modes.</p>
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
        
        <select value={filterExecutive} onChange={(e) => setFilterExecutive(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Staff">Collected By: All Staff</option>
          {uniqueExecutives.map((exec, i) => (
            <option key={i} value={exec}>{exec}</option>
          ))}
        </select>
        
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="w-full sm:w-auto" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer", background: "#f9fafb" }}>
          <option value="All Modes">Mode: All Modes</option>
          {uniqueModes.map((m, i) => (
            <option key={i} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div id="accounts-report-content" style={{ padding: "10px 0" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Collections", value: formatLakhs(totalCollections), sub: filterText, icon: Wallet, color: "#1B4332", bg: "#f0faf4" },
          { label: "Cash Collected", value: formatLakhs(cashCollections), sub: "Physical cash", icon: Banknote, color: "#059669", bg: "#dcfce7" },
          { label: "UPI & Bank", value: formatLakhs(upiCollections + otherCollections), sub: "Online transfers", icon: CreditCard, color: "#2563eb", bg: "#eff6ff" },
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
      {filteredPayments.length === 0 ? (
        <div style={{ ...cardSt, padding: 60, textAlign: "center" }}>
          <FileText size={48} color="#e5e7eb" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ margin: "0 0 8px", color: "#111827", fontSize: 18, fontWeight: 600 }}>No Collection Data</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>There are no collections matching your selected filters.</p>
        </div>
      ) : (
        <div style={{ ...cardSt, marginTop: 24, padding: "20px 0 0 0", overflow: "hidden" }}>
          <div style={{ padding: "0 20px 16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={sTitle}>Detailed Collections</p>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{filteredPayments.length} Records</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                  <th style={{ padding: "12px 20px", fontWeight: 600 }}>Customer / Receipt</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600 }}>Collected By</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600 }}>Mode & Reference (UPI/Bank)</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600 }}>Notes</th>
                  <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, i) => {
                  const date = new Date(p.paymentDate || p.createdAt).toLocaleDateString();
                  const name = (p.isVendorPayment && p.Vendor) ? `Vendor: ${p.Vendor.name}` : (p.Customer?.name || "Customer");
                  const collector = extractCollector(p);
                  const mode = p.paymentMode || "Transfer";
                  const receiptNo = p.paymentNumber || "-";
                  const refDetails = p.referenceNumber || "-";
                  const notes = (p.isVendorPayment ? p.description : p.notes) || "-";
                  const amount = p.amount || 0;
                  
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }} className="hover:bg-gray-50">
                      <td style={{ padding: "12px 20px", color: "#111827", fontWeight: 500 }}>
                        {name}<br/>
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>{receiptNo}</span>
                        <br/>
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>{date}</span>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#4b5563" }}>
                          <UserCheck size={14} /> {collector}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", color: "#4b5563" }}>
                        <span style={{ fontWeight: 600 }}>{mode}</span><br/>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>Ref: {refDetails}</span>
                      </td>
                      <td style={{ padding: "12px 20px", color: "#6b7280", maxWidth: 200, wordBreak: "break-word" }}>{notes}</td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 700, color: "#059669" }}>
                        + ₹{amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Footer with Totals */}
              <tfoot style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                <tr>
                  <td colSpan="3" style={{ padding: "16px 20px" }}></td>
                  <td style={{ padding: "16px 20px", fontWeight: 700, color: "#374151", textAlign: "right" }}>
                    Total Collections:
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 800, fontSize: 15, color: "#059669" }}>
                    ₹{totalCollections.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
