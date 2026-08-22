import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatCurrency, StatusBadge } from "./FinanceShared";

const USE_MOCK = true; // Still keeping a fallback for safety during UI demo, can switch to false

const MOCK_SUMMARY = {
  overview: {
    bookingId: "BKG-2026-1042",
    customerName: "Sharma Wedding",
    customerPhone: "+91 9876543210",
    eventType: "Wedding",
    date: "2026-12-15",
    status: "Confirmed",
    hall: "Grand Ballroom"
  },
  financialSummary: {
    totalAmount: 250000,
    advance: 50000,
    totalCollected: 150000,
    outstandingBalance: 100000,
    totalExpenses: 45000,
    netProfit: 205000,
    profitMargin: 82
  },
  paymentTimeline: [
    { id: 1, receiptNo: "RCP-1042", date: "2026-07-20T10:00:00Z", amount: 100000, mode: "Bank Transfer", status: "Completed" },
    { id: 2, receiptNo: "RCP-1010", date: "2026-06-15T09:00:00Z", amount: 50000, mode: "Card", status: "Completed" }
  ],
  statement: [
    { id: 1, date: "2026-06-15T09:00:00Z", desc: "Booking Confirmed - Advance", debit: 250000, credit: 0, balance: 250000 },
    { id: 2, date: "2026-06-15T09:05:00Z", desc: "Advance Payment Received", debit: 0, credit: 50000, balance: 200000 },
    { id: 3, date: "2026-07-20T10:00:00Z", desc: "Part Payment Received", debit: 0, credit: 100000, balance: 100000 }
  ],
  expenses: [
    { id: 1, category: "Catering", vendor: "Royal Feasts", amount: 30000, status: "Paid", notes: "Lunch buffer" },
    { id: 2, category: "Cleaning", vendor: "CleanCo", amount: 15000, status: "Pending", notes: "Post-event clean" }
  ],
  documents: [
    { id: 1, type: "Receipt", ref: "RCP-1042", date: "2026-07-20T10:00:00Z", amount: 100000 },
    { id: 2, type: "Receipt", ref: "RCP-1010", date: "2026-06-15T09:00:00Z", amount: 50000 },
  ],
  auditLogs: [
    { id: 1, action: "Payment Added", details: "Added 100000 via Bank Transfer", date: "2026-07-20T10:00:00Z", user: "Admin" },
    { id: 2, action: "Booking Created", details: "Created with Advance", date: "2026-06-15T09:00:00Z", user: "Admin" }
  ]
};

const fetchBookingSummary = async (id) => {
  const token = localStorage.getItem("hm_token");
  const res = await axios.get(`http://localhost:3000/api/v1/finance/booking-summary/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export default function BookingFinancialCenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("timeline");

  const { data: liveData, isLoading, error } = useQuery({
    queryKey: ["bookingSummary", id],
    queryFn: () => fetchBookingSummary(id),
    enabled: !USE_MOCK,
  });

  const loading = USE_MOCK ? false : isLoading;
  const data = (USE_MOCK || error) ? MOCK_SUMMARY : liveData;

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-32 bg-gray-200 animate-pulse rounded-xl"></div>
        <div className="grid grid-cols-5 gap-4"><div className="col-span-5 h-24 bg-gray-200 animate-pulse rounded-xl"></div></div>
        <div className="h-64 bg-gray-200 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  const { overview, financialSummary, paymentTimeline, statement, expenses, documents, auditLogs } = data;

  const tabs = [
    { id: "timeline", label: "Payment Timeline" },
    { id: "statement", label: "Customer Statement" },
    { id: "documents", label: "Receipts & Documents" },
    { id: "expenses", label: "Booking Expenses" },
    { id: "audit", label: "Audit History" },
  ];

  return (
    <div className="page-fade bg-[#F9FAFB] min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 md:px-12 md:py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-900 transition bg-gray-50 hover:bg-gray-100 rounded-lg p-2 border border-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold font-serif text-gray-900 flex items-center tracking-tight">
                Financial Center
                <span className={`ml-3 px-3 py-1 text-xs rounded-md font-sans uppercase tracking-wider font-bold ${overview.status === 'Confirmed' || overview.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {overview.status}
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-1 font-medium">{overview.bookingId} • {overview.customerName} • {overview.eventType}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold shadow-sm transition">
              Add Expense
            </button>
            <button className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-semibold shadow-sm transition">
              Record Payment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-8 md:px-12 md:py-10">
        
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Booking Amount</p>
            <p className="text-2xl font-bold text-gray-900 font-mono mt-1">{formatCurrency(financialSummary.totalAmount)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 font-mono mt-1">{formatCurrency(financialSummary.totalCollected)}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-orange-800 font-semibold uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold text-orange-600 font-mono mt-1">{formatCurrency(financialSummary.outstandingBalance)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500 font-mono mt-1">{formatCurrency(financialSummary.totalExpenses)}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Net Profit</p>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">{financialSummary.profitMargin}%</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">{formatCurrency(financialSummary.netProfit)}</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm ${
                activeTab === tab.id
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          {activeTab === "timeline" && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif">Payment Timeline</h3>
              <div className="space-y-6">
                {paymentTimeline.map((payment) => (
                  <div key={payment.id} className="flex relative pl-8 border-l-2 border-green-200 last:border-l-0 pb-6 last:pb-0">
                    <div className="absolute w-4 h-4 bg-green-500 rounded-full -left-[9px] top-1 border-4 border-white shadow-sm"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500">{new Date(payment.date).toLocaleString()}</p>
                      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-5 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{payment.receiptNo}</p>
                          <p className="text-sm font-medium text-gray-500 mt-0.5">Mode: {payment.mode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 font-mono text-2xl">{formatCurrency(payment.amount)}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-bold uppercase">{payment.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {paymentTimeline.length === 0 && <p className="text-gray-500">No payments recorded yet.</p>}
              </div>
            </div>
          )}

          {activeTab === "statement" && (
            <div>
              <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900">Customer Statement</h3>
                <button className="text-sm text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 font-semibold shadow-sm transition">Export Statement PDF</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-8 py-4 font-bold">Date</th>
                      <th className="px-8 py-4 font-bold">Description</th>
                      <th className="px-8 py-4 font-bold text-right">Debit</th>
                      <th className="px-8 py-4 font-bold text-right">Credit</th>
                      <th className="px-8 py-4 font-bold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statement.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/50 transition">
                        <td className="px-8 py-5 text-gray-500 font-medium">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="px-8 py-5 font-bold text-gray-900">{row.desc}</td>
                        <td className="px-8 py-5 text-right font-mono font-bold text-gray-600">{row.debit > 0 ? formatCurrency(row.debit) : "-"}</td>
                        <td className="px-8 py-5 text-right font-mono font-bold text-green-600">{row.credit > 0 ? formatCurrency(row.credit) : "-"}</td>
                        <td className="px-8 py-5 text-right font-mono font-extrabold text-gray-900">{formatCurrency(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif">Receipts & Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map(doc => (
                  <div key={doc.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded">{doc.type}</span>
                        <span className="text-sm font-semibold text-gray-400">{new Date(doc.date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-gray-900 text-lg mb-1">{doc.ref}</p>
                      <p className="font-mono font-bold text-gray-600">{formatCurrency(doc.amount)}</p>
                    </div>
                    <button className="mt-4 w-full text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 py-2 rounded-lg hover:bg-gray-100 transition">View Document</button>
                  </div>
                ))}
                {documents.length === 0 && <p className="text-gray-500 col-span-full">No documents available.</p>}
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-8 py-4 font-bold">Vendor & Category</th>
                    <th className="px-8 py-4 font-bold">Notes</th>
                    <th className="px-8 py-4 font-bold">Status</th>
                    <th className="px-8 py-4 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-8 py-5">
                        <span className="block font-bold text-gray-900">{row.vendor}</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase">{row.category}</span>
                      </td>
                      <td className="px-8 py-5 text-gray-600 font-medium">{row.notes || "-"}</td>
                      <td className="px-8 py-5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-8 py-5 text-right font-mono font-bold text-red-500">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan="4" className="px-8 py-5 text-center text-gray-500">No expenses recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif">Audit Timeline</h3>
              <div className="space-y-6 pl-4 border-l-2 border-gray-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[23px] top-1.5 border-2 border-white"></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{log.action}</p>
                      <p className="text-sm font-medium text-gray-600 mt-0.5">{log.details}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-1">{new Date(log.date).toLocaleString()} • by {log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
