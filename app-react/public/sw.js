const CACHE_NAME = 'mariage-react-v1';

const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/data/places.json',
  '/data/quiz.json',
  '/data/rooms.json',
  '/data/photo_slots.json',
  '/assets/plan-domaine-color.jpg',
  '/assets/plan-domaine.jpg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Ne pas intercepter les appels Google Apps Script (JSONP)
  if (request.url.includes('script.google.com')) return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      // Cache-first pour les assets, network-first pour le reste
      return cached || network;
    })
  );
});
