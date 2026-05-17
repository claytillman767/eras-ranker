// Service worker for The Eras Ranker PWA.
// Strategy:
//   - Navigation requests (HTML pages): network first, fall back to cache.
//     This ensures a fresh index.html after every Vercel deploy without
//     requiring a hard refresh.
//   - Static assets (same-origin JS/CSS/images): cache first for speed.
//   - Cross-origin requests (Firebase, Google APIs, etc.):
//     not intercepted at all — always go straight to the network.

const CACHE_NAME = 'eras-ranker-v4';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Don't intercept cross-origin requests (Firebase auth, Google APIs,
  // Firestore, etc.). Let them go straight to the network.
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Navigation requests: always try the network first so new deployments
  // are picked up immediately. Only fall back to cached index.html if
  // the user is fully offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache first, fall back to network.
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
