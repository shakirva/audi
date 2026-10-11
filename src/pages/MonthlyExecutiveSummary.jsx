import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Printer, TrendingUp, TrendingDown, Wallet, Calendar, Users, 
  HelpCircle, AlertCircle, FileSpreadsheet, ArrowUpRight, 
  CheckCircle2, DollarSign, Layers, ChevronDown, Filter, ShieldCheck
} from 'lucide-react';
import api from '../services/api';

const COLORS = ['#059669', '#d97706', '#2563eb', '#7c3aed', '#db2777', '#475569'];

export default function MonthlyExecutiveSummary() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [activeMobileTab, setActiveMobileTab] = useState('all'); // 'all' | 'bookings' | 'expenses' | 'payments'

  const { data, isLoading, error } = useQuery({
    queryKey: ['monthly-summary', selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await api.get(`/v1/reports/monthly-summary`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      return res.data.data;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('DD MMM YYYY');
  };

  const getVenueName = () => {
    try {
      const v = JSON.parse(localStorage.getItem('hm_venue') || '{}');
      if (v?.name) return v.name;
      const t = JSON.parse(localStorage.getItem('hm_tenant') || '{}');
      if (t?.name) return t.name;
      const u = JSON.parse(localStorage.getItem('hm_user') || '{}');
      if (u?.venueName) return u.venueName;
      if (u?.tenantName) return u.tenantName;
    } catch (e) {}
    return 'Auditorium & Convention Centre';
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Compiling Executive Summary...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Unable to Load Executive Summary</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">Please verify your connection or select a different reporting period.</p>
      </div>
    );
  }

  // Key Calculations
  const totalRevenue = data.financials?.totalRevenue || 0;
  const totalExpenses = data.financials?.totalExpenses || 0;
  const netBalance = data.financials?.netBalance || 0;
  const operatingMargin = totalRevenue > 0 ? ((netBalance / totalRevenue) * 100).toFixed(1) : '0.0';
  const expenseRatio = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : '0.0';
  
  const totalBookings = data.operations?.totalBookings || 0;
  const totalEnquiries = data.operations?.totalEnquiries || 0;
  const conversionRate = totalEnquiries > 0 ? ((totalBookings / totalEnquiries) * 100).toFixed(1) : '0.0';
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  // Table Footers
  const recentBookings = data.details?.recentBookings || [];
  const recentExpenses = data.details?.recentExpenses || [];
  const recentPayments = data.details?.recentPayments || [];

  const totalRenderedExpenses = recentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRenderedPayments = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalRenderedBookingRevenue = recentBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalRenderedBookingBalance = recentBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

  const monthName = dayjs().month(selectedMonth - 1).format('MMMM');
  const venueTitle = getVenueName();

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 md:px-8 py-4 sm:py-6 text-slate-800 font-sans">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body {
            background: #fff !important;
            color: #0f172a !important;
            font-size: 11px !important;
          }
          body * {
            visibility: hidden;
          }
          #executive-summary-content, #executive-summary-content * {
            visibility: visible;
          }
          #executive-summary-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: avoid !important;
          }
          .print-table th {
            background-color: #1e293b !important;
            color: #ffffff !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            padding: 7px 10px !important;
            border: 1px solid #0f172a !important;
          }
          .print-table td {
            font-size: 10px !important;
            padding: 6px 10px !important;
            border: 1px solid #cbd5e1 !important;
          }
          .print-table tr:nth-child(even) td {
            background-color: #f8fafc !important;
          }
          .print-kpi-card {
            border: 1.5px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            padding: 12px 14px !important;
            border-radius: 6px !important;
          }
          .print-header-bar {
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 12px !important;
            margin-bottom: 18px !important;
          }
        }
      `}</style>

      {/* ──────────────────────────────────────────────────────────────────────────
          SCREEN CONTROLS HEADER (HIDDEN ON PRINT)
      ────────────────────────────────────────────────────────────────────────── */}
      <header className="print-hide bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Title & Badge */}
          <div className="flex items-start justify-between sm:justify-start gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Executive Report
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {venueTitle}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-serif">
                Monthly Executive Summary
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Financial performance, booking dynamics, and cash flow for <strong className="text-slate-700">{monthName} {selectedYear}</strong>
              </p>
            </div>
          </div>

          {/* Controls: Month, Year, and PDF Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i+1} value={i+1}>{dayjs().month(i).format('MMMM')}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button 
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
              title="Print or export to PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Export Executive PDF</span>
            </button>
          </div>

        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────────────
          MAIN PRINTABLE & SCREEN CONTENT
      ────────────────────────────────────────────────────────────────────────── */}
      <div id="executive-summary-content" className="w-full">

        {/* PRINT ONLY: FORMAL EXECUTIVE LETTERHEAD HEADER */}
        <div className="hidden print-only print-header-bar">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[18px] font-black tracking-tight text-slate-900 font-serif uppercase">
                {venueTitle}
              </div>
              <div className="text-[12px] font-bold text-emerald-800 tracking-wide mt-0.5">
                EXECUTIVE PERFORMANCE & FINANCIAL AUDIT REPORT
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Reporting Period: <strong className="text-slate-800">{monthName} {selectedYear}</strong> • Currency: INR (₹)
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-500">
              <div>Document ID: <strong>EXC-{selectedYear}{String(selectedMonth).padStart(2, '0')}</strong></div>
              <div>Generated: <strong>{dayjs().format('DD MMM YYYY, hh:mm A')}</strong></div>
              <div className="text-emerald-700 font-bold mt-1">Venueza ERP Certified</div>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            SECTION 1: FINANCIAL HIGHLIGHTS MATRIX
        ────────────────────────────────────────────────────────────────────────── */}
        <section className="mb-5 sm:mb-6 print-break-inside-avoid">
          {/* Mobile / Screen Layout: Hero Net Profit Card + 2 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            
            {/* NET OPERATING BALANCE (HERO CARD) */}
            <div className="sm:col-span-2 lg:col-span-1 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-md relative overflow-hidden border border-emerald-800/40 print-kpi-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/90 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  Net Operating Balance
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${Number(netBalance) >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                  {Number(operatingMargin) >= 0 ? `+${operatingMargin}% Margin` : `${operatingMargin}% Deficit`}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-1 text-white">
                {formatCurrency(netBalance)}
              </div>
              <p className="text-[11px] text-emerald-200/70 font-medium">
                {Number(netBalance) >= 0 ? 'Operational surplus after all recorded expenses' : 'Operational deficit for this reporting cycle'}
              </p>
            </div>

            {/* TOTAL REVENUE */}
            <div className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-sm relative overflow-hidden print-kpi-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Total Revenue
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Gross Inflow
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-1">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-[11px] text-slate-500">
                Avg. {formatCurrency(avgBookingValue)} per booking
              </p>
            </div>

            {/* TOTAL EXPENSES */}
            <div className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-sm relative overflow-hidden print-kpi-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  Total Expenses
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {expenseRatio}% of Rev
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-1">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-[11px] text-slate-500">
                Total operating & vendor outflows recorded
              </p>
            </div>

          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────────────────
            SECTION 2: OPERATIONS & EVENT DISTRIBUTION (SIDE-BY-SIDE / STACKED)
        ────────────────────────────────────────────────────────────────────────── */}
        <section className="mb-5 sm:mb-6 grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 print-break-inside-avoid">
          
          {/* OPERATIONAL OVERVIEW (7 Cols on desktop) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm print-kpi-card">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-serif">
                  Operational Performance
                </h3>
                <p className="text-[11px] text-slate-500">Bookings volume and lead pipeline velocity</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                {conversionRate}% Conversion
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bookings</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {totalBookings}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Confirmed</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-slate-500 mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Enquiries</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {totalEnquiries}
                </div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Total Inquiries</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-slate-500 mb-1">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Customers</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {data.operations?.newCustomers || 0}
                </div>
                <div className="text-[10px] text-purple-600 font-semibold mt-0.5">New Profiles</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-slate-500 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cancelled</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-600">
                  {data.operations?.cancelledBookings || 0}
                </div>
                <div className="text-[10px] text-rose-500 font-semibold mt-0.5">Cancellations</div>
              </div>

            </div>
          </div>

          {/* EVENT TYPE DISTRIBUTION (5 Cols on desktop) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm print-kpi-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-serif">
                Event Type Distribution
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                {data.analytics?.eventTypes?.length || 0} Categories
              </span>
            </div>

            {data.analytics?.eventTypes?.length > 0 ? (
              <div className="h-44 sm:h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={data.analytics.eventTypes} 
                      cx="50%" 
                      cy="46%" 
                      innerRadius={36} 
                      outerRadius={58} 
                      paddingAngle={4} 
                      dataKey="value"
                    >
                      {data.analytics.eventTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name) => [`${val} events`, name]}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 600 }} 
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={28} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '10px', color: '#475569', paddingTop: '4px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No events recorded this month
              </div>
            )}
          </div>

        </section>

        {/* ──────────────────────────────────────────────────────────────────────────
            SECTION 3: GRANULAR BREAKDOWNS (TABLES)
            MOBILE VIEW: INTERACTIVE TAB SELECTOR FOR QUICK FILTERING
        ────────────────────────────────────────────────────────────────────────── */}
        
        {/* Mobile Filter Tabs (Hidden on Desktop & Print) */}
        <div className="print-hide flex md:hidden items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveMobileTab('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${activeMobileTab === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'}`}
          >
            All Sections
          </button>
          <button
            onClick={() => setActiveMobileTab('bookings')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${activeMobileTab === 'bookings' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'}`}
          >
            Bookings ({recentBookings.length})
          </button>
          <button
            onClick={() => setActiveMobileTab('expenses')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${activeMobileTab === 'expenses' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'}`}
          >
            Expenses ({recentExpenses.length})
          </button>
          <button
            onClick={() => setActiveMobileTab('payments')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${activeMobileTab === 'payments' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'}`}
          >
            Collections ({recentPayments.length})
          </button>
        </div>

        {/* TABLE 1: RECENT BOOKINGS */}
        {(activeMobileTab === 'all' || activeMobileTab === 'bookings') && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-5 print-break-inside-avoid print-kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-serif">
                  Recent Bookings & Contracts
                </h3>
                <p className="text-[11px] text-slate-500">Confirmed hall reservations for {monthName}</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                {recentBookings.length} Records
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full border-collapse text-left text-xs print-table min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Booking ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Hall</th>
                    <th className="py-2.5 px-3 text-right">Total Amt</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">{b.bookingId || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{formatDate(b.date)}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{b.customerName || 'Customer'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{b.hall || 'Main Hall'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {formatCurrency(b.totalAmount)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${Number(b.balanceAmount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatCurrency(b.balanceAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {b.status || 'Confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No bookings recorded for this month
                      </td>
                    </tr>
                  )}
                </tbody>
                {recentBookings.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                      <td colSpan="4" className="py-2.5 px-3 text-right">Total Confirmed Value:</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">{formatCurrency(totalRenderedBookingRevenue)}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600">{formatCurrency(totalRenderedBookingBalance)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TABLE 2: RECENT EXPENSES */}
        {(activeMobileTab === 'all' || activeMobileTab === 'expenses') && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-5 print-break-inside-avoid print-kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-serif">
                  Operational Expenses Breakdown
                </h3>
                <p className="text-[11px] text-slate-500">Expenditures, maintenance & vendor disbursements</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                {recentExpenses.length} Records
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full border-collapse text-left text-xs print-table min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentExpenses.length > 0 ? (
                    recentExpenses.map((e, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{e.category || 'General'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{e.description || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {formatCurrency(e.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        No expenses recorded for this month
                      </td>
                    </tr>
                  )}
                </tbody>
                {recentExpenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                      <td colSpan="3" className="py-2.5 px-3 text-right">Total Recorded Expenses:</td>
                      <td className="py-2.5 px-3 text-right text-rose-600">{formatCurrency(totalRenderedExpenses)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TABLE 3: RECENT COLLECTIONS & PAYMENTS */}
        {(activeMobileTab === 'all' || activeMobileTab === 'payments') && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-5 print-break-inside-avoid print-kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-serif">
                  Collections & Payment Receipts
                </h3>
                <p className="text-[11px] text-slate-500">Realized advances and final settlements</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                {recentPayments.length} Records
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full border-collapse text-left text-xs print-table min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Receipt / Ref</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.length > 0 ? (
                    recentPayments.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{p.paymentNumber || `REC-${i+1}`}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.method || 'Direct'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        No payments recorded for this month
                      </td>
                    </tr>
                  )}
                </tbody>
                {recentPayments.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                      <td colSpan="3" className="py-2.5 px-3 text-right">Total Cash Collections:</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{formatCurrency(totalRenderedPayments)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* PRINT ONLY: FORMAL EXECUTIVE SIGN-OFF & AUDIT FOOTER */}
        <div className="hidden print-only mt-8 pt-4 border-t border-slate-300 text-[9px] text-slate-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-700">Confidential Executive Document • For Venue Management & Audit Only</p>
              <p>Generated automatically via Venueza Cloud ERP ({venueTitle})</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">Authorized Signature: _______________________</p>
              <p className="mt-1">Date: {dayjs().format('DD/MM/YYYY')}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
