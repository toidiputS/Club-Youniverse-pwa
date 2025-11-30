/**
 * Service Worker Registration
 * Registers the PWA service worker and handles updates
 */

export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            console.log('✅ Service Worker registered successfully:', registration.scope);

            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 New content available! Refresh to update.');
                            // You can show a UI prompt here to ask users to refresh
                            if (confirm('New version available! Refresh to update?')) {
                                window.location.reload();
                            }
                        }
                    });
                }
            });

            return registration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    } else {
        console.warn('⚠️ Service Workers not supported in this browser');
    }
};

/**
 * Request notification permission (for future push notifications)
 */
export const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission;
    }
    return Notification.permission;
};
