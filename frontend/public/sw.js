// Service Worker for Civic View PWA
// Caches static assets and API responses for offline functionality

const CACHE_NAME = 'civicview-v1';
const STATIC_CACHE = 'civicview-static-v1';
const API_CACHE = 'civicview-api-v1';
const TILES_CACHE = 'civicview-tiles-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/styles.css',
];

// Install event: Cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old caches
            return (
              name !== STATIC_CACHE &&
              name !== API_CACHE &&
              name !== TILES_CACHE &&
              name !== CACHE_NAME
            );
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  return self.clients.claim(); // Take control of all pages
});

// Fetch event: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests (reports and hotspots)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful GET requests
            if (request.method === 'GET' && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached response if network fails
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return a basic offline response
              return new Response(
                JSON.stringify({ error: 'Offline - no cached data available' }),
                {
                  headers: { 'Content-Type': 'application/json' },
                  status: 503,
                }
              );
            });
          });
      })
    );
    return;
  }

  // Handle Leaflet tile requests (OpenStreetMap tiles)
  if (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('unpkg.com')
  ) {
    event.respondWith(
      caches.open(TILES_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              // Cache tiles for offline use
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return a placeholder if tile fetch fails
              return new Response('', { status: 404 });
            });
        });
      })
    );
    return;
  }

  // Handle static assets (JS, CSS, images)
  if (
    request.method === 'GET' &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico'))
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            });
        });
      })
    );
    return;
  }

  // Default: Network first, fallback to cache
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});


