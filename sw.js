// Service Worker - 实现离线缓存
const CACHE_NAME = 'gongkao-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './css/style.css',
  './css/tabbar.css',
  './css/today.css',
  './css/calendar.css',
  './css/practice.css',
  './css/notebook.css',
  './css/stage.css',
  './css/weight.css',
  './css/settings.css',
  './css/modal.css',
  './js/store.js',
  './js/utils.js',
  './js/modal.js',
  './js/today.js',
  './js/calendar.js',
  './js/practice.js',
  './js/notebook.js',
  './js/stage.js',
  './js/weight.js',
  './js/settings.js',
  './js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // 只缓存同源GET请求
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return resp;
      }).catch(() => cached);
    })
  );
});
