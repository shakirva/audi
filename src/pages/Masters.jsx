import React, { useState, useEffect } from "react";
import { Settings, CheckSquare, Users, CreditCard, Tag, Box, DollarSign, Plus, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { mastersAPI } from "../services/api";
import { useConfirm } from "../components/ConfirmProvider";

const masterCategories = [
  { id: "halls", icon: Box, label: "Hall Management" },
  { id: "services", icon: CheckSquare, label: "Facilities & Add-ons" },
  { id: "event_types", icon: Settings, label: "Event Types" },
  { id: "packages", icon: Tag, label: "Packages" },
  { id: "lead_sources", icon: Users, label: "Lead Sources" },
  { id: "payment_modes", icon: CreditCard, label: "Payment Modes" },
  { id: "expense_categories", icon: DollarSign, label: "Expense Categories" },
];

export default function Masters() {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState("halls");
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
      } else {
        await mastersAPI.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError("Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm("Are you sure you want to delete this item?"))) return;
    try {
      setLoading(true);
      await mastersAPI.remove(activeTab, id);
      fetchData();
    } catch (err) {
      setError("Failed to delete item");
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
        
        {activeTab === "halls" && (
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Base Price (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Capacity (Guests)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
              />
            </div>
          </div>
        )}

        {(activeTab === "services" || activeTab === "packages") && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Fixed Price / Rate (₹)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
            />
          </div>
        )}

        {activeTab === "event_types" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Color Code</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              style={{ width: "100%", height: 40, padding: 2, borderRadius: 8, border: "1px solid #ddd", cursor: "pointer" }}
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
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#0D2418" }}>Master Configuration</h1>
        <p style={{ color: "#666", margin: 0, fontSize: 14 }}>Manage halls, facilities, prices, and dropdown options.</p>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fee2e2", color: "#dc2626", borderRadius: 8, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

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
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: isActive ? "#1B4332" : "transparent",
                  color: isActive ? "#fff" : "#444",
                  fontWeight: isActive ? 600 : 500,
                  marginBottom: 4, transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={18} opacity={isActive ? 1 : 0.6} />
                  {cat.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", padding: 24, minHeight: 400 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#333", textTransform: "capitalize" }}>
              {masterCategories.find(c => c.id === activeTab)?.label}
            </h2>
            <button 
              onClick={() => handleOpenModal()}
              style={{
                background: "#D4A017", color: "#0D2418", border: "none", borderRadius: 8,
                padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6
              }}
            >
              <Plus size={16} /> Add New
            </button>
          </div>
          
          {loading && data.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>Loading...</div>
          ) : data.length === 0 ? (
            <div style={{
              padding: 40, textAlign: "center", border: "2px dashed #eaeaea", borderRadius: 12, color: "#999"
            }}>
              <Settings size={40} opacity={0.2} style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No items configured yet. Click "Add New" to get started.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {data.map(item => (
                <div key={item.id} style={{ border: "1px solid #eaeaea", borderRadius: 8, padding: 16, background: "#fafafa", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
                      {activeTab === "event_types" && (
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color || "#ccc" }} />
                      )}
                      {item.name}
                    </h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleOpenModal(item)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4 }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {item.price > 0 && (
                    <div style={{ fontSize: 14, color: "#1B4332", fontWeight: 700, marginBottom: 4 }}>
                      ₹{Number(item.price).toLocaleString()}
                    </div>
                  )}
                  {item.capacity > 0 && (
                    <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
                      Capacity: {item.capacity}
                    </div>
                  )}
                  {item.description && (
                    <div style={{ fontSize: 13, color: "#666", lineHeight: 1.4 }}>
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 500, borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #eaeaea", background: "#f8f9fa" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editingItem ? "Edit" : "Add New"} {masterCategories.find(c => c.id === activeTab)?.label}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 24 }}>
              {renderFormFields()}
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#D4A017", color: "#0D2418", cursor: "pointer", fontWeight: 700 }}>
                  {loading ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
