const storyData = {

    'day01-morning': {

        image: 'day01-chefchaouen-morning.jpg',

        time: 'اليوم · 07:00 AM',

        kicker: 'صوّتي مع Robaty ✨',

        question: 'كيفاش تنسقي هاد الإطلالة؟',

        options: [

            [
                'white',
                'A — مع سروال أبيض واسع 🤍'
            ],

            [
                'jeans',
                'B — مع Jeans أزرق 👖'
            ]

        ],

        result: 'اختيار زوين! غادي نخليو النتيجة جزءًا من تجربة Robaty ✨'

    },


    'day01-evening': {

        image: 'day01-essaouira-evening.jpg',

        time: 'اليوم · 07:00 PM',

        kicker: 'تحدي Robaty 👑',

        question: 'فين غادي تدوزي هاد اللحظة؟',

        options: [

            [
                'sea',
                'A — جلسة هادئة حدّ البحر 🌊'
            ],

            [
                'medina',
                'B — جولة فالمدينة القديمة 🧿'
            ]

        ],

        result: 'اختيارك وصل لـ Robaty ✨'

    }

};



/* عناصر Story */

const modal = document.getElementById('storyModal');

const image = document.getElementById('storyImage');

const time = document.getElementById('storyTime');

const kicker = document.getElementById('storyKicker');

const question = document.getElementById('storyQuestion');

const options = document.getElementById('storyOptions');

const result = document.getElementById('storyResult');



/* فتح Story */

function openStory(storyId) {

    const story = storyData[storyId];

    if (!story) return;


    image.src = story.image;

    time.textContent = story.time;

    kicker.textContent = story.kicker;

    question.textContent = story.question;

    result.textContent = '';

    options.innerHTML = '';


    const savedVote = localStorage.getItem(`robaty_poll_${storyId}`);


    story.options.forEach(([id, label]) => {

        const button = document.createElement('button');


        button.className = 'story-option';

        button.type = 'button';

        button.textContent = label;


        if (savedVote === id) {

            button.classList.add('selected');

            result.textContent = story.result;

        }


        button.addEventListener('click', () => {

            options
                .querySelectorAll('.story-option')
                .forEach(item => {

                    item.classList.remove('selected');

                });


            button.classList.add('selected');

            result.textContent = story.result;

            localStorage.setItem(`robaty_poll_${storyId}`, id);

        });


        options.appendChild(button);

    });


    modal.classList.add('active');

    modal.setAttribute('aria-hidden', 'false');

}



/* إغلاق Story */

function closeStory() {

    modal.classList.remove('active');

    modal.setAttribute('aria-hidden', 'true');

}



/* ربط أزرار Story */

document
    .querySelectorAll('[data-story]')
    .forEach(button => {

        button.addEventListener('click', () => {

            openStory(button.dataset.story);

        });

    });



/* زر الإغلاق */

document
    .getElementById('closeStoryBtn')
    .addEventListener('click', closeStory);



/* الضغط خارج البطاقة */

document
    .querySelector('[data-close-story]')
    .addEventListener('click', closeStory);



/* زر Escape */

document.addEventListener('keydown', event => {

    if (event.key === 'Escape') {

        closeStory();

    }

});
