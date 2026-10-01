// service worker بسيط لـ Robaty — كافي باش يخدم شرط "قابلة للتثبيت"
// + كاش بسيط لبعض الملفات الأساسية (offline بسيط)
//
// ملاحظة: network-first (ماشي cache-first) باش أي تعديل نديروه فالملفات
// يبان مباشرة فالزيارة الجاية، بلا ما يبقى محجوب بنسخة قديمة مخزنة

const CACHE_NAME = 'robaty-cache-v3'; // بدلنا الرقم باش يمسح الكاش القديم أوتوماتيكيا

const CORE_FILES = [
  './index.html',
  './moments.html',
  './profile.html',
  './app.js',
  './i18n.js',
  './story.js',
  './comments.js',
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
    fetch(event.request)
      .then(function (networkResponse) {
        // خدام؟ نخزنو نسخة جديدة فالكاش (للاستعمال وقت offline)، ونرجعو النسخة الطرية
        var copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return networkResponse;
      })
      .catch(function () {
        // ماكاينش أنترنت؟ نرجعو للنسخة المخزنة (offline fallback)
        return caches.match(event.request);
      })
  );
});
