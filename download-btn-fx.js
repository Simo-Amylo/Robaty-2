/* Robaty — تأثيرات زر "حمّلي التطبيق الآن"
   - يلفّ أيقونة 📲 في span خاص لتتحرك وحدها
   - عند لمس الزر تتوقف كل الحركة طوال الزيارة الحالية فقط (sessionStorage)
     وتعود في الزيارة التالية */
(function () {
    'use strict';

    var SEL = '.app-download-banner';
    var KEY = 'robaty_dl_btn_calm';
    var ICON = '\uD83D\uDCF2'; // 📲
    var root = document.documentElement;
    var scheduled = false;

    // تنظيف الحفظ القديم (كان دائما) حتى تعود الحركة عند من لمست الزر سابقا
    try { localStorage.removeItem(KEY); } catch (e) {}

    try {
        if (sessionStorage.getItem(KEY) === '1') {
            root.classList.add('dl-btn-calm');
        }
    } catch (e) { /* التخزين غير متاح: نكمل بدونه */ }

    function calm() {
        root.classList.add('dl-btn-calm');
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    }

    function wrapIcon(btn) {
        if (btn.querySelector('.app-download-icon')) return;

        var walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode())) {
            var i = node.nodeValue.indexOf(ICON);
            if (i === -1) continue;

            var after = node.splitText(i + ICON.length);
            var iconNode = node.splitText(i);

            var span = document.createElement('span');
            span.className = 'app-download-icon';
            span.setAttribute('aria-hidden', 'true');
            iconNode.parentNode.insertBefore(span, iconNode);
            span.appendChild(iconNode);
            return;
        }

        // احتياط: إن كانت الأيقونة عنصرا (i / svg / img) وليست إيموجي
        var first = btn.querySelector('i, svg, img');
        if (first) first.classList.add('app-download-icon');
    }

    function scan() {
        scheduled = false;
        var btns = document.querySelectorAll(SEL);
        for (var k = 0; k < btns.length; k++) wrapIcon(btns[k]);
    }

    function schedule() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(scan);
    }

    // لمس الإصبع على أي زر تحميل => إيقاف الحركة نهائيا
    document.addEventListener('pointerdown', function (e) {
        if (e.target.closest && e.target.closest(SEL)) calm();
    }, true);

    // الأزرار تُولَّد/تُعاد كتابتها بالجافاسكريبت (مثل تغيير اللغة)
    new MutationObserver(schedule).observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    schedule();
})();
