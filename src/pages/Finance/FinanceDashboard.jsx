import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PageLayout, MetricGrid, MetricCard, ContentContainer, Button, formatCurrency } from "../../components/ui/VDS";

const USE_MOCK = true; // Use mock data for demo polish before live integration

const MOCK_DASHBOARD = {
  cashToday: 45000,
  bankBalance: 850000,
  todaysBookings: 3,
  pendingCollections: 320000,
  thisMonthRevenue: 1200000,
  thisMonthExpenses: 450000,
  mostProfitableBooking: {
    id: "BKG-2026-1042",
    profit: 185000,
    customer: "Sharma Wedding"
  },
  pendingPaymentsCount: 12,
  recentActivity: [
    { id: 1, type: "Payment", ref: "RCP-104", desc: "Advance for BKG-2026-1045", amount: 50000, date: "2 Hours ago", isCredit: true },
    { id: 2, type: "Expense", ref: "VOU-55", desc: "Caterer Payment - BKG-2026-1040", amount: 15000, date: "5 Hours ago", isCredit: false },
    { id: 3, type: "Booking", ref: "BKG-2026-1046", desc: "New Confirmation - Birthday", amount: 75000, date: "Yesterday", isCredit: true },
  ]
};

const fetchDashboard = async () => {
  const token = localStorage.getItem("hm_token");
  const res = await axios.get("http://localhost:3000/api/v1/accounts/dashboard", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export default function FinanceDashboard() {
  const navigate = useNavigate();

  const { data: liveData, isLoading, error } = useQuery({
    queryKey: ["financeDashboard"],
    queryFn: fetchDashboard,
    enabled: !USE_MOCK,
    refetchInterval: 30000,
  });

  const loading = USE_MOCK ? false : isLoading;
  const data = (USE_MOCK || error) ? MOCK_DASHBOARD : (liveData || MOCK_DASHBOARD);

  if (loading) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen p-12">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div className="h-24 bg-gray-200 animate-pulse rounded-xl"></div>
          <div className="grid grid-cols-4 gap-6">
            <div className="h-36 bg-gray-200 animate-pulse rounded-3xl"></div>
            <div className="h-36 bg-gray-200 animate-pulse rounded-3xl"></div>
            <div className="h-36 bg-gray-200 animate-pulse rounded-3xl"></div>
            <div className="h-36 bg-gray-200 animate-pulse rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout 
      title="Business Overview"
      breadcrumbs={[{label: "Finance", active: true}]}
      actions={
        <>
          <Button variant="secondary" onClick={() => navigate('/finance/cash-book')}>Cash Book</Button>
          <Button variant="primary" onClick={() => navigate('/finance/profit-and-loss')}>Profit & Loss</Button>
        </>
      }
    >
      <MetricGrid>
        <MetricCard title="Cash Collected Today" amount={data.cashToday} badge={<span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>} />
        <MetricCard title="Total Bank Balance" amount={data.bankBalance} />
        <div className="p-8 rounded-3xl border border-orange-200 bg-orange-50 shadow-sm flex flex-col justify-center min-h-[140px] transition-transform hover:-translate-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">Pending Collections</p>
          <p className="text-4xl font-black tracking-tighter mt-1 text-orange-700">{formatCurrency(data.pendingCollections)}</p>
        </div>
        <MetricCard title="Today's Bookings" amount={data.todaysBookings} highlight={true} format="number" />
      </MetricGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <ContentContainer className="p-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">This Month Performance</p>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-gray-600 font-bold">Total Revenue</span>
              <span className="font-mono font-black text-green-600 text-xl">{formatCurrency(data.thisMonthRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Total Expenses</span>
              <span className="font-mono font-black text-red-500 text-xl">{formatCurrency(data.thisMonthExpenses)}</span>
            </div>
          </div>
        </ContentContainer>

        <ContentContainer className="p-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Most Profitable Booking</p>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">⭐</div>
            <div>
              <p className="text-gray-900 font-black text-lg">{data.mostProfitableBooking.customer}</p>
              <p className="text-xs font-bold text-gray-500">{data.mostProfitableBooking.id}</p>
            </div>
          </div>
          <p className="text-4xl font-mono font-black text-gray-900">{formatCurrency(data.mostProfitableBooking.profit)}</p>
          <button onClick={() => navigate(`/finance/booking/${data.mostProfitableBooking.id}`)} className="text-sm text-blue-600 font-bold hover:underline mt-4 text-left">
            View Booking Center →
          </button>
        </ContentContainer>

        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-red-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            ⚠️ Action Required
          </p>
          <p className="text-5xl font-black text-red-600">{data.pendingPaymentsCount}</p>
          <p className="text-red-700 font-bold mt-2">Pending payments require follow-up</p>
          <Button variant="danger" className="mt-6 self-start" onClick={() => navigate('/bookings')}>
            View Pending
          </Button>
        </div>
        
      </div>

      <ContentContainer className="p-8">
        <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-6">
          <h2 className="text-xl font-bold font-serif">Recent Business Activity</h2>
          <button onClick={() => navigate('/finance/journals')} className="text-sm font-bold text-blue-600 hover:underline">View All Ledger Entries</button>
        </div>
        
        <div className="space-y-4">
          {data.recentActivity.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0 hover:bg-gray-50/50 p-2 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${item.isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {item.isCredit ? 'IN' : 'OUT'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{item.desc}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">{item.type} ({item.ref}) • {item.date}</p>
                </div>
              </div>
              <div className={`text-xl font-mono font-black ${item.isCredit ? 'text-green-600' : 'text-gray-900'}`}>
                {item.isCredit ? '+' : '-'}{formatCurrency(item.amount)}
              </div>
            </div>
          ))}
        </div>
      </ContentContainer>

    </PageLayout>
  );
}
