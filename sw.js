/**
 * SERVICE WORKER: OFF-LINE CAPABILITY
 * ============================================================================
 * Caches core assets to allow the app to load without an internet connection.
 * Essential for the "Local PWA" experience.
 */

const CACHE_NAME = 'inaiya-offline-v3-local';
const ASSETS_TO_CACHE = [
  './index.html',
  './styles.css',
  './main.js',
  './auth.js',
  './data.js',
  './render.js',
  './utils.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js',
  'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        .catch(() => {});
      return cachedResponse || fetchPromise;
    })
  );
});
