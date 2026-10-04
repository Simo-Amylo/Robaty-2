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
