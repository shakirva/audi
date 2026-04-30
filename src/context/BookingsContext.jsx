import { createContext, useContext, useState } from "react";
import { bookings as initialBookings } from "../data/dummyData";

const BookingsContext = createContext(null);

export function BookingsProvider({ children }) {
  const [bookings, setBookings] = useState(initialBookings);

  const addBooking = (data) => {
    const newBooking = {
      ...data,
      id: `BK${String(Date.now()).slice(-4)}`,
      status: data.status || "Enquiry",
      totalAmount: Number(data.totalAmount) || 0,
      advance: Number(data.advance) || 0,
      guests: Number(data.guests) || 0,
    };
    setBookings(prev => [newBooking, ...prev]);
    return newBooking;
  };

  const updateBooking = (id, data) => {
    setBookings(prev => prev.map(b => b.id === id
      ? { ...b, ...data, totalAmount: Number(data.totalAmount) || b.totalAmount, advance: Number(data.advance) || b.advance, guests: Number(data.guests) || b.guests }
      : b
    ));
  };

  const deleteBooking = (id) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const updateStatus = (id, status) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  return (
    <BookingsContext.Provider value={{ bookings, addBooking, updateBooking, deleteBooking, updateStatus }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used inside BookingsProvider");
  return ctx;
}
