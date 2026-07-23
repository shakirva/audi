// Utility to generate realistic mock data for the Finance Demo
export const generateMockBookings = (count = 50) => {
  const eventTypes = ["Wedding Reception", "Corporate Conference", "Birthday Party", "Anniversary Gala", "Product Launch"];
  const statuses = ["Confirmed", "Tentative", "Completed", "Cancelled"];
  const customers = [
    "Rahul Sharma", "Priya Patel", "Amit Singh", "Neha Gupta", "Vikram Malhotra", 
    "Sarah Connor", "John Smith", "Acme Corp", "Tech Solutions Ltd", "Starlight Events"
  ];
  
  const bookings = [];
  let baseDate = new Date("2026-07-01T10:00:00Z");
  
  for (let i = 1; i <= count; i++) {
    const totalAmount = Math.floor(Math.random() * 200000) + 50000;
    const collected = Math.floor(Math.random() * totalAmount);
    
    bookings.push({
      id: `BKG-2026-${1000 + i}`,
      date: new Date(baseDate.getTime() + (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      customerName: customers[Math.floor(Math.random() * customers.length)],
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      totalAmount,
      totalCollected: collected,
      outstanding: totalAmount - collected,
      linkedExpenses: Math.floor(totalAmount * 0.15),
      netProfit: collected - Math.floor(totalAmount * 0.15),
    });
  }
  
  return bookings;
};

export const MOCK_DEMO_BOOKINGS = generateMockBookings(50);
