/* سلايدر زر "تحدي سفيرة التراث" في Moments */
(function () {
  var ROBATY_IMG = "robaty-thumb.webp";

  // ===== ضبط التوقيت (كل الأرقام هنا) =====
  var TIMING = {
    firstMs: 6500,       // مدة الجملة الأولى (بالميلي ثانية)
    holdMs: 5000,        // المدة بين جملة وأخرى
    transitionMs: 1400,  // سرعة الظهور والاختفاء
    fadeDelayMs: 700,    // تأخير الجمل ذات التلاشي (باش تختفي السابقة قبل)
    slidePx: 8,          // مسافة الانزلاق بالبكسل
    longFactor: 2.5,     // مضاعف مدة الجمل المكتوبة (تحدي سفيرة التراث / سفيرة التراث)
    typeMs: 110          // سرعة الكتابة: ميلي ثانية لكل حرف
  };

  // التسلسل (التكرار مقصود). key = مفتاح الترجمة فـ i18n.js، و ar = النص الاحتياطي
  var slides = [
    { key: "contest_s1",  ar: "تحدي سفيرة التراث المغربي", ms: TIMING.firstMs * TIMING.longFactor, fade: true, type: true, img: "heritage-dark.webp", banner: true, dark: true },
    { key: "contest_s2",  ar: "الفوز بالبطاقة الذهبية", fade: true, img: "heritage-dark.webp", banner: true, dark: true },
    { key: "contest_s3",  ar: "تحدي الطبخ المغربي", img: "heritage-pottery.webp", banner: true, fade: true, white: true },
    { key: "contest_s4",  ar: "تحدي الأمثال المغربية", img: "heritage-pottery.webp", banner: true, white: true },
    { key: "contest_s5",  ar: "الثقافة الشعبية المغربية", img: "heritage-pottery.webp", banner: true, white: true },
    { key: "contest_s6",  ar: "سفيرة التراث المغربي", ms: TIMING.holdMs * TIMING.longFactor, fade: true, type: true, img: "heritage-dark.webp", banner: true, dark: true },
    { key: "contest_s7",  ar: "واش عارفا المغرب مزيان؟", fade: true, img: "heritage-dark.webp", banner: true, dark: true },
    { key: "contest_s8",  ar: "مرحبا بك في المغرب", img: "heritage-brass.webp", banner: true, fade: true, white: true },
    { key: "contest_s9",  ar: "شاركي و فوزي", img: "heritage-dark.webp", banner: true, dark: true },
    { key: "contest_s10", ar: "فوزي بالبطاقة الذهبية", fade: true, img: "heritage-dark.webp", banner: true, dark: true },
    { key: "contest_s11", ar: "المدن و المعالم المغربية", img: "heritage-ornaments.webp", banner: true, fade: true, white: true },
    { key: "contest_s12", ar: "التاريخ و الحضارة المغربية", img: "heritage-ornaments.webp", banner: true, white: true },
    { key: "contest_s13", ar: "التراث و عادات المغاربة", img: "heritage-ornaments.webp", banner: true, white: true },
    { key: "contest_s6",  ar: "سفيرة التراث المغربي", ms: TIMING.holdMs * TIMING.longFactor, fade: true, type: true, img: "heritage-dark.webp", banner: true, dark: true },
    { key: "contest_s14", ar: "تحديات التمغربيت", fade: true, img: "heritage-dark.webp", banner: true, dark: true },
    { key: "contest_s15", ar: "الطبيعة و المنتجات المغربية", img: "heritage-carpet.webp", banner: true, fade: true, white: true },
    { key: "contest_s16", ar: "الشخصيات المغربية", img: "heritage-carpet.webp", banner: true, white: true },
    { key: "contest_s8",  ar: "مرحبا بك في المغرب", fade: true, img: "heritage-dark.webp", banner: true, dark: true }
  ];
  var DEFAULT_MS = TIMING.holdMs;

  var btn = document.getElementById("contestCta");
  var viewport = document.getElementById("tickerViewport");
  if (!btn || !viewport || !slides.length) return;

  btn.style.setProperty("--ticker-dur", (TIMING.transitionMs / 1000) + "s");
  btn.style.setProperty("--fade-delay", (TIMING.fadeDelayMs / 1000) + "s");
  btn.style.setProperty("--slide-px", TIMING.slidePx + "px");

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // النص بلغة التطبيق الحالية (i18n.js)، وإلا العربية الاحتياطية
  function label(s) {
    try {
      if (window.RobatyI18n) {
        var v = window.RobatyI18n.t(s.key);
        if (v && v !== s.key) return v;
      }
    } catch (e) {}
    return s.ar;
  }

  var bannerByImg = {};   // طبقة واحدة لكل صورة

  var els = slides.map(function (s, i) {
    var item = document.createElement("span");
    item.className = "ticker-item" + (s.fade ? " is-fade" : "") + (s.type ? " is-type" : "") + (s.banner && !s.dark ? " is-banner" : "") + (i === 0 ? " is-active" : "");
    var img = document.createElement("img");
    img.className = "thumb"; img.src = ROBATY_IMG; img.alt = ""; img.decoding = "async";
    var ph = document.createElement("span");
    ph.className = "phrase" + (s.white ? " is-white" : "");
    var txt = label(s);
    if (s.type) {
      // نص مكتوب: الجزء المكتوب ظاهر، والباقي مخفي (لكن محجوز مكانه باش ما تتحرك الصورة)
      s.chars = Array.from(txt);
      s.typedEl = document.createElement("span");
      s.restEl = document.createElement("span");
      s.restEl.className = "rest";
      ph.appendChild(s.typedEl); ph.appendChild(s.restEl);
      s.typedEl.textContent = txt; s.restEl.textContent = "";
    } else {
      ph.textContent = txt;
    }
    if (!s.banner || s.dark) item.appendChild(img);
    item.appendChild(ph);
    if (s.banner) {
      // صورة عريضة تغطي الزر كامل (طبقة خلف النص)
      if (!bannerByImg[s.img]) {
        var b = document.createElement("span");
        b.className = "banner" + (s.dark ? " dark" : "");
        b.style.backgroundImage = 'url("' + s.img + '")';
        btn.insertBefore(b, viewport);
        new Image().src = s.img;   // تحميل مسبق باش ما تبانش متأخرة
        bannerByImg[s.img] = b;
      }
      s.bannerEl = bannerByImg[s.img];
    }
    viewport.appendChild(item);
    return item;
  });

  // تصغير الخط تلقائيا إذا كانت الجملة أعرض من المساحة (بدل القطع بنقط)
  function fit() {
    var room = viewport.clientWidth - 26 - 9 - 6;
    if (room <= 0) return;
    els.forEach(function (el) {
      var ph = el.querySelector(".phrase");
      var size = 16; ph.style.fontSize = size + "px";
      while (ph.scrollWidth > room && size > 11) { size -= 0.5; ph.style.fontSize = size + "px"; }
    });
  }
  fit();
  window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  var cur = 0, timer = null, paused = false;

  var typeTimer = null;

  function setTyped(i, n) {
    var s = slides[i]; if (!s.type) return;
    s.typedEl.textContent = s.chars.slice(0, n).join("");
    s.restEl.textContent = s.chars.slice(n).join("");
  }
  function startTyping(i, delay) {
    clearTimeout(typeTimer);
    var s = slides[i]; if (!s.type) return;
    if (reduce) { setTyped(i, s.chars.length); return; }
    setTyped(i, 0);
    var n = 0;
    function step() {
      n++; setTyped(i, n);
      if (n < s.chars.length) typeTimer = setTimeout(step, TIMING.typeMs);
    }
    typeTimer = setTimeout(step, delay);
  }

  function show(next) {
    var prevIdx = cur;
    var prev = els[cur]; cur = next; var nxt = els[cur];
    prev.classList.remove("is-active"); prev.classList.add("is-exit");
    nxt.classList.remove("is-exit"); nxt.classList.add("is-active");
    if (slides[prevIdx].bannerEl) slides[prevIdx].bannerEl.classList.remove("is-active");
    if (slides[cur].bannerEl) {
      slides[cur].bannerEl.classList.toggle("no-delay", !slides[cur].fade);
      slides[cur].bannerEl.classList.add("is-active");
    }
    startTyping(cur, TIMING.fadeDelayMs);   // تبدأ الكتابة بعد ما تتلاشى الجملة السابقة
    setTimeout(function () {
      prev.classList.remove("is-exit");
      if (slides[prevIdx].type && prevIdx !== cur) setTyped(prevIdx, 0);
    }, TIMING.transitionMs + 200);
  }
  function schedule() {
    clearTimeout(timer);
    if (reduce || paused || document.hidden) return;
    timer = setTimeout(function () { show((cur + 1) % els.length); schedule(); },
                       slides[cur].ms || DEFAULT_MS);
  }

  // إيقاف التبديل عند اللمس ثم استئنافه
  btn.addEventListener("pointerdown", function () { paused = true; clearTimeout(timer); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
    btn.addEventListener(ev, function () { if (paused) { paused = false; schedule(); } });
  });
  document.addEventListener("visibilitychange", schedule);

  if (slides[0].bannerEl) slides[0].bannerEl.classList.add("no-delay", "is-active");
  startTyping(0, 400);
  schedule();
})();
