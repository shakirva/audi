import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import "./index.css";
import App from "./App";

// Calculate dynamic basename for tenant routing
let basename = "/";
const pathParts = window.location.pathname.split("/").filter(Boolean);
const reservedWords = ["book"]; // Global routes that don't need tenant slug
if (pathParts.length > 0 && !reservedWords.includes(pathParts[0])) {
  basename = `/${pathParts[0]}`;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);

// Unregister Service Workers in Dev to prevent caching issues
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log("Service Worker unregistered to clear cache.");
    }
  });
}
