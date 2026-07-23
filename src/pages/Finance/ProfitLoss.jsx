import React, { useState, useEffect } from "react";
import { FinancePageLayout, FinanceFilterBar, formatCurrency } from "./FinanceShared";

export default function ProfitLoss() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const data = {
    revenue: 150000,
    cogs: 20000,
    grossProfit: 130000,
    operatingExpenses: 35000,
    netProfit: 95000,
    revenueItems: [
      { name: "Hall Booking Revenue", amount: 120000 },
      { name: "Catering Income", amount: 30000 },
    ],
    expenseItems: [
      { name: "Staff Salaries", amount: 15000 },
      { name: "Electricity & Utilities", amount: 12000 },
      { name: "Cleaning & Maintenance", amount: 8000 },
    ]
  };

  return (
    <FinancePageLayout 
      title="Profit & Loss Statement"
      breadcrumbs={["Reports", "Profit & Loss"]}
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
      
      <div className="bg-white border border-gray-200 shadow-sm rounded-b-2xl overflow-hidden p-8 max-w-4xl mx-auto mt-6">
        {loading ? (
          <div className="h-96 bg-gray-50 animate-pulse rounded-lg"></div>
        ) : (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold font-serif text-gray-900">Profit & Loss Statement</h2>
              <p className="text-gray-500 mt-1">For the period: 01 Jul 2026 to 31 Jul 2026</p>
            </div>

            {/* Income Section */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">Income</h3>
              <div className="space-y-3">
                {data.revenueItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-gray-700">
                    <span>{item.name}</span>
                    <span className="font-mono">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-gray-900 font-bold border-t border-gray-100 mt-4 pt-4">
                <span>Total Income</span>
                <span className="font-mono">{formatCurrency(data.revenue)}</span>
              </div>
            </div>

            {/* COGS (Optional for service businesses, but good structure) */}
            <div className="mb-8">
              <div className="flex justify-between text-gray-700 mb-4">
                <span>Less: Direct Costs of Sales</span>
                <span className="font-mono text-red-500">-{formatCurrency(data.cogs)}</span>
              </div>
              <div className="flex justify-between text-gray-900 font-bold bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span>Gross Profit</span>
                <span className="font-mono">{formatCurrency(data.grossProfit)}</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">Operating Expenses</h3>
              <div className="space-y-3">
                {data.expenseItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-gray-700">
                    <span>{item.name}</span>
                    <span className="font-mono">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-gray-900 font-bold border-t border-gray-100 mt-4 pt-4">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-red-500">{formatCurrency(data.operatingExpenses)}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between items-center text-white font-bold bg-green-600 p-4 rounded-lg shadow-sm">
              <span className="text-lg">Net Profit</span>
              <span className="font-mono text-2xl">{formatCurrency(data.netProfit)}</span>
            </div>

          </div>
        )}
      </div>
    </FinancePageLayout>
  );
}
