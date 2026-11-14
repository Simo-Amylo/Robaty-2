/* يغيّر نقطة الزر إلى أخضر إذا أنهت المستخدمة مسابقة اليوم */
(function () {
    try {
        var n = new Date(), p = function (x) { return String(x).padStart(2, '0'); };
        var k = n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate());
        var s = JSON.parse(localStorage.getItem('robaty_contest_v1')) || {};
        var el = document.getElementById('contestCta');
        if (el && s.days && s.days[k] && s.days[k].done) el.classList.add('is-done');
    } catch (e) {}
})();
