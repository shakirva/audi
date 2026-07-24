import React from 'react';
import { renderToString } from 'react-dom/server';
import Reports from './src/pages/Reports.jsx';
import AccountsReports from './src/pages/AccountsReports.jsx';
import HallReports from './src/pages/HallReports.jsx';
import { BookingsProvider } from './src/context/BookingsContext.jsx';
import { ToastProvider } from './src/components/Toast.jsx';
import { BrowserRouter } from 'react-router-dom';

try {
  console.log("Testing AccountsReports...");
  renderToString(
    <BrowserRouter><ToastProvider><BookingsProvider><AccountsReports /></BookingsProvider></ToastProvider></BrowserRouter>
  );
  console.log("AccountsReports rendered OK");
} catch (e) {
  console.error("AccountsReports ERROR:", e);
}

try {
  console.log("Testing Reports...");
  renderToString(
    <BrowserRouter><ToastProvider><BookingsProvider><Reports /></BookingsProvider></ToastProvider></BrowserRouter>
  );
  console.log("Reports rendered OK");
} catch (e) {
  console.error("Reports ERROR:", e);
}
