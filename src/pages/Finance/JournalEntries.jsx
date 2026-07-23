import React, { useState, useEffect } from "react";
import { FinancePageLayout, FinanceFilterBar, formatCurrency, StatusBadge } from "./FinanceShared";

const MOCK_JOURNALS = [
  { id: 1, journalNumber: "JV-2026-000040", date: "2026-07-19T09:00:00Z", source: "Booking", ref: "BKG-2026-1042", status: "Posted", debit: 50000, credit: 50000, desc: "Booking Revenue" },
  { id: 2, journalNumber: "JV-2026-000041", date: "2026-07-20T10:00:00Z", source: "Payment", ref: "RCP-101", status: "Posted", debit: 20000, credit: 20000, desc: "Advance Payment" },
  { id: 3, journalNumber: "JV-2026-000042", date: "2026-07-21T10:00:00Z", source: "Adjustment", ref: "ADJ-001", status: "Draft", debit: 500, credit: 500, desc: "Rounding off correction" },
];

export default function JournalEntries() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <FinancePageLayout 
      title="Journal Entries" 
      breadcrumbs={["Accounts", "Journal Entries"]}
      actions={
        <button className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-semibold shadow-sm transition">
          + Manual Journal
        </button>
      }
    >
      <FinanceFilterBar 
        onSearch={() => {}} 
        onExport={() => {}} 
        onPrint={() => {}} 
      />
      
      <div className="bg-white border border-gray-200 shadow-sm rounded-b-2xl overflow-hidden">
        {loading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-8 py-4 font-bold">Journal No</th>
                  <th className="px-8 py-4 font-bold">Date</th>
                  <th className="px-8 py-4 font-bold">Source</th>
                  <th className="px-8 py-4 font-bold">Description</th>
                  <th className="px-8 py-4 font-bold text-center">Status</th>
                  <th className="px-8 py-4 font-bold text-right">Debit</th>
                  <th className="px-8 py-4 font-bold text-right">Credit</th>
                  <th className="px-8 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_JOURNALS.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-8 py-5 font-bold text-gray-900">{row.journalNumber}</td>
                    <td className="px-8 py-5 text-gray-500 font-medium">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                      <span className="block font-bold text-gray-900">{row.source}</span>
                      <span className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer mt-0.5 inline-block">{row.ref}</span>
                    </td>
                    <td className="px-8 py-5 text-gray-600 font-medium">{row.desc}</td>
                    <td className="px-8 py-5 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-gray-900">{formatCurrency(row.debit)}</td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-gray-900">{formatCurrency(row.credit)}</td>
                    <td className="px-8 py-5 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-bold underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FinancePageLayout>
  );
}
