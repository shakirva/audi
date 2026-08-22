function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}
const month = 8;
const year = 2026;
const firstDay = getFirstDay(year, month);
const daysInMonth = getDaysInMonth(year, month);
const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i+1)];
console.log("firstDay:", firstDay);
console.log("cells length:", cells.length);
console.log("cells start:", cells.slice(0, 5));
