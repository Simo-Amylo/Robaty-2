/* ==========================================================================
Robaty — نظام Story موحّد (مشترك بين moments.html و profile.html)
========================================================================== */

/* ترتيب الـ Stories ديال اليوم (خاص يتزاد فيه أي يوم جديد فالمستقبل) */
const storyOrder = [
    'day01-morning',
    'day01-evening'
];

const storyData = {

    'day01-morning': {

        image: 'day01-chefchaouen-morning.jpg',

        time: 'اليوم · 07:00 AM',

        kicker: 'صوّتي مع Robaty ✨',

        question: 'كيفاش تنسقي هاد الإطلالة؟',

        options: [
            ['white', 'A — مع سروال أبيض واسع 🤍'],
            ['jeans', 'B — مع Jeans أزرق 👖']
        ],

        result: 'اختيار زوين! غادي نخليو النتيجة جزءًا من تجربة Robaty ✨'

    },

    'day01-evening': {

        image: 'day01-essaouira-evening.jpg',

        time: 'اليوم · 07:00 PM',

        kicker: 'تحدي Robaty 👑',

        question: 'فين غادي تدوزي هاد اللحظة؟',

        options: [
            ['sea', 'A — جلسة هادئة حدّ البحر 🌊'],
            ['medina', 'B — جولة فالمدينة القديمة 🧿']
        ],

        result: 'اختيارك وصل لـ Robaty ✨'

    }

};


/* عناصر Story — نفس الـ ids فـ moments.html و profile.html */

const modal = document.getElementById('storyModal');
const storyImageEl = document.getElementById('storyImage');
const storyTimeEl = document.getElementById('storyTime');
const storyKickerEl = document.getElementById('storyKicker');
const storyQuestionEl = document.getElementById('storyQuestion');
const storyOptionsEl = document.getElementById('storyOptions');
const storyResultEl = document.getElementById('storyResult');

let currentStoryId = null;


/* فتح Story معينة بالـ id ديالها */

function openStory(storyId) {

    const story = storyData[storyId];

    if (!story || !modal) return;

    currentStoryId = storyId;

    storyImageEl.src = story.image;
    storyTimeEl.textContent = story.time;
    storyKickerEl.textContent = story.kicker;
    storyQuestionEl.textContent = story.question;
    storyResultEl.textContent = '';
    storyOptionsEl.innerHTML = '';

    const savedVote = localStorage.getItem(`robaty_poll_${storyId}`);

    story.options.forEach(([id, label]) => {

        const button = document.createElement('button');

        button.className = 'story-option';
        button.type = 'button';
        button.textContent = label;

        if (savedVote === id) {
            button.classList.add('selected');
            storyResultEl.textContent = story.result;
        }

        button.addEventListener('click', () => {

            storyOptionsEl
                .querySelectorAll('.story-option')
                .forEach(item => item.classList.remove('selected'));

            button.classList.add('selected');
            storyResultEl.textContent = story.result;

            localStorage.setItem(`robaty_poll_${storyId}`, id);

        });

        storyOptionsEl.appendChild(button);

    });

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


/* التنقل بين الـ Stories (يمين/شمال) */

function goToStory(direction) {

    if (!currentStoryId) return;

    const currentIndex = storyOrder.indexOf(currentStoryId);

    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + direction + storyOrder.length) % storyOrder.length;

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


/* ربط صورة البروفايل (فـ profile.html) — كتفتح أول Story ديال اليوم */

const openStoryBtn = document.getElementById('openStoryBtn');

if (openStoryBtn) {

    openStoryBtn.addEventListener('click', () => {

        openStory(storyOrder[0]);

    });

}


/* زر الإغلاق */

const closeStoryBtn = document.getElementById('closeStoryBtn');

if (closeStoryBtn) {

    closeStoryBtn.addEventListener('click', closeStory);

}


/* الضغط خارج البطاقة (الخلفية) */

const storyBackdrop = document.querySelector('[data-close-story]');

if (storyBackdrop) {

    storyBackdrop.addEventListener('click', closeStory);

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
