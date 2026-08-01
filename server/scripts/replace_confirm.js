const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/Attendance.jsx',
  'src/pages/Vendors.jsx',
  'src/pages/LeaveRequests.jsx',
  'src/pages/Settings.jsx',
  'src/pages/Finance/AdvancedAccounting.jsx',
  'src/pages/Finance/PurchasesAndExpenses.jsx',
  'src/pages/Agreements.jsx',
  'src/pages/Masters.jsx',
  'src/pages/Staff.jsx',
  'src/pages/Jobs.jsx'
];

files.forEach(file => {
  const filePath = path.join('/Users/muhammedshakirva/venueza-erp/hallmaster', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('window.confirm')) return;

  // Add import if not exists
  if (!content.includes('ConfirmModal')) {
    const importRegex = /import React[^;]*;/;
    content = content.replace(importRegex, match => {
      const depth = file.includes('Finance/') ? '../../' : '../';
      return match + `\nimport ConfirmModal from "${depth}components/ConfirmModal";`;
    });
  }

  // Add state if not exists
  if (!content.includes('confirmConfig')) {
    const stateRegex = /(const \[.*?, set.*?\] = useState.*?;)/;
    content = content.replace(stateRegex, match => {
      return match + `\n  const [confirmConfig, setConfirmConfig] = useState({ open: false, message: "", onConfirm: () => {} });`;
    });
  }

  // Add ConfirmModal to the end of the return statement
  if (!content.includes('<ConfirmModal')) {
    const returnRegex = /(<\/[^>]+>)\s*;\s*\}\s*$/;
    content = content.replace(returnRegex, match => {
      return `  <ConfirmModal 
        open={confirmConfig.open} 
        message={confirmConfig.message} 
        onConfirm={confirmConfig.onConfirm} 
        onClose={() => setConfirmConfig({ ...confirmConfig, open: false })} 
      />\n    ` + match;
    });
  }

  // Replace window.confirm with setConfirmConfig
  // We need to match pattern like:
  // if (window.confirm("Message")) { 
  //   doSomething(); 
  // }
  // OR if (!window.confirm("Message")) return;
  
  // 1. Pattern: if (!window.confirm("...")) return;
  content = content.replace(/if\s*\(\s*!window\.confirm\(\s*(["'`].*?["'`])\s*\)\s*\)\s*return\s*;/g, (match, msg) => {
    // This is tricky, we can't just replace return. We have to wrap the rest of the function!
    // Instead of doing this via regex, we'll mark it for manual review.
    return `// TODO: Replace manual return confirm
    ${match}`;
  });

  // 2. Pattern: if (window.confirm("...")) { ... }
  // Since regex can't balance braces easily, we will do a simpler approach:
  // We will just do manual replace for these 10 files using multi_replace_file_content.
  console.log(`Needs manual replacement: ${file}`);
});
