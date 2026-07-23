import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const MOCK_INVOICE_DATA = {
  invoiceNo: "INV-2026-001",
  date: "2026-07-20T10:00:00Z",
  dueDate: "2026-08-01T10:00:00Z",
  company: {
    name: "Venueza Grand Hall",
    address: "100 Premium Avenue, Metropolis, NY 10001",
    phone: "+1 234 567 8900",
    email: "billing@venueza.com",
    taxId: "GSTIN9876543210"
  },
  customer: {
    name: "John Doe",
    phone: "+91 9876543210",
    address: "123 Event Street, City, State 12345",
  },
  booking: {
    id: "BKG-2026-1042",
    eventType: "Wedding Reception",
    date: "2026-08-15"
  },
  items: [
    { id: 1, description: "Hall Rental - Grand Ballroom", quantity: 1, rate: 40000, amount: 40000 },
    { id: 2, description: "Catering Deposit", quantity: 1, rate: 5000, amount: 5000 },
    { id: 3, description: "Audio/Visual Package", quantity: 1, rate: 5000, amount: 5000 },
  ],
  subTotal: 50000,
  taxRate: 18,
  taxAmount: 9000,
  totalAmount: 59000,
  totalPaid: 20000,
  balanceDue: 39000,
  amountInWords: "Fifty Nine Thousand Rupees Only",
  terms: "1. 50% advance required for confirmation.\n2. Balance due 14 days before the event.\n3. Cancellations within 30 days are non-refundable."
};

const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val || 0);

export default function TaxInvoice() {
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

  const { invoiceNo, date, dueDate, company, customer, booking, items, subTotal, taxRate, taxAmount, totalAmount, totalPaid, balanceDue, amountInWords, terms } = MOCK_INVOICE_DATA;

  return (
    <div className="page-fade hm-section max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back
        </button>
        <div className="space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium">Export PDF</button>
          <button className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm font-medium flex items-center inline-flex">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden p-10">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">TAX INVOICE</h1>
            <p className="text-gray-500 mt-2 font-medium">Invoice No: {invoiceNo}</p>
            <p className="text-gray-500">Date: {new Date(date).toLocaleDateString()}</p>
            <p className="text-gray-500">Due Date: {new Date(dueDate).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{company.address}</p>
            <p className="text-sm text-gray-600">{company.phone} | {company.email}</p>
            <p className="text-sm text-gray-600 mt-1 font-semibold">Tax ID: {company.taxId}</p>
          </div>
        </div>

        {/* Bill To & Booking Info */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-xs uppercase text-gray-400 font-bold mb-2">Billed To</p>
            <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{customer.address}</p>
            <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-right w-64">
            <p className="text-xs uppercase text-gray-400 font-bold mb-1">Booking Reference</p>
            <p className="font-bold text-gray-900">{booking.id}</p>
            <p className="text-sm text-gray-600">{booking.eventType}</p>
            <p className="text-sm text-gray-600 mt-1">Event: {new Date(booking.date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full text-left mb-8">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl">Description</th>
              <th className="px-4 py-3 font-semibold text-center">Qty</th>
              <th className="px-4 py-3 font-semibold text-right">Rate</th>
              <th className="px-4 py-3 font-semibold text-right rounded-tr">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-x border-b border-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-gray-900">{item.description}</td>
                <td className="px-4 py-4 text-center text-gray-600">{item.quantity}</td>
                <td className="px-4 py-4 text-right font-mono text-gray-600">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-4 text-right font-mono text-gray-900 font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-between items-start mb-12">
          <div className="w-1/2 pr-8">
            <p className="text-xs uppercase text-gray-400 font-bold mb-2">Total in Words</p>
            <p className="text-sm text-gray-700 italic capitalize">"{amountInWords}"</p>
          </div>
          <div className="w-1/2 max-w-sm ml-auto space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({taxRate}%)</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600 font-medium pt-2">
              <span>Amount Paid</span>
              <span className="font-mono">-{formatCurrency(totalPaid)}</span>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-3 rounded flex justify-between text-lg font-bold text-orange-600 mt-2">
              <span>Balance Due</span>
              <span className="font-mono">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Footer & Terms */}
        <div className="border-t border-gray-200 pt-8 flex justify-between items-end">
          <div className="w-2/3">
            <p className="text-xs uppercase text-gray-400 font-bold mb-2">Terms & Conditions</p>
            <p className="text-xs text-gray-500 whitespace-pre-line">{terms}</p>
          </div>
          <div className="w-1/3 text-center">
            <div className="border-t border-gray-400 pt-2 text-sm font-medium text-gray-900 mt-12">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
