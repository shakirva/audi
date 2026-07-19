import React, { useState, useEffect, useCallback } from "react";
import { Users, Filter, Plus, Search, Calendar, ChevronRight, LayoutGrid, List, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { enquiriesAPI } from "../services/api";
import { useToast } from "../components/Toast";
import NewEnquiryModal from "../components/NewEnquiryModal";
import ConvertToBookingModal from "../components/ConvertToBookingModal";

const pipelineStages = ["New Enquiry", "Contacted", "Follow-up", "Customer Visit", "Quotation Sent", "Interested", "Booking Confirmed", "Lost"];

const LEAD_SCORE_STYLE = {
  Hot:  { bg: "#dcfce7", color: "#166534", label: "🟢 Hot" },
  Warm: { bg: "#fef08a", color: "#a16207", label: "🟡 Warm" },
  Cold: { bg: "#f1f5f9", color: "#64748b", label: "🔴 Cold" },
};

function KPISkeleton() {
  return (
    <div style={{ flex: 1, background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
      <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "60%", marginBottom: 12, animation: "pulse 1.5s infinite" }} />
      <div style={{ height: 28, background: "#f1f5f9", borderRadius: 6, width: "40%", animation: "pulse 1.5s infinite" }} />
    </div>
  );
}

export default function CRM() {
  const { addToast } = useToast();
  const [viewMode, setViewMode] = useState("board");
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertEnquiry, setConvertEnquiry] = useState(null);
  const [hoveredEnq, setHoveredEnq] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
      setEnquiries(res.data.data || []);
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

  const handleStatusChange = async (enquiryId, newStatus) => {
    try {
      await enquiriesAPI.updateStatus(enquiryId, newStatus);
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: newStatus } : e));
      addToast(`Moved to ${newStatus}`, "success");
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  const handleEnquiryCreated = () => {
    setShowEnquiryModal(false);
    fetchEnquiries();
    addToast("Enquiry saved successfully! 🎉", "success");
  };

  const handleConvertClick = (enq) => {
    setConvertEnquiry(enq);
    setShowConvertModal(true);
  };

  const getEnquiryName = (enq) => {
    if (enq.Customer) return enq.Customer.name;
    return enq.customerName || "Unknown";
  };

  const getEnquiryPhone = (enq) => {
    if (enq.Customer) return enq.Customer.phone;
    return enq.phone || "";
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", color: "#0D2418" }}>Sales Pipeline</h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Track leads and convert enquiries into bookings.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={fetchEnquiries}
            style={{ background: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowEnquiryModal(true)} style={{
            background: "#1B4332", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
            fontWeight: 600, cursor: "pointer", fontSize: 14, boxShadow: "0 4px 12px rgba(27,67,50,0.2)"
          }}>
            <Plus size={18} /> New Enquiry
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {loading ? (
          [1,2,3,4].map(i => <KPISkeleton key={i} />)
        ) : (
          [
            { label: "Active Enquiries", value: activeEnquiries, color: "#0284c7", bg: "#e0f2fe" },
            { label: "Total Enquiries", value: total, color: "#a16207", bg: "#fef08a" },
            { label: "Converted (All Time)", value: converted, color: "#166534", bg: "#dcfce7" },
            { label: "Conversion Rate", value: `${conversionRate}%`, color: "#6b21a8", bg: "#f3e8ff" },
          ].map((kpi, i) => (
            <div key={i} style={{
              flex: 1, background: "#fff", border: "1px solid #eaeaea", borderRadius: 12,
              padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#111" }}>{kpi.value}</div>
            </div>
          ))
        )}
      </div>

      {/* View Toggles & Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
          <button onClick={() => setViewMode("board")} style={{
            background: viewMode === "board" ? "#fff" : "transparent", border: "none", borderRadius: 6,
            padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            fontWeight: 600, color: viewMode === "board" ? "#1B4332" : "#666", boxShadow: viewMode === "board" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
          }}>
            <LayoutGrid size={16} /> Board
          </button>
          <button onClick={() => setViewMode("list")} style={{
            background: viewMode === "list" ? "#fff" : "transparent", border: "none", borderRadius: 6,
            padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            fontWeight: 600, color: viewMode === "list" ? "#1B4332" : "#666", boxShadow: viewMode === "list" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
          }}>
            <List size={16} /> List
          </button>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 10, color: "#999" }} />
            <input
              type="text"
              placeholder="Search name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "8px 12px 8px 36px", border: "1px solid #ddd", borderRadius: 8, outline: "none", minWidth: 220 }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", background: "#fff" }}
          >
            <option value="">All Stages</option>
            {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
            const stageEnquiries = enquiries.filter(e => e.status === stage);
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
                      return (
                        <div key={enq.id}
                          onMouseEnter={() => setHoveredEnq(enq.id)}
                          onMouseLeave={() => setHoveredEnq(null)}
                          style={{
                            background: "#fff", padding: "14px", borderRadius: 8, border: "1px solid #eaeaea",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.1s",
                            transform: hoveredEnq === enq.id ? "translateY(-2px)" : "none"
                          }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#1B4332", background: "rgba(27,67,50,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                              {enq.enquiryNumber || `ENQ${String(enq.id).padStart(3,"0")}`}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: lss.bg, color: lss.color }}>
                              {lss.label}
                            </span>
                          </div>
                          <h4 style={{ margin: "0 0 3px", fontSize: 14, color: "#111", fontWeight: 700 }}>{name}</h4>
                          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#666" }}>
                            {enq.eventType}{enq.session ? ` (${enq.session})` : ""}
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#999" }}>
                              <Calendar size={11} /> {enq.tentativeDate || "TBD"}
                            </div>
                            {hoveredEnq === enq.id ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <select
                                  value={enq.status}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                                  style={{
                                    fontSize: 10, padding: "4px", borderRadius: 4, border: "1px solid #ddd", background: "#f8f9fa", cursor: "pointer", maxWidth: 90
                                  }}
                                >
                                  {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleConvertClick(enq); }}
                                  style={{ background: "#dcfce7", color: "#166534", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                >
                                  <CheckCircle2 size={11}/> Convert
                                </button>
                              </div>
                            ) : (
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1B4332", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                                {enq.SalesExecutive?.name?.charAt(0) || enq.assignedTo?.charAt(0) || "?"}
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
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#555", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
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
              ) : enquiries.map((enq, i) => {
                const lss = LEAD_SCORE_STYLE[enq.leadScore] || LEAD_SCORE_STYLE.Warm;
                return (
                  <tr key={enq.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1B4332" }}>
                      {enq.enquiryNumber || `ENQ${String(enq.id).padStart(3,"0")}`}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{getEnquiryName(enq)}</td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>{enq.eventType}</td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>{enq.tentativeDate || "TBD"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={enq.status}
                        onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                        style={{
                          fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid #bae6fd", background: "#e0f2fe", color: "#0284c7", fontWeight: 700, outline: "none", cursor: "pointer"
                        }}
                      >
                        {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: lss.bg, color: lss.color, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{lss.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>
                      {enq.SalesExecutive?.name || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConvertClick(enq); }}
                        style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <CheckCircle2 size={12}/> Convert
                      </button>
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

      <NewEnquiryModal open={showEnquiryModal} onClose={() => setShowEnquiryModal(false)} onSuccess={handleEnquiryCreated} />
      <ConvertToBookingModal open={showConvertModal} enquiry={convertEnquiry} onClose={() => { setShowConvertModal(false); fetchEnquiries(); }} />
    </div>
  );
}
