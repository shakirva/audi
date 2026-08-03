import React, { useState, useEffect, useCallback } from "react";
import { FileSignature, Filter, Search, Printer, Share2, AlertCircle, RefreshCw, Plus, Edit3, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { bookingsAPI } from "../services/api";
import { useToast } from "../components/Toast";
import { useRole } from "../context/RoleContext";
import PageHeader from "../components/ui/PageHeader";
import EditBookingModal from "../components/EditBookingModal";
import { useConfirm } from "../components/ConfirmProvider";
import { generateAgreement } from "../utils/documentGenerator";

function AgreementSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f1f5f9" }}>
      {[80, 60, 45, 40, 100].map((w, i) => (
        <div key={i} style={{ height: i === 4 ? 36 : 14, background: "#f1f5f9", borderRadius: 6, width: `${w}%`, marginBottom: 12, animation: "pulse 1.5s infinite" }} />
      ))}
    </div>
  );
}

const STATUS_STYLE = {
  Signed:  { bg: "#dcfce7", text: "#166534" },
  Pending: { bg: "#fef08a", text: "#a16207" },
  Draft:   { bg: "#f1f5f9", text: "#475569" },
  Sent:    { bg: "#dbeafe", text: "#1d4ed8" },
};


export default function Agreements() {
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const { user, role, venueInfo } = useRole();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [editingAgreement, setEditingAgreement] = useState(null);

  const fetchAgreements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 1000 };
      if (search) params.search = search;
      const res = await bookingsAPI.getAll(params);
      
      // Filter out enquiries if we only want confirmed/actual bookings
      let fetched = (res.data.data || []).filter(b => b.status !== "Enquiry");
      if (role === "Sales") {
        fetched = fetched.filter(b => b.createdBy === user?.name || b.salesExecutiveName === user?.name || b.bookedBy === user?.name || b.userId === user?.id || b.salesExecutiveId === user?.id);
      }
      setAgreements(fetched);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load agreements";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAgreements(), 300);
    return () => clearTimeout(timer);
  }, [fetchAgreements]);

  const handleDelete = async (id) => {
    if (!(await confirm("Are you sure you want to delete this agreement? This will also delete the associated booking."))) return;
    try {
      await bookingsAPI.remove(id);
      addToast("Agreement deleted successfully", "success");
      fetchAgreements();
    } catch (err) {
      addToast("Failed to delete agreement", "error");
    }
  };

  const formatValue = (val) => {
    if (!val) return "—";
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  const getCustomerName = (agr) => {
    if (agr.Booking?.Customer?.name) return agr.Booking.Customer.name;
    if (agr.customerName) return agr.customerName;
    return "Unknown";
  };

  const getEventInfo = (agr) => {
    const parts = [];
    if (agr.eventType) parts.push(agr.eventType);
    if (agr.date) {
      const d = new Date(agr.date);
      parts.push(d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
    }
    return parts.join(" • ") || "—";
  };

  return (
    <div style={{ padding: "40px", maxWidth: 1600, margin: "0 auto", fontFamily: "'Inter', 'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      
      <PageHeader 
        title="Agreements & Contracts" 
        subtitle="Manage legal documents, track signatures, and share terms."
        icon={FileSignature}
        color="#1B4332"
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: 14, color: "#94a3b8" }} />
            <input type="text" placeholder="Search agreements..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: "12px 20px 12px 44px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", width: 320, outline: "none", fontSize: 15, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }} />
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
          {!loading && `${agreements.length} agreement${agreements.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: "#dc2626", fontWeight: 600 }}>{error}</span>
          <button onClick={fetchAgreements} style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}>Retry</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {loading ? (
          [1,2,3,4].map(i => <AgreementSkeleton key={i} />)
        ) : agreements.length === 0 && !error ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <FileSignature size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>No agreements yet</p>
            <p style={{ fontSize: 14 }}>Agreements are generated from confirmed bookings.</p>
          </div>
        ) : (
          agreements.map((a, i) => {
            const st = STATUS_STYLE[a.status] || STATUS_STYLE.Draft;
            const agNum = a.bookingId || `AGR-${String(a._id || a.id).padStart(3,"0")}`;
            const customerName = a.customerName || "Unknown";
            const eventInfo = getEventInfo(a);
            const contractValue = formatValue(a.totalAmount);

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.5) }}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
                style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f1f5f9", boxShadow: "0 10px 30px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fdf2f8", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileSignature size={20} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ background: st.bg, color: st.text, fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                      {a.status || "Draft"}
                    </div>
                    <button onClick={() => setEditingAgreement(a)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{agNum}</div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{customerName}</h3>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", fontWeight: 500 }}>{eventInfo}</p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 16, padding: "12px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Contract Value</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#334155" }}>{contractValue}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <button
                    onClick={() => generateAgreement({ booking: a })}
                    style={{ flex: 1, padding: "10px", background: "#0f172a", color: "#fff", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", border: "none", fontWeight: 700, fontSize: 14, gap: 8, cursor: "pointer" }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => generateAgreement({ booking: a })}
                    style={{ padding: "10px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: `Agreement ${agNum}`, text: `Agreement for ${customerName}` });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        addToast("Link copied!", "success");
                      }
                    }}
                    style={{ padding: "10px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {editingAgreement && (
        <EditBookingModal 
          open={!!editingAgreement} 
          booking={editingAgreement} 
          onClose={() => setEditingAgreement(null)} 
          onSaved={fetchAgreements} 
        />
      )}
    </div>
  );
}
