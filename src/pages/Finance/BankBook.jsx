import React, { useState, useEffect } from "react";
import { PageLayout, MetricGrid, MetricCard, TableToolbar, DataTable, Button, formatCurrency } from "../../components/ui/VDS";

const MOCK_BANKBOOK = [
  { id: 1, date: "2026-07-19T09:00:00Z", type: "Opening", ref: "-", desc: "Opening Balance", debit: 120000, credit: 0, balance: 120000 },
  { id: 2, date: "2026-07-20T10:00:00Z", type: "Receipt", ref: "TXN-98765", desc: "Advance for BKG-2026-1045", debit: 50000, credit: 0, balance: 170000 },
  { id: 3, date: "2026-07-21T11:00:00Z", type: "Payment", ref: "NEFT-1234", desc: "Vendor Payment - Caterer", debit: 0, credit: 15000, balance: 155000 },
];

export default function BankBook() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const columns = [
    { label: "Date", render: (row) => new Date(row.date).toLocaleDateString() },
    { 
      label: "Type & Ref", 
      render: (row) => (
        <div>
          <span className="block font-bold text-gray-900">{row.type}</span>
          <span className="text-xs font-semibold text-gray-400 mt-0.5 inline-block">{row.ref}</span>
        </div>
      ) 
    },
    { label: "Description", render: (row) => <span className="text-gray-600 font-medium">{row.desc}</span> },
    { label: "Bank In (Dr)", align: "right", render: (row) => <span className="font-mono font-bold text-green-600">{row.debit > 0 ? formatCurrency(row.debit) : "-"}</span> },
    { label: "Bank Out (Cr)", align: "right", render: (row) => <span className="font-mono font-bold text-red-500">{row.credit > 0 ? formatCurrency(row.credit) : "-"}</span> },
    { label: "Balance", align: "right", render: (row) => <span className="font-mono font-extrabold text-gray-900">{formatCurrency(row.balance)}</span> }
  ];

  return (
    <PageLayout 
      title="Bank Book" 
      breadcrumbs={[{label: "Reports"}, {label: "Bank Book", active: true}]}
    >
      <MetricGrid>
        <MetricCard title="Opening Balance" amount={120000} />
        <MetricCard title="Net Movement" amount={35000} badge={<span className="text-green-600 bg-green-50 px-2 py-1 rounded font-bold">+28%</span>} />
        <MetricCard title="Closing Bank Balance" amount={155000} highlight={true} />
      </MetricGrid>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableToolbar 
          onSearch={() => {}} 
          actions={
            <>
              <select className="px-4 py-3 bg-gray-50 text-gray-900 font-bold rounded-xl border-none focus:ring-2 focus:ring-gray-900 shadow-sm cursor-pointer w-full sm:w-auto">
                <option>🏦 HDFC Current A/c - 1234</option>
                <option>🏦 SBI Savings A/c - 5678</option>
              </select>
              <Button variant="secondary">Export CSV</Button>
              <Button variant="secondary">Print</Button>
            </>
          }
        />
        {loading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <DataTable columns={columns} data={MOCK_BANKBOOK} />
        )}
      </div>
    </PageLayout>
  );
}
