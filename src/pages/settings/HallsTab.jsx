import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Edit3, Trash2, IndianRupee } from "lucide-react";
import CreateHallModal from "../../components/CreateHallModal";
import { mastersAPI, settingsAPI, isPlanRestriction } from "../../services/api";
import { useConfirm } from "../../components/ConfirmProvider";

export default function HallsTab({
  halls,
  setHalls,
  maxHalls,
  globalSessions,
  addToast
}) {
  const { confirm } = useConfirm();
  const [showCreateHallModal, setShowCreateHallModal] = useState(false);
  const [editHallIndex, setEditHallIndex] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [newFacility, setNewFacility] = useState({ name: "", price: "", gst: "" });
  const [editFacilityId, setEditFacilityId] = useState(null);
  const [editFacilityData, setEditFacilityData] = useState({ name: "", price: "", gst: "" });

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const res = await mastersAPI.getByType("services");
      setFacilities(res.data?.data || []);
    } catch (e) {
      console.error("Failed to load facilities:", e);
    }
  };

  const handleAddHall = () => {
    if (maxHalls !== null && halls.length >= maxHalls) {
      window.dispatchEvent(new CustomEvent("plan-upgrade-required", {
        detail: {
          code: "LIMIT_EXCEEDED",
          message: `You have reached the hall limit (${maxHalls}) on your current plan. Upgrade to add more.`
        }
      }));
      return;
    }
    setEditHallIndex(null);
    setShowCreateHallModal(true);
  };

  const handleEditHall = (idx) => {
    setEditHallIndex(idx);
    setShowCreateHallModal(true);
  };

  const handleDeleteHall = async (idx) => {
    if (!(await confirm("Delete this hall?"))) return;
    const updatedHalls = halls.filter((_, i) => i !== idx);
    setHalls(updatedHalls);
    try {
      await settingsAPI.update({ halls: updatedHalls });
      addToast("Hall deleted", "success");
    } catch (e) {
      addToast("Failed to delete hall", "error");
    }
  };

  const handleAddFacility = async () => {
    if (!newFacility.name.trim()) return;
    try {
      await mastersAPI.create({ name: newFacility.name, price: Number(newFacility.price) || 0, type: "services", gst: Number(newFacility.gst) || 0 });
      setNewFacility({ name: "", price: "", gst: "" });
      loadFacilities();
      addToast("Facility added! 🛠️", "success");
    } catch (e) {
      addToast("Failed to add facility", "error");
    }
  };

  const handleUpdateFacility = async () => {
    if (!editFacilityData.name.trim()) return;
    try {
      await mastersAPI.update("services", editFacilityId, { name: editFacilityData.name, price: Number(editFacilityData.price) || 0, gst: Number(editFacilityData.gst) || 0 });
      setEditFacilityId(null);
      setEditFacilityData({ name: "", price: "", gst: "" });
      loadFacilities();
      addToast("Facility updated!", "success");
    } catch (e) {
      addToast("Failed to update facility", "error");
    }
  };

  const handleDeleteFacility = async (id) => {
    if (!(await confirm("Delete this facility?"))) return;
    try {
      await mastersAPI.remove("services", id);
      loadFacilities();
      addToast("Facility deleted", "info");
    } catch (e) {
      addToast("Failed to delete facility", "error");
    }
  };

  const iStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e5e7eb", fontSize: 13, color: "#374151",
    background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };
  const cardSt = {
    background: "#fff", borderRadius: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 20, marginBottom: 16,
  };
  const sectionTitle = {
    fontFamily: "'Playfair Display', serif", fontSize: 16,
    fontWeight: 700, color: "#111827", marginBottom: 4, margin: 0,
  };

  return (
    <>
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={20} color="#4b5563" />
            </div>
            <div>
              <p style={sectionTitle}>Hall Management</p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Create halls and define their capacities and pricing models</p>
            </div>
          </div>
          <button onClick={handleAddHall} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, background: "#1B4332", color: "#fff",
            border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            <Plus size={16} /> Add New Hall
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {halls.map((hall, idx) => (
            <div key={idx} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px",
              background: "#f8fafc"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 24 }}>{hall.icon}</span>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>{hall.name}</h4>
                  <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#64748b" }}>
                    <span>👥 {hall.capacity || "0"} Guests</span>
                    <span>•</span>
                    <span style={{ textTransform: "capitalize" }}>{hall.pricingType ? hall.pricingType.replace("_", " ") : "Fixed"} Pricing</span>
                    <span>•</span>
                    <span>{hall.gstRate || 0}% GST</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleEditHall(idx)} style={{ background: "#e0f2fe", border: "none", borderRadius: 8, cursor: "pointer", padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, color: "#0369a1", fontWeight: 600, fontSize: 13 }}>
                  <Edit size={14} /> Edit
                </button>
                <button onClick={() => handleDeleteHall(idx)} style={{ background: "#fef2f2", border: "none", borderRadius: 8, cursor: "pointer", padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, color: "#dc2626", fontWeight: 600, fontSize: 13 }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          {halls.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 14 }}>
              No halls configured yet. Click "Add New Hall" to get started.
            </div>
          )}
        </div>
      </div>

      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={20} color="#c026d3" />
          </div>
          <div>
            <p style={sectionTitle}>Facilities & Add-ons</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Extra services offered at your venue</p>
          </div>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "12px 16px" }}>Facility Name</th>
                <th style={{ padding: "12px 16px" }}>Price (₹)</th>
                <th style={{ padding: "12px 16px" }}>GST (%)</th>
                <th style={{ padding: "12px 16px", width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((fac) => (
                <tr key={fac.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 16px" }}>
                    {editFacilityId === fac.id ? (
                      <input value={editFacilityData.name} onChange={e => setEditFacilityData({ ...editFacilityData, name: e.target.value })} style={{ ...iStyle, padding: "6px 8px" }} />
                    ) : (
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{fac.name}</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {editFacilityId === fac.id ? (
                      <input type="number" value={editFacilityData.price} onChange={e => setEditFacilityData({ ...editFacilityData, price: e.target.value })} style={{ ...iStyle, padding: "6px 8px" }} />
                    ) : (
                      <span style={{ color: "#475569" }}>₹{fac.price.toLocaleString()}</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {editFacilityId === fac.id ? (
                      <input type="number" value={editFacilityData.gst} onChange={e => setEditFacilityData({ ...editFacilityData, gst: e.target.value })} style={{ ...iStyle, padding: "6px 8px" }} />
                    ) : (
                      <span style={{ color: "#475569" }}>{fac.gst}%</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {editFacilityId === fac.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={handleUpdateFacility} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Save</button>
                        <button onClick={() => setEditFacilityId(null)} style={{ background: "#e2e8f0", color: "#475569", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setEditFacilityId(fac.id); setEditFacilityData({ name: fac.name, price: fac.price, gst: fac.gst || 0 }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6" }} title="Edit"><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteFacility(fac.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Add New Row */}
              <tr style={{ borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                <td style={{ padding: "12px 16px" }}>
                  <input placeholder="New facility name..." value={newFacility.name} onChange={e => setNewFacility({ ...newFacility, name: e.target.value })} style={{ ...iStyle, padding: "6px 8px" }} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <input type="number" placeholder="Price" value={newFacility.price} onChange={e => setNewFacility({ ...newFacility, price: e.target.value })} style={{ ...iStyle, padding: "6px 8px" }} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <input type="number" placeholder="GST %" value={newFacility.gst} onChange={e => setNewFacility({ ...newFacility, gst: e.target.value })} style={{ ...iStyle, padding: "6px 8px" }} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={handleAddFacility} style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={14} /> Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <CreateHallModal
        open={showCreateHallModal}
        editData={editHallIndex !== null ? halls[editHallIndex] : null}
        globalSessions={globalSessions}
        onClose={() => {
          setShowCreateHallModal(false);
          setEditHallIndex(null);
        }}
        onSave={async (newHall) => {
          let updatedHalls = [];
          const isEdit = editHallIndex !== null;
          if (isEdit) {
            updatedHalls = halls.map((h, i) => i === editHallIndex ? { ...h, ...newHall } : h);
          } else {
            updatedHalls = [...halls, newHall];
          }
          
          try {
            await settingsAPI.update({ halls: updatedHalls });
            setHalls(updatedHalls);
            addToast(`${newHall.name} ${isEdit ? "updated" : "added"} successfully!`, "success");
            setShowCreateHallModal(false);
            setEditHallIndex(null);
          } catch(e) {
            if (!isPlanRestriction(e)) {
              addToast("Failed to save hall", "error");
            }
          }
        }}
      />
    </>
  );
}
