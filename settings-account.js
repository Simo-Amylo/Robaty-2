// ==========================================================================
// Robaty — صفحة الإعدادات: حساب Google + تسجيل الخروج + حذف حسابي وبياناتي
// ==========================================================================
// المبدأ: المحادثات والذاكرة كتبقى فالجهاز فقط. الحساب كيخدم غير للتعليق
// والإعجاب والمتابعة (Firebase). «حذف حسابي» كيحيد:
//   1) تعليقات المستخدمة + إعجاباتها فتعليقات الآخرين
//   2) متابعتها (ينقص العداد بواحد)
//   3) حساب Firebase
//   4) كلشي لي فالجهاز اللي سميتو كيبدا بـ robaty
// ==========================================================================

(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };
    var tt = function (key) { return window.RobatyI18n ? window.RobatyI18n.t(key) : key; };

    var toastTimer;
    function toast(msg) {
        var t = $('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
    }

    var hasFirebase = typeof firebase !== 'undefined' && firebase.auth && firebase.firestore;
    var auth = hasFirebase ? firebase.auth() : null;
    var db = hasFirebase ? firebase.firestore() : null;
    var currentUser = null;
    var busy = false;

    // ------------------------------------------------------------------
    // الواجهة
    // ------------------------------------------------------------------
    function render() {
        var signedIn = !!currentUser;

        $('accSignedOut').hidden = signedIn;
        $('accSignedIn').hidden = !signedIn;
        $('delaccBodyIn').hidden = !signedIn;
        $('delaccBodyOut').hidden = signedIn;

        if (!signedIn) return;

        var name = currentUser.displayName || '';
        var email = currentUser.email || '';
        $('accName').textContent = name;
        $('accEmail').textContent = email;

        var img = $('accAvatar');
        var initial = $('accInitial');
        if (currentUser.photoURL) {
            img.src = currentUser.photoURL;
            img.hidden = false;
            initial.textContent = '';
        } else {
            img.hidden = true;
            initial.textContent = (name || email || '?').charAt(0).toUpperCase();
        }
    }

    // ------------------------------------------------------------------
    // تسجيل الدخول / الخروج
    // ------------------------------------------------------------------
    $('accSignInBtn').addEventListener('click', function () {
        if (!auth) { toast(tt('st_acc_offline')); return; }
        var provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(function (err) {
            var code = err && err.code;
            // popup فقط (redirect كيعطي "requested action is invalid" على الدومين المخصص)
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
            toast(tt('st_acc_fail'));
        });
    });

    $('accSignOutBtn').addEventListener('click', function () {
        if (!auth) return;
        auth.signOut().then(function () {
            toast(tt('st_acc_signed_out'));
        }).catch(function () {
            toast(tt('st_acc_fail'));
        });
    });

    // ------------------------------------------------------------------
    // حذف البيانات
    // ------------------------------------------------------------------

    // كلشي لي فالجهاز اللي سميتو كيبدا بـ robaty (ذاكرة، إعدادات، متابعة، إلخ)
    function wipeLocal() {
        try {
            var keys = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && /^robaty/i.test(k)) keys.push(k);
            }
            keys.forEach(function (k) { localStorage.removeItem(k); });
        } catch (e) {}
    }

    // المتابعة: العداد مجهول (ماشي مربوط بـ uid)، كننقصو بواحد إلا كانت متابعة
    function undoFollow() {
        var following = null;
        try { following = localStorage.getItem('robaty_following'); } catch (e) {}
        if (following !== '1' || !db) return Promise.resolve();
        return db.collection('profileStats').doc('robaty_ai')
            .set({ followers: firebase.firestore.FieldValue.increment(-1) }, { merge: true })
            .catch(function (err) { console.warn('undoFollow', err); });   // ما نوقفوش الحذف على هادي
    }

    // Firestore batch كيقبل 500 عملية، كنقسمو على 400
    function runInChunks(docs, apply) {
        var chain = Promise.resolve();
        for (var i = 0; i < docs.length; i += 400) {
            (function (slice) {
                chain = chain.then(function () {
                    var batch = db.batch();
                    slice.forEach(function (d) { apply(batch, d.ref); });
                    return batch.commit();
                });
            })(docs.slice(i, i + 400));
        }
        return chain;
    }

    function deleteCloudData(uid) {
        var FV = firebase.firestore.FieldValue;

        // 1) التعليقات والردود ديالها
        return db.collection('comments').where('uid', '==', uid).get().then(function (snap) {
            return runInChunks(snap.docs, function (batch, ref) { batch.delete(ref); });
        }).then(function () {
            // 2) إعجاباتها فتعليقات الآخرين
            return db.collection('comments').where('likedBy', 'array-contains', uid).get();
        }).then(function (snap) {
            return runInChunks(snap.docs, function (batch, ref) {
                batch.update(ref, { likedBy: FV.arrayRemove(uid) });
            });
        });
    }

    function setBusy(on) {
        busy = on;
        $('delAccOk').disabled = on;
        $('delAccCancel').disabled = on;
        $('delAccOk').textContent = on ? tt('st_delacc_working') : tt('st_delacc_confirm_btn');
    }

    function closeConfirm() {
        $('delAccConfirm').hidden = true;
        $('delAccBtn').hidden = false;
    }

    function finish() {
        wipeLocal();
        toast(tt('st_delacc_done'));
        setTimeout(function () { window.location.reload(); }, 1400);
    }

    function runDelete() {
        if (busy) return;
        setBusy(true);

        // غير مسجلة: غير الجهاز + المتابعة
        if (!currentUser) {
            undoFollow().then(finish);
            return;
        }

        var user = currentUser;
        var provider = new firebase.auth.GoogleAuthProvider();

        // 0) تأكيد الدخول من جديد (Firebase كيطلبو قبل حذف الحساب).
        //    كندير هادشي الأول باش ما نبقاوش بحذف نصفي إلا تلغا.
        user.reauthenticateWithPopup(provider).then(function () {
            return deleteCloudData(user.uid);
        }).then(function () {
            return undoFollow();
        }).then(function () {
            return user.delete();
        }).then(finish).catch(function (err) {
            console.warn('deleteAccount', err);
            var code = err && err.code;
            var reauth = code === 'auth/popup-closed-by-user' ||
                         code === 'auth/cancelled-popup-request' ||
                         code === 'auth/popup-blocked' ||
                         code === 'auth/user-mismatch';
            toast(tt(reauth ? 'st_delacc_reauth_fail' : 'st_delacc_fail'));
            setBusy(false);
        });
    }

    $('delAccBtn').addEventListener('click', function () {
        $('delAccBtn').hidden = true;
        $('delAccConfirm').hidden = false;
    });
    $('delAccCancel').addEventListener('click', function () { if (!busy) closeConfirm(); });
    $('delAccOk').addEventListener('click', runDelete);

    // ------------------------------------------------------------------
    // التشغيل
    // ------------------------------------------------------------------
    if (auth) {
        auth.onAuthStateChanged(function (user) {
            currentUser = user;
            render();
        });
    } else {
        render();
        $('accSignInBtn').disabled = true;
    }
})();
