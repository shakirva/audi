import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PageLayout, TableToolbar, DataTable, Button, StatusBadge, formatCurrency } from "../../components/ui/VDS";

const fetchPaymentHistory = async () => {
  const token = localStorage.getItem("hm_token");
  const res = await axios.get("http://localhost:3000/api/v1/finance/reports/payment-history", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export default function PaymentHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ["paymentHistoryReport"],
    queryFn: fetchPaymentHistory,
  });

  const list = data?.list || [];

  const columns = [
    { 
      label: "Date & Ref", 
      render: (row) => (
        <div>
          <span className="block font-medium text-gray-500">{new Date(row.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
          <span className="text-sm font-bold text-gray-900 mt-0.5 inline-block">{row.ref}</span>
        </div>
      )
    },
    { 
      label: "Party & Booking", 
      render: (row) => (
        <div>
          <span className="block font-bold text-gray-900">{row.party}</span>
          <span className="text-xs font-semibold text-gray-400 mt-0.5 inline-block">{row.bookingId !== "-" ? row.bookingId : "N/A"}</span>
        </div>
      )
    },
    { 
      label: "Type & Mode", 
      render: (row) => (
        <div>
          <span className={`block font-bold ${row.type === 'Receipt' ? 'text-green-600' : 'text-orange-600'}`}>{row.type}</span>
          <span className="text-xs font-semibold text-gray-500 mt-0.5 inline-block uppercase tracking-wider">{row.mode}</span>
        </div>
      )
    },
    { 
      label: "Amount", 
      align: "right", 
      render: (row) => (
        <span className={`font-mono font-black text-lg ${row.type === 'Receipt' ? 'text-green-600' : 'text-gray-900'}`}>
          {row.type === 'Receipt' ? '+' : '-'}{formatCurrency(row.amount)}
        </span>
      ) 
    },
    { label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { 
      label: "Action", 
      align: "right", 
      render: (row) => (
        <Button variant="ghost" className="!text-blue-600 !p-0 !h-auto hover:!bg-transparent hover:underline text-sm font-bold">
          {row.type === 'Receipt' ? 'View Receipt' : 'View Voucher'}
        </Button>
      ) 
    }
  ];

  return (
    <PageLayout 
      title="Payment History"
      breadcrumbs={[{label: "Reports"}, {label: "Payment History", active: true}]}
      actions={<Button variant="secondary">Export CSV</Button>}
    >
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <TableToolbar 
          onSearch={() => {}} 
          dateRange={true}
          actions={
            <select className="px-4 py-3 bg-gray-50 text-gray-900 font-bold rounded-xl border-none focus:ring-2 focus:ring-gray-900 shadow-sm cursor-pointer min-w-[150px]">
              <option>All Types</option>
              <option>Receipts Only</option>
              <option>Expenses Only</option>
              <option>Refunds</option>
            </select>
          }
        />
        {isLoading ? (
          <div className="h-64 bg-gray-50 animate-pulse"></div>
        ) : (
          <DataTable columns={columns} data={list} />
        )}
      </div>
    </PageLayout>
  );
}
