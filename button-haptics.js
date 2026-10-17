/* ==========================================================================
   ROBATY — اهتزاز الهاتف الخفيف (haptic) عند الضغط على الأزرار
   كيخدم فـ: واجهة المحادثة، Moments، وبروفايل Robaty.
   - المحادثة: إرسال، تسجيل صوتي، إرسال الصور، شوفي تصاوري ليوم، الإعدادات، السهم.
   - Moments + البروفايل: زر السهم (back-btn-floating).
   - البروفايل: دردشي معايا + متابعة (action-btn).
   ما فيهاش: زر المسح الأحمر وزر "حفظ" فنافذة الإعدادات.
   كيخدم على أندرويد/Chrome (navigator.vibrate). ما كاينش اهتزاز بصري.
   ========================================================================== */
(function () {
    'use strict';

    // مدة الاهتزاز بالميلي ثانية. زيدها إلا بغيتيها أقوى.
    var VIBRATE_MS = 25;

    var SELECTOR =
        '.ornate-action-btn, .gold-pill-btn:not(#saveApiKeyBtn), ' +
        '.ornate-btn:not(.ornate-btn-danger), ' +
        '.back-btn-floating, .action-btn';

    if (!('vibrate' in navigator)) return;

    document.addEventListener('pointerdown', function (e) {
        var btn = e.target.closest ? e.target.closest(SELECTOR) : null;
        if (!btn) return;

        // زر الإرسال المطفأ (ما كاين نص): بلا اهتزاز
        if (btn.classList.contains('send-highlight') &&
            !btn.classList.contains('active')) {
            return;
        }

        try { navigator.vibrate(VIBRATE_MS); } catch (err) {}
    }, { passive: true });
})();
