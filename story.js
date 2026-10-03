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
const KICKER_MAX_SIZE = 46;       // أكبر حجم خط (px) — كيصغر وحدو إلا كانت العبارة طويلة
const KICKER_MIN_SIZE = 24;
const KICKER_EMOJI = '👂';

const kickerEl = document.getElementById('storyKicker');
const kickerT1 = document.getElementById('kickerT1');
const kickerT2 = document.getElementById('kickerT2');
const kickerEmojiEl = document.getElementById('kickerEmoji');

let kickerRaf = null;
let kickerTimer = null;
let kickerToken = 0;

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

}

function playKicker(story) {

    stopKicker();

    if (!kickerEl) return;

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

    /* موضع العبارة */
    kickerEl.classList.toggle('kicker-left', story.kickerSide === 'left');
    kickerEl.classList.toggle('kicker-center', story.kickerSide === 'center');

    kickerEmojiEl.textContent = story.kickerEmoji || KICKER_EMOJI;

    /* ملاءمة الحجم: كنكتبو النص كامل مؤقتا، كنقيسو، وكنصغرو إلا كان كيزيد على العرض */
    kickerEl.style.setProperty('--kicker-size', KICKER_MAX_SIZE + 'px');
    kickerT1.textContent = line1.join('');
    kickerT2.textContent = line2.join('');

    const available = kickerEl.clientWidth * 0.94;   // هامش أمان باش الإيموجي ما يلصقش فالحافة
    const w1 = kickerT1.getBoundingClientRect().width;
    const w2 = kickerT2.getBoundingClientRect().width + kickerEmojiEl.getBoundingClientRect().width + 10;
    const widest = Math.max(w1, w2, 1);

    const size = Math.max(KICKER_MIN_SIZE, Math.min(KICKER_MAX_SIZE, KICKER_MAX_SIZE * available / widest));

    kickerEl.style.setProperty('--kicker-size', size.toFixed(1) + 'px');

    kickerT1.textContent = '';
    kickerT2.textContent = '';

    const finish = () => {

        kickerT1.textContent = line1.join('');
        kickerT2.textContent = line2.join('');

        kickerT1.parentNode.classList.remove('typing');
        kickerT2.parentNode.classList.remove('typing');

        kickerEmojiEl.classList.add('show');

    };

    /* المستخدمة اللي مفعلة "تقليل الحركة": كنبينو العبارة مباشرة */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish();
        return;
    }

    const token = kickerToken;

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
                finish();
                return;
            }

            kickerRaf = requestAnimationFrame(tick);

        };

        kickerRaf = requestAnimationFrame(tick);

    }, KICKER_START_DELAY);

}


/* فتح Story معينة بالـ id ديالها */

function openStory(storyId) {

    const story = storyData[storyId];

    const elementsReady = modal && storyImageEl && storyTimeEl && storyTextEl;

    if (!story || !elementsReady) return;

    currentStoryId = storyId;

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
