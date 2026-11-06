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
    function toast(msg, ms) {
        var t = $('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        if (ms !== 0) toastTimer = setTimeout(function () { t.classList.remove('show'); }, ms || 2200);
    }

    var tt = function (key) { return window.RobatyI18n ? window.RobatyI18n.t(key) : key; };

    /* ترجمة الواجهة بالذكاء الاصطناعي: بداية / نهاية / فشل */
    window.addEventListener('robaty-ui-translation', function (e) {
        var st = e.detail && e.detail.status;
        if (st === 'start') toast(tt('ui_translating'), 0);
        else if (st === 'done') toast(tt('ui_translated'));
        else if (st === 'error') toast(tt('ui_translate_failed'), 4000);
    });

    /* ---- مشاركة التطبيق ---- */
    $('shareButton').addEventListener('click', function () {
        var data = {
            title: 'Robaty',
            text: tt('st_share_text'),
            url: APP_URL
        };
        if (navigator.share) {
            navigator.share(data).catch(function () {});
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(APP_URL).then(function () {
                toast(tt('st_copied'));
            }, function () { toast(APP_URL); });
        } else {
            toast(APP_URL);
        }
    });

    /* ---- قائمة "جميع اللغات" ---- */
    (function () {
        var i18n = window.RobatyI18n;
        if (!i18n) return;

        var overlay = document.createElement('div');
        overlay.className = 'api-key-modal-overlay s-picker-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML =
            '<div class="api-key-modal-box s-picker-box">' +
                '<h2 id="pickerTitle"></h2>' +
                '<input type="search" class="gold-input s-picker-search" id="pickerSearch" autocomplete="off">' +
                '<div class="s-picker-list" id="pickerList"></div>' +
            '</div>';
        document.querySelector('.app-container').appendChild(overlay);

        var title = overlay.querySelector('#pickerTitle');
        var search = overlay.querySelector('#pickerSearch');
        var list = overlay.querySelector('#pickerList');

        function render(filter) {
            var q = (filter || '').trim().toLowerCase();
            var reply = i18n.getReplyLanguage();
            var items = i18n.getAllLanguages().filter(function (l) {
                return !q || l.native.toLowerCase().indexOf(q) > -1 || l.en.toLowerCase().indexOf(q) > -1 ||
                    (l.label || '').toLowerCase().indexOf(q) > -1;
            });

            list.innerHTML = '';

            if (!items.length) {
                var empty = document.createElement('p');
                empty.className = 's-note';
                empty.textContent = i18n.t('no_language_found');
                list.appendChild(empty);
                return;
            }

            items.forEach(function (l) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'lang-option' + (reply && reply.code === l.code ? ' active' : '');
                var second = l.label || l.en;
                btn.textContent = (l.flag ? l.flag + '  ' : '') + l.native + (l.native.toLowerCase() === second.toLowerCase() ? '' : ' · ' + second);
                btn.addEventListener('click', function () {
                    i18n.setReplyLanguage(l.code);
                    close();
                    toast('✓ ' + (l.flag ? l.flag + ' ' : '') + l.native, 1500);
                });
                list.appendChild(btn);
            });
        }

        function open() {
            title.textContent = '🌍 ' + i18n.t('all_languages_title');
            search.setAttribute('placeholder', i18n.t('search_language_placeholder'));
            search.value = '';
            render('');
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
        }

        function close() {
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
        }

        search.addEventListener('input', function () { render(search.value); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        window.RobatyLangPicker = { open: open, close: close };
    })();

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

    function disarm() {
        armed = false;
        delBtn.textContent = tt('st_mem_btn');
    }

    delBtn.addEventListener('click', function () {
        if (!armed) {
            armed = true;
            delBtn.textContent = tt('st_mem_confirm');
            clearTimeout(delTimer);
            delTimer = setTimeout(disarm, 4000);
            return;
        }
        clearTimeout(delTimer);
        try {
            MEMORY_KEYS.forEach(function (k) { localStorage.removeItem(k); });
        } catch (e) {}
        disarm();
        toast(tt('st_mem_done'));
    });

    /* ---- عنوان الصفحة: i18n.js كيبدلو بعنوان التطبيق، كنرجعوه بعد ما يكمل ---- */
    document.addEventListener('DOMContentLoaded', function () {
        document.title = 'Robaty - ' + tt('settings_title').replace(/^[^\w\u0600-\u06FF\u0400-\u04FF]+/, '');
    });

    /* ---- رقم الإصدار ---- */
    $('appVersion').textContent = 'Robaty v' + APP_VERSION;
})();
