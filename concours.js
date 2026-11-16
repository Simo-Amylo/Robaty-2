/* تحدي سفيرة التراث: أسئلة متتالية بعدّاد 10 ثوانٍ ونقاط دائمة (+100 / −50) */
(function () {
    'use strict';
    var KEY = 'robaty_contest_v2', WIN = 100, LOSS = 50, SECS = 15;
    var $ = function (id) { return document.getElementById(id); };
    var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* نص أبيض افتراضياً؛ إذا كان ثيم الشاشة فاتحاً نستعمل نصاً داكناً */
    try {
        var bgc = getComputedStyle(document.querySelector('.app-container') || document.body).backgroundColor;
        var m = bgc.match(/[\d.]+/g);
        if (m && (m[3] === undefined || +m[3] > 0.5) && (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.6) {
            document.body.style.setProperty('--c-text', '#2b1a08');
            document.body.style.setProperty('--c-bubble-bg', 'linear-gradient(135deg,rgba(229,179,92,.28),rgba(255,255,255,.65))');
            document.body.style.setProperty('--c-tail', '#f4ead7');
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
    /* الفقاعة بارتفاع ثابت: إذا طالت الجملة يصغر الخط قليلاً بدل أن تتحرك بقية الشاشة */
    function fitBubble() {
        var b = $('cSay'); b.style.fontSize = '';
        var s = parseFloat(getComputedStyle(b).fontSize);
        while (b.scrollHeight > b.clientHeight + 1 && s > 11) { s -= 1; b.style.fontSize = s + 'px'; }
    }
    function say(pose, text, typed) {
        var el = $('cSay'), tok = ++typeTok;
        $('cSr').textContent = text;
        if (pose) { introOn = false; setPose(pose); }
        el.textContent = text; fitBubble();
        if (!typed || REDUCED) return;
        var ch = Array.from(text), i = 0; el.textContent = '';
        (function step() {
            if (tok !== typeTok) return;
            i++; el.textContent = ch.slice(0, i).join('');
            if (i < ch.length) setTimeout(step, 40);
        })();
    }

    /* ---------- حوار Robaty: عدة عبارات لكل حالة، بدون تكرار آخر 3 ---------- */
    var DIALOGUES = {
        ready: [
            'يلا نشوفو شكون غادي تكون بطلة اليوم! 😍', 'ركزي معايا مزيان، بعض الأسئلة فيها مفاجآت!', 'واجدة؟ خدي نفس عميق وانطلقي بثقة!',
            'ما تخافيش من الغلط، المهم تتعلمي معلومة جديدة!', 'ورّيني شنو عندك! التحدي بينك وبين الأسئلة!', 'استعدي، كل سؤال عندو مفاجأتو! 🔥',
            'يلا بينا! خلي الذكاء ديالك يهضر! 👑', 'أنا متحمسة بزاف، ها هو السؤال الأول! 😉'],
        question: [
            'ها هو السؤال! شنو رأيك؟ 😉', 'ركزي مزيان، الجواب يمكن يكون أقرب مما كتتصوري!', 'سؤال جديد! واش عندك الجواب؟', 'فكري مزيان قبل ما تختاري!',
            'هنا غادي نشوفو قوة الملاحظة ديالك! 🧐', 'واش هادي معلومة عارفاها من قبل؟', 'انتبهي للتفاصيل، فيها مفتاح الجواب!', 'سؤال آخر، ورّيني شطارتك!',
            'هاد المرة بغيت نشوف واش غادي تفاجئيني! 😄', 'ركزي معايا، ما بغيناش نضيعو نقطة سهلة! 🎯'],
        correct: [
            'واااو! جواب صحيح! كنت عارفة أنك قدّها! 😍', 'برافووو عليك! هادي نقطة مستحقة! 👏', 'واعر عليك! باين المعلومات حاضرة عندك!', 'جواب فالمستوى! فخورة بصاحبتي! 👑',
            'هي هادي! جواب صحيح وبكل ثقة! 🔥', 'كتفاجئيني سؤال من بعد سؤال! 😍', 'ممتاز! ذكاء وتركيز، تركيبة رابحة! 😉', 'صحّ! هاد السؤال ما فلتش منك!',
            'أحسنتِ! النقاط كيتجمعو والحماس كيزيد!', 'واش هاد المستوى غادي يبقى حتى للنهاية؟ أنا معجبة! 😄'],
        streak3: [
            'ثلاثة صحيحة متتابعة! واعر عليك! 🔥', 'هادي هي البداية اللي بغيت نشوف! 👏', 'ثلاثة على التوالي! باين عليك مركزة اليوم!',
            'مستوى زوين بزاف! كملي بنفس الثقة!', 'ثلاث مرات والجواب صحيح! راكي داخلة بقوة! 😍', 'عجبني التركيز ديالك اليوم! ❤️'],
        streak5: [
            'خمسة أجوبة صحيحة! هادشي مستوى عالي! 👑', 'واااو! اليوم راكي متألقة بصح!', 'خمسة على التوالي! شكون يقدر يوقفك؟ 😍',
            'بديت كنشك أنك حافظة الأسئلة! 😂', 'تستاهلي تصفيقة كبيرة! 👏', 'كملي! بغيت نشوف واش غادي توصلي للقمة! 🔥'],
        champion: [
            'عشرة أجوبة صحيحة متتالية! أنتِ أسطورة بصح! 👑', 'ما لقيتش ما نقول ليك! مستوى فوق الممتاز! 😍', 'عشرة على عشرة! واش نتي خبيرة متنكرة ولا شنو؟ 😂',
            'دابا نتي ملكة التحدي بلا منازع!', 'كنعلنها رسمياً: عندنا بطلة حقيقية هنا! 🏆', 'كل هاد الأسئلة وجاوبتي عليهم؟ فخورة بيك! ❤️',
            'تستاهلي لقب سفيرة التراث بجدارة!', 'ارفعي راسك وافتخري بنفسك! 👏👑'],
        multiplier: [
            '×2 مازال شغال! كملي يا بطلة! 🔥', 'كل جواب صحيح دابا عندو قيمة مضاعفة! 😉', 'حتى النقاط ولات كتجري معاك! 😂',
            'مستوى استثنائي! حافظي على هاد التركيز!', 'برافو! التحدي ولى أكثر إثارة! 👑'],
        wrong: [
            'ماشي مشكل صاحبتي، المرة الجاية نجيبوها! ❤️', 'أوووه! هادي فاتتك، ولكن باقي التحدي! 😉', 'ما تستسلميش، السؤال الجاي فرصتك!', 'المهم نتعلمو معلومة جديدة! ❤️',
            'ولا يهمك! باقي عندك فرص باش تورّيني شطارتك!', 'هاد المرة ربحتي معلومة جديدة! 😍', 'ما جاتش هادي، ولكن واثقة أنك تقدري تعوضيها!',
            'أوووه! هاد السؤال كان فيه شوية ديال المكر! 😂', 'ابتسمي صاحبتي، المسابقة للمتعة والتعلم!', 'عادي جداً! كل سؤال فرصة باش نتعلمو شي حاجة جديدة!'],
        afterStreak: [
            'حتى الأبطال كيوقعو ليهم أخطاء! كملي بثقة! ❤️', 'السلسلة وقفات، ولكن مستواك باقي زوين!', 'ماشي مشكل! عجبني التركيز اللي وصلتي ليه!',
            'غلطة وحدة ما كتمحيش النجاح اللي حققتي!', 'نعاودو نركزو ونبداو سلسلة جديدة! 😉', 'ما تخليش سؤال واحد ينقص من حماسك!',
            'باقي عندك الفرصة ترجعي بقوة!', 'أنا معاك، والطريق باقي مفتوح! ❤️'],
        timeout: [
            'أوووه! الوقت سالى بسرعة! السؤال الجاي فرصتك!', 'ما لحقتيش هاد المرة! واجدة للسؤال الجاي؟ 😉', 'خاصنا شوية ديال السرعة مع التركيز!',
            'حتى الوقت دار لينا مفاجأة! 😂', 'ماشي مشكل، التحدي مازال مستمر!', 'السؤال الجاي نعطيوه حقو!', 'السرعة مهمة، ولكن الأهم هو الاستمتاع!',
            'يلا نكملو! عندنا أسئلة زوينة!']
    };
    var usedPh = {};
    function phrase(group) {
        var list = DIALOGUES[group], used = usedPh[group] || (usedPh[group] = []);
        var free = list.filter(function (t) { return used.indexOf(t) < 0; });
        if (!free.length) { free = list.slice(); used.length = 0; }
        var t = free[Math.floor(Math.random() * free.length)];
        used.push(t); if (used.length > 3) used.shift();
        return t;
    }
    function speak(group, pose, extra) { say(pose, phrase(group) + (extra || '')); }

    /* ---------- النقاط ---------- */
    /* عدّاد سريع: الرقم يتغيّر بالتسلسل (يزيد أو ينقص) */
    var cntRaf = 0, shown = 0;
    function countTo(to, onDone) {
        cancelAnimationFrame(cntRaf);
        var from = shown, span = Math.abs(to - from), nEl = $('cPtsN');
        if (REDUCED || !span) { shown = to; nEl.textContent = to; if (onDone) onDone(); return; }
        /* 30ms لكل نقطة: +50 ← 1.5 ث، +100 ← 3 ث، +200 ← 6 ث (بإيقاع ثابت، كل رقم يظهر) */
        var dur = Math.min(8000, span * 30), t0 = null;
        function step(ts) {
            if (t0 === null) t0 = ts;
            var k = Math.min(1, (ts - t0) / dur);
            shown = k >= 1 ? to : Math.round(from + (to - from) * k);
            nEl.textContent = shown;
            if (k < 1) cntRaf = requestAnimationFrame(step); else if (onDone) onDone();
        }
        cntRaf = requestAnimationFrame(step);
    }
    /* شارة ×2: تظهر بنعومة وتتلاشى بنعومة عند كسر السلسلة */
    var multTok = 0;
    function setMult(on) {
        var m = $('cMult'), tok = ++multTok;
        if (on) { if (m.hidden) { m.hidden = false; m.classList.add('out'); void m.offsetWidth; } m.classList.remove('out'); return; }
        if (m.hidden) return;
        if (REDUCED) { m.hidden = true; return; }
        m.classList.add('out');
        setTimeout(function () { if (tok === multTok) m.hidden = true; }, 900);
    }
    function wiggleStar() {
        if (REDUCED) return;
        var st = $('cStar'); st.classList.remove('wiggle'); void st.offsetWidth; st.classList.add('wiggle');
    }
    function showPoints(delta) {
        setMult(mult() >= 2);
        if (!delta) { shown = S.points; $('cPtsN').textContent = S.points; return; }
        countTo(S.points, delta > 0 ? wiggleStar : null);   /* النجمة تتحرك عند نهاية العدّ، وعند الربح فقط */
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
    var CATS = [], mode = 'intro', cur = null, correctText = '', selected = -1, firstQ = true;

    function startQuestion() {
        var cat = CATS[S.ci % CATS.length], idx = (S.qi[cat.id] || 0) % cat.items.length;
        cur = cat.items[idx]; correctText = cur.a; selected = -1;
        S.qi[cat.id] = idx + 1; S.ci = (S.ci + 1) % CATS.length; save();
        mode = 'question';
        mainBtn.textContent = cat.label; mainBtn.classList.add('wait');
        stageQuestion(cur);
        setOpts(shuffle([cur.a].concat(cur.w)), true);
        if (firstQ) { firstQ = false; speak('ready', 'smile'); }
        else if (Math.random() < 0.15) { say('calm', '…'); }          /* لحظة صمت طبيعية */
        else { speak('question', 'curiosity'); }
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
        var ok = selected >= 0 && optBtns[selected].textContent === correctText, before = S.points, m = mult(), prev = S.streak;
        if (ok) { S.points += WIN * m; S.streak++; } else { S.points = Math.max(0, S.points - LOSS); S.streak = 0; }
        save(); showPoints(S.points - before);
        optBtns.forEach(function (b, k) {
            b.disabled = true; b.classList.remove('c-sel');
            if (b.textContent === correctText) b.classList.add('c-ok');
            else if (k === selected) b.classList.add('c-bad');
        });
        if (ok) {
            stageResult(S.streak === 10 ? '🏆 أسطورة التحدي!' : '✅ الجواب صحيح!', cur); confetti(); avatarSparkles(S.streak === 10 ? 12 : 6);
            if (S.streak === 10) speak('champion', 'laugh', ' ×2 مفعّل 🔥');
            else if (S.streak > 10) speak('multiplier', 'confidence');
            else if (S.streak >= 5) speak('streak5', 'admiration');
            else if (S.streak >= 3) speak('streak3', 'laugh');
            else speak('correct', 'joy');
            vibrate(S.streak === 10 ? [30, 40, 30, 40, 60] : 30);
        } else if (selected < 0) {
            stageResult('⏰ انتهى الوقت · الجواب: ' + correctText, cur);
            speak('timeout', 'surprise'); vibrate([40, 40, 40]);
        } else {
            stageResult('❌ الجواب الصحيح: ' + correctText, cur);
            speak(prev >= 3 ? 'afterStreak' : 'wrong', 'empathy'); vibrate([40, 40, 40]);
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
