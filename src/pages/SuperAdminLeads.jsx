import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Users, Phone, MapPin, Building2, Calendar, ChevronDown, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import api from "../services/api";

const SuperAdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get("/admin/leads");
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/leads/${id}/status`, { status });
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "New": 
        return (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid #bfdbfe" }}>
            <AlertCircle size={14} /> New
          </div>
        );
      case "Contacted": 
        return (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#fef3c7", color: "#b45309", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid #fde68a" }}>
            <Clock size={14} /> Contacted
          </div>
        );
      case "Approved": 
        return (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#ecfdf5", color: "#047857", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid #a7f3d0" }}>
            <CheckCircle2 size={14} /> Approved
          </div>
        );
      case "Rejected": 
        return (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#fef2f2", color: "#b91c1c", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid #fecaca" }}>
            <XCircle size={14} /> Rejected
          </div>
        );
      default: 
        return (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f1f5f9", color: "#475569", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid #e2e8f0" }}>
            {status}
          </div>
        );
    }
  };

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418" }}>Demo Requests</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: 15 }}>Manage sign-ups and leads from the landing page.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#f1f5f9", padding: "8px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, color: "#475569", fontWeight: 600, fontSize: 14 }}>
            <Users size={18} /> Total Leads: {leads.length}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px 24px", color: "#475569", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>Date</th>
                <th style={{ padding: "16px 24px", color: "#475569", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>Lead Info</th>
                <th style={{ padding: "16px 24px", color: "#475569", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>Venue Details</th>
                <th style={{ padding: "16px 24px", color: "#475569", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>Status</th>
                <th style={{ padding: "16px 24px", color: "#475569", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: "60px 24px", textAlign: "center", color: "#94a3b8" }}>
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "60px 24px", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 48, height: 48, background: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}>
                        <Users size={24} />
                      </div>
                      <p style={{ margin: 0, fontSize: 15 }}>No demo requests found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    
                    {/* Date */}
                    <td style={{ padding: "20px 24px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 14 }}>
                        <Calendar size={16} />
                        {format(new Date(lead.createdAt), "MMM d, yyyy")}
                      </div>
                    </td>

                    {/* Lead Info */}
                    <td style={{ padding: "20px 24px", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, marginBottom: 4 }}>{lead.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13 }}>
                        <Phone size={14} /> {lead.phone}
                      </div>
                    </td>

                    {/* Venue Details */}
                    <td style={{ padding: "20px 24px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1e293b", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                        <Building2 size={16} style={{ color: "#94a3b8" }} /> {lead.venueName}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13 }}>
                        <MapPin size={14} /> {lead.city}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "20px 24px", verticalAlign: "top" }}>
                      {getStatusBadge(lead.status)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "20px 24px", verticalAlign: "top", textAlign: "right" }}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <select 
                          style={{
                            appearance: "none",
                            background: "#fff",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            padding: "8px 36px 8px 12px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#334155",
                            cursor: "pointer",
                            outline: "none",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            transition: "all 0.2s"
                          }}
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                        >
                          <option value="New">Mark New</option>
                          <option value="Contacted">Mark Contacted</option>
                          <option value="Approved">Approve Tenant</option>
                          <option value="Rejected">Reject Lead</option>
                        </select>
                        <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLeads;
