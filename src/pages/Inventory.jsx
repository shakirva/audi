import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Box, Download } from "lucide-react";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmProvider";
import { inventoryAPI, isPlanRestriction } from "../services/api";
import { generateInventoryReport } from "../utils/documentGenerator";

const cardStyle = { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" };
const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" };

export default function Inventory() {
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ id: null, itemName: "", category: "", totalQuantity: 1, availableQuantity: 1, condition: "Good", notes: "", unitPrice: "" });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    fetchInventory();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryAPI.getAll();
      if (res.data?.success) setItems(res.data.data);
    } catch (error) {
      if (!isPlanRestriction(error)) addToast("Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData({ ...item, unitPrice: item.unitPrice || "" });
    } else {
      setFormData({ id: null, itemName: "", category: "", totalQuantity: 1, availableQuantity: 1, condition: "Good", notes: "", unitPrice: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        totalQuantity: parseInt(formData.totalQuantity, 10),
        availableQuantity: parseInt(formData.availableQuantity, 10),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
      };

      if (formData.id) {
        const res = await inventoryAPI.update(formData.id, payload);
        if (res.data?.success) {
          addToast("Item updated successfully", "success");
          fetchInventory();
          handleCloseModal();
        }
      } else {
        const res = await inventoryAPI.create(payload);
        if (res.data?.success) {
          addToast("Item added successfully", "success");
          fetchInventory();
          handleCloseModal();
        }
      }
    } catch (error) {
      addToast(error.response?.data?.error || "Operation failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (await confirm("Are you sure you want to delete this item?")) {
      try {
        const res = await inventoryAPI.remove(id);
        if (res.data?.success) {
          addToast("Item deleted", "success");
          fetchInventory();
        }
      } catch (error) {
        addToast("Delete failed", "error");
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            Inventory Management
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4, margin: "4px 0 0" }}>Track physical assets and equipment</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            onClick={() => {
              if (items.length === 0) return addToast("No items to export", "error");
              generateInventoryReport(filteredItems);
              addToast("Generating Inventory Report...", "success");
            }} 
            style={{ background: "#fff", color: "#1B4332", border: "1px solid #1B4332", padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <Download size={16} /> Export PDF
          </button>
          <button 
            onClick={() => handleOpenModal()} 
            style={{ background: "#1B4332", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ position: "relative", marginBottom: 20, width: "100%", maxWidth: 300 }}>
          <Search size={16} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text" 
            placeholder="Search by name or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading inventory...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>No inventory items found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredItems.map(item => (
                  <div key={item.id} style={{ border: "1px solid #000", borderRadius: 12, padding: 16, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0faf4", color: "#1B4332", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Box size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{item.itemName}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{item.category || "No Category"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleOpenModal(item)} style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", padding: 4 }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 2 }}>TOTAL QTY</div>
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{item.totalQuantity}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 2 }}>AVAILABLE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: item.availableQuantity < item.totalQuantity * 0.2 ? "#dc2626" : "#059669" }}>
                          {item.availableQuantity}
                        </div>
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>CONDITION</div>
                        <span style={{ 
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-block",
                          background: item.condition === "Good" ? "#dcfce7" : item.condition === "Needs Repair" ? "#fef9c3" : "#fee2e2",
                          color: item.condition === "Good" ? "#15803d" : item.condition === "Needs Repair" ? "#a16207" : "#b91c1c"
                        }}>
                          {item.condition}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Item Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Category</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Total Qty</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Available</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Condition</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0faf4", color: "#1B4332", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Box size={16} />
                        </div>
                        {item.itemName}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#4b5563" }}>{item.category || "—"}</td>
                      <td style={{ padding: "14px 16px", color: "#4b5563" }}>{item.totalQuantity}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 700, color: item.availableQuantity < item.totalQuantity * 0.2 ? "#dc2626" : "#059669" }}>
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ 
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: item.condition === "Good" ? "#dcfce7" : item.condition === "Needs Repair" ? "#fef9c3" : "#fee2e2",
                          color: item.condition === "Good" ? "#15803d" : item.condition === "Needs Repair" ? "#a16207" : "#b91c1c"
                        }}>
                          {item.condition}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button onClick={() => handleOpenModal(item)} style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", padding: 4, marginRight: 8 }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 500, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{formData.id ? "Edit Item" : "Add Inventory Item"}</h2>
            </div>
            
            <form onSubmit={handleSubmit} style={{ overflowY: "auto", padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Item Name *</label>
                <input required type="text" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} style={inputStyle} placeholder="e.g. Banquet Chairs" />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Category</label>
                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={inputStyle} placeholder="e.g. Furniture, Audio/Visual" />
              </div>
              
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Total Quantity *</label>
                  <input required type="number" min="1" value={formData.totalQuantity} onChange={e => {
                    const newTotal = parseInt(e.target.value) || 0;
                    setFormData({
                      ...formData, 
                      totalQuantity: newTotal,
                      availableQuantity: formData.id ? formData.availableQuantity : newTotal // Auto-sync available if new
                    });
                  }} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Available Quantity *</label>
                  <input required type="number" min="0" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: parseInt(e.target.value) || 0})} style={inputStyle} />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Condition</label>
                  <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} style={inputStyle}>
                    <option value="Good">Good</option>
                    <option value="Needs Repair">Needs Repair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Unit Price (₹) [Optional]</label>
                  <input type="number" step="0.01" min="0" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} style={inputStyle} placeholder="Cost per unit" />
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Notes / Description</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ ...inputStyle, minHeight: 80 }} placeholder="Any extra details..."></textarea>
              </div>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1B4332", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>{formData.id ? "Update Item" : "Save Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
