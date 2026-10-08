/* ==========================================================================
   Robaty — توهج زر "شوفي تصاوري ليوم"
   - كيتوهج كلما كاين منشور جديد ما شافتوش المستخدمة (أول فتح = كيتوهج)
   - كيوقف فاش كتضغط على الزر ولا كتفتح moments.html بأي طريقة
   - كيتوهج من جديد غير فاش كيتنشر منشور موالي (7 صباحا / 7 مساء)
   كيتحمل بعد moments-data.js، فـ index.html و moments.html معا.
   ========================================================================== */
(function () {

    var SEEN_KEY = 'robatyMomentsSeen';   // نفس المفتاح اللي كيمسحو clearRobatyMemory

    function latestPostId() {
        try {
            if (!window.RobatyMoments) return null;
            var list = window.RobatyMoments.getPublished();
            return list && list.length ? list[0].id : null;
        } catch (e) {
            return null;
        }
    }

    function getSeen() {
        try { return localStorage.getItem(SEEN_KEY); } catch (e) { return null; }
    }

    function setSeen(id) {
        try { localStorage.setItem(SEEN_KEY, id); } catch (e) {}
    }

    function getButton() {
        return document.querySelector('.gold-pill-btn[href*="moments"]');
    }

    function refreshGlow() {
        var btn = getButton();
        if (!btn) return;

        var id = latestPostId();
        btn.classList.toggle('pulse', !!id && id !== getSeen());
    }

    function markSeen() {
        var id = latestPostId();
        if (id) setSeen(id);

        var btn = getButton();
        if (btn) btn.classList.remove('pulse');
    }

    function init() {
        /* داخل صفحة Moments: كلشي اعتبرناه مشاهَد */
        if (/moments\.html/i.test(location.pathname)) {
            markSeen();
            return;
        }

        var btn = getButton();
        if (!btn) return;

        refreshGlow();

        btn.addEventListener('click', markSeen);

        /* باش يتوهج وحدو فاش يجي 7:00 / 19:00 والتطبيق مفتوح */
        setInterval(refreshGlow, 60 * 1000);

        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) refreshGlow();
        });

        /* فاش كترجع من صفحة Moments بزر الرجوع (bfcache) */
        window.addEventListener('pageshow', refreshGlow);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
