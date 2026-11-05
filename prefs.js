/* ==========================================================================
   prefs.js — تفضيلات المستخدمة المشتركة بين كل الصفحات (محادثة، إعدادات...)
   كيتحمّل فـ <head> (بلا defer) باش التطبيق يتطبق قبل ما تبان الصفحة.
   المفاتيح: robaty_font_size | robaty_chat_look | robaty_haptics | robaty_color_mode
   ========================================================================== */
(function () {
    var K = {
        font: 'robaty_font_size',
        look: 'robaty_chat_look',
        vib: 'robaty_haptics',
        color: 'robaty_color_mode'
    };
    var FONTS = ['small', 'medium', 'large'];
    var LOOKS = ['default', 'dark', 'whatsapp'];
    var COLORS = ['default', 'vivid', 'emerald', 'cream', 'sky', 'blush'];
    var root = document.documentElement;

    function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function pick(list, v, fallback) { return list.indexOf(v) > -1 ? v : fallback; }

    function getFont() { return pick(FONTS, get(K.font), 'medium'); }
    function getLook() { return pick(LOOKS, get(K.look), 'default'); }
    function getColor() { return pick(COLORS, get(K.color), 'default'); }
    function vibrationOn() { return get(K.vib) !== 'off'; }

    function apply() {
        root.setAttribute('data-font-size', getFont());
        root.setAttribute('data-chat-look', getLook());
    }

    /* الاهتزاز: كنلفّو navigator.vibrate، إلا كان مطفي كيرجع false وما كيهتز والو */
    var nativeVibrate = (typeof navigator.vibrate === 'function') ? navigator.vibrate.bind(navigator) : null;
    if (nativeVibrate) {
        navigator.vibrate = function (pattern) {
            return vibrationOn() ? nativeVibrate(pattern) : false;
        };
    }

    apply();

    window.RobatyPrefs = {
        getFont: getFont,
        getLook: getLook,
        getColor: getColor,
        vibrationOn: vibrationOn,
        vibrationSupported: !!nativeVibrate,
        setFont: function (v) { set(K.font, pick(FONTS, v, 'medium')); apply(); },
        setLook: function (v) { set(K.look, pick(LOOKS, v, 'default')); apply(); },
        setColor: function (v) { set(K.color, pick(COLORS, v, 'default')); this.applyColor(); },
        setVibration: function (on) { set(K.vib, on ? 'on' : 'off'); },
        applyColor: function () {
            if (!document.body) return;
            var c = getColor();
            if (c === 'default') document.body.removeAttribute('data-color-mode');
            else document.body.setAttribute('data-color-mode', c);
        }
    };
})();
