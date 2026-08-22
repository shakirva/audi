import React, { useState, useEffect } from "react";
import { FinancePageLayout, FinanceFilterBar, FinanceMetricCard, formatCurrency } from "./FinanceShared";

const MOCK_GL_DATA = {
  accountName: "Accounts Receivable",
  accountCode: "1200",
  openingBalance: 15000,
  closingBalance: 45000,
  transactions: [
    { id: 1, date: "2026-07-19", ref: "BKG-2026-1042", journal: "JV-2026-000040", desc: "Booking Confirmed", debit: 50000, credit: 0, balance: 65000 },
    { id: 2, date: "2026-07-20", ref: "RCP-101", journal: "JV-2026-000041", desc: "Advance Payment Received", debit: 0, credit: 20000, balance: 45000 },
  ]
};

export default function GeneralLedger() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <FinancePageLayout 
      title="General Ledger"
      breadcrumbs={["Accounts", "General Ledger"]}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Select Ledger Account</p>
          <select className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:outline-none w-full shadow-sm font-medium">
            <option>1200 - Accounts Receivable</option>
            <option>1100 - Cash in Hand</option>
            <option>4100 - Hall Booking Revenue</option>
          </select>
        </div>
        <FinanceMetricCard title="Opening Balance" amount={MOCK_GL_DATA.openingBalance} />
        <FinanceMetricCard title="Closing Balance" amount={MOCK_GL_DATA.closingBalance} highlight={true} />
      </div>

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
                  <th className="px-8 py-4 font-bold">Date</th>
                  <th className="px-8 py-4 font-bold">Reference</th>
                  <th className="px-8 py-4 font-bold">Description</th>
                  <th className="px-8 py-4 font-bold">Journal No</th>
                  <th className="px-8 py-4 font-bold text-right">Debit</th>
                  <th className="px-8 py-4 font-bold text-right">Credit</th>
                  <th className="px-8 py-4 font-bold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_GL_DATA.transactions.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-8 py-5 text-gray-500 font-medium">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5 font-bold text-blue-600 hover:underline cursor-pointer">{row.ref}</td>
                    <td className="px-8 py-5 text-gray-900 font-medium">{row.desc}</td>
                    <td className="px-8 py-5 text-gray-500 text-xs font-semibold">{row.journal}</td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-gray-600">{row.debit > 0 ? formatCurrency(row.debit) : ""}</td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-gray-600">{row.credit > 0 ? formatCurrency(row.credit) : ""}</td>
                    <td className="px-8 py-5 text-right font-mono font-extrabold text-gray-900">{formatCurrency(row.balance)}</td>
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
