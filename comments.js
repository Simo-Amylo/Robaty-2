// ==========================================================================
// Robaty — نظام التعليقات (Firebase Auth + Firestore)
// ==========================================================================

(function () {

    // ترجمة حسب اللغة الحالية (وإلا العربية إلا ماكانش i18n.js)
    function ct(key, fallback) {
        return window.RobatyI18n ? window.RobatyI18n.t(key) : fallback;
    }

    var auth = firebase.auth();
    var db = firebase.firestore();

    var currentUser = null;
    var currentPostId = null;
    var unsubscribeComments = null;

    // >>> THREADS STATE
    var replyTarget = null;   // { parentId, name, mention }  ← الرد اللي كتكتبو المستخدمة دابا
    var expanded = {};        // threadId -> true  (الردود المفتوحة)
    var revealTimer = null;   // مؤقت ظهور ردود Robaty
    // <<< THREADS STATE

    // >>> CONTACT-CHECK START
    // ---------------------------------------------------------------
    // منع أرقام الهواتف والروابط والحسابات (تحرش / سبام)
    // كيرجع مفتاح الرسالة ديال الخطأ، وإلا null إيلا التعليق نقي.
    // ---------------------------------------------------------------
    var RE_ARABIC_DIGITS = /[\u0660-\u0669\u06f0-\u06f9]/g;
    var RE_HIDDEN_CHARS = /[\u200b-\u200f\u202a-\u202e\u2060\u00ad\ufeff\u0640]/g;

    // رقم هاتف: 9 أرقام أو أكثر، حتى وإلا كانو مفرقين بفراغات/نقط/شرطات (06 12 34 56 78)
    var RE_PHONE = /(?:\+|00)?\d(?:[\s.\-_()]{0,2}\d){8,}/;
    // رابط أو إيميل أو نطاق شائع فالسبام
    var RE_LINK = /(?:https?:\/\/|www\.)\S+|[a-z0-9._%+\-]+@[a-z0-9\-]+\.[a-z]{2,}|\b[a-z0-9\-]{2,}\.(?:com|net|org|info|xyz|store|shop|link)\b|\b(?:wa\.me|t\.me|bit\.ly)\b/i;
    // حساب: @username، أو "insta: xxx" / "انستا: xxx"
    var RE_HANDLE = /(?:^|[\s(\[])@[a-z0-9_.]{3,}|(?:insta(?:gram)?|snap(?:chat)?|tiktok|telegram|tele|tg|\u0627\u0646\u0633\u062a\u0627|\u0627\u0646\u0633\u062a\u063a\u0631\u0627\u0645|\u0633\u0646\u0627\u0628|\u062a\u064a\u0643\s?\u062a\u0648\u0643|\u062a\u0644\u063a\u0631\u0627\u0645|\u062a\u0644\u064a\u062c\u0631\u0627\u0645)\s*[:@]\s*\S+/i;

    function checkContactInfo(text) {
        var s = String(text || '').replace(RE_HIDDEN_CHARS, '').replace(RE_ARABIC_DIGITS, function (d) {
            var code = d.charCodeAt(0);
            return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
        });
        if (RE_PHONE.test(s)) return 'comments_no_phone';
        if (RE_LINK.test(s)) return 'comments_no_links';
        if (RE_HANDLE.test(s)) return 'comments_no_handles';
        return null;
    }
    // <<< CONTACT-CHECK END

    // >>> MODERATION START
    // ---------------------------------------------------------------
    // فلترة الكلمات الممنوعة (نسخة محسّنة)
    //
    // كيفاش خدامة:
    //   1) مطابقة الكلمة كاملة: ما كتحجبش كلمة بريئة فيها جزء ممنوع
    //      (مثلاً "كسكسو" ولا "salopette").
    //   2) تطبيع النص قبل المقارنة: حروف كبيرة/صغيرة، تشكيل وتطويل، أ/إ/آ → ا،
    //      ة → ه، ى → ي، حروف مكررة (fuuuck)، رموز بين الحروف (sh!t)،
    //      حروف منفصلة (f u c k / ق ح ب ة)، وبادئات عربية (ال، و، ب، ل، ك، ف).
    //
    // كيفاش تكتبي اللائحة (ما خاصكش تكتبي التشكيل ولا التنويعات):
    //   'كلمة'          = هاد الكلمة كاملة فقط
    //   'جذر*'          = أي كلمة كتبدا بهاد الجذر (مثلاً 'putain*' كتلقط putains)
    //   'كلمتين أو أكثر' = عبارة (كلمات متتابعة بنفس الترتيب)
    // اللائحة كلها كتطبق على كل اللغات مرة وحدة (حيت المستخدمات كيخلطو اللغات).
    // انتبهي: الجذر (*) خطير على الكلمات القصيرة، حيت كيلقط كل كلمة كتبدا بيه
    // (مثلاً 'pédik*' غادي يحجب "pédicure").
    // ---------------------------------------------------------------

    var BANNED = {

        // عربية / دارجة (بالحروف العربية) + دارجة بالحروف اللاتينية (عربيزي)
        ar: [
            'قحب*', 'كحب*', 'شرموط*', 'عاهر*', 'منيوك*', 'ديوث', 'لوطي', 'عرص', 'طيز*',
            'زب', 'زبي', 'زبك', 'كس', 'كسمك*', 'كس امك', 'كس ميمتك', 'كس اختك',
            'نيكمك*', 'نكمك*', 'نيك امك', 'نيك ميمتك',
            'ولد الزنا', 'ابن الزنا',
            'حواي', 'حوايا', 'طبون', 'قلاوي', 'نهود', 'بزازل',
            'ترمك', 'ترمتك', 'ترمته', 'بزولتك', 'سكس', 'متناك', 'متناكة',
            'مقهبة', 'خانز', 'خانزة', 'مقفور',
            // مصرية
            'معرص', 'زبر', 'كسختك',
            // سب الدين (صيغة الجزائر وتونس والمغرب)
            'ينعل دين', 'ينعل الدين', 'نعل دين', 'نعل الدين', 'ينعل ربي', 'نعل ربي',
            // عامة
            'ولد الحرام', 'ابن الحرام', 'ولد لحرام',
            // سب الدين (حساس بزاف فالمغرب)
            'يلعن دين', 'يلعن الدين', 'يلعن ملة', 'يلعن الملة', 'يلعن ربي', 'يلعن ربك',
            '9a7b*', '9ahb*', 'qa7b*', 'qahb*', 'ka7b*', 'kahb*',
            '7way', '7wway', 'tbon', 'tbbon', '9lawi',
            'zebi', 'zbi', 'mnyok', 'mniok',
            'nikmok', 'nikomk', 'nik mok', 'nik omk', 'nik ommek',
            'kessmok', 'kessomk', 'kess mok', 'kess omk', 'kes mok', 'kes omk'
        ],

        en: [
            'fuck*', 'motherfuck*', 'shit', 'shits', 'shitty', 'shithead', 'bullshit',
            'bitch*', 'asshole*', 'cunt*', 'whore*', 'slut*', 'wanker', 'dickhead',
            'nigger', 'niggers', 'nigga', 'niggas', 'faggot*',
            'kys', 'kill yourself',
            // إهانات
            'dumbass*', 'dipshit*', 'douchebag*', 'scumbag*', 'twat', 'twats', 'arsehole*',
            'cocksucker*', 'shitshow', 'shitting', 'horseshit', 'shitface',
            'wank', 'wanking', 'jerk off', 'jerking off',
            // جنسية صريحة (xxx فـ BANNED_LITERAL حيت "xx" ديال البوسات عادية)
            'blowjob*', 'handjob*', 'cumshot*', 'porn', 'pornography', 'hentai',
            // تحرش
            'send nudes', 'send me nudes',
            // إهانات عنصرية وجندرية
            'tranny', 'trannies', 'towelhead*', 'raghead*',
            // دفع للانتحار
            'hang yourself', 'hang urself', 'kill urself',
            // اختصارات فظة
            'stfu', 'gtfo'
        ],

        fr: [
            'putain*', 'pute', 'putes', 'putasse', 'merd*', 'connard*', 'connasse*', 'encul*',
            'salope', 'salopes', 'salopard', 'saloperie',
            'nique', 'niquer', 'ntm', 'fdp', 'trouduc', 'trou du cul', 'ta gueule',
            'va te faire foutre',
            // إهانات
            'enfoir*', 'petass*', 'pouffiass*', 'grognass*', 'tarlouze*',
            'branleur*', 'branleuse*', 'branlette*', 'ptn',
            // عنصرية
            'bougnoul*', 'bicot', 'bicots', 'bamboula*', 'youpin*',
            // دفع للانتحار
            'tue toi', 'suicide toi',
            // جنسية صريحة
            'porno*', 'porn'
        ],

        es: [
            'puta', 'putas', 'puto', 'hdp', 'mierda*', 'joder', 'jodete', 'cabron*',
            'pendej*', 'gilipollas', 'hijueputa', 'malparid*', 'chingad*', 'chinga',
            'maricon*', 'pelotud*',
            // سباب (putón كلمة كاملة حيت "Putonghua" كتبدا بيها)
            'follar*', 'putear*', 'putead*', 'puton', 'putones', 'chingar',
            // عنصرية
            'sudaca', 'sudacas', 'negrata*',
            // دفع للانتحار
            'matate', 'suicidate',
            // تحرش
            'manda nudes', 'mandame nudes', 'pasame nudes', 'pasa nudes',
            // سب الدين والمقدسات
            'me cago en dios', 'me cago en ala', 'me cago en alah', 'me cago en la virgen'
        ],

        ru: [
            'хуй*', 'хуе*', 'хуя*', 'пизд*', 'бляд*', 'блят*',
            'ебат*', 'ебан*', 'ебал*', 'ебл*', 'ебуч*', 'заеб*', 'наеб*', 'уеб*', 'выеб*', 'долбоеб*',
            'мудак*', 'мудил*', 'мудозвон*', 'гандон*', 'залуп*', 'шлюх*',
            'пидор*', 'пидар*', 'пидр*', 'педик', 'педики', 'педика',
            'чмо', 'сука', 'суки', 'суку', 'сукой', 'сучка', 'сучки', 'сучара',
            'мразь', 'мрази', 'ублюд*', 'говн*', 'нахуй', 'похуй', 'нихуя',
            // سباب
            'шалав*', 'курва', 'курвы', 'курву', 'курве', 'гондон*', 'выбляд*',
            'отсосат*', 'трахат*', 'трахн*', 'дрочит*',
            // جنسية
            'порно*', 'порнух*', 'хентай',
            // دفع للانتحار
            'убейся', 'убей себя', 'вскройся', 'повесься', 'сдохни',
            // تحرش
            'скинь нюдсы', 'пришли нюдсы', 'кинь нюдсы',
            // إهانات إثنية صريحة
            'хач', 'хачи', 'хачей', 'жид', 'жиды', 'жидов', 'чурка', 'чурки', 'чурок',
            'черножоп*', 'узкоглаз*',
            'хохол', 'хохлы', 'хохлов', 'кацап', 'кацапы', 'кацапов', 'москаль', 'москали', 'москалей',
            // الكتابة الروسية بحروف لاتينية
            'blyat*', 'blyad*', 'pizd*', 'nahuy', 'pidor*'
        ]
    };

    // كلمات كتتطابق حرفياً بلا تقليص للحروف المكررة (مثلاً "xxx" ماشي "xx" ديال البوسات)
    var BANNED_LITERAL = ['xxx'];

    // ---------------- أدوات التطبيع (ما خاصكش تبدلي فيها) ----------------

    // Regex بخصائص Unicode؛ وإلا المتصفح قديم كنرجعو لنسخة أبسط بلا ما يتكسر الملف
    function makeRegex(src, flags, fallback) {
        try { return new RegExp(src, flags); } catch (e) { return fallback; }
    }

    var RE_SPLIT = makeRegex('[^\\p{L}\\p{N}]+', 'u', /[^a-z0-9\u0400-\u04ff\u0600-\u06ff]+/);
    var RE_SPLIT_CAP = makeRegex('([^\\p{L}\\p{N}]+)', 'u', /([^a-z0-9\u0400-\u04ff\u0600-\u06ff]+)/);
    // علامات كتفصل بين الجمل: العبارات (أكثر من كلمة) ما كتتطابقش عبرها
    var RE_BOUNDARY = /[.,;:!?\u061f\u060c\u061b\n\r\u2026()\[\]{}"\u00ab\u00bb]/;
    var RE_LEET_SYM = makeRegex('(\\p{L})([@$\u20ac!]+)(?=\\p{L})', 'gu', /([a-z])([@$!]+)(?=[a-z])/g);
    var RE_LEET_NUM = makeRegex('(\\p{L})([01]+)(?=\\p{L})', 'gu', /([a-z])([01]+)(?=[a-z])/g);
    var RE_REPEAT1 = makeRegex('(\\p{L}|\\p{N})\\1+', 'gu', /(.)\1+/g);
    var RE_REPEAT3 = makeRegex('(\\p{L}|\\p{N})\\1{2,}', 'gu', /(.)\1{2,}/g);

    // تشكيل، تطويل، همزة منفردة، أحرف غير مرئية (zero-width)، علامات لاتينية بعد NFKD
    var RE_MARKS = /[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640\u0621\u200b-\u200f\u202a-\u202e\u2060\u00ad\ufeff]/g;
    var RE_AR_MAP = /[\u0623\u0625\u0622\u0671\u0649\u0626\u0624\u0629\u06a9\u06ad\u06af\u06cc\u06a4\u067e\u0686]/g;
    var RE_ARABIC = /[\u0600-\u06ff]/;

    var AR_MAP = {
        '\u0623': '\u0627', '\u0625': '\u0627', '\u0622': '\u0627', '\u0671': '\u0627', // أ إ آ ٱ → ا
        '\u0649': '\u064a', '\u0626': '\u064a',                                         // ى ئ → ي
        '\u0624': '\u0648',                                                             // ؤ → و
        '\u0629': '\u0647',                                                             // ة → ه
        '\u06a9': '\u0643', '\u06ad': '\u0643', '\u06af': '\u0643',                     // ک ڭ گ → ك
        '\u06cc': '\u064a', '\u06a4': '\u0641', '\u067e': '\u0628', '\u0686': '\u062c'  // ی ڤ پ چ
    };
    var LEET_SYM = { '@': 'a', '$': 's', '\u20ac': 'e', '!': 'i' };
    var LEET_NUM = { '0': 'o', '1': 'i' };

    function mapChars(str, map) {
        return str.replace(/./g, function (c) { return map[c] !== undefined ? map[c] : c; });
    }

    function normalizeText(str) {
        var s = String(str || '');
        if (s.normalize) {
            try { s = s.normalize('NFKD'); } catch (e) {}
        }
        s = s.replace(RE_MARKS, '').toLowerCase();
        s = s.replace(RE_AR_MAP, function (c) { return AR_MAP[c]; });
        s = s.replace(RE_LEET_SYM, function (m, letter, syms) { return letter + mapChars(syms, LEET_SYM); });
        s = s.replace(RE_LEET_NUM, function (m, letter, nums) { return letter + mapChars(nums, LEET_NUM); });
        return s;
    }

    function tokenize(text) {
        return normalizeText(text).split(RE_SPLIT).filter(Boolean);
    }

    // نفس tokenize ولكن كتزيد العلامة '|' فين كاين فاصل جملة (فاصلة، نقطة، علامة تعجب...)
    function tokenizeWithBoundaries(text) {
        var parts = normalizeText(text).split(RE_SPLIT_CAP), out = [];
        parts.forEach(function (part, i) {
            if (i % 2 === 0) {
                if (part) out.push(part);
            } else if (RE_BOUNDARY.test(part) && out.length && out[out.length - 1] !== '|') {
                out.push('|');
            }
        });
        return out;
    }

    // keep=2: الحد الأقصى حرفين متكررين | keep=1: حرف واحد
    function squeeze(tok, keep) {
        return tok.replace(keep === 1 ? RE_REPEAT1 : RE_REPEAT3, keep === 1 ? '$1' : '$1$1');
    }

    // "f u c k" أو "f.u.c.k" → "fuck"
    function joinSingleLetters(tokens) {
        var extra = [], run = [];
        function flush() {
            if (run.length > 1) extra.push(run.join(''));
            run = [];
        }
        tokens.forEach(function (t) {
            if (t.length === 1) { run.push(t); } else { flush(); }
        });
        flush();
        return extra;
    }

    // ---------------- بناء الفهرس ----------------

    function emptyIndex() {
        return { exact: Object.create(null), stems: [], phrases: [] };
    }

    var INDEX_A = emptyIndex(); // الكلمات كما هي (حرفين متكررين كحد أقصى)
    var INDEX_B = emptyIndex(); // نفس الكلمات بحروف مكررة مقلّصة لحرف واحد (للتطويل: fuuuck)

    function addEntry(raw) {
        var isStem = /\*\s*$/.test(raw);
        var tokens = tokenize(raw.replace(/\*\s*$/, ''));
        if (!tokens.length) return;

        [[INDEX_A, 2], [INDEX_B, 1]].forEach(function (pair) {
            var idx = pair[0];
            var parts = tokens.map(function (t) { return squeeze(t, pair[1]); });

            if (parts.length > 1) { idx.phrases.push(parts.join(' ')); }
            else if (isStem) { idx.stems.push(parts[0]); }
            else { idx.exact[parts[0]] = true; }
        });
    }

    Object.keys(BANNED).forEach(function (lang) {
        BANNED[lang].forEach(addEntry);
    });

    var LITERAL = Object.create(null);
    BANNED_LITERAL.forEach(function (w) { LITERAL[w] = true; });

    // ---------------- المطابقة ----------------

    function tokenInIndex(idx, tok) {
        if (idx.exact[tok]) return true;
        for (var i = 0; i < idx.stems.length; i++) {
            if (tok.indexOf(idx.stems[i]) === 0) return true;
        }
        return false;
    }

    // بادئات عربية: ال، وال، بال، لل، و، ف، ب، ل، ك (الكلمة المتبقية خاصها 3 حروف على الأقل)
    function arabicForms(tok) {
        var a = tok.replace(/^(?:[\u0648\u0641\u0628\u0643]?\u0627\u0644|\u0644\u0644)/, '');
        var b = tok.replace(/^[\u0648\u0641\u0628\u0644\u0643]/, '');
        var c = b.replace(/^\u0627\u0644/, '');
        return [a, b, c].filter(function (f) { return f !== tok && f.length >= 3; });
    }

    function matchForms(idx, tok) {
        if (tokenInIndex(idx, tok)) return true;
        if (RE_ARABIC.test(tok)) {
            var forms = arabicForms(tok);
            for (var i = 0; i < forms.length; i++) {
                if (tokenInIndex(idx, forms[i])) return true;
            }
        }
        return false;
    }

    function isBannedToken(tok) {
        if (matchForms(INDEX_A, squeeze(tok, 2))) return true;
        var t1 = squeeze(tok, 1);
        return t1 !== tok && matchForms(INDEX_B, t1);
    }

    function hasPhrase(idx, tokens) {
        if (!idx.phrases.length) return false;
        var padded = ' ' + tokens.join(' ') + ' ';
        for (var i = 0; i < idx.phrases.length; i++) {
            if (padded.indexOf(' ' + idx.phrases[i] + ' ') !== -1) return true;
        }
        return false;
    }

    function containsBannedWord(text) {
        var ptokens = tokenizeWithBoundaries(text);   // مع علامات الفصل (للعبارات)
        var tokens = ptokens.filter(function (t) { return t !== '|'; });
        if (!tokens.length) return false;

        var candidates = tokens.concat(joinSingleLetters(tokens));
        for (var i = 0; i < candidates.length; i++) {
            if (LITERAL[candidates[i]] || isBannedToken(candidates[i])) return true;
        }

        return hasPhrase(INDEX_A, ptokens.map(function (t) { return squeeze(t, 2); })) ||
               hasPhrase(INDEX_B, ptokens.map(function (t) { return squeeze(t, 1); }));
    }
    // <<< MODERATION END

    // ---------------------------------------------------------------
    // تسجيل الدخول / الخروج
    // ---------------------------------------------------------------
    function signInWithGoogle() {
        var provider = new firebase.auth.GoogleAuthProvider();
        return auth.signInWithPopup(provider).catch(function (err) {
            // بعض متصفحات الهاتف كتحجب popup — نجربو redirect كبديل
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
                return auth.signInWithRedirect(provider);
            }
            console.error(err);
        });
    }

    function signOutUser() {
        return auth.signOut();
    }

    auth.onAuthStateChanged(function (user) {
        currentUser = user;
        renderAuthUI();
        renderList();
    });

    // ---------------------------------------------------------------
    // فتح نافذة التعليقات لمنشور معين
    // ---------------------------------------------------------------
    function openCommentsModal(postId) {
        currentPostId = postId;
        replyTarget = null;
        expanded = {};

        var modal = document.getElementById('simpleModal');
        var title = document.getElementById('simpleModalTitle');

        title.textContent = ct('comments_title', '💬 التعليقات');
        var sheet = modal.querySelector('.simple-modal-content');
        if (sheet) sheet.classList.add('comments-sheet');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        renderCommentsShell();
        subscribeToComments(postId);
    }

    function closeCommentsModal() {
        if (unsubscribeComments) {
            unsubscribeComments();
            unsubscribeComments = null;
        }
        currentPostId = null;
        lastItems = [];
        replyTarget = null;
        expanded = {};
        if (revealTimer) { clearTimeout(revealTimer); revealTimer = null; }

        var sheet = document.querySelector('#simpleModal .simple-modal-content');
        if (sheet) sheet.classList.remove('comments-sheet');
    }

    // ---------------------------------------------------------------
    // الأرقام الحقيقية (تعليقات / مشاركات / إعادة نشر) — collection: postStats
    // كل وثيقة id ديالها = id المنشور، وفيها: comments, shares, reposts
    // ---------------------------------------------------------------
    var statsCache = {};
    var commentsSeen = {};

    function setCountUI(postId, field, value) {
        var card = document.getElementById(postId);
        if (!card) return;
        var el = card.querySelector('[data-stat="' + field + '"]');
        if (el) el.textContent = value;
    }

    function applyStats(postId) {
        var st = statsCache[postId] || {};
        setCountUI(postId, 'comments', Math.max(Number(st.comments) || 0, commentsSeen[postId] || 0));
        setCountUI(postId, 'shares', Number(st.shares) || 0);
        setCountUI(postId, 'reposts', Number(st.reposts) || 0);
    }

    function bump(postId, field) {
        var upd = {};
        upd[field] = firebase.firestore.FieldValue.increment(1);

        return db.collection('postStats').doc(postId).set(upd, { merge: true }).catch(function (err) {
            console.warn('postStats', err);
        });
    }

    window.RobatyCounters = { bump: bump };

    function subscribeToStats() {
        db.collection('postStats').onSnapshot(function (snap) {
            snap.forEach(function (doc) {
                statsCache[doc.id] = doc.data();
                applyStats(doc.id);
            });
        }, function (err) {
            console.warn('postStats', err);
        });
    }

    // ---------------------------------------------------------------
    // وقت نسبي: "الآن"، "قبل 5 د"، "4 j" ... حسب اللغة
    // ---------------------------------------------------------------
    function timeAgo(ms) {
        var diff = Math.max(0, Math.round((Date.now() - (ms || Date.now())) / 1000));

        try {
            var lang = window.RobatyI18n ? window.RobatyI18n.getCurrentLang() : 'ar';
            var rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, { numeric: 'auto', style: 'short' });

            if (diff < 60) return rtf.format(0, 'second');
            if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute');
            if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
            if (diff < 604800) return rtf.format(-Math.floor(diff / 86400), 'day');
            if (diff < 2592000) return rtf.format(-Math.floor(diff / 604800), 'week');
            if (diff < 31536000) return rtf.format(-Math.floor(diff / 2592000), 'month');
            return rtf.format(-Math.floor(diff / 31536000), 'year');
        } catch (e) {
            return '';
        }
    }

    function avatarHTML(photo, name) {
        if (photo) {
            return '<img src="' + escapeHtml(photo) + '" alt="" class="comment-avatar" referrerpolicy="no-referrer">';
        }
        var letter = String(name || '?').trim().charAt(0).toUpperCase() || '?';
        return '<div class="comment-avatar comment-avatar-letter">' + escapeHtml(letter) + '</div>';
    }

    // ---------------------------------------------------------------
    // سؤال التحدي: تعليق مثبّت من robaty_ai فوق كل التعليقات (بحال إنستغرام)
    // ---------------------------------------------------------------
    function pinnedHTML() {
        var RM = window.RobatyMoments;
        if (!RM || !currentPostId) return '';

        var post = RM.getPost(currentPostId.replace(/^post-/, ''));
        var question = post && post.challenge ? RM.t(post.challenge) : '';

        if (!question) return '';

        return '<div class="comment-item pinned">' +
                   '<img src="robaty-profile.jpg" alt="" class="comment-avatar">' +
                   '<div class="comment-main">' +
                       '<div class="comment-head">' +
                           '<span class="comment-author">robaty_ai</span>' +
                           '<i class="fa-solid fa-circle-check comment-verify"></i>' +
                           '<span class="comment-time"><i class="fa-solid fa-thumbtack"></i> ' + escapeHtml(ct('challenge_label', 'تحدي اليوم 👑')) + '</span>' +
                       '</div>' +
                       '<div class="comment-text" dir="auto">' + escapeHtml(question) + '</div>' +
                   '</div>' +
               '</div>';
    }

    // ---------------------------------------------------------------
    // نصوص الواجهة الجديدة (5 لغات) — محلية، ما كتحتاجش تعديل فـ i18n.js
    // ---------------------------------------------------------------
    var LT = {
        reply:           { ar: 'رد', en: 'Reply', fr: 'Répondre', es: 'Responder', ru: 'Ответить' },
        view_replies:    { ar: 'عرض الردود', en: 'View replies', fr: 'Voir les réponses', es: 'Ver respuestas', ru: 'Показать ответы' },
        hide_replies:    { ar: 'إخفاء الردود', en: 'Hide replies', fr: 'Masquer les réponses', es: 'Ocultar respuestas', ru: 'Скрыть ответы' },
        replying_to:     { ar: 'الرد على', en: 'Replying to', fr: 'Réponse à', es: 'Respondiendo a', ru: 'Ответ для' },
        author:          { ar: 'المؤلفة', en: 'Author', fr: 'Auteure', es: 'Autora', ru: 'Автор' },
        reply_placeholder: { ar: 'اكتبي ردك...', en: 'Add a reply...', fr: 'Ajoute une réponse...', es: 'Añade una respuesta...', ru: 'Напишите ответ...' }
    };

    function lt(key) {
        var lang = 'ar';
        try { lang = window.RobatyI18n ? window.RobatyI18n.getCurrentLang() : 'ar'; } catch (e) {}
        var row = LT[key] || {};
        return row[lang] || row.ar || '';
    }

    // >>> ROBATY-REPLIES START
    // ---------------------------------------------------------------
    // ردود Robaty المبرمجة. ما كتخزنش فـ Firestore: كتتحسب وقت العرض
    // من id التعليق + محتواه، فكتبقى هي نفسها عند كل المستخدمات.
    //
    // 1) كنصنفو التعليق (نقد، سؤال، جواب على التحدي، مدح، تحية، إيموجي، غير واضح)
    // 2) كنحددو لغة الرد (حسب لغة التعليق)
    // 3) كنختارو جملة ثابتة من لائحة الصنف
    // 4) النقد ما كيتردّش عليه نهائيا
    // ---------------------------------------------------------------

    // نسبة الرد لكل صنف (%). بدّل الأرقام إلا بغيتي.
    var ROBATY_RATES = { praise: 80, challenge: 80, question: 80, greeting: 80, salam: 80, emoji: 80, unclear: 80 };

    // إيموجي فقط (للتعليقات اللي غير إيموجي وللغير واضح)
    var ROBATY_EMOJI = ['🤍', '🌹', '✨', '💛', '👑✨', '🌸', '🤍✨', '🌷'];

    // الجمل لكل لغة وصنف
    var ROBATY_REPLIES = {
        ar: {
            praise: [
                'الله يبارك فيك أ صاحبتي 🤍',
                'كلامك الزوين كيفرحني، شكرا بزاف 🌹',
                'من ذوقك الراقي أ لالة ✨',
                'الله يخليك، تسلمي أ صاحبتي 💛',
                'يا سلام عليك، شكرا ليك بزاف 🌸'
            ],
            challenge: [
                'اختيار في الصميم! 👑',
                'ذوقك راقي بزاف أ صاحبتي ✨',
                'الله يعطيك الصحة على المشاركة 🌹',
                'تشرفت بمشاركتك فالتحدي 💛',
                'كلامك واعر! شكرا على التفاعل 🤍'
            ],
            greeting: [
                'مرحبا بيك أ صاحبتي 🌹',
                'أهلا وسهلا، نورتي المكان ✨',
                'الله يحفظك، مرحبا بيك 🤍',
                'يا مرحبا بيك أ لالة 💛'
            ],
            salam: ['وعليكم السلام ورحمة الله وبركاته 🌹'],
            question: [
                'دخلي عندي لشاشة المحادثات 💬',
                'سولي فشاشة المحادثات أ صاحبتي، غادي نجاوبك هناك 💬'
            ]
        },
        fr: {
            praise: [
                'Merci beaucoup ma belle 🤍',
                'Ça me touche, merci du fond du cœur 🌹',
                'Tu as un goût raffiné ✨',
                'Que Dieu te bénisse, merci 💛',
                'Quel joli mot, merci ma chère 🌸'
            ],
            challenge: [
                'Un choix en plein dans le mille ! 👑',
                'Tu as un goût raffiné, ma belle ✨',
                'Merci de participer au défi 🌹',
                'J\u2019adore ta réponse ! 🤍',
                'Belle participation, merci 💛'
            ],
            greeting: [
                'Bienvenue ma belle 🌹',
                'Ravie de te voir ici ✨',
                'Que Dieu te garde, bienvenue 🤍',
                'Bienvenue chez nous 💛'
            ],
            question: [
                'Viens me voir dans l\u2019écran des discussions 💬',
                'Pose-moi ta question dans l\u2019écran des discussions, je te réponds là-bas 💬'
            ]
        },
        en: {
            praise: [
                'Thank you so much, lovely 🤍',
                'Your kind words made my day 🌹',
                'You have such a refined taste ✨',
                'God bless you, thank you 💛',
                'That\u2019s so sweet of you 🌸'
            ],
            challenge: [
                'Spot-on choice! 👑',
                'Such refined taste, lovely ✨',
                'Thanks for joining the challenge 🌹',
                'I love your answer! 🤍',
                'Great pick, thank you 💛'
            ],
            greeting: [
                'Welcome, lovely 🌹',
                'So happy to see you here ✨',
                'God keep you, welcome 🤍',
                'Welcome to our little home 💛'
            ],
            question: [
                'Come see me in the chat screen 💬',
                'Ask me in the chat screen, I\u2019ll answer you there 💬'
            ]
        },
        es: {
            praise: [
                'Muchas gracias, guapa 🤍',
                'Tus palabras me llegan al corazón 🌹',
                'Tienes un gusto exquisito ✨',
                'Que Dios te bendiga, gracias 💛',
                'Qué amable eres 🌸'
            ],
            challenge: [
                '¡Una elección acertada! 👑',
                'Qué gusto tan refinado ✨',
                'Gracias por participar en el reto 🌹',
                '¡Me encanta tu respuesta! 🤍',
                'Gran elección, gracias 💛'
            ],
            greeting: [
                'Bienvenida, guapa 🌹',
                'Qué alegría verte por aquí ✨',
                'Que Dios te guarde, bienvenida 🤍',
                'Bienvenida a casa 💛'
            ],
            question: [
                'Ven a verme a la pantalla de chat 💬',
                'Pregúntame en la pantalla de chat, te respondo allí 💬'
            ]
        },
        ru: {
            praise: [
                'Огромное спасибо, дорогая 🤍',
                'Твои слова согрели мне сердце 🌹',
                'У тебя изысканный вкус ✨',
                'Благослови тебя Бог, спасибо 💛',
                'Как мило, спасибо 🌸'
            ],
            challenge: [
                'Отличный выбор! 👑',
                'У тебя изысканный вкус ✨',
                'Спасибо за участие в челлендже 🌹',
                'Мне нравится твой ответ! 🤍',
                'Прекрасный выбор, спасибо 💛'
            ],
            greeting: [
                'Добро пожаловать, дорогая 🌹',
                'Рада видеть тебя здесь ✨',
                'Храни тебя Бог, добро пожаловать 🤍',
                'Добро пожаловать к нам 💛'
            ],
            question: [
                'Заходи ко мне на экран чатов 💬',
                'Задай вопрос на экране чатов, я отвечу там 💬'
            ]
        }
    };

    // الكلمات المفتاحية لكل صنف.
    //  - الكلمات اللاتينية: كلمة كاملة.
    //  - العربية والروسية: جزء من الكلمة (باش تدخل "الجمال" مع "جمال").
    //  - "=" فالبداية فالعربية: كلمة كاملة (مع و/ف قبلها اختياريا).
    var ROBATY_WORDS = {
        spam: [
            'http', 'www.', '.com', 'whatsapp', 'telegram', 'واتساب', 'واتس اب', 'تلغرام',
            'follow me', 'suivez', 'link in bio', 'تابعني', 'تابعوني', 'promo', 'gratuit'
        ],
        negative: [
            // عربية / دارجة
            'خايب', 'قبيح', 'بشع', 'زبل', 'تفو', 'كاذب', 'غبي', 'سخيف', 'فضيحه', 'مقرف',
            'نصاب', 'حقير', 'وقح', 'سيء', 'مزيف', 'حرام عليك', 'ما عجبنيش', 'ماعجبنيش',
            'ما عجبتنيش', 'ماعجبتنيش', '=كلب', '=حمار', 'قحبه', 'عاهره', 'زامل', 'مكروه',
            // فرنسية
            'nul', 'nulle', 'moche', 'horrible', 'arnaque', 'degoutant', 'laide', 'pourri',
            'honte', 'menteuse', 'fake', 'faux', 'hypocrite', 'connard', 'conne', 'pute', 'merde',
            // إنجليزية
            'ugly', 'stupid', 'trash', 'scam', 'hate', 'liar', 'disgusting', 'awful', 'terrible',
            'shame', 'bitch', 'idiot', 'fuck', 'shit', 'boring',
            // إسبانية
            'feo', 'fea', 'estafa', 'asco', 'mentira', 'mentirosa', 'basura', 'odio',
            'verguenza', 'puta', 'estupida',
            // روسية
            'ужас', 'отстой', 'фейк', 'мошенник', 'обман', 'урод', 'гадост', 'ненавиж',
            'тупая', 'тупой', 'противно', 'мерзк', 'ложь', 'стыд'
        ],
        question: [
            'شحال', 'بشحال', '=فين', 'كيفاش', 'علاش', 'شكون', 'شنو', 'ثمن', 'عنوان', 'رابط',
            'توصيل', '=كم', '=واش', '=منين',
            'combien', 'pourquoi', 'quand', 'prix', 'tarif', 'lien', 'adresse', 'livraison',
            'how much', 'where', 'price', 'link', 'address', 'delivery',
            'cuanto', 'donde', 'cuando', 'precio', 'enlace', 'direccion', 'entrega',
            'сколько', 'где', 'цена', 'ссылк', 'адрес', 'доставк'
        ],
        challenge: [
            'كيعجبني', 'كتعجبني', 'تيعجبني', 'كنفضل', 'نفضل', 'كنختار', 'اخترت', 'ختاريت',
            'خترت', 'فضلت', 'انا مع', 'المفضل', 'ذوقي',
            'je prefere', 'je choisis', 'mon choix', 'mon prefere', 'ma preference',
            'i prefer', 'i choose', 'my choice', 'my favorite', 'my favourite',
            'prefiero', 'elijo', 'mi favorito', 'mi favorita', 'mi eleccion',
            'предпочитаю', 'выбираю', 'мой выбор', 'любимый', 'любимая', 'я за'
        ],
        praise: [
            'زوين', 'جميل', 'رائع', 'واعر', 'روعه', 'تبارك', 'ماشاء الله', 'ما شاء الله', 'ماشالله',
            'خيال', 'خرافي', 'احسن', 'ابداع', 'مبدع', 'فخم', 'راقي', 'اناقه', 'انيق', 'تحفه',
            'يا سلام', 'جمال', 'حلو', 'مذهل', 'ساحر', 'سحر', 'عظيم', 'تسلم', 'قمر', 'ملكه', 'بنين',
            'zwin', 'zwina', 'mashallah', 'machallah', 'masha allah', 'tbarkallah', 'tbark allah',
            'wa3er', 'wa3ra', 'jmil', 'jmila', 'khayal',
            'magnifique', 'belle', 'beau', 'superbe', 'splendide', 'sublime', 'bravo', 'j\'adore',
            'adore', 'canon', 'elegante', 'elegant', 'wow', 'parfait', 'chic', 'magique', 'merveilleux',
            'felicitations', 'bien joue', 'trop bien',
            'beautiful', 'gorgeous', 'stunning', 'amazing', 'love', 'lovely', 'pretty', 'awesome',
            'perfect', 'queen', 'wonderful', 'great', 'nice', 'cool',
            'hermosa', 'hermoso', 'bonita', 'bonito', 'precioso', 'preciosa', 'increible', 'encanta',
            'maravilloso', 'guapa', 'espectacular', 'perfecto', 'perfecta', 'bello', 'bella', 'genial',
            'красив', 'прекрасн', 'восхитительн', 'шикарн', 'великолепн', 'обожаю', 'класс', 'супер',
            'потрясающ', 'чудесн', 'нрав', 'изумительн', 'молодец'
        ],
        salam: [
            'سلام عليكم', 'salam alaykoum', 'salam alaykom', 'salam alikoum', 'salam alaikum',
            'assalamu alaykum', 'assalam alaykum', 'salam aleikum'
        ],
        greeting: [
            'مرحبا', 'اهلا', 'صباح الخير', 'مساء الخير', 'صباح النور', '=سلام', '=لاباس',
            'bonjour', 'salut', 'bonsoir', 'coucou', 'hello', 'hi', 'hey', 'good morning',
            'good evening', 'hola', 'buenos dias', 'buenas', 'salam', 'slm', 'labas',
            'привет', 'здравствуй', 'добрый день', 'доброе утро', 'добрый вечер'
        ],
        // علامات الدارجة المكتوبة بحروف لاتينية (باش نردو بالعربية)
        arabizi: [
            'zwin', 'zwina', 'bzaf', 'wa3er', 'wa3ra', 'mashallah', 'machallah', 'masha allah',
            'tbarkallah', 'tbark allah', 'salam', 'slm', 'labas', 'kifach', 'chhal', '3lach',
            'mzyan', 'mzyana', 'jmil', 'jmila', 'wallah', 'hamdullah', 'inchallah'
        ]
    };

    var NEGATIVE_EMOJI = /[\u{1F44E}\u{1F621}\u{1F92C}\u{1F620}\u{1F92E}\u{1F612}\u{1F644}\u{1F624}\u{1F4A9}\u{1F595}]/u;

    function normText(s) {
        return String(s || '').toLowerCase()
            .normalize('NFD').replace(/\p{M}/gu, '')
            .replace(/[\u0623\u0625\u0622]/g, '\u0627')
            .replace(/\u0649/g, '\u064a')
            .replace(/\u0629/g, '\u0647')
            .replace(/\u0640/g, '')
            .replace(/(.)\1{2,}/gu, '$1');
    }

    function escapeRx(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    var BOUND_L = '(?:^|[^\\p{L}\\p{N}])';
    var BOUND_R = '(?:$|[^\\p{L}\\p{N}])';

    function termSource(term) {
        var exact = term.charAt(0) === '=';
        var n = normText(exact ? term.slice(1) : term);
        var src = escapeRx(n);
        if (/[a-z]/.test(n)) return BOUND_L + src + BOUND_R;                 // لاتيني: كلمة كاملة
        if (exact) return BOUND_L + '[\\u0648\\u0641]?' + src + BOUND_R;     // عربي: كلمة كاملة
        return src;                                                           // عربي/روسي: جزء من كلمة
    }

    var rxCache = {};
    function matcher(name) {
        if (!rxCache[name]) {
            rxCache[name] = new RegExp('(?:' + ROBATY_WORDS[name].map(termSource).join('|') + ')', 'u');
        }
        return rxCache[name];
    }

    // الصنف: negative | question | challenge | praise | salam | greeting | emoji | unclear
    function classifyComment(raw) {
        var text = String(raw || '');
        var t = normText(text);
        if (!t.trim()) return 'unclear';

        if (NEGATIVE_EMOJI.test(text) || matcher('spam').test(t) || matcher('negative').test(t)) return 'negative';
        if (!/[\p{L}\p{N}]/u.test(t)) return 'emoji';
        if (/[?\u061f]/.test(text) || matcher('question').test(t)) return 'question';
        if (matcher('challenge').test(t)) return 'challenge';
        if (matcher('praise').test(t)) return 'praise';
        if (matcher('salam').test(t)) return 'salam';
        if (matcher('greeting').test(t)) return 'greeting';
        return 'unclear';
    }

    function appLangCode() {
        try { return window.RobatyI18n ? window.RobatyI18n.getCurrentLang() : 'ar'; } catch (e) { return 'ar'; }
    }

    // لغة الرد: حسب لغة التعليق
    function detectReplyLang(raw) {
        var text = String(raw || '');
        if (/[\u0600-\u06FF]/.test(text)) return 'ar';
        if (/[\u0400-\u04FF]/.test(text)) return 'ru';
        if (matcher('arabizi').test(normText(text))) return 'ar';
        var app = appLangCode();
        return (app === 'fr' || app === 'en' || app === 'es') ? app : 'fr';
    }

    function hashStr(str) {
        var h = 5381;
        for (var i = 0; i < str.length; i++) { h = ((h << 5) + h + str.charCodeAt(i)) | 0; }
        return Math.abs(h);
    }

    function pickPool(cat, lang) {
        if (cat === 'emoji' || cat === 'unclear') return ROBATY_EMOJI;
        var set = ROBATY_REPLIES[lang] || ROBATY_REPLIES.fr;
        if (cat === 'salam' && !set.salam) cat = 'greeting';
        return set[cat];
    }

    // كترجع رد افتراضي من Robaty (أو null) لتعليق من المستوى الأول
    function robatyReplyFor(c, ms) {
        if (!ms) return null;

        var cat = classifyComment(c.text);
        if (cat === 'negative') return null;                       // النقد: ما كتردّش

        var h = hashStr(c.id);
        var rate = ROBATY_RATES[cat] != null ? ROBATY_RATES[cat] : 80;
        if (h % 100 >= rate) return null;

        var pool = pickPool(cat, detectReplyLang(c.text));
        if (!pool || !pool.length) return null;

        var delay = (1 + (Math.floor(h / 100) % 9)) * 60000;       // من 1 إلى 9 دقائق

        return {
            id: 'robaty-' + c.id,
            parentId: c.id,
            text: pool[Math.floor(h / 1000) % pool.length],
            ms: ms + delay,
            isRobaty: true
        };
    }
    // <<< ROBATY-REPLIES END

    function msOf(c) {
        return c.createdAt && c.createdAt.toMillis ? c.createdAt.toMillis() : null;
    }

    // قلب محلي لردود Robaty المبرمجة (كيتحفظ فـ localStorage فهاد الجهاز فقط)
    function getVirtualLikes() {
        try { return JSON.parse(localStorage.getItem('robaty_virtual_likes') || '{}') || {}; } catch (e) { return {}; }
    }

    function toggleVirtualLike(id) {
        var all = getVirtualLikes();
        if (all[id]) { delete all[id]; } else { all[id] = 1; }
        try { localStorage.setItem('robaty_virtual_likes', JSON.stringify(all)); } catch (e) {}
        renderList();
    }

    // c.isRobaty = رد افتراضي من Robaty | isReply = كيتعرض داخل خيط الردود
    function commentHTML(c, isReply) {
        var virtual = !!c.isRobaty;
        var likedBy = c.likedBy || [];
        var liked = !!(currentUser && likedBy.indexOf(currentUser.uid) !== -1);
        var ms = virtual ? c.ms : msOf(c);
        var name = virtual ? 'robaty_ai' : (c.authorName || ct('comments_anonymous', 'مستخدمة'));
        var threadId = c.parentId || c.id;

        var avatar = virtual
            ? '<img src="robaty-profile.jpg" alt="" class="comment-avatar">'
            : avatarHTML(c.authorPhoto, name);

        var head =
            '<span class="comment-author" dir="auto">' + escapeHtml(name) + '</span>' +
            (virtual ? '<i class="fa-solid fa-circle-check comment-verify"></i>' : '') +
            '<span class="comment-time">' + escapeHtml(timeAgo(ms)) + '</span>' +
            (virtual ? '<span class="comment-author-badge">' + escapeHtml(lt('author')) + '</span>' : '');

        var mention = (!virtual && c.replyToName)
            ? '<span class="reply-mention" dir="auto">@' + escapeHtml(c.replyToName) + '</span> '
            : '';

        var vLiked = virtual && !!getVirtualLikes()[c.id];
        var likeBtn = virtual ?
            '<button type="button" class="comment-like' + (vLiked ? ' liked' : '') + '" data-virtual-id="' + escapeHtml(c.id) + '" aria-label="like">' +
                '<i class="' + (vLiked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
                '<span>' + (vLiked ? 1 : '') + '</span>' +
            '</button>' :
            '<button type="button" class="comment-like' + (liked ? ' liked' : '') + '" data-comment-id="' + escapeHtml(c.id) + '" aria-label="like">' +
                '<i class="' + (liked ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
                '<span>' + (likedBy.length || '') + '</span>' +
            '</button>';

        return '<div class="comment-item' + (isReply ? ' is-reply' : '') + (virtual ? ' is-robaty' : '') + '">' +
                   avatar +
                   '<div class="comment-main">' +
                       '<div class="comment-head">' + head + '</div>' +
                       '<div class="comment-text" dir="auto">' + mention + escapeHtml(c.text) + '</div>' +
                       '<div class="comment-actions">' +
                           '<button type="button" class="comment-reply-btn"' +
                               ' data-reply-parent="' + escapeHtml(threadId) + '"' +
                               ' data-reply-name="' + escapeHtml(name) + '"' +
                               ' data-reply-mention="' + (isReply ? '1' : '0') + '">' +
                               escapeHtml(lt('reply')) +
                           '</button>' +
                       '</div>' +
                   '</div>' +
                   likeBtn +
               '</div>';
    }

    // خيط كامل: التعليق + زر "عرض الردود" + الردود (بحال إنستغرام)
    function threadHTML(c, replies) {
        var open = !!expanded[c.id];
        var html = '<div class="comment-thread">' + commentHTML(c, false);

        if (replies.length) {
            html += '<button type="button" class="comment-replies-toggle" data-thread-id="' + escapeHtml(c.id) + '">' +
                        '<span class="replies-line"></span>' +
                        escapeHtml(open ? lt('hide_replies') : lt('view_replies') + ' (' + replies.length + ')') +
                    '</button>';

            if (open) {
                html += '<div class="comment-replies">' +
                            replies.map(function (r) { return commentHTML(r, true); }).join('') +
                        '</div>';
            }
        }

        return html + '</div>';
    }

    // ---------------------------------------------------------------
    // رسم لائحة التعليقات (المثبّت + الأحدث أولا، والردود تحت كل تعليق)
    // ---------------------------------------------------------------
    var lastItems = [];
    var listLoaded = false;

    function renderList() {
        try {
            renderListInner();
        } catch (e) {
            var el = document.getElementById('commentsList');
            if (el) el.innerHTML = '<div class="comments-empty">⚠️ ' + escapeHtml(String((e && e.message) || e)) + '</div>';
            console.error(e);
        }
    }

    function renderListInner() {
        var listEl = document.getElementById('commentsList');
        if (!listEl) return;

        if (!listLoaded) return; // كنتسناو أول استجابة من Firestore

        var keepScroll = listEl.scrollTop;
        if (revealTimer) { clearTimeout(revealTimer); revealTimer = null; }

        var now = Date.now();
        var tops = [], repliesBy = {};

        lastItems.forEach(function (c) {
            if (c.parentId) {
                (repliesBy[c.parentId] = repliesBy[c.parentId] || []).push(c);
            } else {
                tops.push(c);
            }
        });

        // ردود Robaty الافتراضية: كتبان غير من بعد التأخير ديالها (كتبان طبيعية)
        var nextReveal = null;
        tops.forEach(function (c) {
            var rr = robatyReplyFor(c, msOf(c));
            if (!rr) return;
            if (rr.ms <= now) {
                (repliesBy[c.id] = repliesBy[c.id] || []).push(rr);
            } else if (nextReveal === null || rr.ms < nextReveal) {
                nextReveal = rr.ms;
            }
        });

        // الردود: الأقدم أولا (بحال إنستغرام)
        function rms(r) { return r.isRobaty ? r.ms : (msOf(r) || now); }
        Object.keys(repliesBy).forEach(function (k) {
            repliesBy[k].sort(function (a, b) { return rms(a) - rms(b); });
        });

        var html = pinnedHTML();

        if (!tops.length) {
            html += '<div class="comments-empty">' + ct('comments_empty', 'مازال ماكاين تعليقات — كوني الأولى ✨') + '</div>';
        } else {
            html += tops.map(function (c) { return threadHTML(c, repliesBy[c.id] || []); }).join('');
        }

        listEl.innerHTML = html;
        listEl.scrollTop = keepScroll;

        if (nextReveal !== null) {
            revealTimer = setTimeout(renderList, Math.min(nextReveal - now + 500, 600000));
        }
    }

    // ---------------------------------------------------------------
    // الرد على تعليق (شريط "الرد على ..." فوق خانة الكتابة)
    // ---------------------------------------------------------------
    function updateReplyBar() {
        var bar = document.getElementById('replyingBar');
        var input = document.getElementById('commentInput');
        if (!bar) return;

        if (replyTarget) {
            bar.hidden = false;
            bar.innerHTML =
                '<span>' + escapeHtml(lt('replying_to')) + ' <b dir="auto">' + escapeHtml(replyTarget.name) + '</b></span>' +
                '<button type="button" id="replyCancelBtn" aria-label="cancel"><i class="fa-solid fa-xmark"></i></button>';
            document.getElementById('replyCancelBtn').addEventListener('click', function () {
                replyTarget = null;
                updateReplyBar();
            });
            if (input) input.placeholder = lt('reply_placeholder');
        } else {
            bar.hidden = true;
            bar.innerHTML = '';
            if (input) input.placeholder = ct('comments_placeholder', 'اكتبي تعليق...');
        }
    }

    function startReply(parentId, name, mention) {
        if (!currentUser) {
            signInWithGoogle();
            return;
        }
        replyTarget = { parentId: parentId, name: name, mention: !!mention };
        updateReplyBar();

        var input = document.getElementById('commentInput');
        if (input) input.focus();
    }

    function toggleCommentLike(commentId) {
        if (!currentUser) {
            signInWithGoogle();
            return;
        }

        var item = lastItems.filter(function (c) { return c.id === commentId; })[0];
        var liked = !!(item && item.likedBy && item.likedBy.indexOf(currentUser.uid) !== -1);
        var FV = firebase.firestore.FieldValue;

        db.collection('comments').doc(commentId).update({
            likedBy: liked ? FV.arrayRemove(currentUser.uid) : FV.arrayUnion(currentUser.uid)
        }).catch(function (err) {
            console.warn('comment like', err);
        });
    }

    // ---------------------------------------------------------------
    // بناء واجهة النافذة (لائحة + خانة الكتابة)
    // ---------------------------------------------------------------
    function renderCommentsShell() {
        var body = document.querySelector('#simpleModal .simple-modal-body');

        listLoaded = false;
        lastItems = [];

        body.innerHTML =
            '<div class="comments-wrap">' +
                '<div id="commentsList" class="comments-list"><div class="comments-loading">' + ct('comments_loading', 'كنحملو التعليقات...') + '</div></div>' +
                '<div id="commentsComposer" class="comments-composer"></div>' +
            '</div>';

        document.getElementById('commentsList').addEventListener('click', function (e) {
            if (!e.target.closest) return;

            var likeBtn = e.target.closest('.comment-like');
            if (likeBtn) {
                var vid = likeBtn.getAttribute('data-virtual-id');
                if (vid) { toggleVirtualLike(vid); return; }
                toggleCommentLike(likeBtn.getAttribute('data-comment-id'));
                return;
            }

            var replyBtn = e.target.closest('.comment-reply-btn');
            if (replyBtn) {
                startReply(
                    replyBtn.getAttribute('data-reply-parent'),
                    replyBtn.getAttribute('data-reply-name'),
                    replyBtn.getAttribute('data-reply-mention') === '1'
                );
                return;
            }

            var toggleBtn = e.target.closest('.comment-replies-toggle');
            if (toggleBtn) {
                var id = toggleBtn.getAttribute('data-thread-id');
                expanded[id] = !expanded[id];
                renderList();
            }
        });

        renderAuthUI();
    }

    var QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

    function renderAuthUI() {
        var composer = document.getElementById('commentsComposer');

        if (!composer) {
            return; // النافذة ماشي مفتوحة دابا
        }

        if (!currentUser) {
            replyTarget = null;
            composer.innerHTML =
                '<button id="commentsSignInBtn" class="comments-signin-btn">' +
                    ct('comments_signin', 'سجلي الدخول بـ Google باش تكتبي تعليق') +
                '</button>';

            document.getElementById('commentsSignInBtn').addEventListener('click', signInWithGoogle);
            return;
        }

        var name = currentUser.displayName || ct('comments_anonymous', 'مستخدمة');

        composer.innerHTML =
            '<div id="replyingBar" class="replying-bar" hidden></div>' +
            '<div class="comments-quick">' +
                QUICK_EMOJIS.map(function (e) { return '<button type="button" class="quick-emoji">' + e + '</button>'; }).join('') +
            '</div>' +
            '<div class="comments-inputrow">' +
                avatarHTML(currentUser.photoURL, name) +
                '<div class="comment-input-wrap">' +
                    '<textarea id="commentInput" class="comment-input" dir="auto" rows="1" placeholder="' + escapeHtml(ct('comments_placeholder', 'اكتبي تعليق...')) + '"></textarea>' +
                    '<button type="button" id="commentSendBtn" class="comment-send-btn">' + ct('send_btn', 'إرسال') + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="comments-userline">' + escapeHtml(name) + ' · <button type="button" id="commentsSignOutBtn">' + ct('comments_signout', 'خروج') + '</button></div>';

        var input = document.getElementById('commentInput');
        var sendBtn = document.getElementById('commentSendBtn');

        function refreshInput() {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 90) + 'px';
            sendBtn.classList.toggle('active', input.value.trim().length > 0);
        }

        updateReplyBar();

        input.addEventListener('input', refreshInput);
        sendBtn.addEventListener('click', handleSubmitComment);
        document.getElementById('commentsSignOutBtn').addEventListener('click', signOutUser);

        composer.querySelectorAll('.quick-emoji').forEach(function (btn) {
            btn.addEventListener('click', function () {
                input.value += btn.textContent;
                input.focus();
                refreshInput();
            });
        });
    }

    // ---------------------------------------------------------------
    // قراءة التعليقات (realtime) وعرضها
    // ---------------------------------------------------------------
    function subscribeToComments(postId) {
        if (unsubscribeComments) {
            unsubscribeComments();
        }

        // ملاحظة: ماكاينش orderBy هنا عمدا — where + orderBy مع بعض كيحتاجو
        // "composite index" فـ Firestore. كنديرو الترتيب هنا فـ JS عوض.
        unsubscribeComments = db.collection('comments')
            .where('postId', '==', postId)
            .onSnapshot(function (snapshot) {
                var items = [];

                snapshot.forEach(function (doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    items.push(d);
                });

                // الأحدث أولا (تعليق لسا كيتكتب كيبقى فوق)
                function ms(c) {
                    return c.createdAt && c.createdAt.toMillis ? c.createdAt.toMillis() : Date.now();
                }
                items.sort(function (a, b) { return ms(b) - ms(a); });

                lastItems = items;
                listLoaded = true;
                renderList();

                commentsSeen[postId] = items.length;
                applyStats(postId);
            }, function (err) {
                var listEl = document.getElementById('commentsList');
                if (listEl) {
                    listEl.innerHTML = '<div class="comments-empty">' + ct('comments_load_error', 'تعذر تحميل التعليقات') + ': ' + escapeHtml(err.message || err.code || '') + '</div>';
                }
                console.error(err);
            });
    }

    // ---------------------------------------------------------------
    // إرسال تعليق جديد
    // ---------------------------------------------------------------
    function handleSubmitComment() {
        var input = document.getElementById('commentInput');
        var text = input.value.trim();

        if (!text) {
            return;
        }

        var contactIssue = checkContactInfo(text);
        if (contactIssue) {
            alert(ct(contactIssue, 'ممنوع وضع أرقام هواتف أو روابط أو حسابات تواصل فالتعليقات'));
            return;
        }

        if (containsBannedWord(text)) {
            alert(ct('comments_banned', 'التعليق فيه كلمة ممنوعة، عافاك بدليه'));
            return;
        }

        if (text.length > 500) {
            alert(ct('comments_too_long', 'التعليق طويل بزاف (500 حرف الحد الأقصى)'));
            return;
        }

        var postIdAtSend = currentPostId;

        var payload = {
            postId: postIdAtSend,
            text: text,
            uid: currentUser.uid,
            authorName: currentUser.displayName || '',
            authorPhoto: currentUser.photoURL || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // رد على تعليق: كنربطوه بالتعليق الأصلي (خيط واحد بحال إنستغرام)
        var sentTarget = replyTarget;
        if (sentTarget) {
            payload.parentId = sentTarget.parentId;
            if (sentTarget.mention) payload.replyToName = sentTarget.name;
        }

        db.collection('comments').add(payload).then(function () {
            input.value = '';
            input.style.height = 'auto';

            if (sentTarget) {
                expanded[sentTarget.parentId] = true; // نبينو الرد الجديد مباشرة
                replyTarget = null;
                updateReplyBar();
                renderList();
            }

            var sendBtn = document.getElementById('commentSendBtn');
            if (sendBtn) sendBtn.classList.remove('active');

            // العداد الحقيقي (إلا فشل ما كيأثرش على التعليق)
            bump(postIdAtSend, 'comments');
        }).catch(function (err) {
            alert(ct('comments_send_error', 'تعذر إرسال التعليق') + ': ' + (err.message || err.code || ct('err_unknown', 'خطأ غير معروف')));
            console.error(err);
        });
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---------------------------------------------------------------
    // ربط أزرار "تعليق" فـ moments.html
    // ---------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        subscribeToStats();

        document.querySelectorAll('.action-item[data-action="comments"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var postId = btn.closest('.post-card').id;
                openCommentsModal(postId);
            });
        });

        document.querySelectorAll('[data-close-simple-modal]').forEach(function (el) {
            el.addEventListener('click', closeCommentsModal);
        });

        var closeBtn = document.getElementById('closeSimpleModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCommentsModal);
        }
    });

})();
