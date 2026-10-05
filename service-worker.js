const CACHE_NAME = 'tradevault-v5';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/ui.js',
  './js/storage.js',
  './js/trades.js',
  './js/analytics.js',
  './js/calendar.js',
  './js/playbook.js',
  './js/reviews.js',
  './js/risk.js',
  './js/backtesting.js',
  './js/settings.js',
  './js/app.js',
  './manifest.json',
  './icons/192.svg',
  './icons/512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
