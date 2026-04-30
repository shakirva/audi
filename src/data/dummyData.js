// AUDITORIUM INFO
export const auditoriumInfo = {
  name: "Sreelakshmi Convention Centre",
  location: "Taliparamba, Kannur, Kerala",
  owner: "Rajan P.K.",
  phone: "+91 94470 12345",
  gstin: "32AABCS1234C1ZV",
  halls: [
    { id: 1, name: "Main Hall", capacity: 500, acType: "Central AC", pricePerSession: 15000 },
    { id: 2, name: "Mini Hall", capacity: 150, acType: "Split AC", pricePerSession: 6000 },
    { id: 3, name: "Open Stage", capacity: 300, acType: "Non AC", pricePerSession: 8000 },
  ],
};

// BOOKINGS
export const bookings = [
  { id: "BK001", customerName: "Arun & Divya", phone: "9447012345", eventType: "Wedding", hall: "Main Hall", date: "2026-05-10", session: "Full Day", guests: 450, advance: 10000, totalAmount: 35000, status: "Confirmed", notes: "Sadya for 450 guests, stage decoration needed" },
  { id: "BK002", customerName: "Sreekumar Family", phone: "9447056789", eventType: "Reception", hall: "Main Hall", date: "2026-05-12", session: "Evening", guests: 300, advance: 5000, totalAmount: 20000, status: "Confirmed", notes: "Evening reception, DJ required" },
  { id: "BK003", customerName: "Priya & Vishnu", phone: "9895012345", eventType: "Engagement", hall: "Mini Hall", date: "2026-05-15", session: "Morning", guests: 100, advance: 3000, totalAmount: 10000, status: "Confirmed", notes: "" },
  { id: "BK004", customerName: "St. Mary's Church", phone: "9447098765", eventType: "Baptism", hall: "Mini Hall", date: "2026-05-18", session: "Morning", guests: 80, advance: 2000, totalAmount: 8000, status: "Pending Payment", notes: "Church event, no catering needed" },
  { id: "BK005", customerName: "Anitha Nair", phone: "9946012345", eventType: "Birthday", hall: "Mini Hall", date: "2026-05-20", session: "Evening", guests: 120, advance: 0, totalAmount: 9000, status: "Enquiry", notes: "60th birthday celebration" },
  { id: "BK006", customerName: "Moosa & Fathima", phone: "9747012345", eventType: "Wedding", hall: "Main Hall", date: "2026-05-22", session: "Full Day", guests: 500, advance: 15000, totalAmount: 40000, status: "Confirmed", notes: "Full sadya, need generator backup" },
  { id: "BK007", customerName: "Rajesh Kumar", phone: "9847023456", eventType: "Corporate Event", hall: "Mini Hall", date: "2026-05-25", session: "Full Day", guests: 100, advance: 5000, totalAmount: 15000, status: "Confirmed", notes: "Company annual meeting" },
  { id: "BK008", customerName: "Lakshmi & Suresh", phone: "9447034567", eventType: "Seemantham", hall: "Mini Hall", date: "2026-05-28", session: "Morning", guests: 60, advance: 2000, totalAmount: 7000, status: "Confirmed", notes: "" },
  { id: "BK009", customerName: "Thomas & Mary", phone: "9447045678", eventType: "Wedding", hall: "Main Hall", date: "2026-06-02", session: "Full Day", guests: 400, advance: 10000, totalAmount: 38000, status: "Confirmed", notes: "Christian wedding, no muhurtham needed" },
  { id: "BK010", customerName: "Vinod Family", phone: "9946023456", eventType: "Reception", hall: "Open Stage", date: "2026-06-05", session: "Evening", guests: 250, advance: 4000, totalAmount: 18000, status: "Pending Payment", notes: "Outdoor reception, need extra lights" },
  { id: "BK011", customerName: "Santhosh & Meera", phone: "9747034567", eventType: "Wedding", hall: "Main Hall", date: "2026-06-08", session: "Full Day", guests: 480, advance: 12000, totalAmount: 42000, status: "Confirmed", notes: "" },
  { id: "BK012", customerName: "PTA Taliparamba School", phone: "9447067890", eventType: "Annual Day", hall: "Main Hall", date: "2026-06-15", session: "Full Day", guests: 350, advance: 8000, totalAmount: 25000, status: "Confirmed", notes: "School program, need projector screen" },
  { id: "BK013", customerName: "Rema & Biju", phone: "9895034567", eventType: "Engagement", hall: "Mini Hall", date: "2026-04-22", session: "Morning", guests: 90, advance: 3000, totalAmount: 9000, status: "Completed", notes: "" },
  { id: "BK014", customerName: "Abdul & Safiya", phone: "9447078901", eventType: "Wedding", hall: "Main Hall", date: "2026-04-28", session: "Full Day", guests: 460, advance: 15000, totalAmount: 39000, status: "Completed", notes: "" },
  { id: "BK015", customerName: "Gopalan Nair", phone: "9946045678", eventType: "Birthday", hall: "Mini Hall", date: "2026-04-25", session: "Evening", guests: 70, advance: 2000, totalAmount: 7000, status: "Completed", notes: "75th birthday" },
  { id: "BK016", customerName: "Deepa & Anil", phone: "9747056789", eventType: "Wedding", hall: "Main Hall", date: "2026-06-20", session: "Full Day", guests: 500, advance: 0, totalAmount: 40000, status: "Enquiry", notes: "Referred by Vinod family" },
  { id: "BK017", customerName: "CSI Church Kannur", phone: "9447089012", eventType: "Conference", hall: "Main Hall", date: "2026-06-22", session: "Full Day", guests: 200, advance: 5000, totalAmount: 20000, status: "Confirmed", notes: "" },
  { id: "BK018", customerName: "Nisha & Praveen", phone: "9895056789", eventType: "Reception", hall: "Main Hall", date: "2026-06-25", session: "Evening", guests: 350, advance: 8000, totalAmount: 22000, status: "Confirmed", notes: "" },
  { id: "BK019", customerName: "Manoj Family", phone: "9946067890", eventType: "Seemantham", hall: "Mini Hall", date: "2026-04-30", session: "Morning", guests: 50, advance: 2000, totalAmount: 6000, status: "Completed", notes: "" },
  { id: "BK020", customerName: "Faisal & Reshma", phone: "9747067890", eventType: "Wedding", hall: "Main Hall", date: "2026-07-05", session: "Full Day", guests: 420, advance: 10000, totalAmount: 38000, status: "Confirmed", notes: "Need Halal catering vendor" },
];

// MONTHLY REVENUE DATA
export const monthlyRevenue = [
  { month: "Oct", revenue: 85000, bookings: 6 },
  { month: "Nov", revenue: 120000, bookings: 9 },
  { month: "Dec", revenue: 95000, bookings: 7 },
  { month: "Jan", revenue: 145000, bookings: 11 },
  { month: "Feb", revenue: 130000, bookings: 10 },
  { month: "Mar", revenue: 160000, bookings: 12 },
  { month: "Apr", revenue: 110000, bookings: 8 },
  { month: "May", revenue: 175000, bookings: 13 },
];

// EVENT TYPE DISTRIBUTION
export const eventTypes = [
  { name: "Wedding", value: 45, color: "#1B4332" },
  { name: "Reception", value: 20, color: "#D4A017" },
  { name: "Engagement", value: 12, color: "#2D6A4F" },
  { name: "Birthday", value: 8, color: "#74C69D" },
  { name: "Corporate", value: 7, color: "#B7E4C7" },
  { name: "Others", value: 8, color: "#95D5B2" },
];

// PENDING PAYMENTS
export const pendingPayments = bookings
  .filter((b) => b.status === "Confirmed" || b.status === "Pending Payment")
  .map((b) => ({
    ...b,
    balanceDue: b.totalAmount - b.advancePaid,
    daysUntilEvent: Math.floor(
      (new Date(b.date) - new Date("2026-05-10")) / (1000 * 60 * 60 * 24)
    ),
  }));

// PAYMENT HISTORY (completed bookings)
export const paymentHistory = [
  { id: "PAY001", bookingId: "BK013", customer: "Rema & Biju", date: "2026-04-22", amount: 9000, mode: "UPI", reference: "UPI-20250420-001" },
  { id: "PAY002", bookingId: "BK014", customer: "Abdul & Safiya", date: "2026-04-28", amount: 39000, mode: "Cash", reference: "CASH-20250415-001" },
  { id: "PAY003", bookingId: "BK015", customer: "Gopalan Nair", date: "2026-04-25", amount: 7000, mode: "Cheque", reference: "CHQ-20250410-001" },
  { id: "PAY004", bookingId: "BK019", customer: "Manoj Family", date: "2026-04-30", amount: 6000, mode: "UPI", reference: "UPI-20250405-001" },
];

// NOTIFICATIONS
export const notifications = [
  { id: 1, type: "warning", message: "Balance payment due: Arun & Divya — ₹25,000", time: "2h ago" },
  { id: 2, type: "info", message: "New enquiry from Deepa & Anil", time: "5h ago" },
  { id: 3, type: "reminder", message: "Event tomorrow: Sreekumar Family Reception", time: "1d ago" },
];

// HALL COLORS
export const hallColors = {
  "Main Hall": { bg: "bg-green-100", dot: "bg-green-700", text: "text-green-800", hex: "#1B4332" },
  "Mini Hall": { bg: "bg-yellow-100", dot: "bg-yellow-600", text: "text-yellow-800", hex: "#D4A017" },
  "Open Stage": { bg: "bg-blue-100", dot: "bg-blue-600", text: "text-blue-800", hex: "#2563EB" },
};

// WEEK BOOKING DISTRIBUTION (for reports)
export const weekdayBookings = [
  { day: "Mon", count: 8 },
  { day: "Tue", count: 5 },
  { day: "Wed", count: 7 },
  { day: "Thu", count: 12 },
  { day: "Fri", count: 18 },
  { day: "Sat", count: 32 },
  { day: "Sun", count: 28 },
];

// HALL UTILIZATION
export const hallUtilization = [
  { hall: "Main Hall", pct: 78 },
  { hall: "Mini Hall", pct: 65 },
  { hall: "Open Stage", pct: 45 },
];
