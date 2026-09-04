import React, { useState, useEffect } from "react";
import { Store, Plus, Search, Star, Phone, MapPin, Mail, ChevronRight, CheckCircle, ShieldCheck, Edit, Trash2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { useConfirm } from "../components/ConfirmProvider";
import { useRole } from "../context/RoleContext";
import { vendorsAPI } from "../services/api";



export default function Vendors() {
  const { confirm } = useConfirm();
  const { tenant } = useRole();
  const tSlug = tenant?.slug || 'default';
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [localVendors, setLocalVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [form, setForm] = useState({ id: null, name: "", category: "Catering", phone: "", location: "", email: "", tags: "" });

  useEffect(() => {
    const fetchAndMigrate = async () => {
      try {
        setLoading(true);
        // 1. Fetch from API
        const { data } = await vendorsAPI.getAll();
        let serverVendors = data.data || [];
        
        // 2. Check for migration from localStorage
        const localDataStr = localStorage.getItem(`hm_local_vendors_${tSlug}`);
        const deletedDataStr = localStorage.getItem(`hm_deleted_vendors_${tSlug}`);
        
        if (localDataStr) {
          const oldLocal = JSON.parse(localDataStr) || [];
          const oldDeleted = JSON.parse(deletedDataStr || "[]") || [];
          
          // Filter to only those created locally (id starts with LOCAL_) and not deleted
          const toMigrate = oldLocal.filter(v => v.id && v.id.startsWith("LOCAL_") && !oldDeleted.includes(v.id));
          
          if (toMigrate.length > 0) {
            console.log("Migrating", toMigrate.length, "vendors to server...");
            for (const v of toMigrate) {
              await vendorsAPI.create({
                name: v.name,
                category: v.category,
                phone: v.phone,
                location: v.location,
                email: v.email,
                tags: v.tags
              });
            }
            // Re-fetch after migration
            const res2 = await vendorsAPI.getAll();
            serverVendors = res2.data.data || [];
          }
          
          // Cleanup localStorage
          localStorage.removeItem(`hm_local_vendors_${tSlug}`);
          localStorage.removeItem(`hm_deleted_vendors_${tSlug}`);
        }
        
        setLocalVendors(serverVendors);
      } catch (err) {
        console.error("Failed to load vendors:", err);
      } finally {
        setLoading(false);
      }
    };
    if (tSlug) fetchAndMigrate();
  }, [tSlug]);

  const allVendors = localVendors;

  const categories = ["All", "Catering", "Decoration", "Sound & Stage", "Photography", "Event Management"];

  const filtered = allVendors.filter(v => {
    if (filterCat !== "All" && v.category !== filterCat) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        const { data } = await vendorsAPI.update(form.id, {
          name: form.name, 
          category: form.category, 
          phone: form.phone, 
          location: form.location, 
          email: form.email, 
          tags: form.tags ? (typeof form.tags === 'string' ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : form.tags) : [] 
        });
        setLocalVendors(localVendors.map(v => v.id === form.id ? data.data : v));
      } else {
        const { data } = await vendorsAPI.create({ 
          name: form.name,
          category: form.category,
          phone: form.phone,
          location: form.location,
          email: form.email,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : []
        });
        setLocalVendors([...localVendors, data.data]);
      }
      setModalOpen(false);
      setForm({ id: null, name: "", category: "Catering", phone: "", location: "", email: "", tags: "" });
    } catch (err) {
      console.error("Failed to save vendor:", err);
      alert(err.response?.data?.error || "Failed to save vendor. Please check if your plan supports this feature.");
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm("Are you sure you want to delete this vendor?");
    if (isConfirmed) {
      try {
        await vendorsAPI.remove(id);
        setLocalVendors(localVendors.filter(v => v.id !== id));
      } catch (err) {
        console.error("Failed to delete vendor:", err);
        alert("Failed to delete vendor");
      }
    }
  };

  const openEdit = (v, e) => {
    e.stopPropagation();
    setForm({
      id: v.id,
      name: v.name,
      category: v.category,
      phone: v.phone || "",
      location: v.location || "",
      email: v.email || "",
      tags: v.tags ? v.tags.join(", ") : ""
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Inactive" : currentStatus === "Inactive" ? "Pending" : "Active";
    try {
      await vendorsAPI.update(id, { status: nextStatus });
      const updated = localVendors.map(v => v.id === id ? { ...v, status: nextStatus } : v);
      setLocalVendors(updated);
      if (selectedVendor && selectedVendor.id === id) {
        setSelectedVendor({ ...selectedVendor, status: nextStatus });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  const handleDeleteVendor = async (id) => {
    if (!(await confirm("Are you sure you want to delete this vendor?"))) return;
    try {
      await vendorsAPI.remove(id);
      setLocalVendors(localVendors.filter(v => v.id !== id));
      setSelectedVendor(null);
    } catch (err) {
      console.error("Failed to delete vendor:", err);
      alert("Failed to delete vendor");
    }
  };

  const handleFinanceUpdate = (id, field, amount) => {
    // Finance update is simulated for now since Job module will handle actual payments
    const num = Number(amount) || 0;
    const updated = localVendors.map(v => {
      if (v.id === id) {
        const newVal = (v[field] || 0) + num;
        const updatedV = { ...v, [field]: newVal };
        if (selectedVendor?.id === id) setSelectedVendor(updatedV);
        return updatedV;
      }
      return v;
    });
    setLocalVendors(updated);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading vendors...</div>;
  }

  return (
    <div style={{ padding: window.innerWidth < 768 ? "16px" : "32px 40px", maxWidth: 1400, margin: "0 auto", fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", borderRadius: 24, boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #1B4332, #2D6A4F)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 12px rgba(27,67,50,0.2)" }}>
              <Store size={20} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#0f172a", fontFamily: "'Playfair Display', serif" }}>Vendors & Partners</h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Manage external service providers, track their performance, and assign jobs.</p>
        </div>
        <button onClick={() => { setForm({ id: null, name: "", category: "Catering", phone: "", location: "", email: "", tags: "" }); setModalOpen(true); }} style={{
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(27,67,50,0.2)", fontSize: 13, transition: "transform 0.2s", whiteSpace: "nowrap"
        }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <Plus size={16} /> Onboard Vendor
        </button>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 40 }}>
        {[
          { label: "Total Vendors", val: allVendors.length, color: "#1B4332" },
          { label: "Active Vendors", val: allVendors.filter(v=>v.status==="Active").length, color: "#0ea5e9" },
          { label: "Non-Active Vendors", val: allVendors.filter(v=>v.status!=="Active").length, color: "#ef4444" }
        ].map((kpi, i) => (
          <div key={i} style={{ background: "#fff", padding: "20px", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.label}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", marginBottom: 40 }}>
        <div style={{ position: "relative", width: "100%" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: 12, color: "#94a3b8" }} />
          <input 
            type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", width: "100%", paddingBottom: 4, WebkitOverflowScrolling: "touch", whiteSpace: "nowrap" }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
              background: filterCat === c ? "#1B4332" : "#f1f5f9", color: filterCat === c ? "#fff" : "#475569", transition: "all 0.2s"
            }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* VENDOR GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {filtered.map(vendor => (
          <div key={vendor.id} onClick={() => setSelectedVendor(vendor)} style={{
            background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f1f5f9", 
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)", position: "relative", transition: "transform 0.2s", cursor: "pointer"
          }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            
            {/* Status Badge */}
            <div onClick={(e) => { e.stopPropagation(); handleToggleStatus(vendor.id, vendor.status); }} style={{ position: "absolute", top: 24, right: 24, display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", 
              background: vendor.status === "Active" ? "#dcfce7" : vendor.status === "Pending" ? "#fef3c7" : "#f1f5f9",
              color: vendor.status === "Active" ? "#16a34a" : vendor.status === "Pending" ? "#d97706" : "#64748b",
              cursor: String(vendor.id).startsWith("LOCAL_") ? "pointer" : "default"
            }}>
              {vendor.status === "Active" && <CheckCircle size={10} />}
              {vendor.status}
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#1B4332" }}>
                {vendor.name.charAt(0)}
              </div>
              <div style={{ paddingRight: 60 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{vendor.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  <span style={{ color: "#1B4332", background: "#eefcf4", padding: "2px 8px", borderRadius: 6 }}>{vendor.category}</span>
                  •
                  <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#d97706" }}><Star size={12} fill="currentColor" /> {vendor.rating}</span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                <Phone size={14} color="#94a3b8" /> {vendor.phone}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                <MapPin size={14} color="#94a3b8" /> {vendor.location}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                <ShieldCheck size={14} color="#94a3b8" /> {vendor.jobs} Jobs Done
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: (vendor.totalBilled - vendor.totalPaid > 0) ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                ₹{((vendor.totalBilled || 0) - (vendor.totalPaid || 0)).toLocaleString("en-IN")} Due
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {vendor.tags.map(t => (
                <span key={t} style={{ fontSize: 10, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: 6 }}>{t}</span>
              ))}
            </div>

            {/* Footer action */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#1B4332" }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>View Profile</span>
                <ChevronRight size={14} />
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={(e) => openEdit(vendor, e)} style={{ border: "none", background: "none", cursor: "pointer", color: "#475569" }} title="Edit Vendor">
                  <Edit size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(vendor.id); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }} title="Delete Vendor">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VENDOR PROFILE MODAL */}
      {selectedVendor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 600, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", color: "#fff" }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800 }}>
                  {selectedVendor.name.charAt(0)}
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>{selectedVendor.name}</h2>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.9 }}>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 6 }}>{selectedVendor.category}</span>
                    <span>⭐ {selectedVendor.rating}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            
            <div style={{ padding: "24px" }}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>CONTACT</p>
                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}><Phone size={14}/> {selectedVendor.phone}</p>
                  {selectedVendor.email && <p style={{ margin: 0, fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}><Mail size={14}/> {selectedVendor.email}</p>}
                </div>
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>LOCATION</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14}/> {selectedVendor.location}</p>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>TAGS & SPECIALTIES</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedVendor.tags?.map(t => (
                    <span key={t} style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "4px 12px", borderRadius: 20 }}>{t}</span>
                  ))}
                  {!selectedVendor.tags?.length && <span style={{ fontSize: 13, color: "#94a3b8" }}>No tags specified</span>}
                </div>
              </div>

              {/* FINANCES */}
              <div style={{ marginBottom: 24, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 700 }}>FINANCIAL OVERVIEW</p>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: (selectedVendor.totalBilled - selectedVendor.totalPaid > 0) ? "#fee2e2" : "#dcfce7", color: (selectedVendor.totalBilled - selectedVendor.totalPaid > 0) ? "#ef4444" : "#16a34a" }}>
                    Balance Due: ₹{((selectedVendor.totalBilled || 0) - (selectedVendor.totalPaid || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>Total Billed</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>₹{(selectedVendor.totalBilled || 0).toLocaleString("en-IN")}</p>
                    {String(selectedVendor.id).startsWith("LOCAL_") && (
                      <button onClick={() => {
                        const amt = window.prompt("Enter new bill amount to add (₹):");
                        if (amt) handleFinanceUpdate(selectedVendor.id, "totalBilled", amt);
                      }} style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: 12, fontWeight: 700, padding: 0, marginTop: 8, cursor: "pointer" }}>+ Add Bill</button>
                    )}
                  </div>
                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>Total Paid</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#16a34a" }}>₹{(selectedVendor.totalPaid || 0).toLocaleString("en-IN")}</p>
                    {String(selectedVendor.id).startsWith("LOCAL_") && (
                      <button onClick={() => {
                        const amt = window.prompt("Enter payment amount to add (₹):");
                        if (amt) handleFinanceUpdate(selectedVendor.id, "totalPaid", amt);
                      }} style={{ background: "none", border: "none", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: 0, marginTop: 8, cursor: "pointer" }}>+ Record Payment</button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => handleToggleStatus(selectedVendor.id, selectedVendor.status)} style={{ padding: "10px 16px", background: selectedVendor.status === "Active" ? "#fef3c7" : "#dcfce7", color: selectedVendor.status === "Active" ? "#d97706" : "#16a34a", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    Mark as {selectedVendor.status === "Active" ? "Inactive" : "Active"}
                  </button>
                  {String(selectedVendor.id).startsWith("LOCAL_") && (
                    <button onClick={() => handleDeleteVendor(selectedVendor.id)} style={{ padding: "10px 16px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Delete Vendor</button>
                  )}
                </div>
                <button onClick={() => setSelectedVendor(null)} style={{ padding: "10px 24px", background: "#f1f5f9", border: "none", borderRadius: 8, fontWeight: 700, color: "#475569", cursor: "pointer", fontSize: 13 }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 16 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 500, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #0D2418, #1B4332)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>Onboard Vendor</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Vendor Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="e.g. ABC Catering" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Category *</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", cursor: "pointer" }}>
                  {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Phone Number</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="+91 XXXX" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="Email address" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Location</label>
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="City" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" }}>Tags (comma separated)</label>
                  <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} placeholder="Premium, Veg..." />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "none", borderRadius: 8, fontWeight: 700, color: "#475569", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "12px", background: "#1B4332", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
