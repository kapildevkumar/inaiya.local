/**
 * SERVICE WORKER: OFF-LINE CAPABILITY (v3.1 Production)
 */

const CACHE_NAME = 'inaiya-offline-v3-prod';
const ASSETS_TO_CACHE = [
  new URL('./index.html', import.meta.url).href,
  new URL('./styles.css', import.meta.url).href,
  new URL('./main.js', import.meta.url).href,
  new URL('./auth.js', import.meta.url).href,
  new URL('./data.js', import.meta.url).href,
  new URL('./render.js', import.meta.url).href,
  new URL('./utils.js', import.meta.url).href,
  new URL('./manifest.json', import.meta.url).href,
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
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          // Clone and cache
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        .catch(() => {
           // If network fails and no cache, we might want a fallback page
           // but for API/Assets just return undefined to trigger offline handling in app
        });

      return cachedResponse || fetchPromise;
    })
  );
});