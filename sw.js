// service worker بسيط لـ Robaty — كافي باش يخدم شرط "قابلة للتثبيت"
// + كاش بسيط لبعض الملفات الأساسية (offline بسيط)
//
// ملاحظة: network-first (ماشي cache-first) باش أي تعديل نديروه فالملفات
// يبان مباشرة فالزيارة الجاية، بلا ما يبقى محجوب بنسخة قديمة مخزنة

const CACHE_NAME = 'robaty-cache-v16'; // بدلنا الرقم باش يمسح الكاش القديم أوتوماتيكيا

const CORE_FILES = [
  './index.html',
  './moments.html',
  './profile.html',
  './app.js',
  './i18n.js',
  './story.js',
  './comments.js',
  './firebase-config.js',
  './profile-stats.js',
  './moments-data.js',
  './moments-button-glow.js',
  './button-haptics.js',
  './story-glow-fx.js',
  './download-btn-fx.js',
  './profile.css',
  './style.css',
  './moments.css',
  './comments-ig.css',
  './manifest.json'
];

// صور الوضعيات (6 حالات = 8 صور): كنخزنوها مسبقا باش التبديل بينها يكون فوري
const AVATAR_STATES = [
  'warmth', 'joy', 'laugh', 'amused', 'playful', 'confidence'
];
var AVATAR_STATE_FILES = AVATAR_STATES.map(function (s) { return './' + s + '.png'; });
// متغيّرات warmth (3 صور) — كتتخزن مسبقا بحال الباقي
['warmth-1', 'warmth-2', 'warmth-3'].forEach(function (n) { AVATAR_STATE_FILES.push('./' + n + '.png'); });
const AVATAR_STATE_RE = new RegExp('/(' + AVATAR_STATES.join('|') + ')(-\\d+)?\\.(png|jpg)$');

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // الصور كل وحدة بوحدها: إلا غابت وحدة ما تبطلش الباقي
      var avatarJobs = AVATAR_STATE_FILES.map(function (url) {
        return cache.add(url).catch(function () {});
      });
      return Promise.all([
        cache.addAll(CORE_FILES).catch(function () {
          // إلا فشل شي ملف (اسم مختلف)، ما نوقفوش التسجيل كامل
        })
      ].concat(avatarJobs));
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
  // غير طلبات GET كتدوز من هنا (POST ديال Firestore/API ما كيتخزنوش)
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);

  // صور الحالات: كاش أولا (فوري) + تحديث فالخلفية للزيارة الجاية
  if (url.origin === self.location.origin && AVATAR_STATE_RE.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          var refresh = fetch(event.request).then(function (res) {
            if (res && res.ok) cache.put(event.request, res.clone());
            return res;
          }).catch(function () { return cached; });
          return cached || refresh;
        });
      })
    );
    return;
  }

  // ملفات الموقع (css/js...): كنتأكدو من السيرفر فكل مرة، باش GitHub Pages ما يعطيناش نسخة قديمة من الكاش (10 دقايق)
  var freshFetch = (url.origin === self.location.origin && event.request.mode !== 'navigate')
    ? fetch(event.request, { cache: 'no-cache' })
    : fetch(event.request);

  event.respondWith(
    freshFetch
      .then(function (networkResponse) {
        // خدام؟ نخزنو نسخة جديدة فالكاش (للاستعمال وقت offline)، ونرجعو النسخة الطرية
        if (networkResponse && networkResponse.ok) {
          var copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return networkResponse;
      })
      .catch(function () {
        // ماكاينش أنترنت؟ نرجعو للنسخة المخزنة (offline fallback)
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
