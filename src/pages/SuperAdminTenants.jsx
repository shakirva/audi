import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import { useToast } from "../components/Toast";
import { Building, Play, Pause, Database, Key, CheckCircle, Clock, Plus, X, ArrowRight } from "lucide-react";

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", slug: "", ownerName: "", email: "", phone: "", plan: "trial" });
  const [editTenant, setEditTenant] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data } = await adminAPI.getTenants();
      setTenants(data);
    } catch (error) {
      addToast("Failed to fetch tenants", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminAPI.toggleStatus(id);
      fetchTenants();
      addToast("Tenant status updated", "success");
    } catch (e) {
      addToast("Failed to update status", "error");
    }
  };

  const handleToggleSandbox = async (id) => {
    try {
      await adminAPI.toggleSandbox(id);
      fetchTenants();
      addToast("Tenant sandbox updated", "success");
    } catch (e) {
      addToast("Failed to update sandbox", "error");
    }
  };

  const handleEnterTenant = async (tenant) => {
    try {
      // Temporarily store superadmin token so they don't get completely locked out
      // (Though a real implementation might have a "Return to Admin" button)
      const currentToken = localStorage.getItem("hm_token");
      if (currentToken) localStorage.setItem("hm_superadmin_token", currentToken);
      
      const { data } = await adminAPI.impersonate(tenant.id);
      
      localStorage.setItem("hm_token", data.token);
      localStorage.setItem("hm_user", JSON.stringify(data.user));
      if (data.tenant) {
        localStorage.setItem("hm_tenant", JSON.stringify(data.tenant));
      }
      sessionStorage.setItem("hm_environment", "production");
      
      addToast(`Entering ${tenant.name}...`, "success");
      setTimeout(() => {
        window.location.href = `/${tenant.slug}/dashboard`;
      }, 500);
    } catch (e) {
      addToast("Failed to enter tenant ERP", "error");
    }
  };


  const handleAddTenant = async (e) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.slug || !newTenant.email) {
      addToast("Name, slug, and email are required", "error");
      return;
    }
    try {
      await adminAPI.createTenant(newTenant);
      addToast("Tenant created successfully! 🎉", "success");
      setShowAddModal(false);
      setNewTenant({ name: "", slug: "", ownerName: "", email: "", phone: "", plan: "trial" });
      fetchTenants();
    } catch (e) {
      addToast(e.response?.data?.error || "Failed to create tenant", "error");
    }
  };

  const handleEditClick = (tenant) => {
    setEditTenant({ ...tenant });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateTenant(editTenant.id, {
        name: editTenant.name,
        slug: editTenant.slug,
        ownerName: editTenant.ownerName,
        email: editTenant.email,
        phone: editTenant.phone,
      });
      addToast("Tenant updated successfully! 🎉", "success");
      setShowEditModal(false);
      setEditTenant(null);
      fetchTenants();
    } catch (e) {
      addToast(e.response?.data?.error || "Failed to update tenant", "error");
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading tenants...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, margin: 0 }}>Tenants Directory</h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>Manage all SaaS platform tenants and subscriptions</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8, background: "#1B4332", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
          <Plus size={16} /> New Tenant
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>TENANT</th>
              <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>OWNER</th>
              <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>SUBSCRIPTION</th>
              <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>SANDBOX</th>
              <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>STATUS</th>
              <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280", textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building size={20} color="#15803d" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{window.location.origin}/{t.slug}</p>
                  </div>
                </td>
                <td style={{ padding: "16px" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: 0 }}>{t.ownerName}</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{t.email}</p>
                </td>
                <td style={{ padding: "16px" }}>
                  <span style={{ 
                    display: "inline-block", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    background: t.Subscriptions?.[0]?.plan === "enterprise" ? "#fef3c7" : "#eff6ff",
                    color: t.Subscriptions?.[0]?.plan === "enterprise" ? "#b45309" : "#1d4ed8"
                  }}>
                    {t.Subscriptions?.[0]?.plan || "Trial"}
                  </span>
                </td>
                <td style={{ padding: "16px" }}>
                  <button 
                    onClick={() => handleToggleSandbox(t.id)}
                    style={{ 
                      padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 6,
                      background: t.sandboxEnabled ? "#dcfce7" : "#f3f4f6", 
                      color: t.sandboxEnabled ? "#15803d" : "#9ca3af"
                    }}
                  >
                    <Database size={14} /> {t.sandboxEnabled ? "Enabled" : "Disabled"}
                  </button>
                </td>
                <td style={{ padding: "16px" }}>
                  <span style={{ 
                    display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600,
                    color: t.status === "active" ? "#15803d" : "#b91c1c"
                  }}>
                    {t.status === "active" ? <CheckCircle size={14} /> : <Clock size={14} />} 
                    {t.status === "active" ? "Active" : "Suspended"}
                  </span>
                </td>
                <td style={{ padding: "16px", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button 
                      onClick={() => handleEditClick(t)}
                      style={{ 
                        padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        display: "inline-flex", alignItems: "center", gap: 6, color: "#374151"
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(t.id)}
                      style={{ 
                        padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        display: "inline-flex", alignItems: "center", gap: 6, color: "#374151"
                      }}
                    >
                      {t.status === "active" ? <><Pause size={14} color="#b91c1c" /> Suspend</> : <><Play size={14} color="#15803d" /> Activate</>}
                    </button>
                    <button 
                      onClick={() => handleEnterTenant(t)}
                      style={{ 
                        padding: "6px 14px", borderRadius: 6, border: "none", background: "#059669", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#047857"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#059669"}
                    >
                      Enter <ArrowRight size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", width: 500, borderRadius: 16, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, margin: 0 }}>Register New Tenant</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
            </div>
            
            <form onSubmit={handleAddTenant}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Venue Name *</label>
                  <input type="text" required placeholder="e.g. Grand Palace" value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>URL Slug *</label>
                  <input type="text" required placeholder="e.g. grand-palace" value={newTenant.slug} onChange={e => setNewTenant({...newTenant, slug: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Owner Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={newTenant.ownerName} onChange={e => setNewTenant({...newTenant, ownerName: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Owner Email *</label>
                  <input type="email" required placeholder="john@example.com" value={newTenant.email} onChange={e => setNewTenant({...newTenant, email: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Phone</label>
                  <input type="text" placeholder="e.g. 9876543210" value={newTenant.phone} onChange={e => setNewTenant({...newTenant, phone: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Plan</label>
                  <select value={newTenant.plan} onChange={e => setNewTenant({...newTenant, plan: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box", background: "#fff" }}>
                    <option value="trial">Trial (7 Days)</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div style={{ background: "#fef3c7", padding: "12px", borderRadius: 8, marginBottom: 20, border: "1px solid #fde68a" }}>
                <p style={{ fontSize: 12, color: "#92400e", margin: 0, display: "flex", gap: 6 }}>
                  <Key size={14} /> The default owner password will be <strong>password123</strong>
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#374151" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1B4332", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Create Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showEditModal && editTenant && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", width: 500, borderRadius: 16, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, margin: 0 }}>Edit Tenant</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Venue Name *</label>
                  <input type="text" required value={editTenant.name} onChange={e => setEditTenant({...editTenant, name: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>URL Slug *</label>
                  <input type="text" required value={editTenant.slug} onChange={e => setEditTenant({...editTenant, slug: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Owner Name</label>
                  <input type="text" value={editTenant.ownerName} onChange={e => setEditTenant({...editTenant, ownerName: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Owner Email *</label>
                  <input type="email" required value={editTenant.email} onChange={e => setEditTenant({...editTenant, email: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Phone</label>
                  <input type="text" value={editTenant.phone || ""} onChange={e => setEditTenant({...editTenant, phone: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#374151" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1B4332", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
