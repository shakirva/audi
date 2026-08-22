import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PageLayout, MetricGrid, MetricCard, TableToolbar, DataTable, Button, StatusBadge, formatCurrency } from "../../components/ui/VDS";

const fetchVendorOutstanding = async () => {
  const token = localStorage.getItem("hm_token");
  const res = await axios.get("http://localhost:3000/api/v1/finance/reports/vendor-outstanding", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export default function VendorOutstanding() {
  const { data, isLoading } = useQuery({
    queryKey: ["vendorOutstandingReport"],
    queryFn: fetchVendorOutstanding,
  });

  const list = data?.list || [];
  const summary = data?.summary || { totalOutstanding: 0, overdueAmount: 0 };

  const columns = [
    { 
      label: "Vendor & Invoice", 
      render: (row) => (
        <div>
          <span className="block font-bold text-gray-900">{row.name}</span>
          <span className="text-xs font-bold text-gray-400 mt-0.5 inline-block">{row.category} • {row.invoiceNo}</span>
        </div>
      )
    },
    { label: "Due Date", render: (row) => <span className="font-medium text-gray-600">{new Date(row.dueDate).toLocaleDateString()}</span> },
    { label: "Total Amount", align: "right", render: (row) => <span className="font-mono font-bold text-gray-600">{formatCurrency(row.total)}</span> },
    { label: "Paid", align: "right", render: (row) => <span className="font-mono font-bold text-green-600">{formatCurrency(row.paid)}</span> },
    { label: "Outstanding", align: "right", render: (row) => <span className="font-mono font-black text-orange-600 text-lg">{formatCurrency(row.outstanding)}</span> },
    { label: "Status", render: (row) => <StatusBadge status={row.status} type={row.status === 'Overdue' ? 'danger' : 'auto'} /> },
    { 
      label: "Action", 
      align: "right", 
      render: (row) => (
        row.outstanding > 0 ? (
          <Button variant="secondary" className="!py-2 !px-3 text-xs">Record Payment</Button>
        ) : (
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Settled</span>
        )
      ) 
    }
  ];

  return (
    <PageLayout 
      title="Vendor Outstanding"
      breadcrumbs={[{label: "Reports"}, {label: "Vendor Outstanding", active: true}]}
      actions={<Button variant="secondary">Export Report</Button>}
    >
      <MetricGrid>
        <MetricCard title="Total Outstanding Payables" amount={summary.totalOutstanding} />
        <MetricCard title="Overdue Amount" amount={summary.overdueAmount} highlight={true} customClass="!bg-red-600 !border-red-600" />
      </MetricGrid>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableToolbar onSearch={() => {}} />
        {isLoading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <DataTable columns={columns} data={list} />
        )}
      </div>
    </PageLayout>
  );
}
