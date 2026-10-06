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

    // عبارة أعلى الـ Story لهاد المنشور (نفس الكتابة والأنيميشن، والإيموجي 👂 الافتراضي)
    kicker: {
        ar: 'حكمة\nاليوم',
        en: 'Today’s\nwisdom',
        fr: 'Sagesse\ndu jour',
        es: 'Sabiduría\ndel día',
        ru: 'Мудрость\nдня'
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
