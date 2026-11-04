// service worker خفيف لـ Robaty (بلا وضع offline)
//
// شنو كيدير:
// 1) كيخلي التطبيق "قابل للتثبيت" (service worker + fetch handler)
// 2) كيجيب الملفات دايما من السيرفر بـ no-cache، باش أي تعديل يبان مباشرة (بلا ما نتسناو cache ديال GitHub Pages)
// 3) كيخزن مسبقا صور الوضعيات (16 صورة) باش التبديل بين التعابير يكون فوري
//
// شنو ما كيديرش: ما كيخزنش باقي الملفات، وما كاينش تشغيل بلا إنترنت.
// وإلا ما كاينش إنترنت: كتبان صفحة بسيطة وأنيقة (بدل صفحة مكسورة بلا ألوان).
// ملاحظة: بدل رقم CACHE_NAME غير ملي تبدل لائحة صور الوضعيات.

const CACHE_NAME = 'robaty-cache-v19'; // الرقم الجديد كيمسح الكاش القديم (v18) أوتوماتيكيا

// صور الوضعيات (16 حالة، صورة لكل حالة): عدد ثابت، ما كيكبرش مع الوقت
const AVATAR_STATES = [
  'warmth', 'smile', 'calm', 'joy', 'laugh', 'amused', 'playful',
  'surprise', 'curiosity', 'admiration',
  'confidence', 'hope', 'empathy', 'touched', 'serious', 'firm'
];
const AVATAR_STATE_FILES = AVATAR_STATES.map(function (s) { return './' + s + '.png'; });
// صفحة "ما كاينش إنترنت" (مدمجة هنا، ما كتحتاج حتى ملف)
// اللغة: كتتقرا من اللغة المحفوظة فالتطبيق (robaty_lang) وإلا من لغة الهاتف، بحال التطبيق بالضبط.
// النص العربي هو الافتراضي (إلا ما خدمش الـ JS).
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#14100c"><title>Robaty</title>
<style>
html,body{height:100%;margin:0}
body{background:#14100c;color:#f2f2f2;font-family:Tahoma,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box}
.av{width:150px;height:150px;border-radius:50%;border:3px solid #e5b35c;box-shadow:0 0 40px rgba(229,179,92,.25);object-fit:cover;background:#1e1712}
h1{margin:18px 0 6px;font-size:28px;color:#e5b35c}
p{margin:4px 0;font-size:16px;line-height:1.9;color:#ddd}
button{margin-top:22px;padding:11px 34px;border-radius:22px;border:1px solid #e5b35c;background:transparent;color:#e5b35c;font-size:15px;font-weight:700}
</style></head><body>
<img class="av" src="./calm.png" alt="" onerror="this.style.display='none'">
<h1>Robaty</h1>
<p id="t">ما كاين حتى إنترنت دابا 🌙</p>
<p id="s">رجعي الاتصال وحاولي مرة أخرى.</p>
<button type="button" id="b" onclick="location.reload()">إعادة المحاولة</button>
<script>
(function () {
  var T = {
    ar: ['ما كاين حتى إنترنت دابا 🌙', 'رجعي الاتصال وحاولي مرة أخرى.', 'إعادة المحاولة'],
    en: ['No internet connection right now 🌙', 'Check your connection and try again.', 'Try again'],
    fr: ['Pas de connexion internet pour le moment 🌙', 'Vérifie ta connexion et réessaie.', 'Réessayer'],
    es: ['Ahora mismo no hay conexión a internet 🌙', 'Revisa tu conexión e inténtalo de nuevo.', 'Reintentar'],
    ru: ['Сейчас нет подключения к интернету 🌙', 'Проверь соединение и попробуй ещё раз.', 'Повторить']
  };
  var lang = 'ar';
  try {
    var saved = null;
    try { saved = localStorage.getItem('robaty_lang'); } catch (e) {}
    if (saved && T[saved]) {
      lang = saved;
    } else {
      var langs = navigator.languages || [navigator.language || 'ar'];
      for (var i = 0; i < langs.length; i++) {
        var code = String(langs[i]).slice(0, 2).toLowerCase();
        if (T[code]) { lang = code; break; }
      }
    }
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    document.getElementById('t').textContent = T[lang][0];
    document.getElementById('s').textContent = T[lang][1];
    document.getElementById('b').textContent = T[lang][2];
  } catch (e) {}
})();
</script>
</body></html>`;

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

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

  // الصفحات نفسها: إلا ما كاينش إنترنت كنبينو صفحة offline أنيقة
  if (event.request.mode === 'navigate') {
    event.respondWith(
      self.navigator.onLine === false
        ? offlineResponse()
        : fetch(event.request).catch(function () { return offlineResponse(); })
    );
    return;
  }

  // باقي ملفات الموقع (js/css/صور/بيانات): كنتأكدو من السيرفر فكل مرة، بلا تخزين
  event.respondWith(fetch(event.request, { cache: 'no-cache' }));
});
