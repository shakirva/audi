const fs = require('fs');
const path = './src/pages/CRM.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldUnassigned = `<div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8f9fa", padding: "2px 8px 2px 2px", borderRadius: 12, border: "1px solid #eaeaea" }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#1B4332", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                                  {enq.SalesExecutive?.name?.charAt(0) || enq.assignedTo?.charAt(0) || "?"}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#4b5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>
                                  {enq.SalesExecutive?.name || enq.assignedTo || "Unassigned"}
                                </span>
                              </div>`;

const newUnassigned = `<div style={{ display: "flex", alignItems: "center", gap: 6, background: enq.SalesExecutive ? "#f8f9fa" : "#fee2e2", padding: "2px 8px 2px 2px", borderRadius: 12, border: \`1px solid \${enq.SalesExecutive ? "#eaeaea" : "#fca5a5"}\` }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: enq.SalesExecutive ? "#1B4332" : "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                                  {enq.SalesExecutive?.name?.charAt(0) || enq.assignedTo?.charAt(0) || "!"}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: enq.SalesExecutive ? "#4b5563" : "#b91c1c", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>
                                  {enq.SalesExecutive?.name || enq.assignedTo || "Needs Assignment"}
                                </span>
                              </div>`;

fs.writeFileSync(path, content.replace(oldUnassigned, newUnassigned));
console.log('Patched CRM.jsx');
