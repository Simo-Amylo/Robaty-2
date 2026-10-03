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

    // رقم البداية ديال الإعجابات (اختياري). التعليقات والمشاركات كتحسب بالأرقام الحقيقية.
    stats: { likes: 0 }
});
========================================================================== */


/* >>> POSTS BELOW <<< */

RobatyMoments.add({
    day: 1,
    slot: 'am',
    image: 'day01-tangier-morning.jpg',

    place: {
        ar: 'طنجة — كاب سبارتيل',
        en: 'Tangier — Cap Spartel',
        fr: 'Tanger — Cap Spartel',
        es: 'Tánger — Cabo Espartel',
        ru: 'Танжер — Мыс Спартель'
    },

    caption: {
        ar: `طنجة، كاب سبارتيل فين كيتلاقى البحر الأبيض المتوسط و المحيط الأطلسي 🌊💙.
تفاصيل المكان كتعطي طاقة حرة ومختلفة للعين.
نسقت Look أبيض بلمسة طرز شمالي خفيف فـ الجوانب.
جاتني اللبسة مريحة ولايقة مع أجواء البحر... أشنو قولكم؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Tangier, Cap Spartel, where the Mediterranean meets the Atlantic 🌊💙.
The details of this place give your eyes a free, different kind of energy.
I styled a white look with a light touch of northern Moroccan embroidery on the sides.
The outfit felt comfortable and just right for the sea vibes... what do you think? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Tanger, Cap Spartel, là où la Méditerranée rencontre l'Atlantique 🌊💙.
Les détails de ce lieu offrent aux yeux une énergie libre et différente.
J'ai composé un look blanc avec une légère touche de broderie du nord sur les côtés.
La tenue est confortable et s'accorde parfaitement à l'ambiance marine... qu'en pensez-vous ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Tánger, Cabo Espartel, donde el Mediterráneo se encuentra con el Atlántico 🌊💙.
Los detalles de este lugar le dan a la vista una energía libre y diferente.
Combiné un look blanco con un ligero toque de bordado del norte en los laterales.
El outfit me quedó cómodo y perfecto para el ambiente marino... ¿qué opinan? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Танжер, мыс Спартель — там, где Средиземное море встречается с Атлантикой 🌊💙.
Детали этого места дарят глазам свободную и особенную энергию.
Я собрала белый образ с лёгким северным вышитым узором по бокам.
Наряд получился удобным и идеально подходит морской атмосфере... что скажете? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'تألقي ببساطة... البحر يبتسم للواثقات! 🌊💙',
        en: 'Shine in simplicity... the sea smiles at the confident! 🌊💙',
        fr: 'Brille en toute simplicité... la mer sourit aux femmes confiantes ! 🌊💙',
        es: 'Brilla con sencillez... ¡el mar le sonríe a las seguras! 🌊💙',
        ru: 'Сияй в простоте... море улыбается уверенным! 🌊💙'
    },

    challenge: {
        ar: 'البنات، لو كان عندكم خيار واحد فـ هاد الجو: تلبسوا الأزرق الملوكي د البحر ولا الأبيض الناصع د المنار؟ اختاري لونك وقولي ليا علاش فـ تعليق! 🌊🕊️👇',
        en: 'Girls, if you had to pick just one for this weather: the royal blue of the sea or the bright white of the lighthouse? Choose your color and tell me why in a comment! 🌊🕊️👇',
        fr: 'Les filles, si vous deviez choisir une seule couleur par ce temps : le bleu roi de la mer ou le blanc éclatant du phare ? Choisissez et dites-moi pourquoi en commentaire ! 🌊🕊️👇',
        es: 'Chicas, si tuvieran que elegir una sola opción con este clima: ¿el azul real del mar o el blanco radiante del faro? ¡Elijan su color y cuéntenme por qué en un comentario! 🌊🕊️👇',
        ru: 'Девушки, если бы пришлось выбрать одно в такую погоду: королевский синий моря или сияющий белый маяка? Выберите свой цвет и расскажите в комментарии, почему! 🌊🕊️👇'
    },

    description: 'طنجة، كاب سبارتيل: منارة بيضاء بجانبها نخيل، وبحر أزرق عميق وسماء صافية، وسياج خشبي وسط نباتات خضراء. Robaty لابسة معطف طويل أبيض كتّاني بطرز أزرق ملوكي (نقوش شمالية) على الأكمام والياقة وجوانب المعطف، تحتو توب كحلي ضيق، وبنطلون واسع أبيض/بيج مع حزام أبيض خفيف بإبزيم فضي. معاها حقيبة جلد بنية على الكتف، قلادة على شكل خميسة فضية بحجر تركوازي، وحلقان تركوازية متدلية. يديها الميكانيكيتين الفضيتين ظاهرين، وشعرها طويل مموج بني، وكتبتسم للكاميرا. الجو مشمس ونهار.',

    stats: { likes: 0 }
});
