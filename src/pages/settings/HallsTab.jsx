import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Edit3, Trash2, IndianRupee, Save } from "lucide-react";
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

  const handleHallChange = (idx, field, value) => {
    const newHalls = [...halls];
    newHalls[idx] = { ...newHalls[idx], [field]: value };
    setHalls(newHalls);
  };

  const handleSaveHalls = async () => {
    try {
      await settingsAPI.update({ halls });
      addToast("Hall pricing saved! 💰", "success");
    } catch (e) {
      addToast("Failed to save hall pricing", "error");
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

      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={20} color="#d97706" />
          </div>
          <div>
            <p style={sectionTitle}>Hall Pricing Configuration</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Configure specific rates and slab pricing based on models</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {halls.map((hall, idx) => (
            <div key={idx} style={{
              border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "16px 20px",
              background: "#f8fafc"
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{hall.icon}</span> {hall.name} 
                <span style={{ fontSize: 11, color: "#64748b", background: "#e2e8f0", padding: "4px 8px", borderRadius: 6 }}>
                  {hall.pricingType === "slab" ? "Slab Wise" : hall.pricingType === "per_pax" ? "Per Pax" : "Flat Rate"}
                </span>
              </div>
              
              {(!hall.pricingType || hall.pricingType === "flat") && (
                <div style={{ width: 220 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}><IndianRupee size={12} /> Flat Rate per Session</label>
                  <input type="number" value={hall.price} onChange={e => handleHallChange(idx, "price", e.target.value)} style={iStyle} />
                </div>
              )}

              {hall.pricingType === "per_pax" && (
                <div style={{ width: 220 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}><IndianRupee size={12} /> Rate per Pax</label>
                  <input type="number" value={hall.pricePerPax || 0} onChange={e => handleHallChange(idx, "pricePerPax", e.target.value)} style={iStyle} />
                </div>
              )}

              {hall.pricingType === "slab" && (
                <div>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Configure guest slabs (e.g. Up to 300 guests = Rs. 390,000)</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(hall.slabs || []).map((slab, sIdx) => (
                      <div key={sIdx} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Up to Guests</label>
                          <input type="number" value={slab.guests || ""} onChange={e => {
                            const newSlabs = [...(hall.slabs || [])];
                            newSlabs[sIdx].guests = Number(e.target.value);
                            const g = newSlabs[sIdx].guests || 0;
                            const t = newSlabs[sIdx].totalAmount || 0;
                            const b = newSlabs[sIdx].baseAmount || 0;
                            if (g > 0) newSlabs[sIdx].perPerson = Math.round((t - b) / g);
                            handleHallChange(idx, "slabs", newSlabs);
                          }} style={iStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Total Amount (₹)</label>
                          <input type="number" value={slab.totalAmount || ""} onChange={e => {
                            const newSlabs = [...(hall.slabs || [])];
                            newSlabs[sIdx].totalAmount = Number(e.target.value);
                            const g = newSlabs[sIdx].guests || 0;
                            const t = newSlabs[sIdx].totalAmount || 0;
                            const b = newSlabs[sIdx].baseAmount || 0;
                            if (g > 0) newSlabs[sIdx].perPerson = Math.round((t - b) / g);
                            handleHallChange(idx, "slabs", newSlabs);
                          }} style={iStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Hall Price</label>
                          <input type="number" value={slab.baseAmount || ""} onChange={e => {
                            const newSlabs = [...(hall.slabs || [])];
                            newSlabs[sIdx].baseAmount = Number(e.target.value);
                            const g = newSlabs[sIdx].guests || 0;
                            const t = newSlabs[sIdx].totalAmount || 0;
                            const b = newSlabs[sIdx].baseAmount || 0;
                            if (g > 0) newSlabs[sIdx].perPerson = Math.round((t - b) / g);
                            handleHallChange(idx, "slabs", newSlabs);
                          }} style={iStyle} placeholder="₹" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Per Person</label>
                          <input type="number" value={slab.perPerson || ""} onChange={e => {
                            const newSlabs = [...(hall.slabs || [])];
                            newSlabs[sIdx].perPerson = Number(e.target.value);
                            handleHallChange(idx, "slabs", newSlabs);
                          }} style={iStyle} placeholder="₹" />
                        </div>
                        <button onClick={() => {
                          const newSlabs = (hall.slabs || []).filter((_, i) => i !== sIdx);
                          handleHallChange(idx, "slabs", newSlabs);
                        }} style={{ padding: 8, background: "#fef2f2", border: "none", borderRadius: 8, cursor: "pointer", height: 35 }}>
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newSlabs = [...(hall.slabs || []), { guests: 0, totalAmount: 0, baseAmount: 0, perPerson: 0 }];
                      handleHallChange(idx, "slabs", newSlabs);
                    }} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", width: "fit-content", marginTop: 4 }}>
                      + Add Slab
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button onClick={handleSaveHalls} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: "#1B4332", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(27,67,50,0.2)",
          }}>
            <Save size={16} /> Save Pricing Configuration
          </button>
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
