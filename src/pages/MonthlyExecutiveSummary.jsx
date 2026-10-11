import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Printer, TrendingUp, TrendingDown, Wallet, Calendar, Users, 
  HelpCircle, AlertCircle, FileSpreadsheet, ArrowUpRight, 
  CheckCircle2, DollarSign, Layers, ChevronDown, Filter, ShieldCheck,
  ChevronLeft, ChevronRight, Download, Receipt, Sparkles, Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robustDownloadPDF } from '../utils/pdfDownloadService';
import api from '../services/api';

const COLORS = ['#1B4332', '#D4A017', '#2563eb', '#7c3aed', '#db2777', '#059669'];

export default function MonthlyExecutiveSummary() {
  const [periodType, setPeriodType] = useState('month_wise'); // 'this_month' | 'this_fy' | 'month_wise' | 'all_time' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [customStart, setCustomStart] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [customEnd, setCustomEnd] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bookings' | 'expenses' | 'payments'
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all' | 'confirmed' | 'cancelled'
  const [isExporting, setIsExporting] = useState(false);

  const queryParams = useMemo(() => {
    if (periodType === 'this_month') {
      const curM = dayjs().month() + 1;
      const curY = dayjs().year();
      return { month: curM, year: curY };
    }
    if (periodType === 'this_fy') {
      const now = dayjs();
      const curMonth = now.month();
      const fyStartYear = curMonth >= 3 ? now.year() : now.year() - 1;
      const fyEndYear = fyStartYear + 1;
      return { start: `${fyStartYear}-04-01`, end: `${fyEndYear}-03-31` };
    }
    if (periodType === 'all_time') {
      return { allTime: 'true' };
    }
    if (periodType === 'custom') {
      return { start: customStart, end: customEnd };
    }
    return { month: selectedMonth, year: selectedYear };
  }, [periodType, selectedMonth, selectedYear, customStart, customEnd]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['monthly-summary', queryParams],
    queryFn: async () => {
      const res = await api.get(`/v1/reports/monthly-summary`, {
        params: queryParams
      });
      return res.data.data;
    }
  });

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
    return "KT's Convention Centre";
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Key Calculations
  const totalRevenue = data?.financials?.totalRevenue || 0;
  const totalExpenses = data?.financials?.totalExpenses || 0;
  const netBalance = data?.financials?.netBalance || 0;
  const pendingBalanceAmount = data?.financials?.pendingBalanceAmount ?? totalRenderedBookingBalance;
  const totalContractValue = data?.financials?.totalContractValue ?? totalRenderedBookingRevenue;
  const totalAdvanceCollected = data?.financials?.totalAdvanceCollected ?? (totalContractValue - pendingBalanceAmount);
  const bookingsWithPendingBalance = data?.financials?.bookingsWithPendingBalance ?? recentBookings.filter(b => (b.balanceAmount || 0) > 0).length;
  const operatingMargin = totalRevenue > 0 ? ((netBalance / totalRevenue) * 100).toFixed(1) : '0.0';
  const expenseRatio = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : '0.0';
  
  const totalBookings = data?.operations?.totalBookings || 0;
  const totalEnquiries = data?.operations?.totalEnquiries || 0;
  const conversionRate = totalEnquiries > 0 ? ((totalBookings / totalEnquiries) * 100).toFixed(1) : '0.0';
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  const recentBookings = data?.details?.recentBookings || [];
  const cancelledBookingsList = data?.details?.cancelledBookingsList || [];
  const recentExpenses = data?.details?.recentExpenses || [];
  const recentPayments = data?.details?.recentPayments || [];

  const displayedBookings = useMemo(() => {
    if (bookingFilter === 'confirmed') return recentBookings;
    if (bookingFilter === 'cancelled') return cancelledBookingsList;
    return [...recentBookings, ...cancelledBookingsList];
  }, [bookingFilter, recentBookings, cancelledBookingsList]);

  const totalRenderedExpenses = recentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRenderedPayments = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalRenderedBookingRevenue = recentBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalRenderedBookingBalance = recentBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

  const monthName = dayjs().month(selectedMonth - 1).format('MMMM');
  const venueTitle = getVenueName();

  const periodLabel = useMemo(() => {
    if (periodType === 'this_month') {
      return `This Month (${dayjs().format('MMMM YYYY')})`;
    }
    if (periodType === 'this_fy') {
      const now = dayjs();
      const curMonth = now.month();
      const fyStartYear = curMonth >= 3 ? now.year() : now.year() - 1;
      const fyEndYear = fyStartYear + 1;
      return `FY ${String(fyStartYear).slice(-2)}-${String(fyEndYear).slice(-2)} (01 Apr ${fyStartYear} – 31 Mar ${fyEndYear})`;
    }
    if (periodType === 'all_time') {
      return 'All Time (Lifetime Summary)';
    }
    if (periodType === 'custom') {
      return `${dayjs(customStart).format('DD MMM YYYY')} – ${dayjs(customEnd).format('DD MMM YYYY')}`;
    }
    return `${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear}`;
  }, [periodType, selectedMonth, selectedYear, customStart, customEnd]);

  const PERIOD_TABS = [
    { key: 'this_month', label: 'This Month' },
    { key: 'this_fy', label: 'Financial Year' },
    { key: 'month_wise', label: 'Month Wise' },
    { key: 'all_time', label: 'All Time' },
    { key: 'custom', label: 'Custom Date' },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────
  // PROFESSIONAL DIRECT PDF EXPORT ENGINE (jsPDF + autoTable)
  // ──────────────────────────────────────────────────────────────────────────
  const formatPDFCurrency = (amount) => {
    const num = Math.round(Number(amount) || 0);
    return `Rs. ${num.toLocaleString('en-IN')}`;
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Primary Brand Colors
      const brandDark = [27, 67, 50];       // #1B4332 Deep Forest Emerald
      const brandGold = [212, 160, 23];     // #D4A017 Gold
      const slateDark = [15, 23, 42];       // #0F172A Slate 900
      const textMuted = [100, 116, 139];    // Slate 500

      // ── TOP HEADER LETTERHEAD ──
      doc.setFillColor(...brandDark);
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setFillColor(...brandGold);
      doc.rect(0, 28, pageWidth, 2, 'F');

      // Venue Title & Subtitle in Header
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(venueTitle.toUpperCase(), 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(212, 230, 220);
      doc.text('EXECUTIVE FINANCIAL & PERFORMANCE AUDIT REPORT', 14, 18);
      doc.text(`Reporting Period: ${periodLabel}  |  Currency: Indian Rupee (INR)`, 14, 24);

      // Top Right Meta in Header
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`Doc Ref: EXC-${selectedYear}${String(selectedMonth).padStart(2, '0')}`, pageWidth - 14, 12, { align: 'right' });
      doc.text(`Generated: ${dayjs().format('DD/MM/YYYY, hh:mm A')}`, pageWidth - 14, 18, { align: 'right' });
      doc.text('Venueza Cloud Verified', pageWidth - 14, 24, { align: 'right' });

      // ── FINANCIAL EXECUTIVE KPI MATRIX ──
      let curY = 38;

      doc.setTextColor(...slateDark);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. FINANCIAL EXECUTIVE SUMMARY', 14, curY);
      curY += 5;

      const kpiBoxWidth = 33.5;
      const kpiBoxHeight = 22;
      const kpiGap = 3.6;

      // KPI 1: Revenue
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, curY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(...textMuted);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL REVENUE', 16, curY + 6);
      doc.setFontSize(10.5);
      doc.setTextColor(27, 67, 50);
      doc.text(formatPDFCurrency(totalRevenue), 16, curY + 13.5);
      doc.setFontSize(6.5);
      doc.setTextColor(...textMuted);
      doc.text(`${totalBookings} Events`, 16, curY + 18.5);

      // KPI 2: Expenses
      const kpi2X = 14 + kpiBoxWidth + kpiGap;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(kpi2X, curY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(...textMuted);
      doc.text('TOTAL EXPENSES', kpi2X + 2, curY + 6);
      doc.setFontSize(10.5);
      doc.setTextColor(190, 18, 60);
      doc.text(formatPDFCurrency(totalExpenses), kpi2X + 2, curY + 13.5);
      doc.setFontSize(6.5);
      doc.setTextColor(...textMuted);
      doc.text(`${expenseRatio}% of Rev`, kpi2X + 2, curY + 18.5);

      // KPI 3: Net Operating Balance
      const kpi3X = kpi2X + kpiBoxWidth + kpiGap;
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(kpi3X, curY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(...textMuted);
      doc.text('NET BALANCE', kpi3X + 2, curY + 6);
      doc.setFontSize(10.5);
      doc.setTextColor(netBalance >= 0 ? 5 : 220, netBalance >= 0 ? 150 : 38, netBalance >= 0 ? 105 : 38);
      doc.text(formatPDFCurrency(netBalance), kpi3X + 2, curY + 13.5);
      doc.setFontSize(6.5);
      doc.setTextColor(...textMuted);
      doc.text(`${operatingMargin}% Margin`, kpi3X + 2, curY + 18.5);

      // KPI 4: Pending Balance Due (Highlighted for Auditorium Owners)
      const kpi4X = kpi3X + kpiBoxWidth + kpiGap;
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(kpi4X, curY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
      doc.text('BALANCE DUE', kpi4X + 2, curY + 6);
      doc.setFontSize(10.5);
      doc.setTextColor(180, 83, 9);
      doc.text(formatPDFCurrency(pendingBalanceAmount), kpi4X + 2, curY + 13.5);
      doc.setFontSize(6.5);
      doc.setTextColor(180, 83, 9);
      doc.text(`${bookingsWithPendingBalance} Pending`, kpi4X + 2, curY + 18.5);

      // KPI 5: Lead Conversion
      const kpi5X = kpi4X + kpiBoxWidth + kpiGap;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(kpi5X, curY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(...textMuted);
      doc.setFont('helvetica', 'bold');
      doc.text('CONVERSION', kpi5X + 2, curY + 6);
      doc.setFontSize(10.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`${conversionRate}%`, kpi5X + 2, curY + 13.5);
      doc.setFontSize(6.5);
      doc.setTextColor(...textMuted);
      doc.text(`${totalBookings}/${totalEnquiries} Enq`, kpi5X + 2, curY + 18.5);

      curY += kpiBoxHeight + 8;

      // ── SECTION 2: OPERATIONS OVERVIEW ROW ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...slateDark);
      doc.text('2. OPERATIONAL SUMMARY', 14, curY);
      curY += 5;

      const opsHeaders = [['Confirmed Bookings', 'Total Enquiries', 'New Customers', 'Cancellations', 'Avg. Booking Value']];
      const opsData = [[
        String(totalBookings),
        String(totalEnquiries),
        String(data?.operations?.newCustomers || 0),
        String(data?.operations?.cancelledBookings || 0),
        formatPDFCurrency(avgBookingValue)
      ]];

      autoTable(doc, {
        startY: curY,
        head: opsHeaders,
        body: opsData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8.5, halign: 'center', textColor: [15, 23, 42], font: 'helvetica' },
        styles: { cellPadding: 3 }
      });

      curY = doc.lastAutoTable.finalY + 8;

      // ── SECTION 3: RECENT BOOKINGS TABLE ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...slateDark);
      doc.text('3. CONFIRMED BOOKINGS BREAKDOWN', 14, curY);
      curY += 4;

      const bookingRows = recentBookings.map(b => [
        b.bookingId || '-',
        formatDate(b.date),
        b.customerName || 'Customer',
        b.hall || 'Main Hall',
        formatPDFCurrency(b.totalAmount),
        formatPDFCurrency(b.balanceAmount),
        b.status || 'Confirmed'
      ]);

      if (bookingRows.length === 0) {
        bookingRows.push(['-', '-', 'No bookings recorded for this month', '-', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: curY,
        head: [['Booking Ref', 'Date', 'Customer Name', 'Hall Space', 'Total Contract', 'Balance Due', 'Status']],
        body: bookingRows,
        foot: recentBookings.length > 0 ? [[
          { content: 'Total Confirmed Bookings Value:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatPDFCurrency(totalRenderedBookingRevenue), styles: { halign: 'right', fontStyle: 'bold', textColor: [27, 67, 50] } },
          { content: formatPDFCurrency(totalRenderedBookingBalance), styles: { halign: 'right', fontStyle: 'bold', textColor: [190, 18, 60] } },
          ''
        ]] : undefined,
        theme: 'striped',
        headStyles: { fillColor: [27, 67, 50], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 22 },
          2: { cellWidth: 38 },
          3: { cellWidth: 28 },
          4: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
          5: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
          6: { halign: 'center', cellWidth: 16 }
        },
        styles: { cellPadding: 2.5 }
      });

      curY = doc.lastAutoTable.finalY + 8;

      // ── SECTION 4: CANCELLED / DROPPED BOOKINGS BREAKDOWN ──
      if (curY > 210) {
        doc.addPage();
        curY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...slateDark);
      doc.text('4. CANCELLED / DROPPED BOOKINGS BREAKDOWN', 14, curY);
      curY += 4;

      const totalRenderedCancelledRevenue = cancelledBookingsList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const cancelledRows = cancelledBookingsList.map(b => [
        b.bookingId || '-',
        formatDate(b.date),
        b.customerName || 'Customer',
        b.hall || 'Main Hall',
        formatPDFCurrency(b.totalAmount),
        b.reason || 'Cancelled'
      ]);

      if (cancelledRows.length === 0) {
        cancelledRows.push(['-', '-', 'No cancellations recorded for this period', '-', '-', 'None']);
      }

      autoTable(doc, {
        startY: curY,
        head: [['Booking Ref', 'Event Date', 'Customer Name', 'Hall Space', 'Original Contract', 'Cancellation Status']],
        body: cancelledRows,
        foot: cancelledBookingsList.length > 0 ? [[
          { content: 'Total Cancelled Contract Value:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatPDFCurrency(totalRenderedCancelledRevenue), styles: { halign: 'right', fontStyle: 'bold', textColor: [190, 18, 60] } },
          ''
        ]] : undefined,
        theme: 'striped',
        headStyles: { fillColor: [159, 18, 57], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 24 },
          2: { cellWidth: 42 },
          3: { cellWidth: 30 },
          4: { halign: 'right', fontStyle: 'bold', cellWidth: 32 },
          5: { halign: 'center', cellWidth: 26, textColor: [190, 18, 60], fontStyle: 'bold' }
        },
        styles: { cellPadding: 2.5 }
      });

      curY = doc.lastAutoTable.finalY + 8;

      // Check if page break is needed before expenses
      if (curY > 210) {
        doc.addPage();
        curY = 20;
      }

      // ── SECTION 5: EXPENSES BREAKDOWN ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...slateDark);
      doc.text('5. OPERATIONAL EXPENSES BREAKDOWN', 14, curY);
      curY += 4;

      const expenseRows = recentExpenses.map(e => [
        formatDate(e.date),
        e.category || 'General',
        e.description || '-',
        formatPDFCurrency(e.amount)
      ]);

      if (expenseRows.length === 0) {
        expenseRows.push(['-', 'No expenses recorded for this period', '-', '-']);
      }

      autoTable(doc, {
        startY: curY,
        head: [['Expense Date', 'Category', 'Description / Vendor', 'Amount Paid']],
        body: expenseRows,
        foot: recentExpenses.length > 0 ? [[
          { content: 'Total Operational Expenses:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatPDFCurrency(totalRenderedExpenses), styles: { halign: 'right', fontStyle: 'bold', textColor: [190, 18, 60] } }
        ]] : undefined,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 36 },
          2: { cellWidth: 80 },
          3: { halign: 'right', fontStyle: 'bold', cellWidth: 38 }
        },
        styles: { cellPadding: 2.5 }
      });

      curY = doc.lastAutoTable.finalY + 8;

      // Check if page break is needed before collections
      if (curY > 220) {
        doc.addPage();
        curY = 20;
      }

      // ── SECTION 6: COLLECTIONS / PAYMENTS ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...slateDark);
      doc.text('6. CASH & BANK COLLECTIONS', 14, curY);
      curY += 4;

      const paymentRows = recentPayments.map((p, i) => [
        p.paymentNumber || `REC-${i+1}`,
        formatDate(p.paymentDate),
        p.method || 'Direct',
        formatPDFCurrency(p.amount)
      ]);

      if (paymentRows.length === 0) {
        paymentRows.push(['-', 'No payment collections recorded for this period', '-', '-']);
      }

      autoTable(doc, {
        startY: curY,
        head: [['Receipt Number', 'Payment Date', 'Payment Channel', 'Amount Collected']],
        body: paymentRows,
        foot: recentPayments.length > 0 ? [[
          { content: 'Total Realized Collections:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatPDFCurrency(totalRenderedPayments), styles: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] } }
        ]] : undefined,
        theme: 'striped',
        headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59], font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 36 },
          1: { cellWidth: 30 },
          2: { cellWidth: 60 },
          3: { halign: 'right', fontStyle: 'bold', cellWidth: 56 }
        },
        styles: { cellPadding: 2.5 }
      });

      // ── FORMAL AUDIT FOOTER ──
      const finalY = doc.lastAutoTable.finalY + 12;
      const footerY = Math.min(finalY, 280);

      doc.setDrawColor(203, 213, 225);
      doc.line(14, footerY, pageWidth - 14, footerY);

      doc.setFontSize(7.5);
      doc.setTextColor(...textMuted);
      doc.text(`Confidential Executive Document • Generated by Venueza Cloud ERP for ${venueTitle}`, 14, footerY + 5);
      doc.text('Authorized Signature: ___________________________', pageWidth - 14, footerY + 5, { align: 'right' });

      // Trigger robust browser download
      const safeFilename = `Executive_Summary_${periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      robustDownloadPDF(doc, safeFilename);
      setIsExporting(false);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setIsExporting(false);
      // Fallback to browser print
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#64748b' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #1B4332', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1B4332' }}>Generating Executive Performance Summary...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Unable to Load Executive Summary</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Please verify your connection or choose another month.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 14px 40px', fontFamily: "'DM Sans', sans-serif", color: '#0f172a' }}>
      
      {/* ──────────────────────────────────────────────────────────────────────────
          1. LUXURY EXECUTIVE HEADER & DATE BAR (MOBILE + DESKTOP)
      ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 20, 
        padding: '16px 18px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
        border: '1px solid #e2e8f0', 
        marginBottom: 14 
      }}>
        
        {/* Top Venue Badge & Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                Executive Cockpit
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{venueTitle}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif" }}>
              Executive Performance Summary
            </h1>
          </div>

          {/* Direct 1-Click PDF Action */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(27,67,50,0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Download size={14} color="#D4A017" />
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>

        {/* ── CREATIVE EXECUTIVE PERIOD SWITCHER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Segmented Switcher Tabs */}
          <div style={{
            background: '#f8fafc',
            padding: 4,
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4
          }}>
            {PERIOD_TABS.map((tab) => {
              const active = periodType === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setPeriodType(tab.key)}
                  style={{
                    flex: '1 1 auto',
                    minWidth: 80,
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    background: active ? '#1B4332' : 'transparent',
                    color: active ? '#fff' : '#64748b',
                    boxShadow: active ? '0 2px 8px rgba(27,67,50,0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {tab.key === 'this_month' && <Clock size={13} />}
                  {tab.key === 'this_fy' && <Sparkles size={13} />}
                  {tab.key === 'month_wise' && <Calendar size={13} />}
                  {tab.key === 'all_time' && <Layers size={13} />}
                  {tab.key === 'custom' && <Filter size={13} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-bar: Dynamic Controls for Active Period */}
          {periodType === 'month_wise' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: '#f8fafc', 
              padding: '8px 12px', 
              borderRadius: 14, 
              border: '1px solid #e2e8f0',
              gap: 8,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button 
                  onClick={handlePrevMonth}
                  style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="Previous Month"
                >
                  <ChevronLeft size={16} color="#475569" />
                </button>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', minWidth: 120, textAlign: 'center' }}>
                  {monthName} {selectedYear}
                </span>
                <button 
                  onClick={handleNextMonth}
                  style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="Next Month"
                >
                  <ChevronRight size={16} color="#475569" />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i+1} value={i+1}>{dayjs().month(i).format('MMMM')}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                >
                  {[2024, 2025, 2026, 2027, 2028].map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {periodType === 'custom' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              padding: '8px 12px',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              gap: 10,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 180px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>From</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 180px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>To</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }}
                />
              </div>
            </div>
          )}

          {(periodType === 'this_month' || periodType === 'this_fy' || periodType === 'all_time') && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              padding: '8px 14px',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              fontSize: 12,
              fontWeight: 700,
              color: '#334155'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#1B4332" />
                <span>Active Period: <strong style={{ color: '#1B4332' }}>{periodLabel}</strong></span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                Live Summary
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. HERO FINANCIAL COMMAND CENTER (ULTRA-CREATIVE LUXURY CARD)
      ────────────────────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #091910 0%, #133324 50%, #1B4332 100%)',
        borderRadius: 22,
        padding: '20px 22px',
        color: '#fff',
        boxShadow: '0 12px 36px rgba(9, 25, 16, 0.28)',
        marginBottom: 14,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(212, 160, 23, 0.25)'
      }}>
        
        {/* Soft Golden Ambient Light */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(212, 160, 23, 0.15)', borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />

        {/* Card Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={15} color="#D4A017" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
              Net Operating Balance
            </span>
          </div>
          <span style={{ 
            fontSize: 10, 
            fontWeight: 800, 
            background: Number(netBalance) >= 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(244, 63, 94, 0.2)', 
            color: Number(netBalance) >= 0 ? '#86efac' : '#fda4af', 
            padding: '3px 9px', 
            borderRadius: 12,
            border: Number(netBalance) >= 0 ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
          }}>
            {Number(operatingMargin) >= 0 ? `+${operatingMargin}% Margin` : `${operatingMargin}% Deficit`}
          </span>
        </div>

        {/* Huge Net Balance Figure */}
        <div style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', marginBottom: 16 }}>
          {formatCurrency(netBalance)}
        </div>

        {/* Integrated Triple Metric Bar (Revenue, Balance Due, Expenses) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.12)'
        }}>
          
          {/* Revenue */}
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <TrendingUp size={13} color="#4ade80" />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Total Revenue</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
              {formatCurrency(totalRevenue)}
            </div>
            <div style={{ fontSize: 10, color: '#86efac', fontWeight: 600, marginTop: 2 }}>
              {totalBookings} Bookings (Avg {formatCurrency(avgBookingValue)})
            </div>
          </div>

          {/* Pending Balance Due Highlight (Auditorium Priority) */}
          <div 
            onClick={() => { setActiveTab('bookings'); setBookingFilter('confirmed'); }}
            style={{ 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.15) 100%)', 
              padding: '10px 12px', 
              borderRadius: 14, 
              border: '1px solid rgba(245, 158, 11, 0.45)',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)',
              cursor: 'pointer'
            }}
            title="Click to view bookings with balance due"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="#fbbf24" />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fef08a', textTransform: 'uppercase' }}>Balance Due</span>
              </div>
              <ArrowUpRight size={13} color="#fbbf24" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fef08a' }}>
              {formatCurrency(pendingBalanceAmount)}
            </div>
            <div style={{ fontSize: 10, color: '#fde68a', fontWeight: 600, marginTop: 2 }}>
              {bookingsWithPendingBalance} Bookings Pending
            </div>
          </div>

          {/* Expenses */}
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <TrendingDown size={13} color="#f87171" />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Total Expenses</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
              {formatCurrency(totalExpenses)}
            </div>
            <div style={{ fontSize: 10, color: '#fca5a5', fontWeight: 600, marginTop: 2 }}>
              {expenseRatio}% of Gross Revenue
            </div>
          </div>

        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2B. VIP AUDITORIUM PENDING BALANCE COMMAND CARD (HIGH IMPACT)
      ────────────────────────────────────────────────────────────────────────── */}
      <div 
        onClick={() => { setActiveTab('bookings'); setBookingFilter('confirmed'); }}
        style={{
          background: 'linear-gradient(135deg, #451a03 0%, #78350f 45%, #b45309 100%)',
          borderRadius: 20,
          padding: '18px 20px',
          color: '#fff',
          boxShadow: '0 10px 30px rgba(120, 53, 15, 0.28)',
          marginBottom: 14,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
        title="Click to view pending bookings"
      >
        {/* Amber Ambient Glow */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: 'rgba(251, 191, 36, 0.2)', borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#fbbf24" />
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#fef3c7' }}>
                Pending Balance to Collect (Receivables)
              </span>
              <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                Auditorium Customer Payment Outstanding
              </span>
            </div>
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            background: 'rgba(251, 191, 36, 0.25)',
            color: '#fef08a',
            padding: '3px 10px',
            borderRadius: 12,
            border: '1px solid rgba(251, 191, 36, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Sparkles size={11} color="#fef08a" />
            {bookingsWithPendingBalance} Bookings Pending
          </span>
        </div>

        {/* Huge Balance Figure */}
        <div style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', marginBottom: 12 }}>
          {formatCurrency(pendingBalanceAmount)}
        </div>

        {/* Breakdown bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.15)'
        }}>
          <div style={{ background: 'rgba(0,0,0,0.18)', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#fde68a', textTransform: 'uppercase', display: 'block' }}>Total Contract Value</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{formatCurrency(totalContractValue)}</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.18)', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#86efac', textTransform: 'uppercase', display: 'block' }}>Advance Collected</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{formatCurrency(totalAdvanceCollected)}</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.18)', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#fef3c7', textTransform: 'uppercase', display: 'block' }}>Quick Action</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>View Bookings</span>
            </div>
            <ArrowUpRight size={16} color="#fbbf24" />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. OPERATIONAL KPI MATRIX (2x2 GRID)
      ────────────────────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 14
      }}>
        
        {/* Bookings */}
        <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Confirmed</span>
            <Calendar size={14} color="#1B4332" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{totalBookings}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#1B4332', background: '#ecfdf5', padding: '1px 6px', borderRadius: 6 }}>
            {conversionRate}% Conversion
          </span>
        </div>

        {/* Enquiries */}
        <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Total Enquiries</span>
            <HelpCircle size={14} color="#2563eb" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{totalEnquiries}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 6px', borderRadius: 6 }}>
            Customer Pipeline
          </span>
        </div>

        {/* New Customers */}
        <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>New Customers</span>
            <Users size={14} color="#7c3aed" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{data?.operations?.newCustomers || 0}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', borderRadius: 6 }}>
            Client Profiles
          </span>
        </div>

        {/* Cancellations */}
        <div 
          onClick={() => { setActiveTab('bookings'); setBookingFilter('cancelled'); }}
          style={{ 
            background: '#fff', 
            padding: '12px 14px', 
            borderRadius: 16, 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to view cancellations"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Cancellations</span>
            <AlertCircle size={14} color="#e11d48" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#e11d48' }}>{data?.operations?.cancelledBookings || 0}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '1px 6px', borderRadius: 6 }}>
              Dropped Events
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>View List →</span>
          </div>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. INTERACTIVE TAB NAVIGATION (CREATIVE, INSTANT JUMP)
      ────────────────────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        padding: 4,
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        marginBottom: 14,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4
      }}>
        {[
          { key: 'overview', label: 'Summary' },
          { key: 'bookings', label: `Bookings (${recentBookings.length + cancelledBookingsList.length})` },
          { key: 'expenses', label: `Expenses (${recentExpenses.length})` },
          { key: 'payments', label: `Collections (${recentPayments.length})` }
        ].map(t => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '9px 4px',
                borderRadius: 12,
                border: 'none',
                background: active ? '#1B4332' : 'transparent',
                color: active ? '#fff' : '#64748b',
                fontSize: 11,
                fontWeight: active ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: active ? '0 2px 8px rgba(27,67,50,0.2)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. TAB CONTENT PANELS
      ────────────────────────────────────────────────────────────────────────── */}

      {/* TAB 1: OVERVIEW & EVENT DISTRIBUTION */}
      {activeTab === 'overview' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif" }}>
                Event Type Distribution
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Categorical share of bookings in {monthName}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1B4332', background: '#ecfdf5', padding: '2px 8px', borderRadius: 8 }}>
              {data?.analytics?.eventTypes?.length || 0} Categories
            </span>
          </div>

          {data?.analytics?.eventTypes?.length > 0 ? (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data.analytics.eventTypes} 
                    cx="50%" 
                    cy="46%" 
                    innerRadius={42} 
                    outerRadius={68} 
                    paddingAngle={4} 
                    dataKey="value"
                  >
                    {data.analytics.eventTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name) => [`${val} events`, name]}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={30} 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: 11, color: '#475569', paddingTop: 6 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              No event type data found for this month.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif" }}>
                Bookings & Events Schedule
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Active Contract Value: {formatCurrency(totalRenderedBookingRevenue)}</p>
            </div>
            
            {/* Filter pills: All / Confirmed / Cancelled */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
              {[
                { key: 'all', label: `All (${recentBookings.length + cancelledBookingsList.length})` },
                { key: 'confirmed', label: `Confirmed (${recentBookings.length})` },
                { key: 'cancelled', label: `Cancelled (${cancelledBookingsList.length})` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setBookingFilter(f.key)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: bookingFilter === f.key ? 800 : 600,
                    background: bookingFilter === f.key ? '#fff' : 'transparent',
                    color: bookingFilter === f.key ? (f.key === 'cancelled' ? '#e11d48' : '#1B4332') : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: bookingFilter === f.key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {displayedBookings.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No bookings recorded for this period.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayedBookings.map((b, i) => {
                const isCancelled = !!b.deletedAt || b.status === 'Cancelled';
                return (
                  <div key={i} style={{ 
                    background: isCancelled ? '#fff5f5' : '#f8fafc', 
                    padding: '12px 14px', 
                    borderRadius: 14, 
                    border: `1px solid ${isCancelled ? '#fecaca' : '#e2e8f0'}` 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{b.customerName || 'Customer'}</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{b.bookingId} • {b.hall || 'Main Hall'}</div>
                      </div>
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 800, 
                        background: isCancelled ? '#fee2e2' : '#e2e8f0', 
                        color: isCancelled ? '#b91c1c' : '#334155', 
                        padding: '2px 8px', 
                        borderRadius: 6,
                        border: isCancelled ? '1px solid #fca5a5' : 'none'
                      }}>
                        {isCancelled ? 'Cancelled' : (b.status || 'Confirmed')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, paddingTop: 6, borderTop: `1px solid ${isCancelled ? '#fee2e2' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        📅 {formatDate(b.date)}
                        {isCancelled && b.reason && (
                          <span style={{ marginLeft: 8, color: '#e11d48', fontWeight: 600 }}>({b.reason})</span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isCancelled ? '#94a3b8' : '#1B4332', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                          {formatCurrency(b.totalAmount)}
                        </div>
                        {Number(b.balanceAmount) > 0 && !isCancelled && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#e11d48' }}>Bal: {formatCurrency(b.balanceAmount)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif" }}>
                Operational Expenses
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Total Outflow: {formatCurrency(totalRenderedExpenses)}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '2px 8px', borderRadius: 8 }}>
              {recentExpenses.length} Records
            </span>
          </div>

          {recentExpenses.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No expenses recorded for this month.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentExpenses.map((e, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{e.category || 'General'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{e.description || 'No description'}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#e11d48' }}>
                      {formatCurrency(e.amount)}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                    📅 {formatDate(e.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COLLECTIONS / PAYMENTS */}
      {activeTab === 'payments' && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'Playfair Display', serif" }}>
                Collections & Receipts
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Total Inflow: {formatCurrency(totalRenderedPayments)}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 8 }}>
              {recentPayments.length} Records
            </span>
          </div>

          {recentPayments.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No payment receipts recorded for this month.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentPayments.map((p, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{p.paymentNumber || `REC-${i+1}`}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Method: {p.method || 'Direct'}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>
                      {formatCurrency(p.amount)}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                    📅 {formatDate(p.paymentDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
