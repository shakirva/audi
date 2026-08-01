import { useState, useEffect, useCallback, useRef } from "react";

/**
 * usePWA — Comprehensive PWA hook for Venueza
 * Handles: install prompt, update detection, online/offline status, SW version
 */
export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [swVersion, setSwVersion] = useState(null);
  const deferredPrompt = useRef(null);
  const waitingWorker = useRef(null);

  useEffect(() => {
    // ── Online/Offline detection ──
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // ── Install prompt capture ──
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // ── Detect if already installed ──
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      setIsInstalled(isStandalone);
    };
    checkInstalled();
    window.matchMedia("(display-mode: standalone)").addEventListener("change", checkInstalled);

    // ── App installed event ──
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt.current = null;
    };
    window.addEventListener("appinstalled", handleInstalled);

    // ── Service Worker update detection ──
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every 60 seconds
        setInterval(() => registration.update(), 60 * 1000);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available
                waitingWorker.current = newWorker;
                setHasUpdate(true);
              }
            });
          }
        });
      });

      // Listen for version info from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "VERSION") {
          setSwVersion(event.data.version);
        }
      });

      // Request version on load
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage("GET_VERSION");
        }
      });
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // ── Trigger native install prompt ──
  const installApp = useCallback(async () => {
    if (!deferredPrompt.current) return false;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setIsInstallable(false);
    return outcome === "accepted";
  }, []);

  // ── Apply waiting update ──
  const applyUpdate = useCallback(() => {
    if (waitingWorker.current) {
      waitingWorker.current.postMessage("SKIP_WAITING");
      setHasUpdate(false);
      // Reload after the new SW takes control
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      }, { once: true });
    }
  }, []);

  // ── Dismiss update ──
  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
  }, []);

  // ── Dismiss install ──
  const dismissInstall = useCallback(() => {
    setIsInstallable(false);
  }, []);

  // ── Clear all caches (for logout) ──
  const clearCaches = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage("CLEAR_CACHES");
      }
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  }, []);

  return {
    isOnline,
    isInstallable,
    isInstalled,
    hasUpdate,
    swVersion,
    installApp,
    applyUpdate,
    dismissUpdate,
    dismissInstall,
    clearCaches,
  };
}
