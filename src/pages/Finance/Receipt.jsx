import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const MOCK_RECEIPT_DATA = {
  receiptNo: "RCP-2026-101",
  date: "2026-07-20T10:00:00Z",
  paymentMode: "Bank Transfer",
  ref: "TXN-987654321",
  amount: 20000,
  amountInWords: "Twenty Thousand Rupees Only",
  customer: {
    name: "John Doe",
    phone: "+91 9876543210"
  },
  booking: {
    id: "BKG-2026-1042",
    eventType: "Wedding Reception",
    date: "2026-08-15"
  },
  receivedBy: "Admin User",
  notes: "Advance payment received."
};

const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val || 0);

export default function Receipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="p-8 max-w-3xl mx-auto h-96 bg-gray-100 animate-pulse rounded-xl"></div>;
  }

  const { receiptNo, date, paymentMode, ref, amount, amountInWords, customer, booking, receivedBy, notes } = MOCK_RECEIPT_DATA;

  return (
    <div className="page-fade hm-section max-w-3xl mx-auto">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back
        </button>
        <div className="space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium">Download PDF</button>
          <button className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm font-medium flex items-center inline-flex">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print Receipt
          </button>
        </div>
      </div>

      {/* Receipt Document */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden relative">
        {/* Decorative Top Border */}
        <div className="h-2 bg-gray-900 w-full"></div>
        
        <div className="p-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Venueza Grand Hall</h1>
              <p className="text-sm text-gray-500 mt-1">100 Premium Avenue, Metropolis</p>
              <p className="text-sm text-gray-500">Phone: +1 234 567 8900</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-200 uppercase tracking-widest">Receipt</h2>
              <p className="text-gray-900 font-bold mt-2">{receiptNo}</p>
              <p className="text-sm text-gray-500">Date: {new Date(date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Amount Callout */}
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 mb-8 text-center">
            <p className="text-sm text-gray-500 uppercase font-medium">Amount Received</p>
            <p className="text-4xl font-bold font-mono text-green-600 mt-2">{formatCurrency(amount)}</p>
            <p className="text-sm text-gray-600 mt-2 italic capitalize">"{amountInWords}"</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-10">
            <div>
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">Received From</p>
              <p className="text-base font-bold text-gray-900">{customer.name}</p>
              <p className="text-sm text-gray-600">{customer.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">Payment Mode</p>
              <p className="text-base font-bold text-gray-900">{paymentMode}</p>
              <p className="text-sm text-gray-600">Ref: {ref}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">For Booking</p>
              <p className="text-base font-bold text-gray-900">{booking.id}</p>
              <p className="text-sm text-gray-600">{booking.eventType} on {new Date(booking.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">Received By</p>
              <p className="text-base font-bold text-gray-900">{receivedBy}</p>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="border-t border-gray-100 pt-6 mb-8">
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">Notes</p>
              <p className="text-sm text-gray-700">{notes}</p>
            </div>
          )}
          
          {/* Signatures */}
          <div className="flex justify-between items-end mt-16 pt-8">
            <div className="text-center w-48">
              <div className="border-t border-gray-300 pt-2 text-sm text-gray-500">Customer Signature</div>
            </div>
            <div className="text-center w-48">
              <div className="border-t border-gray-300 pt-2 text-sm text-gray-500">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
