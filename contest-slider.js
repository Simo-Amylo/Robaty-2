/* سلايدر زر "تحدي سفيرة التراث" في Moments */
(function () {
  var ROBATY_IMG = "robaty-thumb.webp";

  // الشريحة الأولى أطول (5 ثوان)، والباقي 3.5 ثانية
  var slides = [
    { text: "تحدي سفيرة التراث المغربي", ms: 5000 },
    { text: "الفوز بالبطاقة الذهبية" },
    { text: "تحدي الطبخ المغربي" },
    { text: "تحدي الأمثال المغربية" },
    { text: "الثقافة الشعبية المغربية" },
    { text: "سفيرة التراث المغربي" },
    { text: "واش عارفا المغرب مزيان؟" },
    { text: "مرحبا و ألف مرحبا" },
    { text: "شاركي و ستفادي" },
    { text: "فوزي بالبطاقة الذهبية" },
    { text: "المدن و المعالم المغربية" },
    { text: "التاريخ و الحضارة المغربية" },
    { text: "التراث و عادات المغاربة" },
    { text: "تحديات التمغربيت" },
    { text: "الطبيعة و المنتجات المغربية" },
    { text: "الشخصيات المغربية" }
  ];
  var DEFAULT_MS = 3500;

  var btn = document.getElementById("contestCta");
  var viewport = document.getElementById("tickerViewport");
  if (!btn || !viewport || !slides.length) return;

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var els = slides.map(function (s, i) {
    var item = document.createElement("span");
    item.className = "ticker-item" + (i === 0 ? " is-active" : "");
    var img = document.createElement("img");
    img.className = "thumb"; img.src = ROBATY_IMG; img.alt = ""; img.decoding = "async";
    var ph = document.createElement("span");
    ph.className = "phrase"; ph.textContent = s.text;
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
