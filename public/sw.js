const CACHE_NAME = 'sungura-master-v3';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icons/icon-48x48.png',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
];

// Enhanced cache helper with quota management
function shouldCache(request) {
    if (request.method !== 'GET') return false;
    if (!request.url.startsWith('http')) return false;

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Skip API calls, development assets, and dynamic content
    const skipPatterns = [
        '/api/',
        '/_next/static/chunks/',
        'sockjs-node',
        'hot-update',
        '.map',
        '/screenshots/' // Skip screenshots to save space
    ];

    return !skipPatterns.some(pattern => pathname.includes(pattern));
}

// Improved cache management with quota awareness
async function safeCachePut(cacheName, request, response) {
    try {
        // Check if we have enough quota
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const usedPercentage = estimate.usage / estimate.quota;

            // If we're using more than 80% of quota, clean up old caches
            if (usedPercentage > 0.8) {
                await cleanupOldCaches();
            }
        }

        const cache = await caches.open(cacheName);

        // Clone response to avoid consuming it
        const responseClone = response.clone();
        await cache.put(request, responseClone);

        return true;
    } catch (error) {
        console.warn('Cache put failed:', error);
        return false;
    }
}

// Enhanced cleanup function
async function cleanupOldCaches() {
    try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name));

        await Promise.all(deletePromises);
    } catch (error) {
        console.warn('Cache cleanup failed:', error);
    }
}

// Safe cache match with fallback
async function safeCacheMatch(request) {
    try {
        return await caches.match(request);
    } catch (error) {
        console.warn('Cache match failed:', error);
        return null;
    }
}

// Install event with progressive enhancement
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            try {
                console.log('Installing Sungura Master...');

                const cache = await caches.open(CACHE_NAME);

                // Cache essential files first
                const essentialFiles = [
                    '/',
                    '/offline.html',
                    '/manifest.json',
                    '/icons/icon-192x192.png',
                    '/icons/icon-512x512.png'
                ];

                await cache.addAll(essentialFiles);

                // Cache remaining files progressively
                const remainingFiles = urlsToCache.filter(url => !essentialFiles.includes(url));

                for (const url of remainingFiles) {
                    try {
                        await cache.add(url);
                    } catch (error) {
                        console.warn(`Failed to cache ${url}:`, error);
                    }
                }

                console.log('Sungura Master installed successfully!');
                await self.skipWaiting();

            } catch (error) {
                console.error('Installation failed:', error);
                // Still proceed with installation even if caching fails
                await self.skipWaiting();
            }
        })()
    );
});

// Activate event with better client management
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            try {
                console.log('Activating Sungura Master...');

                // Clean up old caches
                await cleanupOldCaches();

                // Take control of all clients
                await self.clients.claim();

                console.log('Sungura Master activated successfully!');

            } catch (error) {
                console.error('Activation failed:', error);
                // Still claim clients even if cleanup fails
                await self.clients.claim();
            }
        })()
    );
});

// Enhanced fetch event with better error handling
self.addEventListener('fetch', (event) => {
    if (!shouldCache(event.request)) {
        return;
    }

    if (event.request.destination === 'document') {
        event.respondWith(
            (async () => {
                try {
                    // Network-first strategy for documents
                    const networkResponse = await fetch(event.request);

                    if (networkResponse.status === 200) {
                        safeCachePut(CACHE_NAME, event.request, networkResponse.clone());
                    }

                    return networkResponse;
                } catch (networkError) {
                    // Fallback to cache
                    const cachedResponse = await safeCacheMatch(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Return offline page
                    const offlineResponse = await safeCacheMatch(OFFLINE_URL);
                    if (offlineResponse) {
                        return offlineResponse;
                    }

                    // Final fallback
                    return new Response(
                        `<!DOCTYPE html>
                        <html>
                        <head>
                            <title>Sungura Master - Offline</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                                       text-align: center; padding: 50px 20px; color: #333; }
                                .logo { font-size: 2rem; color: #22c55e; margin-bottom: 1rem; }
                                .message { font-size: 1.2rem; margin-bottom: 2rem; }
                                .hint { color: #666; font-size: 0.9rem; }
                            </style>
                        </head>
                        <body>
                            <div class="logo">🐰 Sungura Master</div>
                            <div class="message">You're currently offline</div>
                            <div class="hint">Please check your internet connection and try again.</div>
                        </body>
                        </html>`,
                        {
                            status: 200,
                            headers: { 'Content-Type': 'text/html' }
                        }
                    );
                }
            })()
        );
    } else {
        // Cache-first strategy for assets
        event.respondWith(
            (async () => {
                const cachedResponse = await safeCacheMatch(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                try {
                    const networkResponse = await fetch(event.request);

                    if (networkResponse && networkResponse.status === 200) {
                        safeCachePut(CACHE_NAME, event.request, networkResponse.clone());
                    }

                    return networkResponse;
                } catch (networkError) {
                    // Fallback for different asset types
                    if (event.request.destination === 'image') {
                        // Return placeholder image
                        return new Response(
                            new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 255, 255, 255, 0, 0, 0, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]),
                            { headers: { 'Content-Type': 'image/gif' } }
                        );
                    }

                    return new Response('', { status: 204 });
                }
            })()
        );
    }
});

// Enhanced push notification handling
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body || 'New update from Sungura Master',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.id || 1,
                url: data.url || '/'
            },
            actions: [
                {
                    action: 'view',
                    title: 'View',
                    icon: '/icons/icon-48x48.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification('Sungura Master', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        const url = event.notification.data.url || '/';
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Handle background sync tasks
            console.log('Background sync triggered')
        );
    }
});