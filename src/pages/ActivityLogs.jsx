import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, FileText, Trash2, Calendar, User as UserIcon, RefreshCw } from "lucide-react";
import { auditLogsAPI } from "../services/api";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmProvider";

export default function ActivityLogs() {
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditLogsAPI.getAll({ limit: 500 }); // fetch up to 500 logs for now
      setLogs(res.data.data || []);
    } catch (err) {
      addToast("Failed to fetch activity logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    const isConfirmed = await confirm(
      "Are you sure you want to clear all activity logs? This action cannot be undone.",
      { title: "Clear Activity Logs", isDanger: true }
    );

    if (isConfirmed) {
      try {
        await auditLogsAPI.clear();
        addToast("All activity logs have been cleared", "success");
        fetchLogs();
      } catch (err) {
        addToast("Failed to clear logs", "error");
      }
    }
  };

  const filteredLogs = logs.filter(log => {
    const st = searchTerm.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(st);
    const userMatch = log.User?.name?.toLowerCase().includes(st) || log.User?.email?.toLowerCase().includes(st);
    const resourceMatch = log.resource?.toLowerCase().includes(st);
    const detailMatch = JSON.stringify(log.details || {}).toLowerCase().includes(st);
    return actionMatch || userMatch || resourceMatch || detailMatch;
  });

  const getActionColor = (action = "") => {
    const lower = action.toLowerCase();
    if (lower.includes("delete") || lower.includes("remove") || lower.includes("clear")) return { bg: "#fee2e2", text: "#ef4444" };
    if (lower.includes("create") || lower.includes("add") || lower.includes("generate")) return { bg: "#dcfce7", text: "#16a34a" };
    if (lower.includes("update") || lower.includes("edit") || lower.includes("status")) return { bg: "#e0f2fe", text: "#0284c7" };
    return { bg: "#f1f5f9", text: "#475569" };
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418", display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldAlert size={28} color="#0D2418" /> Activity Logs
          </h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Monitor system changes, deletions, and user actions.</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search logs (action, user, details)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", width: 300 }}
            />
          </div>
          <button 
            onClick={fetchLogs} 
            style={{ padding: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#64748b" }}
            title="Refresh Logs"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={handleClearLogs}
            style={{ padding: "10px 16px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Trash2 size={16} /> Clear Logs
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 200px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "#f8fafc" }}>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, width: 180 }}>Timestamp</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, width: 200 }}>User</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, width: 220 }}>Action</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Details / Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading activity logs...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>No activity logs found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const colors = getActionColor(log.action);
                  
                  // Extract reasons from safe-delete requests
                  let reasonText = "";
                  if (log.details?.body?.reason) {
                    reasonText = log.details.body.reason;
                  }

                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 24px", color: "#475569", fontSize: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                          <Calendar size={13} color="#94a3b8" />
                          {new Date(log.createdAt).toLocaleDateString("en-IN")}
                        </div>
                        <div style={{ color: "#94a3b8", marginTop: 4, paddingLeft: 19 }}>
                          {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {log.User ? (
                          <>
                            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                              <UserIcon size={14} color="#64748b" />
                              {log.User.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, paddingLeft: 20 }}>
                              {log.User.role}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>System / Unknown</span>
                        )}
                        <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4, paddingLeft: 20 }}>IP: {log.ipAddress || "N/A"}</div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ display: "inline-block", padding: "6px 12px", background: colors.bg, color: colors.text, borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {log.action}
                        </span>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.resource}>
                          {log.resource}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#334155", fontSize: 13 }}>
                        {reasonText && (
                          <div style={{ marginBottom: 8, padding: "8px 12px", background: "#fff1f2", borderLeft: "3px solid #f43f5e", borderRadius: "0 6px 6px 0", color: "#9f1239", fontWeight: 500 }}>
                            <strong>Reason:</strong> {reasonText}
                          </div>
                        )}
                        
                        <div style={{ maxHeight: 60, overflowY: "auto", background: "#f8fafc", padding: "8px 12px", borderRadius: 6, border: "1px solid #f1f5f9", fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>
                          {JSON.stringify(log.details?.body || log.details || {}, null, 2)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
