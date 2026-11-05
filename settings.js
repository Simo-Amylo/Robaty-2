/* ==========================================================================
   settings.js — منطق صفحة الإعدادات
   ========================================================================== */
(function () {
    'use strict';

    var APP_VERSION = '1.0.0';
    var APP_URL = 'https://robaty.app';
    var SUPPORT_EMAIL = 'robaty.support@gmail.com';

    var prefs = window.RobatyPrefs;
    var $ = function (id) { return document.getElementById(id); };

    /* ---- الثيم: وقت اليوم + أجواء الألوان (نفس منطق التطبيق) ---- */
    var hour = new Date().getHours();
    document.body.setAttribute('data-time-theme', (hour >= 6 && hour < 18) ? 'day' : 'night');
    prefs.applyColor();

    /* ---- رجوع ---- */
    $('settingsBack').addEventListener('click', function () {
        window.location.href = 'index.html';
    });

    /* ---- إشعار صغير ---- */
    var toastTimer = null;
    function toast(msg) {
        var t = $('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
    }

    /* ---- مشاركة التطبيق ---- */
    $('shareButton').addEventListener('click', function () {
        var data = {
            title: 'Robaty',
            text: 'اكتشفي روباتي، سفيرة التراث المغربي ✨',
            url: APP_URL
        };
        if (navigator.share) {
            navigator.share(data).catch(function () {});
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(APP_URL).then(function () {
                toast('تم نسخ الرابط ✓');
            }, function () { toast(APP_URL); });
        } else {
            toast(APP_URL);
        }
    });

    /* ---- مجموعة أزرار اختيار واحد ---- */
    function bindGroup(containerId, attr, getCurrent, onPick) {
        var box = $(containerId);
        if (!box) return;
        var btns = box.querySelectorAll('[data-' + attr + ']');
        function refresh() {
            var cur = getCurrent();
            btns.forEach(function (b) {
                b.classList.toggle('active', b.getAttribute('data-' + attr) === cur);
            });
        }
        btns.forEach(function (b) {
            b.addEventListener('click', function () {
                onPick(b.getAttribute('data-' + attr));
                refresh();
            });
        });
        refresh();
    }

    bindGroup('colorModeOptions', 'color-value', prefs.getColor, function (v) { prefs.setColor(v); });
    bindGroup('chatLookOptions', 'look', prefs.getLook, function (v) { prefs.setLook(v); });
    bindGroup('fontSizeOptions', 'font', prefs.getFont, function (v) { prefs.setFont(v); });

    /* ---- الاهتزاز (مخفي فالأجهزة اللي ما كتدعمهوش، بحال iPhone) ---- */
    var vibRow = $('vibrationRow');
    var vib = $('vibrationToggle');
    if (!prefs.vibrationSupported) {
        vibRow.style.display = 'none';
    } else {
        vib.setAttribute('aria-checked', prefs.vibrationOn() ? 'true' : 'false');
        vib.addEventListener('click', function () {
            var next = vib.getAttribute('aria-checked') !== 'true';
            vib.setAttribute('aria-checked', next ? 'true' : 'false');
            prefs.setVibration(next);
            if (next && navigator.vibrate) navigator.vibrate(30);
        });
    }

    /* ---- الاتصال بنا: بريد معبّأ بالإصدار واللغة ---- */
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        window.navigator.standalone === true;
    var subject = 'ملاحظات حول Robaty';
    var body = '\n\n---\nالإصدار: ' + APP_VERSION +
        '\nاللغة: ' + (document.documentElement.lang || 'ar') +
        '\nالعرض: ' + (standalone ? 'تطبيق' : 'متصفح');
    $('contactLink').setAttribute('href',
        'mailto:' + SUPPORT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body));

    /* ---- حذف الذاكرة: خطوتين (نفس المفاتيح اللي كيمسحها زر المسح المؤقت) ---- */
    var MEMORY_KEYS = [
        'robaty_chat_history',
        'robaty_profile_facts',
        'robaty_narrative_memory',
        'robaty_last_visit',
        'robatyMomentsSeen',
        'robaty_story_seen'
    ];
    var delBtn = $('deleteMemoryBtn');
    var delTimer = null;
    var armed = false;
    var delLabel = delBtn.textContent;

    function disarm() {
        armed = false;
        delBtn.textContent = delLabel;
    }

    delBtn.addEventListener('click', function () {
        if (!armed) {
            armed = true;
            delBtn.textContent = 'اضغطي مرة أخرى للتأكيد';
            clearTimeout(delTimer);
            delTimer = setTimeout(disarm, 4000);
            return;
        }
        clearTimeout(delTimer);
        try {
            MEMORY_KEYS.forEach(function (k) { localStorage.removeItem(k); });
        } catch (e) {}
        disarm();
        toast('تم حذف الذاكرة ✓');
    });

    /* ---- عنوان الصفحة: i18n.js كيبدلو بعنوان التطبيق، كنرجعوه بعد ما يكمل ---- */
    document.addEventListener('DOMContentLoaded', function () {
        document.title = 'Robaty - الإعدادات';
    });

    /* ---- رقم الإصدار ---- */
    $('appVersion').textContent = 'Robaty v' + APP_VERSION;
})();
