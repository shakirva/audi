import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PageLayout, MetricGrid, MetricCard, ContentContainer, Button, formatCurrency } from "../../components/ui/VDS";
import { Printer, TrendingUp, Calendar, CheckCircle } from "lucide-react";

const fetchDailySummary = async () => {
  const token = localStorage.getItem("hm_token");
  const res = await axios.get("http://localhost:3000/api/v1/finance/reports/daily-business-summary", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export default function DailyBusinessSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["dailyBusinessSummary"],
    queryFn: fetchDailySummary,
  });

  if (isLoading) {
    return <div className="p-12 animate-pulse bg-gray-50 min-h-screen"></div>;
  }

  const {
    bookingsCreated, eventsConducted, revenue, expenses, netProfit,
    cashCollection, bankCollection, outstandingCollected, refunds,
    netCashPosition, topBooking, topExpense
  } = data || {};

  return (
    <PageLayout 
      title="Daily Business Summary"
      breadcrumbs={[{label: "Reports"}, {label: "End of Day Summary", active: true}]}
      actions={<Button variant="primary" icon={<Printer size={16} />}>Print EOD Report</Button>}
    >
      
      {/* Top Banner */}
      <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-12 mb-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center">
        <div className="absolute -right-20 -top-20 opacity-10 pointer-events-none"><TrendingUp size={300} /></div>
        <div className="relative z-10">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h2 className="text-4xl font-serif font-bold">End of Day Snapshot</h2>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 text-right">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">Net Cash Position</p>
          <p className="text-5xl font-mono font-black text-green-400">{formatCurrency(netCashPosition)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Operations Overview */}
        <ContentContainer className="p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
            <Calendar className="text-blue-600" />
            <h3 className="text-xl font-bold font-serif text-gray-900">Operations Overview</h3>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">New Bookings</p>
              <p className="text-4xl font-black text-gray-900">{bookingsCreated}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Events Conducted</p>
              <p className="text-4xl font-black text-gray-900">{eventsConducted}</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Top Performing Booking</p>
            <p className="text-lg font-bold text-gray-900">{topBooking}</p>
          </div>
        </ContentContainer>

        {/* Financial Performance */}
        <ContentContainer className="p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
            <TrendingUp className="text-green-600" />
            <h3 className="text-xl font-bold font-serif text-gray-900">Financial Performance</h3>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Revenue Generated</span>
              <span className="font-mono font-black text-xl text-green-600">{formatCurrency(revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Expenses Logged</span>
              <span className="font-mono font-black text-xl text-red-500">{formatCurrency(expenses)}</span>
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-gray-900 font-black uppercase tracking-widest text-sm">Estimated Profit</span>
              <span className="font-mono font-black text-2xl text-gray-900">{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </ContentContainer>
      </div>

      <h3 className="text-xl font-bold font-serif text-gray-900 mb-6 px-2">Collections Breakdown</h3>
      <MetricGrid>
        <MetricCard title="Cash Collection" amount={cashCollection} />
        <MetricCard title="Bank Collection" amount={bankCollection} />
        <MetricCard title="Old Outstanding Recovered" amount={outstandingCollected} />
        <MetricCard title="Refunds Processed" amount={refunds} highlight={true} customClass="!bg-red-600 !border-red-600" />
      </MetricGrid>

    </PageLayout>
  );
}
