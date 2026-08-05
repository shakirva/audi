import React, { useState, useEffect, useCallback } from "react";
import { Search, MessageCircle, Mail, MapPin, Users, Filter, AlertCircle, RefreshCw, Loader, Edit3, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { customersAPI } from "../services/api";
import { useToast } from "../components/Toast";
import { useRole } from "../context/RoleContext";
import PageHeader from "../components/ui/PageHeader";
import EditCustomerModal from "../components/EditCustomerModal";
import SafeDeleteModal from "../components/SafeDeleteModal";

function CustomerSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f1f5f9", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ height: 16, background: "#f1f5f9", borderRadius: 6, width: "70%", marginBottom: 8, animation: "pulse 1.5s infinite" }} />
      <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "45%", marginBottom: 16, animation: "pulse 1.5s infinite" }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div style={{ height: 28, background: "#f1f5f9", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 28, background: "#f1f5f9", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ height: 36, background: "#f1f5f9", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
    </div>
  );
}

export default function Customers() {
  const { addToast } = useToast();
  const { user, role } = useRole();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await customersAPI.getAll(params);
      let data = res.data.data || [];
      if (role === "Sales") {
        data = data.filter(c => c.createdBy === user?.name || c.userId === user?.id || c.salesExecutiveId === user?.id || c.salesExecutiveName === user?.name);
      }
      setCustomers(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load customers";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleDelete = (c) => {
    const name = c.name || c.customerName || "Unknown";
    setDeleteTarget({ id: c.id, name });
  };

  return (
    <div className="hm-bookings-wrapper">
      
      <PageHeader 
        title="Customer Directory" 
        subtitle="Manage relationships, view lifetime value, and track interactions."
        icon={Users}
        color="#1B4332"
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: 14, color: "#94a3b8" }} />
            <input type="text" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: "12px 20px 12px 44px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", width: "100%", outline: "none", fontSize: 15, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }} />
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>
          {!loading && `${customers.length} customer${customers.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: "#dc2626", fontWeight: 600 }}>{error}</span>
          <button onClick={fetchCustomers} style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}>Retry</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {loading ? (
          [1,2,3,4,5,6].map(i => <CustomerSkeleton key={i} />)
        ) : customers.length === 0 && !error ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <Users size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>No customers yet</p>
            <p style={{ fontSize: 14 }}>Customers are created automatically when enquiries are submitted.</p>
          </div>
        ) : (
          customers.map((c, i) => {
            const totalSpent = c.totalBookingValue || c.lifetimeValue || 0;
            const bookingCount = c.bookingCount || c.totalBookings || 0;
            const name = c.name || c.customerName || "Unknown";
            const phone = c.phone || c.mobile || "";
            const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const isVIP = totalSpent > 500000 || bookingCount >= 3;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.5) }}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
                style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid #f1f5f9", boxShadow: "0 10px 30px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: isVIP ? "linear-gradient(135deg, #f97316, #ea580c)" : "#f1f5f9", color: isVIP ? "#fff" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>
                    {initials}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isVIP && <div style={{ background: "#fef08a", color: "#a16207", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 10, letterSpacing: 1 }}>VIP</div>}
                    <button onClick={() => setEditingCustomer(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{name}</h3>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={13} /> {c.city || c.location || "Local Client"}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Bookings</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#334155" }}>{bookingCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Lifetime Value</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f97316" }}>
                      {totalSpent > 0 ? (totalSpent >= 100000 ? `₹${(totalSpent / 100000).toFixed(1)}L` : `₹${Number(totalSpent).toLocaleString()}`) : "—"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <a
                    href={`https://wa.me/91${phone.replace(/\D/g, "")}`}
                    target="_blank" rel="noreferrer"
                    style={{ flex: 1, padding: "10px", background: "#25D366", color: "#fff", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", textDecoration: "none", fontWeight: 700, fontSize: 14, gap: 8 }}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      style={{ padding: "10px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", textDecoration: "none" }}
                    >
                      <Mail size={16} />
                    </a>
                  )}
                  {!c.email && (
                    <button style={{ padding: "10px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}>
                      <Mail size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <EditCustomerModal
        open={!!editingCustomer}
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSaved={fetchCustomers}
      />
      <SafeDeleteModal
        type="customer"
        id={deleteTarget?.id}
        name={deleteTarget?.name}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { setDeleteTarget(null); fetchCustomers(); }}
        addToast={addToast}
      />
    </div>
  );
}
