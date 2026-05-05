const CACHE_NAME = 'naviigo-v2';
const STATIC_ASSETS = [
    '/',
    '/itinerary',
    '/itinerary/packing',
    '/itinerary/expenses',
    '/itinerary/tracking',
    '/itinerary/history',
    '/itinerary/ongoing',
];

// Install — cache static pages
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
    );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and API routes (let them fail gracefully)
    if (request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/')) return;

    // Cache-first for tile images (Leaflet/CartoDB)
    if (url.hostname.includes('carto') || url.hostname.includes('tile')) {
        event.respondWith(
            caches.match(request).then(cached => cached ?? fetch(request).then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME + '-tiles').then(c => c.put(request, clone));
                return res;
            }).catch(() => new Response('', { status: 404 })))
        );
        return;
    }

    // Network first for everything else
    event.respondWith(
        fetch(request)
            .then(res => {
                if (res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(request, clone));
                }
                return res;
            })
            .catch(() => caches.match(request).then(cached => cached ?? new Response('Offline', { status: 503 })))
    );
});
