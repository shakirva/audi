import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, CreditCard, Receipt as ReceiptIcon, FileText, 
  TrendingUp, Clock, History, LayoutDashboard, Wallet 
} from "lucide-react";
import { accountsAPI, bookingsAPI } from "../../services/api";
import { useToast } from "../../components/Toast";
import CollectPaymentModal from "./CollectPaymentModal";
import AddExpenseModal from "./AddExpenseModal";
import { generateQuotation, generateAgreement, generateInvoice, generateReceiptSummary, generateReceipt, generateStatement } from "../../utils/documentGenerator";

export default function BookingFinancialDashboard() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, [id]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await accountsAPI.getBookingLedger(id);
      setData(res.data.data);
    } catch (err) {
      addToast("Failed to fetch booking financials", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGenerating(true);
      await bookingsAPI.generateInvoice(id);
      addToast("Final Tax Invoice generated successfully", "success");
      fetchLedger();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to generate invoice", "error");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading financial center...</div>;
  }

  if (!data || !data.booking) {
    return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Booking not found.</div>;
  }

  const formatMoney = (val) => `₹${Number(val || 0).toLocaleString()}`;

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "expenses", label: "Expenses", icon: Wallet },
    { id: "customer_ledger", label: "Customer Ledger", icon: FileText },
    { id: "journal", label: "Journal", icon: FileText },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "timeline", label: "Timeline", icon: History },
    { id: "profit", label: "Profit Analysis", icon: TrendingUp },
    { id: "settlement", label: "Settlement", icon: CreditCard },
  ];

  const buildTimeline = () => {
    if (!data) return [];
    const timeline = [];
    
    // Booking Created
    timeline.push({
      id: `booking-${data.booking.id}`,
      date: new Date(data.booking.createdAt),
      title: "Booking Created",
      description: `Booking #${data.booking.bookingId} was created for ${data.booking.customerName}.`,
      type: "booking"
    });

    // Payments
    data.payments.forEach(p => {
      timeline.push({
        id: `payment-${p.id}`,
        date: new Date(p.createdAt),
        title: `Payment Received (₹${p.amount.toLocaleString()})`,
        description: `Payment collected via ${p.paymentMode}. Receipt No: ${p.Receipt?.receiptNumber || "-"}`,
        type: "payment"
      });
    });

    // Expenses
    data.expenses.forEach(e => {
      timeline.push({
        id: `expense-${e.id}`,
        date: new Date(e.createdAt || e.date),
        title: `Expense Added (₹${e.amount.toLocaleString()})`,
        description: `Expense for ${e.category} - ${e.description}.`,
        type: "expense"
      });
    });

    // Invoice
    if (data.booking.invoiceStatus === "Generated") {
      timeline.push({
        id: `invoice-${data.booking.id}`,
        date: new Date(data.booking.updatedAt),
        title: "Final Tax Invoice Generated",
        description: "The booking was financially closed and the final invoice was generated.",
        type: "invoice"
      });
    }

    // Sort descending
    return timeline.sort((a, b) => b.date - a.date);
  };

  const timelineEvents = buildTimeline();

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/finance/booking-accounts" style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 8, borderRadius: 8, color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#0f172a" }}>Booking Financial Center</h1>
            <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              {data.booking.bookingId}
            </span>
          </div>
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Customer: <strong style={{ color: "#334155" }}>{data.booking.Customer?.name}</strong> • Event: {new Date(data.booking.date).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", marginBottom: 32 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid #0f172a" : "2px solid transparent",
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: active ? "#0f172a" : "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 32, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
        
        {activeTab === "overview" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px", color: "#0f172a" }}>Financial Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Booking Amount</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{formatMoney(data.booking.totalAmount)}</div>
              </div>
              <div style={{ padding: 20, background: "#f0fdf4", borderRadius: 12, border: "1px solid #dcfce7" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: 8 }}>Total Received</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{formatMoney(data.totalPaid)}</div>
              </div>
              <div style={{ padding: 20, background: "#fef2f2", borderRadius: 12, border: "1px solid #fee2e2" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", marginBottom: 8 }}>Outstanding</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{formatMoney(data.outstanding)}</div>
              </div>
              <div style={{ padding: 20, background: "#f0f9ff", borderRadius: 12, border: "1px solid #e0f2fe" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#075985", textTransform: "uppercase", marginBottom: 8 }}>Net Profit</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: data.netProfit >= 0 ? "#0ea5e9" : "#dc2626" }}>{formatMoney(data.netProfit)}</div>
                {data.gstAmount > 0 && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>After GST & Expenses</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div style={{ padding: 24, border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#334155" }}>Booking Details</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: "#64748b" }}>Total Amount (Client Pays)</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{formatMoney(data.booking.totalAmount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: "#64748b" }}>Discount</span>
                  <span style={{ fontWeight: 600, color: "#d97706" }}>{formatMoney(data.booking.discount || 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, background: "#fef2f2", margin: "0 -12px 12px", padding: "8px 12px", borderRadius: 6 }}>
                  <span style={{ color: "#991b1b", fontWeight: 600 }}>GST Included (Govt Liability)</span>
                  <span style={{ fontWeight: 700, color: "#dc2626" }}>- {formatMoney(data.gstAmount || data.booking.taxes || 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, background: "#f0fdf4", margin: "0 -12px 12px", padding: "8px 12px", borderRadius: 6 }}>
                  <span style={{ color: "#166534", fontWeight: 600 }}>Your Net Revenue</span>
                  <span style={{ fontWeight: 700, color: "#16a34a" }}>{formatMoney(data.netRevenue || ((data.booking.totalAmount || 0) - (data.gstAmount || data.booking.taxes || 0)))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed #e2e8f0", fontSize: 14 }}>
                  <span style={{ color: "#64748b", fontWeight: 700 }}>Total Booking Expenses</span>
                  <span style={{ fontWeight: 700, color: "#dc2626" }}>{formatMoney(data.totalExpenses)}</span>
                </div>
              </div>

              <div style={{ padding: 24, border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px", color: "#334155" }}>Status Tracking</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: 14 }}>Booking Status</span>
                  <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{data.booking.status}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: 14 }}>Payment Status</span>
                  <span style={{ background: data.outstanding <= 0 ? "#dcfce7" : "#fef3c7", color: data.outstanding <= 0 ? "#15803d" : "#b45309", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                    {data.outstanding <= 0 ? "Fully Paid" : "Partially Paid"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: 14 }}>Invoice Status</span>
                  <span style={{ 
                    background: data.booking.invoiceStatus === "Generated" ? "#f0fdf4" : "#f1f5f9", 
                    color: data.booking.invoiceStatus === "Generated" ? "#15803d" : "#475569", 
                    padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700 
                  }}>
                    {data.booking.invoiceStatus || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>Payments Received</h2>
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                style={{ background: "#0f172a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
              >
                + Collect Payment
              </button>
            </div>
            {data.payments.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No payments recorded yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Receipt No</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Mode</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px", fontWeight: 600, color: "#334155" }}>{p.Receipt?.receiptNumber || "-"}</td>
                      <td style={{ padding: "16px", color: "#475569" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: "16px", color: "#475569" }}>{p.paymentMode}</td>
                      <td style={{ padding: "16px", fontWeight: 700, color: "#16a34a" }}>{formatMoney(p.amount)}</td>
                      <td style={{ padding: "16px", display: "flex", gap: 8 }}>
                        <button onClick={() => generateReceipt(p, data.booking)} style={{ padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>Print Receipt</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "expenses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>Direct Booking Expenses</h2>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                style={{ background: "#0f172a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
              >
                + Add Expense
              </button>
            </div>
            {data.expenses.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No direct expenses recorded yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Category</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Description</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Paid From</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map(e => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px", color: "#475569" }}>{new Date(e.date).toLocaleDateString()}</td>
                      <td style={{ padding: "16px", color: "#475569" }}>{e.category}</td>
                      <td style={{ padding: "16px", color: "#334155", fontWeight: 500 }}>{e.description}</td>
                      <td style={{ padding: "16px", fontWeight: 700, color: "#dc2626" }}>{formatMoney(e.amount)}</td>
                      <td style={{ padding: "16px", color: "#475569" }}>Cash</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "customer_ledger" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>Customer Ledger (For this Booking)</h2>
              <button onClick={() => generateStatement(data)} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13, color: "#334155" }}>Print Statement</button>
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Particulars</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Debit</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Credit</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", color: "#475569" }}>{new Date(data.booking.date).toLocaleDateString()}</td>
                  <td style={{ padding: "16px", color: "#334155", fontWeight: 500 }}>Booking Finalized (Gross Amount)</td>
                  <td style={{ padding: "16px", fontWeight: 700, color: "#dc2626" }}>{formatMoney(data.booking.totalAmount)}</td>
                  <td style={{ padding: "16px", color: "#475569" }}>-</td>
                  <td style={{ padding: "16px", fontWeight: 700, color: "#0f172a" }}>{formatMoney(data.booking.totalAmount)}</td>
                </tr>
                
                {(() => {
                  let runningBalance = data.booking.totalAmount || 0;
                  return [...data.payments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(p => {
                    runningBalance -= p.amount;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px", color: "#475569" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "16px", color: "#334155", fontWeight: 500 }}>Receipt #{p.Receipt?.receiptNumber || "-"} ({p.paymentMode})</td>
                        <td style={{ padding: "16px", color: "#475569" }}>-</td>
                        <td style={{ padding: "16px", fontWeight: 700, color: "#16a34a" }}>{formatMoney(p.amount)}</td>
                        <td style={{ padding: "16px", fontWeight: 700, color: "#0f172a" }}>{formatMoney(runningBalance)}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "journal" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>Background Journal Entries</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>Read-only automatic accounting entries. No manual editing allowed.</p>
            {data.journals.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No journal entries generated.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Voucher</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Description</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Debit A/C</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Credit A/C</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.journals.map(j => (
                    <tr key={j.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px", fontWeight: 600, color: "#334155" }}>{j.Voucher?.voucherNumber}</td>
                      <td style={{ padding: "16px", color: "#475569" }}>{j.description}</td>
                      <td style={{ padding: "16px", color: "#16a34a", fontWeight: 500 }}>{j.DebitAccount?.name}</td>
                      <td style={{ padding: "16px", color: "#dc2626", fontWeight: 500 }}>{j.CreditAccount?.name}</td>
                      <td style={{ padding: "16px", fontWeight: 700, color: "#0f172a" }}>{formatMoney(j.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px", color: "#0f172a" }}>Documents & Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div onClick={() => generateQuotation(data)} style={{ padding: 20, border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "#fff", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"}>
                <FileText size={24} color="#0f172a" />
                <div style={{ fontWeight: 600, color: "#334155" }}>Download Quotation</div>
              </div>
              <div onClick={() => generateAgreement(data)} style={{ padding: 20, border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "#fff", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"}>
                <FileText size={24} color="#0f172a" />
                <div style={{ fontWeight: 600, color: "#334155" }}>Download Booking Agreement</div>
              </div>
              <div onClick={() => generateReceiptSummary(data)} style={{ padding: 20, border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "#fff", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"}>
                <ReceiptIcon size={24} color="#0f172a" />
                <div style={{ fontWeight: 600, color: "#334155" }}>Download Receipts Summary</div>
              </div>
              <div onClick={() => data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised" ? generateInvoice(data) : addToast("Final invoice not generated yet.", "warning")} style={{ padding: 20, border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, cursor: data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised" ? "pointer" : "not-allowed", background: data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised" ? "#fff" : "#f8fafc", opacity: data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised" ? 1 : 0.7, transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }} onMouseEnter={e => (data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised") && (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)")} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"}>
                <FileText size={24} color={data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised" ? "#0f172a" : "#94a3b8"} />
                <div style={{ fontWeight: 600, color: data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised" ? "#334155" : "#94a3b8" }}>Download Final Invoice</div>
              </div>
              
              {(data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised") && (
                <div onClick={() => generateInvoice({ ...data, isRevised: true })} style={{ padding: 20, border: "1px solid #fef3c7", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "#fff", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"}>
                  <FileText size={24} color="#b45309" />
                  <div style={{ fontWeight: 600, color: "#b45309" }}>Download Revised Invoice</div>
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: "#64748b" }}>* Attachments upload functionality is coming soon.</p>
          </div>
        )}

        {activeTab === "timeline" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px", color: "#0f172a" }}>Booking Timeline</h2>
            <div style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "#e2e8f0" }} />
              {timelineEvents.map((event, index) => (
                <div key={event.id} style={{ position: "relative", marginBottom: 32 }}>
                  <div style={{ position: "absolute", left: -24, top: 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", border: "4px solid #0f172a", boxSizing: "border-box" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                    {event.date.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: 14, color: "#475569" }}>
                    {event.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "profit" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px", color: "#0f172a" }}>Profit Analysis</h2>
            <div style={{ padding: 32, background: "#f0f9ff", borderRadius: 16, border: "1px solid #bae6fd", maxWidth: 500 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 16 }}>
                <span style={{ color: "#0369a1", fontWeight: 600 }}>Booking Amount (Client Pays)</span>
                <span style={{ fontWeight: 800, color: "#0369a1" }}>{formatMoney(data.booking.totalAmount)}</span>
              </div>
              {(data.gstAmount || data.booking.taxes || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 16 }}>
                  <span style={{ color: "#991b1b", fontWeight: 600 }}>GST to Government</span>
                  <span style={{ fontWeight: 800, color: "#991b1b" }}>- {formatMoney(data.gstAmount || data.booking.taxes || 0)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 16, background: "#f0fdf4", margin: "0 -16px 16px", padding: "12px 16px", borderRadius: 8 }}>
                <span style={{ color: "#166534", fontWeight: 600 }}>Your Net Revenue</span>
                <span style={{ fontWeight: 800, color: "#166534" }}>{formatMoney(data.netRevenue || ((data.booking.totalAmount || 0) - (data.gstAmount || data.booking.taxes || 0)))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 16 }}>
                <span style={{ color: "#be123c", fontWeight: 600 }}>Direct Expenses</span>
                <span style={{ fontWeight: 800, color: "#be123c" }}>- {formatMoney(data.totalExpenses)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: "2px dashed #bae6fd", fontSize: 20 }}>
                <span style={{ color: "#0f172a", fontWeight: 800 }}>Net Profit</span>
                <span style={{ fontWeight: 800, color: data.netProfit >= 0 ? "#0ea5e9" : "#dc2626" }}>{formatMoney(data.netProfit)}</span>
              </div>
              <div style={{ marginTop: 24, background: "#fff", padding: "12px 16px", borderRadius: 8, display: "flex", justifyContent: "space-between", border: "1px solid #bae6fd" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Profit Margin</span>
                <span style={{ fontWeight: 800, color: data.netProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                  {(data.netRevenue || ((data.booking.totalAmount || 0) - (data.gstAmount || data.booking.taxes || 0))) > 0 
                    ? ((data.netProfit / (data.netRevenue || ((data.booking.totalAmount || 0) - (data.gstAmount || data.booking.taxes || 0)))) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settlement" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>Settlement & Invoicing</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>Generate the final tax invoice when outstanding balance is zero.</p>
            
            <div style={{ padding: 32, border: "1px solid #e2e8f0", borderRadius: 12, maxWidth: 500 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                <span style={{ color: "#475569", fontWeight: 600 }}>Outstanding Balance</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: data.outstanding > 0 ? "#dc2626" : "#16a34a" }}>
                  {formatMoney(data.outstanding)}
                </span>
              </div>

              {data.booking.invoiceStatus === "Generated" || data.booking.invoiceStatus === "Revised" ? (
                data.outstanding > 0 ? (
                  <div style={{ background: "#fef3c7", color: "#b45309", padding: 16, borderRadius: 8, fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
                    Additional charges have been applied after generating the invoice. <br/>
                    Please clear the outstanding balance of {formatMoney(data.outstanding)} to generate a Revised Invoice.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: "#f0fdf4", color: "#166534", padding: 16, borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                      The booking is fully settled. You can download the current invoice or generate a new Revised Invoice to reflect recent changes.
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button 
                        onClick={() => generateInvoice({ ...data, isRevised: true })}
                        style={{ flex: 1, background: "#1B4332", color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                      >
                        Download Revised Invoice
                      </button>
                    </div>
                  </div>
                )
              ) : data.outstanding > 0 ? (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: 16, borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                  Cannot generate Final Tax Invoice until outstanding balance is fully paid.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "#f0fdf4", color: "#166534", padding: 16, borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                    Outstanding is zero. You can now generate the Final Tax Invoice and close the booking.
                  </div>
                  <button 
                    onClick={handleGenerateInvoice}
                    disabled={generating}
                    style={{ background: "#0f172a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", fontSize: 15, opacity: generating ? 0.7 : 1 }}
                  >
                    {generating ? "Generating..." : "Generate Final Tax Invoice"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {isPaymentModalOpen && (
        <CollectPaymentModal
          open={isPaymentModalOpen}
          booking={{ ...data.booking, advance: data.totalPaid, depositAmount: 0 }}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            fetchLedger();
          }}
        />
      )}

      {isExpenseModalOpen && (
        <AddExpenseModal
          open={isExpenseModalOpen}
          defaultBookingId={data.booking.id}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => {
            setIsExpenseModalOpen(false);
            fetchLedger();
          }}
        />
      )}
    </div>
  );
}
