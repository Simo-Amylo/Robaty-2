/* ==========================================================================
   ROBATY — تسجيل الدخول بـ Google + الاتصال بالخادم الوسيط (Worker)
   كيعتمد على Firebase compat SDK (محمّل فـ index.html قبل هاد الملف).
   ========================================================================== */
(function () {
    'use strict';

    const API_BASE = 'https://robaty-api.businessdeveloper1999.workers.dev';

    const FIREBASE_CONFIG = {
        apiKey: 'AIzaSyAZVY0ScLOX3x_ltTIuk3qRBZdbea2Apgk',
        authDomain: 'robaty-d29e9.firebaseapp.com',
        projectId: 'robaty-d29e9',
        storageBucket: 'robaty-d29e9.firebasestorage.app',
        messagingSenderId: '988794244341',
        appId: '1:988794244341:web:e10a847bd55ff29696c9bc'
    };

    let auth = null;
    let quota = null;                 // { limit, used, remaining, welcome, welcomeEndsAt }
    const authListeners = [];
    const quotaListeners = [];

    // كيتحل ملي Firebase كيرجع حالة الدخول المحفوظة (أو بعد 4 ثواني احتياطا)
    let readyResolve;
    const readyPromise = new Promise((resolve) => { readyResolve = resolve; });
    setTimeout(() => readyResolve(), 4000);

    function init() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK ما تحمّلاتش');
            readyResolve();
            return;
        }
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        auth = firebase.auth();

        // إلا رجعات من redirect (احتياط فالمتصفحات اللي كتحبس popup)
        auth.getRedirectResult().catch((e) => console.log('redirect:', e && e.code));

        auth.onAuthStateChanged((user) => {
            readyResolve();
            if (!user) quota = null;
            authListeners.forEach((fn) => { try { fn(user); } catch (e) {} });
            if (user) refreshQuota();
            else quotaListeners.forEach((fn) => { try { fn(null); } catch (e) {} });
        });
    }

    function isSignedIn() {
        return !!(auth && auth.currentUser);
    }

    function makeError(code, status, extra) {
        const err = new Error(code);
        err.code = code;
        err.status = status;
        if (extra) Object.assign(err, extra);
        return err;
    }

    async function signIn() {
        if (!auth) throw makeError('NO_AUTH', 0);
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            await auth.signInWithPopup(provider);
        } catch (e) {
            if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
                await auth.signInWithRedirect(provider);
                return;
            }
            throw e;
        }
    }

    /* طلب للـ Worker بتوكن المستخدمة. كيرمي Error فيه .code ( USER_LIMIT, GLOBAL_CAP, UPSTREAM_BUSY, AUTH ... ) */
    async function apiFetch(path, options) {
        if (!isSignedIn()) throw makeError('AUTH', 401);

        let token;
        try {
            token = await auth.currentUser.getIdToken();
        } catch (e) {
            throw makeError('AUTH', 401);
        }

        const opts = Object.assign({ method: 'GET' }, options || {});
        opts.headers = Object.assign({}, opts.headers || {}, { 'Authorization': 'Bearer ' + token });

        let res;
        try {
            res = await fetch(API_BASE + path, opts);
        } catch (e) {
            throw makeError('NETWORK', 0);
        }

        let data = null;
        try { data = await res.json(); } catch (e) {}

        if (!res.ok) {
            const info = (data && data.error) || {};
            throw makeError(info.code || ('HTTP_' + res.status), res.status, { welcome: info.welcome, limit: info.limit });
        }
        return data;
    }

    async function refreshQuota() {
        try {
            quota = await apiFetch('/me');
        } catch (e) {
            return quota;
        }
        quotaListeners.forEach((fn) => { try { fn(quota); } catch (e) {} });
        return quota;
    }

    /* بعد رسالة ناجحة: كننقصو العداد محليا فوراً، وكنأكدوه من الخادم فالخلفية */
    function noteMessageUsed() {
        if (quota) {
            quota = Object.assign({}, quota, {
                used: quota.used + 1,
                remaining: Math.max(0, quota.remaining - 1)
            });
            quotaListeners.forEach((fn) => { try { fn(quota); } catch (e) {} });
        }
        refreshQuota();
    }

    window.RobatyAuth = {
        init,
        whenReady: () => readyPromise,
        isSignedIn,
        signIn,
        signOut: () => (auth ? auth.signOut() : Promise.resolve()),
        apiFetch,
        refreshQuota,
        noteMessageUsed,
        getQuota: () => quota,
        onAuthChange: (fn) => { authListeners.push(fn); },
        onQuotaChange: (fn) => { quotaListeners.push(fn); }
    };

    init();
})();
