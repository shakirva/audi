import React, { useState, useEffect } from "react";
import { FinancePageLayout, FinanceFilterBar, formatCurrency } from "./FinanceShared";

export default function BalanceSheet() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const data = {
    totalAssets: 233000,
    totalLiabilitiesAndEquity: 233000,
    assets: {
      current: [
        { name: "Cash in Hand", amount: 33000 },
        { name: "Bank Account (HDFC)", amount: 155000 },
        { name: "Accounts Receivable", amount: 45000 },
      ],
      fixed: [
        { name: "Hall Equipment", amount: 0 },
      ]
    },
    liabilities: [
      { name: "Accounts Payable", amount: 45000 },
      { name: "Customer Advances", amount: 43000 },
    ],
    equity: [
      { name: "Owner's Capital", amount: 50000 },
      { name: "Retained Earnings", amount: 95000 }, // Matches Net Profit in this mock
    ]
  };

  const sumCategory = (arr) => arr.reduce((sum, item) => sum + item.amount, 0);

  return (
    <FinancePageLayout 
      title="Balance Sheet"
      breadcrumbs={["Reports", "Balance Sheet"]}
      actions={
        <button className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold shadow-sm transition">
          Download PDF
        </button>
      }
    >
      <FinanceFilterBar 
        onSearch={() => {}} 
        onExport={() => {}} 
        onPrint={() => {}} 
      />
      
      <div className="bg-white border border-gray-200 shadow-sm rounded-b-2xl overflow-hidden p-8 max-w-5xl mx-auto mt-6">
        {loading ? (
          <div className="h-96 bg-gray-50 animate-pulse rounded-lg"></div>
        ) : (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold font-serif text-gray-900">Balance Sheet</h2>
              <p className="text-gray-500 mt-1">As of 31 Jul 2026</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* ASSETS COLUMN */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-2 mb-4 uppercase">Assets</h3>
                
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Current Assets</h4>
                <div className="space-y-2 mb-6">
                  {data.assets.current.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-gray-700">
                      <span>{item.name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
                
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-t border-gray-100 pt-4">Fixed Assets</h4>
                <div className="space-y-2 mb-8">
                  {data.assets.fixed.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-gray-700">
                      <span>{item.name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-gray-900 font-bold bg-blue-50 p-3 rounded-lg border border-blue-100 mt-auto">
                  <span>Total Assets</span>
                  <span className="font-mono text-lg">{formatCurrency(data.totalAssets)}</span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY COLUMN */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-900 pb-2 mb-4 uppercase">Liabilities & Equity</h3>
                
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Liabilities</h4>
                <div className="space-y-2 mb-6">
                  {data.liabilities.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-gray-700">
                      <span>{item.name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-gray-900 font-bold border-t border-gray-100 mt-2 pt-2">
                    <span className="text-sm">Total Liabilities</span>
                    <span className="font-mono text-sm">{formatCurrency(sumCategory(data.liabilities))}</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-t border-gray-100 pt-4">Equity</h4>
                <div className="space-y-2 mb-8">
                  {data.equity.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-gray-700">
                      <span>{item.name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-gray-900 font-bold border-t border-gray-100 mt-2 pt-2">
                    <span className="text-sm">Total Equity</span>
                    <span className="font-mono text-sm">{formatCurrency(sumCategory(data.equity))}</span>
                  </div>
                </div>

                <div className="flex justify-between text-gray-900 font-bold bg-blue-50 p-3 rounded-lg border border-blue-100 mt-auto">
                  <span>Total Liabilities & Equity</span>
                  <span className="font-mono text-lg">{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </FinancePageLayout>
  );
}
