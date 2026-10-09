// ==========================================================================
// Robaty — إحصائيات البروفايل الحقيقية (لحظة / متابع / تفاعل) + زر المتابعة
// ==========================================================================
// - لحظة   : عدد المنشورات المنشورة فـ moments-data.js (أوتوماتيك)
// - تفاعل  : مجموع تعليقات + مشاركات + إعادة نشر (+ إعجابات إلا كانت) من postStats
// - متابع  : الوثيقة profileStats/robaty_ai  (الحقل followers)
// ==========================================================================

(function () {
    'use strict';

    var PROFILE_DOC = 'robaty_ai';
    var FOLLOW_KEY = 'robaty_following';

    // ---------------------------------------------------------------
    // النصوص (5 لغات) — محلية فهاد الملف باش ما نلمسوش i18n.js
    // ---------------------------------------------------------------
    var STR = {
        ar: {
            following: 'متابَعة', followers_title: 'المتابِعات', followers_note: 'شكرا لكم على متابعتكم 🤍',
            engagement_title: 'التفاعل', engagement_sub: 'مجموع التفاعلات',
            likes: 'الإعجابات', comments: 'التعليقات', shares: 'المشاركات', reposts: 'إعادة النشر',
            close: 'إغلاق', error: 'تعذر الاتصال، عاودي المحاولة'
        },
        en: {
            following: 'Following', followers_title: 'Followers', followers_note: 'Thank you for following us 🤍',
            engagement_title: 'Engagement', engagement_sub: 'Total interactions',
            likes: 'Likes', comments: 'Comments', shares: 'Shares', reposts: 'Reposts',
            close: 'Close', error: 'Connection failed, please try again'
        },
        fr: {
            following: 'Abonnée', followers_title: 'Abonnés', followers_note: 'Merci pour votre abonnement 🤍',
            engagement_title: 'Interactions', engagement_sub: 'Total des interactions',
            likes: 'J’aime', comments: 'Commentaires', shares: 'Partages', reposts: 'Republications',
            close: 'Fermer', error: 'Connexion impossible, réessayez'
        },
        es: {
            following: 'Siguiendo', followers_title: 'Seguidores', followers_note: 'Gracias por seguirnos 🤍',
            engagement_title: 'Interacciones', engagement_sub: 'Total de interacciones',
            likes: 'Me gusta', comments: 'Comentarios', shares: 'Compartidos', reposts: 'Reposts',
            close: 'Cerrar', error: 'Sin conexión, inténtalo de nuevo'
        },
        ru: {
            following: 'Вы подписаны', followers_title: 'Подписчики', followers_note: 'Спасибо, что подписались 🤍',
            engagement_title: 'Активность', engagement_sub: 'Всего взаимодействий',
            likes: 'Лайки', comments: 'Комментарии', shares: 'Поделились', reposts: 'Репосты',
            close: 'Закрыть', error: 'Нет соединения, попробуйте ещё раз'
        }
    };

    function getLang() {
        try {
            if (window.RobatyI18n && window.RobatyI18n.getCurrentLang) return window.RobatyI18n.getCurrentLang();
        } catch (e) {}
        return document.documentElement.lang || 'ar';
    }

    function s(key) {
        var l = STR[getLang()] || STR.ar;
        return l[key] != null ? l[key] : STR.ar[key];
    }

    // ---------------------------------------------------------------
    // أدوات
    // ---------------------------------------------------------------
    function $(id) { return document.getElementById(id); }

    function compact(n) {
        n = Number(n) || 0;
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return String(n);
    }

    function full(n) {
        try { return Number(n || 0).toLocaleString(getLang()); } catch (e) { return String(n || 0); }
    }

    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    // ---------------------------------------------------------------
    // الورقة السفلية (Bottom Sheet)
    // ---------------------------------------------------------------
    var sheet, sheetBody, sheetTitle, sheetKind = null;

    function openSheet(kind) {
        sheetKind = kind;
        renderSheet();
        sheet.classList.add('active');
        sheet.setAttribute('aria-hidden', 'false');
    }

    function closeSheet() {
        sheetKind = null;
        sheet.classList.remove('active');
        sheet.setAttribute('aria-hidden', 'true');
    }

    function renderSheet() {
        if (!sheetKind) return;

        if (sheetKind === 'followers') {
            sheetTitle.textContent = s('followers_title');
            sheetBody.innerHTML =
                '<div class="sheet-big">' + full(state.followers) + '</div>' +
                '<p class="sheet-note">' + s('followers_note') + '</p>';
            return;
        }

        if (sheetKind === 'engagement') {
            sheetTitle.textContent = s('engagement_title');
            var rows = '';
            rows += row('fa-solid fa-heart', s('likes'), state.eng.likes);
            rows += row('fa-regular fa-comment', s('comments'), state.eng.comments);
            rows += row('fa-regular fa-paper-plane', s('shares'), state.eng.shares);
            rows += row('fa-solid fa-retweet', s('reposts'), state.eng.reposts);

            sheetBody.innerHTML =
                '<div class="sheet-big">' + full(totalEngagement()) + '</div>' +
                '<div class="sheet-sub">' + s('engagement_sub') + '</div>' +
                '<div class="sheet-rows">' + rows + '</div>';
        }
    }

    function row(icon, label, value) {
        return '<div class="sheet-row">' +
            '<span class="sheet-row-label"><i class="' + icon + '"></i> ' + label + '</span>' +
            '<span class="sheet-row-value">' + full(value) + '</span>' +
            '</div>';
    }

    // ---------------------------------------------------------------
    // الحالة
    // ---------------------------------------------------------------
    var state = {
        followers: 0,
        following: lsGet(FOLLOW_KEY) === '1',
        hasLikes: false,
        eng: { likes: 0, comments: 0, shares: 0, reposts: 0 }
    };

    function totalEngagement() {
        return state.eng.likes + state.eng.comments + state.eng.shares + state.eng.reposts;
    }

    // ---------------------------------------------------------------
    // لحظة: عدد المنشورات
    // ---------------------------------------------------------------
    function getPublishedIds() {
        var RM = window.RobatyMoments;
        if (!RM || !RM.getPublished) return null;
        return RM.getPublished().map(function (p) { return String(p.id); });
    }

    function initMoments() {
        var ids = getPublishedIds();
        var el = $('statMomentsNum');
        if (el && ids) el.textContent = String(ids.length);

        var btn = $('statMoments');
        if (btn) btn.addEventListener('click', function () { window.location.href = 'moments.html'; });
    }

    // ---------------------------------------------------------------
    // المتابعة
    // ---------------------------------------------------------------
    var followBtn, followLabel, followIcon, followOriginalText;

    function paintFollowBtn() {
        if (!followBtn) return;
        followBtn.setAttribute('aria-pressed', state.following ? 'true' : 'false');
        followBtn.classList.toggle('is-following', state.following);
        followLabel.textContent = state.following ? s('following') : followOriginalText;
        if (followIcon) {
            followIcon.className = state.following ? 'fa-solid fa-user-check' : 'fa-solid fa-user-plus';
        }
    }

    function paintFollowers(loaded) {
        var el = $('statFollowersNum');
        if (!el) return;
        el.textContent = loaded ? compact(state.followers) : '…';
        if (sheetKind === 'followers') renderSheet();
    }

    var busy = false;

    function toggleFollow(db) {
        if (busy) return;
        busy = true;

        var wasFollowing = state.following;
        var delta = wasFollowing ? -1 : 1;

        // تحديث فوري للواجهة (optimistic)
        state.following = !wasFollowing;
        state.followers = Math.max(0, state.followers + delta);
        lsSet(FOLLOW_KEY, state.following ? '1' : '0');
        paintFollowBtn();
        paintFollowers(true);

        db.collection('profileStats').doc(PROFILE_DOC)
            .set({ followers: firebase.firestore.FieldValue.increment(delta) }, { merge: true })
            .then(function () { busy = false; })
            .catch(function (err) {
                console.warn('profileStats', err);
                // رجوع للحالة السابقة إلا فشل الحفظ
                state.following = wasFollowing;
                state.followers = Math.max(0, state.followers - delta);
                lsSet(FOLLOW_KEY, wasFollowing ? '1' : '0');
                paintFollowBtn();
                paintFollowers(true);
                busy = false;
                try { window.alert(s('error')); } catch (e) {}
            });
    }

    // ---------------------------------------------------------------
    // Firestore
    // ---------------------------------------------------------------
    function subscribeFollowers(db) {
        db.collection('profileStats').doc(PROFILE_DOC).onSnapshot(function (doc) {
            var d = doc.exists ? doc.data() : {};
            state.followers = Math.max(0, Number(d.followers) || 0);
            paintFollowers(true);
        }, function (err) {
            console.warn('profileStats', err);
        });
    }

    function subscribeEngagement(db) {
        db.collection('postStats').onSnapshot(function (snap) {
            var ids = getPublishedIds();
            var ok = null;
            if (ids) {
                ok = {};
                ids.forEach(function (id) { ok[id] = true; ok['post-' + id] = true; });
            }

            var t = { likes: 0, comments: 0, shares: 0, reposts: 0 };
            var anyLikes = false;

            snap.forEach(function (doc) {
                if (ok && !ok[doc.id]) return;      // نحسبو غير المنشورات الحالية
                var d = doc.data() || {};
                t.comments += Number(d.comments) || 0;
                t.shares += Number(d.shares) || 0;
                t.reposts += Number(d.reposts) || 0;
                if (d.likes != null) { anyLikes = true; t.likes += Number(d.likes) || 0; }
            });

            state.eng = t;
            state.hasLikes = anyLikes;

            var el = $('statEngagementNum');
            if (el) el.textContent = compact(totalEngagement());
            if (sheetKind === 'engagement') renderSheet();
        }, function (err) {
            console.warn('postStats', err);
        });
    }

    // ---------------------------------------------------------------
    // التشغيل
    // ---------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        sheet = $('statsSheet');
        sheetBody = $('statsSheetBody');
        sheetTitle = $('statsSheetTitle');

        followBtn = $('followBtn');
        if (followBtn) {
            followLabel = followBtn.querySelector('span');
            followIcon = followBtn.querySelector('i');
            followOriginalText = followLabel ? followLabel.textContent : '';
        }

        // أرقام فارغة بدل الوهمية حتى توصل البيانات الحقيقية
        var f = $('statFollowersNum'); if (f) f.textContent = '…';
        var e = $('statEngagementNum'); if (e) e.textContent = '…';

        initMoments();
        paintFollowBtn();

        // فتح/إغلاق الورقة
        var bf = $('statFollowers'); if (bf) bf.addEventListener('click', function () { openSheet('followers'); });
        var be = $('statEngagement'); if (be) be.addEventListener('click', function () { openSheet('engagement'); });

        if (sheet) {
            sheet.addEventListener('click', function (ev) {
                if (ev.target.closest && ev.target.closest('[data-close-sheet]')) closeSheet();
            });
        }
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && sheetKind) closeSheet();
        });

        // Firebase
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.warn('Firebase غير محمّل');
            return;
        }
        var db = firebase.firestore();

        if (followBtn) followBtn.addEventListener('click', function () { toggleFollow(db); });

        subscribeFollowers(db);
        subscribeEngagement(db);
    });
})();
