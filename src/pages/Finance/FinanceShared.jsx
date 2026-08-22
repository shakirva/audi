import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, ChevronRight, ArrowLeft, Download, Printer } from "lucide-react";

// ============================================================================
// DESIGN SYSTEM TOKENS
// ============================================================================
const SHADOWS = {
  card: "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
  button: "shadow-[0_4px_14px_0_rgb(0,0,0,0.05)]",
};

const BORDERS = {
  default: "border border-gray-100",
  focus: "focus:ring-2 focus:ring-gray-900 focus:border-transparent",
};

const ROUNDING = {
  card: "rounded-3xl",
  button: "rounded-xl",
  input: "rounded-xl",
  badge: "rounded-full",
};

// ============================================================================
// 1. PAGE LAYOUT
// ============================================================================
export const FinancePageLayout = ({ title, children, actions, breadcrumbs = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-16 font-sans">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-6 py-6 md:px-12 md:py-8 transition-all">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate(-1)} 
              className={`flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 ${ROUNDING.button} ${SHADOWS.button} transition-all`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 mb-1">
                  <button onClick={() => navigate('/finance')} className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">
                    Finance
                  </button>
                  {breadcrumbs.map((bc, idx) => (
                    <React.Fragment key={idx}>
                      <ChevronRight size={14} className="text-gray-300" />
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">{bc}</span>
                    </React.Fragment>
                  ))}
                </nav>
              )}
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">{title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {actions}
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="max-w-screen-2xl mx-auto px-6 py-10 md:px-12 md:py-12 page-fade">
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// 2. METRIC CARDS
// ============================================================================
export const FinanceMetricCard = ({ title, amount, highlight = false, badge, customClass = "" }) => (
  <div className={`
    min-h-[140px] p-8 flex flex-col justify-center relative overflow-hidden transition-all duration-300
    ${ROUNDING.card} ${SHADOWS.card} ${BORDERS.default}
    ${highlight ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900'} 
    ${customClass}
  `}>
    <div className="flex justify-between items-start mb-3 relative z-10">
      <p className={`text-xs font-bold uppercase tracking-widest ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>
        {title}
      </p>
      {badge && <div className="text-xs font-bold">{badge}</div>}
    </div>
    <p className={`text-4xl font-black tracking-tighter relative z-10 ${highlight ? 'text-white' : ''}`}>
      {formatCurrency(amount)}
    </p>
  </div>
);

// ============================================================================
// 3. FILTER TOOLBAR
// ============================================================================
export const FinanceFilterBar = ({ onSearch, onExport, onPrint, extraFilters }) => (
  <div className={`bg-white p-6 ${ROUNDING.card} rounded-b-none ${BORDERS.default} border-b-0 flex flex-col xl:flex-row justify-between items-center gap-6 relative z-10`}>
    
    <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
      <div className="relative w-full sm:w-80">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search records..." 
          className={`pl-11 pr-4 py-3 w-full bg-gray-50 text-gray-900 font-medium ${ROUNDING.input} border-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all`}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      <div className={`flex items-center bg-gray-50 p-1.5 ${ROUNDING.input}`}>
        <div className="relative flex items-center">
          <Calendar size={16} className="absolute left-3 text-gray-400" />
          <input type="date" className={`pl-9 pr-3 py-2 bg-transparent text-sm font-medium text-gray-700 border-none focus:ring-0 cursor-pointer`} />
        </div>
        <span className="text-gray-400 font-bold px-2 text-xs uppercase tracking-widest">To</span>
        <div className="relative flex items-center">
          <Calendar size={16} className="absolute left-3 text-gray-400" />
          <input type="date" className={`pl-9 pr-3 py-2 bg-transparent text-sm font-medium text-gray-700 border-none focus:ring-0 cursor-pointer`} />
        </div>
      </div>
      
      {extraFilters}
    </div>

    <div className="flex w-full xl:w-auto gap-3 justify-end">
      {onExport && (
        <button onClick={onExport} className={`flex items-center gap-2 px-5 py-3 bg-white ${BORDERS.default} text-gray-700 ${ROUNDING.button} hover:bg-gray-50 hover:border-gray-300 text-sm font-bold ${SHADOWS.button} transition-all`}>
          <Download size={16} /> Export CSV
        </button>
      )}
      {onPrint && (
        <button onClick={onPrint} className={`flex items-center gap-2 px-5 py-3 bg-white ${BORDERS.default} text-gray-700 ${ROUNDING.button} hover:bg-gray-50 hover:border-gray-300 text-sm font-bold ${SHADOWS.button} transition-all`}>
          <Printer size={16} /> Print
        </button>
      )}
    </div>
  </div>
);

// ============================================================================
// 4. UTILITIES
// ============================================================================
export const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { 
  style: "currency", 
  currency: "INR",
  maximumFractionDigits: 2
}).format(val || 0);

// ============================================================================
// 5. STATUS BADGE
// ============================================================================
export const StatusBadge = ({ status }) => {
  const isPositive = ["Posted", "Completed", "Paid", "Confirmed"].includes(status);
  const isWarning = ["Pending", "Advance Pending"].includes(status);
  const isNeutral = ["Draft"].includes(status);
  
  let colorClass = "bg-gray-100 text-gray-700";
  if (isPositive) colorClass = "bg-green-100 text-green-800";
  else if (isWarning) colorClass = "bg-orange-100 text-orange-800";

  return (
    <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${ROUNDING.badge} ${colorClass}`}>
      {status}
    </span>
  );
};
