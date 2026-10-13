/* ==========================================================================
   ROBATY — رجفة خفيفة عند الضغط على الأزرار (اهتزاز الهاتف + اهتزاز بصري)
   الأزرار: إرسال، تسجيل صوتي، إرسال الصور، شوفي تصاوري ليوم، الإعدادات، السهم.
   ما فيهاش: زر المسح (الأحمر) وزر "حفظ" فنافذة الإعدادات.
   - الاهتزاز: navigator.vibrate (أندرويد/Chrome).
   - البصري: Web Animations API، كيتضاف فوق الأنيميشنات الموجودة بلا ما يوقفها
     (نبضة زر اللحظات + button-pressed كيخدمو كالعادة). كيتوقف إلا كان
     المستخدم مفعل "تقليل الحركة".
   ========================================================================== */
(function () {
    'use strict';

    // قوة الاهتزاز (ms) وسعة الرجفة البصرية (px) — خفيفة. زيدهم إلا بغيتيهم أقوى.
    var VIBRATE_MS = 12;
    var SHAKE_PX = 2;
    var SHAKE_MS = 220;

    var SELECTOR =
        '.ornate-action-btn, .gold-pill-btn:not(#saveApiKeyBtn), ' +
        '.ornate-btn:not(.ornate-btn-danger)';

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)');

    function shake(btn) {
        if (reduceMotion && reduceMotion.matches) return;
        if (!btn.animate) return;
        var d = SHAKE_PX;
        try {
            btn.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(' + (-d) + 'px)' },
                { transform: 'translateX(' + d + 'px)' },
                { transform: 'translateX(' + (-d * 0.75) + 'px)' },
                { transform: 'translateX(' + (d * 0.75) + 'px)' },
                { transform: 'translateX(0)' }
            ], { duration: SHAKE_MS, easing: 'ease-out', composite: 'add' });
        } catch (err) {}
    }

    document.addEventListener('pointerdown', function (e) {
        var btn = e.target.closest ? e.target.closest(SELECTOR) : null;
        if (!btn) return;

        // زر الإرسال المطفأ (ما كاين نص): بلا رجفة
        if (btn.classList.contains('send-highlight') &&
            !btn.classList.contains('active')) {
            return;
        }

        if ('vibrate' in navigator) {
            try { navigator.vibrate(VIBRATE_MS); } catch (err) {}
        }
        shake(btn);
    }, { passive: true });
})();
