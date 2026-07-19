import React, { useState, useEffect, useCallback } from "react";
import { IndianRupee, Search, Filter, ArrowUpRight, ArrowDownRight, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "../components/ui/PageHeader";
import MetricCard from "../components/ui/MetricCard";
import { paymentsAPI } from "../services/api";
import { useToast } from "../components/Toast";

function PaymentSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: 24, padding: "24px 32px", border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />
        <div>
          <div style={{ height: 18, background: "#f1f5f9", borderRadius: 6, width: 120, marginBottom: 8, animation: "pulse 1.5s infinite" }} />
          <div style={{ height: 14, background: "#f1f5f9", borderRadius: 6, width: 200, animation: "pulse 1.5s infinite" }} />
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ height: 24, background: "#f1f5f9", borderRadius: 6, width: 100, marginBottom: 6, animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: 60, marginLeft: "auto", animation: "pulse 1.5s infinite" }} />
      </div>
    </div>
  );
}

export default function Payments() {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await paymentsAPI.getAll(params);
      setPayments(res.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load payments";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPayments(), 300);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  const getStatusColor = (s) => {
    switch(s) {
      case "Collected": case "Completed": return { bg: "#dcfce7", text: "#166534", icon: ArrowDownRight };
      case "Pending": return { bg: "#fee2e2", text: "#b91c1c", icon: ArrowUpRight };
      default: return { bg: "#f1f5f9", text: "#475569", icon: Wallet };
    }
  };

  const formatAmount = (val) => {
    if (!val) return "—";
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  const totalCollected = payments.filter(p => p.status === "Collected" || p.status === "Completed").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div style={{ padding: "40px", maxWidth: 1600, margin: "0 auto", fontFamily: "'Inter', 'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      
      <PageHeader 
        title="Payment Operations" 
        subtitle="Track incoming cash flow, pending balances, and generate receipts."
        icon={Wallet}
        color="#1B4332"
      />

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40 }}>
        <MetricCard title="Total Collected (Filtered)" value={formatAmount(totalCollected)} icon={ArrowDownRight} color="#10b981" delay={0.1} />
        <MetricCard title="Outstanding Balance" value="—" icon={ArrowUpRight} color="#ef4444" delay={0.2} />
        <MetricCard title="Processing" value="—" icon={Wallet} color="#3b82f6" delay={0.3} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: 14, color: "#94a3b8" }} />
            <input type="text" placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} 
              style={{ padding: "12px 20px 12px 44px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", width: 320, outline: "none", fontSize: 15, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }} />
          </div>
          <button onClick={fetchPayments} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, color: "#475569" }}>
            <RefreshCw size={16} />
          </button>
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
          {!loading && `${payments.length} record${payments.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: "#dc2626", fontWeight: 600 }}>{error}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          [1,2,3,4].map(i => <PaymentSkeleton key={i} />)
        ) : payments.length === 0 && !error ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <Wallet size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>No payments found</p>
          </div>
        ) : (
          payments.map((p, i) => {
            const st = getStatusColor(p.status);
            const Icon = st.icon;
            const customerName = p.Customer?.name || p.customerName || "Unknown";
            
            return (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.05, 0.5) }}
                whileHover={{ scale: 1.01, boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}
                style={{ background: "#fff", borderRadius: 24, padding: "24px 32px", border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: st.bg, color: st.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{customerName}</h3>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14, color: "#64748b", fontWeight: 500 }}>
                      <span>{p.paymentType || "Payment"}</span> • <span>{p.paymentMode}</span> • <span>{new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: p.status === "Pending" ? "#ef4444" : "#0f172a", marginBottom: 4 }}>
                    {formatAmount(p.amount)}
                  </div>
                  <div style={{ color: st.text, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                    {p.status}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
