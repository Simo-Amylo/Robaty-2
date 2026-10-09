/* ==========================================================================
Robaty — نظام Story موحّد (مشترك بين moments.html و profile.html)
المحتوى كله كيجي من moments-data.js (خاص يتحط قبل story.js فـ HTML).
كل Story = صورة بملء الشاشة + جملة قصيرة مكتوبة فوقها من الأسفل.
========================================================================== */

const RM = window.RobatyMoments;

const storyLang = window.RobatyI18n ? window.RobatyI18n.getCurrentLang() : 'ar';

/* الـ Stories المتاحة دابا (الأحدث أولا) */
const publishedPosts = RM ? RM.getPublished() : [];

const storyOrder = publishedPosts.map(post => post.id);

const storyData = {};

publishedPosts.forEach(post => {
    storyData[post.id] = {
        image: post.image,
        place: RM.t(post.place, storyLang),
        text: RM.t(post.story, storyLang),
        kicker: post.kicker,           // اختياري: نص خاص بهاد اليوم (سطرين بـ \n) ولا false لإخفاء العبارة
        kickerEmoji: post.kickerEmoji, // اختياري
        kickerSide: post.kickerSide    // اختياري: 'right' (افتراضي) | 'left' | 'center'
    };
});


/* عناصر Story — نفس الـ ids فـ moments.html و profile.html */

const modal = document.getElementById('storyModal');
const storyImageEl = document.getElementById('storyImage');
const storyTimeEl = document.getElementById('storyTime');
const storyTextEl = document.getElementById('storyText');

let currentStoryId = null;


/* ==========================================================================
   عبارة اليوم: "سمعيني مزيان" كتتكتب حرف بحرف فـ 3 ثواني، وملي تكمل كيبان الإيموجي
   ========================================================================== */

const KICKER_DURATION = 3000;     // مدة الكتابة (مللي ثانية)
const KICKER_START_DELAY = 250;   // وقفة صغيرة قبل ما تبدا
const KICKER_MAX_SIZE = 40;       // أكبر حجم خط (px) — كيصغر وحدو إلا كانت العبارة طويلة
const KICKER_MIN_SIZE = 16;
const KICKER_EMOJI = '👂';

/* السطر الثالث: "أ صاحبتي 🤍" — كيبان غير مع العبارة الافتراضية (ماشي مع العبارات الخاصة بيوم معين)،
   وكيتكتب بعد ما يبان إيموجي الودن، وملي يكمل كيبان القلب الأبيض */
const KICKER_FRIEND_GAP = 350;          // وقفة بين ظهور الودن وبداية كتابة السطر الثالث (مللي ثانية)
const KICKER_FRIEND_DURATION = 900;     // مدة كتابة السطر الثالث
const KICKER_FRIEND_SIZE = 0.58;        // حجمو بالنسبة للسطرين الأولين
const KICKER_FRIEND_FALLBACK = 'أ صاحبتي';

/* القلب كيتعرض كـ SVG (ماشي إيموجي) باش يبان مزيان فكل التيليفونات، حتى القديمة اللي ما كتدعمش 🤍 */
const KICKER_HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

/* التنسيق ديال السطر الثالث كيتزاد تلقائيا (باش يخدم فـ moments.html و profile.html بلا ما نبدلو الـ CSS) */
const KICKER_FRIEND_CSS = `
.kicker-line.kicker-friend {
    font-size: calc(var(--kicker-size, 44px) * ${KICKER_FRIEND_SIZE});
    margin-top: 2px;
}

.kicker-heart {
    display: inline-block;

    width: 0.95em;
    height: 0.95em;

    margin-inline-start: 7px;

    vertical-align: -0.14em;

    opacity: 0;
    transform: scale(0.2);

    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.55));
}

.kicker-heart svg {
    display: block;

    width: 100%;
    height: 100%;

    fill: #fff;
}

.kicker-heart.show {
    animation:
        kickerHeartPop 0.5s cubic-bezier(0.2, 1.5, 0.4, 1) forwards,
        kickerHeartBeat 1.6s ease-in-out 0.7s infinite;
}

@keyframes kickerHeartPop {
    from { opacity: 0; transform: scale(0.2); }
    to   { opacity: 1; transform: scale(1); }
}

@keyframes kickerHeartBeat {
    0%, 60%, 100% { transform: scale(1); }
    15%           { transform: scale(1.18); }
    30%           { transform: scale(1); }
    45%           { transform: scale(1.12); }
}

@media (prefers-reduced-motion: reduce) {
    .kicker-heart.show {
        animation: none;

        opacity: 1;

        transform: none;
    }
}
`;

const kickerEl = document.getElementById('storyKicker');
const kickerT1 = document.getElementById('kickerT1');
const kickerT2 = document.getElementById('kickerT2');
const kickerEmojiEl = document.getElementById('kickerEmoji');

let kickerFriendLine = null;
let kickerT3 = null;
let kickerHeartEl = null;

let kickerRaf = null;
let kickerTimer = null;
let kickerToken = 0;

/* إنشاء السطر الثالث (مرة وحدة) */
function ensureFriendLine() {

    if (!kickerEl || kickerT3) return;

    if (!document.getElementById('kickerFriendStyles')) {
        const style = document.createElement('style');
        style.id = 'kickerFriendStyles';
        style.textContent = KICKER_FRIEND_CSS;
        document.head.appendChild(style);
    }

    kickerFriendLine = document.createElement('div');
    kickerFriendLine.className = 'kicker-line kicker-friend';
    kickerFriendLine.style.display = 'none';

    kickerT3 = document.createElement('span');
    kickerT3.id = 'kickerT3';

    kickerHeartEl = document.createElement('span');
    kickerHeartEl.className = 'kicker-heart';
    kickerHeartEl.innerHTML = KICKER_HEART_SVG;

    kickerFriendLine.appendChild(kickerT3);
    kickerFriendLine.appendChild(kickerHeartEl);

    kickerEl.appendChild(kickerFriendLine);

}

function stopKicker() {

    kickerToken++;

    if (kickerRaf) cancelAnimationFrame(kickerRaf);
    if (kickerTimer) clearTimeout(kickerTimer);

    kickerRaf = null;
    kickerTimer = null;

    if (!kickerEl) return;

    kickerT1.textContent = '';
    kickerT2.textContent = '';

    kickerEmojiEl.classList.remove('show');
    kickerEmojiEl.textContent = '';

    kickerT1.parentNode.classList.remove('typing');
    kickerT2.parentNode.classList.remove('typing');

    if (kickerT3) {
        kickerT3.textContent = '';
        kickerT3.style.minWidth = '';

        kickerHeartEl.classList.remove('show');

        kickerFriendLine.classList.remove('typing');
        kickerFriendLine.style.display = 'none';
    }

}

function playKicker(story) {

    stopKicker();

    if (!kickerEl) return;

    kickerT1.style.minWidth = '';
    kickerT2.style.minWidth = '';

    /* النص: الخاص بالمنشور، وإلا الافتراضي المترجم */
    if (story.kicker === false) return;

    const raw = story.kicker
        ? window.RobatyMoments.t(story.kicker, storyLang)
        : (window.RobatyI18n ? window.RobatyI18n.t('story_kicker') : 'سمعيني\nمزيان');

    const parts = String(raw).split('\n');

    const line1 = Array.from(parts[0] || '');
    const line2 = Array.from(parts.slice(1).join(' '));

    const total = line1.length + line2.length;

    if (!total) return;

    /* السطر الثالث "أ صاحبتي 🤍": غير مع العبارة الافتراضية */
    ensureFriendLine();

    let friendRaw = '';

    if (!story.kicker) {
        friendRaw = window.RobatyI18n ? window.RobatyI18n.t('story_kicker_friend') : KICKER_FRIEND_FALLBACK;
        if (friendRaw === 'story_kicker_friend') friendRaw = KICKER_FRIEND_FALLBACK;
    }

    const friend = Array.from(friendRaw);

    kickerFriendLine.style.display = friend.length ? '' : 'none';

    /* موضع العبارة */
    kickerEl.classList.toggle('kicker-left', story.kickerSide === 'left');
    kickerEl.classList.toggle('kicker-center', story.kickerSide === 'center');

    kickerEmojiEl.textContent = story.kickerEmoji || KICKER_EMOJI;

    /* ملاءمة الحجم: كنكتبو النص كامل مؤقتا، كنقيسو، وكنصغرو إلا كان كيزيد على العرض */
    kickerEl.style.setProperty('--kicker-size', KICKER_MAX_SIZE + 'px');
    kickerT1.textContent = line1.join('');
    kickerT2.textContent = line2.join('');
    kickerT3.textContent = friend.join('');

    const available = kickerEl.clientWidth * 0.94;   // هامش أمان باش الإيموجي ما يلصقش فالحافة
    const w1 = kickerT1.getBoundingClientRect().width;
    const w2 = kickerT2.getBoundingClientRect().width + kickerEmojiEl.getBoundingClientRect().width + 10;
    const w3 = friend.length ? kickerT3.getBoundingClientRect().width + kickerHeartEl.getBoundingClientRect().width + 10 : 0;
    const widest = Math.max(w1, w2, w3, 1);

    const size = Math.max(KICKER_MIN_SIZE, Math.min(KICKER_MAX_SIZE, KICKER_MAX_SIZE * available / widest));

    kickerEl.style.setProperty('--kicker-size', size.toFixed(1) + 'px');

    /* كنثبتو عرض كل سطر (بالحجم النهائي) باش الكتابة تمشي داخل مساحتها بلا ما يتحرك السطر،
       والسطور كيبقاو ملصوقين بالحافة اليمنى فكل اللغات */
    kickerT1.style.minWidth = Math.ceil(kickerT1.getBoundingClientRect().width) + 'px';
    kickerT2.style.minWidth = Math.ceil(kickerT2.getBoundingClientRect().width) + 'px';
    kickerT3.style.minWidth = friend.length ? Math.ceil(kickerT3.getBoundingClientRect().width) + 'px' : '';

    kickerT1.textContent = '';
    kickerT2.textContent = '';
    kickerT3.textContent = '';

    /* نهاية كتابة السطرين الأولين (+ الودن) */
    const finishMain = () => {

        kickerT1.textContent = line1.join('');
        kickerT2.textContent = line2.join('');

        kickerT1.parentNode.classList.remove('typing');
        kickerT2.parentNode.classList.remove('typing');

        kickerEmojiEl.classList.add('show');

    };

    /* نهاية السطر الثالث (+ القلب الأبيض) */
    const finishFriend = () => {

        if (!friend.length) return;

        kickerT3.textContent = friend.join('');

        kickerFriendLine.classList.remove('typing');

        kickerHeartEl.classList.add('show');

    };

    const finish = () => {

        finishMain();
        finishFriend();

    };

    /* المستخدمة اللي مفعلة "تقليل الحركة": كنبينو العبارة مباشرة */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish();
        return;
    }

    const token = kickerToken;

    /* كتابة السطر الثالث حرف بحرف */
    const typeFriend = () => {

        if (token !== kickerToken) return;

        const startF = performance.now();
        let shownF = -1;

        const tickF = now => {

            if (token !== kickerToken) return;

            const progressF = Math.min(1, (now - startF) / KICKER_FRIEND_DURATION);
            const countF = Math.min(friend.length, Math.ceil(progressF * friend.length));

            if (countF !== shownF) {

                shownF = countF;

                kickerT3.textContent = friend.slice(0, countF).join('');

                kickerFriendLine.classList.toggle('typing', countF < friend.length || countF === 0);

            }

            if (progressF >= 1) {
                finishFriend();
                return;
            }

            kickerRaf = requestAnimationFrame(tickF);

        };

        kickerRaf = requestAnimationFrame(tickF);

    };

    kickerTimer = setTimeout(() => {

        const startTime = performance.now();
        let shown = -1;

        const tick = now => {

            if (token !== kickerToken) return;

            const progress = Math.min(1, (now - startTime) / KICKER_DURATION);
            const count = Math.min(total, Math.ceil(progress * total));

            if (count !== shown) {

                shown = count;

                const n1 = Math.min(count, line1.length);
                const n2 = Math.max(0, count - line1.length);

                kickerT1.textContent = line1.slice(0, n1).join('');
                kickerT2.textContent = line2.slice(0, n2).join('');

                kickerT1.parentNode.classList.toggle('typing', count < line1.length || (count === 0));
                kickerT2.parentNode.classList.toggle('typing', count >= line1.length && count < total);

            }

            if (progress >= 1) {

                finishMain();

                if (friend.length) {
                    kickerTimer = setTimeout(typeFriend, KICKER_FRIEND_GAP);
                }

                return;

            }

            kickerRaf = requestAnimationFrame(tick);

        };

        kickerRaf = requestAnimationFrame(tick);

    }, KICKER_START_DELAY);

}


/* حفظ حالة "شوهدت" — نفس المفتاح والصيغة ديال story-glow-fx.js */

function markLatestStorySeen(id) {

    try {

        const seen = JSON.parse(localStorage.getItem('robaty_story_seen')) || {};

        seen[id] = 1;

        const ids = Object.keys(seen);

        if (ids.length > 300) {
            ids.slice(0, ids.length - 300).forEach(k => { delete seen[k]; });
        }

        localStorage.setItem('robaty_story_seen', JSON.stringify(seen));

    } catch (e) {}

}


/* الحلقة النابضة حول صورة البروفايل (فـ profile.html فقط):
   كتنبض بلا توقف ما دام آخر Story ما تشافتش، وكتوقف ملي تتفتح،
   وكترجع غير ملي يتنشر Story جديد (نفس منهجية صورة Robaty فشاشة المحادثة) */

function refreshProfileRing() {

    const btn = document.getElementById('openStoryBtn');

    const ring = btn ? btn.querySelector('.story-ring-glow') : null;

    if (!ring) return;

    const latestId = storyOrder[0];

    let seen = {};

    try { seen = JSON.parse(localStorage.getItem('robaty_story_seen')) || {}; } catch (e) {}

    ring.classList.toggle('hint-pulse', !!latestId && !seen[latestId]);

}

/* فتح Story معينة بالـ id ديالها */

function openStory(storyId) {

    const story = storyData[storyId];

    const elementsReady = modal && storyImageEl && storyTimeEl && storyTextEl;

    if (!story || !elementsReady) return;

    currentStoryId = storyId;

    /* آخر Story انفتحات = شوهدت (كتوقف الحلقة النابضة حول صورة Robaty فشاشة المحادثة) */
    if (storyId === storyOrder[0]) {
        markLatestStorySeen(storyId);
        refreshProfileRing();
    }

    storyImageEl.src = story.image;
    storyTimeEl.textContent = story.place;
    storyTextEl.textContent = story.text;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    playKicker(story);

}


/* إغلاق Story */

function closeStory() {

    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    stopKicker();

    currentStoryId = null;

}


/* التنقل بين الـ Stories (يمين = الأقدم، شمال = الأحدث) */

function goToStory(direction) {

    if (!currentStoryId) return;

    const currentIndex = storyOrder.indexOf(currentStoryId);

    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;

    /* آخر Story: كنسدو (بحال إنستغرام). أول Story: كنبقاو فيها */
    if (nextIndex >= storyOrder.length) {
        closeStory();
        return;
    }

    if (nextIndex < 0) return;

    openStory(storyOrder[nextIndex]);

}


/* ربط أزرار فتح Story محددة (Story Ring فوق كل منشور) */

document
    .querySelectorAll('[data-story]')
    .forEach(button => {

        button.addEventListener('click', () => {

            openStory(button.dataset.story);

        });

    });


/* ربط صورة البروفايل (فـ profile.html) — كتفتح آخر Story منشورة */

const openStoryBtn = document.getElementById('openStoryBtn');

if (openStoryBtn) {

    openStoryBtn.addEventListener('click', () => {

        if (storyOrder.length > 0) {
            openStory(storyOrder[0]);
        }

    });

}


/* زر الإغلاق */

const closeStoryBtn = document.getElementById('closeStoryBtn');

if (closeStoryBtn) {

    closeStoryBtn.addEventListener('click', closeStory);

}


/* الضغط خارج النص (على الصورة أو المساحة الفارغة) */
/* ملاحظة: .story-content كيغطي .story-backdrop بالكامل، فالضغطة
   ما توصلش لـ backdrop أبدا — الحل: نستمعو للضغط مباشرة على
   .story-content أو على صورة الـ Story نفسها */

const storyContentEl = document.querySelector('.story-content');

if (storyContentEl && storyImageEl) {

    storyContentEl.addEventListener('click', event => {

        if (event.target === storyContentEl || event.target === storyImageEl) {
            closeStory();
        }

    });

}


/* مناطق التنقل (يمين = التالية، شمال = السابقة) */

const storyNavLeft = document.getElementById('storyNavLeft');
const storyNavRight = document.getElementById('storyNavRight');

if (storyNavLeft) {
    storyNavLeft.addEventListener('click', () => goToStory(-1));
}

if (storyNavRight) {
    storyNavRight.addEventListener('click', () => goToStory(1));
}


/* زر Escape */

document.addEventListener('keydown', event => {

    if (event.key === 'Escape') {
        closeStory();
    }

});


/* تشغيل/تحديث الحلقة: عند فتح الصفحة، كل دقيقة (باش تبان وحدها فاش يتنشر Story جديد)،
   عند الرجوع للتطبيق، وعند الرجوع للصفحة بزر الرجوع */

refreshProfileRing();

setInterval(refreshProfileRing, 60 * 1000);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshProfileRing();
});

window.addEventListener('pageshow', refreshProfileRing);


/* فتح آخر Story مباشرة من رابط: profile.html?story=latest (كيجي من صورة Robaty فشاشة المحادثة)
   — كنمسحو البارامتر من الرابط باش ما تعاودش تتفتح مع التحديث (refresh) */

(function openStoryFromLink() {

    try {

        const params = new URLSearchParams(window.location.search);

        if (params.get('story') !== 'latest') return;

        if (storyOrder.length > 0) {
            openStory(storyOrder[0]);
        }

        params.delete('story');

        const rest = params.toString();

        window.history.replaceState(
            null,
            '',
            window.location.pathname + (rest ? '?' + rest : '') + window.location.hash
        );

    } catch (e) {}

})();
