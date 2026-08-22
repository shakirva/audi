const fs = require('fs');
const files = [
  'src/pages/SalesReports.jsx',
  'src/pages/BookingReports.jsx',
  'src/pages/AccountsReports.jsx',
  'src/pages/HallReports.jsx',
  'src/pages/CustomerReports.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /<select([\s\S]*?)style=\{\{\s*padding:\s*"6px 12px"/g,
    '<select$1className="w-full sm:w-auto" style={{ padding: "6px 12px"'
  );
  fs.writeFileSync(file, content);
});
console.log('Fixed selects');
