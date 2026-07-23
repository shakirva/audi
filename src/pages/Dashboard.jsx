import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { Calendar, Plus, Banknote, Users, AlertCircle, Phone, ArrowRight, TrendingUp, CheckCircle, CreditCard, Landmark, FileText, ClipboardList } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { bookingsAPI } from "../services/api";

const BRAND = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  accent: "#D4A017",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#0ea5e9",
  danger: "#ef4444"
};

const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

// --- CHARTS DATA MOCKS ---
const revenueData = [
  { name: "Jan", rev: 450000, exp: 200000 },
  { name: "Feb", rev: 520000, exp: 210000 },
  { name: "Mar", rev: 380000, exp: 180000 },
  { name: "Apr", rev: 850000, exp: 300000 },
  { name: "May", rev: 680000, exp: 250000 },
  { name: "Jun", rev: 950000, exp: 280000 }
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. MANAGER / OWNER MODE (Executive Command Center)
// ─────────────────────────────────────────────────────────────────────────────

function ExecutiveCockpit() {
  const [stats, setStats] = useState({
    todayBookings: 2,
    cashCollected: 120000,
    bankCollected: 450000,
    pendingCollections: 850000,
    cancelledBookings: 0,
    eventsToday: 2
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
        <div className="absolute -right-20 -top-40 w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-serif text-gray-900 tracking-tight">Executive Command Center</h1>
          <p className="text-gray-500 font-medium mt-1 text-sm">Welcome back. Here is the operational health of Venueza today.</p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-3 mt-6 md:mt-0">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-bold shadow-md transition">
            <Plus size={16} /> New Booking
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 text-sm font-bold shadow-sm transition">
            <CreditCard size={16} /> Record Payment
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 text-sm font-bold shadow-sm transition">
            <FileText size={16} /> New Enquiry
          </button>
        </div>
      </div>

      {/* 1. TODAY'S SNAPSHOT (Top KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Calendar size={40}/></div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Today's Bookings</p>
          <p className="text-3xl font-black text-gray-900">{stats.todayBookings}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-1">Cash Collected</p>
          <p className="text-2xl font-black text-green-600 font-mono">{formatCurrency(stats.cashCollected)}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">Bank Collected</p>
          <p className="text-2xl font-black text-blue-600 font-mono">{formatCurrency(stats.bankCollected)}</p>
        </div>
        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-1">Pending Collections</p>
          <p className="text-2xl font-black text-orange-600 font-mono">{formatCurrency(stats.pendingCollections)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Events Today</p>
          <p className="text-3xl font-black text-gray-900">{stats.eventsToday}</p>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Cancelled</p>
          <p className="text-3xl font-black text-red-600">{stats.cancelledBookings}</p>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Operations & Finance */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. REVENUE OVERVIEW */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-serif text-gray-900">Revenue & Cash Flow</h3>
              <select className="text-sm border-gray-200 rounded-lg text-gray-600 font-medium">
                <option>This Year</option>
                <option>Last 6 Months</option>
              </select>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.danger} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={BRAND.danger} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `₹${val/100000}L`} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="rev" name="Revenue" stroke={BRAND.primary} strokeWidth={3} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="exp" name="Expenses" stroke={BRAND.danger} strokeWidth={3} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. BOOKING OPERATIONS */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-serif text-gray-900">Recent Booking Operations</h3>
              <button className="text-sm font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { ref: "BKG-1042", name: "Sharma Wedding", status: "Advance Pending", date: "15 Dec 2026", color: "orange" },
                { ref: "BKG-1043", name: "Tech Corp Seminar", status: "Confirmed", date: "22 Aug 2026", color: "green" },
                { ref: "BKG-1044", name: "Verma Reception", status: "Draft", date: "05 Nov 2026", color: "gray" },
              ].map((b, i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${b.color}-100 text-${b.color}-600`}>
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{b.name}</p>
                      <p className="text-xs font-semibold text-gray-500">{b.ref} • {b.date}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${b.color}-100 text-${b.color}-700`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Alerts, Finance Summary, Widgets */}
        <div className="space-y-8">
          
          {/* 5. BUSINESS ALERTS */}
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-red-200 opacity-50"><AlertCircle size={100} /></div>
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2 relative z-10"><AlertCircle size={20}/> Action Required</h3>
            <div className="space-y-3 relative z-10">
              <div className="bg-white/80 backdrop-blur p-4 rounded-xl shadow-sm border border-red-50">
                <p className="text-sm font-bold text-gray-900">Overdue Payment</p>
                <p className="text-xs font-medium text-gray-600 mt-1">BKG-1035 (Verma) is overdue by ₹50,000 for 3 days.</p>
              </div>
              <div className="bg-white/80 backdrop-blur p-4 rounded-xl shadow-sm border border-red-50">
                <p className="text-sm font-bold text-gray-900">Vendor Payment Pending</p>
                <p className="text-xs font-medium text-gray-600 mt-1">Alpha Catering invoice #INV-99 requires approval.</p>
              </div>
            </div>
          </div>

          {/* 4. FINANCE SUMMARY */}
          <div className="bg-gray-900 p-8 rounded-3xl shadow-sm text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10"><Landmark size={150} /></div>
            <h3 className="text-lg font-bold font-serif mb-6 text-gray-100 relative z-10">Liquidity Summary</h3>
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Cash in Hand</p>
                <p className="text-3xl font-mono font-bold mt-1 text-green-400">{formatCurrency(33000)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Bank Balance</p>
                <p className="text-3xl font-mono font-bold mt-1 text-white">{formatCurrency(155000)}</p>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">This Month's Profit Margin</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">68%</span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">+4.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 8. PERFORMANCE WIDGETS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Performance Highlights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Most Profitable Booking</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">Sharma Wedding</p>
                </div>
                <p className="font-mono font-bold text-green-600">{formatCurrency(205000)}</p>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Highest Revenue Hall</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">Grand Ballroom</p>
                </div>
                <p className="font-bold text-gray-700">65% Use</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Avg Booking Value</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">This Month</p>
                </div>
                <p className="font-mono font-bold text-gray-900">{formatCurrency(185000)}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION & OPERATIONS FALLBACKS (Kept Minimal for now)
// ─────────────────────────────────────────────────────────────────────────────

function ReceptionCockpit() {
  return (
    <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100 mt-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-serif text-gray-900">Reception Desk</h1>
      <p className="text-gray-500 mt-2">Manage enquiries and check availability.</p>
    </div>
  );
}

function OperationsCockpit() {
  return (
    <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100 mt-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-serif text-gray-900">Operations Command</h1>
      <p className="text-gray-500 mt-2">Track live jobs and vendor logistics.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { role } = useRole();

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8">
      <div className="max-w-screen-2xl mx-auto">
        {role === "Owner" || role === "Manager" || role === "Admin" ? (
          <ExecutiveCockpit />
        ) : role === "Sales" ? (
          <ReceptionCockpit />
        ) : role === "Operations" ? (
          <OperationsCockpit />
        ) : (
          <ExecutiveCockpit />
        )}
      </div>
    </div>
  );
}
