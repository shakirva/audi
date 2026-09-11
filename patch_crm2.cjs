const fs = require('fs');
const path = './src/pages/CRM.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldDesktopUnassigned = `<td className="hm-desktop-only" style={{ padding: "12px 16px", color: "#666" }}>
                      {enq.SalesExecutive?.name || "—"}
                    </td>`;

const newDesktopUnassigned = `<td className="hm-desktop-only" style={{ padding: "12px 16px", color: enq.SalesExecutive ? "#666" : "#ef4444", fontWeight: enq.SalesExecutive ? 400 : 700 }}>
                      {enq.SalesExecutive?.name || "⚠️ Unassigned"}
                    </td>`;

fs.writeFileSync(path, content.replace(oldDesktopUnassigned, newDesktopUnassigned));
console.log('Patched CRM.jsx desktop');
