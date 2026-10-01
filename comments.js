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
            'мразь', 'мрази', 'ублюд*', 'говн*', 'нахуй', 'похуй', 'нихуя'
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
    });

    // ---------------------------------------------------------------
    // فتح نافذة التعليقات لمنشور معين
    // ---------------------------------------------------------------
    function openCommentsModal(postId) {
        currentPostId = postId;

        var modal = document.getElementById('simpleModal');
        var title = document.getElementById('simpleModalTitle');

        title.textContent = ct('comments_title', '💬 التعليقات');
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
    }

    // ---------------------------------------------------------------
    // بناء واجهة النافذة (auth + لائحة + خانة الكتابة)
    // ---------------------------------------------------------------
    function renderCommentsShell() {
        var body = document.querySelector('#simpleModal .simple-modal-body');

        body.innerHTML =
            '<div class="comments-wrap">' +
                '<div id="commentsAuthBar" class="comments-auth-bar"></div>' +
                '<div id="commentsList" class="comments-list"><div class="comments-loading">' + ct('comments_loading', 'كنحملو التعليقات...') + '</div></div>' +
                '<div id="commentsInputBar" class="comments-input-bar"></div>' +
            '</div>';

        renderAuthUI();
    }

    function renderAuthUI() {
        var authBar = document.getElementById('commentsAuthBar');
        var inputBar = document.getElementById('commentsInputBar');

        if (!authBar || !inputBar) {
            return; // النافذة ماشي مفتوحة دابا
        }

        if (currentUser) {
            authBar.innerHTML =
                '<div class="comments-user">' +
                    '<img src="' + (currentUser.photoURL || '') + '" alt="" class="comments-user-avatar">' +
                    '<span>' + escapeHtml(currentUser.displayName || ct('comments_anonymous', 'مستخدمة')) + '</span>' +
                    '<button id="commentsSignOutBtn" class="comments-signout-btn">' + ct('comments_signout', 'خروج') + '</button>' +
                '</div>';

            document.getElementById('commentsSignOutBtn').addEventListener('click', signOutUser);

            inputBar.innerHTML =
                '<textarea id="commentInput" class="comment-input" placeholder="' + ct('comments_placeholder', 'اكتبي تعليق...') + '" rows="2"></textarea>' +
                '<button id="commentSendBtn" class="comment-send-btn">' + ct('send_btn', 'إرسال') + '</button>';

            document.getElementById('commentSendBtn').addEventListener('click', handleSubmitComment);

        } else {
            authBar.innerHTML =
                '<button id="commentsSignInBtn" class="comments-signin-btn">' +
                    ct('comments_signin', 'سجلي الدخول بـ Google باش تكتبي تعليق') +
                '</button>';

            document.getElementById('commentsSignInBtn').addEventListener('click', signInWithGoogle);

            inputBar.innerHTML = '';
        }
    }

    // ---------------------------------------------------------------
    // قراءة التعليقات (realtime) وعرضها
    // ---------------------------------------------------------------
    function subscribeToComments(postId) {
        if (unsubscribeComments) {
            unsubscribeComments();
        }

        var listEl = document.getElementById('commentsList');

        // ملاحظة: ماكاينش orderBy هنا عمدا — where + orderBy مع بعض كيحتاجو
        // "composite index" فـ Firestore. كنديرو الترتيب هنا فـ JS عوض.
        unsubscribeComments = db.collection('comments')
            .where('postId', '==', postId)
            .onSnapshot(function (snapshot) {
                if (snapshot.empty) {
                    listEl.innerHTML = '<div class="comments-empty">' + ct('comments_empty', 'مازال ماكاين تعليقات — كوني الأولى ✨') + '</div>';
                    return;
                }

                var items = [];
                snapshot.forEach(function (doc) {
                    items.push(doc.data());
                });

                items.sort(function (a, b) {
                    var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                    var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
                    return ta - tb;
                });

                var html = '';
                items.forEach(function (c) {
                    html +=
                        '<div class="comment-item">' +
                            '<img src="' + (c.authorPhoto || '') + '" alt="" class="comment-avatar">' +
                            '<div class="comment-body">' +
                                '<div class="comment-author">' + escapeHtml(c.authorName || ct('comments_anonymous', 'مستخدمة')) + '</div>' +
                                '<div class="comment-text">' + escapeHtml(c.text) + '</div>' +
                            '</div>' +
                        '</div>';
                });

                listEl.innerHTML = html;
                listEl.scrollTop = listEl.scrollHeight;
            }, function (err) {
                listEl.innerHTML = '<div class="comments-empty">' + ct('comments_load_error', 'تعذر تحميل التعليقات') + ': ' + escapeHtml(err.message || err.code || '') + '</div>';
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

        db.collection('comments').add({
            postId: currentPostId,
            text: text,
            uid: currentUser.uid,
            authorName: currentUser.displayName || '',
            authorPhoto: currentUser.photoURL || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            input.value = '';
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
