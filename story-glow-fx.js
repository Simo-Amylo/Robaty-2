/* Robaty — حالة دائرة الـ Story في كل منشور (بأسلوب إنستغرام)
   - أحدث منشور لم تُشاهد ستوريه: توهج ينبض (is-new)
   - منشورات أقدم لم تُشاهد ستوريها: توهج هادئ ثابت دون نبض (is-unseen)
   - ستوري شوهدت: حلقة باهتة دون توهج (is-seen)
   - الحالة تُحفظ في localStorage فلا تعود حتى بعد إغلاق التطبيق وفتحه
   - عند نشر صورة جديدة (7 صباحا / 7 مساء) تصير هي الأحدث فتنبض دائرتها */
(function () {
    'use strict';

    var KEY = 'robaty_story_seen';
    var feed = document.getElementById('momentsFeed');
    if (!feed) return;

    function readSeen() {
        try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
    }

    function markSeen(id) {
        var seen = readSeen();
        seen[id] = 1;

        // نحتفظ بآخر 300 معرّف فقط حتى لا يكبر الحفظ
        var ids = Object.keys(seen);
        if (ids.length > 300) {
            ids.slice(0, ids.length - 300).forEach(function (k) { delete seen[k]; });
        }

        try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) {}
    }

    function applyState(btn, state) {
        btn.classList.toggle('is-new', state === 'new');
        btn.classList.toggle('is-unseen', state === 'unseen');
        btn.classList.toggle('is-seen', state === 'seen');
    }

    function refresh() {
        var all = feed.querySelectorAll('.story-avatar[data-story]');
        var seen = readSeen();

        for (var i = 0; i < all.length; i++) {
            var btn = all[i];
            var id = btn.getAttribute('data-story');

            if (seen[id]) {
                applyState(btn, 'seen');
            } else if (i === 0) {
                applyState(btn, 'new');      // الأحدث: ينبض
            } else {
                applyState(btn, 'unseen');   // الأقدم غير المشاهَد: توهج ثابت
            }
        }
    }

    // الضغط على دائرة أي منشور = شوهدت ستوريه
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.story-avatar[data-story]');
        if (!btn) return;

        markSeen(btn.getAttribute('data-story'));
        applyState(btn, 'seen');
    }, true);

    refresh();

    // إعادة التطبيق إن أُعيد رسم المنشورات
    new MutationObserver(function () { refresh(); }).observe(feed, { childList: true });
})();
