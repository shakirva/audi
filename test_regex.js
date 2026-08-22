const str = '<select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8';
const regex = /<select([^>]+)style=\{\{ padding: "6px 12px"/g;
console.log(str.replace(regex, '<select$1className="w-full sm:w-auto" style={{ padding: "6px 12px"'));
