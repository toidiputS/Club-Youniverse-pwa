/**
 * Service Worker Registration
 * Registers the PWA service worker and handles updates
 */

import { registerSW } from "virtual:pwa-register";

export const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm("New version available! Refresh to update?")) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log("Ready to work offline!");
      },
    });
  } else {
    console.warn("⚠️ Service Workers not supported in this browser");
  }
};

/**
 * Request notification permission (for future push notifications)
 */
export const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);
    return permission;
  }
  return Notification.permission;
};
