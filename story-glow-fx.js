/* Robaty — توهج دائرة الـ Story عند وجود منشور جديد
   - المنشور الأحدث فقط (الأول في الصفحة) تتوهج دائرته إن لم تفتح المستخدمة ستوريه بعد
   - عند الضغط على الدائرة والدخول للـ Story يتوقف التوهج لهذا المنشور (يُحفظ في localStorage
     فلا يعود حتى بعد إغلاق التطبيق وفتحه)
   - عند نشر صورة جديدة (7 صباحا / 7 مساء) يصير هي الأحدث فتتوهج دائرتها من جديد */
(function () {
    'use strict';

    var KEY = 'robaty_story_seen';
    var CLS = 'is-new';
    var feed = document.getElementById('momentsFeed');
    if (!feed) return;

    function readSeen() {
        try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
    }

    function markSeen(id) {
        var seen = readSeen();
        seen[id] = 1;

        // نحتفظ بآخر 60 معرّفا فقط حتى لا يكبر الحفظ
        var ids = Object.keys(seen);
        if (ids.length > 60) {
            ids.slice(0, ids.length - 60).forEach(function (k) { delete seen[k]; });
        }

        try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) {}
    }

    function refresh() {
        var all = feed.querySelectorAll('.story-avatar[data-story]');
        var seen = readSeen();

        for (var i = 0; i < all.length; i++) {
            var btn = all[i];
            // الأول فقط = الأحدث، ولم تُفتح ستوريه بعد
            var isNewest = (i === 0);
            var id = btn.getAttribute('data-story');
            btn.classList.toggle(CLS, isNewest && !seen[id]);
        }
    }

    // الضغط على دائرة أي منشور = شوهدت ستوريه
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.story-avatar[data-story]');
        if (!btn) return;

        markSeen(btn.getAttribute('data-story'));
        btn.classList.remove(CLS);
    }, true);

    refresh();

    // إعادة التطبيق إن أُعيد رسم المنشورات
    new MutationObserver(function () { refresh(); }).observe(feed, { childList: true });
})();
