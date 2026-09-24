import React, { useState, useEffect } from "react";
import { Tag, Users, CreditCard, DollarSign, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { mastersAPI } from "../../services/api";
import { useConfirm } from "../../components/ConfirmProvider";

const masterCategories = [
  { id: "packages", icon: Tag, label: "Packages" },
  { id: "lead_sources", icon: Users, label: "Lead Sources" },
  { id: "payment_modes", icon: CreditCard, label: "Payment Modes" },
  { id: "expense_categories", icon: DollarSign, label: "Expense Categories" },
];

export default function DataMastersTab({ addToast }) {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState("packages");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    capacity: 0,
    category: "",
    color: "#1B4332"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await mastersAPI.getByType(activeTab);
      setData(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: item.price || 0,
        capacity: item.capacity || 0,
        category: item.category || "",
        color: item.color || "#1B4332"
      });
    } else {
      setFormData({
        name: "", description: "", price: 0, capacity: 0, category: "", color: "#1B4332"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...formData, type: activeTab };
      
      if (editingItem) {
        await mastersAPI.update(editingItem.id, payload);
        addToast("Updated successfully", "success");
      } else {
        await mastersAPI.create(payload);
        addToast("Added successfully", "success");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast("Failed to save data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm("Are you sure you want to delete this item?"))) return;
    try {
      setLoading(true);
      await mastersAPI.remove(activeTab, id);
      addToast("Deleted successfully", "success");
      fetchData();
    } catch (err) {
      addToast("Failed to delete item", "error");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic form fields based on active tab
  const renderFormFields = () => {
    return (
      <>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Name <span style={{ color: "red" }}>*</span></label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
          />
        </div>

        {activeTab === "packages" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Fixed Price (₹)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", minHeight: 80 }}
          />
        </div>
      </>
    );
  };

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* Sidebar Tabs */}
      <div style={{ width: 260, flexShrink: 0 }}>
        {masterCategories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 8,
                background: isActive ? "#1B4332" : "transparent",
                color: isActive ? "#fff" : "#4b5563",
                border: "none", display: "flex", alignItems: "center", gap: 12,
                fontSize: 14, fontWeight: isActive ? 700 : 500,
                textAlign: "left", cursor: "pointer", marginBottom: 4,
                transition: "all 0.2s"
              }}
            >
              <Icon size={18} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, background: "#fff", borderRadius: 12, boxShadow: "0 1px 10px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {masterCategories.find(c => c.id === activeTab)?.label}
          </h2>
          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: "8px 16px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8,
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer"
            }}
          >
            <Plus size={16} /> Add New
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading data...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            <p style={{ fontSize: 15 }}>No items configured yet.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Click "Add New" to get started.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>Name</th>
                {activeTab === "packages" && <th style={{ padding: "12px 24px", textAlign: "left" }}>Price (₹)</th>}
                <th style={{ padding: "12px 24px", textAlign: "left" }}>Description</th>
                <th style={{ padding: "12px 24px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: idx < data.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {item.color && (
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color }} />
                      )}
                      {item.name}
                    </div>
                  </td>
                  {activeTab === "packages" && (
                    <td style={{ padding: "16px 24px", color: "#475569" }}>{item.price > 0 ? `₹${item.price.toLocaleString()}` : "-"}</td>
                  )}
                  <td style={{ padding: "16px 24px", color: "#64748b", fontSize: 13 }}>{item.description || "-"}</td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleOpenModal(item)}
                        style={{ padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, color: "#334155", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ padding: "6px 12px", background: "#fef2f2", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 400, borderRadius: 12, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>
              {editingItem ? "Edit Item" : "Add New Item"}
            </h2>
            <form onSubmit={handleSave}>
              {renderFormFields()}
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, padding: "10px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
