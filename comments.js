// ==========================================================================
// Robaty — نظام التعليقات (Firebase Auth + Firestore)
// ==========================================================================

(function () {

    var auth = firebase.auth();
    var db = firebase.firestore();

    var currentUser = null;
    var currentPostId = null;
    var unsubscribeComments = null;

    // ---------------------------------------------------------------
    // فلترة كلمات ممنوعة — بسيطة، زيدي/نقصي الكلمات هنا بحسب الحاجة
    // ---------------------------------------------------------------
    var BANNED_WORDS = [
        // مثال — زيدي الكلمات اللي بغيتي تمنعي هنا (بالدارجة، بالفرنسية...)
        "بذاءة1", "بذاءة2"
    ];

    function containsBannedWord(text) {
        var lower = text.toLowerCase();
        return BANNED_WORDS.some(function (w) {
            return w && lower.indexOf(w.toLowerCase()) !== -1;
        });
    }

    // ---------------------------------------------------------------
    // تسجيل الدخول / الخروج
    // ---------------------------------------------------------------
    function signInWithGoogle() {
        var provider = new firebase.auth.GoogleAuthProvider();
        return auth.signInWithPopup(provider).catch(function (err) {
            // بعض متصفحات الهاتف كتحجب popup — نجربو redirect كبديل
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
                return auth.signInWithRedirect(provider);
            }
            console.error(err);
        });
    }

    function signOutUser() {
        return auth.signOut();
    }

    auth.onAuthStateChanged(function (user) {
        currentUser = user;
        renderAuthUI();
    });

    // ---------------------------------------------------------------
    // فتح نافذة التعليقات لمنشور معين
    // ---------------------------------------------------------------
    function openCommentsModal(postId) {
        currentPostId = postId;

        var modal = document.getElementById('simpleModal');
        var title = document.getElementById('simpleModalTitle');

        title.textContent = '💬 التعليقات';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        renderCommentsShell();
        subscribeToComments(postId);
    }

    function closeCommentsModal() {
        if (unsubscribeComments) {
            unsubscribeComments();
            unsubscribeComments = null;
        }
        currentPostId = null;
    }

    // ---------------------------------------------------------------
    // بناء واجهة النافذة (auth + لائحة + خانة الكتابة)
    // ---------------------------------------------------------------
    function renderCommentsShell() {
        var body = document.querySelector('#simpleModal .simple-modal-body');

        body.innerHTML =
            '<div class="comments-wrap">' +
                '<div id="commentsAuthBar" class="comments-auth-bar"></div>' +
                '<div id="commentsList" class="comments-list"><div class="comments-loading">كنحملو التعليقات...</div></div>' +
                '<div id="commentsInputBar" class="comments-input-bar"></div>' +
            '</div>';

        renderAuthUI();
    }

    function renderAuthUI() {
        var authBar = document.getElementById('commentsAuthBar');
        var inputBar = document.getElementById('commentsInputBar');

        if (!authBar || !inputBar) {
            return; // النافذة ماشي مفتوحة دابا
        }

        if (currentUser) {
            authBar.innerHTML =
                '<div class="comments-user">' +
                    '<img src="' + (currentUser.photoURL || '') + '" alt="" class="comments-user-avatar">' +
                    '<span>' + escapeHtml(currentUser.displayName || 'مستخدمة') + '</span>' +
                    '<button id="commentsSignOutBtn" class="comments-signout-btn">خروج</button>' +
                '</div>';

            document.getElementById('commentsSignOutBtn').addEventListener('click', signOutUser);

            inputBar.innerHTML =
                '<textarea id="commentInput" class="comment-input" placeholder="اكتبي تعليق..." rows="2"></textarea>' +
                '<button id="commentSendBtn" class="comment-send-btn">إرسال</button>';

            document.getElementById('commentSendBtn').addEventListener('click', handleSubmitComment);

        } else {
            authBar.innerHTML =
                '<button id="commentsSignInBtn" class="comments-signin-btn">' +
                    'سجلي الدخول بـ Google باش تكتبي تعليق' +
                '</button>';

            document.getElementById('commentsSignInBtn').addEventListener('click', signInWithGoogle);

            inputBar.innerHTML = '';
        }
    }

    // ---------------------------------------------------------------
    // قراءة التعليقات (realtime) وعرضها
    // ---------------------------------------------------------------
    function subscribeToComments(postId) {
        if (unsubscribeComments) {
            unsubscribeComments();
        }

        var listEl = document.getElementById('commentsList');

        // ملاحظة: ماكاينش orderBy هنا عمدا — where + orderBy مع بعض كيحتاجو
        // "composite index" فـ Firestore. كنديرو الترتيب هنا فـ JS عوض.
        unsubscribeComments = db.collection('comments')
            .where('postId', '==', postId)
            .onSnapshot(function (snapshot) {
                if (snapshot.empty) {
                    listEl.innerHTML = '<div class="comments-empty">مازال ماكاين تعليقات — كوني الأولى ✨</div>';
                    return;
                }

                var items = [];
                snapshot.forEach(function (doc) {
                    items.push(doc.data());
                });

                items.sort(function (a, b) {
                    var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                    var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
                    return ta - tb;
                });

                var html = '';
                items.forEach(function (c) {
                    html +=
                        '<div class="comment-item">' +
                            '<img src="' + (c.authorPhoto || '') + '" alt="" class="comment-avatar">' +
                            '<div class="comment-body">' +
                                '<div class="comment-author">' + escapeHtml(c.authorName || 'مستخدمة') + '</div>' +
                                '<div class="comment-text">' + escapeHtml(c.text) + '</div>' +
                            '</div>' +
                        '</div>';
                });

                listEl.innerHTML = html;
                listEl.scrollTop = listEl.scrollHeight;
            }, function (err) {
                listEl.innerHTML = '<div class="comments-empty">تعذر تحميل التعليقات: ' + escapeHtml(err.message || err.code || '') + '</div>';
                console.error(err);
            });
    }

    // ---------------------------------------------------------------
    // إرسال تعليق جديد
    // ---------------------------------------------------------------
    function handleSubmitComment() {
        var input = document.getElementById('commentInput');
        var text = input.value.trim();

        if (!text) {
            return;
        }

        if (containsBannedWord(text)) {
            alert('التعليق فيه كلمة ممنوعة، عافاك بدليه');
            return;
        }

        if (text.length > 500) {
            alert('التعليق طويل بزاف (500 حرف الحد الأقصى)');
            return;
        }

        db.collection('comments').add({
            postId: currentPostId,
            text: text,
            uid: currentUser.uid,
            authorName: currentUser.displayName || 'مستخدمة',
            authorPhoto: currentUser.photoURL || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            input.value = '';
        }).catch(function (err) {
            alert('تعذر إرسال التعليق: ' + (err.message || err.code || 'خطأ غير معروف'));
            console.error(err);
        });
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---------------------------------------------------------------
    // ربط أزرار "تعليق" فـ moments.html
    // ---------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.action-item[data-action="comments"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var postId = btn.closest('.post-card').id;
                openCommentsModal(postId);
            });
        });

        document.querySelectorAll('[data-close-simple-modal]').forEach(function (el) {
            el.addEventListener('click', closeCommentsModal);
        });

        var closeBtn = document.getElementById('closeSimpleModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCommentsModal);
        }
    });

})();
