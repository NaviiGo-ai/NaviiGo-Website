const CACHE_NAME = 'naviigo-v7-offline';
const TILE_CACHE = 'naviigo-tiles-v3';

// Critical static routes to pre-cache (public pages only)
const PRECACHE_URLS = [
    '/',
    '/explore',
    '/bookings',
    '/offline', // Fallback page
];

// Auth-gated routes — NEVER cache these (they contain user-specific data)
const AUTH_GATED_ROUTES = [
    '/passport',
    '/saved',
    '/itinerary/ongoing',
    '/itinerary/upcoming',
    '/itinerary/history',
    '/itinerary/detail',
    '/itinerary/tracking',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME && k !== TILE_CACHE).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip API routes so they fail gracefully if offline
    if (url.pathname.startsWith('/api/')) return;

    // Skip the deals page — third-party widgets must always be fetched fresh
    if (url.pathname.startsWith('/deals')) return;

    // Skip ALL cross-origin requests EXCEPT map tiles
    // This prevents the SW from intercepting Firebase auth, Google OAuth,
    // Sentry, analytics, and other third-party API calls
    if (url.origin !== self.location.origin &&
        !url.hostname.includes('carto') &&
        !url.hostname.includes('tile')) {
        return;
    }

    // Skip auth-gated routes — these contain user-specific data and must
    // never be served from cache (stale user state after sign-out/sign-in)
    if (AUTH_GATED_ROUTES.some(route => url.pathname.startsWith(route))) {
        return; // Let the browser handle these normally (network-only)
    }

    // 1. Cache First for Map Tiles
    if (url.hostname.includes('carto') || url.hostname.includes('tile')) {
        event.respondWith(
            caches.match(request).then(cached => cached ?? fetch(request).then(res => {
                const clone = res.clone();
                caches.open(TILE_CACHE).then(c => c.put(request, clone));
                return res;
            }).catch(() => new Response('', { status: 404 })))
        );
        return;
    }

    // 2. Cache First for Next.js Static Assets (JS, CSS, Images in /_next/static)
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/destinations/')) {
        event.respondWith(
            caches.match(request).then(cached => cached ?? fetch(request).then(res => {
                if (res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(request, clone));
                }
                return res;
            }).catch(() => new Response('', { status: 404 })))
        );
        return;
    }

    // 3. Network First for everything else (HTML pages, dynamic data)
    event.respondWith(
        fetch(request)
            .then(res => {
                if (res.ok && url.protocol.startsWith('http') && request.destination === 'document') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(request, clone));
                }
                return res;
            })
            .catch(() => caches.match(request).then(cached => {
                if (cached) return cached;
                // If the user navigates to a completely uncached page while offline, return a generic offline page if it's a document
                if (request.destination === 'document') {
                    return caches.match('/offline') || new Response('<html><body><h1>You are offline</h1></body></html>', { headers: { 'Content-Type': 'text/html' }});
                }
                return new Response('Offline', { status: 503 });
            }))
    );
});
