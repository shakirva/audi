import React from 'react';
import { renderToString } from 'react-dom/server';
import EditBookingModal from './src/components/EditBookingModal.jsx';

// Mock dependencies
jest.mock('./src/services/api.js', () => ({
  bookingsAPI: { update: jest.fn() },
  usersAPI: { getAll: jest.fn().mockResolvedValue({ data: [] }) },
  mastersAPI: { getByType: jest.fn().mockResolvedValue({ data: [] }) },
  settingsAPI: { get: jest.fn().mockResolvedValue({ data: {} }) }
}));

const mockBooking = {
  id: "BK001",
  customerName: "John Doe",
  eventType: "Wedding",
  hall: "Main Hall",
  session: "Morning",
  date: "2026-08-10T00:00:00.000Z",
  totalAmount: 10000,
  advance: 2000,
  facilities: []
};

try {
  const html = renderToString(<EditBookingModal open={true} booking={mockBooking} onClose={() => {}} onSaved={() => {}} />);
  console.log("RENDER SUCCESS!");
} catch (e) {
  console.error("RENDER CRASHED:", e);
}
