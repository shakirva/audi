import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const MOCK_STATEMENT_DATA = {
  customer: {
    name: "John Doe",
    phone: "+91 9876543210",
    email: "johndoe@example.com",
    address: "123 Event Street, City, State 12345",
  },
  booking: {
    id: "BKG-2026-1042",
    date: "2026-08-15",
    eventType: "Wedding Reception",
  },
  period: "01 Jul 2026 to 31 Jul 2026",
  openingBalance: 0,
  closingBalance: 30000,
  transactions: [
    { id: 1, date: "2026-07-19T09:00:00Z", description: "Booking Confirmation (Invoice #INV-2026-01)", type: "Invoice", ref: "INV-2026-01", debit: 50000, credit: 0, balance: 50000 },
    { id: 2, date: "2026-07-20T10:00:00Z", description: "Advance Payment (Receipt #RCP-101)", type: "Payment", ref: "RCP-101", debit: 0, credit: 20000, balance: 30000 },
  ]
};

const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val || 0);

export default function CustomerStatement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="p-8 max-w-4xl mx-auto h-96 bg-gray-100 animate-pulse rounded-xl"></div>;
  }

  const { customer, booking, transactions, period, openingBalance, closingBalance } = MOCK_STATEMENT_DATA;

  return (
    <div className="page-fade hm-section max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back
        </button>
        <div className="space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium">Export Excel</button>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium">Export PDF</button>
          <button className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm font-medium flex items-center inline-flex">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print
          </button>
        </div>
      </div>

      {/* Statement Document */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden p-8">
        
        {/* Header / Branding */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Statement of Account</h1>
            <p className="text-gray-500 mt-2">Period: {period}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">Venueza Grand Hall</h2>
            <p className="text-sm text-gray-500 mt-1">100 Premium Avenue<br/>Metropolis, NY 10001<br/>contact@venueza.com</p>
          </div>
        </div>

        {/* Customer & Booking Details */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs uppercase text-gray-500 font-bold mb-2">Bill To</p>
            <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
            <p className="text-sm text-gray-600">{customer.email}</p>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{customer.address}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500 font-bold mb-2">Booking Reference</p>
            <p className="text-md font-bold text-gray-900">{booking.id}</p>
            <p className="text-sm text-gray-600 mt-1">{booking.eventType}</p>
            <p className="text-sm text-gray-600">Event Date: {new Date(booking.date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 mb-8 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Opening Balance</p>
            <p className="text-xl font-mono text-gray-900 mt-1">{formatCurrency(openingBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Closing Balance (Amount Due)</p>
            <p className="text-2xl font-bold font-mono text-orange-600 mt-1">{formatCurrency(closingBalance)}</p>
          </div>
        </div>

        {/* Statement Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold text-right">Debit</th>
                <th className="px-4 py-3 font-semibold text-right">Credit</th>
                <th className="px-4 py-3 font-semibold text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-4 py-4 font-medium text-gray-900">{tx.description}</td>
                  <td className="px-4 py-4 text-gray-500 text-xs">{tx.ref}</td>
                  <td className="px-4 py-4 text-right font-mono text-gray-600">{tx.debit > 0 ? formatCurrency(tx.debit) : ""}</td>
                  <td className="px-4 py-4 text-right font-mono text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : ""}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-gray-900">{formatCurrency(tx.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-400 border-t border-gray-100 pt-6">
          <p>This is a computer-generated statement and does not require a signature.</p>
        </div>

      </div>
    </div>
  );
}
