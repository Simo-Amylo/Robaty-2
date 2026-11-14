/* تحدي اليوم: سؤال + لعبة → نتيجة. يحفظ التقدم محلياً (بدون خادم) */
(function () {
    'use strict';
    var KEY = 'robaty_contest_v1';
    var Q_PTS = 10, G_PTS = [20, 15, 10], MAX = 30;
    var $ = function (id) { return document.getElementById(id); };

    /* نص أبيض افتراضياً؛ إذا كان ثيم الشاشة فاتحاً (كريمي/وردي/...) نستعمل نصاً داكناً */
    try {
        var bgc = getComputedStyle(document.querySelector('.app-container') || document.body).backgroundColor;
        var m = bgc.match(/[\d.]+/g);
        if (m && (m[3] === undefined || +m[3] > 0.5) && (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.6) {
            document.body.style.setProperty('--c-text', '#2b1a08');
        }
    } catch (e) {}

    /* ---------- التاريخ والتخزين ---------- */
    function pad(n) { return String(n).padStart(2, '0'); }
    function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    var now = new Date(), today = dkey(now);
    var yest = dkey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    var dayNum = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5);

    function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
    var S = load();
    S.total = S.total || 0; S.streak = S.streak || 0; S.last = S.last || ''; S.days = S.days || {};
    var D = S.days[today] || (S.days[today] = { q: null, g: null, tries: 0, done: false });

    /* ---------- مساعدات ---------- */
    function norm(t) {
        return String(t).toLowerCase()
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
            .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
            .replace(/[^a-z0-9\u0621-\u064A]/g, '').replace(/^ال/, '');
    }
    function seeded(n) { var x = n * 9301 + 49297; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
    function toast(msg) {
        var t = $('cToast'); t.textContent = msg; t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2200);
    }
    function say(pose, text) { $('cSay').textContent = text; if (pose) { introOn = false; setPose(pose); } }

    /* صورة Robaty: تنتقل بين ثلاث وضعيات عند فتح الشاشة (calm → warmth → smile) */
    var POSES = ['calm', 'warmth', 'smile'], poseLayer = 0, poseName = '', introOn = true;
    function setPose(name) {
        if (name === poseName) return;
        poseName = name;
        var L = [$('cPoseA'), $('cPoseB')], cur = L[poseLayer], next = L[1 - poseLayer];
        next.onload = function () { next.classList.add('on'); cur.classList.remove('on'); poseLayer = 1 - poseLayer; };
        next.src = name + '.png';
    }
    function playPoses() {
        var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (calm) { setPose('smile'); return; }
        setPose(POSES[0]);
        setTimeout(function () { if (introOn) setPose(POSES[1]); }, 1500);
        setTimeout(function () { if (introOn) setPose(POSES[2]); }, 3000);
    }
    function show(step) {
        ['pQ', 'pG', 'pR'].forEach(function (id) { $(id).hidden = true; });
        $({ q: 'pQ', g: 'pG', r: 'pR' }[step]).hidden = false;
        var dots = $('cSteps').children, i = { q: 0, g: 1, r: 2 }[step];
        for (var k = 0; k < 3; k++) dots[k].className = k <= i ? 'on' : '';
    }
    function vibrate(p) { try { if (navigator.vibrate && localStorage.getItem('robaty_vibration') !== 'off') navigator.vibrate(p); } catch (e) {} }

    /* ---------- شاشة السؤال ---------- */
    function renderQuestion(ch) {
        $('cTopic').textContent = ch.topic;
        $('cQ').textContent = ch.q;
        var rnd = seeded(dayNum), idx = ch.options.map(function (_, i) { return i; });
        idx.sort(function () { return rnd() - 0.5; });
        var box = $('cOpts'); box.innerHTML = '';
        idx.forEach(function (i) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'color-option'; b.textContent = ch.options[i]; b.dataset.i = i;
            b.addEventListener('click', function () { answerQuestion(ch, i); });
            box.appendChild(b);
        });
        show('q'); say('', 'مرحبا! تحدي اليوم جاهز. نبداو بالسؤال 🧠');
    }
    function answerQuestion(ch, i) {
        if (D.q !== null) return;
        var ok = (i === ch.answer);
        D.q = ok ? Q_PTS : 0; save();
        markQuestion(ch, i); vibrate(ok ? 30 : [40, 40, 40]);
    }
    function markQuestion(ch, picked) {
        var bs = $('cOpts').children;
        for (var k = 0; k < bs.length; k++) {
            bs[k].disabled = true;
            if (+bs[k].dataset.i === ch.answer) bs[k].classList.add('c-ok');
            else if (+bs[k].dataset.i === picked) bs[k].classList.add('c-bad');
        }
        var ok = D.q > 0;
        say(ok ? 'joy' : 'empathy', ok ? 'برافو عليك! جواب صحيح 👏' : 'ماشي مشكل، المهم تعرفي الجواب دابا 💛');
        $('cFact').textContent = '💡 ' + ch.fact; $('cFact').hidden = false;
        $('cToGame').hidden = false;
    }

    /* ---------- شاشة اللعبة ---------- */
    function renderGame(ch) {
        var g = ch.game;
        $('cClue').textContent = g.clue;
        show('g'); updateGameUI(ch);
        if (D.g === null) say('curiosity', 'دابا اللعبة! عندك 3 محاولات، وكل ما كان الجواب بكري كل ما زادت النقط.');
    }
    function updateGameUI(ch) {
        var g = ch.game, left = 3 - D.tries, over = D.g !== null;
        var h = $('cHint');
        if (D.tries >= 1 && !over) { h.textContent = '💡 تلميح: ' + g.hints[Math.min(D.tries - 1, g.hints.length - 1)]; h.hidden = false; } else { h.hidden = true; }
        $('cGuessBox').hidden = over;
        $('cLeft').textContent = over ? (D.g > 0 ? '✅ جواب صحيح: ' + g.accept[0] : 'الجواب هو: ' + g.accept[0]) : 'المحاولات المتبقية: ' + left;
        $('cToResult').hidden = !over;
    }
    function submitGuess(ch) {
        if (D.g !== null) return;
        var v = norm($('cGuess').value);
        if (!v) { toast('اكتبي جوابك أولاً'); return; }
        D.tries++;
        var ok = ch.game.accept.some(function (a) { return norm(a) === v; });
        if (ok) { D.g = G_PTS[D.tries - 1]; say('joy', 'ياااه! عرفتيها فالمحاولة ' + D.tries + ' 🔥'); vibrate(30); }
        else if (D.tries >= 3) { D.g = 0; say('empathy', 'هاد المرة ما نجحتيش، ولكن غدا تحدي جديد 💛'); vibrate([40, 40, 40]); }
        else { say('hope', 'قريبة! جرّبي مرة أخرى، عطيتك تلميح.'); vibrate([40, 40, 40]); }
        $('cGuess').value = ''; save(); updateGameUI(ch);
    }

    /* ---------- النتيجة ---------- */
    function badge(s) {
        return s >= 30 ? '👑 سفيرة التراث' : s >= 20 ? '⭐ نجمة التراث' : s >= 10 ? '🧭 مستكشفة' : '🌱 بداية موفقة';
    }
    function finish(ch) {
        if (!D.done) {
            D.done = true; D.score = (D.q || 0) + (D.g || 0);
            S.total += D.score;
            S.streak = (S.last === yest) ? S.streak + 1 : (S.last === today ? S.streak : 1);
            S.last = today; save();
        }
        renderResult(ch, true);
    }
    function renderResult(ch, anim) {
        var s = D.score || 0;
        $('cBadge').textContent = badge(s);
        $('cScore').textContent = s;
        $('cDetail').textContent = '🧠 السؤال: ' + (D.q || 0) + ' نقطة · 🎮 اللعبة: ' + (D.g || 0) + ' نقطة';
        $('cStreak2').textContent = S.streak; $('cTotal').textContent = S.total;
        $('cStreak').textContent = '🔥 ' + S.streak;
        if (anim) $('cBadge').classList.add('c-pop');
        show('r');
        say(s >= 30 ? 'laugh' : s >= 20 ? 'admiration' : s >= 10 ? 'smile' : 'hope',
            s >= 30 ? 'نتيجة كاملة! أنتِ سفيرة حقيقية للتراث المغربي 👑' : s >= 20 ? 'نتيجة رائعة! بقات ليك شوية وتوصلي للقمة ⭐' : s >= 10 ? 'بداية زوينة، وغدا نعاودو 💪' : 'المهم شاركتي! غدا فرصة جديدة 🌱');
        startCountdown();
    }
    function startCountdown() {
        var el = $('cCount');
        (function tick() {
            var n = new Date(), end = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1), ms = end - n;
            if (ms <= 0) { location.reload(); return; }
            var s = Math.floor(ms / 1000);
            el.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
            setTimeout(tick, 1000);
        })();
    }
    function share() {
        var txt = 'حصلت على ' + D.score + '/30 فتحدي اليوم فـ Robaty 🔥 سلسلتي: ' + S.streak + ' أيام. واش تقدري تهزميني؟ 🇲🇦\n' + location.origin;
        if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); }
        else if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(function () { toast('تم نسخ النتيجة ✅'); }); }
        else { toast('المشاركة غير متاحة على هذا المتصفح'); }
    }

    /* ---------- التشغيل ---------- */
    $('cBack').addEventListener('click', function () { if (history.length > 1) history.back(); else location.href = 'index.html'; });
    $('cStreak').textContent = '🔥 ' + ((S.last === today || S.last === yest) ? S.streak : 0);
    playPoses();

    fetch('challenges.json').then(function (r) { return r.json(); }).then(function (list) {
        var ch = list[dayNum % list.length];
        $('cToGame').addEventListener('click', function () { renderGame(ch); });
        $('cToResult').addEventListener('click', function () { finish(ch); });
        $('cSend').addEventListener('click', function () { submitGuess(ch); });
        $('cGuess').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitGuess(ch); });
        $('cShare').addEventListener('click', share);

        if (D.done) renderResult(ch, false);
        else if (D.q !== null) { if (D.g !== null || D.tries > 0) renderGame(ch); else { renderQuestion(ch); markQuestion(ch, -1); } }
        else renderQuestion(ch);
    }).catch(function () { $('cErr').hidden = false; });
})();
