import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout, MetricGrid, MetricCard, TableToolbar, DataTable, Button, formatCurrency } from "../../components/ui/VDS";

const MOCK_OUTSTANDING = [
  { id: "BKG-2026-1042", customer: "Sharma Wedding", phone: "+91 9876543210", eventDate: "2026-12-15", total: 250000, collected: 150000, outstanding: 100000, status: "Advance Pending" },
  { id: "BKG-2026-1035", customer: "Verma Reception", phone: "+91 9123456789", eventDate: "2026-08-10", total: 180000, collected: 50000, outstanding: 130000, status: "Advance Pending" },
  { id: "BKG-2026-1010", customer: "Corporate Seminar", phone: "+91 9988776655", eventDate: "2026-07-28", total: 75000, collected: 70000, outstanding: 5000, status: "Final Pending" },
];

export default function CustomerOutstanding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const totalOutstanding = MOCK_OUTSTANDING.reduce((sum, item) => sum + item.outstanding, 0);

  const columns = [
    {
      label: "Booking & Customer",
      render: (row) => (
        <div>
          <span className="block font-bold text-gray-900">{row.customer}</span>
          <span className="text-xs font-semibold text-gray-500 mt-0.5 inline-block">{row.id} • {row.phone}</span>
        </div>
      )
    },
    { label: "Event Date", render: (row) => new Date(row.eventDate).toLocaleDateString() },
    { label: "Total Amount", align: "right", render: (row) => <span className="font-mono font-bold text-gray-600">{formatCurrency(row.total)}</span> },
    { label: "Collected", align: "right", render: (row) => <span className="font-mono font-bold text-green-600">{formatCurrency(row.collected)}</span> },
    { label: "Outstanding", align: "right", render: (row) => <span className="font-mono font-extrabold text-orange-600">{formatCurrency(row.outstanding)}</span> },
    {
      label: "Action",
      align: "right",
      render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); navigate(`/finance/booking/${row.id}`); }} className="text-blue-600 hover:text-blue-800 text-sm font-bold underline">
          View Booking
        </button>
      )
    }
  ];

  return (
    <PageLayout 
      title="Outstanding Payments"
      breadcrumbs={[{label: "Accounts"}, {label: "Outstanding Payments", active: true}]}
      actions={<Button variant="primary">Send Payment Reminders</Button>}
    >
      <MetricGrid>
        <div className="col-span-full md:col-span-2">
          <MetricCard title="Total Outstanding Collections" amount={totalOutstanding} />
        </div>
      </MetricGrid>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableToolbar onSearch={() => {}} />
        {loading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <DataTable columns={columns} data={MOCK_OUTSTANDING} />
        )}
      </div>
    </PageLayout>
  );
}
