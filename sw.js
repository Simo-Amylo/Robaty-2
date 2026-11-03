// service worker خفيف لـ Robaty (بلا وضع offline)
//
// شنو كيدير:
// 1) كيخلي التطبيق "قابل للتثبيت" (service worker + fetch handler)
// 2) كيجيب الملفات دايما من السيرفر بـ no-cache، باش أي تعديل يبان مباشرة (بلا ما نتسناو cache ديال GitHub Pages)
// 3) كيخزن مسبقا صور الوضعيات (16 صورة) باش التبديل بين التعابير يكون فوري
//
// شنو ما كيديرش: ما كيخزنش باقي الملفات، وما كاينش تشغيل بلا إنترنت.
// ملاحظة: بدل رقم CACHE_NAME ملي تعدل هاد الملف.

const CACHE_NAME = 'robaty-cache-v19'; // الرقم الجديد كيمسح الكاش القديم (v18) أوتوماتيكيا

// صور الوضعيات (16 حالة، صورة لكل حالة): عدد ثابت، ما كيكبرش مع الوقت
const AVATAR_STATES = [
  'warmth', 'smile', 'calm', 'joy', 'laugh', 'amused', 'playful',
  'surprise', 'curiosity', 'admiration',
  'confidence', 'hope', 'empathy', 'touched', 'serious', 'firm'
];
const AVATAR_STATE_FILES = AVATAR_STATES.map(function (s) { return './' + s + '.png'; });
const AVATAR_STATE_RE = new RegExp('/(' + AVATAR_STATES.join('|') + ')(-\\d+)?\\.(png|jpg)$');

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // كل صورة بوحدها: إلا غابت وحدة ما تبطلش الباقي
      return Promise.all(
        AVATAR_STATE_FILES.map(function (url) {
          return cache.add(url).catch(function () {});
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // كنمسحو أي كاش قديم (بحال robaty-cache-v18 اللي كان فيه ملفات الموقع كاملة)
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
  // غير طلبات GET (POST ديال Firestore/Gemini ما كيتدخلش فيهم)
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);

  // الطلبات الخارجية (Firebase, Google Fonts, CDN...): المتصفح كيتكلف بيها بوحدو
  if (url.origin !== self.location.origin) return;

  // صور الوضعيات: من الكاش أولا (فوري) + تحديث فالخلفية للمرة الجاية
  if (AVATAR_STATE_RE.test(url.pathname)) {
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

  // باقي ملفات الموقع (js/css/صور/بيانات): كنتأكدو من السيرفر فكل مرة، بلا تخزين
  // (الصفحات نفسها "navigate" كتدوز عادي)
  event.respondWith(
    event.request.mode === 'navigate'
      ? fetch(event.request)
      : fetch(event.request, { cache: 'no-cache' })
  );
});
