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
        text: RM.t(post.story, storyLang)
    };
});


/* عناصر Story — نفس الـ ids فـ moments.html و profile.html */

const modal = document.getElementById('storyModal');
const storyImageEl = document.getElementById('storyImage');
const storyTimeEl = document.getElementById('storyTime');
const storyTextEl = document.getElementById('storyText');

let currentStoryId = null;


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

}


/* إغلاق Story */

function closeStory() {

    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

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
