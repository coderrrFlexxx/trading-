const CACHE_NAME = 'tradevault-v13';
const ASSETS = [
  './', './index.html', './css/style.css',
  './js/ui.js', './js/storage.js', './js/trades.js', './js/analytics.js',
  './js/playbook.js', './js/reviews.js', './js/risk.js', './js/backtesting.js',
  './js/settings.js', './js/app.js',
  './manifest.json', './icons/192.svg', './icons/512.svg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isStatic = /\.(js|css|html)$/.test(url.pathname);

  if (isStatic) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
