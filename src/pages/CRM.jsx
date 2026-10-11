import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Filter, Plus, Search, Calendar, ChevronRight, LayoutGrid, List, CheckCircle2, RefreshCw, AlertCircle, Trash2, Edit2, XCircle, Clock, Sparkles, TrendingUp, X, MessageSquare } from "lucide-react";
import { enquiriesAPI } from "../services/api";
import { useToast } from "../components/Toast";
import NewEnquiryModal from "../components/NewEnquiryModal";
import ConvertToBookingModal from "../components/ConvertToBookingModal";
import SafeDeleteModal from "../components/SafeDeleteModal";
import SlotClashResolutionModal from "../components/SlotClashResolutionModal";
import { useRole } from "../context/RoleContext";
import { useBookings } from "../context/BookingsContext";

const pipelineStages = [
  "New Enquiry", "Contacted", "Follow-up", "Interested", "Customer Visit", 
  "Booking Confirmed", "Lost", "Cancelled"
];

const LEAD_SCORE_STYLE = {
  Hot:  { bg: "#dcfce7", color: "#166534", label: "🟢 Hot" },
  Warm: { bg: "#fef08a", color: "#a16207", label: "🟡 Warm" },
  Cold: { bg: "#f1f5f9", color: "#64748b", label: "🔴 Cold" },
};

function KPISkeleton() {
  return (
    <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "12px 14px", minHeight: 74, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div style={{ height: 11, background: "#f1f5f9", borderRadius: 6, width: "60%", marginBottom: 12, animation: "pulse 1.5s infinite" }} />
      <div style={{ height: 22, background: "#f1f5f9", borderRadius: 6, width: "40%", animation: "pulse 1.5s infinite" }} />
    </div>
  );
}

export default function CRM() {
  const { user, role } = useRole();
  const { bookings } = useBookings?.() || { bookings: [] };
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("board");
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertEnquiry, setConvertEnquiry] = useState(null);
  const [editEnquiry, setEditEnquiry] = useState(null);
  const [hoveredEnq, setHoveredEnq] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [waitlistFilter, setWaitlistFilter] = useState("all"); // 'all' | 'clashed' | 'waitlist' | 'date_released' | 'standard'
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [clashModalData, setClashModalData] = useState(null); // { open, bookedDate, hall, competingLeads }
  const [cardWhatsAppNotify, setCardWhatsAppNotify] = useState({});

  // API state
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await enquiriesAPI.getAll(params);
      let data = res.data.data || [];
      if (role === "Sales") {
        data = data.filter(e => e.createdBy === user?.id || e.salesExecutiveId === user?.id || e.SalesExecutive?.name === user?.name || e.assignedTo === user?.name || e.userId === user?.id);
      }
      setEnquiries(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Computed KPIs from live data
  const activeEnquiries = enquiries.filter(e => !["Booking Confirmed", "Lost", "Cancelled"].includes(e.status)).length;
  const converted = enquiries.filter(e => e.status === "Booking Confirmed").length;
  const total = enquiries.length;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  const waitlistedCount = enquiries.filter(e => e.isWaitlisted).length;

  const handleStatusChange = async (enquiryId, newStatus) => {
    try {
      await enquiriesAPI.updateStatus(enquiryId, newStatus);
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: newStatus } : e));
      addToast(`Moved to ${newStatus}`, "success");
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };
  
  const handleDeleteEnquiry = (enq) => {
    const name = getEnquiryName(enq);
    setDeleteTarget({ id: enq.id, name: `${enq.enquiryNumber || 'ENQ'} — ${name}` });
  };

  const handleEnquiryCreated = () => {
    setShowEnquiryModal(false);
    setEditEnquiry(null);
    fetchEnquiries();
    addToast(editEnquiry ? "Enquiry updated successfully! 🎉" : "Enquiry saved successfully! 🎉", "success");
  };

  const handleConvertClick = (enq) => {
    setConvertEnquiry(enq);
    setShowConvertModal(true);
  };

  const getEnquiryName = (enq) => {
    if (enq.enquirerName) return enq.enquirerName;
    if (enq.Customer) return enq.Customer.name;
    return enq.customerName || "Unknown";
  };

  const getEnquiryPhone = (enq) => {
    if (enq.enquirerPhone) return enq.enquirerPhone;
    if (enq.Customer) return enq.Customer.phone;
    return enq.phone || "";
  };

  // Checks if a date/session has an active confirmed booking or confirmed enquiry
  const hasActiveBookingConflict = useCallback((enq) => {
    if (!enq.tentativeDate) return false;
    
    // Check against confirmed enquiries (excluding itself)
    const hasEnqConflict = enquiries.some(e => {
      if (e.id === enq.id) return false;
      if (e.status !== "Booking Confirmed") return false;
      if (e.tentativeDate !== enq.tentativeDate) return false;
      if (e.session && enq.session && e.session !== enq.session && e.session !== "Full Day" && enq.session !== "Full Day") return false;
      if (e.hallPreference && enq.hallPreference && e.hallPreference !== enq.hallPreference) return false;
      return true;
    });
    if (hasEnqConflict) return true;

    // Check against confirmed bookings in database
    const hasBookingConflict = (bookings || []).some(b => {
      if (b.status === "Cancelled") return false;
      const bDate = b.date ? (typeof b.date === "string" ? b.date.split("T")[0] : new Date(b.date).toISOString().split("T")[0]) : null;
      if (!bDate || bDate !== enq.tentativeDate) return false;
      if (b.session && enq.session && b.session !== enq.session && b.session !== "Full Day" && enq.session !== "Full Day") return false;
      if (b.hall && enq.hallPreference && b.hall !== enq.hallPreference) return false;
      return true;
    });

    return hasBookingConflict;
  }, [enquiries, bookings]);

  const getConflictStatus = useCallback((enq) => {
    if (["Booking Confirmed", "Lost", "Cancelled"].includes(enq.status)) return false;
    if (enq.isWaitlisted) return false;
    return hasActiveBookingConflict(enq);
  }, [hasActiveBookingConflict]);

  // For a waitlisted enquiry: returns true if the previously booked slot is now CANCELLED / FREE!
  const isWaitlistSlotFree = useCallback((enq) => {
    if (!enq.isWaitlisted) return false;
    if (["Booking Confirmed", "Lost", "Cancelled"].includes(enq.status)) return false;
    if (enq.waitlistStatus === "Date Released") return true;
    // Real-time check: if date is set and there is NO active confirmed booking on that slot anymore!
    if (enq.tentativeDate && !hasActiveBookingConflict(enq)) return true;
    return false;
  }, [hasActiveBookingConflict]);

  const handleNotifyReleasedClient = (enq) => {
    const phone = getEnquiryPhone(enq);
    const name = getEnquiryName(enq);
    if (!phone) {
      addToast("Client phone number not available", "error");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const msg = `Dear ${name},\n\n🎉 Great news from our auditorium!\n\nThe date you previously enquired about — *${enq.tentativeDate}*${enq.session ? ` (${enq.session})` : ""}${enq.hallPreference ? ` at ${enq.hallPreference}` : ""} — has just become AVAILABLE due to a recent cancellation!\n\nSince you were on our Priority VIP Waitlist, you have first preference to confirm this date. Please reply or call us immediately to lock in your booking before it opens to public!`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    addToast("WhatsApp opened with Date Release notification! 💬", "success");
  };

  const clashedCount = enquiries.filter(e => getConflictStatus(e)).length;
  const dateReleasedCount = enquiries.filter(e => isWaitlistSlotFree(e)).length;

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => {
      if (waitlistFilter === "clashed") return getConflictStatus(e);
      if (waitlistFilter === "waitlist") return e.isWaitlisted;
      if (waitlistFilter === "date_released") return isWaitlistSlotFree(e);
      if (waitlistFilter === "standard") return !e.isWaitlisted && !getConflictStatus(e);
      return true;
    });
  }, [enquiries, waitlistFilter, getConflictStatus, isWaitlistSlotFree]);

  const handleMoveToWaitlistWithWhatsApp = async (enq) => {
    try {
      await enquiriesAPI.update(enq.id, {
        isWaitlisted: true,
        waitlistStatus: "Waiting",
        waitlistNotes: `Moved to VIP Waitlist because slot on ${enq.tentativeDate} was confirmed by another booking.`,
      });
      setEnquiries(prev => prev.map(e => e.id === enq.id ? { ...e, isWaitlisted: true, waitlistStatus: "Waiting" } : e));
      addToast("Moved to VIP Waitlist! ⏳", "success");

      const shouldSend = cardWhatsAppNotify[enq.id] ?? true;
      if (shouldSend) {
        const phone = getEnquiryPhone(enq);
        const name = getEnquiryName(enq);
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, "").slice(-10);
          const msg = `Dear ${name},\n\nThank you for choosing us for your event on ${enq.tentativeDate || "your requested date"}${enq.hallPreference ? ` at ${enq.hallPreference}` : ""}.\n\nThis specific date has just been confirmed by another booking. We have placed you as our Priority #1 on our VIP Date Waitlist! If this booking gets released or cancelled, we will notify you immediately.\n\nWould you also like to explore an alternate date with us? Let us know!`;
          window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      }
    } catch (err) {
      addToast("Failed to move to waitlist", "error");
    }
  };

  const handleInformAndClose = async (enq) => {
    try {
      await enquiriesAPI.updateStatus(enq.id, "Lost");
      setEnquiries(prev => prev.map(e => e.id === enq.id ? { ...e, status: "Lost" } : e));
      addToast("Enquiry marked as Lost ❌", "info");

      const shouldSend = cardWhatsAppNotify[enq.id] ?? true;
      if (shouldSend) {
        const phone = getEnquiryPhone(enq);
        const name = getEnquiryName(enq);
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, "").slice(-10);
          const msg = `Dear ${name},\n\nThank you for reaching out to us for ${enq.tentativeDate || "your requested date"}${enq.hallPreference ? ` at ${enq.hallPreference}` : ""}.\n\nUnfortunately this date has been reserved for another booking. We apologize for the inconvenience and hope to host your future events!`;
          window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      }
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  return (
    <div className="hm-crm-wrapper">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="hm-page-heading">Sales Pipeline</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Track leads and convert enquiries into bookings.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {/* New Enquiry button removed as per request */}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="hm-crm-kpis">
        {loading ? (
          [1,2,3,4,5,6].map(i => <KPISkeleton key={i} />)
        ) : (
          [
            { label: "Active Leads", value: activeEnquiries, sub: "In pipeline", icon: Sparkles, color: "#0284c7", badgeBg: "#e0f2fe" },
            { label: "Total Leads", value: total, sub: "All enquiries", icon: Users, color: "#6366f1", badgeBg: "#ede9fe" },
            { label: "VIP Waitlist", value: waitlistedCount, sub: waitlistedCount > 0 ? "Queued for release" : "No waitlist", icon: Clock, color: "#d97706", badgeBg: "#fef3c7", border: waitlistedCount > 0 ? "1px solid #fde68a" : undefined },
            { label: "Slot Clashes", value: clashedCount, sub: clashedCount > 0 ? "Action required" : "All slots clear", icon: AlertCircle, color: clashedCount > 0 ? "#dc2626" : "#64748b", badgeBg: clashedCount > 0 ? "#fee2e2" : "#f1f5f9", border: clashedCount > 0 ? "1.5px solid #fca5a5" : undefined, glow: clashedCount > 0 },
            { label: "Converted", value: converted, sub: "Confirmed bookings", icon: CheckCircle2, color: "#166534", badgeBg: "#dcfce7" },
            { label: "Win Rate", value: `${conversionRate}%`, sub: "Lead to booking", icon: TrendingUp, color: "#9333ea", badgeBg: "#f3e8ff" },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} style={{
                background: "#fff",
                border: kpi.border || "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "12px 14px",
                boxShadow: kpi.glow ? "0 2px 10px rgba(220,38,38,0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 74,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {kpi.label}
                  </span>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: kpi.badgeBg, color: kpi.color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <Icon size={13} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, lineHeight: 1.1 }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 4 }}>
                    {kpi.sub}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Toggles & Filters */}
      <div className="hm-crm-toolbar">
        {/* Left Side: View Mode + Filter Tabs */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
          {/* Segmented View Toggle */}
          <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 3, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <button
              onClick={() => setViewMode("board")}
              style={{
                background: viewMode === "board" ? "#fff" : "transparent",
                border: "none",
                borderRadius: 7,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: viewMode === "board" ? "#1B4332" : "#64748b",
                boxShadow: viewMode === "board" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              <LayoutGrid size={14} /> Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                background: viewMode === "list" ? "#fff" : "transparent",
                border: "none",
                borderRadius: 7,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: viewMode === "list" ? "#1B4332" : "#64748b",
                boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              <List size={14} /> List
            </button>
          </div>

          <div style={{ width: 1, height: 24, background: "#e2e8f0" }} className="hm-desktop-only" />

          {/* Filter Pills with Horizontal Scroll on mobile */}
          <div className="hm-crm-filter-scroll">
            {[
              { id: "all", label: "All Leads", count: total },
              { id: "waitlist", label: "VIP Waitlist", count: waitlistedCount, icon: Clock, accent: "#d97706", bgActive: "#d97706", badgeActive: "#fef3c7" },
              { id: "clashed", label: "Slot Clashes", count: clashedCount, icon: AlertCircle, accent: "#dc2626", bgActive: "#dc2626", badgeActive: "#fee2e2", alert: clashedCount > 0 },
              { id: "date_released", label: "Date Released", count: dateReleasedCount, icon: Sparkles, accent: "#10b981", bgActive: "#10b981", badgeActive: "#dcfce7", highlight: dateReleasedCount > 0 },
            ].map((tab) => {
              const active = waitlistFilter === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setWaitlistFilter(tab.id)}
                  style={{
                    border: active ? "none" : tab.alert ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                    borderRadius: 9,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    background: active ? (tab.bgActive || "#1B4332") : tab.alert ? "#fef2f2" : "#fff",
                    color: active ? "#fff" : tab.alert ? "#dc2626" : "#475569",
                    boxShadow: active ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  {TabIcon && <TabIcon size={13} style={{ color: active ? "#fff" : tab.accent }} />}
                  <span>{tab.label}</span>
                  <span
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : tab.alert ? "#fee2e2" : "#f1f5f9",
                      color: active ? "#fff" : tab.alert ? "#dc2626" : "#64748b",
                      padding: "1px 6px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Search & Stage Dropdown */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: 170, flex: "1 1 170px" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "7px 10px 7px 32px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                outline: "none",
                fontSize: 12,
                width: "100%",
                background: "#f8fafc",
                boxSizing: "border-box",
                transition: "border 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1B4332")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "7px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                cursor: "pointer",
                background: "#fff",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
                outline: "none",
              }}
            >
              <option value="">All Stages</option>
              {pipelineStages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: "#dc2626", fontWeight: 600 }}>{error}</span>
          <button onClick={fetchEnquiries} style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Kanban Board */}
      {viewMode === "board" && !error && (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }}>
          {pipelineStages.map(stage => {
            const stageEnquiries = filteredEnquiries.filter(e => e.status === stage);
            return (
              <div key={stage} style={{ flex: "0 0 280px", background: "#f8f9fa", borderRadius: 12, padding: 16, border: "1px solid #eaeaea" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: 0.5 }}>{stage}</h3>
                  <span style={{ background: "#e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                    {loading ? "…" : stageEnquiries.length}
                  </span>
                </div>

                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1,2].map(i => (
                      <div key={i} style={{ background: "#fff", padding: 16, borderRadius: 8, height: 80, animation: "pulse 1.5s infinite" }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {stageEnquiries.map(enq => {
                      const lss = LEAD_SCORE_STYLE[enq.leadScore] || LEAD_SCORE_STYLE.Warm;
                      const name = getEnquiryName(enq);
                      const phone = getEnquiryPhone(enq);
                      const isPublic = enq.source === "Public Website";
                      return (
                        <div key={enq.id}
                          onMouseEnter={() => setHoveredEnq(enq.id)}
                          onMouseLeave={() => setHoveredEnq(null)}
                          style={{
                            background: isWaitlistSlotFree(enq) ? "#f0fdf4" : getConflictStatus(enq) ? "#fef2f2" : isPublic && !enq.SalesExecutive ? "#fef8ff" : enq.isWaitlisted ? "#fffdf5" : "#fff", 
                            padding: "14px", borderRadius: 10, 
                            border: isWaitlistSlotFree(enq) ? "2px solid #22c55e" : enq.isWaitlisted ? "1.5px solid #fde68a" : getConflictStatus(enq) ? "2px solid #ef4444" : isPublic && !enq.SalesExecutive ? "1px solid #e879f9" : "1px solid #eaeaea",
                            boxShadow: isWaitlistSlotFree(enq) ? "0 4px 14px rgba(34,197,94,0.2)" : getConflictStatus(enq) ? "0 4px 14px rgba(239,68,68,0.18)" : "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s",
                            transform: hoveredEnq === enq.id ? "translateY(-2px)" : "none",
                            position: "relative"
                          }}>
                          {isPublic && !enq.SalesExecutive && (
                             <div style={{ position: "absolute", top: -8, right: -8, background: "#d946ef", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 12, boxShadow: "0 2px 4px rgba(217,70,239,0.3)" }}>NEW WEB LEAD</div>
                          )}
                          {isWaitlistSlotFree(enq) && (
                            <div style={{ position: "absolute", top: -9, right: 10, background: "#16a34a", color: "#fff", fontSize: 9, fontWeight: 900, padding: "3px 10px", borderRadius: 12, boxShadow: "0 2px 8px rgba(22,163,74,0.4)", display: "flex", alignItems: "center", gap: 4, letterSpacing: 0.3, zIndex: 5 }}>
                              <Sparkles size={11} /> DATE RELEASED — RECOVER NOW!
                            </div>
                          )}
                          {getConflictStatus(enq) && !enq.isWaitlisted && (
                            <div style={{ position: "absolute", top: -8, right: -8, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 12, boxShadow: "0 2px 8px rgba(220,38,38,0.4)", display: "flex", alignItems: "center", gap: 3 }}>
                              🚨 SLOT BOOKED — ACTION NEEDED
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", background: "rgba(27,67,50,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                              {enq.enquiryNumber || `ENQ${String(enq.id).padStart(3,"0")}`}
                            </span>
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              {enq.isWaitlisted && (
                                <span style={{
                                  fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                                  background: isWaitlistSlotFree(enq) ? "#dcfce7" : "#fef3c7",
                                  color: isWaitlistSlotFree(enq) ? "#166534" : "#b45309",
                                  border: `1px solid ${isWaitlistSlotFree(enq) ? "#86efac" : "#fde68a"}`
                                }}>
                                  {isWaitlistSlotFree(enq) ? "🟢 Slot Available!" : "⏳ In Waitlist"}
                                </span>
                              )}
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: lss.bg, color: lss.color }}>
                                {lss.label}
                              </span>
                            </div>
                          </div>
                          <h4 style={{ margin: "0 0 3px", fontSize: 14, color: "#111", fontWeight: 700 }}>{name}</h4>
                          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#666" }}>
                            {enq.eventType}{enq.session ? ` (${enq.session})` : ""}
                          </p>

                          {/* Date Released Recovery Alert & Confirmation Box */}
                          {isWaitlistSlotFree(enq) && (
                            <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "8px 10px", margin: "10px 0", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 2px 6px rgba(22,163,74,0.08)" }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", display: "flex", alignItems: "center", gap: 5 }}>
                                <Sparkles size={13} color="#16a34a" /> <span>Slot Released! Date is now Free:</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#166534", fontWeight: 600 }}>
                                Previous booking on {enq.tentativeDate || "this date"} was cancelled. Ready to book or confirm with client!
                              </div>
                              <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleNotifyReleasedClient(enq); }}
                                  style={{ flex: 1, background: "#25D366", color: "#fff", border: "none", borderRadius: 6, padding: "6px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 1px 4px rgba(37,211,102,0.3)" }}
                                  title="Send WhatsApp confirmation to client offering this released date"
                                >
                                  <MessageSquare size={11} /> Confirm via WhatsApp
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleConvertClick(enq); }}
                                  style={{ flex: 1, background: "#166534", color: "#fff", border: "none", borderRadius: 6, padding: "6px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 1px 4px rgba(22,101,52,0.3)" }}
                                  title="Convert to Confirmed Booking immediately"
                                >
                                  <CheckCircle2 size={11} /> Convert Now
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Slot Clash Prompt & Fast Action Bar */}
                          {getConflictStatus(enq) && !enq.isWaitlisted && (
                            <div style={{ background: "#fff", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "8px 10px", margin: "10px 0", display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b" }}>
                                ⚠️ Slot booked for another client:
                              </div>
                              <label
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  cursor: "pointer",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: (cardWhatsAppNotify[enq.id] ?? true) ? "#15803d" : "#64748b",
                                  userSelect: "none",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={cardWhatsAppNotify[enq.id] ?? true}
                                  onChange={(e) => setCardWhatsAppNotify((prev) => ({ ...prev, [enq.id]: e.target.checked }))}
                                  style={{ accentColor: "#16a34a", cursor: "pointer" }}
                                />
                                <span>💬 Send WhatsApp message</span>
                              </label>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMoveToWaitlistWithWhatsApp(enq); }}
                                  style={{ flex: 1, background: "#d97706", color: "#fff", border: "none", borderRadius: 6, padding: "5px 6px", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}
                                  title="Move to VIP Waitlist & Notify via WhatsApp"
                                >
                                  <Clock size={11} /> To Waitlist
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleInformAndClose(enq); }}
                                  style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, padding: "5px 6px", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}
                                  title="Close Lead & Inform via WhatsApp"
                                >
                                  <XCircle size={11} /> Close Lead
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditEnquiry(enq); setShowEnquiryModal(true); }}
                                  style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 6, padding: "5px 6px", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}
                                  title="Propose Alternate Date"
                                >
                                  <Calendar size={11} /> Date
                                </button>
                              </div>
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#999" }}>
                              <Calendar size={11} /> {enq.tentativeDate || "TBD"}
                              {getConflictStatus(enq) && !enq.isWaitlisted && (
                                <span style={{ marginLeft: 4, background: "#fee2e2", color: "#dc2626", padding: "2px 4px", borderRadius: 4, fontSize: 9, fontWeight: 800 }} title="Date already booked by another confirmed enquiry">
                                  ⚠️ SLOT TAKEN
                                </span>
                              )}
                              {isWaitlistSlotFree(enq) && (
                                <span style={{ marginLeft: 4, background: "#dcfce7", color: "#166534", padding: "2px 4px", borderRadius: 4, fontSize: 9, fontWeight: 800, border: "1px solid #86efac" }} title="Slot is open and available for booking!">
                                  🟢 OPEN
                                </span>
                              )}
                            </div>
                            
                            {/* Action Buttons Container */}
                            {hoveredEnq === enq.id && enq.status !== "Booking Confirmed" ? (
                              <div style={{ display: "flex", gap: 6, zIndex: 10 }}>
                                {isPublic && !enq.SalesExecutive ? (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditEnquiry(enq); setShowEnquiryModal(true); }}
                                      style={{ background: "#d946ef", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                    >
                                      <Edit2 size={11}/> Assign
                                    </button>
                                    <button
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        const phoneNum = `91${getEnquiryPhone(enq).replace(/\D/g, "").slice(-10)}`;
                                        const msg = encodeURIComponent(`Hi ${name},\n\nThank you for your enquiry regarding ${enq.hallPreference || 'our hall'} on ${enq.tentativeDate || 'the requested date'}.\nUnfortunately, this date is already booked / unavailable. We apologize for the inconvenience and hope to serve you in the future!`);
                                        window.open(`https://wa.me/${phoneNum}?text=${msg}`, "_blank");
                                        handleStatusChange(enq.id, "Cancelled");
                                      }}
                                      style={{ background: "#fef3c7", color: "#d97706", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                    >
                                      <XCircle size={11}/> Reject
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteEnquiry(enq); }}
                                      style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                    >
                                      <Trash2 size={11}/> Delete
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <select
                                      value={enq.status}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                                      style={{
                                        fontSize: 10, padding: "4px", borderRadius: 4, border: "1px solid #ddd", background: "#f8f9fa", cursor: "pointer", maxWidth: 90
                                      }}
                                    >
                                      {pipelineStages.filter(s => s !== "Booking Confirmed").map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditEnquiry(enq); setShowEnquiryModal(true); }}
                                      style={{ background: "#e0f2fe", color: "#0284c7", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                    >
                                      <Edit2 size={11}/> Edit
                                    </button>
                                    {!enq.isWaitlisted ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleConvertClick(enq); }}
                                        style={{ background: "#dcfce7", color: "#166534", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                      >
                                        <CheckCircle2 size={11}/> Convert
                                      </button>
                                    ) : isWaitlistSlotFree(enq) ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleConvertClick(enq); }}
                                        style={{ background: "#10b981", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 6px rgba(16,185,129,0.3)" }}
                                        title="Slot released! Convert to confirmed booking"
                                      >
                                        <Sparkles size={11}/> Convert
                                      </button>
                                    ) : (
                                      <span
                                        style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", padding: "3px 6px", borderRadius: 6, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}
                                        title="Lead is currently in VIP Waitlist"
                                      >
                                        <Clock size={10}/> Waitlisted
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteEnquiry(enq); }}
                                      style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                    >
                                      <Trash2 size={11}/> Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, background: enq.SalesExecutive ? "#f8f9fa" : "#fee2e2", padding: "2px 8px 2px 2px", borderRadius: 12, border: `1px solid ${enq.SalesExecutive ? "#eaeaea" : "#fca5a5"}` }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: enq.SalesExecutive ? "#1B4332" : "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                                  {enq.SalesExecutive?.name?.charAt(0) || enq.assignedTo?.charAt(0) || "!"}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: enq.SalesExecutive ? "#4b5563" : "#b91c1c", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>
                                  {enq.SalesExecutive?.name || enq.assignedTo || "Needs Assignment"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {stageEnquiries.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "#d1d5db", fontSize: 12 }}>
                        No enquiries
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && !error && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #eaeaea" }}>
                {["Enquiry #", "Customer", "Event", "Date", "Stage", "Lead Score", "Assigned", "Actions"].map(h => (
                  <th key={h} className={["Date", "Lead Score", "Assigned"].includes(h) ? "hm-desktop-only" : ""} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#555", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6,7,8].map(j => (
                      <td key={j} style={{ padding: "12px 16px" }}>
                        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredEnquiries.map((enq, i) => {
                const lss = LEAD_SCORE_STYLE[enq.leadScore] || LEAD_SCORE_STYLE.Warm;
                return (
                  <tr key={enq.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s", background: getConflictStatus(enq) ? "#fef2f2" : isWaitlistSlotFree(enq) ? "#f0fdf4" : "transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background = getConflictStatus(enq) ? "#fee2e2" : isWaitlistSlotFree(enq) ? "#dcfce7" : "#f8f9fa"}
                    onMouseLeave={e => e.currentTarget.style.background = getConflictStatus(enq) ? "#fef2f2" : isWaitlistSlotFree(enq) ? "#f0fdf4" : "transparent"}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1B4332" }}>
                      <div>{enq.enquiryNumber || `ENQ${String(enq.id).padStart(3,"0")}`}</div>
                      {getConflictStatus(enq) && !enq.isWaitlisted ? (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", display: "inline-block", marginTop: 2, border: "1px solid #fca5a5" }}>
                          🚨 SLOT CLASH
                        </span>
                      ) : enq.isWaitlisted ? (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: isWaitlistSlotFree(enq) ? "#dcfce7" : "#fef3c7", color: isWaitlistSlotFree(enq) ? "#166534" : "#b45309", display: "inline-block", marginTop: 2, border: isWaitlistSlotFree(enq) ? "1px solid #86efac" : "none" }}>
                          {isWaitlistSlotFree(enq) ? "🟢 RELEASED" : "⏳ WAITLIST"}
                        </span>
                      ) : null}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{getEnquiryName(enq)}</td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>{enq.eventType}</td>
                    <td className="hm-desktop-only" style={{ padding: "12px 16px", color: "#666" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {enq.tentativeDate || "TBD"}
                        {getConflictStatus(enq) && !enq.isWaitlisted && (
                          <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800 }} title="Date already booked by another confirmed booking">
                            ⚠️ SLOT TAKEN
                          </span>
                        )}
                        {isWaitlistSlotFree(enq) && (
                          <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800, border: "1px solid #86efac" }} title="Date is now free! Previous booking cancelled">
                            ✨ FREE
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {enq.status === "Booking Confirmed" ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", padding: "4px 8px", background: "#dcfce7", borderRadius: 6, display: "inline-block" }}>
                          <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}/>
                          Converted
                        </span>
                      ) : (
                        <select
                          value={enq.status}
                          onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                          style={{
                            fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid #bae6fd", background: "#e0f2fe", color: "#0284c7", fontWeight: 700, outline: "none", cursor: "pointer"
                          }}
                        >
                          {pipelineStages.filter(s => s !== "Booking Confirmed").map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="hm-desktop-only" style={{ padding: "12px 16px" }}>
                      <span style={{ background: lss.bg, color: lss.color, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{lss.label}</span>
                    </td>
                    <td className="hm-desktop-only" style={{ padding: "12px 16px", color: enq.SalesExecutive ? "#666" : "#ef4444", fontWeight: enq.SalesExecutive ? 400 : 700 }}>
                      {enq.SalesExecutive?.name || "⚠️ Unassigned"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {enq.status !== "Booking Confirmed" ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {getConflictStatus(enq) && !enq.isWaitlisted ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <label
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, fontWeight: 700, color: (cardWhatsAppNotify[enq.id] ?? true) ? "#15803d" : "#94a3b8" }}
                                onClick={(e) => e.stopPropagation()}
                                title="Tick to send WhatsApp, untick to skip"
                              >
                                <input
                                  type="checkbox"
                                  checked={cardWhatsAppNotify[enq.id] ?? true}
                                  onChange={(e) => setCardWhatsAppNotify((prev) => ({ ...prev, [enq.id]: e.target.checked }))}
                                  style={{ accentColor: "#16a34a", cursor: "pointer" }}
                                />
                                <span>WhatsApp</span>
                              </label>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveToWaitlistWithWhatsApp(enq); }}
                                style={{ background: "#d97706", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                title="Move to VIP Waitlist"
                              >
                                <Clock size={11}/> To Waitlist
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleInformAndClose(enq); }}
                                style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                title="Close Lead"
                              >
                                <XCircle size={11}/> Close Lead
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditEnquiry(enq); setShowEnquiryModal(true); }}
                                style={{ background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                              >
                                <Edit2 size={11}/> Edit
                              </button>
                              {!enq.isWaitlisted ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleConvertClick(enq); }}
                                  style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                >
                                  <CheckCircle2 size={11}/> Convert
                                </button>
                              ) : isWaitlistSlotFree(enq) ? (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleNotifyReleasedClient(enq); }}
                                    style={{ background: "#25D366", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                    title="Send WhatsApp recovery message to client"
                                  >
                                    <Send size={11}/> WhatsApp
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleConvertClick(enq); }}
                                    style={{ background: "#10b981", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 6px rgba(16,185,129,0.3)" }}
                                    title="Slot released! Convert to confirmed booking"
                                  >
                                    <Sparkles size={11}/> Convert
                                  </button>
                                </>
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", background: "#fef3c7", border: "1px solid #fde68a", padding: "4px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <Clock size={11}/> Waitlisted
                                </span>
                              )}
                            </>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEnquiry(enq); }}
                            style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <Trash2 size={11}/> Delete
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && enquiries.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
              <p style={{ fontSize: 16, fontWeight: 600 }}>No enquiries found</p>
              <p style={{ fontSize: 13 }}>Try adjusting your filters or create a new enquiry.</p>
            </div>
          )}
        </div>
      )}

      <NewEnquiryModal open={showEnquiryModal} onClose={() => { setShowEnquiryModal(false); setEditEnquiry(null); }} onSuccess={handleEnquiryCreated} editData={editEnquiry} />
      <ConvertToBookingModal 
        open={showConvertModal} 
        enquiry={convertEnquiry} 
        onClose={() => { setShowConvertModal(false); fetchEnquiries(); }} 
        onConverted={(convData) => {
          setShowConvertModal(false);
          fetchEnquiries();
          const competing = enquiries.filter(e => 
            e.id !== convData.enquiryId && 
            e.tentativeDate === convData.date && 
            !e.isWaitlisted && 
            !["Booking Confirmed", "Lost", "Cancelled"].includes(e.status) &&
            (!convData.hall || !e.hallPreference || e.hallPreference === convData.hall)
          );
          if (competing.length > 0) {
            setClashModalData({
              open: true,
              bookedDate: convData.date,
              hall: convData.hall,
              competingLeads: competing
            });
          }
        }}
      />
      <SafeDeleteModal
        type="enquiry"
        id={deleteTarget?.id}
        name={deleteTarget?.name}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { setDeleteTarget(null); fetchEnquiries(); }}
        addToast={addToast}
      />

      {clashModalData?.open && (
        <SlotClashResolutionModal
          open={clashModalData.open}
          bookedDate={clashModalData.bookedDate}
          hall={clashModalData.hall}
          competingLeads={clashModalData.competingLeads}
          onClose={() => setClashModalData(null)}
          onResolved={() => {
            fetchEnquiries();
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
