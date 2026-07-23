import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PageLayout, MetricGrid, MetricCard, TableToolbar, DataTable, Button, formatCurrency } from "../../components/ui/VDS";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const fetchExpenseCategories = async () => {
  const token = localStorage.getItem("hm_token");
  const res = await axios.get("http://localhost:3000/api/v1/finance/reports/expense-categories", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export default function ExpenseCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ["expenseCategoriesReport"],
    queryFn: fetchExpenseCategories,
  });

  const list = data?.list || [];
  const summary = data?.summary || { totalExpenses: 0 };

  const columns = [
    { 
      label: "Category", 
      render: (row) => <span className="block font-bold text-gray-900">{row.category}</span>
    },
    { 
      label: "Total Expenses", 
      align: "right", 
      render: (row) => <span className="font-mono font-black text-gray-900 text-lg">{formatCurrency(row.total)}</span> 
    },
    { 
      label: "This Month", 
      align: "right", 
      render: (row) => <span className="font-mono font-bold text-gray-600">{formatCurrency(row.thisMonth)}</span> 
    },
    { 
      label: "Last Month", 
      align: "right", 
      render: (row) => <span className="font-mono font-medium text-gray-400">{formatCurrency(row.lastMonth)}</span> 
    },
    { 
      label: "% of Total", 
      align: "right", 
      render: (row) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded font-bold text-xs">{row.percentage}%</span>
      )
    },
    { 
      label: "Trend", 
      align: "right", 
      render: (row) => (
        <span className={`font-bold text-xs ${row.trend > 0 ? 'text-red-500' : 'text-green-600'}`}>
          {row.trend > 0 ? '↑' : '↓'} {Math.abs(row.trend)}%
        </span>
      )
    }
  ];

  return (
    <PageLayout 
      title="Expense Categories"
      breadcrumbs={[{label: "Reports"}, {label: "Expense Categories", active: true}]}
      actions={<Button variant="secondary">Export Report</Button>}
    >
      <MetricGrid>
        <MetricCard title="Total Expenses (All Time)" amount={summary.totalExpenses} highlight={true} />
        <div className="col-span-1 md:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Expense Distribution</p>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={list.slice(0, 5)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {list.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </MetricGrid>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableToolbar onSearch={() => {}} />
        {isLoading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <DataTable columns={columns} data={list} keyField="category" />
        )}
      </div>
    </PageLayout>
  );
}
