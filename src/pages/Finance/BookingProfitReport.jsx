import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PageLayout, MetricGrid, MetricCard, TableToolbar, DataTable, Button, StatusBadge, formatCurrency } from "../../components/ui/VDS";

const USE_MOCK = false;

const MOCK_PROFIT_DATA = [
  { id: "BKG-2026-1042", customer: "Sharma Wedding", date: "2026-12-15", revenue: 250000, expenses: 65000, profit: 185000, margin: 74, status: "Completed" },
  { id: "BKG-2026-1035", customer: "Verma Reception", date: "2026-08-10", revenue: 180000, expenses: 80000, profit: 100000, margin: 55, status: "Completed" },
  { id: "BKG-2026-1010", customer: "Corporate Seminar", date: "2026-07-28", revenue: 75000, expenses: 15000, profit: 60000, margin: 80, status: "Completed" },
  { id: "BKG-2026-1005", customer: "Birthday Party", date: "2026-06-15", revenue: 45000, expenses: 12000, profit: 33000, margin: 73, status: "Completed" },
];

const MOCK_SUMMARY = {
  totalRevenue: 550000,
  totalExpenses: 172000,
  netProfit: 378000,
  avgMargin: 68.7,
};

const fetchProfitReport = async () => {
  const token = localStorage.getItem("hm_token");
  const res = await axios.get("http://localhost:3000/api/v1/finance/reports/booking-profit", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export default function BookingProfitReport() {
  const navigate = useNavigate();

  const { data: liveData, isLoading, error } = useQuery({
    queryKey: ["bookingProfitReport"],
    queryFn: fetchProfitReport,
    enabled: !USE_MOCK,
  });

  const loading = USE_MOCK ? false : isLoading;
  const data = (USE_MOCK || error) ? MOCK_PROFIT_DATA : (liveData?.list || MOCK_PROFIT_DATA);
  const summary = (USE_MOCK || error) ? MOCK_SUMMARY : (liveData?.summary || MOCK_SUMMARY);

  const columns = [
    { 
      label: "Booking & Customer", 
      render: (row) => (
        <div>
          <span className="block font-bold text-gray-900">{row.customer}</span>
          <span className="text-xs font-semibold text-gray-400 mt-0.5 inline-block">{row.id} • {new Date(row.date).toLocaleDateString()}</span>
        </div>
      ) 
    },
    { label: "Revenue", align: "right", render: (row) => <span className="font-mono font-bold text-green-600">{formatCurrency(row.revenue)}</span> },
    { label: "Expenses", align: "right", render: (row) => <span className="font-mono font-bold text-red-500">{formatCurrency(row.expenses)}</span> },
    { label: "Net Profit", align: "right", render: (row) => <span className="font-mono font-black text-gray-900 text-lg">{formatCurrency(row.profit)}</span> },
    { 
      label: "Margin %", 
      align: "right", 
      render: (row) => (
        <span className={`px-2 py-1 rounded font-bold text-xs ${row.margin >= 70 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
          {row.margin}%
        </span>
      ) 
    },
    {
      label: "Action",
      align: "right",
      render: (row) => (
        <button onClick={() => navigate(`/finance/booking/${row.id}`)} className="text-blue-600 hover:text-blue-800 text-sm font-bold underline">
          Details
        </button>
      )
    }
  ];

  return (
    <PageLayout 
      title="Booking Profit Report"
      breadcrumbs={[{label: "Reports"}, {label: "Booking Profit", active: true}]}
      actions={<Button variant="secondary">Export Report</Button>}
    >
      <MetricGrid>
        <MetricCard title="Total Booking Revenue" amount={summary.totalRevenue} />
        <MetricCard title="Total Booking Expenses" amount={summary.totalExpenses} />
        <MetricCard title="Total Net Profit" amount={summary.netProfit} highlight={true} />
        <div className="p-8 rounded-3xl border border-gray-100 bg-white shadow-sm flex flex-col justify-center min-h-[140px]">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Average Margin</p>
          <p className="text-4xl font-black tracking-tighter mt-1 text-green-600">{summary.avgMargin}%</p>
        </div>
      </MetricGrid>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableToolbar onSearch={() => {}} dateRange={true} />
        {loading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </div>
    </PageLayout>
  );
}
