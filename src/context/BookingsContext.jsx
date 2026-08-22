import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { bookingsAPI } from "../services/api";
import { useRole } from "./RoleContext";

const BookingsContext = createContext(null);

export function BookingsProvider({ children }) {
  const { user } = useRole();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await bookingsAPI.getAll({ limit: 1000 });
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
    if (user) {
      fetchBookings();
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [user, fetchBookings]);

  const addBooking = async (data) => {
    try {
      const { data: resData } = await bookingsAPI.create(data);
      setBookings(prev => [resData.data, ...prev]);
      return resData.data;
    } catch (err) {
      console.error("Booking API Error:", err);
      throw err;
    }
  };

  const updateBooking = async (id, data) => {
    try {
      const { data: resData } = await bookingsAPI.update(id, data);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...resData.data } : b));
    } catch (err) {
      console.error("Update Booking API Error:", err);
      throw err;
    }
  };

  const deleteBooking = async (id) => {
    try {
      await bookingsAPI.remove(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error("Delete Booking API Error:", err);
      throw err;
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await bookingsAPI.updateStatus(id, status);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      console.error("Update Status API Error:", err);
      throw err;
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
