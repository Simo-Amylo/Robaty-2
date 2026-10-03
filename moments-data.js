/* ==========================================================================
Robaty — ملف اللحظات (Moments) الموحّد
كل منشور كيتزاد هنا مرة وحدة، وكيتعرض تلقائيا فـ:
  - moments.html  (المنشور + Story + سؤال التحدي فالتعليقات)
  - profile.html  (الشبكة المصغرة + Story)
  - app.js        (Robaty كتعرف شنو فكل صورة فالدردشة)

كيفاش نزيدو منشور جديد؟
  نلصقو البلوك ديالو فآخر هاد الملف، تحت العلامة:  >>> POSTS BELOW <<<
  (ما نبدلوش حتى حاجة فوق العلامة)
========================================================================== */

(function () {

    /* تاريخ أول يوم (YYYY-MM-DD) بتوقيت المغرب.
       اليوم 1 كيبدا من هاد التاريخ، واليوم 2 فاليوم الموالي، وهكذا. */
    var LAUNCH_DATE = '2026-10-03';

    /* ساعات النشر بتوقيت المغرب */
    var SLOT_HOUR = { am: 7, pm: 19 };
    var TIMEZONE = 'Africa/Casablanca';

    var posts = [];


    function pad2(n) {
        return (n < 10 ? '0' : '') + n;
    }

    /* الوقت الحالي بتوقيت المغرب على شكل رقم: YYYYMMDDHH */
    function nowKey() {
        try {
            var parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: TIMEZONE,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', hourCycle: 'h23'
            }).formatToParts(new Date());

            var o = {};
            parts.forEach(function (p) { o[p.type] = p.value; });

            return Number(o.year + o.month + o.day) * 100 + Number(o.hour);
        } catch (e) {
            var d = new Date();
            return Number('' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate())) * 100 + d.getHours();
        }
    }

    /* وقت نشر منشور (YYYYMMDDHH) */
    function publishKey(post) {
        var p = LAUNCH_DATE.split('-');
        var d = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + (post.day - 1)));
        var dateNum = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
        return dateNum * 100 + SLOT_HOUR[post.slot];
    }

    /* ?preview=1 فالرابط: كيبين كاع المنشورات (للتجربة قبل موعدها) */
    function isPreview() {
        try {
            return /[?&]preview=1\b/.test(location.search);
        } catch (e) {
            return false;
        }
    }

    function currentLang() {
        return window.RobatyI18n ? window.RobatyI18n.getCurrentLang() : 'ar';
    }

    /* نص بلغة معينة (وإلا العربية) */
    function t(obj, lang) {
        if (obj === undefined || obj === null) return '';
        if (typeof obj === 'string') return obj;
        return obj[lang || currentLang()] || obj.ar || '';
    }

    function add(post) {
        post.id = 'day' + pad2(post.day) + '-' + post.slot;
        post.stats = post.stats || {};
        post._key = publishKey(post);
        posts.push(post);
    }

    /* المنشورات اللي حان وقتها، الأحدث أولا */
    function getPublished() {
        var now = nowKey();
        var preview = isPreview();

        return posts
            .filter(function (p) { return preview || p._key <= now; })
            .sort(function (a, b) { return b._key - a._key; });
    }

    function getPost(id) {
        for (var i = 0; i < posts.length; i++) {
            if (posts[i].id === id) return posts[i];
        }
        return null;
    }

    /* رقم اليوم والفترة بالعربية، مثلا "اليوم 3 — الصباح" (للدردشة فقط) */
    function slotLabelAr(post) {
        return 'اليوم ' + post.day + ' — ' + (post.slot === 'am' ? 'الصباح (7:00)' : 'المساء (19:00)');
    }

    /* سياق اللحظات لـ Robaty فالدردشة: شنو لبسات وفين كانت فكل صورة منشورة */
    function getChatContext() {
        var list = getPublished();
        if (!list.length) return '';

        var lines = list.map(function (p, i) {
            var line = '- ' + slotLabelAr(p) + ' | ' + t(p.place, 'ar') + ' | ' + p.description;

            if (i < 4) {
                line += '\n    النص اللي كتبتيه معها: ' + t(p.caption, 'ar').replace(/\n/g, ' ');
                if (p.story) line += '\n    جملة الـ Story: ' + t(p.story, 'ar');
                if (p.challenge) line += '\n    سؤال التحدي: ' + t(p.challenge, 'ar');
            }
            return line;
        });

        return lines.join('\n');
    }

    window.RobatyMoments = {
        add: add,
        t: t,
        isPreview: isPreview,
        getPublished: getPublished,
        getPost: getPost,
        getChatContext: getChatContext,
        launchDate: LAUNCH_DATE
    };

})();


/* ==========================================================================
قالب منشور جديد (نسخو، عمّرو، ولصقو تحت العلامة):

RobatyMoments.add({
    day: 1,                       // رقم اليوم (1 → 30)
    slot: 'am',                   // 'am' = 7 صباحا ، 'pm' = 7 مساء
    image: 'day01-chefchaouen-morning.jpg',

    place: {
        ar: '', en: '', fr: '', es: '', ru: ''
    },
    caption: {                    // نص المنشور (كل سطر فسطر)
        ar: ``, en: ``, fr: ``, es: ``, ru: ``
    },
    story: {                      // جملة قصيرة كتكتب على الصورة فالـ Story
        ar: '', en: '', fr: '', es: '', ru: ''
    },
    challenge: {                  // سؤال اليوم (كيبان فالتعليقات)
        ar: '', en: '', fr: '', es: '', ru: ''
    },

    // وصف داخلي لـ Robaty (ما كيبانش للمستخدمات): اللباس، الألوان، الإكسسوارات، المكان
    description: '',

    // أرقام البداية (اختياري)
    stats: { likes: 0, comments: 0, reposts: 0, shares: 0 }
});
========================================================================== */


/* >>> POSTS BELOW <<< */
