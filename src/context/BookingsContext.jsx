import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { bookingsAPI } from "../services/api";

const BookingsContext = createContext(null);

export function BookingsProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await bookingsAPI.getAll();
      setBookings(data.data || []);
      setError(null);
    } catch (err) {
      console.warn("API not available, using empty state:", err.message);
      setError(err.message);
      // Keep existing bookings if API fails (offline mode)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("hm_token");
    if (token) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [fetchBookings]);

  const addBooking = async (data) => {
    try {
      const { data: resData } = await bookingsAPI.create(data);
      setBookings(prev => [resData.data, ...prev]);
      return resData.data;
    } catch (err) {
      // Fallback: create locally if API unavailable
      const localBooking = {
        ...data,
        id: `BK${String(Date.now()).slice(-4)}`,
        status: data.status || "Enquiry",
        totalAmount: Number(data.totalAmount) || 0,
        advance: Number(data.advance) || 0,
        guests: Number(data.guests) || 0,
      };
      setBookings(prev => [localBooking, ...prev]);
      return localBooking;
    }
  };

  const updateBooking = async (id, data) => {
    try {
      const { data: resData } = await bookingsAPI.update(id, data);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...resData.data } : b));
    } catch {
      // Fallback: update locally
      setBookings(prev => prev.map(b => b.id === id
        ? { ...b, ...data, totalAmount: Number(data.totalAmount) || b.totalAmount, advance: Number(data.advance) || b.advance, guests: Number(data.guests) || b.guests }
        : b
      ));
    }
  };

  const deleteBooking = async (id) => {
    try {
      await bookingsAPI.remove(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch {
      setBookings(prev => prev.filter(b => b.id !== id));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await bookingsAPI.updateStatus(id, status);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  return (
    <BookingsContext.Provider value={{ bookings, loading, error, addBooking, updateBooking, deleteBooking, updateStatus, refetch: fetchBookings }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used inside BookingsProvider");
  return ctx;
}
