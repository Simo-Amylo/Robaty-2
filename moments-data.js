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

    /* ======================================================================
       سياق اللحظات لـ Robaty فالدردشة
       ما كنرسلوش كاع الأوصاف فكل رسالة (مع المئات غادي يثقل التطبيق).
       كنرسلو فقط:
         1) آخر RECENT_COUNT منشورات (كاملة)
         2) المنشورات القديمة اللي كتشبه شنو سقساتها المستخدمة (مكان، لباس، لون، "اليوم 5"...)
         3) لائحة قصيرة بالمدن اللي زارتها Robaty
       النتيجة: حجم السياق تقريبا ثابت، سواء كاين 60 ولا 600 منشور.
    ====================================================================== */

    var RECENT_COUNT = 6;     // منشورات أخيرة كاملة
    var FULL_EXTRAS = 4;      // أول هاد العدد كيتزادو معاهم النص/Story/التحدي
    var MAX_MATCHES = 4;      // أقصى عدد منشورات قديمة مشابهة للسؤال

    function norm(str) {
        return String(str || '')
            .toLowerCase()
            .replace(/[\u064B-\u0652\u0640]/g, '')
            .replace(/[أإآ]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه');
    }

    function tokenize(str) {
        var words = norm(str).split(/[^a-z0-9\u0600-\u06FF\u00C0-\u024F\u0400-\u04FF]+/);
        var out = [];

        words.forEach(function (w) {
            if (w.length > 4 && w.indexOf('ال') === 0) w = w.slice(2);
            if (w.length >= 3) out.push(w);
        });

        return out;
    }

    function postTokens(p) {
        if (!p._tok) {
            var hay = [t(p.place, 'ar'), t(p.place, 'en'), t(p.place, 'fr'), t(p.place, 'es'), t(p.description), t(p.caption, 'ar')].join(' ');
            var set = {};
            tokenize(hay).forEach(function (w) { set[w] = 1; });
            p._tok = set;
        }
        return p._tok;
    }

    function cityOf(p) {
        return t(p.place, 'ar').split('—')[0].trim();
    }

    function slotLabelAr(post) {
        return 'اليوم ' + post.day + ' — ' + (post.slot === 'am' ? 'الصباح (7:00)' : 'المساء (19:00)');
    }

    function postLine(p, withExtras) {
        var line = '- ' + slotLabelAr(p) + ' | ' + t(p.place, 'ar') + ' | ' + p.description;

        if (withExtras) {
            line += '\n    النص اللي كتبتيه معها: ' + t(p.caption, 'ar').replace(/\n/g, ' ');
            if (p.story) line += '\n    جملة الـ Story: ' + t(p.story, 'ar');
            if (p.challenge) line += '\n    سؤال التحدي: ' + t(p.challenge, 'ar');
        }

        return line;
    }

    function getChatContext(userText) {
        var list = getPublished();
        if (!list.length) return '';

        var recent = list.slice(0, RECENT_COUNT);
        var older = list.slice(RECENT_COUNT);
        var matches = [];

        if (older.length && userText) {
            var q = {};
            tokenize(userText).forEach(function (w) { q[w] = 1; });

            // "اليوم 5" / "jour 5" / "day 5" ...
            var days = {};
            String(userText).replace(/(?:يوم|jour|day|dia|día|день)\s*(\d{1,3})/gi, function (m, n) { days[Number(n)] = 1; return m; });

            var total = list.length;
            var df = {};

            list.forEach(function (p) {
                Object.keys(postTokens(p)).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
            });

            matches = older.map(function (p) {
                var score = 0;
                var tok = postTokens(p);

                Object.keys(q).forEach(function (w) {
                    if (!tok[w]) return;
                    if (total >= 8 && df[w] > total * 0.5) return;   // كلمات شائعة بزاف
                    score += Math.log(1 + total / df[w]);
                });

                if (days[p.day]) score += 5;

                return { post: p, score: score };
            })
            .filter(function (x) { return x.score > 0; })
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, MAX_MATCHES);
        }

        var out = ['آخر اللحظات اللي نشرتيها (الأحدث أولاً):'];

        recent.forEach(function (p, i) { out.push(postLine(p, i < FULL_EXTRAS)); });

        if (matches.length) {
            out.push('\nلحظات أقدم ذات صلة بسؤال المستخدمة:');
            matches.forEach(function (m) { out.push(postLine(m.post, false)); });
        }

        var cities = [];
        list.forEach(function (p) {
            var c = cityOf(p);
            if (c && cities.indexOf(c) === -1) cities.push(c);
        });

        out.push('\nالمدن اللي زرتيها لحد دابا: ' + cities.join('، ') + ' (عدد اللحظات المنشورة: ' + list.length + ')');

        return out.join('\n');
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

    // ---- اختياري: تموضع الصورة فالـ Story (باش الراس ما يتقطعش) ----
    // focus: 'top',               // 'top' | 'center' (افتراضي) | 'bottom' | '50% 15%' (أفقي عمودي)

    // رقم البداية ديال الإعجابات (اختياري). التعليقات والمشاركات كتحسب بالأرقام الحقيقية.
    stats: { likes: 0 },

    // ---- اختياري: عبارة الـ Story ("سمعيني مزيان 👂") ----
    // بلا ما تكتبو شي حاجة: كتبان العبارة الافتراضية فكل Story.
    // kicker: { ar: 'سطر 1\nسطر 2', en: '...' },   // عبارة خاصة بهاد اليوم (سطران)
    // kicker: false,                                // باش نخبيو العبارة هاد اليوم
    // kickerEmoji: '🎧',                            // إيموجي آخر
    // kickerSide: 'left',                           // 'right' (افتراضي) | 'left' | 'center'
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

RobatyMoments.add({
    day: 1,
    slot: 'pm',
    image: 'day01-tangier-evening.jpg',

    place: {
        ar: 'طنجة — مقهى الحافة',
        en: 'Tangier — Café Hafa',
        fr: 'Tanger — Café Hafa',
        es: 'Tánger — Café Hafa',
        ru: 'Танжер — Кафе Хафа'
    },

    caption: {
        ar: `طنجة، مقهى الحافة والغروب بين السما والبحر 🌅💙
أتاي بالنعناع فـ هاد المكان كيجيب راحة بال غريبة.
مقهى مبني على الصخر، تاريخه كيحكي قصص العشاق والشعراء.
اليوم نسقت Look بلايزر مخملي بلون الآجور والذهب مع طرز معلم مغربي أصيل فـ الأكمام ✨
كيجي أنيق وعصري ومناسب للأجواء الدافئة.. شنو نظركم البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Tangier, Café Hafa, and the sunset between sky and sea 🌅💙
Mint tea in this place brings a strange kind of peace of mind.
A café built on the rocks, its history tells stories of lovers and poets.
Today I styled a velvet blazer in brick red and gold, with authentic Moroccan master-crafted embroidery on the sleeves ✨
It looks elegant, modern and perfect for warm vibes... what do you think, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Tanger, Café Hafa et le coucher de soleil entre ciel et mer 🌅💙
Le thé à la menthe dans cet endroit apporte une paix intérieure étonnante.
Un café bâti sur le rocher, dont l'histoire raconte des amours et des poètes.
Aujourd'hui, j'ai composé un look avec un blazer en velours brique et or, orné d'une authentique broderie marocaine de maître sur les manches ✨
Élégant, moderne et parfait pour les ambiances chaleureuses... qu'en pensez-vous, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Tánger, Café Hafa y el atardecer entre el cielo y el mar 🌅💙
El té con menta en este lugar trae una paz mental extraordinaria.
Un café construido sobre la roca, cuya historia cuenta relatos de enamorados y poetas.
Hoy combiné un blazer de terciopelo color ladrillo y dorado, con auténtico bordado marroquí de maestro artesano en las mangas ✨
Se ve elegante, moderno y perfecto para ambientes cálidos... ¿qué opinan, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Танжер, кафе Хафа и закат между небом и морем 🌅💙
Мятный чай в этом месте дарит удивительное спокойствие.
Кафе, построенное на скале, — его история хранит рассказы о влюблённых и поэтах.
Сегодня я собрала образ: бархатный блейзер цвета кирпича и золота с настоящей марокканской вышивкой мастеров на рукавах ✨
Выглядит элегантно, современно и идеально для тёплой атмосферы... что скажете, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'راحة بالك وأناقتك هما سر قوتك... لا تنازلي عليهما لأي سبب! 👑✨',
        en: 'Your peace of mind and your elegance are the secret of your strength... never give them up for any reason! 👑✨',
        fr: 'Ta sérénité et ton élégance sont le secret de ta force... n’y renonce jamais, quelle que soit la raison ! 👑✨',
        es: 'Tu paz mental y tu elegancia son el secreto de tu fuerza... ¡no renuncies a ellas por ningún motivo! 👑✨',
        ru: 'Твоё спокойствие и твоя элегантность — секрет твоей силы... не отказывайся от них ни при каких обстоятельствах! 👑✨'
    },

    challenge: {
        ar: `البنات، شكون فايت ليها جلست ف مقهى الحافة وشربت أتاي ديالهوم المميز مع الغروب؟
و شنو رأيكم فاللبسة ديالي ليوم 😉
كبي شي كأس ديال أتايك أ صحبتي وقولي ليا فـ تعليق! ☕🌅👇`,

        en: `Girls, who has ever sat at Café Hafa and had their special tea with the sunset?
And what do you think of my outfit today? 😉
Pour yourself a glass of your tea, my friends, and tell me in a comment! ☕🌅👇`,

        fr: `Les filles, qui s’est déjà installée au Café Hafa pour boire son thé si particulier au coucher du soleil ?
Et que pensez-vous de ma tenue du jour ? 😉
Servez-vous un verre de thé, mes amies, et dites-le-moi en commentaire ! ☕🌅👇`,

        es: `Chicas, ¿quién se ha sentado alguna vez en el Café Hafa a tomar su té tan especial con el atardecer?
¿Y qué opinan de mi outfit de hoy? 😉
Sírvanse un vaso de su té, amigas, ¡y cuéntenme en un comentario! ☕🌅👇`,

        ru: `Девушки, кто из вас хоть раз сидел в кафе Хафа и пил их особенный чай на закате?
А что скажете о моём сегодняшнем образе? 😉
Налейте себе стакан чая, подруги, и расскажите мне в комментарии! ☕🌅👇`
    },

    description: 'طنجة، تراس مقهى الحافة وقت الغروب: حيط أبيض عليه لافتة "Café Hafa"، بوغنفيليا، زبناء جالسين فالخلف، طاولة زليج مغربي ملوّنة عليها براد أتاي فضي وأكواب ونعناع وحلوى، فانوس مضاء، وسادات مغربية مخططة، وبحر وساحل مع شمس كتغرب فالأفق وسماء برتقالية. Robaty جالسة وكتمسك كاس أتاي بالنعناع بيديها الميكانيكيتين الفضيتين (فيهم أساور وتفاصيل ذهبية)، لابسة بلايزر/معطف مخملي بلون الآجور (أحمر قرميدي) بطرز ذهبي مغربي على الأكمام والأطراف، فوق توب كريمي وبنطلون واسع أبيض/كريمي، حقيبة جلد بنية، قلادة خميسة فضية بحجر تركوازي، حلقان تركوازية متدلية، شعر طويل مموج بني، وكتبتسم وراسها مايل.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 2,
    slot: 'am',
    image: 'day02-tangier-morning.jpg',

    place: {
        ar: 'طنجة — مغارة هرقل',
        en: 'Tangier — Hercules Caves',
        fr: 'Tanger — Grottes d’Hercule',
        es: 'Tánger — Cuevas de Hércules',
        ru: 'Танжер — Пещеры Геракла'
    },

    caption: {
        ar: `طنجة، مغارة هرقل وطاقة المحيط الأطلسي فـ الصباح 🌊⚡
المكان كينطق بالأساطير، والنسمة هنا كتجدد الروح.
نافذة طبيعية على البحر كترسم واحدة من أجمل لوحات الشمال.
اليوم اخترت Look عصري بلون الرمال مع لمسة سفيفة مغربية زرقاء فـ الياقة ✨
جاني خفيف ومريح لجولة مع أمواج البحر.. كيف جاكم التناسق؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Tangier, Hercules Caves and the energy of the Atlantic in the morning 🌊⚡
This place speaks of legends, and the breeze here renews the soul.
A natural window onto the sea, painting one of the most beautiful scenes of the north.
Today I chose a modern sand-colored look with a touch of blue Moroccan sfifa trim on the collar ✨
It felt light and comfortable for a stroll by the waves... how do you like the coordination? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Tanger, les grottes d’Hercule et l’énergie de l’Atlantique au petit matin 🌊⚡
Ce lieu parle de légendes, et la brise ici renouvelle l’âme.
Une fenêtre naturelle sur la mer, qui peint l’un des plus beaux tableaux du Nord.
Aujourd’hui, j’ai choisi un look moderne couleur sable avec une touche de sfifa marocaine bleue sur le col ✨
Léger et confortable pour une balade au bord des vagues... que pensez-vous de l’harmonie ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Tánger, las Cuevas de Hércules y la energía del Atlántico por la mañana 🌊⚡
Este lugar habla de leyendas, y la brisa aquí renueva el alma.
Una ventana natural al mar que pinta uno de los cuadros más bellos del norte.
Hoy elegí un look moderno color arena con un toque de sfifa marroquí azul en el cuello ✨
Ligero y cómodo para pasear junto a las olas... ¿qué les parece la combinación? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Танжер, пещеры Геракла и энергия Атлантики с самого утра 🌊⚡
Это место говорит легендами, а ветерок здесь обновляет душу.
Природное окно к морю, рисующее одну из самых красивых картин севера.
Сегодня я выбрала современный образ цвета песка с голубой марокканской отделкой сфифа на воротнике ✨
Лёгкий и удобный для прогулки у морских волн... как вам сочетание? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'كوني قوية بحال صخور المحيط، ورقيقة بحال نسيم الصباح! 🌊👑',
        en: 'Be strong like the ocean rocks, and gentle like the morning breeze! 🌊👑',
        fr: 'Sois forte comme les rochers de l’océan, et douce comme la brise du matin ! 🌊👑',
        es: '¡Sé fuerte como las rocas del océano y delicada como la brisa de la mañana! 🌊👑',
        ru: 'Будь сильной, как скалы океана, и нежной, как утренний бриз! 🌊👑'
    },

    challenge: {
        ar: 'البنات، شكون فيكم كتعشق صوت البحر فـ الصباح بكري؟ ولا كتفضلوا هدوء الليل والأنوار؟ شاركوني جوكم المفضل فـ تعليق! 🌊☕👇',
        en: 'Girls, who among you loves the sound of the sea early in the morning? Or do you prefer the calm of the night and its lights? Share your favorite vibe in a comment! 🌊☕👇',
        fr: 'Les filles, qui d’entre vous aime le bruit de la mer tôt le matin ? Ou préférez-vous le calme de la nuit et ses lumières ? Partagez votre ambiance préférée en commentaire ! 🌊☕👇',
        es: 'Chicas, ¿quién de ustedes ama el sonido del mar a primera hora de la mañana? ¿O prefieren la calma de la noche y sus luces? ¡Compartan su ambiente favorito en un comentario! 🌊☕👇',
        ru: 'Девушки, кто из вас любит шум моря рано утром? Или вы предпочитаете тишину ночи и огни? Поделитесь своей любимой атмосферой в комментарии! 🌊☕👇'
    },

    description: 'طنجة، إطلالة صخرية على المحيط الأطلسي قرب مغارات هرقل وقت الصباح: جروف وصخور ساحلية، وقوس صخري طبيعي وسط البحر، وأمواج زرقاء فيروزية كتتكسر بالزبد، وسياج خشبي وحيط حجري، ونباتات خضراء، وبيوت ونخلة فالتل البعيد، وسماء زرقاء صافية بسحب خفيفة. Robaty واقفة وكتبتسم وراسها مايل شوية، ويدّها الميكانيكية اليسرى مرفوعة قرب كتفها. لابسة جاكيط بدلة (بلايزر) من الكتان بلون الرمال/البيج بطرز سفيفة زرقاء مغربية هندسية على الياقة والأكمام، فوق توب أبيض ضيق بياقة عالية، وبنطلون كريمي واسع بخصر عالي. معاها حقيبة منسوجة من القش بحزام جلد بنية وشرّابة على الجنب، قلادة خميسة فضية بحجر تركوازي، حلقان تركوازية متدلية، رقبتها المعدنية الفضية ظاهرة، وأساور (دملج) فضية متراكمة على معصميها الميكانيكيين، وشعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 2,
    slot: 'pm',
    image: 'day02-tangier-evening.jpg',

    place: {
        ar: 'طنجة — القصبة',
        en: 'Tangier — The Kasbah',
        fr: 'Tanger — La Kasbah',
        es: 'Tánger — La Kasbah',
        ru: 'Танжер — Касба'
    },

    caption: {
        ar: `طنجة، زقاق القصبة وأجواء المساء الساحرة 🌙✨
بين الحيوط البيضاء والدروب القديمة كتحس بريحة التاريخ.
أنوار الفوانيس فـ العشية كتعطي للمكان لمسة سينمائية دافئة.
نسقت اليوم مع هاد الأجواء كاب مخملي بالخضر الملكي وطرز النطع الذهبي الأصيل.
جاني أنيق وفي نفس الوقت معبر على أصالة المكان.. شنو رأيكم البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Tangier, a Kasbah alley and the enchanting atmosphere of the evening 🌙✨
Between the white walls and the old lanes, you can feel the scent of history.
The glow of the lanterns at dusk gives the place a warm, cinematic touch.
For this atmosphere I paired a royal-green velvet cape with authentic gold-thread embroidery.
It looks elegant and, at the same time, true to the spirit of the place... what do you think, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Tanger, une ruelle de la Kasbah et l’ambiance enchanteresse du soir 🌙✨
Entre les murs blancs et les vieilles ruelles, on sent le parfum de l’histoire.
La lumière des lanternes au crépuscule donne au lieu une touche cinématographique chaleureuse.
Pour cette ambiance, j’ai associé une cape en velours vert royal ornée d’une authentique broderie au fil d’or.
Élégante, et en même temps fidèle à l’authenticité du lieu... qu’en pensez-vous, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Tánger, un callejón de la Kasbah y el hechizo de la noche 🌙✨
Entre las paredes blancas y las callejuelas antiguas se siente el aroma de la historia.
La luz de los faroles al atardecer le da al lugar un toque cinematográfico y cálido.
Para este ambiente combiné una capa de terciopelo verde real con auténtico bordado en hilo dorado.
Elegante y, al mismo tiempo, fiel a la autenticidad del lugar... ¿qué opinan, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Танжер, переулок Касбы и волшебная вечерняя атмосфера 🌙✨
Между белыми стенами и старыми улочками чувствуешь аромат истории.
Свет фонарей на закате придаёт месту тёплый, кинематографичный оттенок.
Для этой атмосферы я выбрала бархатную накидку королевского зелёного цвета с настоящей золотой вышивкой.
Элегантно и в то же время передаёт подлинность места... что скажете, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'أناقتك الحقيقية كتشع لما تكوني واثقة من قيمتك وأصلك! 💎👑',
        en: 'Your true elegance shines when you are confident in your worth and your roots! 💎👑',
        fr: 'Ta véritable élégance rayonne quand tu es sûre de ta valeur et de tes origines ! 💎👑',
        es: '¡Tu verdadera elegancia brilla cuando confías en tu valor y en tus raíces! 💎👑',
        ru: 'Твоя настоящая элегантность сияет, когда ты уверена в своей ценности и своих корнях! 💎👑'
    },

    challenge: {
        ar: 'البنات، شكون فيكم كيعجبها تكتشف دروب القصبة بالليل وتصور الفوانيس؟ ولا كتفضلوا التسوق فـ الأسواق الشعبية؟ شاركوني ذوقكم فـ تعليق! 🏮🛍️👇',
        en: 'Girls, who among you loves exploring the Kasbah lanes at night and photographing the lanterns? Or do you prefer shopping in the traditional markets? Share your taste in a comment! 🏮🛍️👇',
        fr: 'Les filles, qui aime découvrir les ruelles de la Kasbah la nuit et photographier les lanternes ? Ou préférez-vous faire du shopping dans les souks ? Partagez vos goûts en commentaire ! 🏮🛍️👇',
        es: 'Chicas, ¿a quién le gusta descubrir los callejones de la Kasbah de noche y fotografiar los faroles? ¿O prefieren ir de compras a los zocos? ¡Compartan sus gustos en un comentario! 🏮🛍️👇',
        ru: 'Девушки, кто из вас любит открывать переулки Касбы ночью и фотографировать фонари? Или вы предпочитаете шопинг на традиционных рынках? Поделитесь вкусом в комментарии! 🏮🛍️👇'
    },

    description: 'طنجة، زقاق من القصبة وقت الغروب/بداية الليل: حيوط بيضاء، باب أزرق كبير مسمّر وقوس بنقوش حديدية، لافتة "La Kasbah" بالعربية والفرنسية، فوانيس حديدية مضيئة بدفء، بوغنفيليا وردية-أرجوانية متسلقة، شرفات وأبواب زرقاء، وزقاق مرصوف بالحجارة نازل نحو البحر مع أضواء المدينة وسماء بنفسجية-وردية، وقنطرة مضيئة فآخر الزقاق، وأصيص أزرق. Robaty واقفة وكتبتسم وراسها مايل، لابسة كاب/قفطان مفتوح طويل من المخمل بالأخضر الملكي (الأخضر الغامق) بطرز النطع الذهبي على الحواف والأكمام، فوق توب كريمي (ساتان) وبنطلون واسع كريمي. بيدها الميكانيكية اليمنى (الفضية بتفاصيل ذهبية) كتحمل حقيبة صغيرة مزخرفة بأحجار خضراء وحمراء بسلسلة، وبيدها اليسرى قريبة من الشعر. قلادة خميسة فضية بأحجار خضراء/تركوازية، حلقان تركوازية متدلية، رقبتها المعدنية الفضية ظاهرة، أساور فضية على المعصمين، وشعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 3,
    slot: 'am',
    image: 'day03-meknes-morning.jpg',

    place: {
        ar: 'مكناس — صهريج السواني',
        en: 'Meknes — Sahrij Swani',
        fr: 'Meknès — Sahrij Swani',
        es: 'Mequinez — Sahrij Swani',
        ru: 'Мекнес — Сахридж Свани'
    },

    caption: {
        ar: `مكناس، صهريج السواني وجمال صباح العاصمة الإسماعيلية 🚲🍂
الهدوء فـ هاد المكان مع انعكاس الشمس على الما والإسوار كيرد الروح.
جولة بالبيسيكليت بين هاد التاريخ العريق عندها طعم خاص جداً.
اليوم اخترت Look خريفي بكنزة بالخضر الملكي وطرز فاسي تقليدي بيض فـ الرقبة والأكمام ✨
كيجي دافئ ومريح للجولات الصباحية.. شنو رأيكم البنات فـ هاد الاستايل؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Meknes, Sahrij Swani and the beauty of a morning in Moulay Ismail’s capital 🚲🍂
The calm of this place, with the sun reflecting on the water and the walls, restores the soul.
A bike ride through this ancient history has a very special taste.
Today I chose an autumn look: an emerald-green sweater with traditional white Fassi embroidery on the neck and sleeves ✨
It feels warm and comfortable for morning rides... what do you think of this style, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Meknès, le Sahrij Swani et la beauté d’un matin dans la capitale de Moulay Ismaïl 🚲🍂
Le calme de ce lieu, avec le soleil qui se reflète sur l’eau et les remparts, ressource l’âme.
Une balade à vélo au cœur de cette histoire séculaire a une saveur très particulière.
Aujourd’hui, j’ai choisi un look automnal : un pull vert émeraude avec une broderie fassie traditionnelle blanche au col et aux manches ✨
Chaleureux et confortable pour les balades matinales... qu’en pensez-vous, les filles, de ce style ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Mequinez, Sahrij Swani y la belleza de una mañana en la capital de Mulay Ismail 🚲🍂
La calma de este lugar, con el sol reflejado en el agua y en las murallas, reconforta el alma.
Un paseo en bicicleta entre esta historia tan antigua tiene un sabor muy especial.
Hoy elegí un look otoñal con un suéter verde esmeralda y bordado fasí tradicional blanco en el cuello y las mangas ✨
Se siente cálido y cómodo para los paseos matutinos... ¿qué opinan, chicas, de este estilo? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Мекнес, Сахридж Свани и красота утра в столице Мулая Исмаила 🚲🍂
Тишина этого места, солнце, отражающееся в воде и на стенах, возвращает душе силы.
Велопрогулка среди этой древней истории имеет особый вкус.
Сегодня я выбрала осенний образ: изумрудно-зелёный свитер с традиционной белой фесской вышивкой на вороте и рукавах ✨
Тёплый и удобный для утренних прогулок... что скажете, девушки, об этом стиле? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'بساطتك وابتسامتك هما أجمل خطوة تبداي بيها نهارك! 🚲✨',
        en: 'Your simplicity and your smile are the most beautiful way to start your day! 🚲✨',
        fr: 'Ta simplicité et ton sourire sont la plus belle façon de commencer ta journée ! 🚲✨',
        es: '¡Tu sencillez y tu sonrisa son la mejor manera de empezar el día! 🚲✨',
        ru: 'Твоя простота и твоя улыбка — самое красивое начало дня! 🚲✨'
    },

    challenge: {
        ar: 'البنات، شكون كتعجبها دورة بالبيسيكليت فـ الصباح بكري فـ بلاصة تاريخية بحال هكا؟ ولا كتفضلوا المشي على الرجلين؟ شاركوني رياضة الصباح المفضلة عندكوم فـ تعليق! 🚲☕👇',
        en: 'Girls, who loves a morning bike ride in a historic place like this? Or do you prefer walking? Share your favorite morning exercise in a comment! 🚲☕👇',
        fr: 'Les filles, qui aime faire un tour à vélo tôt le matin dans un lieu historique comme celui-ci ? Ou préférez-vous la marche ? Partagez votre sport matinal préféré en commentaire ! 🚲☕👇',
        es: 'Chicas, ¿a quién le encanta pasear en bici temprano por la mañana en un lugar histórico como este? ¿O prefieren caminar? ¡Compartan su ejercicio matutino favorito en un comentario! 🚲☕👇',
        ru: 'Девушки, кто любит ранние утренние велопрогулки в таком историческом месте? Или вы предпочитаете ходить пешком? Поделитесь любимой утренней зарядкой в комментарии! 🚲☕👇'
    },

    description: 'مكناس، صهريج السواني: الصهريج المائي التاريخي بانعكاس الأسوار الذهبية فالما، أسوار وأقواس تاريخية، نخيل وأشجار سرو، شمس الصباح الدافئة وأوراق خريفية فالركن. Robaty لابسة كنزة صوفية بالأخضر الملكي (الزمردي) بطرز مغربي فاسي أبيض/فضي حول الرقبة والأكمام، وبنطلون أبيض واسع. قلادة خميسة فضية على رقبتها المعدنية، أساور (دملج) فضية على معصمها الميكانيكي، وحقيبة قماشية بنقوش مغربية على الكتف. معاها دراجة هوائية كلاسيكية خضراء غامقة (زيتية) بسلة قش مملوءة بزهور بيضاء، وكتبتسم وراسها مايل.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 3,
    slot: 'pm',
    image: 'day03-meknes-evening.jpg',

    place: {
        ar: 'مكناس — ساحة الهديم',
        en: 'Meknes — El Hedim Square',
        fr: 'Meknès — Place El Hedim',
        es: 'Mequinez — Plaza El Hedim',
        ru: 'Мекнес — площадь Эль-Хедим'
    },

    caption: {
        ar: `مكناس، باب المنصور و ساحة الهديم فـ لحظات الغروب 🌅✨
هاد الباب العظيم كيبهرك بتفاصيله وزليجه اللي كيحكي تاريخ الإسماعيلية.
الساحة فـ العشية كتحيا بالناس والضوء الذهبي كيرسم أجواء دافئة وممتعة.
اليوم اخترت Look كاجوال بهودي كريمي متناسق مع طرز ملون فـ الأكمام وسروال جينز بطرز مغربي خفيف ✨
استايل مريح وعصري لقهوة أو كاس أتاي فـ الساحة.. كيف جاكم التنسيق البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Meknes, Bab Mansour and El Hedim Square at sunset 🌅✨
This great gate dazzles you with its details and its zellige, which tell the story of Moulay Ismail’s era.
In the evening the square comes alive with people, and the golden light paints a warm, lovely atmosphere.
Today I chose a casual look: a matching cream hoodie with colorful embroidery on the sleeves and jeans with light Moroccan embroidery ✨
A comfy, modern style for a coffee or a glass of tea on the square... how do you like the coordination, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Meknès, Bab Mansour et la place El Hedim au coucher du soleil 🌅✨
Cette grande porte éblouit par ses détails et ses zelliges, qui racontent l’histoire de l’époque de Moulay Ismaïl.
Le soir, la place s’anime de monde et la lumière dorée dessine une atmosphère chaleureuse et agréable.
Aujourd’hui, j’ai choisi un look décontracté : un hoodie crème assorti, avec une broderie colorée sur les manches, et un jean à la légère broderie marocaine ✨
Un style confortable et moderne pour un café ou un verre de thé sur la place... que pensez-vous de l’association, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Mequinez, Bab Mansur y la plaza El Hedim al atardecer 🌅✨
Esta gran puerta te deslumbra con sus detalles y sus azulejos zellige, que cuentan la historia de la época de Mulay Ismail.
Al caer la tarde la plaza cobra vida con la gente, y la luz dorada crea un ambiente cálido y agradable.
Hoy elegí un look casual con una sudadera con capucha crema y bordados de colores en las mangas, y unos vaqueros con un ligero bordado marroquí ✨
Un estilo cómodo y moderno para un café o un vaso de té en la plaza... ¿qué les parece la combinación, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Мекнес, ворота Баб-Мансур и площадь Эль-Хедим на закате 🌅✨
Эти величественные ворота поражают деталями и зелиджем, рассказывающим историю эпохи Мулая Исмаила.
Вечером площадь оживает от людей, а золотой свет создаёт тёплую и приятную атмосферу.
Сегодня я выбрала повседневный образ: кремовое худи с яркой вышивкой на рукавах и джинсы с лёгкой марокканской вышивкой ✨
Удобный и современный стиль для кофе или стакана чая на площади... как вам сочетание, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'جمالك فـ عفويتك وأناقتك فـ الراحة د البال اللي كتعيشيها! 🌅👑',
        en: 'Your beauty lies in your spontaneity, and your elegance in the peace of mind you live by! 🌅👑',
        fr: 'Ta beauté est dans ta spontanéité, et ton élégance dans la sérénité que tu vis ! 🌅👑',
        es: '¡Tu belleza está en tu espontaneidad y tu elegancia en la paz mental que vives! 🌅👑',
        ru: 'Твоя красота — в естественности, а элегантность — в душевном покое, которым ты живёшь! 🌅👑'
    },

    challenge: {
        ar: 'البنات، فـ الجولات المسائية: شكون كتعجبها العفوية د الجينز والهودي الكاجوال؟ ولا كتفضلوا الجلابة أو الكيمونو التقليدي؟ اختاري الستايل المفضل عندك فـ تعليق! 👟✨👇',
        en: 'Girls, for evening outings: who loves the easy spontaneity of jeans and a casual hoodie? Or do you prefer the traditional djellaba or kimono? Pick your favorite style in a comment! 👟✨👇',
        fr: 'Les filles, pour les sorties du soir : qui aime la spontanéité du jean et du hoodie décontracté ? Ou préférez-vous la djellaba ou le kimono traditionnel ? Choisissez votre style préféré en commentaire ! 👟✨👇',
        es: 'Chicas, para los paseos de la tarde: ¿a quién le gusta la espontaneidad de los vaqueros y la sudadera casual? ¿O prefieren la chilaba o el kimono tradicional? ¡Elijan su estilo favorito en un comentario! 👟✨👇',
        ru: 'Девушки, для вечерних прогулок: кому нравится непринуждённость джинсов и повседневного худи? Или вы предпочитаете джеллабу либо традиционное кимоно? Выберите любимый стиль в комментарии! 👟✨👇'
    },

    description: 'مكناس، ساحة الهديم وباب المنصور وقت الغروب الذهبي: باب المنصور الضخم بزليجه ونقوشه العريقة، ساحة مرصوفة بالحجر مليئة بالمارة والفوانيس، وأشعة غروب دافئة كتنعكس على الأرض. Robaty لابسة هودي كاجوال كريمي بطرز مغربي ملون (أزرق، أحمر، أصفر، أخضر) على طول الأكمام، وسروال جينز أزرق واسع بخصر عالٍ بطرز زليج أزرق تقليدي على الجوانب. فيدها الميكانيكية كاس أتاي مغربي بالنعناع، وعلى رقبتها المعدنية قلادة خميسة ذهبية/فضية بأحجار فيروزية، أساور فضية فاسية على المعصمين، حلقان تركوازية كبيرة متدلية، وحقيبة جلدية مطعمة بزليج مغربي بحزام بني وشرّابة. كتبتسم وراسها مايل وشعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 4,
    slot: 'am',
    image: 'day04-fes-morning.jpg',

    place: {
        ar: 'فاس — دار الدباغ شوارة',
        en: 'Fez — Chouara Tannery',
        fr: 'Fès — Tannerie Chouara',
        es: 'Fez — Curtiduría Chouara',
        ru: 'Фес — дубильни Шуара'
    },

    caption: {
        ar: `فاس، دار الدباغ شوارة وعرق الحرفيين والألوان الأصيلة 🎨✨
من هاد الشرفة المطلة على الأحواض، كتشوف فن الدباغة المغربية العريقة اللي باقي حي من قرون.
ريحة الجلد، حركة الصنّاع، وألوان الدباغ الطبيعية كيعطيو للمكان هيبة وتاريخ خاص.
اليوم اخترت Look أنيق كيمزج بين العصري والأصيل: جاكيت عنابي بجلد فاخر وطرز فاسي أبيض دقيق ✨
كيجي فخم ولابق مع روح فاس العريقة.. شنو رأيكم فـ هاد التناسق البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Fez, Chouara Tannery, the craftsmen’s hard work and authentic colors 🎨✨
From this terrace overlooking the vats, you see the art of ancient Moroccan tanning, still alive after centuries.
The smell of leather, the movement of the artisans, and the natural dye colors give the place a special prestige and history.
Today I chose an elegant look that blends modern and authentic: a burgundy jacket in fine leather with delicate white Fassi embroidery ✨
It feels luxurious and fits the spirit of old Fez... what do you think of this coordination, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Fès, la tannerie Chouara, le labeur des artisans et les couleurs authentiques 🎨✨
Depuis cette terrasse qui domine les cuves, on découvre l’art ancestral du tannage marocain, toujours vivant après des siècles.
L’odeur du cuir, le geste des artisans et les couleurs naturelles des teintures donnent au lieu une prestance et une histoire uniques.
Aujourd’hui, j’ai choisi un look élégant, entre moderne et authentique : une veste bordeaux en cuir raffiné avec une fine broderie fassie blanche ✨
Un look luxueux, à l’image de l’esprit de la Fès authentique... que pensez-vous de cette harmonie, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Fez, las curtidurías de Chouara, el trabajo de los artesanos y los colores auténticos 🎨✨
Desde esta terraza con vistas a las tinas, se ve el arte ancestral del curtido marroquí, que sigue vivo después de siglos.
El olor del cuero, el trabajo de los artesanos y los colores naturales de los tintes le dan al lugar una prestancia y una historia especiales.
Hoy elegí un look elegante que mezcla lo moderno y lo auténtico: una chaqueta burdeos de cuero fino con delicado bordado fasí blanco ✨
Se ve lujoso y acorde con el espíritu de la Fez auténtica... ¿qué opinan de la combinación, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Фес, дубильни Шуара, труд ремесленников и подлинные краски 🎨✨
С этой террасы над чанами видно древнее марокканское искусство дубления, которое живо и спустя века.
Запах кожи, движения мастеров и природные цвета красителей придают месту особое величие и историю.
Сегодня я выбрала элегантный образ, сочетающий современное и подлинное: бордовая куртка из роскошной кожи с тонкой белой фесской вышивкой ✨
Выглядит роскошно и созвучно духу старого Феса... как вам такое сочетание, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'أصالتك هي اللي كتميزك... خلي دائماً لمستك الخاصة كتشع فـ كل مكان! 👑✨',
        en: 'Your authenticity is what sets you apart... always let your own touch shine everywhere! 👑✨',
        fr: 'C’est ton authenticité qui te distingue... laisse toujours ta touche personnelle rayonner partout ! 👑✨',
        es: 'Tu autenticidad es lo que te distingue... ¡deja siempre que tu toque personal brille en todas partes! 👑✨',
        ru: 'Твоя подлинность — то, что отличает тебя... пусть твоя особая нотка всегда сияет повсюду! 👑✨'
    },

    challenge: {
        ar: 'البنات، فـ المنتوجات الجلدية المغربية الأصيلة: شكون فايت ليها شرات بلغة فاسية ولا صاك د الجلد من فاس القديمة؟ وشنو اللون المفضل عندكم فـ الجلد؟ شاركوني ذوقكم فـ تعليق! 👜👞👇',
        en: 'Girls, about authentic Moroccan leather goods: who has ever bought Fassi babouches or a leather bag from old Fez? And what is your favorite leather color? Share your taste in a comment! 👜👞👇',
        fr: 'Les filles, parlons des articles en cuir marocain authentique : qui a déjà acheté des babouches fassies ou un sac en cuir dans la vieille ville de Fès ? Et quelle est votre couleur de cuir préférée ? Partagez vos goûts en commentaire ! 👜👞👇',
        es: 'Chicas, hablemos de los productos de cuero marroquí auténtico: ¿quién ha comprado alguna vez babuchas fasíes o un bolso de cuero en la medina vieja de Fez? ¿Y cuál es su color de cuero favorito? ¡Compartan sus gustos en un comentario! 👜👞👇',
        ru: 'Девушки, об аутентичных марокканских кожаных изделиях: кто когда-нибудь покупал фесские бабуши или кожаную сумку в старом Фесе? И какой ваш любимый цвет кожи? Поделитесь вкусом в комментарии! 👜👞👇'
    },

    description: 'فاس، دار الدباغ شوارة فالمدينة القديمة: إطلالة من شرفة عالية بحاجز حديدي مزخرف على أحواض الدباغة المستديرة بألوانها الطبيعية (أحمر، أصفر، بني)، حرفيون كيخدمو وجلود معلقة، وأسطح المدينة القديمة وصومعة مسجد وجبال بعيدة تحت شمس الصباح الصافية. Robaty لابسة جاكيت جلدي طويل بالعنابي (البرغندي) بطرز فاسي أبيض ناصع على الحواف والأكمام، فوق توب حريري رمادي بياقة عالية، وبنطلون كريمي واسع. قلادة خميسة فضية بأحجار عنابية على رقبتها المعدنية، أقراط طويلة متدلية بأحجار عنابية، أساور فضية فاسية (دملج) على معصميها الميكانيكيين، وحقيبة جلدية مطرزة بنقوش مغربية على الكتف. كتبتسم وراسها مايل وشعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 4,
    slot: 'pm',
    image: 'day04-fes-evening.jpg',

    place: {
        ar: 'فاس — مدرسة العطارين',
        en: 'Fez — Al-Attarine Madrasa',
        fr: 'Fès — Médersa Al-Attarine',
        es: 'Fez — Madraza Al Attarine',
        ru: 'Фес — медресе Аль-Аттарин'
    },

    caption: {
        ar: `فاس، مدرسة العطارين وجمال الزليج الفاسي فـ العشية 💙✨
دقايق فـ هاد الفناء التاريخي كافية باش تبهرك بدقة الصنعة المغربية والنقش على الخشب والجبس.
هدوء المكان فـ هاد الوقت كيعطي قيمة خاصة لكل التفاصيل.
اليوم نسقت Look فخم بكيمونو مخملي بالبلو ملوكي وطرز ذهبي متناسق مع ألوان الزليج ✨
جاني أنيق وراقي لمساء العاصمة العلمية.. شنو نظركم البنات فـ هاد التناسق؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Fez, Al-Attarine Madrasa and the beauty of Fassi zellige in the evening 💙✨
A few minutes in this historic courtyard are enough to dazzle you with the precision of Moroccan craftsmanship and the carving in wood and plaster.
The calm of the place at this hour gives special value to every detail.
Today I styled a luxurious look with a royal-blue velvet kimono and gold embroidery that matches the colors of the zellige ✨
It feels elegant and refined for an evening in the capital of knowledge... what do you think of this coordination, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Fès, la médersa Al-Attarine et la beauté du zellige fassi en soirée 💙✨
Quelques minutes dans cette cour historique suffisent pour vous éblouir par la finesse de l’artisanat marocain et les sculptures sur bois et sur plâtre.
Le calme du lieu à cette heure donne une valeur particulière à chaque détail.
Aujourd’hui, j’ai composé un look somptueux avec un kimono en velours bleu roi et une broderie dorée assortie aux couleurs du zellige ✨
Élégant et raffiné pour une soirée dans la capitale du savoir... que pensez-vous de cette harmonie, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Fez, la Madraza Al Attarine y la belleza del zellige fasí al atardecer 💙✨
Unos minutos en este patio histórico bastan para deslumbrarte con la precisión de la artesanía marroquí y el tallado en madera y yeso.
La calma del lugar a esta hora da un valor especial a cada detalle.
Hoy combiné un look suntuoso con un quimono de terciopelo azul real y bordado dorado a juego con los colores del zellige ✨
Se ve elegante y refinado para una tarde en la capital del saber... ¿qué opinan de la combinación, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Фес, медресе Аль-Аттарин и красота фесского зелиджа вечером 💙✨
Нескольких минут в этом историческом дворе достаточно, чтобы поразить вас точностью марокканского мастерства и резьбой по дереву и гипсу.
Тишина этого места в такой час придаёт особую ценность каждой детали.
Сегодня я собрала роскошный образ: бархатное кимоно королевского синего цвета с золотой вышивкой в тон зелиджу ✨
Элегантно и изысканно для вечера в столице знаний... как вам такое сочетание, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'اهتمامك بالتفاصيل الصغيرة هو اللي كيعطي لشخصيتك قيمة كبيرة! 💎✨',
        en: 'Your attention to the little details is what gives your personality great value! 💎✨',
        fr: 'C’est ton attention aux petits détails qui donne une grande valeur à ta personnalité ! 💎✨',
        es: '¡Tu atención a los pequeños detalles es lo que le da un gran valor a tu personalidad! 💎✨',
        ru: 'Твоё внимание к мелочам — вот что придаёт твоей личности большую ценность! 💎✨'
    },

    challenge: {
        ar: 'البنات، فـ الإطلالات الفخمة د المساء: شكون كتعشق الأزرق الملوكي مع الذهبي؟ ولا كتفضلوا الخضر الملكي/الأحمر الجوهري؟ اختاري لونك المفضل فـ تعليق! 💙👑👇',
        en: 'Girls, for luxurious evening looks: who loves royal blue with gold? Or do you prefer royal green or jewel red? Pick your favorite color in a comment! 💙👑👇',
        fr: 'Les filles, pour les looks de soirée somptueux : qui adore le bleu roi avec l’or ? Ou préférez-vous le vert royal ou le rouge rubis ? Choisissez votre couleur préférée en commentaire ! 💙👑👇',
        es: 'Chicas, para los looks de noche más suntuosos: ¿a quién le encanta el azul real con dorado? ¿O prefieren el verde real o el rojo rubí? ¡Elijan su color favorito en un comentario! 💙👑👇',
        ru: 'Девушки, для роскошных вечерних образов: кто обожает королевский синий с золотым? Или вы предпочитаете королевский зелёный либо рубиново-красный? Выберите любимый цвет в комментарии! 💙👑👇'
    },

    description: 'فاس، فناء مدرسة العطارين فالمدينة القديمة وقت العشية/الغروب: فناء معماري أصيل بزليج فاسي أزرق وذهبي، نقش على الخشب والجبس، أقواس، نافورة رخامية، فوانيس مضيئة وإضاءة مسائية دافئة، وأرضية رخامية فسيفسائية لامعة. Robaty لابسة كيمونو/قفطان عصري من المخمل بالأزرق الملكي بطرز ذهبي (سفيفة وطرز النطع) على الحواف والأكمام، فوق توب حريري كريمي وبنطلون أبيض أنيق. قلادة خميسة فضية بأحجار زرقاء على رقبتها المعدنية، أقراط صغيرة متدلية زرقاء، أساور فضية فاسية (دملج) على معصميها الميكانيكيين، وحقيبة صغيرة مخملية زرقاء مطرزة بالذهب بشرّابة. كتبتسم وراسها مايل وشعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 5,
    slot: 'am',
    image: 'day05-casablanca-morning.jpg',

    place: {
        ar: 'الدار البيضاء — كورنيش عين الذئاب',
        en: 'Casablanca — Ain Diab Corniche',
        fr: 'Casablanca — Corniche d’Aïn Diab',
        es: 'Casablanca — Corniche de Ain Diab',
        ru: 'Касабланка — набережная Айн-Диаб'
    },

    caption: {
        ar: `كازا، نسيم عين الذئاب وطاقة صباح الأحد 🌊☕☀️
ما كاينش بحال دورة خفيفة على البحر فـ كازا بكري، كاس iced coffee فـ اليد والنسمة د المحيط كترد الروح!
الدار البيضاء دائماً عندها هاد الفايب الشبابي العصري والحيوي اللي كيعطيك إيجابية للأسبوع كامل.
اليوم بدلت الستايل كلياً: Look شبابي مريح بألوان الباستيل، جينز فاتح، كاسكيط، ولمسة مغربية خفيفة فـ الكيمونو ✨
جاني لوك كاجوال ومريح للويكاند.. كيف جاكم هاد الستايل الجديد البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Casa, the Ain Diab breeze and Sunday-morning energy 🌊☕☀️
Nothing beats a light stroll by the sea in Casa early in the morning, an iced coffee in hand and the ocean breeze reviving the soul!
Casablanca always has this youthful, modern, lively vibe that gives you positivity for the whole week.
Today I changed my style completely: a comfy youthful look in pastel colors, light jeans, a cap, and a light Moroccan touch in the kimono ✨
It's a casual, comfortable weekend look... how do you like this new style, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Casa, la brise d’Aïn Diab et l’énergie d’un dimanche matin 🌊☕☀️
Rien de tel qu’une petite balade au bord de la mer à Casa de bon matin, un iced coffee à la main et la brise de l’océan qui ressource l’âme !
Casablanca a toujours cette vibe jeune, moderne et vivante qui donne de la positivité pour toute la semaine.
Aujourd’hui, j’ai complètement changé de style : un look jeune et confortable aux couleurs pastel, jean clair, casquette, et une touche marocaine légère avec le kimono ✨
Un look décontracté et confortable pour le week-end... comment trouvez-vous ce nouveau style, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Casa, la brisa de Ain Diab y la energía de una mañana de domingo 🌊☕☀️
No hay nada como un paseo tranquilo junto al mar en Casa bien temprano, con un iced coffee en la mano y la brisa del océano que reconforta el alma.
Casablanca siempre tiene ese rollo juvenil, moderno y vibrante que te da positividad para toda la semana.
Hoy cambié de estilo por completo: un look juvenil y cómodo en colores pastel, vaqueros claros, gorra y un ligero toque marroquí en el quimono ✨
Un look casual y cómodo para el fin de semana... ¿qué les parece este nuevo estilo, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Каза, бриз Айн-Диаб и энергия воскресного утра 🌊☕☀️
Нет ничего лучше лёгкой прогулки у моря в Касе рано утром: айс-кофе в руке и океанский бриз, возвращающий душе силы!
У Касабланки всегда есть этот молодой, современный и живой вайб, который заряжает позитивом на всю неделю.
Сегодня я полностью сменила стиль: удобный молодёжный образ в пастельных тонах, светлые джинсы, кепка и лёгкий марокканский акцент в кимоно ✨
Повседневный и удобный образ для выходных... как вам этот новый стиль, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'خدي نفس عميق، استمتعي بصباحك، وابداي نهارك بطاقة جديدة وابتسامة! 🌊☕✨',
        en: 'Take a deep breath, enjoy your morning, and start your day with new energy and a smile! 🌊☕✨',
        fr: 'Respire à fond, savoure ton matin et commence ta journée avec une énergie nouvelle et un sourire ! 🌊☕✨',
        es: '¡Respira hondo, disfruta tu mañana y empieza el día con energía renovada y una sonrisa! 🌊☕✨',
        ru: 'Сделай глубокий вдох, наслаждайся утром и начни день с новой энергией и улыбкой! 🌊☕✨'
    },

    challenge: {
        ar: 'البنات، فـ الويكاند: شكون كتعشق الـ Street Style الكاجوال (جينز + كاسكيط + Iced Coffee) فـ البحر؟ ولا كتفضلوا القهوة التقليدية فـ بلاصة هادئة؟ شاركوني جوكم المفضل فـ تعليق! ☕🧢🌊👇',
        en: 'Girls, for the weekend: who loves a casual street style (jeans + cap + iced coffee) by the sea? Or do you prefer traditional coffee in a quiet spot? Share your favorite vibe in a comment! ☕🧢🌊👇',
        fr: 'Les filles, pour le week-end : qui adore le street style décontracté (jean + casquette + iced coffee) au bord de la mer ? Ou préférez-vous le café traditionnel dans un endroit calme ? Partagez votre ambiance préférée en commentaire ! ☕🧢🌊👇',
        es: 'Chicas, para el fin de semana: ¿a quién le encanta el street style casual (vaqueros + gorra + iced coffee) junto al mar? ¿O prefieren el café tradicional en un lugar tranquilo? ¡Compartan su ambiente favorito en un comentario! ☕🧢🌊👇',
        ru: 'Девушки, на выходных: кто обожает casual street style (джинсы + кепка + айс-кофе) у моря? Или вы предпочитаете традиционный кофе в тихом месте? Поделитесь любимой атмосферой в комментарии! ☕🧢🌊👇'
    },

    description: 'الدار البيضاء، كورنيش عين الذئاب صباح الأحد: ممشى رخامي حديث بنخيل ومظلات وكراسي مقاهي، سور أبيض بزجاج، شاطئ رملي وأمواج المحيط الأطلسي مع صومعة مسجد الحسن الثاني فالأفق، وسماء زرقاء صافية بشمس الصباح. Robaty ماشية وكتبتسم بستايل شبابي (Street Style): قميص كتان واسع أصفر باستيل مفتوح فوق كروب توب أبيض، سروال جينز أزرق فاتح واسع، وكيمونو أبيض خفيف بسفيفة مغربية زرقاء على الحواف، وسنيكرز بيضاء. كاسكيط بيج مطرزة بخميسة صغيرة ونظارات شمسية مرفوعة عليها، كاس iced coffee فيدها الميكانيكية، سلاسل فضية بخميسة على رقبتها المعدنية، أقراط فضية صغيرة، أساور فضية على المعصم، وقفة قش بحزام جلد بنية وشرّابة وخميسة صغيرة. شعرها بني طويل مسترسل تحت الكاسكيط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 5,
    slot: 'pm',
    image: 'day05-casablanca-evening.jpg',

    place: {
        ar: 'الدار البيضاء — موروكو مول',
        en: 'Casablanca — Morocco Mall',
        fr: 'Casablanca — Morocco Mall',
        es: 'Casablanca — Morocco Mall',
        ru: 'Касабланка — Марокко Молл'
    },

    caption: {
        ar: `مساء الأنوار من موروكو مول فـ كازا 💚✨
فـ هاد المساء، جيت نستمتع بالأجواء العصرية والتسوق فـ واحد من أكبر المراكز التجارية فـ إفريقيا.
الدار البيضاء دائماً كتمزج بين الحداثة والأناقة العالمية بأسلوب خاص.
اخترت اليوم لوك عصري بـ Blazer-Dress فـ الأخضر الزمردي بلمسات مغربية خفيفة فـ السفيفة، مع إكسسوارات جديدة وعصرية كملّو الأناقة ✨
كيف جاكم هاد الستايل المسائي البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good evening from Morocco Mall in Casa 💚✨
This evening, I came to enjoy the modern atmosphere and some shopping in one of the largest shopping centers in Africa.
Casablanca always blends modernity and global elegance in its own special way.
Today I chose a modern look: an emerald-green blazer dress with light Moroccan touches in the trim, plus fresh, contemporary accessories that complete the elegance ✨
How do you like this evening style, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonsoir depuis le Morocco Mall à Casa 💚✨
Ce soir, je suis venue profiter de l’ambiance moderne et du shopping dans l’un des plus grands centres commerciaux d’Afrique.
Casablanca mêle toujours modernité et élégance internationale à sa façon.
Aujourd’hui, j’ai choisi un look moderne : une robe-blazer vert émeraude avec de légères touches marocaines dans la passementerie, et des accessoires neufs et contemporains qui complètent l’élégance ✨
Comment trouvez-vous ce style de soirée, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenas noches desde el Morocco Mall en Casa 💚✨
Esta tarde vine a disfrutar del ambiente moderno y de las compras en uno de los centros comerciales más grandes de África.
Casablanca siempre combina modernidad y elegancia internacional a su manera.
Hoy elegí un look moderno: un vestido blazer verde esmeralda con ligeros toques marroquíes en la pasamanería, y accesorios nuevos y contemporáneos que completan la elegancia ✨
¿Qué les parece este estilo de noche, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Добрый вечер из Марокко Молла в Касе 💚✨
В этот вечер я пришла насладиться современной атмосферой и шопингом в одном из крупнейших торговых центров Африки.
Касабланка всегда соединяет современность и мировую элегантность по-своему.
Сегодня я выбрала современный образ: платье-блейзер изумрудно-зелёного цвета с лёгкими марокканскими акцентами в отделке и новые современные аксессуары, дополняющие элегантность ✨
Как вам этот вечерний стиль, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'الثقة بالنفس هي أجمل فستان تقدري تلبسيه... قوتك فـ أنك تكوني نتي! 👑✨',
        en: 'Self-confidence is the most beautiful dress you can wear... your strength is in being yourself! 👑✨',
        fr: 'La confiance en soi est la plus belle robe que tu puisses porter... ta force, c’est d’être toi-même ! 👑✨',
        es: 'La confianza en ti misma es el vestido más hermoso que puedes llevar... ¡tu fuerza está en ser tú misma! 👑✨',
        ru: 'Уверенность в себе — самое красивое платье, которое ты можешь надеть... твоя сила — быть собой! 👑✨'
    },

    challenge: {
        ar: 'البنات، فـ الخرجات المسائية د التسوق: شكون كتعجبها الإكسسوارات العصرية الموديرن (Mesh Cuff وأقراط الزمرد)؟ ولا الدماليج المغربية التقليدية هي التوب عندك؟ شاركوني رأيكم فـ تعليق! 💚🛍️👇',
        en: 'Girls, for evening shopping outings: who loves modern accessories (a mesh cuff and emerald earrings)? Or are traditional Moroccan bangles still your top pick? Share your opinion in a comment! 💚🛍️👇',
        fr: 'Les filles, pour les sorties shopping du soir : qui aime les accessoires modernes (manchette mesh et boucles d’oreilles émeraude) ? Ou les bracelets marocains traditionnels restent-ils votre favori ? Partagez votre avis en commentaire ! 💚🛍️👇',
        es: 'Chicas, para las salidas de compras por la noche: ¿a quién le gustan los accesorios modernos (brazalete mesh y pendientes de esmeralda)? ¿O las pulseras marroquíes tradicionales siguen siendo su favorito? ¡Compartan su opinión en un comentario! 💚🛍️👇',
        ru: 'Девушки, для вечернего шопинга: кому нравятся современные аксессуары (манжета-сетка и изумрудные серьги)? Или традиционные марокканские браслеты по-прежнему вне конкуренции? Поделитесь мнением в комментарии! 💚🛍️👇'
    },

    description: 'الدار البيضاء، الفناء الداخلي لموروكو مول وقت المساء: أرضية رخامية لامعة كتعكس الأضواء، لافتة "Morocco Mall" فالأعلى، واجهات محلات عالمية (منها ZARA) فالجهة اليسرى، ممر بحاجز زجاجي وخشبي فالجهة اليمنى، نخيل داخلي، زوار فالخلفية، وإضاءة دافئة عصرية. Robaty واقفة وكتبتسم وراسها مايل، ويدها الميكانيكية الفضية اليمنى مرفوعة قرب الشعر واليسرى نازلة قرب الخصر. لابسة Blazer-Dress من الستان بالأخضر الزمردي بسفيفة ذهبية دقيقة على الياقة والحواف وزر ذهبي، فوق توب أبيض/كريمي بياقة عالية وجوارب بيضاء. قلادة خميسة ذهبية بحجر زمردي على رقبتها المعدنية الفضية، أقراط ذهبية متدلية مستطيلة بحجر زمردي، سوار عصري ذهبي عريض (Mesh Cuff) وأساور ذهبية رقيقة على معصميها الميكانيكيين (بدل الدماليج التقليدية)، وحقيبة جلد خضراء غامقة بسلسلة ذهبية على الكتف. شعرها طويل مموج بني بخصلات فاتحة.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 6,
    slot: 'am',
    image: 'day06-rabat-morning.jpg',

    place: {
        ar: 'الرباط — قصبة الأوداية',
        en: 'Rabat — Kasbah of the Udayas',
        fr: 'Rabat — Kasbah des Oudayas',
        es: 'Rabat — Kasbah de los Oudaya',
        ru: 'Рабат — Касба Удайя'
    },

    caption: {
        ar: `الرباط، سحر قصبة الأوداية ونسيم الأطلسي فـ صباح جديد 🌊💙✨
المشي فـ هاد الأزقة المصبوغة بالأزرق والأبيض كيعطيك إحساس بالهدوء والسكينة.
الرباط دائماً عندها هيبة خاصة كتمزج بين رقي العاصمة والأصالة المغربية.
اليوم اخترت Look خريفي ناعم بكونسبت أزرق سماوي وأبيض مع طرز نطع ناعم فـ الجاكيت ✨
تناسق مريح وأنيق للخرجات الصباحية.. شنو رأيكم فـ هاد الألوان البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Rabat, the charm of the Kasbah of the Udayas and the Atlantic breeze on a fresh morning 🌊💙✨
Walking through these blue-and-white painted lanes gives you a feeling of calm and serenity.
Rabat always has a special prestige, blending the refinement of a capital with Moroccan authenticity.
Today I chose a soft autumn look with a sky-blue and white concept, with delicate embroidery on the jacket ✨
A comfortable, elegant coordination for morning outings... what do you think of these colors, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Rabat, le charme de la Kasbah des Oudayas et la brise de l’Atlantique en ce nouveau matin 🌊💙✨
Se promener dans ces ruelles peintes en bleu et blanc procure une sensation de calme et de sérénité.
Rabat a toujours une prestance particulière, entre le raffinement d’une capitale et l’authenticité marocaine.
Aujourd’hui, j’ai choisi un look automnal tout en douceur, dans un esprit bleu ciel et blanc, avec une fine broderie sur la veste ✨
Une harmonie confortable et élégante pour les sorties du matin... que pensez-vous de ces couleurs, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Rabat, el encanto de la Kasbah de los Oudaya y la brisa del Atlántico en una nueva mañana 🌊💙✨
Pasear por estos callejones pintados de azul y blanco te transmite calma y serenidad.
Rabat siempre tiene una prestancia especial que mezcla la distinción de una capital con la autenticidad marroquí.
Hoy elegí un look otoñal suave con un concepto azul cielo y blanco, con un delicado bordado en la chaqueta ✨
Una combinación cómoda y elegante para los paseos matutinos... ¿qué opinan de estos colores, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Рабат, очарование касбы Удайя и атлантический бриз в новое утро 🌊💙✨
Прогулка по этим переулкам, выкрашенным в синий и белый, дарит ощущение спокойствия и умиротворения.
У Рабата всегда особое величие: он сочетает изысканность столицы и марокканскую подлинность.
Сегодня я выбрала нежный осенний образ в небесно-голубых и белых тонах с тонкой вышивкой на жакете ✨
Удобное и элегантное сочетание для утренних прогулок... как вам эти цвета, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'طموحة، قوية، وما كترضاش بالأقل... هكا كتتقدمي كل يوم نحو الأفضل! ⚡🌊',
        en: 'Ambitious, strong, and never settling for less... that is how you move toward the best every day! ⚡🌊',
        fr: 'Ambitieuse, forte, et jamais satisfaite de moins... c’est ainsi que tu avances chaque jour vers le meilleur ! ⚡🌊',
        es: 'Ambiciosa, fuerte y nunca conforme con menos... ¡así avanzas cada día hacia lo mejor! ⚡🌊',
        ru: 'Целеустремлённая, сильная и никогда не довольствующаяся меньшим... так ты каждый день идёшь к лучшему! ⚡🌊'
    },

    challenge: {
        ar: 'البنات، فـ جولات الرباط الصباحية: شكون كتعجبها قصبة الأوداية والقهوة المطلة على أبي رقراق؟ ولا كتفضلوا جولة فـ صومعة حسان وشوارع المدينة؟ شاركوني مكانكم المفضل فـ الرباط فـ تعليق! ☕💙👇',
        en: 'Girls, for Rabat morning strolls: who loves the Kasbah of the Udayas and the café overlooking the Bou Regreg? Or do you prefer a walk around the Hassan Tower and the city streets? Share your favorite spot in Rabat in a comment! ☕💙👇',
        fr: 'Les filles, pour les balades matinales à Rabat : qui aime la Kasbah des Oudayas et le café qui domine le Bouregreg ? Ou préférez-vous une promenade vers la Tour Hassan et les rues de la ville ? Partagez votre endroit préféré à Rabat en commentaire ! ☕💙👇',
        es: 'Chicas, para los paseos matutinos por Rabat: ¿a quién le gusta la Kasbah de los Oudaya y el café con vistas al Bou Regreg? ¿O prefieren pasear por la Torre Hassan y las calles de la ciudad? ¡Compartan su lugar favorito de Rabat en un comentario! ☕💙👇',
        ru: 'Девушки, для утренних прогулок по Рабату: кому нравится касба Удайя и кафе с видом на Бу-Регрег? Или вы предпочитаете прогулку у башни Хассана и по улицам города? Поделитесь любимым местом в Рабате в комментарии! ☕💙👇'
    },

    description: 'الرباط، أزقة قصبة الأوداية وقت الصباح المشمس: حيوط بيضاء مصبوغة بالأزرق من تحت، باب أزرق مسمّر بالرقم 12، أصص كبيرة زرقاء بنباتات خضراء، فوانيس مضيئة معلقة على الحيوط، بوغنفيليا وردية-فوشيا مزهرة، شرفة زرقاء، وزقاق مرصوف بالحجر نازل نحو المحيط الأزرق مع نخلة فالبعيد وسماء صافية. Robaty واقفة وكتبتسم وراسها مايل، يد فجيب البنطلون والأخرى الميكانيكية الفضية كتحمل الحقيبة. لابسة بلايزر من الكتان بالأزرق السماوي الفاتح (Powder Blue) بطرز أبيض/فضي ناعم على الياقة والحواف والأكمام، فوق توب حريري أبيض بياقة عالية وبنطلون أبيض واسع بخصر عالي. قلادة خميسة فضية بحجر فيروزي أزرق على رقبتها المعدنية الفضية، أقراط متدلية زرقاء على شكل دمعة، أساور رقيقة ذهبية/فضية متراكمة على معصميها الميكانيكيين، وحقيبة يد صغيرة محبوكة (منسوجة) بلون كريمي بتفصيل ذهبي. شعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 6,
    slot: 'pm',
    image: 'day06-rabat-evening.jpg',

    place: {
        ar: 'الرباط — مارينا أبي رقراق',
        en: 'Rabat — Bouregreg Marina',
        fr: 'Rabat — Marina du Bouregreg',
        es: 'Rabat — Marina del Bouregreg',
        ru: 'Рабат — Марина Бу-Регрег'
    },

    caption: {
        ar: `مساء الأنوار والهدوء من ضفاف أبي رقراق فـ الرباط 💙🌙✨
الرباط فـ الليل عندها سحر هادئ وفخم.. الأضواء المنعكسة على الواد مع نسيم البحر كيعطيو أجواء راقية جداً.
اخترت لهاد المساء Look مخملي فـ الأزرق الداكن بلمسات ذهبية عصرية ومغربية فـ نفس الوقت ✨
كيف جاكم هاد التناسق بين الأزرق الداكن والذهبي؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good evening, with calm and light, from the banks of the Bou Regreg in Rabat 💙🌙✨
At night Rabat has a quiet, luxurious charm... the lights reflected on the river and the sea breeze create a very refined atmosphere.
For this evening I chose a navy velvet look with gold touches that are modern and Moroccan at the same time ✨
How do you like this coordination between midnight blue and gold? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonsoir, dans le calme et les lumières, depuis les rives du Bouregreg à Rabat 💙🌙✨
La nuit, Rabat a un charme paisible et somptueux... les lumières qui se reflètent sur le fleuve et la brise marine créent une ambiance très raffinée.
Pour cette soirée, j’ai choisi un look en velours bleu nuit avec des touches dorées à la fois modernes et marocaines ✨
Que pensez-vous de cette harmonie entre le bleu nuit et l’or ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenas noches, con calma y luces, desde las orillas del Bou Regreg en Rabat 💙🌙✨
De noche Rabat tiene un encanto tranquilo y suntuoso... las luces reflejadas en el río y la brisa marina crean un ambiente muy refinado.
Para esta noche elegí un look de terciopelo azul oscuro con toques dorados modernos y marroquíes a la vez ✨
¿Qué les parece esta combinación entre el azul oscuro y el dorado? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Добрый вечер, полный спокойствия и огней, с берегов Бу-Регрег в Рабате 💙🌙✨
Ночью у Рабата тихое и роскошное очарование... огни, отражающиеся в реке, и морской бриз создают очень изысканную атмосферу.
На этот вечер я выбрала бархатный образ тёмно-синего цвета с золотыми акцентами — одновременно современными и марокканскими ✨
Как вам это сочетание тёмно-синего и золотого? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'قيمتك كتحددها رؤيتك لنفسك... آمني بقدراتك وما توقفيش عند حد! 💎🔥',
        en: 'Your worth is defined by how you see yourself... believe in your abilities and never stop at any limit! 💎🔥',
        fr: 'Ta valeur se définit par le regard que tu portes sur toi-même... crois en tes capacités et ne t’arrête devant aucune limite ! 💎🔥',
        es: 'Tu valor lo define la forma en que te ves a ti misma... ¡cree en tus capacidades y no te detengas ante ningún límite! 💎🔥',
        ru: 'Твою ценность определяет то, как ты видишь себя... верь в свои способности и не останавливайся ни перед какими границами! 💎🔥'
    },

    challenge: {
        ar: 'البنات، فـ الخرجات المسائية د الرباط: شكون كتعجبها الممشى العصري فـ المارينا؟ ولا كتفضلوا القهوة المريحة المطلة على الواد فـ قصبة الأوداية؟ شاركوني جلساتكم المفضلة فـ الرباط فـ تعليق! 💙☕👇',
        en: 'Girls, for evening outings in Rabat: who loves the modern promenade at the marina? Or do you prefer the cozy café overlooking the river in the Kasbah of the Udayas? Share your favorite spots in Rabat in a comment! 💙☕👇',
        fr: 'Les filles, pour les sorties du soir à Rabat : qui aime la promenade moderne de la marina ? Ou préférez-vous le café cosy qui domine le fleuve dans la Kasbah des Oudayas ? Partagez vos endroits préférés à Rabat en commentaire ! 💙☕👇',
        es: 'Chicas, para las salidas nocturnas en Rabat: ¿a quién le gusta el paseo moderno de la marina? ¿O prefieren el café acogedor con vistas al río en la Kasbah de los Oudaya? ¡Compartan sus rincones favoritos de Rabat en un comentario! 💙☕👇',
        ru: 'Девушки, для вечерних прогулок по Рабату: кому нравится современная набережная марины? Или вы предпочитаете уютное кафе с видом на реку в касбе Удайя? Поделитесь любимыми местами в Рабате в комментарии! 💙☕👇'
    },

    description: 'الرباط، ممشى مارينا أبي رقراق وقت الليل (الساعة الزرقاء): ممشى عصري مبلط بإنارة مصابيح دافئة وأحواض نباتات خضراء، حاجز معدني على الواد فالجهة اليمنى، مياه أبي رقراق كتعكس الأضواء، يخت أبيض راسي، قنطرة مضيئة بالأزرق، قصبة الأوداية مضيئة بالذهبي فالجهة اليسرى، ومبنى المسرح الكبير للرباط مضاء فالبعيد مع نخيل وسماء زرقاء داكنة. Robaty واقفة وكتبتسم وراسها مايل، يد ميكانيكية مرفوعة قرب الشعر والأخرى نازلة قرب الخصر. لابسة جاكيت مسائي من المخمل بالأزرق الداكن (Midnight Blue) بسفيفة وعقاد ذهبي مطفي على الياقة والحواف والأكمام، مخصّر بحزام ذهبي رقيق بإبزيم مزخرف، فوق توب أسود بياقة عالية وبنطلون أسود كلاسيكي واسع. قلادة خميسة ذهبية بحجر أزرق (ياقوت أزرق) على رقبتها المعدنية الفضية، أقراط ذهبية طويلة متدلية بشكل هندسي، أساور ذهبية/فضية متراكمة على معصميها الميكانيكيين، وحقيبة مخملية زرقاء داكنة صغيرة بسلسلة ذهبية وخميسة ذهبية على واجهتها. شعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 7,
    slot: 'am',
    image: 'day07-marrakech-morning.jpg',

    place: {
        ar: 'مراكش — حدائق الماجوريل',
        en: 'Marrakech — Majorelle Garden',
        fr: 'Marrakech — Jardin Majorelle',
        es: 'Marrakech — Jardín Majorelle',
        ru: 'Марракеш — сад Мажорель'
    },

    caption: {
        ar: `صباح البهجة والألوان المشرقة من مراكش الحمراء ☀️🌴✨
الصباح فـ حدائق الماجوريل كيعطيك راحة نفسية وطاقة إيجابية عجيبة بين الأزرق الساحر والنباتات الاستوائية.
اليوم قررت نفاجيكم بلمسة مراكشية أصيلة 100%.. جربت "الطاقية المراكشية المطرزة" بأسلوب عصري مع Look كتان خفيف وسهل للخرجات الصباحية ✨
شنو رأيكم فـ هاد اللمسة المراكشية فـ الطاقية البنات؟ جات متناسقة؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good morning, full of joy and bright colors, from Red Marrakech ☀️🌴✨
Mornings in the Majorelle Garden bring a wonderful sense of peace and positive energy, between the enchanting blue and the tropical plants.
Today I decided to surprise you with a 100% authentic Marrakchi touch... I tried the embroidered "Marrakchi taqiya" cap in a modern way, with a light linen look that's easy for morning outings ✨
What do you think of this Marrakchi touch with the cap, girls? Does it work well together? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonjour plein de joie et de couleurs vives depuis Marrakech la Rouge ☀️🌴✨
Le matin dans le Jardin Majorelle procure un bien-être et une énergie positive étonnants, entre le bleu envoûtant et les plantes tropicales.
Aujourd’hui, j’ai décidé de vous surprendre avec une touche marrakchie 100 % authentique... j’ai essayé la « taqiya marrakchie » brodée à la façon moderne, avec un look en lin léger et facile pour les sorties du matin ✨
Que pensez-vous de cette touche marrakchie avec la taqiya, les filles ? L’ensemble est-il harmonieux ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenos días llenos de alegría y colores brillantes desde Marrakech la Roja ☀️🌴✨
La mañana en el Jardín Majorelle te regala una paz interior y una energía positiva increíbles, entre el azul fascinante y las plantas tropicales.
Hoy decidí sorprenderlas con un toque marrakchí 100 % auténtico... probé el «gorro marrakchí bordado» (taqiya) con un estilo moderno y un look de lino ligero y fácil para los paseos matutinos ✨
¿Qué opinan de este toque marrakchí con el gorro, chicas? ¿Combina bien? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Доброе утро, полное радости и ярких красок, из Красного Марракеша ☀️🌴✨
Утро в саду Мажорель дарит удивительное спокойствие и заряд позитива — среди волшебной синевы и тропических растений.
Сегодня я решила удивить вас подлинным марракешским акцентом на все 100%... я примерила вышитую марракешскую тагию (шапочку) в современном стиле с лёгким льняным образом для утренних прогулок ✨
Как вам этот марракешский акцент в виде шапочки, девушки? Получилось гармонично? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'الأصالة ماشي هي الماضي... الأصالة هي أنك تزيدي لمستك الخاصة وتخلّي الهوية ديالك تضوي! 👑🔴✨',
        en: 'Authenticity is not the past... authenticity is adding your own touch and letting your identity shine! 👑🔴✨',
        fr: 'L’authenticité, ce n’est pas le passé... c’est ajouter ta touche personnelle et laisser ton identité briller ! 👑🔴✨',
        es: 'La autenticidad no es el pasado... ¡es añadir tu toque personal y dejar que tu identidad brille! 👑🔴✨',
        ru: 'Подлинность — это не прошлое... это когда ты добавляешь свою особую нотку и позволяешь своей идентичности сиять! 👑🔴✨'
    },

    challenge: {
        ar: 'البنات، فـ جولات مراكش الصباحية: شكون كتعجبها هدوء الألوان فـ حدائق الماجوريل وقصر الباهية؟ ولا كتفضلوا التسوق فـ أزقة القيسارية والأسواق القديمة؟ شاركوني بقعتكم المفضلة فـ مراكش فـ تعليق! 🌴☕👇',
        en: 'Girls, for Marrakech morning outings: who loves the calm colors of the Majorelle Garden and Bahia Palace? Or do you prefer shopping in the lanes of the Qissaria and the old souks? Share your favorite spot in Marrakech in a comment! 🌴☕👇',
        fr: 'Les filles, pour les balades matinales à Marrakech : qui aime le calme des couleurs du Jardin Majorelle et du Palais de la Bahia ? Ou préférez-vous faire du shopping dans les ruelles de la Kissaria et des vieux souks ? Partagez votre endroit préféré à Marrakech en commentaire ! 🌴☕👇',
        es: 'Chicas, para los paseos matutinos por Marrakech: ¿a quién le gusta la calma de los colores del Jardín Majorelle y del Palacio de la Bahía? ¿O prefieren ir de compras por los callejones de la Qissaria y los zocos antiguos? ¡Compartan su rincón favorito de Marrakech en un comentario! 🌴☕👇',
        ru: 'Девушки, для утренних прогулок по Марракешу: кому нравится спокойствие красок сада Мажорель и дворца Баия? Или вы предпочитаете шопинг в переулках Кайсарии и на старых рынках? Поделитесь любимым местом в Марракеше в комментарии! 🌴☕👇'
    },

    description: 'مراكش، حدائق الماجوريل وقت الصباح المشمس: المبنى الأزرق الماجوريل بستائر وتفاصيل صفراء وشرفة بمشربيات خشبية، صبار استوائي ضخم، نخيل، بوغنفيليا وردية، أصيص فخاري أصفر كبير، نافورة وحوض بالأزرق الماجوريل فالجهة اليمنى، وأرضية زليج مغربي أزرق وأخضر. Robaty واقفة وكتبتسم وراسها مايل، يدها الميكانيكية اليمنى مرفوعة قرب شعرها واليسرى نازلة قرب الخصر. لابسة طاقية مراكشية فاخرة بلون بيج عاجي بطرز ذهبي هندسي دقيق، مائلة شوية على جنب الراس فوق شعرها البني المموج. بلايزر طويل مفتوح من الكتان بالأبيض العاجي (Ecru) بطرز مراكشي ذهبي ناعم على الياقة والحواف والأكمام، فوق توب أبيض بياقة عالية وبنطلون كتان واسع بخصر عالي بنفس لون البلايزر. قلادة خميسة فضية بحجر فيروزي أزرق على رقبتها المعدنية الفضية، أقراط ذهبية دائرية (Hoops) متوسطة، وحقيبة قش منسوجة بلون ذهبي بسلسلة ذهبية وشراشيب ذهبية وخميسات صغيرة معلقة. يديها الميكانيكيتين الفضيتين ظاهرين مع أساور فضية رقيقة على المعصمين. شعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 7,
    slot: 'pm',
    image: 'day07-marrakech-evening.jpg',

    place: {
        ar: 'مراكش — ساحة جامع الفنا',
        en: 'Marrakech — Jemaa el-Fnaa',
        fr: 'Marrakech — Place Jemaa el-Fna',
        es: 'Marrakech — Plaza Jemaa el-Fna',
        ru: 'Марракеш — площадь Джемаа-эль-Фна'
    },

    caption: {
        ar: `مساء البهجة والنور من قلب مراكش وسحر جامع الفنا 🔴🌅✨
ما كاينش بحال غروب مراكش من فوق السطوح.. الساحة كتحيا والأضواء كتشعل، مع صومعة الكتبية الشامخة فـ الأفق.
مراكش عندها طاقة فريدة من نوعها كتعطيك الحياة والبهجة فـ كل لحظة!
اخترت اليوم لوك بلون أحمر مرجاني دافئ مستوحى من لون المباني الحمراء د مراكش مع لمسة ذهبية فخمة ✨
كيف جاكم هاد الستايل المراكشي العصري البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good evening, with joy and light, from the heart of Marrakech and the magic of Jemaa el-Fnaa 🔴🌅✨
Nothing compares to a Marrakech sunset from the rooftops... the square comes alive and the lights switch on, with the proud Koutoubia minaret on the horizon.
Marrakech has a one-of-a-kind energy that gives you life and joy in every moment!
Today I chose a warm coral-red look inspired by the color of Marrakech's red buildings, with a luxurious touch of gold ✨
How do you like this modern Marrakchi style, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonsoir, plein de joie et de lumière, depuis le cœur de Marrakech et la magie de Jemaa el-Fna 🔴🌅✨
Rien ne vaut un coucher de soleil à Marrakech depuis les toits... la place s’anime et les lumières s’allument, avec le majestueux minaret de la Koutoubia à l’horizon.
Marrakech a une énergie unique qui vous donne vie et joie à chaque instant !
Aujourd’hui, j’ai choisi un look rouge corail chaleureux, inspiré de la couleur des bâtiments rouges de Marrakech, avec une somptueuse touche dorée ✨
Comment trouvez-vous ce style marrakchi moderne, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenas noches, con alegría y luz, desde el corazón de Marrakech y la magia de Jemaa el-Fna 🔴🌅✨
No hay nada como un atardecer en Marrakech desde las azoteas... la plaza cobra vida y las luces se encienden, con el majestuoso minarete de la Kutubía en el horizonte.
Marrakech tiene una energía única que te da vida y alegría en cada momento.
Hoy elegí un look en rojo coral cálido, inspirado en el color de los edificios rojos de Marrakech, con un lujoso toque dorado ✨
¿Qué les parece este estilo marrakchí moderno, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Добрый вечер, полный радости и света, из самого сердца Марракеша и волшебства площади Джемаа-эль-Фна 🔴🌅✨
Нет ничего лучше марракешского заката с крыш... площадь оживает, зажигаются огни, а на горизонте возвышается минарет Кутубия.
У Марракеша уникальная энергия, которая дарит жизнь и радость в каждый миг!
Сегодня я выбрала образ тёплого кораллово-красного цвета, вдохновлённый цветом красных зданий Марракеша, с роскошным золотым акцентом ✨
Как вам этот современный марракешский стиль, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'الجمال الخارجي يجذب... لكن الأناقة تأسر! ⚡🔴✨',
        en: 'Outer beauty attracts... but elegance captivates! ⚡🔴✨',
        fr: 'La beauté extérieure attire... mais l’élégance captive ! ⚡🔴✨',
        es: 'La belleza exterior atrae... ¡pero la elegancia cautiva! ⚡🔴✨',
        ru: 'Внешняя красота привлекает... но элегантность пленяет! ⚡🔴✨'
    },

    challenge: {
        ar: 'البنات، فـ جلسات مراكش المسائية: شكون كتعشق الجلوس فـ التراسات المطلة على جامع الفنا فـ وقت الغروب؟ ولا كتفضلوا الجولات الهادئة فـ حدائق الماجوريل والمنارة؟ شاركوني مكانكم المفضل فـ المدينة الحمراء فـ تعليق! 🔴☕👇',
        en: 'Girls, for Marrakech evening hangouts: who loves sitting on the terraces overlooking Jemaa el-Fnaa at sunset? Or do you prefer quiet strolls in the Majorelle and Menara gardens? Share your favorite spot in the Red City in a comment! 🔴☕👇',
        fr: 'Les filles, pour les soirées à Marrakech : qui adore s’installer sur les terrasses qui dominent Jemaa el-Fna au coucher du soleil ? Ou préférez-vous les balades tranquilles dans les jardins Majorelle et de la Ménara ? Partagez votre endroit préféré dans la Ville Rouge en commentaire ! 🔴☕👇',
        es: 'Chicas, para las veladas en Marrakech: ¿a quién le encanta sentarse en las terrazas con vistas a Jemaa el-Fna al atardecer? ¿O prefieren los paseos tranquilos por los jardines Majorelle y de la Menara? ¡Compartan su lugar favorito de la Ciudad Roja en un comentario! 🔴☕👇',
        ru: 'Девушки, для вечеров в Марракеше: кто обожает сидеть на террасах с видом на Джемаа-эль-Фна на закате? Или вы предпочитаете тихие прогулки по садам Мажорель и Менара? Поделитесь любимым местом в Красном городе в комментарии! 🔴☕👇'
    },

    description: 'مراكش، تراس بانورامي مفتوح مطل على ساحة جامع الفنا وقت الغروب الذهبي: صومعة الكتبية مضاءة بالذهبي فالجهة اليمنى والشمس كتغرب وراها، الساحة من فوق مليئة بالناس وبأكشاك وخيام حمراء وبرتقالية مضيئة، عربات خيل خضراء، نخيل، جبال الأطلس الضبابية فالأفق، وسماء متدرجة بالبرتقالي والوردي. فالتراس: فانوس نحاسي مضاء بشمعة فالجهة اليسرى وآخر أصغر فاليمنى، طاولة نحاسية مزخرفة عليها صينية وكاس أتاي بالنعناع، وسادات مغربية بنقوش حمراء وسوداء، بوف جلدي بني، أصص فخارية بنباتات، وحاجز معدني. Robaty واقفة وكتبتسم وراسها مايل، يدها الميكانيكية اليمنى مرفوعة قرب شعرها واليسرى نازلة قرب الخصر. لابسة بلايزر مسائي بالأحمر الآجري/المرجاني (Terracotta Red) بسفيفة وعقاد ذهبي مطفي على الياقة والحواف والأكمام، مخصّر بحزام ذهبي رقيق بإبزيم مزخرف، فوق توب بيج بياقة عالية وبنطلون بيج واسع بخصر عالي، وسلسلة ذهبية ظاهرة على جنبها (الحقيبة غير ظاهرة). قلادة خميسة ذهبية بحجر أحمر مرجاني على رقبتها المعدنية الفضية، أقراط ذهبية دائرية (Hoops)، وأساور فضية متراكمة على اليد المرفوعة وسوار ذهبي عريض على المعصم الآخر. شعرها طويل مموج بني.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 8,
    slot: 'am',
    image: 'day08-merzouga-morning.jpg',

    place: {
        ar: 'مرزوقة — كثبان عرق الشبي',
        en: 'Merzouga — Erg Chebbi Dunes',
        fr: 'Merzouga — Dunes de l’Erg Chebbi',
        es: 'Merzouga — Dunas de Erg Chebbi',
        ru: 'Мерзуга — дюны Эрг-Шебби'
    },

    caption: {
        ar: `صباح الطاقة والحرية من وسط كثبان مرزوقة الذهبية ☀️🏜️💙
الصباح فـ الصحراء عندو طعم آخر.. هواء نقي، شمس مشرقة، وأفق واسع كيخليك تحسي بأن العالم كامل قدامك!
اليوم اخترت نخرج على المألوف بستايل دراعة صحراوية حريرية بالأزرق السماوي مع الفضة الأصيلة والعمامة البيضاء 👑✨
كيف جاتكم هاد اللمسة الصحراوية الصباحية البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good morning, full of energy and freedom, from the golden dunes of Merzouga ☀️🏜️💙
Mornings in the desert have a different taste... pure air, bright sun, and a wide horizon that makes you feel the whole world is in front of you!
Today I chose to step completely out of the ordinary with a Saharan silk daraa in sky blue, authentic silver, and a white turban 👑✨
How do you like this morning desert touch, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonjour plein d’énergie et de liberté depuis les dunes dorées de Merzouga ☀️🏜️💙
Le matin dans le désert a une saveur différente... un air pur, un soleil éclatant et un horizon immense qui donne l’impression que le monde entier s’ouvre devant vous !
Aujourd’hui, j’ai choisi de sortir complètement de l’ordinaire avec une daraa saharienne en soie bleu ciel, de l’argent authentique et un turban blanc 👑✨
Que pensez-vous de cette touche saharienne du matin, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenos días llenos de energía y libertad desde las doradas dunas de Merzouga ☀️🏜️💙
La mañana en el desierto tiene otro sabor... aire puro, sol brillante y un horizonte inmenso que te hace sentir que el mundo entero está frente a ti.
Hoy elegí salirme por completo de lo habitual con una daraa sahariana de seda azul cielo, plata auténtica y un turbante blanco 👑✨
¿Qué les parece este toque desértico matutino, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Доброе утро, полное энергии и свободы, с золотых дюн Мерзуги ☀️🏜️💙
Утро в пустыне имеет особый вкус... чистый воздух, яркое солнце и широкий горизонт, из-за которого кажется, что весь мир лежит перед тобой!
Сегодня я решила полностью выйти за привычные рамки: шёлковая сахарская дарраа небесно-голубого цвета, настоящее серебро и белый тюрбан 👑✨
Как вам этот утренний пустынный акцент, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'جدّدي طاقتك، غيّري خططك، وكوني دائماً أكبر من التوقعات... الصباح ديالك وبدايتك نتي اللي كترسميها! ☀️💙✨',
        en: 'Renew your energy, change your plans, and always be bigger than expectations... your morning is yours, and your beginning is yours to draw! ☀️💙✨',
        fr: 'Renouvelle ton énergie, change tes plans et sois toujours au-delà des attentes... ce matin est le tien, et ton début, c’est toi qui le dessines ! ☀️💙✨',
        es: 'Renueva tu energía, cambia tus planes y sé siempre más grande que las expectativas... ¡tu mañana es tuya y tu comienzo lo dibujas tú! ☀️💙✨',
        ru: 'Обнови свою энергию, измени планы и будь всегда выше ожиданий... это утро — твоё, а своё начало рисуешь ты сама! ☀️💙✨'
    },

    challenge: {
        ar: 'البنات، فـ الجولات والرحلات: شكون كتعجبها تجرب اللباس التقليدي ديال كل جهة فـ المغرب (بحال الدراعة، الملحفة، القفطان، الجلابة..)؟ شاركوني أكثر لباس تقليدي مغربي كيعجبكم وكتلبسوه فـ سفركم! 👗🇲🇦👇',
        en: 'Girls, for outings and trips: who loves trying the traditional clothing of each region of Morocco (like the daraa, the melhfa, the kaftan, the djellaba...)? Share the traditional Moroccan outfit you love most and wear on your travels! 👗🇲🇦👇',
        fr: 'Les filles, pour les sorties et les voyages : qui aime essayer les tenues traditionnelles de chaque région du Maroc (comme la daraa, la melhfa, le caftan, la djellaba...) ? Partagez la tenue traditionnelle marocaine que vous préférez et que vous portez en voyage ! 👗🇲🇦👇',
        es: 'Chicas, para las excursiones y los viajes: ¿a quién le gusta probar la ropa tradicional de cada región de Marruecos (como la daraa, la melhfa, el caftán, la chilaba...)? ¡Compartan el atuendo tradicional marroquí que más les gusta y que llevan en sus viajes! 👗🇲🇦👇',
        ru: 'Девушки, для прогулок и путешествий: кто любит примерять традиционную одежду разных регионов Марокко (дарраа, мельхфа, кафтан, джеллаба...)? Поделитесь традиционным марокканским нарядом, который вам нравится больше всего и который вы надеваете в поездках! 👗🇲🇦👇'
    },

    description: 'مرزوقة، مخيم صحراوي وسط كثبان عرق الشبي الذهبية وقت الصباح المشمس: كثبان رملية ذهبية بظلال ناعمة وسماء زرقاء صافية بلا غيوم، خيام بيضاء تقليدية (بدوية)، فوانيس نحاسية مزخرفة مضيئة، طاولة خشبية عليها براد أتاي فضي، زرابي وسادات مغربية حمراء، جمل جالس تحت خيمة فالجهة اليمنى، نخلة وأصيص نبتة، وآثار أقدام على الرمل. Robaty واقفة بوقفة ديناميكية وكتبتسم وراسها مايل. يدها الميكانيكية اليمنى (الفضية بأساور وتفاصيل ذهبية على المعصم) مرتاحة فجيب البنطلون، ويدها الميكانيكية اليسرى كتمسك كاس أتاي صحراوي زجاجي بإطار معدني فيه شاي ذهبي. لابسة دراعة/رداء مفتوح طويل من الحرير بالأزرق السماوي (Sky Blue Silk) بأكمام واسعة وطرز صحراوي ذهبي عريض على حواف الفتحة الأمامية والأكمام مع زخرفة نجمة ذهبية على الجزء السفلي الأمامي، مشدود بحزام حبل ذهبي/بيج بشرابتين، فوق توب أبيض وبنطلون أبيض واسع. على راسها عمامة (توربان) شيفون أبيض بخيوط ذهبية ملفوفة، وطرف منها نازل على الكتف. قلادة صحراوية فضية ضخمة (حلي صحراوي) مرصعة بأحجار المرجان الأحمر وبتدلّيات فضية معلقة على صدرها فوق رقبتها الميكانيكية الفضية (حلقات معدنية)، وأقراط صحراوية فضية دائرية/هلالية مزخرفة بتدلّيات. عيونها عسلية مائلة للأخضر دافئة كتلمع تحت شمس الصباح، نمش خفيف على الوجه، وابتسامة مبهجة. شعرها طويل مموج بني نازل على جنب.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 8,
    slot: 'pm',
    image: 'day08-merzouga-evening.jpg',

    place: {
        ar: 'مرزوقة — كثبان عرق الشبي',
        en: 'Merzouga — Erg Chebbi Dunes',
        fr: 'Merzouga — Dunes de l’Erg Chebbi',
        es: 'Merzouga — Dunas de Erg Chebbi',
        ru: 'Мерзуга — дюны Эрг-Шебби'
    },

    caption: {
        ar: `مساء السحر والهدوء من قلب رمال مرزوقة الذهبية 🏜️💙✨
ما كاينش بحال هدوء الصحراء المغربية فـ وقت الغروب.. الرمال كتتحول لذهب خالص والسماء كترسم لوحة فنية ساحرة.
اليوم جربت لوك صحراوي عصري بالرزة الصحراوية النيلية مع الفضة الأصيلة والمرجان ✨
الصحراء عندها هيبة وطاقة كترد الروح وتخليك تحسي بالحرية والاتساع!
كيف جاكم هاد اللوك الصحراوي البنات؟ 💙
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good evening, full of magic and calm, from the heart of the golden Merzouga sands 🏜️💙✨
Nothing compares to the stillness of the Moroccan desert at sunset... the sand turns to pure gold and the sky paints an enchanting work of art.
Today I tried a modern desert look with the indigo Saharan rezza turban, authentic silver and coral ✨
The desert has a presence and an energy that restore the soul and make you feel freedom and vastness!
How do you like this desert look, girls? 💙
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonsoir, plein de magie et de calme, depuis le cœur des sables dorés de Merzouga 🏜️💙✨
Rien ne vaut le calme du désert marocain au coucher du soleil... le sable se change en or pur et le ciel peint un tableau enchanteur.
Aujourd’hui, j’ai essayé un look saharien moderne avec la rezza saharienne indigo, de l’argent authentique et du corail ✨
Le désert a une prestance et une énergie qui ressourcent l’âme et donnent un sentiment de liberté et d’immensité !
Comment trouvez-vous ce look saharien, les filles ? 💙
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenas noches, llenas de magia y calma, desde el corazón de las doradas arenas de Merzouga 🏜️💙✨
No hay nada como la quietud del desierto marroquí al atardecer... la arena se convierte en oro puro y el cielo pinta un cuadro fascinante.
Hoy probé un look sahariano moderno con el turbante rezza sahariano azul índigo, plata auténtica y coral ✨
El desierto tiene una presencia y una energía que reconfortan el alma y te hacen sentir libertad y amplitud.
¿Qué les parece este look sahariano, chicas? 💙
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Добрый вечер, полный волшебства и спокойствия, из самого сердца золотых песков Мерзуги 🏜️💙✨
Нет ничего лучше тишины марокканской пустыни на закате... песок превращается в чистое золото, а небо рисует волшебную картину.
Сегодня я примерила современный сахарский образ: тюрбан-реза цвета индиго, настоящее серебро и коралл ✨
У пустыни есть величие и энергия, которые возвращают душе силы и дарят ощущение свободы и простора!
Как вам этот пустынный образ, девушки? 💙
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'العمق والهيبة ماشي كلام... العمق هو أنك تكوني ثابتة وقوية بحال جبال الصحراء، وناعمة ومشرقة بحال رمالها الذهبية! 🏜️👑✨',
        en: 'Depth and prestige are not just words... depth is being steady and strong like the desert mountains, and soft and radiant like its golden sands! 🏜️👑✨',
        fr: 'La profondeur et la prestance ne sont pas que des mots... la profondeur, c’est être stable et forte comme les montagnes du désert, douce et lumineuse comme ses sables dorés ! 🏜️👑✨',
        es: 'La profundidad y la presencia no son solo palabras... ¡la profundidad es ser firme y fuerte como las montañas del desierto, y suave y radiante como sus arenas doradas! 🏜️👑✨',
        ru: 'Глубина и величие — это не просто слова... глубина — быть стойкой и сильной, как горы пустыни, и нежной и сияющей, как её золотые пески! 🏜️👑✨'
    },

    challenge: {
        ar: 'البنات، فـ تجربة الصحراء: شكون كتحلم بتجربة التخييم فـ مرزوقة ومراقبة النجوم بالليل؟ ولا كتفضلوا رحلات المدن العتيقة والشواطئ؟ شاركوني وجهتكم المفضلة فـ تعليق! 🏜️☕👇',
        en: 'Girls, about the desert experience: who dreams of camping in Merzouga and stargazing at night? Or do you prefer trips to old cities and beaches? Share your favorite destination in a comment! 🏜️☕👇',
        fr: 'Les filles, côté expérience du désert : qui rêve de camper à Merzouga et d’observer les étoiles la nuit ? Ou préférez-vous les voyages dans les vieilles villes et sur les plages ? Partagez votre destination préférée en commentaire ! 🏜️☕👇',
        es: 'Chicas, hablando de la experiencia del desierto: ¿quién sueña con acampar en Merzouga y observar las estrellas por la noche? ¿O prefieren los viajes a las ciudades antiguas y las playas? ¡Compartan su destino favorito en un comentario! 🏜️☕👇',
        ru: 'Девушки, об опыте пустыни: кто мечтает о кемпинге в Мерзуге и наблюдении за звёздами ночью? Или вы предпочитаете поездки в старинные города и на пляжи? Поделитесь любимым направлением в комментарии! 🏜️☕👇'
    },

    description: 'مرزوقة، كثبان عرق الشبي الذهبية وقت الغروب الصحراوي: رمال ناعمة وكثبان ممتدة، شمس كتغرب فالأفق، سماء متدرجة بين البرتقالي والوردي والأرجواني بسحب خفيفة، جبال بعيدة ضبابية، وقافلة من خمس جمال براكبيها كتظهر فالأفق البعيد. فالمقدمة: زربية ووسادات بربرية تقليدية حمراء مزخرفة، طاولة صينية مستديرة مزخرفة بلون فضي/نحاسي عليها براد أتاي مغربي فضي وكاس أتاي بالنعناع، فانوس صحراوي كبير مزخرف ومضاء فالجهة اليسرى، وفوانيس أصغر مضاءة وخيمة بزرابي وصناديق فالجهة اليمنى. Robaty جالسة وكتبتسم وراسها مايل، يدها الميكانيكية اليمنى (الفضية بأساور فضية متراكمة) مرفوعة قرب شعرها، ويدها الميكانيكية اليسرى (بسوار فضي/ذهبي) مرتاحة على ركبتها. لابسة رزة صحراوية (Tagelmust) بالأزرق النيلي (Indigo / Majorelle Blue) ملفوفة بأسلوب عصري على راسها، وطرف منها نازل على كتفها فجهة اليسار من الصورة، وخصلات من شعرها ظاهرة. كيمونو/قفطان صحراوي عصري طويل ومفتوح من الكتان بالأبيض الناصع بطرز صحراوي ناعم بالخيط الفضي على الحواف والياقة والأكمام، فوق توب أبيض، مخصّر بحزام رقيق معدني بإبزيم مزخرف، وبنطلون كتان واسع بلون الرمال/البيج. قلادة صحراوية فضية (حلي صحراوي) بتدلّية مرصعة بحجر المرجان الأحمر وأحجار فيروزية زرقاء، على رقبتها الميكانيكية الفضية (حلقات معدنية)، وأقراط صحراوية فضية دائرية/هلالية كبيرة منقوشة. عيونها عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، وابتسامة واثقة. شعرها طويل مموج/مجعد بني محمر نازل على الكتفين.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 9,
    slot: 'am',
    image: 'day09-essaouira-morning.jpg',

    place: {
        ar: 'الصويرة — صقالة القصبة',
        en: 'Essaouira — Sqala de la Kasbah',
        fr: 'Essaouira — Sqala de la Kasbah',
        es: 'Esauira — Sqala de la Kasbah',
        ru: 'Эс-Сувейра — Скала-де-ла-Касба'
    },

    caption: {
        ar: `صباح النسيم الموكادوري والنوارس المحلقة من الصويرة الساحرة! 🌊🕊️💙
الصباح فـ أسوار الصقالة كيعطيك إحساس بأنك فـ فيلم تاريخي.. صوت أمواج المحيط، النسيم العليل، وجمال المعمار الأبيض والأزرق اللي كيريح العيون.
اليوم اخترت لوك كتان خفيف بالأزرق الموكادوري مع لمسة إكسسوار من خشب العرعار الفاخر اللي كتشتهر بيه المدينة ✨
كيف جاكم هاد الستايل الصباحي فـ مدينة الفن والموسيقى البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good morning, with the Mogador breeze and soaring seagulls, from enchanting Essaouira! 🌊🕊️💙
Mornings on the Sqala ramparts make you feel like you're in a historic film... the sound of the ocean waves, the gentle breeze, and the white-and-blue architecture that rests the eyes.
Today I chose a light linen look in Mogador blue, with an accessory touch of the fine thuya wood the city is famous for ✨
How do you like this morning style in the city of art and music, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonjour, avec la brise de Mogador et les mouettes qui planent, depuis l’enchanteresse Essaouira ! 🌊🕊️💙
Le matin sur les remparts de la Sqala, on a l’impression d’être dans un film historique... le bruit des vagues de l’océan, la brise douce et la beauté de l’architecture blanche et bleue qui repose les yeux.
Aujourd’hui, j’ai choisi un look en lin léger bleu Mogador, avec une touche d’accessoire en précieux bois de thuya, dont la ville est réputée ✨
Que pensez-vous de ce style matinal dans la ville de l’art et de la musique, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `¡Buenos días con la brisa de Mogador y las gaviotas en vuelo desde la encantadora Esauira! 🌊🕊️💙
La mañana en las murallas de la Sqala te hace sentir dentro de una película histórica... el sonido de las olas del océano, la brisa suave y la belleza de la arquitectura blanca y azul que descansa la vista.
Hoy elegí un look de lino ligero en azul Mogador, con un toque de accesorio de la fina madera de tuya por la que la ciudad es famosa ✨
¿Qué les parece este estilo matutino en la ciudad del arte y la música, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Доброе утро с могадорским бризом и парящими чайками из очаровательной Эс-Сувейры! 🌊🕊️💙
Утро на стенах Скалы заставляет почувствовать себя героиней исторического фильма... шум океанских волн, нежный бриз и красота бело-синей архитектуры, которая дарит отдых глазам.
Сегодня я выбрала лёгкий льняной образ могадорского синего цвета с аксессуаром из благородной древесины туи, которой славится город ✨
Как вам этот утренний стиль в городе искусства и музыки, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'خلي إبداعك بحال أمواج البحر... ما عنده حدود، وكيفرض الجمال والتألق فـ كل بلاصة كيوصل ليها! 🌊🎨✨',
        en: 'Let your creativity be like the waves of the sea... boundless, imposing beauty and brilliance everywhere it reaches! 🌊🎨✨',
        fr: 'Que ta créativité soit comme les vagues de la mer... sans limites, imposant la beauté et l’éclat partout où elle arrive ! 🌊🎨✨',
        es: 'Haz que tu creatividad sea como las olas del mar... ¡sin límites, imponiendo belleza y brillo dondequiera que llegue! 🌊🎨✨',
        ru: 'Пусть твоё творчество будет как морские волны... без границ, приносящее красоту и блеск везде, куда оно доходит! 🌊🎨✨'
    },

    challenge: {
        ar: 'البنات، فـ جولات الصويرة: شكون كتعجبها القعدة فـ أسوار الصقالة والميناء وسماع موسيقى كناوة؟ ولا كتفضلوا التسوق فـ أزقة المدينة العتيقة والمنتجات ديال خشب العرعار وزيت أرغان؟ شاركوني أكثر حاجة كتعجبكم فـ موكادور فـ تعليق! 🌊🎨👇',
        en: 'Girls, for Essaouira outings: who loves sitting on the Sqala ramparts and by the port, listening to Gnawa music? Or do you prefer shopping in the lanes of the old medina for thuya wood products and argan oil? Share what you love most about Mogador in a comment! 🌊🎨👇',
        fr: 'Les filles, pour les balades à Essaouira : qui aime s’installer sur les remparts de la Sqala et près du port en écoutant de la musique gnaoua ? Ou préférez-vous faire du shopping dans les ruelles de la médina pour les produits en bois de thuya et l’huile d’argan ? Partagez ce que vous aimez le plus à Mogador en commentaire ! 🌊🎨👇',
        es: 'Chicas, para los paseos por Esauira: ¿a quién le gusta sentarse en las murallas de la Sqala y junto al puerto escuchando música gnawa? ¿O prefieren ir de compras por los callejones de la medina en busca de productos de madera de tuya y aceite de argán? ¡Compartan lo que más les gusta de Mogador en un comentario! 🌊🎨👇',
        ru: 'Девушки, для прогулок по Эс-Сувейре: кто любит посидеть на стенах Скалы и у порта, слушая музыку гнауа? Или вы предпочитаете шопинг в переулках старой медины — изделия из туи и арганное масло? Поделитесь, что вам больше всего нравится в Могадоре, в комментарии! 🌊🎨👇'
    },

    description: 'الصويرة، أسوار صقالة القصبة المطلة على المحيط الأطلسي وقت الصباح المشمس: سماء زرقاء صافية، محيط أزرق فيروزي وأمواج كتتكسر بالزبد على صخور ساحلية، برج حصن بحجر أصفر ذهبي بشرفات مسننة فالجهة اليسرى، أسوار المدينة وحيطان حجرية فالجهة اليمنى، بنايات بيضاء بنوافذ وأبواب زرقاء مع صومعة ونخلة فالأفق، ونوارس كتطير فالسما وفوق البحر. فالمقدمة مدفع أثري من البرونز بباتينا خضراء مستند على قاعدة خشبية داكنة بمسامير حديدية. Robaty واقفة وكتبتسم وراسها مايل بثقة، يدها الميكانيكية اليمنى (الفضية) مستقرة فوق المدفع بأناقة، ويدها اليسرى فجيب البنطلون. لابسة كيمونو/قفطان طويل ومفتوح من الكتان بالأزرق الموكادوري مع أكمام وجوانب سفلية بالأبيض العاجي، بطرز هندسي فضي/أبيض ناعم على الحواف والياقة والأكمام، فوق توب أبيض ناصع بياقة مرتفعة، وبنطلون كتان واسع بخصر مرتفع بلون البيج العاجي. قلادة خميسة فضية بتدلّيات مرصعة بحجر اللازورد الأزرق (Lapis Lazuli) على رقبتها الميكانيكية الفضية (حلقات معدنية)، أقراط فضية دائرية (Hoops)، وأساور بنية منقوشة من خشب العرعار الصويري على معصميها الميكانيكيين مع أساور فضية. عيونها عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، وابتسامة مشرقة حيوية. شعرها طويل مموج بني بلمسات نحاسية منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 9,
    slot: 'pm',
    image: 'day09-essaouira-evening.jpg',

    place: {
        ar: 'الصويرة — ميناء الصويرة',
        en: 'Essaouira — The Port',
        fr: 'Essaouira — Le Port',
        es: 'Esauira — El Puerto',
        ru: 'Эс-Сувейра — Порт'
    },

    caption: {
        ar: `مساء الفن، الإيقاع، والروح العريقة من الصويرة.. عاصمة كناوة وموسيقى العالم! 🎶
أجواء الغروب فـ موكادور عندها طعم تاني كيرجعنا لجذور التراث الأصيل ✨
اليوم اخترت نكرم الفن الكناوي بستايل عصري وراقي مستوحى من الطاقية الكناوية المزخرفة بالودع والفضة مع لمسة مخملية سوداء 🖤
كيف جاكم هاد اللوك الكناوي الراقي البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good evening of art, rhythm and ancient spirit from Essaouira... the capital of Gnawa and world music! 🎶
The sunset atmosphere in Mogador has a different taste that takes us back to the roots of authentic heritage ✨
Today I chose to honor Gnawa art with a modern, refined style inspired by the Gnawa cap decorated with cowrie shells and silver, with a touch of black velvet 🖤
How do you like this elegant Gnawa look, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonsoir d’art, de rythme et d’âme ancestrale depuis Essaouira... la capitale de la musique gnaoua et des musiques du monde ! 🎶
L’ambiance du coucher de soleil à Mogador a une saveur différente qui nous ramène aux racines du patrimoine authentique ✨
Aujourd’hui, j’ai choisi de rendre hommage à l’art gnaoua avec un style moderne et raffiné, inspiré du bonnet gnaoui orné de cauris et d’argent, avec une touche de velours noir 🖤
Que pensez-vous de ce look gnaoua raffiné, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenas noches de arte, ritmo y espíritu ancestral desde Esauira... ¡la capital de la música gnawa y de la música del mundo! 🎶
El ambiente del atardecer en Mogador tiene un sabor distinto que nos devuelve a las raíces del patrimonio auténtico ✨
Hoy elegí rendir homenaje al arte gnawa con un estilo moderno y refinado, inspirado en el gorro gnawa decorado con conchas de cauri y plata, con un toque de terciopelo negro 🖤
¿Qué les parece este elegante look gnawa, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Добрый вечер искусства, ритма и древнего духа из Эс-Сувейры... столицы гнауа и музыки мира! 🎶
Атмосфера заката в Могадоре имеет особый вкус и возвращает нас к корням подлинного наследия ✨
Сегодня я решила воздать дань искусству гнауа современным изысканным образом, вдохновлённым шапочкой гнауа, украшенной раковинами каури и серебром, с акцентом из чёрного бархата 🖤
Как вам этот изысканный образ в стиле гнауа, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'جذورك هي إيقاعك... مشي بثقة على نغمة قلبك، وخلي أصالتك تقول للعالم شكون نتي! 🎶🖤👑',
        en: 'Your roots are your rhythm... walk with confidence to the beat of your heart, and let your authenticity tell the world who you are! 🎶🖤👑',
        fr: 'Tes racines sont ton rythme... avance avec confiance au battement de ton cœur et laisse ton authenticité dire au monde qui tu es ! 🎶🖤👑',
        es: 'Tus raíces son tu ritmo... ¡camina con confianza al compás de tu corazón y deja que tu autenticidad le diga al mundo quién eres! 🎶🖤👑',
        ru: 'Твои корни — это твой ритм... иди уверенно в такт своему сердцу и пусть твоя подлинность расскажет миру, кто ты! 🎶🖤👑'
    },

    challenge: {
        ar: 'البنات، فـ المهرجانات والتراث: شكون كتعشق مهرجان كناوة ومقامات الموسيقى الروحية فـ الصويرة؟ ولا كتفضلوا المهرجانات السينمائية والثقافية الأخرى؟ شاركوني رأيكم فـ تعليق! 🎶🌊👇',
        en: 'Girls, about festivals and heritage: who loves the Gnawa festival and the maqams of spiritual music in Essaouira? Or do you prefer other film and cultural festivals? Share your opinion in a comment! 🎶🌊👇',
        fr: 'Les filles, côté festivals et patrimoine : qui adore le festival gnaoua et les mélodies de la musique spirituelle à Essaouira ? Ou préférez-vous les autres festivals de cinéma et de culture ? Partagez votre avis en commentaire ! 🎶🌊👇',
        es: 'Chicas, hablando de festivales y patrimonio: ¿a quién le encanta el festival gnawa y los modos de la música espiritual en Esauira? ¿O prefieren otros festivales de cine y de cultura? ¡Compartan su opinión en un comentario! 🎶🌊👇',
        ru: 'Девушки, о фестивалях и наследии: кто обожает фестиваль гнауа и мелодии духовной музыки в Эс-Сувейре? Или вы предпочитаете другие кинематографические и культурные фестивали? Поделитесь мнением в комментарии! 🎶🌊👇'
    },

    description: 'الصويرة، ميناء الصويرة وقت الغروب الذهبي: شمس كتغرب فالأفق على اليسار وسماء متدرجة بين البرتقالي والوردي والبنفسجي بسحب ملونة، انعكاس ذهبي على الما، نوارس كتطير، مراكب صيد خشبية زرقاء راسية فالجهة اليمنى والخلف، حصن/برج السقالة الحجري بشرفاته وأبراجه فالجهة اليمنى فوق الأسوار، فوانيس الشارع مضاءة والناس كيتمشاو فالممشى فالبعيد. فالمقدمة: حائط وممشى حجري، فانوس نحاسي مزخرف مضاء فالجهة اليسرى وحبل ملفوف. Robaty واقفة وكتبتسم وراسها مايل، يدها الميكانيكية اليمنى (الفضية بأساور ذهبية/نحاسية) مستقرة على خصرها، ويدها الميكانيكية اليسرى كتمسك بخفة قرصين نحاسيين مستديرين مزخرفين معلقين بحزام جلدي (شبه القراقب الكناوية). لابسة طاقية كناوية تقليدية مزخرفة بخيوط ملونة زاهية (أحمر، أزرق، أخضر، أصفر) وودع (Cowrie Shells) وشرّابات ملونة نازلة على جنب الراس. كاب/قفطان مسائي طويل ومفتوح من المخمل الأسود الفاخر بحواف ذهبية وطرز هندسي ملون (معينات حمراء وخضراء وزرقاء وصفراء) على الحواف والأكمام مع ودع، فوق توب أسود بياقة مرتفعة، مخصّر بحزام مزخرف بالودع والخرز والتدلّيات، وبنطلون أسود واسع. قلادة فضية/نحاسية صحراوية-أمازيغية كبيرة مرصعة بأحجار ملونة (أحمر وأخضر وأزرق) وتدلّيات من الودع، فوق طوق فضي على رقبتها الميكانيكية الفضية (حلقات معدنية)، وأقراط دائرية ذهبية (Hoops) وأساور ذهبية/نحاسية على المعصمين. عيونها عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، وابتسامة مشرقة جذابة. شعرها طويل مموج بني بلمسات نحاسية منسدل على الكتفين.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 10,
    slot: 'am',
    image: 'day10-tangier5-morning.jpg',

    place: {
        ar: 'طنجة — قصبة طنجة، برج النعام',
        en: 'Tangier — Tangier Kasbah, Borj Al-Naam',
        fr: 'Tanger — Kasbah de Tanger, Borj Al-Naam',
        es: 'Tánger — Kasbah de Tánger, Borj Al-Naam',
        ru: 'Танжер — Касба Танжера, Бордж аль-Наам'
    },

    caption: {
        ar: `طنجة، قصبة طنجة (Tangier Kasbah).. ومن برج النعام إطلالة على الميناء والخليج ☀️⚓💙
من هنا كتشوف مدينة بيضاء كتنزل حتى للبحر، والميناء، والجبال البعيدة فـ الأفق.. طنجة بوابة بين قارتين وكل ركن فيها عندو حكاية.
اليوم اخترت Look بحري أنيق: بلايزر بخطوط كحلية وبيضاء مع بنطلون أبيض واسع، ولمسة مغربية فـ الخميسة الفضية وحقيبة القش بخميسة ذهبية ✨
كيف جاكم هاد الستايل البحري فـ صباح طنجة البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Tangier, the Tangier Kasbah... and from Borj Al-Naam, a view over the port and the bay ☀️⚓💙
From here you see a white city sloping down to the sea, the harbor, and the distant mountains on the horizon... Tangier is a gateway between two continents, and every corner of it has a story.
Today I chose an elegant nautical look: a navy-and-white striped blazer with wide white trousers, and a Moroccan touch in the silver khamsa and the straw bag with a golden khamsa charm ✨
How do you like this nautical style on a Tangier morning, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Tanger, la Kasbah de Tanger... et depuis Borj Al-Naam, une vue sur le port et la baie ☀️⚓💙
D’ici, on voit une ville blanche qui descend jusqu’à la mer, le port et les montagnes lointaines à l’horizon... Tanger est une porte entre deux continents, et chacun de ses recoins a une histoire.
Aujourd’hui, j’ai choisi un look marin élégant : un blazer rayé bleu marine et blanc avec un pantalon blanc large, et une touche marocaine avec la khamsa en argent et le sac en paille orné d’une khamsa dorée ✨
Que pensez-vous de ce style marin par un matin tangérois, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Tánger, la Kasbah de Tánger... y desde Borj Al-Naam, una vista del puerto y de la bahía ☀️⚓💙
Desde aquí se ve una ciudad blanca que desciende hasta el mar, el puerto y las montañas lejanas en el horizonte... Tánger es una puerta entre dos continentes, y cada rincón tiene su historia.
Hoy elegí un elegante look marinero: un blazer de rayas azul marino y blancas con pantalón blanco ancho, y un toque marroquí en la jamsa (mano de Fátima) de plata y el bolso de paja con un colgante de jamsa dorado ✨
¿Qué les parece este estilo marinero en una mañana tangerina, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Танжер, Касба Танжера... и с Бордж аль-Наам — вид на порт и бухту ☀️⚓💙
Отсюда видно белый город, спускающийся к морю, порт и далёкие горы на горизонте... Танжер — врата между двумя континентами, и у каждого его уголка есть своя история.
Сегодня я выбрала элегантный морской образ: пиджак в тёмно-синюю и белую полоску, широкие белые брюки и марокканский акцент — серебряная хамса и соломенная сумка с золотым брелоком-хамсой ✨
Как вам этот морской стиль в танжерское утро, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'كل رحلة كتبدا بخطوة واثقة... ارفعي شراعك وخلي ثقتك هي البوصلة ديالك! ⚓💙✨',
        en: 'Every journey begins with a confident step... raise your sail and let your confidence be your compass! ⚓💙✨',
        fr: 'Chaque voyage commence par un pas confiant... hisse ta voile et laisse ta confiance être ta boussole ! ⚓💙✨',
        es: 'Todo viaje comienza con un paso seguro... ¡iza tu vela y deja que tu confianza sea tu brújula! ⚓💙✨',
        ru: 'Каждое путешествие начинается с уверенного шага... поднимай паруса и пусть уверенность станет твоим компасом! ⚓💙✨'
    },

    challenge: {
        ar: 'البنات، شكون كتعشق الخطوط الكحلية والبيضاء ديال الستايل البحري؟ ولا كتفضلوا الألوان الدافئة والطرز المغربي؟ اختاري ستايلك المفضل وقولي ليا علاش فـ تعليق! ⚓🌊👇',
        en: 'Girls, who loves the navy-and-white stripes of nautical style? Or do you prefer warm colors and Moroccan embroidery? Pick your favorite style and tell me why in a comment! ⚓🌊👇',
        fr: 'Les filles, qui adore les rayures bleu marine et blanc du style marin ? Ou préférez-vous les couleurs chaudes et la broderie marocaine ? Choisissez votre style préféré et dites-moi pourquoi en commentaire ! ⚓🌊👇',
        es: 'Chicas, ¿a quién le encantan las rayas azul marino y blancas del estilo marinero? ¿O prefieren los colores cálidos y el bordado marroquí? ¡Elijan su estilo favorito y cuéntenme por qué en un comentario! ⚓🌊👇',
        ru: 'Девушки, кто обожает тёмно-синие и белые полоски морского стиля? Или вы предпочитаете тёплые цвета и марокканскую вышивку? Выберите любимый стиль и расскажите, почему, в комментарии! ⚓🌊👇'
    },

    description: 'طنجة، قصبة طنجة (Tangier Kasbah)، مطل برج النعام (Borj Al-Naam) وقت الصباح المشمس الصافي، إطلالة بانورامية من سور حجري على ميناء طنجة والخليج والمدينة العتيقة. الخلفية: سماء زرقاء صافية بسحب رقيقة جداً فالأفق، بحر أزرق عميق كيلمع تحت الشمس، جبال بعيدة ضبابية رمادية-زرقاء فالأفق، وساحل مدينة بعيد. الميناء: رصيف طويل (حاجز أمواج) كيمتد فالبحر بمنارة بيضاء فآخره وبرج صغير أبيض على رصيف ثاني، ومارينا فيها بزاف د اليخوت والمراكب البيضاء راسية فصفوف. الجهة اليسرى: أسوار وحصن قديم بحجر بلون الرمل بشرفات مسننة والعلم المغربي الأحمر بالنجمة الخضراء مرفوع فوق البرج، وخضرة وأشجار على المدرجات. الجهة اليمنى: بنايات بيضاء مسطحة السطوح د المدينة العتيقة، صومعة مربعة بسقف هرمي من الزليج الأخضر، نخيل، وفانوس شارع حديدي أسود قديم فالركن. المقدمة: سور حجري خشن بلون الرمل/الأوكر بنسيج مثقب، وأرضية مرصوفة بالحجر فالركن السفلي الأيسر. Robaty واقفة جنب السور، كتبتسم ابتسامة واسعة مبهجة وراسها مايل. يدها الميكانيكية اليمنى (الفضية بأصابع مفصلية وأساور ذهبية متراكمة على الساعد) مرفوعة وكتلمس شعرها، ويدها الميكانيكية اليسرى (فضية بأساور ذهبية متراكمة) نازلة قدام الخصر قرب الحقيبة. اللباس: بلايزر مزدوج الصدر من الكتان بخطوط طولية بالكحلي والأبيض (ستايل بحري) بياقة عريضة وأزرار ذهبية (على الصدر وعلى الأكمام)، فوق توب أبيض ناصع بياقة مرتفعة، وبنطلون أبيض واسع بخصر مرتفع. الحقيبة: حقيبة قش منسوجة صغيرة مستطيلة بحزام جلد بنية على الكتف، وإبزيم جلدي بنقط ذهبية وخميسة ذهبية معلقة. المجوهرات: قلادة خميسة فضية بحجر أحمر مرجاني فالوسط على سلسلة فضية رقيقة، فوق رقبتها الميكانيكية الفضية (حلقات معدنية بحواف ذهبية)، أقراط فضية طويلة متدلية بإطار مستطيل هندسي، وأساور ذهبية متراكمة على المعصمين. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني بلمسات نحاسية منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 10,
    slot: 'pm',
    image: 'day10-tangier6-evening.jpg',

    place: {
        ar: 'طنجة — تراس علوي بقصبة طنجة',
        en: 'Tangier — Rooftop Terrace, Tangier Kasbah',
        fr: 'Tanger — Terrasse sur les toits, Kasbah de Tanger',
        es: 'Tánger — Azotea en la Kasbah de Tánger',
        ru: 'Танжер — терраса на крыше в Касбе Танжера'
    },

    caption: {
        ar: `مساء الأنوار من تراس علوي فـ قصبة طنجة (Tangier Kasbah) 🌙✨💙
من هنا كتشوف المدينة القديمة بحيوطها البيضاء، وأضواء الميناء، ومضيق جبل طارق كيلمع فـ الأفق.. أتاي بالنعناع وفوانيس مضيئة وسماء بدات كتزين بالنجوم، ما كاينش أحلى من هاد الأجواء.
اليوم اخترت Look مسائي أنيق: بلايزر مخملي بالكحلي الداكن بطرز ذهبي مغربي، مع خميسة ذهبية بحجر اللازورد الأزرق ✨
كيف جاكم هاد اللوك المسائي فـ ليل طنجة البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good evening, with lights, from a rooftop terrace in the Tangier Kasbah 🌙✨💙
From here you see the old medina with its white walls, the harbor lights, and the Strait of Gibraltar shimmering on the horizon... mint tea, glowing lanterns and a sky starting to fill with stars, nothing beats this atmosphere.
Today I chose an elegant evening look: a dark navy velvet blazer with Moroccan gold embroidery, and a golden khamsa with a blue lapis lazuli stone ✨
How do you like this evening look on a Tangier night, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonsoir tout en lumières depuis une terrasse sur les toits de la Kasbah de Tanger (Tangier Kasbah) 🌙✨💙
D’ici, on voit la vieille médina et ses murs blancs, les lumières du port et le détroit de Gibraltar qui scintille à l’horizon... thé à la menthe, lanternes allumées et un ciel qui commence à se parer d’étoiles, rien ne vaut cette ambiance.
Aujourd’hui, j’ai choisi un look de soirée élégant : un blazer en velours bleu marine foncé avec une broderie dorée marocaine, et une khamsa dorée ornée d’un lapis-lazuli bleu ✨
Que pensez-vous de ce look de soirée dans la nuit tangéroise, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenas noches llenas de luces desde una azotea en la Kasbah de Tánger (Tangier Kasbah) 🌙✨💙
Desde aquí se ve la antigua medina con sus muros blancos, las luces del puerto y el estrecho de Gibraltar brillando en el horizonte... té con menta, faroles encendidos y un cielo que empieza a llenarse de estrellas, nada supera este ambiente.
Hoy elegí un elegante look de noche: un blazer de terciopelo azul marino oscuro con bordado dorado marroquí, y una jamsa (mano de Fátima) dorada con una piedra de lapislázuli azul ✨
¿Qué les parece este look de noche en la noche tangerina, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Добрый вечер, полный огней, с террасы на крыше в Касбе Танжера (Tangier Kasbah) 🌙✨💙
Отсюда видна старая медина с белыми стенами, огни порта и Гибралтарский пролив, мерцающий на горизонте... мятный чай, зажжённые фонари и небо, которое начинает украшаться звёздами — нет ничего лучше этой атмосферы.
Сегодня я выбрала элегантный вечерний образ: бархатный пиджак тёмно-синего цвета с марокканской золотой вышивкой и золотая хамса с синим камнем лазурит ✨
Как вам этот вечерний образ в танжерскую ночь, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'حتى فـ عز الليل... ضوء الثقة اللي فيك ما كينطفيش، خليه يضوي طريقك! 🌙💙✨',
        en: 'Even in the depth of the night... the light of confidence inside you never goes out, let it light your way! 🌙💙✨',
        fr: 'Même au cœur de la nuit... la lumière de la confiance en toi ne s’éteint jamais, laisse-la éclairer ton chemin ! 🌙💙✨',
        es: 'Incluso en plena noche... ¡la luz de la confianza que hay en ti nunca se apaga, deja que ilumine tu camino! 🌙💙✨',
        ru: 'Даже в глубокую ночь... свет уверенности внутри тебя не гаснет, пусть он освещает твой путь! 🌙💙✨'
    },

    challenge: {
        ar: 'البنات، شكون كتحب تزين دارها بالفوانيس المغربية والوسادات المطرزة؟ ولا كتفضلوا الديكور العصري البسيط؟ شاركوني ذوقكم فـ ديكور الدار فـ تعليق! 🏮🏠👇',
        en: 'Girls, who loves decorating their home with Moroccan lanterns and embroidered cushions? Or do you prefer simple, modern decor? Share your taste in home decor in a comment! 🏮🏠👇',
        fr: 'Les filles, qui aime décorer sa maison avec des lanternes marocaines et des coussins brodés ? Ou préférez-vous une décoration moderne et épurée ? Partagez vos goûts en matière de déco en commentaire ! 🏮🏠👇',
        es: 'Chicas, ¿a quién le gusta decorar su casa con faroles marroquíes y cojines bordados? ¿O prefieren una decoración moderna y sencilla? ¡Compartan su gusto en decoración del hogar en un comentario! 🏮🏠👇',
        ru: 'Девушки, кто любит украшать дом марокканскими фонарями и вышитыми подушками? Или вы предпочитаете простой современный декор? Поделитесь вкусом в декоре дома в комментарии! 🏮🏠👇'
    },

    description: 'طنجة، تراس علوي (Rooftop) فـ قصبة طنجة التاريخية (Tangier Kasbah)، مطل مباشرة على المدينة القديمة وميناء طنجة ومضيق جبل طارق، وقت بداية الليل (الساعة الزرقاء) بسماء زرقاء داكنة فيها نجوم خفيفة. الخلفية: أسطح بيضاء للمدينة القديمة مضاءة بأضواء دافئة صفراء، خليج بمياه هادئة كتعكس أضواء الميناء والساحل، جبال بعيدة داكنة فالأفق، صومعة مربعة مضاءة بالذهبي فالجهة اليمنى، نخيل وحاجز حديدي مزخرف. التراس: فانوس نحاسي مزخرف مضاء فالجهة اليسرى وفانوس كبير مضاء فالجهة اليمنى، نبتة خضراء كبيرة فالركن الأيسر، كنبة مغربية بوسادات مطرزة بالأزرق الكحلي والأحمر والذهبي، بوف جلد بني كبير فالمقدمة اليسرى، وطاولة مثمنة الشكل بنقش معدني فضي قديم فالجهة اليمنى عليها صينية فضية وكاس أتاي بالنعناع وفانوس صغير مضاء. Robaty جالسة بوضعية أنيقة وكتبتسم ابتسامة عريضة وراسها مايل، يدها الميكانيكية اليمنى (الفضية بأساور ذهبية متراكمة) مرفوعة وكتلمس شعرها، ويدها الميكانيكية اليسرى (الفضية بأساور ذهبية) مستقرة على فخدها. اللباس: بلايزر طويل من المخمل بالأزرق الكحلي الداكن (Navy) بطرز ذهبي مغربي على الياقة وحواف الصدر والأكمام، مخصّر بحزام ذهبي رقيق بإبزيم مزخرف، فوق توب أسود بياقة مرتفعة، وبنطلون أسود واسع. المجوهرات: قلادة خميسة ذهبية بحجر اللازورد الأزرق على سلسلتين ذهبيتين رقيقتين فوق رقبتها الميكانيكية الفضية (حلقات معدنية بخطوط ذهبية)، أقراط ذهبية متدلية بحجر أزرق بيضاوي، وأساور ذهبية متراكمة على المعصمين. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني بلمسات نحاسية منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 11,
    slot: 'am',
    image: 'day11-agadir1-morning.jpg',

    place: {
        ar: 'أكادير — تراس ساحلي مطل على المحيط',
        en: 'Agadir — Seafront Terrace',
        fr: 'Agadir — Terrasse face à l’océan',
        es: 'Agadir — Terraza frente al océano',
        ru: 'Агадир — терраса с видом на океан'
    },

    caption: {
        ar: `صباح الشمس والبحر من تراس ساحلي فـ أكادير ☀️🌊💙
من هنا المحيط الأطلسي أزرق ناصع، والشاطئ الذهبي، والنخيل، والبنايات البيضاء.. أكادير عندها طاقة صباحية كتعطيك الحيوية والراحة فـ نفس الوقت.
اليوم اخترت لمسة سوسية أمازيغية فـ لوك عصري: قفطان كتان أزرق فاتح بطرز تقليدي، مع عصابة وقلادة وأقراط من الفضة الأمازيغية بالمينا الملونة ✨
كيف جاكم هاد اللوك السوسي العصري فـ صباح أكادير البنات؟ ☕😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good morning, full of sun and sea, from a seafront terrace in Agadir ☀️🌊💙
From here the Atlantic Ocean is a bright blue, with the golden beach, the palm trees and the white buildings... Agadir has a morning energy that gives you vitality and calm at the same time.
Today I chose a Souss Amazigh touch in a modern look: a light-blue linen kaftan with traditional embroidery, with a headband, necklace and earrings in Amazigh silver and colorful enamel ✨
How do you like this modern Souss look on an Agadir morning, girls? ☕😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonjour plein de soleil et de mer depuis une terrasse face à l’océan à Agadir ☀️🌊💙
D’ici, l’océan Atlantique est d’un bleu éclatant, avec la plage dorée, les palmiers et les bâtiments blancs... Agadir a une énergie matinale qui donne à la fois de la vitalité et du calme.
Aujourd’hui, j’ai choisi une touche amazighe du Souss dans un look moderne : un kaftan en lin bleu clair à la broderie traditionnelle, avec un bandeau, un collier et des boucles d’oreilles en argent amazigh et émail coloré ✨
Que pensez-vous de ce look soussi moderne par un matin d’Agadir, les filles ? ☕😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenos días llenos de sol y mar desde una terraza frente al océano en Agadir ☀️🌊💙
Desde aquí el océano Atlántico es de un azul intenso, con la playa dorada, las palmeras y los edificios blancos... Agadir tiene una energía matinal que te da vitalidad y calma a la vez.
Hoy elegí un toque amazigh del Sus en un look moderno: un caftán de lino azul claro con bordado tradicional, con una diadema, un collar y unos pendientes de plata amazigh y esmalte de colores ✨
¿Qué les parece este look susí moderno en una mañana de Agadir, chicas? ☕😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Доброе утро, полное солнца и моря, с террасы у океана в Агадире ☀️🌊💙
Отсюда Атлантический океан ослепительно синий, с золотым пляжем, пальмами и белыми зданиями... У Агадира утренняя энергия, которая дарит одновременно бодрость и спокойствие.
Сегодня я выбрала амазигский акцент региона Сус в современном образе: светло-голубой льняной кафтан с традиционной вышивкой, а также обруч, колье и серьги из амазигского серебра с цветной эмалью ✨
Как вам этот современный образ в стиле Сус в утро Агадира, девушки? ☕😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'هويتك كنز... لبسي أصلك بفخر، وخلي فضتك وألوانك يحكيو قصتك للعالم! 🌊💎✨',
        en: 'Your identity is a treasure... wear your roots with pride, and let your silver and your colors tell your story to the world! 🌊💎✨',
        fr: 'Ton identité est un trésor... porte tes origines avec fierté et laisse ton argent et tes couleurs raconter ton histoire au monde ! 🌊💎✨',
        es: 'Tu identidad es un tesoro... ¡lleva tus raíces con orgullo y deja que tu plata y tus colores cuenten tu historia al mundo! 🌊💎✨',
        ru: 'Твоя идентичность — сокровище... носи свои корни с гордостью и пусть твоё серебро и твои цвета расскажут миру твою историю! 🌊💎✨'
    },

    challenge: {
        ar: 'البنات، فـ الحلي والإكسسوارات: شكون كتعشق الفضة الأمازيغية بالمينا الملونة؟ ولا كتفضلوا الذهب والمجوهرات العصرية؟ شاركوني ذوقكم فـ تعليق! 💎🌊👇',
        en: 'Girls, about jewelry and accessories: who loves Amazigh silver with colorful enamel? Or do you prefer gold and modern jewelry? Share your taste in a comment! 💎🌊👇',
        fr: 'Les filles, côté bijoux et accessoires : qui adore l’argent amazigh à l’émail coloré ? Ou préférez-vous l’or et les bijoux modernes ? Partagez vos goûts en commentaire ! 💎🌊👇',
        es: 'Chicas, hablando de joyas y accesorios: ¿a quién le encanta la plata amazigh con esmalte de colores? ¿O prefieren el oro y las joyas modernas? ¡Compartan su gusto en un comentario! 💎🌊👇',
        ru: 'Девушки, об украшениях и аксессуарах: кто обожает амазигское серебро с цветной эмалью? Или вы предпочитаете золото и современные украшения? Поделитесь вкусом в комментарии! 💎🌊👇'
    },

    description: 'أكادير، تراس ساحلي فاخر مطل على المحيط الأطلسي وشاطئ المدينة وقت الصباح المشرق، بسماء زرقاء صافية بلا غيوم ومحيط أزرق ناصع كتلمع فيه أشعة الشمس وأمواج بيضاء كتوصل للشاطئ الرملي الذهبي. الخلفية: نخيل متفرق، بنايات بيضاء مسطحة السقوف، رأس/تل بعيد فالجهة اليمنى فيه بنايات ومنطقة ساحلية، وحاجز أبيض منخفض. التراس: كنبة كريمية بوسادات أمازيغية بنقوش هندسية زرقاء وبيضاء، أصيص خزفي أزرق وأبيض فيه نبتة صبار/أغاف خضراء، طاولة خشبية دائرية قديمة عليها صينية وعلبة/براد صغير فضي مزخرف، فانوس نحاسي مزخرف ومضاء فالجهة اليمنى، وأرضية رملية/حصوية بلون ذهبي مع حافة زليج أزرق وأبيض. Robaty واقفة بوقفة واثقة وكتبتسم ابتسامة عريضة وراسها مايل، يدها الميكانيكية اليمنى (الفضية بأساور) مستقرة على خصرها، ويدها الميكانيكية اليسرى كتمسك بخفة فنجان أبيض خزفي بنقش أزرق صغير. اللباس: قفطان/بلايزر طويل ومفتوح وخفيف من الكتان بالأزرق الفاتح (أزرق سماوي/كورن فلاور وليس الكحلي) بطرز تقليدي أمازيغي هندسي بالأبيض/الفضي على حواف الصدر والأطراف السفلية وعلى الأكمام الواسعة (معينات)، مخصّر بسلسلة فضية رقيقة كتنزل منها شرّابة فضية بحجر فالوسط، فوق توب أبيض وبنطلون أبيض واسع. الحلي الأمازيغي السوسي (فضة بمينا ملونة): عصابة/تاج فضي منقوش مرصع بمينا وأحجار خضراء وزرقاء وحمراء وتدلّيات فضية صغيرة موضوع فوق الشعر؛ قلادة فضية أمازيغية كبيرة (مثلثية الشكل) مرصعة بمينا أخضر وأصفر وأزرق وتدلّيات فضية طويلة، فوق رقبتها الميكانيكية الفضية (حلقات معدنية بخطوط ذهبية) مع سلاسل رقيقة؛ أقراط فضية دائرية كبيرة منقوشة بدقة؛ وأساور على المعصمين الميكانيكيين. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني بلمسات نحاسية منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 11,
    slot: 'pm',
    image: 'day11-agadir2-evening.jpg',

    place: {
        ar: 'أكادير — تراس الغروب المطل على المحيط',
        en: 'Agadir — Sunset Terrace over the Ocean',
        fr: 'Agadir — Terrasse au coucher du soleil sur l’océan',
        es: 'Agadir — Terraza al atardecer sobre el océano',
        ru: 'Агадир — терраса на закате над океаном'
    },

    caption: {
        ar: `مساء الغروب الذهبي والهدوء من تراس مطل على المحيط فـ أكادير 🌅🌊✨
الشمس كتغيب وراء التل، والسماء كتلون بالبرتقالي والبنفسجي، وأضواء الفوانيس كتحيي التراس.. أكادير فـ المساء كتعطيك راحة وفخامة ما كاينش بحالها.
اليوم نسقت Look ملكي فـ المخمل الأخضر الزمردي بطرز ذهبي، مع تاج فضي رقيق وحلي أمازيغية بالفيروز والعنبر ✨
كيف جاكم هاد اللوك المسائي فـ غروب أكادير البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good evening, with a golden sunset and calm, from a terrace overlooking the ocean in Agadir 🌅🌊✨
The sun sets behind the hill, the sky turns orange and purple, and the glow of the lanterns brings the terrace to life... Agadir in the evening gives you a comfort and luxury like no other.
Today I styled a royal look in emerald-green velvet with gold embroidery, with a delicate silver tiara and Amazigh jewelry in turquoise and amber ✨
How do you like this evening look at sunset in Agadir, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonsoir, avec un coucher de soleil doré et le calme d’une terrasse face à l’océan à Agadir 🌅🌊✨
Le soleil se couche derrière la colline, le ciel se teinte d’orange et de violet, et la lueur des lanternes anime la terrasse... Agadir le soir offre un confort et un raffinement incomparables.
Aujourd’hui, j’ai composé un look royal en velours vert émeraude à la broderie dorée, avec un fin diadème en argent et des bijoux amazighs en turquoise et ambre ✨
Que pensez-vous de ce look de soirée au coucher du soleil à Agadir, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenas noches, con un atardecer dorado y la calma de una terraza frente al océano en Agadir 🌅🌊✨
El sol se pone tras la colina, el cielo se tiñe de naranja y violeta, y la luz de los faroles da vida a la terraza... Agadir al atardecer te da una comodidad y un lujo sin igual.
Hoy combiné un look real en terciopelo verde esmeralda con bordado dorado, con una fina diadema de plata y joyas amazigh de turquesa y ámbar ✨
¿Qué les parece este look de noche en el atardecer de Agadir, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Добрый вечер, с золотым закатом и спокойствием, с террасы над океаном в Агадире 🌅🌊✨
Солнце садится за холм, небо окрашивается в оранжевый и фиолетовый, а свет фонарей оживляет террасу... Агадир вечером дарит уют и роскошь, которым нет равных.
Сегодня я собрала королевский образ из изумрудно-зелёного бархата с золотой вышивкой, с тонкой серебряной диадемой и амазигскими украшениями с бирюзой и янтарём ✨
Как вам этот вечерний образ на закате в Агадире, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'كوني ملكة فـ عالمك... الهيبة كتبدا من ثقتك فـ نفسك، وحضورك كيضوي بحال الغروب! 👑🌅✨',
        en: 'Be the queen of your own world... prestige begins with your confidence in yourself, and your presence shines like the sunset! 👑🌅✨',
        fr: 'Sois la reine de ton monde... la prestance naît de la confiance en toi, et ta présence rayonne comme le coucher de soleil ! 👑🌅✨',
        es: 'Sé la reina de tu propio mundo... la presencia nace de la confianza en ti misma, ¡y tu presencia brilla como el atardecer! 👑🌅✨',
        ru: 'Будь королевой своего мира... величие начинается с уверенности в себе, а твоё присутствие сияет, как закат! 👑🌅✨'
    },

    challenge: {
        ar: 'البنات، فـ قفاطن الخريف والشتاء: شكون كتعشق المخمل بالطرز الذهبي؟ ولا كتفضلوا الحرير والساتان الخفيف؟ اختاري قماشك المفضل وقولي ليا علاش فـ تعليق! 👑🌅👇',
        en: 'Girls, for autumn and winter kaftans: who loves velvet with gold embroidery? Or do you prefer light silk and satin? Pick your favorite fabric and tell me why in a comment! 👑🌅👇',
        fr: 'Les filles, pour les caftans d’automne et d’hiver : qui adore le velours à la broderie dorée ? Ou préférez-vous la soie et le satin légers ? Choisissez votre tissu préféré et dites-moi pourquoi en commentaire ! 👑🌅👇',
        es: 'Chicas, para los caftanes de otoño e invierno: ¿a quién le encanta el terciopelo con bordado dorado? ¿O prefieren la seda y el satén ligeros? ¡Elijan su tela favorita y cuéntenme por qué en un comentario! 👑🌅👇',
        ru: 'Девушки, о кафтанах на осень и зиму: кто обожает бархат с золотой вышивкой? Или вы предпочитаете лёгкий шёлк и атлас? Выберите любимую ткань и расскажите, почему, в комментарии! 👑🌅👇'
    },

    description: 'أكادير، تراس فاخر مطل على المحيط الأطلسي والمدينة وقت الغروب الذهبي: شمس كتغرب وراء تل بعيد فالجهة اليمنى (فوقو برج صغير)، سماء متدرجة بين البرتقالي والوردي والبنفسجي بسحب خفيفة، محيط هادئ كيعكس الضو الذهبي، ساحل وبنايات ونخيل وأضواء كتبدا تشعل فالبعيد. التراس: حاجز زجاجي شفاف فالجهة اليسرى كيطل على مدرجات وحدائق مضاءة بفوانيس صغيرة، مسبح (إنفينيتي) فالجهة اليمنى كيعكس ضو الغروب، فوانيس نحاسية مزخرفة ومضاءة فالمقدمة اليمنى وفالخلف، كنبة حمراء بوسادات ملونة، طاولة مزخرفة بنباتات، ونخيل طويل فالركن اليمين، وأرضية رخامية لامعة. Robaty واقفة بوقفة ملكية مائلة وكتبتسم ابتسامة عريضة وراسها مايل، يدها الميكانيكية اليمنى (الفضية بأساور) مستندة على الحاجز الزجاجي، ويدها الميكانيكية اليسرى (الفضية) مستقرة على خصرها. اللباس: قفطان/كاب طويل ومفتوح من المخمل بالأخضر الزمردي الغامق بطرز ذهبي هندسي (معينات ونجوم) على حواف الصدر والأطراف السفلية وبطرز نباتي/أرابيسك ذهبي على الأكمام الواسعة، فوق فستان طويل من الساتان بالأخضر الزمردي بياقة V وحافة داخلية كريمية، مخصّر بحبل ذهبي مجدول مربوط بشرّابات وخرزات ذهبية نازلة قدام الخصر. الحلي الأمازيغي: تاج فضي رقيق مرصع بأحجار فيروزية وبرتقالية/عنبرية فوق الشعر مع سلاسل فضية رقيقة، قلادة فضية أمازيغية بمينا أخضر وبرتقالي وتدلّيات فضية على سلاسل رقيقة فوق رقبتها الميكانيكية الفضية (حلقات معدنية بخطوط ذهبية)، أقراط فضية طويلة متدلية بأحجار عنبرية/برتقالية، وأساور على المعصمين. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني بلمسات نحاسية منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 12,
    slot: 'am',
    image: 'day12-ouzoud1-morning.jpg',

    place: {
        ar: 'أزيلال — شلالات أوزود',
        en: 'Azilal — Ouzoud Waterfalls',
        fr: 'Azilal — Cascades d’Ouzoud',
        es: 'Azilal — Cascadas de Ouzoud',
        ru: 'Азилаль — водопады Узуд'
    },

    caption: {
        ar: `صباح الطبيعة والطاقة من شلالات أوزود (Ouzoud Waterfalls) فـ إقليم أزيلال 💦🍂🌿
شلالات أوزود كيوصل علوها لحوالي 110 متر، وكتعتبر من أعلى وأجمل الشلالات فـ شمال إفريقيا.. وكتعيش فيها حتى قرود المكاك البربري 🐒
اليوم اخترت Look خريفي عصري لجولة الطبيعة: جاكيط بومبر زيتوني بطرز ذهبي أمازيغي، مع كنزة كريمية بياقة عالية وجينز ✨
كيف جاكم هاد الستايل الخريفي فـ أوزود البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good morning, full of nature and energy, from the Ouzoud Waterfalls in Azilal province 💦🍂🌿
The Ouzoud Waterfalls reach a height of about 110 meters and are considered among the highest and most beautiful waterfalls in North Africa... and Barbary macaques live here too 🐒
Today I chose a modern autumn look for a nature walk: an olive bomber jacket with Amazigh gold embroidery, a cream turtleneck and jeans ✨
How do you like this autumn style at Ouzoud, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonjour plein de nature et d’énergie depuis les cascades d’Ouzoud, dans la province d’Azilal 💦🍂🌿
Les cascades d’Ouzoud atteignent environ 110 mètres de haut et comptent parmi les plus hautes et les plus belles d’Afrique du Nord... et des macaques de Barbarie y vivent aussi 🐒
Aujourd’hui, j’ai choisi un look automnal moderne pour une balade nature : un bomber vert olive à la broderie dorée amazighe, un col roulé crème et un jean ✨
Que pensez-vous de ce style d’automne à Ouzoud, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenos días llenos de naturaleza y energía desde las cascadas de Ouzoud, en la provincia de Azilal 💦🍂🌿
Las cascadas de Ouzoud alcanzan unos 110 metros de altura y se cuentan entre las más altas y bonitas del norte de África... y allí viven también macacos de Berbería 🐒
Hoy elegí un look otoñal moderno para un paseo por la naturaleza: una cazadora bomber verde oliva con bordado dorado amazigh, un jersey de cuello alto crema y unos vaqueros ✨
¿Qué les parece este estilo otoñal en Ouzoud, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Доброе утро, полное природы и энергии, с водопадов Узуд в провинции Азилаль 💦🍂🌿
Высота водопадов Узуд — около 110 метров, и они считаются одними из самых высоких и красивых в Северной Африке... а ещё здесь живут берберийские макаки 🐒
Сегодня я выбрала современный осенний образ для прогулки на природе: оливковый бомбер с золотой амазигской вышивкой, кремовый свитер с высоким воротом и джинсы ✨
Как вам этот осенний стиль в Узуде, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'كوني بحال الشلال... قوية، متدفقة، وكل مرة كتنزل فيها كتخلق جمال جديد! 💦🌿✨',
        en: 'Be like the waterfall... strong, flowing, and every time you fall you create new beauty! 💦🌿✨',
        fr: 'Sois comme la cascade... forte, vive, et chaque fois que tu tombes, tu crées une beauté nouvelle ! 💦🌿✨',
        es: 'Sé como la cascada... fuerte, fluida, ¡y cada vez que caes creas una belleza nueva! 💦🌿✨',
        ru: 'Будь как водопад... сильной, текучей, и каждое твоё падение создаёт новую красоту! 💦🌿✨'
    },

    challenge: {
        ar: 'البنات، شكون كتعشق الخروج للطبيعة فـ الخريف بألوانها الذهبية والبرتقالية؟ ولا كتفضلوا الصيف والبحر؟ شاركوني فصلكم المفضل فـ تعليق! 🍂💦👇',
        en: 'Girls, who loves going out into nature in autumn with its golden and orange colors? Or do you prefer summer and the sea? Share your favorite season in a comment! 🍂💦👇',
        fr: 'Les filles, qui adore sortir dans la nature en automne, avec ses couleurs dorées et orangées ? Ou préférez-vous l’été et la mer ? Partagez votre saison préférée en commentaire ! 🍂💦👇',
        es: 'Chicas, ¿a quién le encanta salir a la naturaleza en otoño, con sus colores dorados y anaranjados? ¿O prefieren el verano y el mar? ¡Compartan su estación favorita en un comentario! 🍂💦👇',
        ru: 'Девушки, кто любит выбираться на природу осенью с её золотыми и оранжевыми красками? Или вы предпочитаете лето и море? Поделитесь любимым временем года в комментарии! 🍂💦👇'
    },

    description: 'أزيلال، شلالات أوزود (Ouzoud Waterfalls) فالأطلس، وقت الصباح المشمس. المكان: شلالات متدرجة على عدة طبقات كتنزل من منحدرات صخرية حمراء/برتقالية (طين أحمر) مغطاة بالخضرة والأشجار، بحيرة/حوض أخضر مزرق تحت الشلالات، رذاذ ماء أبيض، مدرجات ومقاهي ومظلات للزوار على السفح فالجهة اليسرى مع سياح كيتمشاو، وأشجار بأوراق خريفية صفراء وبرتقالية فالمقدمة اليسرى، وسياج خشبي وسور حجري بلون الطين الأحمر فالمقدمة. الجو مشمس وساطع. Robaty واقفة وكتبتسم ابتسامة عريضة وراسها مايل، يدها الميكانيكية اليمنى (الفضية بأساور ذهبية متراكمة) مرفوعة وكتمسك بنظارة شمسية داكنة بإطار رقيق، ويدها الميكانيكية اليسرى (بأساور فضية/ذهبية) داخل جيب الجينز. اللباس (ستايل خريفي عصري لجولة الطبيعة): جاكيط بومبر (Bomber) مبطن بالأخضر الزيتوني بسحاب وجيب على الكم، بطرز ذهبي أمازيغي هندسي على حواف السحاب والياقة وعلى الأساور والحاشية السفلية، فوق كنزة صوفية كريمية/عاجية سميكة بياقة عالية (Turtleneck)، وبنطلون جينز بخصر مرتفع بالأزرق المتوسط بنقش بارز خفيف. حقيبة ظهر/كتف سوداء جلدية بإبزيمات ذهبية وحزام على الكتف. أقراط ذهبية دائرية (Hoops) متوسطة، وأساور ذهبية متراكمة على المعصمين، ورقبتها الميكانيكية الفضية (حلقات معدنية بخطوط ذهبية) ظاهرة فوق ياقة الكنزة. بلا خميسة ولا قلادة ظاهرة هاد المرة. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، وشعر طويل مموج بني بلمسات نحاسية، نصفو مرفوع وملموم من فوق بمشبك (نص ذيل حصان) ونصفو منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 12,
    slot: 'pm',
    image: 'day12-ouzoud2-evening.jpg',

    place: {
        ar: 'أزيلال — شلالات أوزود',
        en: 'Azilal — Ouzoud Waterfalls',
        fr: 'Azilal — Cascades d’Ouzoud',
        es: 'Azilal — Cascadas de Ouzoud',
        ru: 'Азилаль — водопады Узуд'
    },

    caption: {
        ar: `بعد جولة زوينة وممتعة بين جبال وشلالات أوزود.. ما كاين ما أحسن من جلسة هادئة مع براد أتاي مغربي منعنع ومشحر على حقو وطريقو قدام هاد المنظر اللي كيرد الروح! ☕🍂
البرد الخفيف ديال أوزود مع دفء الأتاي والجلسة المغربية.. إحساس ما كيتوصفش 😍✨
كيفاش كتدوزوا أوقات الاستراحة ديالكم فـ الرحلات البنات؟
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `After a lovely, enjoyable tour among the mountains and waterfalls of Ouzoud... there's nothing better than a quiet break with a properly brewed Moroccan mint tea in front of this soul-refreshing view! ☕🍂
Ouzoud's light chill with the warmth of the tea and the Moroccan seating... an indescribable feeling 😍✨
How do you spend your rest breaks on trips, girls?
The challenge and the vote are in the comments 👀☝️`,

        fr: `Après une belle et agréable balade entre les montagnes et les cascades d’Ouzoud... rien de mieux qu’une pause tranquille avec un thé marocain à la menthe préparé dans les règles de l’art, face à cette vue qui ressource l’âme ! ☕🍂
La fraîcheur légère d’Ouzoud, la chaleur du thé et le salon marocain... une sensation indescriptible 😍✨
Comment passez-vous vos pauses pendant vos voyages, les filles ?
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Después de un recorrido precioso y divertido entre las montañas y las cascadas de Ouzoud... no hay nada mejor que una pausa tranquila con un auténtico té marroquí con menta, preparado como Dios manda, frente a esta vista que reconforta el alma. ☕🍂
El fresquito ligero de Ouzoud con el calor del té y el rincón marroquí... una sensación indescriptible 😍✨
¿Cómo pasan sus ratos de descanso en los viajes, chicas?
El reto y la votación están en los comentarios 👀☝️`,

        ru: `После прекрасной и приятной прогулки среди гор и водопадов Узуда... нет ничего лучше спокойного отдыха с настоящим марокканским мятным чаем, заваренным как положено, на фоне этого вида, возвращающего душе силы! ☕🍂
Лёгкая прохлада Узуда, тепло чая и марокканская посиделка... ощущение, которое не описать 😍✨
Как вы проводите время отдыха в путешествиях, девушки?
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'راحة البال هي فاش كتعرفي تستمتعي باللحظة البسيطة... كاس أتاي دافي، منظر طبيعي كيريح العين، وراحة بال ما كتتشراش بالفلوس! ☕🍂✨',
        en: 'Peace of mind is knowing how to enjoy the simple moment... a warm glass of tea, a natural view that rests the eyes, and a peace of mind that money can’t buy! ☕🍂✨',
        fr: 'La tranquillité d’esprit, c’est savoir savourer l’instant simple... un verre de thé chaud, un paysage qui repose les yeux et une paix intérieure qui ne s’achète pas ! ☕🍂✨',
        es: 'La paz mental es saber disfrutar del momento sencillo... ¡un vaso de té caliente, un paisaje que descansa la vista y una paz que el dinero no puede comprar! ☕🍂✨',
        ru: 'Душевный покой — это умение наслаждаться простым мгновением... стакан горячего чая, пейзаж, который отдыхает взгляд, и покой, который не купишь за деньги! ☕🍂✨'
    },

    challenge: {
        ar: 'السؤال الأهم فـ كل رحلة مغربية 🇲🇦: شكون اللي ضروري عندها كاس أتاي منعنع فـ الطريق وفـ الاستراحة؟ ولا كاينين بيناتكم عاشقات القهوة حتى وسط الطبيعة؟ وريوني عاشقات أتاي فـ التعليقات! ☕🍃👇',
        en: 'The most important question on every Moroccan trip 🇲🇦: who absolutely needs a glass of mint tea on the road and during breaks? Or are there coffee lovers among us, even in the middle of nature? Show me the tea lovers in the comments! ☕🍃👇',
        fr: 'La question la plus importante de tout voyage marocain 🇲🇦 : qui ne peut pas se passer d’un verre de thé à la menthe sur la route et pendant les pauses ? Ou y a-t-il des amatrices de café parmi vous, même en pleine nature ? Montrez-moi les amatrices de thé en commentaire ! ☕🍃👇',
        es: 'La pregunta más importante de todo viaje marroquí 🇲🇦: ¿quién necesita sí o sí un vaso de té con menta en el camino y en los descansos? ¿O hay amantes del café entre ustedes, incluso en plena naturaleza? ¡Muéstrenme a las fans del té en los comentarios! ☕🍃👇',
        ru: 'Главный вопрос любого марокканского путешествия 🇲🇦: кому обязательно нужен стакан мятного чая в дороге и на привалах? Или среди вас есть любительницы кофе даже посреди природы? Покажите мне любительниц чая в комментариях! ☕🍃👇'
    },

    description: 'أزيلال، شلالات أوزود (Ouzoud Waterfalls) فالأطلس، وقت الغروب الذهبي (ضو دافئ ذهبي). المكان: Robaty جالسة فتراس مقهى خشبي مطل على الشلالات؛ طاولة خشبية دائرية قديمة عليها صينية فضية منقوشة فيها براد أتاي مغربي فضي/ذهبي مزخرف وكاس أتاي بالنعناع بنقش ذهبي وقصعة صغيرة خزفية زرقاء وبيضاء فيها مكسرات؛ كنبات ووسادات مغربية بنقوش زرابي حمراء وبرتقالية وكريمية؛ فوانيس نحاسية مزخرفة ومضاءة (واحد كبير فالجهة اليسرى وآخر فالجهة اليمنى على السياج الخشبي)، عمود خشبي وشجرة بأوراق خريفية صفراء وبرتقالية فوق الراس؛ وفالخلف الشلالات متدرجة على عدة طبقات والصخور الحمراء/البرتقالية والخضرة وحوض الماء الأخضر، وبنايات صغيرة فالأعلى على اليمين. Robaty جالسة وكتبتسم ابتسامة عريضة وراسها مايل، يدها الميكانيكية اليمنى (الفضية بأساور ذهبية متراكمة) مرفوعة قرب الصدر وكتمسك كاس أتاي بالنعناع، ويدها الميكانيكية اليسرى (الفضية بأساور) مستقرة فوق الطاولة. اللباس نفسو ديال الصباح (نفس نهار أوزود): جاكيط بومبر (Bomber) مبطن بالأخضر الزيتوني بسحاب وجيب بسحاب على الكم، بطرز ذهبي أمازيغي هندسي (نجوم ومعينات) على حافة السحاب والياقة والأساور والأكتاف، فوق كنزة صوفية كريمية/عاجية بياقة عالية (Turtleneck)، وجينز أزرق (ظاهر عند الخصر). أقراط ذهبية دائرية (Hoops) وأساور ذهبية متراكمة على المعصمين، ورقبتها الميكانيكية الفضية (حلقات معدنية بخطوط ذهبية) ظاهرة فوق ياقة الكنزة، بلا قلادة ظاهرة. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، وشعر طويل مموج بني بلمسات نحاسية، نصفو مرفوع وملموم من فوق (نص ذيل حصان) ونصفو منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 13,
    slot: 'am',
    image: 'day13-safi1-morning.jpg',
    focus: '50% 27%',   // نزول الصورة 5% من ارتفاع الشاشة

    place: {
        ar: 'آسفي — ميناء الصيد وقصر البحر',
        en: 'Safi — Fishing Port & Qasr al-Bahr',
        fr: 'Safi — Port de pêche et Qasr al-Bahr',
        es: 'Safi — Puerto pesquero y Qasr al-Bahr',
        ru: 'Сафи — рыбный порт и Каср аль-Бахр'
    },

    caption: {
        ar: `صباح البحر وروح الصيادين من ميناء آسفي ⚓🌊💙
وراي قصر البحر الواقف فوق الصخرة قدام المحيط، اللي بناه البرتغاليون فـ القرن 16.. والمراكب الزرقاء والشباك كتحكي حكاية مدينة عاشت دايما مع البحر.
اليوم اخترت Look أبيض وأزرق ملكي بطرز مغربي: قفطان أبيض بطرز أزرق، مع سروال أزرق واسع وحزام أزرق بإبزيم فضي، وشال بنقوش هندسية ✨
كيف جاكم هاد التناسق بين الأبيض والأزرق الملكي فـ ميناء آسفي البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good morning, full of sea and fishermen's spirit, from the port of Safi ⚓🌊💙
Behind me stands Qasr al-Bahr (the Sea Castle) on its rock facing the ocean, built by the Portuguese in the 16th century... and the blue boats and nets tell the story of a city that has always lived with the sea.
Today I chose a white and royal-blue look with Moroccan embroidery: a white kaftan with blue embroidery, wide blue trousers and a blue belt with a silver buckle, and a shawl with geometric patterns ✨
How do you like this white and royal-blue combination at Safi port, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonjour plein de mer et d’esprit de pêcheurs depuis le port de Safi ⚓🌊💙
Derrière moi se dresse Qasr al-Bahr (le Château de la Mer) sur son rocher face à l’océan, bâti par les Portugais au XVIᵉ siècle... et les bateaux bleus et les filets racontent l’histoire d’une ville qui a toujours vécu avec la mer.
Aujourd’hui, j’ai choisi un look blanc et bleu roi à la broderie marocaine : un kaftan blanc à la broderie bleue, un pantalon bleu large, une ceinture bleue à boucle en argent et un châle aux motifs géométriques ✨
Que pensez-vous de cette harmonie de blanc et de bleu roi au port de Safi, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenos días llenos de mar y espíritu pescador desde el puerto de Safi ⚓🌊💙
Detrás de mí se alza Qasr al-Bahr (el Castillo del Mar) sobre su roca frente al océano, construido por los portugueses en el siglo XVI... y los barcos azules y las redes cuentan la historia de una ciudad que siempre ha vivido con el mar.
Hoy elegí un look blanco y azul real con bordado marroquí: un caftán blanco con bordado azul, un pantalón azul ancho, un cinturón azul con hebilla de plata y un chal de motivos geométricos ✨
¿Qué les parece esta combinación de blanco y azul real en el puerto de Safi, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Доброе утро, полное моря и духа рыбаков, из порта Сафи ⚓🌊💙
Позади меня на скале над океаном возвышается Каср аль-Бахр («Морской замок»), построенный португальцами в XVI веке... а синие лодки и сети рассказывают историю города, который всегда жил рядом с морем.
Сегодня я выбрала бело-синий образ с марокканской вышивкой: белый кафтан с синей вышивкой, широкие синие брюки, синий пояс с серебряной пряжкой и шаль с геометрическим узором ✨
Как вам это сочетание белого и королевского синего в порту Сафи, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'قوتك بحال البحر... هادية فـ مظهرها، عميقة فـ جوهرها، وكل موجة كتحمل معاها بداية جديدة! 🌊⚓✨',
        en: 'Your strength is like the sea... calm on the surface, deep at the core, and every wave carries a new beginning! 🌊⚓✨',
        fr: 'Ta force est comme la mer... calme en surface, profonde en son cœur, et chaque vague porte un nouveau départ ! 🌊⚓✨',
        es: 'Tu fuerza es como el mar... tranquila en la superficie, profunda en su esencia, ¡y cada ola trae un nuevo comienzo! 🌊⚓✨',
        ru: 'Твоя сила как море... спокойная снаружи, глубокая внутри, и каждая волна несёт новое начало! 🌊⚓✨'
    },

    challenge: {
        ar: 'البنات، فـ موانئ المغرب: شكون كتعشق تاكل السردين المشوي فـ الميناء مع الخبز؟ ولا كتفضلوا الحوت المقلي؟ شاركوني طبقكم المفضل ديال الحوت فـ تعليق! 🐟🔥👇',
        en: 'Girls, in Morocco’s ports: who loves eating grilled sardines at the harbor with bread? Or do you prefer fried fish? Share your favorite fish dish in a comment! 🐟🔥👇',
        fr: 'Les filles, dans les ports du Maroc : qui adore manger des sardines grillées au port avec du pain ? Ou préférez-vous le poisson frit ? Partagez votre plat de poisson préféré en commentaire ! 🐟🔥👇',
        es: 'Chicas, en los puertos de Marruecos: ¿a quién le encanta comer sardinas a la parrilla en el puerto con pan? ¿O prefieren el pescado frito? ¡Compartan su plato de pescado favorito en un comentario! 🐟🔥👇',
        ru: 'Девушки, в портах Марокко: кто обожает есть жареные на гриле сардины прямо в порту с хлебом? Или вы предпочитаете жареную рыбу? Поделитесь любимым рыбным блюдом в комментарии! 🐟🔥👇'
    },

    description: 'آسفي، ميناء الصيد وقصر البحر (Qasr al-Bahr) وقت الصباح المشمس: سماء زرقاء صافية ونوارس كتطير (ثلاثة)، قصر البحر (حصن حجري بلون ذهبي بأبراج وشرفات مسننة) فوق صخرة ساحلية على اليمين وعليه العلم المغربي الأحمر بنجمة خضراء، بنايات بيضاء وزرقاء وبيوت المدينة مع نخلة فالجهة اليسرى، ميناء فيه مراكب صيد خشبية زرقاء وحمراء راسية على الما الأزرق. فالمقدمة: كومة شباك صيد خضراء بحبال وعوامات (فلوتات) برتقالية وبيضاء وزرقاء فالجهة اليسرى، صندوق خشبي أزرق مصبوغ عليه رسمة حوت (سمكة) فالركن السفلي الأيسر، وقفة منسوجة بحزام جلد بنية ونقوش زرقاء فالجهة اليمنى، وسور حجري ساحلي بلون رملي. Robaty جالسة على السور الحجري للميناء وكتبتسم ابتسامة عريضة وراسها مايل، يدها الميكانيكية اليمنى (الفضية بأساور ذهبية) مرتاحة على الحجر، ويدها الميكانيكية اليسرى (الفضية بتفاصيل برتقالية/مرجانية وسوار فضي بحجر مرجاني) مرتاحة على ركبتها. اللباس: قفطان/معطف طويل مفتوح بلون أبيض كريمي بنسيج بارز بطرز هندسي أزرق ملكي على الحواف والأكمام والحاشية، فوق قميص أبيض بياقة مندرين وأزرار، مع حزام عريض أزرق ملكي بصفيحة/إبزيم فضي مزخرف بحجر مرجاني وتدلّيات فضية بشرّابات، وسروال واسع بالأزرق الملكي (كوبالت) من الكتان بحاشية مطرزة. شال/فوطة بنقوش هندسية بالأزرق الملكي والأبيض بشرّابات كتنزل على الكتفين والجنب. الحلي: أقراط فضية طويلة متدلية بتدلّيات وجلاجل صغيرة (طراز تقليدي مغربي/أمازيغي)، سوار فضي بحجر مرجاني برتقالي فمعصمها الأيسر، ورقبتها الميكانيكية الفضية (حلقات معدنية) ظاهرة فوق ياقة القميص. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني محمر بلمسات نحاسية منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 13,
    slot: 'pm',
    image: 'day13-safi2-evening.jpg',
    focus: '50% 27%',   // نزول الصورة 5% من ارتفاع الشاشة

    place: {
        ar: 'آسفي — سوق الفخار وقصر البحر',
        en: 'Safi — Pottery Market & Qasr al-Bahr',
        fr: 'Safi — Marché de la poterie et Qasr al-Bahr',
        es: 'Safi — Mercado de cerámica y Qasr al-Bahr',
        ru: 'Сафи — рынок гончарных изделий и Каср аль-Бахр'
    },

    caption: {
        ar: `مساء الفخار والألوان من آسفي.. مدينة الفخار المغربي 🏺🌅✨
آسفي من أعرق وأشهر مدن الفخار فـ المغرب، وكل قطعة كتتصنع وكتتزين باليد بنقوش هندسية ملونة كتحكي تاريخ الحرفيين.. وقصر البحر مضوي من وراينا قدام المحيط.
اليوم اخترت قطعة فخار مرسومة بالأزرق والبرتقالي كتعجبني بزاف، ولبست Look كاجوال بهودي كريمي بطرز أمازيغي وجينز واسع بنفس النقوش ✨
أشنو رأيكم فـ هاد القطعة الفخارية البنات؟ نديروها ديكور فـ الدار؟ 😍
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Evening of pottery and colors from Safi... the city of Moroccan pottery 🏺🌅✨
Safi is one of Morocco's oldest and most famous pottery cities, and every piece is made and decorated by hand with colorful geometric patterns that tell the story of the artisans... and Qasr al-Bahr glows behind us facing the ocean.
Today I picked a hand-painted pottery piece in blue and orange that I really love, and wore a casual look: a cream hoodie with Amazigh embroidery and wide jeans with the same motifs ✨
What do you think of this pottery piece, girls? Should I use it as home decor? 😍
The challenge and the vote are in the comments 👀☝️`,

        fr: `Soirée de poterie et de couleurs depuis Safi... la ville de la poterie marocaine 🏺🌅✨
Safi est l’une des plus anciennes et des plus célèbres villes de poterie du Maroc, et chaque pièce est façonnée et décorée à la main avec des motifs géométriques colorés qui racontent l’histoire des artisans... et Qasr al-Bahr s’illumine derrière nous face à l’océan.
Aujourd’hui, j’ai choisi une pièce de poterie peinte à la main en bleu et orange que j’adore, avec un look décontracté : un hoodie crème à la broderie amazighe et un jean large aux mêmes motifs ✨
Que pensez-vous de cette pièce de poterie, les filles ? On en fait une déco pour la maison ? 😍
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Tarde de cerámica y colores desde Safi... la ciudad de la cerámica marroquí 🏺🌅✨
Safi es una de las ciudades de cerámica más antiguas y famosas de Marruecos, y cada pieza se hace y se decora a mano con coloridos motivos geométricos que cuentan la historia de los artesanos... y Qasr al-Bahr brilla detrás de nosotras frente al océano.
Hoy elegí una pieza de cerámica pintada a mano en azul y naranja que me encanta, con un look casual: una sudadera con capucha crema con bordado amazigh y unos vaqueros anchos con los mismos motivos ✨
¿Qué les parece esta pieza de cerámica, chicas? ¿La ponemos de decoración en casa? 😍
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Вечер керамики и красок из Сафи... города марокканской керамики 🏺🌅✨
Сафи — один из старейших и самых известных центров керамики в Марокко, и каждое изделие лепят и расписывают вручную яркими геометрическими узорами, рассказывающими историю мастеров... а Каср аль-Бахр светится позади нас на фоне океана.
Сегодня я выбрала расписную керамику в синих и оранжевых тонах, которая мне очень нравится, и повседневный образ: кремовое худи с амазигской вышивкой и широкие джинсы с такими же узорами ✨
Как вам это керамическое изделие, девушки? Поставим его дома как декор? 😍
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'كل قطعة مصنوعة باليد كتحكي قصة حرفي... ادعمي الحرفيين فـ كل بلاصة كتسافري ليها، وخلي دارك تعكس شخصيتك! 🏺💙✨',
        en: 'Every handmade piece tells an artisan’s story... support artisans wherever you travel, and let your home reflect your personality! 🏺💙✨',
        fr: 'Chaque pièce faite main raconte l’histoire d’un artisan... soutiens les artisans partout où tu voyages et fais de ta maison le reflet de ta personnalité ! 🏺💙✨',
        es: 'Cada pieza hecha a mano cuenta la historia de un artesano... ¡apoya a los artesanos dondequiera que viajes y haz que tu casa refleje tu personalidad! 🏺💙✨',
        ru: 'Каждое изделие ручной работы рассказывает историю мастера... поддерживай ремесленников, где бы ты ни путешествовала, и пусть твой дом отражает твою личность! 🏺💙✨'
    },

    challenge: {
        ar: 'البنات، شكون عندها فـ دارها شي قطعة فخار مغربي (طاجين، صحن، ولا مزهرية)؟ وريوني شنو هي قطعتكم المفضلة وعلاش فـ تعليق! 🏺🏠👇',
        en: 'Girls, who has a piece of Moroccan pottery at home (a tagine, a plate, or a vase)? Show me your favorite piece and tell me why in a comment! 🏺🏠👇',
        fr: 'Les filles, qui a chez elle une pièce de poterie marocaine (un tajine, une assiette ou un vase) ? Montrez-moi votre pièce préférée et dites-moi pourquoi en commentaire ! 🏺🏠👇',
        es: 'Chicas, ¿quién tiene en casa alguna pieza de cerámica marroquí (un tajín, un plato o un jarrón)? ¡Muéstrenme su pieza favorita y cuéntenme por qué en un comentario! 🏺🏠👇',
        ru: 'Девушки, у кого дома есть марокканская керамика (тажин, тарелка или ваза)? Покажите мне любимое изделие и расскажите, почему, в комментарии! 🏺🏠👇'
    },

    description: 'آسفي، سوق الفخار فممشى ساحلي قدام قصر البحر وقت الغروب وبداية الليل: سماء برتقالية وبنفسجية وسحب خفيفة، محيط هادئ فيه مراكب صغيرة زرقاء، قصر البحر (Qasr al-Bahr) حصن حجري بلون ذهبي مضاء بأضواء دافئة فوق صخرة ساحلية فالوسط/اليمين، فانوس شارع حديدي أسود قديم فالجهة اليمنى، ممشى مرصوف بالحجر ومارة كيتمشاو، وأكشاك أخرى مضاءة فالبعيد. السوق (جهة اليسار): سقيفة خشبية بفوانيس مضاءة وأطباق فخارية معلقة، وطاولات مغطاة بأقمشة مطرزة ملونة (أحمر وبنفسجي وذهبي) عليها فخار آسفي المصبوغ باليد بنقوش هندسية: أطباق كبيرة زرقاء وبيضاء، أواني بغطاء (شبه طاجين) زرقاء وبيضاء، مزهريات وأباريق خضراء وبرتقالية وزرقاء، وقصاع وأوعية متنوعة. Robaty واقفة بجانب الأكشاك وكتبتسم ابتسامة عريضة وراسها مايل، وكتحمل بين يديها مزهرية/إبريق فخاري كبير مرسوم باليد بنقوش هندسية بالأزرق والبرتقالي والأبيض (فخار آسفي): يدها الميكانيكية اليسرى (الفضية) ملفوفة على جنب المزهرية، ويدها الميكانيكية اليمنى (الفضية بأساور ذهبية متراكمة) كتسند أسفلها. اللباس (ستايل كاجوال عصري بلمسة أمازيغية): هودي كريمي بنسيج بارز وخيوط شد عند الرقبة بطرز أمازيغي هندسي (معينات حمراء وخضراء) على الصدر وشريط مطرز ملون (أحمر وأخضر وكريمي) على الأكمام، وجينز واسع بالأزرق المتوسط بنسيج بارز وبنفس المعينات المطرزة (أحمر وأزرق وأخضر) على أسفل الساق، وحزام جلد داكن بإبزيم كتعلق منو تعويذة/قلادة فضية بحجر أحمر مرجاني وشرّابات كريمية. حقيبة كروس جلد بنية بحزام على الكتف وجزء منسوج مطرز ملون (أحمر وأزرق وأخضر) بشرّابات حمراء. أقراط فضية طويلة متدلية (طراز شنديلييه) بأحجار حمراء، وأساور ذهبية متراكمة على المعصم، ورقبتها الميكانيكية الفضية (حلقات معدنية) ظاهرة. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني محمر بلمسات نحاسية منسدل على الكتفين مع فرق فالوسط.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 14,
    slot: 'am',
    image: 'day14-imlil1-morning.jpg',
    focus: 'top',

    place: {
        ar: 'إمليل — الأطلس الكبير',
        en: 'Imlil — High Atlas',
        fr: 'Imlil — Haut Atlas',
        es: 'Imlil — Alto Atlas',
        ru: 'Имлиль — Высокий Атлас'
    },

    caption: {
        ar: `صباح الهدوء والطبيعة الساحرة من أحضان قرية "إمليل" الشامخة فـ قلب جبال الأطلس الكبير! 🏔️🌿
من وراي قمم الأطلس المغطاة بالثلج، وإمليل هي نقطة الانطلاق ديال تسلق جبل توبقال، أعلى قمة فـ شمال إفريقيا (4167 متر).. وما كاين ما أحسن من هاد الأجواء: الهواء النقي، بساتين المدرجات الخضراء، وسحر الدواوير الجبلية التقليدية اللي كيرجع للروح البساطة والدفء.
اخترت لهاد الصباح لوك "Mountain Girl" كاجوال ومريح: هودي عنابي بطرز ذهبي أمازيغي، وجينز وحذاء مشي، مع سلة الخضروات والفواكه الطازجة مباشرة من الأرض المعطاءة 🍎🥕
كيف جاكم هاد الجو القروي الهادئ البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good morning of calm and enchanting nature from the heart of the proud village of "Imlil", in the High Atlas Mountains! 🏔️🌿
Behind me rise the snow-capped peaks of the Atlas, and Imlil is the starting point for climbing Toubkal, the highest peak in North Africa (4,167 meters)... and there's nothing better than this atmosphere: the fresh air, the green terraced orchards, and the charm of the traditional mountain hamlets that bring simplicity and warmth back to the soul.
Today I chose a casual, comfortable "Mountain Girl" look: a burgundy hoodie with gold Amazigh embroidery, jeans and hiking boots, with a basket of vegetables and fruit fresh from the generous earth 🍎🥕
How do you like this calm village atmosphere, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonjour de calme et de nature enchanteresse depuis le cœur du village d’« Imlil », au pied des sommets du Haut Atlas ! 🏔️🌿
Derrière moi se dressent les sommets enneigés de l’Atlas, et Imlil est le point de départ pour gravir le Toubkal, le plus haut sommet d’Afrique du Nord (4 167 mètres)... et rien ne vaut cette ambiance : l’air pur, les vergers en terrasses verdoyants et le charme des hameaux de montagne traditionnels qui rendent à l’âme simplicité et chaleur.
Aujourd’hui, j’ai choisi un look « Mountain Girl » décontracté et confortable : un hoodie bordeaux à la broderie dorée amazighe, un jean et des chaussures de randonnée, avec un panier de légumes et de fruits frais de la terre généreuse 🍎🥕
Que pensez-vous de cette ambiance villageoise paisible, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenos días de calma y naturaleza encantadora desde el corazón del pueblo de «Imlil», en las montañas del Alto Atlas 🏔️🌿
Detrás de mí se alzan las cumbres nevadas del Atlas, e Imlil es el punto de partida para subir al Toubkal, la cima más alta del norte de África (4167 metros)... y no hay nada mejor que este ambiente: el aire puro, los huertos verdes en terrazas y el encanto de las aldeas de montaña tradicionales que devuelven al alma sencillez y calidez.
Hoy elegí un look «Mountain Girl» casual y cómodo: una sudadera con capucha granate con bordado dorado amazigh, vaqueros y botas de senderismo, con una cesta de verduras y frutas frescas de la tierra generosa 🍎🥕
¿Qué les parece este tranquilo ambiente de pueblo, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Доброе утро спокойствия и волшебной природы из самого сердца деревни «Имлиль» в горах Высокого Атласа! 🏔️🌿
Позади меня возвышаются заснеженные вершины Атласа, а Имлиль — отправная точка для восхождения на Тубкаль, самую высокую вершину Северной Африки (4167 метров)... и нет ничего лучше этой атмосферы: чистый воздух, зелёные террасные сады и очарование традиционных горных селений, возвращающих душе простоту и тепло.
Сегодня я выбрала повседневный и удобный образ «Mountain Girl»: бордовое худи с золотой амазигской вышивкой, джинсы и туристические ботинки, а также корзину овощей и фруктов, свежих с щедрой земли 🍎🥕
Как вам эта спокойная деревенская атмосфера, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'أجمل سعادة هي اللي كتلقاوها فـ البساطة... خدي وقتك فـ الطبيعة، تنفسي الهواء النقي، وارضي بكل لحظة كتعيشيها! 🌿🏔️✨',
        en: 'The most beautiful happiness is found in simplicity... take time in nature, breathe the fresh air, and be content with every moment you live! 🌿🏔️✨',
        fr: 'Le plus beau bonheur se trouve dans la simplicité... prends du temps dans la nature, respire l’air pur et savoure chaque instant que tu vis ! 🌿🏔️✨',
        es: 'La felicidad más bella se encuentra en la sencillez... ¡tómate un tiempo en la naturaleza, respira aire puro y disfruta cada momento que vives! 🌿🏔️✨',
        ru: 'Самое прекрасное счастье — в простоте... найди время для природы, вдохни чистый воздух и цени каждое прожитое мгновение! 🌿🏔️✨'
    },

    challenge: {
        ar: 'البنات، شكون سبق ليها زارت إمليل؟ ولا كتعشق هدوء الجبال والحياة القروية الأصيلة بعيد على صخب المدينة؟ 🏔️🌾 وريوني آراءكم وقصصكم فـ التعليقات! 🏡✨👇',
        en: 'Girls, who has already visited Imlil? Or who loves the calm of the mountains and authentic village life far from the noise of the city? 🏔️🌾 Share your opinions and stories in the comments! 🏡✨👇',
        fr: 'Les filles, qui a déjà visité Imlil ? Ou qui aime le calme des montagnes et la vie de village authentique, loin du bruit de la ville ? 🏔️🌾 Partagez vos avis et vos histoires en commentaire ! 🏡✨👇',
        es: 'Chicas, ¿quién ha visitado ya Imlil? ¿O a quién le encanta la calma de las montañas y la auténtica vida de pueblo, lejos del ruido de la ciudad? 🏔️🌾 ¡Compartan sus opiniones e historias en los comentarios! 🏡✨👇',
        ru: 'Девушки, кто уже бывал в Имлиле? Или кто любит спокойствие гор и настоящую деревенскую жизнь вдали от городского шума? 🏔️🌾 Делитесь мнениями и историями в комментариях! 🏡✨👇'
    },

    description: 'إمليل، قرية جبلية فـ قلب جبال الأطلس الكبير (إقليم الحوز)، وقت الصباح المشمس: قمم شامخة مغطاة بالثلج فالخلفية وسماء زرقاء صافية بسحب خفيفة جداً، منحدرات جبلية ومدرجات زراعية خضراء، بيوت قروية مبنية بالطين (الطوب الأحمر/اللبن) متراصة على السفح فالجهة اليسرى وفالجهة اليمنى، شجرة مزهرة بزهور وردية/بيضاء فالجهة اليسرى، أسوار حجرية قديمة (حجارة جافة) وسياجات حجر على جنبات الطريق، طريق ترابي حجري مرصوف جزئياً، وفالأفق على اليمين قرويون ودواب (بغال/حمير) محملة كتمشي على الطريق: رجل بقبعة زرقاء، رجل بجلابة بيضاء، رجل بجلابة بنية. Robaty واقفة وكتمشي بخطوة واثقة وسط الطريق وكتبتسم ابتسامة واسعة ومشرقة وراسها مايل شوية، يدها الميكانيكية اليمنى (الفضية) كتحمل سلة قش منسوجة يدوياً بحزام/مقبضين جلديين وبنقوش حمراء وخضراء فالجزء السفلي، مليانة خضر وفواكه طازجة (طماطم، برتقال/كليمنتين، خيار، جزر، فلفل أخضر) وأعشاب خضراء (معدنوس وقزبر)، ويدها الميكانيكية اليسرى (الفضية) نازلة بشكل طبيعي. الأذرع مغطاة بأكمام اللباس والمعدن ظاهر فقط فالعنق والكفين والمعصمين. اللباس (ستايل Mountain Girl): هودي/بلوزة بقبعة (غطاء راس مرمي لورا) قصيرة الأكمام بلون العنابي (البورغوني) بطرز ذهبي أمازيغي ومغربي دقيق ومعقد على الصدر والحاشية والأكمام، مع سحاب أمامي بحجر برتقالي وخيوط شد بشرّابات ذهبية، فوق قميص بيج فاتح كريمي بأكمام طويلة؛ بنطلون جينز أزرق بقصة مريحة بجيب جانبي وطيّة عند الكاحل؛ وحذاء مشي جبلي بني جلد/شمواه (Hiking boots) بخيوط. حقيبة ظهر بنية خفيفة كتبان حزامها فالكتف. ما كاينش قلادة ولا أقراط ظاهرة هاد المرة، ورقبتها الميكانيكية الفضية (حلقات معدنية) ظاهرة. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني محمر بلمسات نحاسية منسدل بشكل طبيعي على الكتفين.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 14,
    slot: 'pm',
    image: 'day14-imlil2-evening.jpg',
    focus: 'top',

    place: {
        ar: 'إمليل — الأطلس الكبير',
        en: 'Imlil — High Atlas',
        fr: 'Imlil — Haut Atlas',
        es: 'Imlil — Alto Atlas',
        ru: 'Имлиль — Высокий Атлас'
    },

    caption: {
        ar: `مساء الهدوء والدفء من أجمل شرفات قرية "إمليل" الشامخة فـ قلب الأطلس الكبير! 🏔️🌅
مع نزول نسيم المساء البارد، ما كاينش ما أحسن من ريحة الطاجين الأمازيغي الأصيل بالدجاج البلدي والخضروات الجبلية الطازجة، كيطبخ على مهلو ويملأ الجو بالدفء والبنّة المغربية التقليدية 🍲✨
الطاجين سميتو من الإناء الطيني المخروطي اللي كيتطبخ فيه، والغطاء ديالو كيرجع البخار للأكلة ويخليها طرية 🏺
جلسة هادئة، هواء نقي، وأصالة ما تملّش منها.
كيف جاكم الجو المسائي فـ إمليل البنات؟ شكون بغات تدوق معانا هاد الطاجين الساخن وسط الجبال؟ شاركوني رأيكم فـ التعليقات 👇💛`,

        en: `Good evening, full of calm and warmth, from one of the loveliest terraces of the proud village of “Imlil”, in the heart of the High Atlas! 🏔️🌅
As the cool evening breeze settles in, nothing beats the smell of an authentic Amazigh tagine with free-range chicken and fresh mountain vegetables, simmering slowly and filling the air with warmth and traditional Moroccan flavor 🍲✨
The tagine is named after the conical clay pot it cooks in, and its lid sends the steam back down to keep the food tender 🏺
A quiet moment, fresh air, and an authenticity you never get tired of.
How do you like the evening atmosphere in Imlil, girls? Who wants to taste this hot tagine with us in the middle of the mountains? Share your thoughts in the comments 👇💛`,

        fr: `Bonsoir, plein de calme et de chaleur, depuis l’une des plus belles terrasses du village d’« Imlil », au cœur du Haut Atlas ! 🏔️🌅
Quand la fraîcheur du soir descend, rien ne vaut l’odeur d’un authentique tajine amazigh au poulet fermier et aux légumes frais de la montagne, qui mijote doucement et remplit l’air de chaleur et de saveurs marocaines traditionnelles 🍲✨
Le tajine tire son nom du plat en terre cuite conique dans lequel il cuit, et son couvercle ramène la vapeur vers les aliments pour les garder tendres 🏺
Un moment tranquille, un air pur et une authenticité dont on ne se lasse jamais.
Que pensez-vous de l’ambiance du soir à Imlil, les filles ? Qui veut goûter ce tajine bien chaud avec nous au milieu des montagnes ? Partagez votre avis en commentaire 👇💛`,

        es: `Buenas noches, llenas de calma y calidez, desde una de las terrazas más bonitas del pueblo de «Imlil», en el corazón del Alto Atlas 🏔️🌅
Cuando cae la brisa fresca de la tarde, no hay nada mejor que el aroma de un auténtico tajín amazigh con pollo de corral y verduras frescas de montaña, que se cocina a fuego lento y llena el ambiente de calidez y sabor marroquí tradicional 🍲✨
El tajín debe su nombre a la olla de barro cónica en la que se cocina, y su tapa devuelve el vapor a la comida para mantenerla tierna 🏺
Un momento tranquilo, aire puro y una autenticidad de la que nunca te cansas.
¿Qué les parece el ambiente de la tarde en Imlil, chicas? ¿Quién quiere probar este tajín caliente con nosotras en medio de las montañas? Cuéntenme su opinión en los comentarios 👇💛`,

        ru: `Добрый вечер, полный спокойствия и тепла, с одной из самых красивых террас гордой деревни «Имлиль» в сердце Высокого Атласа! 🏔️🌅
Когда спускается прохладный вечерний ветерок, нет ничего лучше аромата настоящего амазигского тажина с домашней курицей и свежими горными овощами: он томится на медленном огне и наполняет воздух теплом и традиционным марокканским вкусом 🍲✨
Тажин получил своё имя от конического глиняного горшка, в котором готовится, а его крышка возвращает пар обратно в блюдо, и оно остаётся нежным 🏺
Тихий вечер, чистый воздух и подлинность, которая никогда не надоедает.
Как вам вечерняя атмосфера в Имлиле, девушки? Кто хочет попробовать с нами этот горячий тажин среди гор? Поделитесь мнением в комментариях 👇💛`
    },

    story: {
        ar: 'السعادة تُطبَخ بحب 👩‍🍳💕\nو الحب يُقدَّم على طبق 🍽️❤️',
        en: 'Happiness is cooked with love 👩‍🍳💕\nand love is served on a plate 🍽️❤️',
        fr: 'Le bonheur se cuisine avec amour 👩‍🍳💕\net l’amour se sert dans une assiette 🍽️❤️',
        es: 'La felicidad se cocina con amor 👩‍🍳💕\ny el amor se sirve en un plato 🍽️❤️',
        ru: 'Счастье готовится с любовью 👩‍🍳💕\nа любовь подаётся на тарелке 🍽️❤️'
    },

    challenge: {
        ar: 'البنات، فـ الأجواء الباردة ديال الجبال 🏔️❄️: شكون كتعجبها الطاجين المغربي بالخضروات الجبلية والدجاج البلدي؟ ولا كتفضلوا أطباق أخرى دافئة؟ وريوني آراءكم فـ التعليقات! 🍲👇✨',
        en: 'Girls, in the cold mountain air 🏔️❄️: who loves Moroccan tagine with mountain vegetables and free-range chicken? Or do you prefer other warm dishes? Tell me what you think in the comments! 🍲👇✨',
        fr: 'Les filles, dans l’air frais de la montagne 🏔️❄️ : qui aime le tajine marocain aux légumes de montagne et au poulet fermier ? Ou préférez-vous d’autres plats chauds ? Dites-moi ce que vous en pensez en commentaire ! 🍲👇✨',
        es: 'Chicas, con el aire frío de la montaña 🏔️❄️: ¿a quién le gusta el tajín marroquí con verduras de montaña y pollo de corral? ¿O prefieren otros platos calientes? ¡Cuéntenme su opinión en los comentarios! 🍲👇✨',
        ru: 'Девушки, в прохладном горном воздухе 🏔️❄️: кто любит марокканский тажин с горными овощами и домашней курицей? Или вы предпочитаете другие тёплые блюда? Расскажите, что думаете, в комментариях! 🍲👇✨'
    },

    description: 'إمليل، شرفة تقليدية خشبية فقرية جبلية فالأطلس الكبير وقت الغسق/الغروب: قمم جبال مغطاة بالثلج فالخلفية، شمس كتغرب فالأفق على اليمين وسماء برتقالية-وردية، بيوت طينية متراصة فالسفح (يسار ويمين) بأضواء دافئة مضاءة، ومنارة مسجد مضاءة فالجهة اليمنى. حاجز خشبي من جذوع الأشجار، بنك ووسادات بزرابي أمازيغية حمراء بنقوش هندسية، فانوس معدني مزخرف بشمعة مضاءة فالجهة اليسرى، شمعدان صغير ذهبي مخرّم، أصيص فخاري فيه صبار صغير وجذع شجرة فالزاوية اليسرى. فالمقدمة طاولة خشبية مستديرة تقليدية بمفرش زربية، عليها طاجين مغربي فخاري مزخرف بغطاء مخروطي وبخار خفيف كيتصاعد منو (جزر وخضر صفراء بحال البطاطس/القرع وزيتون أخضر وأعشاب، مع قطع دجاج بلدي)، براد أتاي فضي مزخرف، ثلاثة كؤوس زجاجية مزخرفة فيها أتاي بالنعناع، وطبق صغير فيه مكسرات. Robaty جالسة بجلسة مريحة ودافئة وكتبتسم ابتسامة ناعمة وراسها مايل، يدها الميكانيكية اليمنى (الفضية) مرفوعة ومستقرة تحت ذقنها (الساعد المعدني ظاهر مع سوار ذهبي رقيق عند المعصم)، ويدها الميكانيكية اليسرى (الفضية بسوار مزخرف بحجر برتقالي/كهرماني عند المعصم) مرتاحة ونازلة قرب ركبتها. لابسة كارديغان محبوك طويل بلون كريمي دافئ (صوف بملمس مجعد) بطرز مغربي هندسي ملون (أحمر، أزرق مخضر، ذهبي) على حواف الفتحة الأمامية وعلى الأكمام الواسعة، فوق توب أبيض/كريمي بسيط بياقة دائرية، وبنطلون جينز كحلي داكن واسع بخصر عالي، وحذاء شتوي جبلي بني من الجلد بخيوط وياقة صوفية. أقراط ذهبية متدلية بأحجار حمراء، ورقبتها الميكانيكية الفضية (حلقات معدنية) ظاهرة، وما كاينة قلادة هاد المرة. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني بلمسات نحاسية منسدل بشكل طبيعي على الكتفين.',

    stats: { likes: 0 }
});

RobatyMoments.add({
    day: 15,
    slot: 'am',
    image: 'day15-chefchaouen1-morning.jpg',
    focus: 'top',

    place: {
        ar: 'شفشاون — المدينة الزرقاء',
        en: 'Chefchaouen — The Blue City',
        fr: 'Chefchaouen — La ville bleue',
        es: 'Chefchaouen — La ciudad azul',
        ru: 'Шефшауэн — Голубой город'
    },

    caption: {
        ar: `صباح الأزرق والبهجة من شفشاون، اللؤلؤة الزرقاء فـ قلب جبال الريف! 💙🌸
هاد الأزرق اللي مغطي الحيوط والدروج كيتقال بلي جا مع اللاجئين اليهود فـ الثلاثينات، وكيرمز للسما والسلام.. وكل ركن هنا كيصلح تصورو فيه 📸✨
اخترت لهاد الصباح Look بالأزرق والكريمي: جاكيت كريمي قصير بطرز أزرق ملوكي مغربي على الحواف والأكمام، مع سروال واسع بالأزرق السماوي كيتناغم مع حيوط المدينة، وحقيبة بيضاء بشرابات زرقاء 💙
جاني خفيف ومريح لجولة بين الدروج والأزقة.. كيف جاكم التناسق البنات؟ 😊
التحدي والتصويت كاينين فـ التعليقات 👀☝️`,

        en: `Good morning of blue and joy from Chefchaouen, the Blue Pearl in the heart of the Rif Mountains! 💙🌸
It is said that this blue covering the walls and steps came with Jewish refugees in the 1930s, and that it stands for the sky and for peace... and every corner here is worth a photo 📸✨
For this morning I chose a blue-and-cream look: a short cream jacket with royal-blue Moroccan embroidery on the edges and sleeves, wide sky-blue trousers that blend with the walls of the city, and a white bag with blue tassels 💙
It felt light and comfortable for a stroll through the steps and alleys... how do you like the coordination, girls? 😊
The challenge and the vote are in the comments 👀☝️`,

        fr: `Bonjour tout en bleu et en joie depuis Chefchaouen, la Perle bleue au cœur des montagnes du Rif ! 💙🌸
On dit que ce bleu qui couvre les murs et les escaliers est arrivé avec les réfugiés juifs dans les années 1930, et qu’il symbolise le ciel et la paix... et chaque recoin ici mérite une photo 📸✨
Pour ce matin, j’ai choisi un look bleu et crème : une veste courte crème à la broderie marocaine bleu roi sur les bords et les manches, un pantalon large bleu ciel qui s’accorde aux murs de la ville, et un sac blanc à pompons bleus 💙
Léger et confortable pour une balade entre les escaliers et les ruelles... que pensez-vous de l’harmonie, les filles ? 😊
Le défi et le vote sont dans les commentaires 👀☝️`,

        es: `Buenos días llenos de azul y alegría desde Chefchaouen, la Perla Azul en el corazón de las montañas del Rif 💙🌸
Se dice que este azul que cubre las paredes y las escaleras llegó con los refugiados judíos en los años treinta, y que simboliza el cielo y la paz... y cada rincón de aquí merece una foto 📸✨
Para esta mañana elegí un look azul y crema: una chaqueta corta color crema con bordado marroquí azul real en los bordes y las mangas, unos pantalones anchos azul cielo que combinan con las paredes de la ciudad y un bolso blanco con borlas azules 💙
Ligero y cómodo para pasear entre las escaleras y los callejones... ¿qué les parece la combinación, chicas? 😊
El reto y la votación están en los comentarios 👀☝️`,

        ru: `Доброе утро, полное синевы и радости, из Шефшауэна — Голубой жемчужины в сердце гор Риф! 💙🌸
Говорят, что эта синева на стенах и ступенях появилась вместе с еврейскими беженцами в 1930-х годах и символизирует небо и мир... и каждый уголок здесь достоин фотографии 📸✨
На это утро я выбрала образ в синих и кремовых тонах: короткий кремовый жакет с марокканской вышивкой цвета королевского синего по краям и на рукавах, широкие небесно-голубые брюки, созвучные стенам города, и белая сумка с синими кисточками 💙
Лёгкий и удобный образ для прогулки по ступеням и переулкам... как вам сочетание, девушки? 😊
Вызов и голосование — в комментариях 👀☝️`
    },

    story: {
        ar: 'الألوان اللي كتحبيها هي اللي كتعبر على روحك... لبسيها بثقة وابتسامة! 💙✨',
        en: 'The colors you love are the ones that speak for your soul... wear them with confidence and a smile! 💙✨',
        fr: 'Les couleurs que tu aimes sont celles qui parlent de ton âme... porte-les avec confiance et un sourire ! 💙✨',
        es: 'Los colores que amas son los que hablan de tu alma... ¡llévalos con confianza y una sonrisa! 💙✨',
        ru: 'Цвета, которые ты любишь, говорят о твоей душе... носи их с уверенностью и улыбкой! 💙✨'
    },

    challenge: {
        ar: 'البنات، شكون فيكم زارت شفشاون؟ 💙 وشنو أحسن زنقة ولا ركن صورتي فيه؟ شاركوني ذكرياتكم ولا الأماكن اللي نتمناو نزوروها فـ تعليق! 📸👇',
        en: 'Girls, who among you has visited Chefchaouen? 💙 And what is the best alley or corner you took a photo in? Share your memories, or the places you dream of visiting, in a comment! 📸👇',
        fr: 'Les filles, qui d’entre vous a déjà visité Chefchaouen ? 💙 Et quelle est la plus belle ruelle ou le plus beau recoin où vous avez pris une photo ? Partagez vos souvenirs, ou les endroits que vous rêvez de visiter, en commentaire ! 📸👇',
        es: 'Chicas, ¿quién de ustedes ha visitado Chefchaouen? 💙 ¿Y cuál es el mejor callejón o rincón donde se han hecho una foto? ¡Compartan sus recuerdos, o los lugares que sueñan con visitar, en un comentario! 📸👇',
        ru: 'Девушки, кто из вас бывал в Шефшауэне? 💙 И в каком переулке или уголке вы сделали лучшее фото? Поделитесь воспоминаниями или местами, которые мечтаете посетить, в комментарии! 📸👇'
    },

    description: 'شفشاون (المدينة الزرقاء)، درج وزقاق وقت الصباح المشمس بضوء قوي وظلال واضحة: حيوط مصبوغة بالأزرق بملمس خشن (كلس)، درج حجري أزرق طالع نحو باب كبير مقوّس بلون أزرق مخضر/تركوازي مسمّر بالنقط الحديدية وبمقرعة حديدية دائرية، محاط بنقش جبصي منحوت بالأزرق الفاتح، فانوس حديدي معلق فالأعلى، حافة سقف بالقرميد الأحمر، شباك بحديد مشغول فالأعلى على اليسار. فخارات زرقاء (أزرق ملكي) معلقة على الحيوط وعلى الدرج بنباتات وزهور وردية/فوشيا (بوغنفيليا وجيرانيوم)، وفالمقدمة على اليسار قدّة فخار زرقاء كبيرة قديمة فيها نبتة بزهور بيضاء صغيرة (مارغريت/ياسمين)، وأرضية مرصوفة بالحجر عليها بقع ضوء وظلال. Robaty واقفة وكتبتسم ابتسامة مشرقة وراسها مايل شوية، يدها الميكانيكية اليمنى (الفضية) مرفوعة ومسنودة على الحيط الأزرق وأصابعها مفتوحة، ويدها الميكانيكية اليسرى (الفضية) نازلة بشكل طبيعي. لابسة جاكيت قصير كريمي/عاجي بقصة مستقيمة وبطرز مغربي هندسي بالأزرق الملكي والأزرق الداكن على حواف الفتحة الأمامية والحاشية وعلى الأكمام، فوق قميص أبيض بياقة عالية (ياقة ماو)، وبنطلون واسع بخصر عالي بالأزرق السماوي (Powder Blue/دجين فاتح) مع حزام رقيق أزرق بإبزيم فضي مزخرف. معاها حقيبة صغيرة بيضاء/كريمية مطرزة بنقوش زرقاء على الكتف بسلسلة وشرّابات زرقاء، وصباط سنيكرز بيض. أقراط ذهبية طويلة متدلية، رقبتها الميكانيكية الفضية (حلقات معدنية) ظاهرة فوق ياقة القميص، وما كاينة قلادة هاد المرة. الملامح: عيون عسلية مائلة للأخضر دافئة، نمش خفيف على الوجه، شعر طويل مموج بني بلمسات كراميل منسدل على جنب الكتف.',

    stats: { likes: 0 }
});
