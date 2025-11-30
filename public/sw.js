/**
 * Minimal Service Worker for Club Youniverse PWA
 * Only caches manifest and icons - everything else goes to network
 */

const CACHE_NAME = 'club-youniverse-static-v1';

// Only cache true static assets that never change
const STATIC_ASSETS = [
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

// Install - cache only manifest and icons
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.error('[SW] Cache failed:', error);
                // Don't fail installation if caching fails
            })
    );
    self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch - only intercept requests for cached static assets
// Everything else (HTML, JS, CSS, audio, API) goes directly to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Only try to serve from cache if it's one of our static assets
    if (STATIC_ASSETS.includes(url.pathname)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request);
            })
        );
    }
    // For everything else, let it go directly to network
    // This includes: HTML, JS, CSS, audio, video, API calls
});
