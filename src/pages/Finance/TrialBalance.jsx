import React, { useState, useEffect } from "react";
import { FinancePageLayout, FinanceFilterBar, formatCurrency } from "./FinanceShared";

const MOCK_TB_DATA = [
  { id: 1, code: "1100", name: "Cash in Hand", type: "Asset", debit: 33000, credit: 0 },
  { id: 2, code: "1200", name: "Accounts Receivable", type: "Asset", debit: 45000, credit: 0 },
  { id: 3, code: "1210", name: "Bank Account", type: "Asset", debit: 155000, credit: 0 },
  { id: 4, code: "4100", name: "Hall Booking Revenue", type: "Income", debit: 0, credit: 150000 },
  { id: 5, code: "5100", name: "Operating Expenses", type: "Expense", debit: 12000, credit: 0 },
  { id: 6, code: "2100", name: "Accounts Payable", type: "Liability", debit: 0, credit: 45000 },
  { id: 7, code: "3100", name: "Owner's Equity", type: "Equity", debit: 0, credit: 50000 },
];

export default function TrialBalance() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const totalDebit = MOCK_TB_DATA.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = MOCK_TB_DATA.reduce((sum, item) => sum + item.credit, 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <FinancePageLayout 
      title="Trial Balance"
      breadcrumbs={["Accounts", "Trial Balance"]}
      actions={
        <button className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold shadow-sm transition">
          Download PDF
        </button>
      }
    >
      
      {/* Validation Banner */}
      {!loading && (
        <div className={`mb-6 p-4 rounded-lg flex items-center border ${isBalanced ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {isBalanced ? (
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
          ) : (
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
          )}
          <span className="font-medium text-sm">
            {isBalanced ? "Books are perfectly balanced. Total debits equal total credits." : `Imbalance detected! Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
          </span>
        </div>
      )}

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
                  <th className="px-8 py-4 font-bold">Account Code</th>
                  <th className="px-8 py-4 font-bold">Account Name</th>
                  <th className="px-8 py-4 font-bold">Type</th>
                  <th className="px-8 py-4 font-bold text-right">Debit</th>
                  <th className="px-8 py-4 font-bold text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_TB_DATA.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-8 py-5 font-mono text-gray-500 font-medium">{row.code}</td>
                    <td className="px-8 py-5 font-bold text-gray-900">{row.name}</td>
                    <td className="px-8 py-5 text-gray-500 text-xs font-bold uppercase">{row.type}</td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-gray-600">{row.debit > 0 ? formatCurrency(row.debit) : ""}</td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-gray-600">{row.credit > 0 ? formatCurrency(row.credit) : ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-900 text-white font-bold">
                <tr>
                  <td colSpan="3" className="px-8 py-5 text-right uppercase tracking-wider text-sm text-gray-300">Totals</td>
                  <td className="px-8 py-5 text-right font-mono text-lg">{formatCurrency(totalDebit)}</td>
                  <td className="px-8 py-5 text-right font-mono text-lg">{formatCurrency(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </FinancePageLayout>
  );
}
