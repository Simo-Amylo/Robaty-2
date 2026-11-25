/* سلايدر زر "تحدي سفيرة التراث" في Moments */
(function () {
  var ROBATY_IMG = "robaty-thumb.webp";

  // التسلسل (التكرار مقصود). key = مفتاح الترجمة فـ i18n.js، و ar = النص الاحتياطي
  // الشريحة الأولى أطول (5 ثوان)، والباقي 3.5 ثانية
  var slides = [
    { key: "contest_s1",  ar: "تحدي سفيرة التراث المغربي", ms: 5000 },
    { key: "contest_s2",  ar: "الفوز بالبطاقة الذهبية" },
    { key: "contest_s3",  ar: "تحدي الطبخ المغربي" },
    { key: "contest_s4",  ar: "تحدي الأمثال المغربية" },
    { key: "contest_s5",  ar: "الثقافة الشعبية المغربية" },
    { key: "contest_s6",  ar: "سفيرة التراث المغربي" },
    { key: "contest_s7",  ar: "واش عارفا المغرب مزيان؟" },
    { key: "contest_s8",  ar: "مرحبا و ألف مرحبا" },
    { key: "contest_s9",  ar: "شاركي و استفيدي" },
    { key: "contest_s10", ar: "فوزي بالبطاقة الذهبية" },
    { key: "contest_s11", ar: "المدن و المعالم المغربية" },
    { key: "contest_s12", ar: "التاريخ و الحضارة المغربية" },
    { key: "contest_s13", ar: "التراث و عادات المغاربة" },
    { key: "contest_s6",  ar: "سفيرة التراث المغربي" },
    { key: "contest_s14", ar: "تحديات التمغربيت" },
    { key: "contest_s15", ar: "الطبيعة و المنتجات المغربية" },
    { key: "contest_s16", ar: "الشخصيات المغربية" },
    { key: "contest_s8",  ar: "مرحبا و ألف مرحبا" }
  ];
  var DEFAULT_MS = 3500;

  var btn = document.getElementById("contestCta");
  var viewport = document.getElementById("tickerViewport");
  if (!btn || !viewport || !slides.length) return;

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

  var els = slides.map(function (s, i) {
    var item = document.createElement("span");
    item.className = "ticker-item" + (i === 0 ? " is-active" : "");
    var img = document.createElement("img");
    img.className = "thumb"; img.src = ROBATY_IMG; img.alt = ""; img.decoding = "async";
    var ph = document.createElement("span");
    ph.className = "phrase"; ph.textContent = label(s);
    item.appendChild(img); item.appendChild(ph);
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

  function show(next) {
    var prev = els[cur]; cur = next; var nxt = els[cur];
    prev.classList.remove("is-active"); prev.classList.add("is-exit");
    nxt.classList.remove("is-exit"); nxt.classList.add("is-active");
    setTimeout(function () { prev.classList.remove("is-exit"); }, 500);
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

  schedule();
})();
