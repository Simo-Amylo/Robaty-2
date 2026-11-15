/* تحدي سفيرة التراث: أسئلة متتالية بعدّاد 10 ثوانٍ ونقاط دائمة (+100 / −50) */
(function () {
    'use strict';
    var KEY = 'robaty_contest_v2', WIN = 100, LOSS = 50, SECS = 25;
    var $ = function (id) { return document.getElementById(id); };
    var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* نص أبيض افتراضياً؛ إذا كان ثيم الشاشة فاتحاً نستعمل نصاً داكناً */
    try {
        var bgc = getComputedStyle(document.querySelector('.app-container') || document.body).backgroundColor;
        var m = bgc.match(/[\d.]+/g);
        if (m && (m[3] === undefined || +m[3] > 0.5) && (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.6) {
            document.body.style.setProperty('--c-text', '#2b1a08');
        }
    } catch (e) {}

    /* ---------- التخزين (النقاط تبقى دائماً) ---------- */
    function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
    var S = load();
    S.points = S.points || 0; S.ci = S.ci || 0; S.qi = S.qi || {}; S.streak = S.streak || 0;
    /* بعد 10 إجابات صحيحة متتالية تتضاعف نقاط الربح (×2) إلى أن تخطئ أو ينتهي الوقت */
    function mult() { return S.streak >= 10 ? 2 : 1; }

    function userName() {
        try {
            if (window.ROBATY_USER_NAME) return String(window.ROBATY_USER_NAME).split(' ')[0];
            var keys = ['robaty_user_name', 'robaty_name', 'ghita_user_name', 'ghita_name', 'userName'];
            for (var i = 0; i < keys.length; i++) {
                var v = localStorage.getItem(keys[i]);
                if (v) return String(v).split(' ')[0];
            }
        } catch (e) {}
        return '';
    }
    function vibrate(p) { try { if (navigator.vibrate && localStorage.getItem('robaty_vibration') !== 'off') navigator.vibrate(p); } catch (e) {} }

    /* ---------- صورة Robaty: انتقال ناعم (الصورة الجديدة تظهر فوق القديمة) ---------- */
    var POSES = ['calm', 'warmth', 'smile'], layer = 0, poseName = '', introOn = true, busy = false, pending = '';
    function setPose(name) {
        if (name === poseName && !busy) return;
        if (busy) { pending = name; return; }
        poseName = name; busy = true;
        var L = [$('cPoseA'), $('cPoseB')], cur = L[layer], next = L[1 - layer];
        next.style.transition = 'none'; next.style.opacity = '0'; next.style.zIndex = '2'; cur.style.zIndex = '1';
        var fade = REDUCED ? 0 : 1.3;
        function done() {
            cur.style.transition = 'none'; cur.style.opacity = '0'; cur.style.zIndex = '0';
            layer = 1 - layer; busy = false;
            if (pending && pending !== poseName) { var p = pending; pending = ''; setPose(p); } else { pending = ''; }
        }
        function go() {
            void next.offsetWidth;
            next.style.transition = 'opacity ' + fade + 's ease-in-out'; next.style.opacity = '1';
            setTimeout(done, fade * 1000 + 60);
        }
        next.onload = function () { if (next.decode) { next.decode().then(go, go); } else { go(); } };
        next.onerror = function () { busy = false; pending = ''; };
        next.src = name + '.png';
    }
    function playIntro() {
        setPose(POSES[0]);
        if (REDUCED) { setPose(POSES[2]); return; }
        setTimeout(function () { if (introOn) setPose(POSES[1]); }, 2200);
        setTimeout(function () { if (introOn) setPose(POSES[2]); }, 4400);
    }

    /* ---------- فقاعة Robaty (كتابة حرفاً بحرف عند الترحيب) ---------- */
    var typeTok = 0;
    function say(pose, text, typed) {
        var el = $('cSay'), tok = ++typeTok;
        $('cSr').textContent = text;
        if (pose) { introOn = false; setPose(pose); }
        if (!typed || REDUCED) { el.textContent = text; return; }
        var ch = Array.from(text), i = 0; el.textContent = '';
        (function step() {
            if (tok !== typeTok) return;
            i++; el.textContent = ch.slice(0, i).join('');
            if (i < ch.length) setTimeout(step, 40);
        })();
    }

    /* ---------- النقاط ---------- */
    function showPoints(delta) {
        $('cPtsN').textContent = S.points; $('cMult').hidden = mult() < 2;
        if (!delta) return;
        var pill = $('cPts'), d = document.createElement('span');
        d.className = 'c-delta ' + (delta > 0 ? 'up' : 'down'); d.textContent = (delta > 0 ? '+' : '−') + Math.abs(delta);
        pill.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1200);
        pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop');
    }

    /* ---------- الشاشة 16/9 ---------- */
    var stage = $('cStage');
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
    function morph() {
        if (REDUCED) return;
        stage.classList.remove('morph'); void stage.offsetWidth; stage.classList.add('morph');
    }
    /* نجوم تتناثر حول صورة Robaty (تُضاف إلى الحاوية لأن الصورة نفسها تقصّ ما يخرج عنها) */
    function avatarSparkles(n) {
        if (REDUCED) return;
        var av = document.querySelector('.c-avatar'), box = av && av.parentNode;
        if (!box) return;
        var cx = av.offsetLeft + av.offsetWidth / 2, cy = av.offsetTop + av.offsetHeight / 2, S4 = ['⭐', '✨', '🌟', '💫'];
        for (var i = 0; i < n; i++) {
            var sp = el('span', 'avatar-sparkle', S4[Math.floor(Math.random() * S4.length)]);
            var ang = Math.random() * Math.PI * 2, dist = 56 + Math.random() * 40;
            sp.style.setProperty('--tx', Math.cos(ang) * dist + 'px'); sp.style.setProperty('--ty', Math.sin(ang) * dist + 'px');
            sp.style.left = cx + 'px'; sp.style.top = cy + 'px';
            box.appendChild(sp); (function (nd) { setTimeout(function () { if (nd.parentNode) nd.parentNode.removeChild(nd); }, 1300); })(sp);
        }
    }
    function stageClear() { stage.innerHTML = ''; stage.style.backgroundImage = ''; }
    function stageIdle() {
        stageClear();
        stage.appendChild(el('div', 'c-ico', '🎯'));
        stage.appendChild(el('p', 'c-res-h', 'تحدي سفيرة التراث'));
        stage.appendChild(el('p', 'c-hint', 'اضغطي على الزر للبدء'));
    }
    function stageQuestion(it) {
        stageClear(); morph();
        if (it.img) { stage.style.backgroundImage = 'url("' + it.img + '")'; stage.appendChild(el('div', 'c-qtop', it.q)); }
        else { stage.appendChild(el('p', 'c-q', it.q)); }
    }
    function stageResult(head, it) {
        stageClear(); morph();
        stage.appendChild(el('p', 'c-res-h', head));
        stage.appendChild(el('p', 'c-res-i', it.info));
    }
    function confetti() {
        if (REDUCED) return;
        var E = ['🎉', '✨', '🎊', '⭐', '🏆'];
        for (var i = 0; i < 16; i++) {
            var c = el('span', 'c-conf', E[i % E.length]);
            c.style.left = (4 + Math.random() * 90) + '%'; c.style.animationDelay = (Math.random() * 0.5) + 's';
            stage.appendChild(c); (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 2600); })(c);
        }
    }

    /* ---------- الأزرار ---------- */
    var optBtns = Array.prototype.slice.call($('cOpts').children);
    function setOpts(texts, enabled) {
        optBtns.forEach(function (b, i) { b.textContent = texts ? texts[i] : ''; b.disabled = !enabled; b.classList.remove('c-ok', 'c-bad'); });
    }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    var mainBtn = $('cMain');

    /* ---------- العدّاد (10 ثوانٍ) ---------- */
    var tEnd = 0, tInt = null;
    function tick() {
        var now = Date.now(), left = Math.max(0, Math.ceil((tEnd - now) / 1000));
        $('cTimeN').textContent = left; $('cTimer').classList.toggle('low', left > 0 && left <= 5);
        if (now >= tEnd) { clearInterval(tInt); endQuestion(); }
    }
    function startTimer() { tEnd = Date.now() + SECS * 1000; clearInterval(tInt); tick(); tInt = setInterval(tick, 200); }

    /* ---------- سير التحدي ---------- */
    var CATS = [], mode = 'intro', cur = null, correctText = '', selected = -1;

    function startQuestion() {
        var cat = CATS[S.ci % CATS.length], idx = (S.qi[cat.id] || 0) % cat.items.length;
        cur = cat.items[idx]; correctText = cur.a; selected = -1;
        S.qi[cat.id] = idx + 1; S.ci = (S.ci + 1) % CATS.length; save();
        mode = 'question';
        mainBtn.textContent = cat.label; mainBtn.classList.add('wait');
        stageQuestion(cur);
        setOpts(shuffle([cur.a].concat(cur.w)), true);
        say('curiosity', 'ركّزي! عندك ' + SECS + ' ثانية ⏱️');
        startTimer();
    }
    /* الضغط على جواب يلوّن الزر المختار فقط؛ النتيجة تظهر عند انتهاء الوقت */
    function answer(i) {
        if (mode !== 'question') return;
        selected = i;
        optBtns.forEach(function (b, k) { b.classList.toggle('c-sel', k === i); });
        vibrate(20);
    }
    function endQuestion() {
        var ok = selected >= 0 && optBtns[selected].textContent === correctText, before = S.points, m = mult();
        if (ok) { S.points += WIN * m; S.streak++; } else { S.points = Math.max(0, S.points - LOSS); S.streak = 0; }
        save(); showPoints(S.points - before);
        optBtns.forEach(function (b, k) {
            b.disabled = true; b.classList.remove('c-sel');
            if (b.textContent === correctText) b.classList.add('c-ok');
            else if (k === selected) b.classList.add('c-bad');
        });
        if (ok) {
            stageResult('✅ الجواب صحيح!', cur); confetti(); avatarSparkles(S.streak === 10 ? 12 : 6);
            say('joy', S.streak === 10 ? 'أسطورة! 10 إجابات متتالية، نقاطك دابا ×2 🔥' : (m > 1 ? 'برافو عليك! ×2 مازال شغال 🔥' : 'برافو عليك! جواب صحيح 👏'));
            vibrate(S.streak === 10 ? [30, 40, 30, 40, 60] : 30);
        } else if (selected < 0) {
            stageResult('⏰ انتهى الوقت · الجواب: ' + correctText, cur);
            say('empathy', 'انتهى الوقت! خليك مركّزة فالسؤال الجاي 💛'); vibrate([40, 40, 40]);
        } else {
            stageResult('❌ الجواب الصحيح: ' + correctText, cur);
            say('empathy', 'ماشي مشكل، المهم تعرفي الجواب دابا 💛'); vibrate([40, 40, 40]);
        }
        mode = 'review';
        mainBtn.textContent = 'المرور إلى السؤال التالي'; mainBtn.classList.remove('wait');
    }

    /* ---------- التشغيل ---------- */
    $('cBack').addEventListener('click', function () { if (history.length > 1) history.back(); else location.href = 'index.html'; });
    optBtns.forEach(function (b, i) { b.addEventListener('click', function () { answer(i); }); });
    mainBtn.addEventListener('click', function () { if (mode === 'intro' || mode === 'review') startQuestion(); });

    showPoints(0); $('cTimeN').textContent = SECS;
    setOpts(null, false); stageIdle(); playIntro();
    var nm = userName();
    say('', 'مرحبا بك ' + (nm ? nm + ' ' : '') + 'في «تحدي سفيرة التراث». هل أنتِ جاهزة لبدء التحدي؟', true);

    fetch('questions.json').then(function (r) { return r.json(); }).then(function (d) {
        CATS = d.cats; mainBtn.disabled = false;
    }).catch(function () { $('cErr').hidden = false; });
})();
