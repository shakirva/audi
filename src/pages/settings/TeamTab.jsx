import React, { useState } from 'react';
import { Users, ShieldCheck, Database, Edit, Trash2 } from "lucide-react";
import AddStaffModal from "../../components/AddStaffModal";
import { usersAPI, settingsAPI } from "../../services/api";
import { BASE_NAVIGATION } from "../../constants/navigation";
import { useConfirm } from "../../components/ConfirmProvider";

const RoleAccessEditor = ({ moduleAccess, setModuleAccess, addToast }) => {
  const [activeRole, setActiveRole] = useState("Manager");

  const handleToggle = (path) => {
    const current = moduleAccess[activeRole] || BASE_NAVIGATION.flatMap(item => [item.path, ...(item.children?.map(c => c.path) || [])]).filter(Boolean);
    let updated;
    if (current.includes(path)) {
      updated = current.filter(p => p !== path);
    } else {
      updated = [...current, path];
    }
    const newAccess = { ...moduleAccess, [activeRole]: updated };
    setModuleAccess(newAccess);
  };

  const saveAccess = async () => {
    try {
      await settingsAPI.update({ moduleAccess });
      addToast("Role access configured! 🔒", "success");
    } catch (e) {
      addToast("Failed to save role access", "error");
    }
  };

  const defaultPaths = BASE_NAVIGATION.flatMap(item => {
    if (item.roles.includes(activeRole)) {
      return [item.path, ...(item.children?.map(c => c.path) || [])];
    }
    return [];
  }).filter(Boolean);

  const activePaths = moduleAccess[activeRole] || defaultPaths;
  const configurableNav = BASE_NAVIGATION.filter(item => item.label !== "SaaS Platform");

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
        {["Manager", "Sales", "Reception", "Accounts", "Operations", "Coordinator", "Staff", "Security", "Technician", "Cleaner"].map(r => {
          const isActive = activeRole === r;
          return (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: isActive ? 700 : 600,
                border: isActive ? "1px solid #1B4332" : "1px solid #e2e8f0",
                background: isActive ? "#f0faf4" : "#f8fafc", 
                color: isActive ? "#0D2418" : "#64748b", 
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {configurableNav.map(group => {
            const isGroupLink = group.type === "link";
            const hasAccessToMain = activePaths.includes(group.path);
            
            return (
              <div key={group.label} style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <input 
                    type="checkbox" 
                    checked={hasAccessToMain || (group.children && group.children.some(c => activePaths.includes(c.path)))}
                    onChange={() => {
                      if (isGroupLink) {
                        handleToggle(group.path);
                      } else {
                        const allChildrenPaths = group.children.map(c => c.path);
                        const allChecked = allChildrenPaths.every(p => activePaths.includes(p));
                        
                        let newPaths = [...activePaths];
                        if (allChecked) {
                          newPaths = newPaths.filter(p => !allChildrenPaths.includes(p));
                        } else {
                          newPaths = [...new Set([...newPaths, ...allChildrenPaths])];
                        }
                        setModuleAccess({ ...moduleAccess, [activeRole]: newPaths });
                      }
                    }}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1B4332" }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{group.label}</span>
                </div>
                
                {group.children && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 24 }}>
                    {group.children.map(child => (
                      <label key={child.path} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input 
                          type="checkbox" 
                          checked={activePaths.includes(child.path)}
                          onChange={() => handleToggle(child.path)}
                          style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#1B4332" }}
                        />
                        <span style={{ fontSize: 13, color: "#475569" }}>{child.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
          <button onClick={saveAccess} style={{ padding: "10px 20px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(27,67,50,0.2)" }}>
            Save Access for {activeRole}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TeamTab({
  dbUsers,
  loadUsers,
  maxUsers,
  isOwner,
  activeEnvironment,
  moduleAccess,
  setModuleAccess,
  addToast
}) {
  const { confirm } = useConfirm();
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [testerCreds, setTesterCreds] = useState(null);
  const [testerForm, setTesterForm] = useState({ name: "", email: "", password: "" });

  const cardSt = {
    background: "#fff", borderRadius: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 24, marginBottom: 16,
  };
  const sectionTitle = {
    fontFamily: "'Playfair Display', serif", fontSize: 16,
    fontWeight: 700, color: "#111827", marginBottom: 4, margin: 0,
  };
  const iStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e5e7eb", fontSize: 13, color: "#374151",
    background: "#fff", outline: "none", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };

  const handleEditUser = (u) => {
    setEditingStaff(u);
    setShowAddStaffModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (await confirm("Are you sure you want to delete this staff member?")) {
      try {
        await usersAPI.remove(id);
        addToast("Staff deleted", "info");
        loadUsers();
      } catch (e) {
        addToast("Failed to delete staff", "error");
      }
    }
  };

  return (
    <>
      <div style={cardSt}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={20} color="#6d28d9" />
            </div>
            <div>
              <p style={sectionTitle}>Staff & Users</p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Manage user accounts and access</p>
            </div>
          </div>
          <button
            onClick={() => { 
              if (maxUsers !== null) {
                const activeUsersCount = dbUsers.filter(u => u.active).length;
                if (activeUsersCount >= maxUsers) {
                  window.dispatchEvent(new CustomEvent("plan-upgrade-required", {
                    detail: {
                      code: "LIMIT_EXCEEDED",
                      message: `You have reached the user limit (${maxUsers}) on your current plan. Upgrade to add more users.`
                    }
                  }));
                  return;
                }
              }
              setEditingStaff(null); setShowAddStaffModal(true); 
            }}
            style={{
              padding: "10px 18px", borderRadius: 8, border: "none",
              background: "#6d28d9", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 10px rgba(109,40,217,0.25)",
            }}>
            + Add Staff
          </button>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "12px 16px" }}>Name</th>
                <th style={{ padding: "12px 16px" }}>Role</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dbUsers.map((u, i) => (
                <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>{u.name}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{u.email}</p>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      padding: "4px 10px", background: "#e0e7ff", color: "#3730a3", 
                      borderRadius: 20, fontSize: 11, fontWeight: 700 
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {u.active ? 
                      <span style={{ padding: "4px 10px", background: "#dcfce7", color: "#166534", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Active</span> : 
                      <span style={{ padding: "4px 10px", background: "#f1f5f9", color: "#64748b", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Inactive</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleEditUser(u)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6" }} title="Edit"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteUser(u.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {dbUsers.length === 0 && (
                <tr style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No staff added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOwner && (
        <div style={cardSt}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={20} color="#c026d3" />
            </div>
            <div>
              <p style={sectionTitle}>Roles & Permissions</p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Configure which modules are visible to each staff role</p>
            </div>
          </div>
          <RoleAccessEditor moduleAccess={moduleAccess || {}} setModuleAccess={setModuleAccess} addToast={addToast} />
        </div>
      )}

      {isOwner && activeEnvironment === "sandbox" && (
        <div style={{ ...cardSt, border: "1.5px solid #fecaca", background: "linear-gradient(135deg, #fef2f2, #fff1f2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Database size={20} color="#991b1b" />
            </div>
            <div>
              <p style={{ ...sectionTitle, color: "#991b1b" }}>Sandbox Management</p>
              <p style={{ fontSize: 13, color: "#b91c1c", margin: 0 }}>Reset your training data</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: 12, background: "#fff", border: "1.5px solid #fecaca", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Reset Sandbox</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, marginBottom: 0 }}>
                Delete all sandbox bookings and restore default training data. Production will remain untouched.
              </p>
            </div>
            <button
              onClick={async () => {
                if (await confirm("Are you sure you want to reset the Sandbox? All current training data will be lost. (Production is safe).")) {
                  try {
                    await settingsAPI.resetSandbox();
                    addToast("Sandbox reset successfully!", "success");
                    window.location.reload();
                  } catch(e) {
                    addToast("Failed to reset sandbox", "error");
                  }
                }
              }}
              style={{ padding: "10px 20px", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Reset Data
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", borderRadius: 12, background: "#fff", border: "1.5px solid #fecaca" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ paddingRight: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Tester / Auditor Account</p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, marginBottom: 0 }}>
                  Generate a login that is permanently locked to this Sandbox. The red Sandbox warning will be hidden from them.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 260 }}>
                <input
                  type="text"
                  placeholder="Custom Name (optional)"
                  value={testerForm.name}
                  onChange={e => setTesterForm({ ...testerForm, name: e.target.value })}
                  style={iStyle}
                />
                <input
                  type="email"
                  placeholder="Custom Email (optional)"
                  value={testerForm.email}
                  onChange={e => setTesterForm({ ...testerForm, email: e.target.value })}
                  style={iStyle}
                />
                <input
                  type="text"
                  placeholder="Custom Password (optional)"
                  value={testerForm.password}
                  onChange={e => setTesterForm({ ...testerForm, password: e.target.value })}
                  style={iStyle}
                />
                <button
                  onClick={async () => {
                    try {
                      const { data } = await settingsAPI.generateTester(testerForm);
                      setTesterCreds(data.data);
                      setTesterForm({ name: "", email: "", password: "" });
                      addToast("Tester credentials generated!", "success");
                    } catch(e) {
                      addToast("Failed to generate credentials", "error");
                    }
                  }}
                  style={{ padding: "10px 16px", borderRadius: 8, background: "#b91c1c", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", alignSelf: "flex-end" }}
                >
                  Generate Credentials
                </button>
              </div>
            </div>
            
            {testerCreds && (
              <div style={{ background: "#fef2f2", padding: "16px", borderRadius: 10, border: "1px dashed #fca5a5", marginTop: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", margin: "0 0 12px 0" }}>Share these securely with the inspector/tester:</p>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "#b91c1c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "2px 0 0", fontFamily: "monospace" }}>{testerCreds.name}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#b91c1c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "2px 0 0", fontFamily: "monospace" }}>{testerCreds.email}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#b91c1c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "2px 0 0", fontFamily: "monospace" }}>{testerCreds.password}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AddStaffModal 
        open={showAddStaffModal}
        onClose={() => { setShowAddStaffModal(false); setEditingStaff(null); }}
        editingUser={editingStaff}
        onSave={async (staffData, id) => {
          if (id) {
            await usersAPI.update(id, staffData);
            addToast("Staff updated successfully!", "success");
          } else {
            await usersAPI.create(staffData);
            addToast("Staff created successfully!", "success");
          }
          loadUsers();
          setShowAddStaffModal(false);
          setEditingStaff(null);
        }}
      />
    </>
  );
}
