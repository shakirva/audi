import React, { useState, useEffect } from "react";
import { PageLayout, MetricGrid, MetricCard, TableToolbar, DataTable, Button, formatCurrency } from "../../components/ui/VDS";

const MOCK_CASHBOOK = [
  { id: 1, date: "2026-07-19T09:00:00Z", type: "Opening", ref: "-", desc: "Opening Balance", debit: 15000, credit: 0, balance: 15000 },
  { id: 2, date: "2026-07-20T10:00:00Z", type: "Receipt", ref: "RCP-101", desc: "Advance for BKG-2026-1042", debit: 20000, credit: 0, balance: 35000 },
  { id: 3, date: "2026-07-21T11:00:00Z", type: "Payment", ref: "EXP-045", desc: "Office Supplies", debit: 0, credit: 2000, balance: 33000 },
];

export default function CashBook() {
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
    { label: "Cash In (Dr)", align: "right", render: (row) => <span className="font-mono font-bold text-green-600">{row.debit > 0 ? formatCurrency(row.debit) : "-"}</span> },
    { label: "Cash Out (Cr)", align: "right", render: (row) => <span className="font-mono font-bold text-red-500">{row.credit > 0 ? formatCurrency(row.credit) : "-"}</span> },
    { label: "Balance", align: "right", render: (row) => <span className="font-mono font-extrabold text-gray-900">{formatCurrency(row.balance)}</span> }
  ];

  return (
    <PageLayout 
      title="Cash Book" 
      breadcrumbs={[{label: "Ledgers"}, {label: "Cash Book", active: true}]}
      actions={<Button variant="secondary">Download PDF</Button>}
    >
      <MetricGrid>
        <MetricCard title="Opening Balance" amount={15000} />
        <MetricCard title="Net Movement" amount={18000} badge={<span className="text-green-600 bg-green-50 px-2 py-1 rounded font-bold">+12%</span>} />
        <MetricCard title="Closing Cash Balance" amount={33000} highlight={true} />
      </MetricGrid>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableToolbar 
          onSearch={() => {}} 
          actions={
            <>
              <Button variant="secondary">Export CSV</Button>
              <Button variant="secondary">Print</Button>
            </>
          }
        />
        {loading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <DataTable columns={columns} data={MOCK_CASHBOOK} />
        )}
      </div>
    </PageLayout>
  );
}
