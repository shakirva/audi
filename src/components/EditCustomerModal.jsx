import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { customersAPI } from "../services/api";
import { useToast } from "./Toast";
import Button from "./ui/Button";

export default function EditCustomerModal({ open, customer, onClose, onSaved }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer && open) {
      setForm({
        name: customer.name || customer.customerName || "",
        phone: customer.phone || "",
        email: customer.email || "",
        city: customer.city || "",
      });
    }
  }, [customer, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await customersAPI.update(customer.id, form);
      addToast("Customer updated successfully!", "success");
      onSaved?.();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to update customer", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !customer) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 500, borderRadius: 24, padding: 32, position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 24, right: 24, background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
          <X size={16} />
        </button>
        <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Edit Customer</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Phone</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>City / Location</label>
            <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14 }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" loading={loading} style={{ flex: 1 }}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
