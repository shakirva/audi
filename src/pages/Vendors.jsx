import React, { useState } from "react";
import { Store, Plus, Search, Star, Phone, MapPin, Mail, ChevronRight, CheckCircle, ShieldCheck } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";

const DEMO_VENDORS = [
  { id: "VND-01", name: "Royal Catering Services", category: "Catering", rating: 4.8, status: "Active", jobs: 42, phone: "+91 9846012345", location: "Kannur", tags: ["Premium", "Veg & Non-Veg"] },
  { id: "VND-02", name: "Aura Decorators & Events", category: "Decoration", rating: 4.9, status: "Active", jobs: 128, phone: "+91 9447098765", location: "Thalassery", tags: ["Floral", "Lighting"] },
  { id: "VND-03", name: "Beats Audio & Lighting", category: "Sound & Stage", rating: 4.5, status: "Active", jobs: 85, phone: "+91 9995511223", location: "Kannur", tags: ["Line Array", "DJ"] },
  { id: "VND-04", name: "Golden Memories Studio", category: "Photography", rating: 4.7, status: "Pending", jobs: 14, phone: "+91 9847055443", location: "Iritty", tags: ["Candid", "Drone"] },
  { id: "VND-05", name: "Malabar Event Planners", category: "Event Management", rating: 4.2, status: "Active", jobs: 36, phone: "+91 9446077889", location: "Payyanur", tags: ["Full Package"] },
  { id: "VND-06", name: "Fresh Blooms Florist", category: "Decoration", rating: 4.6, status: "Inactive", jobs: 12, phone: "+91 9846011222", location: "Kannur", tags: ["Wholesale"] }
];

export default function Vendors() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const categories = ["All", "Catering", "Decoration", "Sound & Stage", "Photography", "Event Management"];

  const filtered = DEMO_VENDORS.filter(v => {
    if (filterCat !== "All" && v.category !== filterCat) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: "30px 40px", maxWidth: 1400, margin: "0 auto", fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #1B4332, #2D6A4F)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 12px rgba(27,67,50,0.2)" }}>
              <Store size={20} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#0f172a", fontFamily: "'Playfair Display', serif" }}>Vendors & Partners</h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Manage external service providers, track their performance, and assign jobs.</p>
        </div>
        <button style={{
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(27,67,50,0.2)", fontSize: 13, transition: "transform 0.2s"
        }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <Plus size={16} /> Onboard Vendor
        </button>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 30 }}>
        {[
          { label: "Total Vendors", val: DEMO_VENDORS.length, color: "#1B4332", bg: "#eefcf4" },
          { label: "Active Partners", val: DEMO_VENDORS.filter(v=>v.status==="Active").length, color: "#0ea5e9", bg: "#f0f9ff" },
          { label: "Pending Approval", val: DEMO_VENDORS.filter(v=>v.status==="Pending").length, color: "#d97706", bg: "#fffbeb" },
          { label: "Avg Rating", val: "4.6", color: "#10b981", bg: "#ecfdf5", suffix: "⭐" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "#fff", padding: "20px", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.label}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.val}</h3>
              {kpi.suffix && <span style={{ fontSize: 14 }}>{kpi.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center", background: "#fff", padding: 12, borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <div style={{ position: "relative", width: 320 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: 12, color: "#94a3b8" }} />
          <input 
            type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#f8fafc" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
        {filtered.map(vendor => (
          <div key={vendor.id} style={{
            background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f1f5f9", 
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)", position: "relative", transition: "transform 0.2s", cursor: "pointer"
          }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            
            {/* Status Badge */}
            <div style={{ position: "absolute", top: 24, right: 24, display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", 
              background: vendor.status === "Active" ? "#dcfce7" : vendor.status === "Pending" ? "#fef3c7" : "#f1f5f9",
              color: vendor.status === "Active" ? "#16a34a" : vendor.status === "Pending" ? "#d97706" : "#64748b" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                <Phone size={14} color="#94a3b8" /> {vendor.phone}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                <MapPin size={14} color="#94a3b8" /> {vendor.location}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                <ShieldCheck size={14} color="#94a3b8" /> {vendor.jobs} Jobs Done
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
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1B4332" }}>View Full Profile</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
