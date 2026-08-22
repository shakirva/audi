const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}
console.log(getFirstDay(2026, 8));
