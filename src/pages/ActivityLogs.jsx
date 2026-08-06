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

  const getFriendlyDetails = (log) => {
    const body = log.details?.body || {};
    const action = log.action || "";

    if (action.includes("Safe Delete Booking")) {
      return `Reason: ${body.reason || "Not specified"}.`;
    }
    if (action.includes("Status")) {
      return `Changed to: ${body.status || "Unknown"}`;
    }
    if (action.includes("Payment") || action.includes("Expense")) {
      return `Amount: ₹${body.amount || 0}`;
    }
    if (action.includes("Customer") && body.name) {
      return `Customer Name: ${body.name}`;
    }
    if (action.includes("Booking") && body.customerName) {
      return `For: ${body.customerName}`;
    }
    if (action.includes("Job") && body.title) {
      return `Job: ${body.title}`;
    }
    
    // Check if there's any useful string info to show
    const relevantKeys = ["name", "title", "status", "reason", "amount", "customerName", "eventType", "hall"];
    const foundKeys = Object.keys(body).filter(k => relevantKeys.includes(k));
    if (foundKeys.length > 0) {
      return foundKeys.map(k => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${body[k]}`).join(" • ");
    }
    
    return null;
  };

  const getActionIcon = (action = "") => {
    const lower = action.toLowerCase();
    if (lower.includes("delete") || lower.includes("remove") || lower.includes("clear")) return <Trash2 size={18} color="#ef4444" />;
    if (lower.includes("payment") || lower.includes("expense") || lower.includes("amount")) return <FileText size={18} color="#f59e0b" />;
    if (lower.includes("user") || lower.includes("customer") || lower.includes("staff")) return <UserIcon size={18} color="#0ea5e9" />;
    if (lower.includes("booking") || lower.includes("event") || lower.includes("calendar")) return <Calendar size={18} color="#10b981" />;
    return <RefreshCw size={18} color="#64748b" />;
  };

  return (
    <div className="p-4 sm:p-6" style={{ maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0D2418", display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldAlert size={28} color="#0D2418" /> Activity History
          </h1>
          <p style={{ color: "#666", margin: 0, fontSize: 15 }}>Track what happens in your venue management system.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-stretch sm:items-center">
          <div style={{ position: "relative" }} className="w-full sm:w-auto">
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
              style={{ padding: "10px 16px 10px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button 
            onClick={handleClearLogs}
            className="w-full sm:w-auto justify-center"
            style={{ padding: "10px 16px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxSizing: "border-box" }}
          >
            <Trash2 size={16} /> Clear History
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading activity history...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
            <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#475569" }}>No activity found</div>
            <div style={{ fontSize: 14 }}>There are no recent actions matching your search.</div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const userName = log.User?.name || "System";
            const role = log.User?.role ? `(${log.User.role})` : "";
            const details = getFriendlyDetails(log);
            const timeStr = new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(log.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });

            return (
              <div key={log.id} className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5" style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
                <div className="flex w-full sm:w-auto items-start gap-4 flex-1">
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {getActionIcon(log.action)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: "#1e293b", marginBottom: 4, lineHeight: 1.4 }}>
                      <strong style={{ color: "#0f172a" }}>{userName}</strong> <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>{role}</span> performed <strong>{log.action}</strong>
                    </div>
                    {details && (
                      <div style={{ fontSize: 14, color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, display: "inline-block", marginTop: 4 }}>
                        {details}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end mt-2 sm:mt-0 sm:text-right flex-shrink-0 border-t sm:border-0 border-slate-100 pt-3 sm:pt-0">
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#475569" }}>{timeStr}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{dateStr}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

