import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import EditBookingModal from './src/components/EditBookingModal';
import { ToastProvider } from './src/components/Toast';

// Mock Axios globally so that api.js imports use it
import axios from 'axios';
jest = { fn: () => {} }; // polyfill jest if we use it, but we can just mock axios directly

// But actually, EditBookingModal imports `../services/api`
// I will mock fetch/XHR in the browser? No, I'll just change the state directly or pass props?
// I can't pass settings as props, it's internal state.
