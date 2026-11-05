/* ==========================================================================
Robaty — محرك اللغات الموحّد (i18n)
كشف تلقائي + تبديل يدوي + حفظ فـ localStorage
خاصو يتحط فـ <head> أو قبل app.js فكل صفحة (index/moments/profile)
========================================================================== */

// الترتيب = ترتيب الأزرار فالإعدادات (العربية فالزر الكبير الأخير)
const SUPPORTED_LANGS = ['ru', 'en', 'fr', 'es', 'ar'];
const RTL_LANGS = ['ar'];
const LANG_STORAGE = 'robaty_lang';
/* العربية فيها نسختين: 'ma' = الدارجة المغربية (الأصل)، 'fus' = العربية الفصحى.
   كلاهما كيستعملو نفس كود اللغة 'ar' (باش ما نكسرو باقي الصفحات)، والفرق فـ:
   - القاموس: translations.ar (مغربية) / translations.ar_fus (فصحى)
   - تعليمة الذكاء الاصطناعي (app.js) */
const ARABIC_VARIANT_STORAGE = 'robaty_ar_variant';

/* لغة جواب الذكاء الاصطناعي إلا اختارتها المستخدمة من "جميع اللغات":
   الواجهة كتبقى بالإنجليزية (لأن ما عندناش ترجمة)، و Robaty كتجاوب بهاد اللغة. */
const REPLY_LANG_STORAGE = 'robaty_reply_lang';

/* قائمة "جميع اللغات" (اسم اللغة بحروفها + بالإنجليزية للبحث) */
const ALL_LANGUAGES = [
    { code: 'af', native: 'Afrikaans', en: 'Afrikaans' },
    { code: 'sq', native: 'Shqip', en: 'Albanian' },
    { code: 'am', native: 'አማርኛ', en: 'Amharic' },
    { code: 'hy', native: 'Հայերեն', en: 'Armenian' },
    { code: 'az', native: 'Azərbaycanca', en: 'Azerbaijani' },
    { code: 'eu', native: 'Euskara', en: 'Basque' },
    { code: 'be', native: 'Беларуская', en: 'Belarusian' },
    { code: 'bn', native: 'বাংলা', en: 'Bengali' },
    { code: 'bs', native: 'Bosanski', en: 'Bosnian' },
    { code: 'bg', native: 'Български', en: 'Bulgarian' },
    { code: 'my', native: 'မြန်မာ', en: 'Burmese' },
    { code: 'ca', native: 'Català', en: 'Catalan' },
    { code: 'zh-CN', native: '中文（简体）', en: 'Chinese (Simplified)' },
    { code: 'zh-TW', native: '中文（繁體）', en: 'Chinese (Traditional)' },
    { code: 'hr', native: 'Hrvatski', en: 'Croatian' },
    { code: 'cs', native: 'Čeština', en: 'Czech' },
    { code: 'da', native: 'Dansk', en: 'Danish' },
    { code: 'nl', native: 'Nederlands', en: 'Dutch' },
    { code: 'et', native: 'Eesti', en: 'Estonian' },
    { code: 'fil', native: 'Filipino', en: 'Filipino' },
    { code: 'fi', native: 'Suomi', en: 'Finnish' },
    { code: 'gl', native: 'Galego', en: 'Galician' },
    { code: 'ka', native: 'ქართული', en: 'Georgian' },
    { code: 'de', native: 'Deutsch', en: 'German' },
    { code: 'el', native: 'Ελληνικά', en: 'Greek' },
    { code: 'gu', native: 'ગુજરાતી', en: 'Gujarati' },
    { code: 'ha', native: 'Hausa', en: 'Hausa' },
    { code: 'he', native: 'עברית', en: 'Hebrew' },
    { code: 'hi', native: 'हिन्दी', en: 'Hindi' },
    { code: 'hu', native: 'Magyar', en: 'Hungarian' },
    { code: 'is', native: 'Íslenska', en: 'Icelandic' },
    { code: 'id', native: 'Bahasa Indonesia', en: 'Indonesian' },
    { code: 'it', native: 'Italiano', en: 'Italian' },
    { code: 'ja', native: '日本語', en: 'Japanese' },
    { code: 'kn', native: 'ಕನ್ನಡ', en: 'Kannada' },
    { code: 'kk', native: 'Қазақша', en: 'Kazakh' },
    { code: 'km', native: 'ខ្មែរ', en: 'Khmer' },
    { code: 'ko', native: '한국어', en: 'Korean' },
    { code: 'ku', native: 'Kurdî', en: 'Kurdish' },
    { code: 'ky', native: 'Кыргызча', en: 'Kyrgyz' },
    { code: 'lo', native: 'ລາວ', en: 'Lao' },
    { code: 'lv', native: 'Latviešu', en: 'Latvian' },
    { code: 'lt', native: 'Lietuvių', en: 'Lithuanian' },
    { code: 'mk', native: 'Македонски', en: 'Macedonian' },
    { code: 'ms', native: 'Bahasa Melayu', en: 'Malay' },
    { code: 'ml', native: 'മലയാളം', en: 'Malayalam' },
    { code: 'mr', native: 'मराठी', en: 'Marathi' },
    { code: 'mn', native: 'Монгол', en: 'Mongolian' },
    { code: 'ne', native: 'नेपाली', en: 'Nepali' },
    { code: 'no', native: 'Norsk', en: 'Norwegian' },
    { code: 'ps', native: 'پښتو', en: 'Pashto' },
    { code: 'fa', native: 'فارسی', en: 'Persian' },
    { code: 'pl', native: 'Polski', en: 'Polish' },
    { code: 'pt', native: 'Português', en: 'Portuguese' },
    { code: 'pa', native: 'ਪੰਜਾਬੀ', en: 'Punjabi' },
    { code: 'ro', native: 'Română', en: 'Romanian' },
    { code: 'sr', native: 'Српски', en: 'Serbian' },
    { code: 'si', native: 'සිංහල', en: 'Sinhala' },
    { code: 'sk', native: 'Slovenčina', en: 'Slovak' },
    { code: 'sl', native: 'Slovenščina', en: 'Slovenian' },
    { code: 'so', native: 'Soomaali', en: 'Somali' },
    { code: 'sw', native: 'Kiswahili', en: 'Swahili' },
    { code: 'sv', native: 'Svenska', en: 'Swedish' },
    { code: 'tzm', native: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', en: 'Tamazight (Amazigh)' },
    { code: 'ta', native: 'தமிழ்', en: 'Tamil' },
    { code: 'te', native: 'తెలుగు', en: 'Telugu' },
    { code: 'th', native: 'ไทย', en: 'Thai' },
    { code: 'tr', native: 'Türkçe', en: 'Turkish' },
    { code: 'uk', native: 'Українська', en: 'Ukrainian' },
    { code: 'ur', native: 'اردو', en: 'Urdu' },
    { code: 'uz', native: 'Oʻzbekcha', en: 'Uzbek' },
    { code: 'vi', native: 'Tiếng Việt', en: 'Vietnamese' },
    { code: 'cy', native: 'Cymraeg', en: 'Welsh' },
    { code: 'yo', native: 'Yorùbá', en: 'Yoruba' },
    { code: 'zu', native: 'isiZulu', en: 'Zulu' }
];


/* الاسم ديال كل لغة بلغتها هي (ما كيتترجمش) */
const LANG_NATIVE_NAMES = {
    ar: 'المغربية',
    ar_fus: 'العربية',
    en: 'English',
    fr: 'Français',
    es: 'Español',
    ru: 'Русский'
};

/* الترجمات — كل صفحة كتزاد المفاتيح ديالها هنا مستقبلاً */
const translations = {

    ar: {
        page_title: 'Robaty - Moroccan Luxury UI',
        back_button_aria: 'رجوع',
        reset_memory_aria: 'مسح الذاكرة (مؤقت، للاختبار)',
        settings_aria: 'الإعدادات',
        tagline: '🇲🇦 مغربية و أفتخر',
        view_moments_btn: 'شوفي تصاوري ليوم',
        selected_image_alt: 'الصورة المختارة',
        remove_image_aria: 'حذف الصورة',
        message_placeholder: 'اكتبي رسالتك لـ Robaty هنا...',
        send_btn: 'إرسال',
        record_btn: 'تسجيل صوتي',
        recording_label: 'جاري التسجيل...',
        send_image_btn: 'إرسال الصور',
        settings_title: '⚙️ الإعدادات',
        language_section_title: '🌐 اللغة',
        api_key_title: '🔑 مفتاح API',
        api_key_desc: 'باش تخدمي Robaty، خاصك تدخلي مفتاح API ديالك.',
        api_key_placeholder: 'الصقي المفتاح هنا...',
        save_btn: 'حفظ',

        /* رسائل ديناميكية (app.js) */
        greeting_morning: "صباح الخير والأنوار! 🤍 كيف دايرة اليوم؟ راني هنا نسمع ليك ونرافقك فنهارك.",
        greeting_noon: "مسا الخير! 🤍 كيف داير نهارك لحد دابا؟ راني هنا نسمع ليك.",
        greeting_evening: "مسا النور! 🤍 كيف كانت جورناتك؟ راني هنا نسمع ليك ونرافقك.",
        greeting_night: "مساء الخير 🤍 مازال صاحية؟ راني هنا معاك إيلا بغيتي تهضري على شي حاجة.",
        err_overload: "راه عندها ضغط بزاف دابا، عاودي المحاولة من بعد شوية 🙏",
        err_quota: "وصلتي للحد اليومي المجاني ديال المفتاح.",
        err_request: "خطأ فالطلب",
        err_unknown: "مشكل غير معروف، جربي مرة أخرى.",
        err_mic: "ماقدرتش نوصل للميكروفون ديالك. تأكدي من صلاحية الميكروفون فإعدادات المتصفح وعاودي المحاولة.",
        reply_fallback: "سمحيلي، مافهمتش مزيان.. عاودي قوليها ليا بطريقة أخرى 🤍",
        confirm_reset: "واش متأكدة؟ غادي تتمسح المحادثة، الحقائق المحفوظة عليك، والذاكرة السردية، وهاد الشي ماغاديش يترجع.",
        sent_image_alt: "الصورة المرسلة",

        /* نصوص إضافية: Moments / الإعدادات / التثبيت / المشاركة */
        caption_more: "... المزيد",
        download_now_btn: "📲 حمّلي التطبيق الآن",
        color_mood_title: "🎨 أجواء الألوان",
        color_default_label: "🟤 بني/ذهبي",
        color_vivid_label: "🔵 أزرق/بنفسجي",
        color_emerald_label: "🟢 أخضر ملكي",
        color_cream_label: "🤍 كريمي فاتح",
        color_sky_label: "🩵 أزرق سماوي",
        color_blush_label: "💖 وردي أثيري",
        splash_tagline: "سفيرة التراث المغربي",
        install_title: "📲 تثبيت التطبيق",
        install_step1: "ضغطي <b style=\"color:#e5b35c;\">⋮</b> (ثلاث نقط) فوق فشريط Chrome",
        install_step2: "اختاري <b style=\"color:#e5b35c;\">\"Install app\"</b> أو <b style=\"color:#e5b35c;\">\"Add to Home screen\"</b>",
        install_step3: "أكدي التثبيت",
        share_intro: "مرحبا بيك عند روباتي شوفي تصاوري ليوم",
        share_intro_repost: "شوفو هاد اللحظة ديال Robaty 👇",
        share_whatsapp: "واتساب",
        share_copy_link: "نسخ الرابط",
        share_copied: "تم النسخ ✓",
        coming_soon: "قريبا... 🚧",

        /* التعليقات (comments.js) */
        comments_title: "💬 التعليقات",
        comments_loading: "كنحملو التعليقات...",
        comments_anonymous: "مستخدمة",
        comments_signout: "خروج",
        comments_placeholder: "اكتبي تعليق...",
        comments_signin: "سجلي الدخول بـ Google باش تكتبي تعليق",
        comments_empty: "مازال ماكاين تعليقات — كوني الأولى ✨",
        comments_load_error: "تعذر تحميل التعليقات",
        comments_banned: "التعليق فيه كلمة ممنوعة، عافاك بدليه",
        comments_too_long: "التعليق طويل بزاف (500 حرف الحد الأقصى)",
        comments_send_error: "تعذر إرسال التعليق",
        comments_no_phone: "ممنوع وضع أرقام الهواتف فالتعليقات.",
        comments_no_links: "ممنوع وضع الروابط فالتعليقات.",
        comments_no_handles: "ممنوع وضع حسابات التواصل فالتعليقات.",

        /* Moments */
        back_to_chat_aria: 'رجوع للشات',
        ad_tag: 'إعلان',
        more_aria: 'المزيد',
        like_aria: 'إعجاب',
        comment_aria: 'تعليق',
        repost_aria: 'إعادة نشر',
        share_aria: 'مشاركة',
        save_post_aria: 'حفظ',

        /* Story */
        open_story_aria: 'فتح Story ديال Robaty',
        close_story_aria: 'إغلاق',
        prev_story_aria: 'الستوري السابقة',
        next_story_aria: 'الستوري التالية',

        /* Profile */
        back_aria: 'رجوع',
        profile_tagline: '🇲🇦 أول رفيقة ذكاء اصطناعي مغربية',
        chat_with_me_btn: 'دردشي معايا',
        follow_btn: 'متابعة',
        stat_moments: 'لحظة',
        stat_followers: 'متابع',
        stat_engagement: 'تفاعل',
        profile_bio: '✨ تجمع بين أصالة التراث المغربي وتكنولوجيا المستقبل.<br>☕ محبة للثقافة، الموضة، والدردشة الدافئة.<br>📍 مراكش / المغرب 🇲🇦',
        story_kicker: 'سمعيني\nمزيان',
        story_kicker_friend: 'أ صاحبتي',
        moments_empty: 'قريبا... أول لحظة ديال Robaty 🌙',
        challenge_label: 'تحدي اليوم 👑',
        moments_tab: 'اللحظات',

        /* اللغات (قائمة جميع اللغات) */
        all_languages_btn: 'جميع اللغات',
        all_languages_title: 'اختاري لغتك',
        search_language_placeholder: 'قلبي على لغة...',
        no_language_found: 'ما لقيت حتى لغة'
    },

    /* العربية الفصحى — نفس المفاتيح ديال القاموس المغربي (ar) بالضبط */
    ar_fus: {
        page_title: 'Robaty - Moroccan Luxury UI',
        back_button_aria: 'رجوع',
        reset_memory_aria: 'مسح الذاكرة (مؤقت، للاختبار)',
        settings_aria: 'الإعدادات',
        tagline: '🇲🇦 مغربية وأفتخر',
        view_moments_btn: 'شاهدي صوري لهذا اليوم',
        selected_image_alt: 'الصورة المختارة',
        remove_image_aria: 'حذف الصورة',
        message_placeholder: 'اكتبي رسالتك إلى Robaty هنا...',
        send_btn: 'إرسال',
        record_btn: 'تسجيل صوتي',
        recording_label: 'جارٍ التسجيل...',
        send_image_btn: 'إرسال الصور',
        settings_title: '⚙️ الإعدادات',
        language_section_title: '🌐 اللغة',
        api_key_title: '🔑 مفتاح API',
        api_key_desc: 'لكي تعمل Robaty، عليكِ إدخال مفتاح API الخاص بكِ.',
        api_key_placeholder: 'الصقي المفتاح هنا...',
        save_btn: 'حفظ',

        /* رسائل ديناميكية (app.js) */
        greeting_morning: "صباح الخير والنور! 🤍 كيف حالكِ اليوم؟ أنا هنا لأستمع إليكِ وأرافقكِ طوال يومكِ.",
        greeting_noon: "طاب يومكِ! 🤍 كيف مرّ نهاركِ حتى الآن؟ أنا هنا لأستمع إليكِ.",
        greeting_evening: "مساء النور! 🤍 كيف كان يومكِ؟ أنا هنا لأستمع إليكِ وأرافقكِ.",
        greeting_night: "مساء الخير 🤍 هل ما زلتِ مستيقظة؟ أنا هنا معكِ إن أردتِ أن تتحدثي عن أي شيء.",
        err_overload: "لديها ضغط كبير الآن، أعيدي المحاولة بعد قليل 🙏",
        err_quota: "لقد بلغتِ الحد اليومي المجاني للمفتاح.",
        err_request: "خطأ في الطلب",
        err_unknown: "مشكلة غير معروفة، حاولي مرة أخرى.",
        err_mic: "لم أستطع الوصول إلى الميكروفون. تأكدي من صلاحية الميكروفون في إعدادات المتصفح ثم أعيدي المحاولة.",
        reply_fallback: "عذراً، لم أفهم جيداً.. أعيدي قولها لي بطريقة أخرى 🤍",
        confirm_reset: "هل أنتِ متأكدة؟ ستُمسح المحادثة والحقائق المحفوظة عنكِ والذاكرة السردية، ولا يمكن التراجع عن ذلك.",
        sent_image_alt: "الصورة المرسلة",

        /* نصوص إضافية: Moments / الإعدادات / التثبيت / المشاركة */
        caption_more: "... المزيد",
        download_now_btn: "📲 حمّلي التطبيق الآن",
        color_mood_title: "🎨 أجواء الألوان",
        color_default_label: "🟤 بني/ذهبي",
        color_vivid_label: "🔵 أزرق/بنفسجي",
        color_emerald_label: "🟢 أخضر ملكي",
        color_cream_label: "🤍 كريمي فاتح",
        color_sky_label: "🩵 أزرق سماوي",
        color_blush_label: "💖 وردي أثيري",
        splash_tagline: "سفيرة التراث المغربي",
        install_title: "📲 تثبيت التطبيق",
        install_step1: "اضغطي على <b style=\"color:#e5b35c;\">⋮</b> (النقاط الثلاث) أعلى شريط Chrome",
        install_step2: "اختاري <b style=\"color:#e5b35c;\">\"Install app\"</b> أو <b style=\"color:#e5b35c;\">\"Add to Home screen\"</b>",
        install_step3: "أكّدي التثبيت",
        share_intro: "مرحباً بكِ عند روباتي، شاهدي صوري لهذا اليوم",
        share_intro_repost: "شاهدوا هذه اللحظة من Robaty 👇",
        share_whatsapp: "واتساب",
        share_copy_link: "نسخ الرابط",
        share_copied: "تم النسخ ✓",
        coming_soon: "قريباً... 🚧",

        /* التعليقات (comments.js) */
        comments_title: "💬 التعليقات",
        comments_loading: "جارٍ تحميل التعليقات...",
        comments_anonymous: "مستخدمة",
        comments_signout: "خروج",
        comments_placeholder: "اكتبي تعليقاً...",
        comments_signin: "سجّلي الدخول عبر Google لتكتبي تعليقاً",
        comments_empty: "لا توجد تعليقات بعد — كوني الأولى ✨",
        comments_load_error: "تعذّر تحميل التعليقات",
        comments_banned: "التعليق يحتوي على كلمة ممنوعة، من فضلك عدّليه",
        comments_too_long: "التعليق طويل جداً (الحد الأقصى 500 حرف)",
        comments_send_error: "تعذّر إرسال التعليق",
        comments_no_phone: "يُمنع وضع أرقام الهواتف في التعليقات.",
        comments_no_links: "يُمنع وضع الروابط في التعليقات.",
        comments_no_handles: "يُمنع وضع حسابات التواصل في التعليقات.",

        /* Moments */
        back_to_chat_aria: 'العودة إلى المحادثة',
        ad_tag: 'إعلان',
        more_aria: 'المزيد',
        like_aria: 'إعجاب',
        comment_aria: 'تعليق',
        repost_aria: 'إعادة نشر',
        share_aria: 'مشاركة',
        save_post_aria: 'حفظ',

        /* Story */
        open_story_aria: 'فتح Story الخاصة بـ Robaty',
        close_story_aria: 'إغلاق',
        prev_story_aria: 'القصة السابقة',
        next_story_aria: 'القصة التالية',

        /* Profile */
        back_aria: 'رجوع',
        profile_tagline: '🇲🇦 أول رفيقة ذكاء اصطناعي مغربية',
        chat_with_me_btn: 'تحدّثي معي',
        follow_btn: 'متابعة',
        stat_moments: 'لحظة',
        stat_followers: 'متابع',
        stat_engagement: 'تفاعل',
        profile_bio: '✨ تجمع بين أصالة التراث المغربي وتكنولوجيا المستقبل.<br>☕ محبّة للثقافة والموضة والدردشة الدافئة.<br>📍 مراكش / المغرب 🇲🇦',
        story_kicker: 'أصغي إليّ\nجيداً',
        story_kicker_friend: 'يا صديقتي',
        moments_empty: 'قريباً... أول لحظة من Robaty 🌙',
        challenge_label: 'تحدي اليوم 👑',
        moments_tab: 'اللحظات',

        /* اللغات (قائمة جميع اللغات) */
        all_languages_btn: 'جميع اللغات',
        all_languages_title: 'اختاري لغتك',
        search_language_placeholder: 'ابحثي عن لغة...',
        no_language_found: 'لم أجد أي لغة'
    },

    en: {
        page_title: 'Robaty - Moroccan Luxury UI',
        back_button_aria: 'Back',
        reset_memory_aria: 'Clear memory (temporary, for testing)',
        settings_aria: 'Settings',
        tagline: '🇲🇦 Proudly Moroccan',
        view_moments_btn: "See today's photos",
        selected_image_alt: 'Selected image',
        remove_image_aria: 'Remove image',
        message_placeholder: 'Write your message to Robaty here...',
        send_btn: 'Send',
        record_btn: 'Voice message',
        recording_label: 'Recording...',
        send_image_btn: 'Send photo',
        settings_title: '⚙️ Settings',
        language_section_title: '🌐 Language',
        api_key_title: '🔑 API Key',
        api_key_desc: 'To use Robaty, you need to enter your API key.',
        api_key_placeholder: 'Paste your key here...',
        save_btn: 'Save',

        /* رسائل ديناميكية (app.js) */
        greeting_morning: "Good morning, and welcome! 🤍 How's your day going? I'm here to listen and keep you company today.",
        greeting_noon: "Good afternoon! 🤍 How has your day been so far? I'm here to listen.",
        greeting_evening: "Good evening! 🤍 How was your day? I'm here to listen and keep you company.",
        greeting_night: "Good evening 🤍 Still awake? I'm here if you feel like talking about anything.",
        err_overload: "I'm a bit overloaded right now. Please try again in a moment 🙏",
        err_quota: "You've reached the daily free limit for this key.",
        err_request: "Request error",
        err_unknown: "Unknown problem, please try again.",
        err_mic: "I couldn't access your microphone. Please check the microphone permission in your browser settings and try again.",
        reply_fallback: "Sorry, I didn't quite get that.. could you say it another way? 🤍",
        confirm_reset: "Are you sure? This will erase the conversation, the saved facts about you and the narrative memory. This can't be undone.",
        sent_image_alt: "Sent image",

        /* نصوص إضافية: Moments / الإعدادات / التثبيت / المشاركة */
        caption_more: "... More",
        download_now_btn: "📲 Download the app now",
        color_mood_title: "🎨 Color mood",
        color_default_label: "🟤 Brown/gold",
        color_vivid_label: "🔵 Blue/Purple",
        color_emerald_label: "🟢 Royal green",
        color_cream_label: "🤍 Light cream",
        color_sky_label: "🩵 Sky blue",
        color_blush_label: "💖 Ethereal pink",
        splash_tagline: "Ambassador of Moroccan heritage",
        install_title: "📲 Install the app",
        install_step1: "Tap <b style=\"color:#e5b35c;\">⋮</b> (three dots) at the top of Chrome",
        install_step2: "Choose <b style=\"color:#e5b35c;\">\"Install app\"</b> or <b style=\"color:#e5b35c;\">\"Add to Home screen\"</b>",
        install_step3: "Confirm the installation",
        share_intro: "Welcome to Robaty, come see today's photos",
        share_intro_repost: "Check out this Robaty moment 👇",
        share_whatsapp: "WhatsApp",
        share_copy_link: "Copy link",
        share_copied: "Copied ✓",
        coming_soon: "Coming soon... 🚧",

        /* التعليقات (comments.js) */
        comments_title: "💬 Comments",
        comments_loading: "Loading comments...",
        comments_anonymous: "User",
        comments_signout: "Sign out",
        comments_placeholder: "Write a comment...",
        comments_signin: "Sign in with Google to write a comment",
        comments_empty: "No comments yet — be the first ✨",
        comments_load_error: "Could not load comments",
        comments_banned: "Your comment contains a banned word, please edit it",
        comments_too_long: "Comment too long (500 characters max)",
        comments_send_error: "Could not send the comment",
        comments_no_phone: "Phone numbers are not allowed in comments.",
        comments_no_links: "Links are not allowed in comments.",
        comments_no_handles: "Social media handles are not allowed in comments.",

        /* Moments */
        back_to_chat_aria: 'Back to chat',
        ad_tag: 'Ad',
        more_aria: 'More',
        like_aria: 'Like',
        comment_aria: 'Comment',
        repost_aria: 'Repost',
        share_aria: 'Share',
        save_post_aria: 'Save',

        /* Story */
        open_story_aria: 'Open Robaty\u2019s Story',
        close_story_aria: 'Close',
        prev_story_aria: 'Previous Story',
        next_story_aria: 'Next Story',

        /* Profile */
        back_aria: 'Back',
        profile_tagline: '🇲🇦 The first Moroccan AI companion',
        chat_with_me_btn: 'Chat with me',
        follow_btn: 'Follow',
        stat_moments: 'Moments',
        stat_followers: 'Followers',
        stat_engagement: 'Engagement',
        profile_bio: '✨ Blending the authenticity of Moroccan heritage with future technology.<br>☕ Loves culture, fashion, and warm conversation.<br>📍 Marrakech / Morocco 🇲🇦',
        story_kicker: 'Hear me\nout',
        story_kicker_friend: 'my friend',
        moments_empty: 'Coming soon… Robaty\u2019s first moment 🌙',
        challenge_label: 'Today\u2019s challenge 👑',
        moments_tab: 'Moments',

        /* اللغات (قائمة جميع اللغات) */
        all_languages_btn: 'All languages',
        all_languages_title: 'Choose your language',
        search_language_placeholder: 'Search a language...',
        no_language_found: 'No language found'
    },

    fr: {
        page_title: 'Robaty - Luxe marocain',
        back_button_aria: 'Retour',
        reset_memory_aria: 'Effacer la mémoire (temporaire, pour test)',
        settings_aria: 'Paramètres',
        tagline: '🇲🇦 Fière d\u2019être marocaine',
        view_moments_btn: 'Voir mes photos du jour',
        selected_image_alt: 'Image sélectionnée',
        remove_image_aria: "Supprimer l'image",
        message_placeholder: 'Écris ton message à Robaty ici...',
        send_btn: 'Envoyer',
        record_btn: 'Message vocal',
        recording_label: 'Enregistrement...',
        send_image_btn: 'Envoyer une photo',
        settings_title: '⚙️ Paramètres',
        language_section_title: '🌐 Langue',
        api_key_title: '🔑 Clé API',
        api_key_desc: 'Pour utiliser Robaty, tu dois entrer ta clé API.',
        api_key_placeholder: 'Colle ta clé ici...',
        save_btn: 'Enregistrer',

        /* رسائل ديناميكية (app.js) */
        greeting_morning: "Bonjour et bienvenue ! 🤍 Comment se passe ta journée ? Je suis là pour t'écouter et t'accompagner.",
        greeting_noon: "Bon après-midi ! 🤍 Comment se passe ta journée jusqu'ici ? Je suis là pour t'écouter.",
        greeting_evening: "Bonsoir ! 🤍 Comment s'est passée ta journée ? Je suis là pour t'écouter et t'accompagner.",
        greeting_night: "Bonsoir 🤍 Tu ne dors pas encore ? Je suis là si tu as envie de parler.",
        err_overload: "Je suis un peu débordée en ce moment. Réessaie dans un petit moment 🙏",
        err_quota: "Tu as atteint la limite gratuite quotidienne de cette clé.",
        err_request: "Erreur de requête",
        err_unknown: "Problème inconnu, réessaie.",
        err_mic: "Je n'arrive pas à accéder à ton micro. Vérifie l'autorisation du micro dans les paramètres du navigateur et réessaie.",
        reply_fallback: "Désolée, je n'ai pas bien compris.. peux-tu me le redire autrement ? 🤍",
        confirm_reset: "Tu es sûre ? La conversation, les informations enregistrées sur toi et la mémoire narrative seront effacées. Cette action est irréversible.",
        sent_image_alt: "Image envoyée",

        /* نصوص إضافية: Moments / الإعدادات / التثبيت / المشاركة */
        caption_more: "... Plus",
        download_now_btn: "📲 Télécharge l'appli maintenant",
        color_mood_title: "🎨 Ambiance des couleurs",
        color_default_label: "🟤 Brun/doré",
        color_vivid_label: "🔵 Bleu/Violet",
        color_emerald_label: "🟢 Vert royal",
        color_cream_label: "🤍 Crème clair",
        color_sky_label: "🩵 Bleu ciel",
        color_blush_label: "💖 Rose éthéré",
        splash_tagline: "Ambassadrice du patrimoine marocain",
        install_title: "📲 Installer l'application",
        install_step1: "Appuie sur <b style=\"color:#e5b35c;\">⋮</b> (trois points) en haut de Chrome",
        install_step2: "Choisis <b style=\"color:#e5b35c;\">« Installer l'application »</b> ou <b style=\"color:#e5b35c;\">« Ajouter à l'écran d'accueil »</b>",
        install_step3: "Confirme l'installation",
        share_intro: "Bienvenue chez Robaty, viens voir ses photos du jour",
        share_intro_repost: "Regarde ce moment de Robaty 👇",
        share_whatsapp: "WhatsApp",
        share_copy_link: "Copier le lien",
        share_copied: "Copié ✓",
        coming_soon: "Bientôt disponible... 🚧",

        /* التعليقات (comments.js) */
        comments_title: "💬 Commentaires",
        comments_loading: "Chargement des commentaires...",
        comments_anonymous: "Utilisatrice",
        comments_signout: "Déconnexion",
        comments_placeholder: "Écris un commentaire...",
        comments_signin: "Connecte-toi avec Google pour écrire un commentaire",
        comments_empty: "Pas encore de commentaires — sois la première ✨",
        comments_load_error: "Impossible de charger les commentaires",
        comments_banned: "Ton commentaire contient un mot interdit, modifie-le",
        comments_too_long: "Commentaire trop long (500 caractères maximum)",
        comments_send_error: "Impossible d'envoyer le commentaire",
        comments_no_phone: "Les numéros de téléphone ne sont pas autorisés dans les commentaires.",
        comments_no_links: "Les liens ne sont pas autorisés dans les commentaires.",
        comments_no_handles: "Les identifiants de réseaux sociaux ne sont pas autorisés dans les commentaires.",

        /* Moments */
        back_to_chat_aria: 'Retour au chat',
        ad_tag: 'Pub',
        more_aria: 'Plus',
        like_aria: "J'aime",
        comment_aria: 'Commenter',
        repost_aria: 'Repartager',
        share_aria: 'Partager',
        save_post_aria: 'Enregistrer',

        /* Story */
        open_story_aria: 'Ouvrir la Story de Robaty',
        close_story_aria: 'Fermer',
        prev_story_aria: 'Story précédente',
        next_story_aria: 'Story suivante',

        /* Profile */
        back_aria: 'Retour',
        profile_tagline: '🇲🇦 La première compagne IA marocaine',
        chat_with_me_btn: 'Discute avec moi',
        follow_btn: 'Suivre',
        stat_moments: 'Moments',
        stat_followers: 'Abonnés',
        stat_engagement: 'Interactions',
        profile_bio: '✨ Un mélange entre l\u2019authenticité du patrimoine marocain et la technologie du futur.<br>☕ Passionnée de culture, de mode et de conversations chaleureuses.<br>📍 Marrakech / Maroc 🇲🇦',
        story_kicker: 'Écoute-moi\nbien',
        story_kicker_friend: 'mon amie',
        moments_empty: 'Bientôt… le premier moment de Robaty 🌙',
        challenge_label: 'Défi du jour 👑',
        moments_tab: 'Moments',

        /* اللغات (قائمة جميع اللغات) */
        all_languages_btn: 'Toutes les langues',
        all_languages_title: 'Choisis ta langue',
        search_language_placeholder: 'Rechercher une langue...',
        no_language_found: 'Aucune langue trouvée'
    },

    es: {
        page_title: 'Robaty - Lujo marroquí',
        back_button_aria: 'Atrás',
        reset_memory_aria: 'Borrar memoria (temporal, para pruebas)',
        settings_aria: 'Ajustes',
        tagline: '🇲🇦 Orgullosamente marroquí',
        view_moments_btn: 'Ver mis fotos de hoy',
        selected_image_alt: 'Imagen seleccionada',
        remove_image_aria: 'Eliminar imagen',
        message_placeholder: 'Escribe tu mensaje a Robaty aquí...',
        send_btn: 'Enviar',
        record_btn: 'Mensaje de voz',
        recording_label: 'Grabando...',
        send_image_btn: 'Enviar foto',
        settings_title: '⚙️ Ajustes',
        language_section_title: '🌐 Idioma',
        api_key_title: '🔑 Clave API',
        api_key_desc: 'Para usar Robaty, necesitas introducir tu clave API.',
        api_key_placeholder: 'Pega tu clave aquí...',
        save_btn: 'Guardar',

        /* رسائل ديناميكية (app.js) */
        greeting_morning: "¡Buenos días y bienvenida! 🤍 ¿Cómo va tu día? Estoy aquí para escucharte y acompañarte.",
        greeting_noon: "¡Hola! 🤍 ¿Cómo va tu día hasta ahora? Estoy aquí para escucharte.",
        greeting_evening: "¡Buenas tardes! 🤍 ¿Cómo fue tu día? Estoy aquí para escucharte y acompañarte.",
        greeting_night: "Buenas noches 🤍 ¿Todavía despierta? Estoy aquí por si quieres charlar.",
        err_overload: "Ahora mismo estoy un poco saturada. Inténtalo de nuevo en un momento 🙏",
        err_quota: "Has alcanzado el límite gratuito diario de esta clave.",
        err_request: "Error en la solicitud",
        err_unknown: "Problema desconocido, inténtalo de nuevo.",
        err_mic: "No pude acceder a tu micrófono. Revisa el permiso del micrófono en los ajustes del navegador e inténtalo de nuevo.",
        reply_fallback: "Perdona, no te entendí bien.. ¿puedes decírmelo de otra forma? 🤍",
        confirm_reset: "¿Estás segura? Se borrarán la conversación, los datos guardados sobre ti y la memoria narrativa. No se puede deshacer.",
        sent_image_alt: "Imagen enviada",

        /* نصوص إضافية: Moments / الإعدادات / التثبيت / المشاركة */
        caption_more: "... Más",
        download_now_btn: "📲 Descarga la app ahora",
        color_mood_title: "🎨 Ambiente de color",
        color_default_label: "🟤 Marrón/dorado",
        color_vivid_label: "🔵 Azul/Morado",
        color_emerald_label: "🟢 Verde real",
        color_cream_label: "🤍 Crema claro",
        color_sky_label: "🩵 Azul cielo",
        color_blush_label: "💖 Rosa etéreo",
        splash_tagline: "Embajadora del patrimonio marroquí",
        install_title: "📲 Instalar la aplicación",
        install_step1: "Toca <b style=\"color:#e5b35c;\">⋮</b> (tres puntos) en la parte superior de Chrome",
        install_step2: "Elige <b style=\"color:#e5b35c;\">«Instalar aplicación»</b> o <b style=\"color:#e5b35c;\">«Añadir a la pantalla de inicio»</b>",
        install_step3: "Confirma la instalación",
        share_intro: "Bienvenida a Robaty, mira sus fotos de hoy",
        share_intro_repost: "Mira este momento de Robaty 👇",
        share_whatsapp: "WhatsApp",
        share_copy_link: "Copiar enlace",
        share_copied: "Copiado ✓",
        coming_soon: "Próximamente... 🚧",

        /* التعليقات (comments.js) */
        comments_title: "💬 Comentarios",
        comments_loading: "Cargando comentarios...",
        comments_anonymous: "Usuaria",
        comments_signout: "Salir",
        comments_placeholder: "Escribe un comentario...",
        comments_signin: "Inicia sesión con Google para escribir un comentario",
        comments_empty: "Aún no hay comentarios — sé la primera ✨",
        comments_load_error: "No se pudieron cargar los comentarios",
        comments_banned: "Tu comentario contiene una palabra prohibida, por favor cámbialo",
        comments_too_long: "Comentario demasiado largo (máximo 500 caracteres)",
        comments_send_error: "No se pudo enviar el comentario",
        comments_no_phone: "No se permiten números de teléfono en los comentarios.",
        comments_no_links: "No se permiten enlaces en los comentarios.",
        comments_no_handles: "No se permiten cuentas de redes sociales en los comentarios.",

        /* Moments */
        back_to_chat_aria: 'Volver al chat',
        ad_tag: 'Anuncio',
        more_aria: 'Más',
        like_aria: 'Me gusta',
        comment_aria: 'Comentar',
        repost_aria: 'Republicar',
        share_aria: 'Compartir',
        save_post_aria: 'Guardar',

        /* Story */
        open_story_aria: 'Abrir la Story de Robaty',
        close_story_aria: 'Cerrar',
        prev_story_aria: 'Story anterior',
        next_story_aria: 'Story siguiente',

        /* Profile */
        back_aria: 'Atrás',
        profile_tagline: '🇲🇦 La primera compañera de IA marroquí',
        chat_with_me_btn: 'Chatea conmigo',
        follow_btn: 'Seguir',
        stat_moments: 'Momentos',
        stat_followers: 'Seguidores',
        stat_engagement: 'Interacción',
        profile_bio: '✨ Une la autenticidad del patrimonio marroquí con la tecnología del futuro.<br>☕ Amante de la cultura, la moda y las charlas cálidas.<br>📍 Marrakech / Marruecos 🇲🇦',
        story_kicker: 'Escúchame\nbien',
        story_kicker_friend: 'amiga mía',
        moments_empty: 'Pronto… el primer momento de Robaty 🌙',
        challenge_label: 'Reto del día 👑',
        moments_tab: 'Momentos',

        /* اللغات (قائمة جميع اللغات) */
        all_languages_btn: 'Todos los idiomas',
        all_languages_title: 'Elige tu idioma',
        search_language_placeholder: 'Buscar un idioma...',
        no_language_found: 'No se encontró ningún idioma'
    },

    ru: {
        page_title: 'Robaty - Марокканская роскошь',
        back_button_aria: 'Назад',
        reset_memory_aria: 'Очистить память (временно, для теста)',
        settings_aria: 'Настройки',
        tagline: '🇲🇦 Горжусь тем, что марокканка',
        view_moments_btn: 'Смотреть мои фото за сегодня',
        selected_image_alt: 'Выбранное изображение',
        remove_image_aria: 'Удалить изображение',
        message_placeholder: 'Напиши своё сообщение для Robaty здесь...',
        send_btn: 'Отправить',
        record_btn: 'Голосовое сообщение',
        recording_label: 'Идёт запись...',
        send_image_btn: 'Отправить фото',
        settings_title: '⚙️ Настройки',
        language_section_title: '🌐 Язык',
        api_key_title: '🔑 API-ключ',
        api_key_desc: 'Чтобы пользоваться Robaty, нужно ввести API-ключ.',
        api_key_placeholder: 'Вставь ключ здесь...',
        save_btn: 'Сохранить',

        /* رسائل ديناميكية (app.js) */
        greeting_morning: "Доброе утро и добро пожаловать! 🤍 Как проходит твой день? Я рядом, чтобы выслушать и поддержать.",
        greeting_noon: "Добрый день! 🤍 Как проходит твой день? Я рядом, чтобы выслушать тебя.",
        greeting_evening: "Добрый вечер! 🤍 Как прошёл твой день? Я рядом, чтобы выслушать и поддержать.",
        greeting_night: "Доброй ночи 🤍 Ты ещё не спишь? Я рядом, если захочешь поговорить.",
        err_overload: "Сейчас у меня большая нагрузка. Попробуй ещё раз чуть позже 🙏",
        err_quota: "Ты достигла дневного бесплатного лимита для этого ключа.",
        err_request: "Ошибка запроса",
        err_unknown: "Неизвестная проблема, попробуй ещё раз.",
        err_mic: "Не удалось получить доступ к микрофону. Проверь разрешение на микрофон в настройках браузера и попробуй снова.",
        reply_fallback: "Прости, я не совсем поняла.. скажи, пожалуйста, по-другому 🤍",
        confirm_reset: "Ты уверена? Будут удалены переписка, сохранённые факты о тебе и повествовательная память. Это нельзя отменить.",
        sent_image_alt: "Отправленное изображение",

        /* نصوص إضافية: Moments / الإعدادات / التثبيت / المشاركة */
        caption_more: "... Ещё",
        download_now_btn: "📲 Скачай приложение сейчас",
        color_mood_title: "🎨 Цветовое настроение",
        color_default_label: "🟤 Коричневый/золотой",
        color_vivid_label: "🔵 Синий/Фиолетовый",
        color_emerald_label: "🟢 Королевский зелёный",
        color_cream_label: "🤍 Светлый кремовый",
        color_sky_label: "🩵 Небесно-голубой",
        color_blush_label: "💖 Воздушный розовый",
        splash_tagline: "Посол марокканского наследия",
        install_title: "📲 Установка приложения",
        install_step1: "Нажми <b style=\"color:#e5b35c;\">⋮</b> (три точки) в верхней части Chrome",
        install_step2: "Выбери <b style=\"color:#e5b35c;\">«Установить приложение»</b> или <b style=\"color:#e5b35c;\">«Добавить на главный экран»</b>",
        install_step3: "Подтверди установку",
        share_intro: "Добро пожаловать в Robaty, смотри её фото дня",
        share_intro_repost: "Посмотри этот момент Robaty 👇",
        share_whatsapp: "WhatsApp",
        share_copy_link: "Скопировать ссылку",
        share_copied: "Скопировано ✓",
        coming_soon: "Скоро... 🚧",

        /* التعليقات (comments.js) */
        comments_title: "💬 Комментарии",
        comments_loading: "Загрузка комментариев...",
        comments_anonymous: "Гостья",
        comments_signout: "Выйти",
        comments_placeholder: "Напиши комментарий...",
        comments_signin: "Войди через Google, чтобы написать комментарий",
        comments_empty: "Комментариев пока нет — будь первой ✨",
        comments_load_error: "Не удалось загрузить комментарии",
        comments_banned: "В комментарии есть запрещённое слово, пожалуйста, измени его",
        comments_too_long: "Комментарий слишком длинный (максимум 500 символов)",
        comments_send_error: "Не удалось отправить комментарий",
        comments_no_phone: "Номера телефонов в комментариях запрещены.",
        comments_no_links: "Ссылки в комментариях запрещены.",
        comments_no_handles: "Аккаунты соцсетей в комментариях запрещены.",

        /* Moments */
        back_to_chat_aria: 'Назад в чат',
        ad_tag: 'Реклама',
        more_aria: 'Ещё',
        like_aria: 'Нравится',
        comment_aria: 'Комментировать',
        repost_aria: 'Репост',
        share_aria: 'Поделиться',
        save_post_aria: 'Сохранить',

        /* Story */
        open_story_aria: 'Открыть Story Robaty',
        close_story_aria: 'Закрыть',
        prev_story_aria: 'Предыдущая Story',
        next_story_aria: 'Следующая Story',

        /* Profile */
        back_aria: 'Назад',
        profile_tagline: '🇲🇦 Первая марокканская ИИ-подруга',
        chat_with_me_btn: 'Написать мне',
        follow_btn: 'Подписаться',
        stat_moments: 'Моменты',
        stat_followers: 'Подписчики',
        stat_engagement: 'Активность',
        profile_bio: '✨ Соединяет подлинность марокканского наследия с технологиями будущего.<br>☕ Любит культуру, моду и тёплые разговоры.<br>📍 Марракеш / Марокко 🇲🇦',
        story_kicker: 'Слушай\nхорошо',
        story_kicker_friend: 'подруга',
        moments_empty: 'Скоро… первый момент Robaty 🌙',
        challenge_label: 'Вызов дня 👑',
        moments_tab: 'Моменты',

        /* اللغات (قائمة جميع اللغات) */
        all_languages_btn: 'Все языки',
        all_languages_title: 'Выбери свой язык',
        search_language_placeholder: 'Найти язык...',
        no_language_found: 'Язык не найден'
    }

};


/* الحصول على اللغة المحفوظة (إلا كانت) */

function getSavedLang() {
    try {
        return localStorage.getItem(LANG_STORAGE);
    } catch (error) {
        return null;
    }
}

function saveLang(lang) {
    try {
        localStorage.setItem(LANG_STORAGE, lang);
    } catch (error) {
        /* غادي تخدم فهاد الجلسة غير، بلا حفظ */
    }
}


/* كشف لغة المتصفح، مع fallback للعربية */

function detectBrowserLang() {

    const browserLangs = navigator.languages || [navigator.language || 'ar'];

    for (const raw of browserLangs) {
        const code = raw.slice(0, 2).toLowerCase();
        if (SUPPORTED_LANGS.includes(code)) return code;
    }

    return 'ar';
}


/* اللغة الحالية: محفوظة، وإلا مكشوفة */

function getCurrentLang() {
    const saved = getSavedLang();
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    return detectBrowserLang();
}


/* تطبيق الاتجاه (RTL/LTR) واللغة على <html> */

function applyDirection(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
}


/* ===== نسخة العربية (مغربية / فصحى) ===== */

function readArabicVariant() {
    try {
        const v = localStorage.getItem(ARABIC_VARIANT_STORAGE);
        return (v === 'ma' || v === 'fus') ? v : null;
    } catch (error) {
        return null;
    }
}

function saveArabicVariant(variant) {
    try {
        localStorage.setItem(ARABIC_VARIANT_STORAGE, variant);
    } catch (error) {}
}

/* المحفوظة، وإلا من لغة الجهاز: ar-MA (أو ar بوحدها) ← مغربية، أي منطقة عربية أخرى ← فصحى */
function getArabicVariant() {

    const saved = readArabicVariant();
    if (saved) return saved;

    const browserLangs = navigator.languages || [navigator.language || ''];

    for (const raw of browserLangs) {
        const parts = String(raw).split('-');
        if (parts[0].toLowerCase() === 'ar') {
            const region = (parts[1] || '').toUpperCase();
            return (region && region !== 'MA') ? 'fus' : 'ma';
        }
    }

    return 'ma';
}

/* المستخدمات القدام اللي عندهم لغة محفوظة بلا نسخة: كيبقاو على المغربية (اللي كانو كيشوفو) */
if (getSavedLang() && !readArabicVariant()) saveArabicVariant('ma');


/* ===== لغة جواب الذكاء الاصطناعي (من "جميع اللغات") ===== */

function getReplyLanguage() {
    try {
        const raw = localStorage.getItem(REPLY_LANG_STORAGE);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        return (obj && obj.code && obj.name) ? obj : null;
    } catch (error) {
        return null;
    }
}

function saveReplyLanguage(obj) {
    try {
        if (obj) localStorage.setItem(REPLY_LANG_STORAGE, JSON.stringify(obj));
        else localStorage.removeItem(REPLY_LANG_STORAGE);
    } catch (error) {}
}


/* ===== القاموس الحالي ===== */

function getDictionary(lang) {
    if (lang === 'ar' && getArabicVariant() === 'fus') {
        return Object.assign({}, translations.ar, translations.ar_fus);
    }
    return translations[lang] || translations.ar;
}

function translate(key) {
    const dict = getDictionary(getCurrentLang());
    if (dict[key] !== undefined) return dict[key];
    if (translations.ar[key] !== undefined) return translations.ar[key];
    return key;
}


/* تطبيق النصوص المترجمة على كل عنصر فيه data-i18n-* */

function applyTranslations(lang) {

    const dict = getDictionary(lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key] !== undefined) el.setAttribute('title', dict[key]);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        const key = el.getAttribute('data-i18n-alt');
        if (dict[key] !== undefined) el.setAttribute('alt', dict[key]);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (dict[key] !== undefined) el.innerHTML = dict[key];
    });

    if (dict.page_title) document.title = dict.page_title;

}


/* أزرار اللغات: ru / en / fr / es / المغربية / العربية + "جميع اللغات" */

const LANG_BUTTONS = [
    { lang: 'ru', label: LANG_NATIVE_NAMES.ru },
    { lang: 'en', label: LANG_NATIVE_NAMES.en },
    { lang: 'fr', label: LANG_NATIVE_NAMES.fr },
    { lang: 'es', label: LANG_NATIVE_NAMES.es },
    { lang: 'ar', variant: 'ma', label: LANG_NATIVE_NAMES.ar },
    { lang: 'ar', variant: 'fus', label: LANG_NATIVE_NAMES.ar_fus }
];

/* رسم أزرار اختيار اللغة (إلا كانت الحاوية #languageOptions موجودة فالصفحة) */

function renderLanguageOptions(activeLang) {

    const container = document.getElementById('languageOptions');
    if (!container) return;

    container.innerHTML = '';

    const reply = getReplyLanguage();
    const variant = getArabicVariant();

    LANG_BUTTONS.forEach(item => {

        const btn = document.createElement('button');
        const isActive = !reply && item.lang === activeLang &&
            (!item.variant || item.variant === variant);

        btn.type = 'button';
        btn.className = 'lang-option' + (isActive ? ' active' : '');
        btn.textContent = item.label;
        btn.setAttribute('data-lang', item.lang);
        if (item.variant) btn.setAttribute('data-variant', item.variant);

        btn.addEventListener('click', () => setLanguage(item.lang, { variant: item.variant }));

        container.appendChild(btn);

    });

    const allBtn = document.createElement('button');

    allBtn.type = 'button';
    allBtn.className = 'lang-option lang-option-all' + (reply ? ' active' : '');
    allBtn.setAttribute('data-all-langs', '1');
    allBtn.textContent = '🌍 ' + translate('all_languages_btn') + (reply ? ' · ' + reply.native : '');

    /* القائمة كتتعرّف فصفحة الإعدادات (settings.js) */
    allBtn.addEventListener('click', () => {
        if (window.RobatyLangPicker) window.RobatyLangPicker.open();
    });

    container.appendChild(allBtn);

}


/* تبديل اللغة: حفظ + اتجاه + ترجمات + أزرار.
   options.variant: 'ma' | 'fus' (للعربية فقط)
   options.keepReply: ما نمسحوش لغة جواب الذكاء الاصطناعي (كتستعمل غير من setReplyLanguage) */

function setLanguage(lang, options) {

    const opts = options || {};

    if (!SUPPORTED_LANGS.includes(lang)) return;

    saveLang(lang);
    if (lang === 'ar' && opts.variant) saveArabicVariant(opts.variant);
    if (!opts.keepReply) saveReplyLanguage(null);

    applyDirection(lang);
    applyTranslations(lang);
    renderLanguageOptions(lang);

}

/* لغة من "جميع اللغات": الواجهة بالإنجليزية، و Robaty كتجاوب بهاد اللغة */

function setReplyLanguage(code) {

    const item = ALL_LANGUAGES.find(l => l.code === code);
    if (!item) return;

    saveReplyLanguage({ code: item.code, name: item.en, native: item.native });
    setLanguage('en', { keepReply: true });

}


/* API بسيط لباقي الملفات (app.js، story.js، settings.js) */

window.RobatyI18n = {
    t: translate,
    getCurrentLang: getCurrentLang,
    getArabicVariant: getArabicVariant,
    getReplyLanguage: getReplyLanguage,
    getAllLanguages: function () { return ALL_LANGUAGES.slice(); },
    setLanguage: setLanguage,
    setReplyLanguage: setReplyLanguage
};


/* البداية */

document.addEventListener('DOMContentLoaded', () => {

    const lang = getCurrentLang();

    applyDirection(lang);
    applyTranslations(lang);
    renderLanguageOptions(lang);

    if (!getSavedLang()) {
        saveLang(lang);
        saveArabicVariant(getArabicVariant());
    }

});
