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
  
  // 1. Fix the top header button wrapper
  content = content.replace(
    /<div style={{ display: "flex", gap: 10 }}>\s*<button/g,
    '<div className="w-full sm:w-auto" style={{ display: "flex", gap: 10 }}>\n          <button className="w-full sm:w-auto justify-center"'
  );
  // Also handle cases where there's no wrapper or slightly different formatting (if any)

  // 2. Fix the filter bar container
  content = content.replace(
    /className="print-hide" style={{ display: "flex", flexWrap: "wrap",/g,
    'className="print-hide flex flex-col sm:flex-row" style={{ flexWrap: "wrap",'
  );

  // 3. Fix the "Filters" label
  content = content.replace(
    /<div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1B4332", fontWeight: 700, fontSize: 13, paddingRight: 10, borderRight: "1px solid #e5e7eb" }}>\s*<Filter size=\{16\} \/> Filters\s*<\/div>/g,
    `<div className="hidden sm:flex" style={{ alignItems: "center", gap: 8, color: "#1B4332", fontWeight: 700, fontSize: 13, paddingRight: 10, borderRight: "1px solid #e5e7eb" }}>
          <Filter size={16} /> Filters
        </div>
        <div className="flex sm:hidden items-center gap-2 mb-2 text-[#1B4332] font-bold text-sm w-full border-b border-gray-100 pb-2">
          <Filter size={16} /> Filters
        </div>`
  );

  // 4. Add w-full sm:w-auto to all selects in the filter bar
  content = content.replace(
    /<select([^>]+)style={{ padding: "6px 12px"/g,
    '<select$1className="w-full sm:w-auto" style={{ padding: "6px 12px"'
  );

  fs.writeFileSync(file, content);
});
console.log('Fixed filters in all report pages.');
