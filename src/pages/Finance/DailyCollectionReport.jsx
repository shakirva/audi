import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout, MetricGrid, MetricCard, TableToolbar, DataTable, Button, formatCurrency } from "../../components/ui/VDS";

const MOCK_COLLECTIONS = [
  { id: 1, receiptNo: "RCP-2026-105", date: "2026-07-23T10:30:00Z", customer: "Sharma Wedding", bookingRef: "BKG-2026-1042", mode: "Cash", amount: 25000, collectedBy: "Reception Desk" },
  { id: 2, receiptNo: "RCP-2026-106", date: "2026-07-23T11:45:00Z", customer: "Verma Reception", bookingRef: "BKG-2026-1035", mode: "Bank Transfer", amount: 50000, collectedBy: "Manager" },
  { id: 3, receiptNo: "RCP-2026-107", date: "2026-07-23T14:15:00Z", customer: "Corporate Seminar", bookingRef: "BKG-2026-1010", mode: "Card", amount: 15000, collectedBy: "Reception Desk" },
  { id: 4, receiptNo: "RCP-2026-108", date: "2026-07-23T16:00:00Z", customer: "Sharma Wedding", bookingRef: "BKG-2026-1042", mode: "Cash", amount: 10000, collectedBy: "Manager" },
];

export default function DailyCollectionReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const totalCollected = MOCK_COLLECTIONS.reduce((sum, item) => sum + item.amount, 0);
  const totalCash = MOCK_COLLECTIONS.filter(i => i.mode === "Cash").reduce((sum, item) => sum + item.amount, 0);
  const totalBank = MOCK_COLLECTIONS.filter(i => i.mode !== "Cash").reduce((sum, item) => sum + item.amount, 0);

  const columns = [
    {
      label: "Time & Receipt",
      render: (row) => (
        <div>
          <span className="block font-medium text-gray-500">{new Date(row.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span className="text-sm font-bold text-gray-900 mt-0.5">{row.receiptNo}</span>
        </div>
      )
    },
    {
      label: "Customer & Booking",
      render: (row) => (
        <div>
          <span className="block font-bold text-gray-900">{row.customer}</span>
          <button onClick={() => navigate(`/finance/booking/${row.bookingRef}`)} className="text-xs font-semibold text-blue-600 hover:underline mt-0.5 inline-block">
            {row.bookingRef}
          </button>
        </div>
      )
    },
    {
      label: "Payment Mode",
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${row.mode === 'Cash' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
          {row.mode}
        </span>
      )
    },
    { label: "Collected By", render: (row) => <span className="text-gray-600 font-medium">{row.collectedBy}</span> },
    { label: "Amount", align: "right", render: (row) => <span className="font-mono font-extrabold text-green-600 text-lg">{formatCurrency(row.amount)}</span> }
  ];

  return (
    <PageLayout 
      title="Daily Collection Report"
      breadcrumbs={[{label: "Accounts"}, {label: "Daily Collections", active: true}]}
      actions={<Button variant="primary">Print Day Close</Button>}
    >
      <MetricGrid>
        <MetricCard title="Total Collected Today" amount={totalCollected} highlight={true} />
        <MetricCard title="Cash Collections" amount={totalCash} />
        <MetricCard title="Bank & Card Collections" amount={totalBank} />
      </MetricGrid>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableToolbar 
          onSearch={() => {}} 
          actions={
            <select className="px-4 py-3 bg-gray-50 text-gray-900 font-bold rounded-xl border-none focus:ring-2 focus:ring-gray-900 shadow-sm cursor-pointer">
              <option>All Payment Modes</option>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Card</option>
            </select>
          }
        />
        {loading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <DataTable columns={columns} data={MOCK_COLLECTIONS} />
        )}
      </div>
    </PageLayout>
  );
}
