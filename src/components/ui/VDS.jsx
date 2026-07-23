import React from "react";
import { Search, Calendar, ChevronRight, ArrowLeft, Download, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ============================================================================
// 🎨 DESIGN TOKENS
// ============================================================================

export const VDS_TOKENS = {
  colors: {
    background: "bg-[#F9FAFB]", // Minimal off-white
    surface: "bg-white",
    surfaceHover: "hover:bg-gray-50",
    border: "border-gray-100",
    borderFocus: "focus:border-gray-900 focus:ring-gray-900",
    primary: "bg-gray-900 text-white",
    primaryHover: "hover:bg-gray-800",
    textPrimary: "text-gray-900",
    textSecondary: "text-gray-500",
    success: { bg: "bg-green-100", text: "text-green-800", solid: "bg-green-600 text-white" },
    warning: { bg: "bg-orange-100", text: "text-orange-800", solid: "bg-orange-500 text-white" },
    danger: { bg: "bg-red-100", text: "text-red-800", solid: "bg-red-600 text-white" },
  },
  shadows: {
    sm: "shadow-sm",
    card: "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
    dropdown: "shadow-[0_10px_40px_rgb(0,0,0,0.08)]",
    button: "shadow-[0_4px_14px_0_rgb(0,0,0,0.05)]",
  },
  rounding: {
    sm: "rounded-md",
    md: "rounded-xl",
    card: "rounded-3xl",
    badge: "rounded-full",
  },
  spacing: {
    pagePaddingX: "px-6 md:px-12",
    pagePaddingY: "py-10 md:py-12",
    cardPadding: "p-8",
    rowPadding: "px-8 py-5",
    gap: "gap-6",
  },
  typography: {
    pageTitle: "text-3xl md:text-4xl font-extrabold tracking-tight leading-none",
    sectionTitle: "text-xl font-bold font-serif",
    cardLabel: "text-xs font-bold uppercase tracking-widest",
    metricValue: "text-4xl font-black tracking-tighter",
    tableHeader: "text-xs font-bold uppercase tracking-widest",
    body: "text-sm font-medium",
  }
};

// ============================================================================
// 🏗️ LAYOUT COMPONENTS
// ============================================================================

export const PageLayout = ({ title, children, actions, breadcrumbs = [], backPath }) => {
  const navigate = useNavigate();
  return (
    <div className={`${VDS_TOKENS.colors.background} min-h-screen pb-16 font-sans`}>
      {/* Premium Header */}
      <div className={`sticky top-0 z-30 ${VDS_TOKENS.colors.surface}/80 backdrop-blur-md border-b ${VDS_TOKENS.colors.border} ${VDS_TOKENS.shadows.sm} px-6 py-6 md:px-12 md:py-8 transition-all`}>
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="flex items-center gap-5">
            {backPath && (
              <button 
                onClick={() => navigate(backPath)} 
                className={`flex items-center justify-center w-10 h-10 ${VDS_TOKENS.colors.surface} border ${VDS_TOKENS.colors.border} ${VDS_TOKENS.colors.textSecondary} hover:${VDS_TOKENS.colors.textPrimary} ${VDS_TOKENS.colors.surfaceHover} ${VDS_TOKENS.rounding.md} ${VDS_TOKENS.shadows.button} transition-all duration-200 active:scale-95`}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 mb-2">
                  {breadcrumbs.map((bc, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ChevronRight size={14} className="text-gray-300" />}
                      <span className={`${bc.active ? VDS_TOKENS.colors.textPrimary : 'text-gray-400'} text-xs font-bold uppercase tracking-widest transition-colors`}>
                        {bc.label}
                      </span>
                    </React.Fragment>
                  ))}
                </nav>
              )}
              <h1 className={`${VDS_TOKENS.typography.pageTitle} ${VDS_TOKENS.colors.textPrimary}`}>{title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {actions}
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className={`max-w-screen-2xl mx-auto ${VDS_TOKENS.spacing.pagePaddingX} ${VDS_TOKENS.spacing.pagePaddingY} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        {children}
      </div>
    </div>
  );
};

export const ContentContainer = ({ children, className = "" }) => (
  <div className={`${VDS_TOKENS.colors.surface} border ${VDS_TOKENS.colors.border} ${VDS_TOKENS.shadows.card} ${VDS_TOKENS.rounding.card} overflow-hidden ${className}`}>
    {children}
  </div>
);

// ============================================================================
// 📊 KPI COMPONENTS
// ============================================================================

export const MetricGrid = ({ children }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${VDS_TOKENS.spacing.gap} mb-8`}>
    {children}
  </div>
);

export const MetricCard = ({ title, amount, highlight = false, badge, format = "currency" }) => {
  const formattedAmount = format === "currency" 
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0)
    : amount;

  return (
    <div className={`
      min-h-[140px] ${VDS_TOKENS.spacing.cardPadding} flex flex-col justify-center relative overflow-hidden transition-transform duration-300 hover:-translate-y-1
      ${VDS_TOKENS.rounding.card} ${VDS_TOKENS.shadows.card} border
      ${highlight ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-100'} 
    `}>
      <div className="flex justify-between items-start mb-3 relative z-10">
        <p className={`${VDS_TOKENS.typography.cardLabel} ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>
          {title}
        </p>
        {badge && <div className="text-xs font-bold">{badge}</div>}
      </div>
      <p className={`${VDS_TOKENS.typography.metricValue} relative z-10 ${highlight ? 'text-white' : ''}`}>
        {formattedAmount}
      </p>
    </div>
  );
};

// ============================================================================
// 📋 TABLE COMPONENTS
// ============================================================================

export const TableToolbar = ({ onSearch, actions, dateRange = false }) => (
  <div className={`${VDS_TOKENS.colors.surface} p-6 border-b ${VDS_TOKENS.colors.border} flex flex-col xl:flex-row justify-between items-center gap-6 relative z-10`}>
    <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
      {onSearch && (
        <div className="relative w-full sm:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search records..." 
            className={`pl-11 pr-4 py-3 w-full bg-gray-50 text-gray-900 font-bold ${VDS_TOKENS.rounding.md} border-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all`}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
      {dateRange && (
        <div className={`flex items-center bg-gray-50 p-1.5 ${VDS_TOKENS.rounding.md}`}>
          <div className="relative flex items-center">
            <Calendar size={16} className="absolute left-3 text-gray-400" />
            <input type="date" className="pl-9 pr-3 py-2 bg-transparent text-sm font-bold text-gray-700 border-none focus:ring-0 cursor-pointer" />
          </div>
          <span className="text-gray-400 font-bold px-2 text-xs uppercase tracking-widest">To</span>
          <div className="relative flex items-center">
            <Calendar size={16} className="absolute left-3 text-gray-400" />
            <input type="date" className="pl-9 pr-3 py-2 bg-transparent text-sm font-bold text-gray-700 border-none focus:ring-0 cursor-pointer" />
          </div>
        </div>
      )}
    </div>
    {actions && (
      <div className="flex w-full xl:w-auto gap-3 justify-end">
        {actions}
      </div>
    )}
  </div>
);

export const DataTable = ({ columns, data, keyField = "id", onRowClick }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-widest text-xs">
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className={`${VDS_TOKENS.spacing.rowPadding} font-bold border-b ${VDS_TOKENS.colors.border} ${col.align === 'right' ? 'text-right' : ''}`}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 text-sm">
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-8 py-12 text-center text-gray-500 font-medium">
              No records found.
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr 
              key={row[keyField]} 
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-gray-50/50 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col, idx) => (
                <td key={idx} className={`${VDS_TOKENS.spacing.rowPadding} ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.render ? col.render(row) : row[col.field]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ============================================================================
// 🔘 ACTION COMPONENTS
// ============================================================================

export const Button = ({ children, variant = "primary", icon, onClick, className = "" }) => {
  const base = `flex items-center justify-center gap-2 px-5 py-3 ${VDS_TOKENS.rounding.md} text-sm font-bold transition-all duration-200 active:scale-95`;
  
  const variants = {
    primary: `${VDS_TOKENS.colors.primary} ${VDS_TOKENS.colors.primaryHover} ${VDS_TOKENS.shadows.button}`,
    secondary: `${VDS_TOKENS.colors.surface} text-gray-700 border ${VDS_TOKENS.colors.border} hover:bg-gray-50 hover:border-gray-300 ${VDS_TOKENS.shadows.button}`,
    danger: `${VDS_TOKENS.colors.danger.solid} hover:bg-red-700 ${VDS_TOKENS.shadows.button}`,
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {icon && <span className="opacity-80">{icon}</span>}
      {children}
    </button>
  );
};

// ============================================================================
// 🏷️ STATUS COMPONENTS
// ============================================================================

export const StatusBadge = ({ status, type = "auto" }) => {
  let config = VDS_TOKENS.colors.textSecondary; // Default
  
  if (type === "auto") {
    if (["Posted", "Completed", "Paid", "Confirmed"].includes(status)) config = `${VDS_TOKENS.colors.success.bg} ${VDS_TOKENS.colors.success.text}`;
    else if (["Pending", "Advance Pending"].includes(status)) config = `${VDS_TOKENS.colors.warning.bg} ${VDS_TOKENS.colors.warning.text}`;
    else config = "bg-gray-100 text-gray-700";
  } else if (type === "success") config = `${VDS_TOKENS.colors.success.bg} ${VDS_TOKENS.colors.success.text}`;
  else if (type === "warning") config = `${VDS_TOKENS.colors.warning.bg} ${VDS_TOKENS.colors.warning.text}`;
  else if (type === "danger") config = `${VDS_TOKENS.colors.danger.bg} ${VDS_TOKENS.colors.danger.text}`;

  return (
    <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${VDS_TOKENS.rounding.badge} ${config}`}>
      {status}
    </span>
  );
};
