// service worker بسيط لـ Robaty — كافي باش يخدم شرط "قابلة للتثبيت"
// + كاش بسيط لبعض الملفات الأساسية (offline بسيط)

const CACHE_NAME = 'robaty-cache-v1';

const CORE_FILES = [
  './index.html',
  './moments.html',
  './style.css',
  './moments.css',
  './manifest.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_FILES).catch(function () {
        // إلا فشل شي ملف (اسم مختلف)، ما نوقفوش التسجيل كامل
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
