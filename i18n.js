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

/* كاش ترجمة الواجهة بالذكاء الاصطناعي (لكل لغة) */
const UI_TRANSLATION_PREFIX = 'robaty_ui_tr_';

/* TODO قبل الإطلاق: مفتاح Gemini المؤقت كيتقرا من نفس المكان ديال app.js (robaty_gemini_key).
   ملي ننقلو الاتصال للـ Worker، نبدلو غير دالة requestTranslationChunk هنا و fetch فـ app.js. */
const TRANSLATION_KEY_STORAGE = 'robaty_gemini_key';
const TRANSLATION_MODEL = 'gemini-3.1-flash-lite';

/* قائمة "جميع اللغات" (اسم اللغة بحروفها + بالإنجليزية للبحث) */
/* الأمازيغية: دايما أول عنصر فالقائمة. label = الاسم اللي كيبان فالقائمة، و en = اسم اللغة اللي كيمشي للذكاء الاصطناعي */
const AMAZIGH_LANGUAGE = { code: 'tzm', native: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', en: 'Tamazight (Amazigh, Tifinagh script)', label: 'الأمازيغية', flag: '🇲🇦' };

/* اللهجات العربية: الواجهة كتبقى بالفصحى، و Robaty كتجاوب بلهجة البلد من أول رد.
   الحقل ai هو التعليمة اللي كتمشي للذكاء الاصطناعي (app.js). */
const ARABIC_DIALECTS = [
    { code: 'ar-EG', native: 'اللهجة المصرية', en: 'Egyptian Arabic', flag: '🇪🇬', dialect: true,
      ai: 'اللهجة المصرية (Egyptian Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-SA', native: 'اللهجة السعودية', en: 'Saudi Arabic', flag: '🇸🇦', dialect: true,
      ai: 'اللهجة السعودية الخليجية (Saudi/Gulf Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-AE', native: 'اللهجة الإماراتية', en: 'Emirati Arabic', flag: '🇦🇪', dialect: true,
      ai: 'اللهجة الإماراتية الخليجية (Emirati/Gulf Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-DZ', native: 'اللهجة الجزائرية', en: 'Algerian Arabic', flag: '🇩🇿', dialect: true,
      ai: 'اللهجة الجزائرية (Algerian Arabic / Darja): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-TN', native: 'اللهجة التونسية', en: 'Tunisian Arabic', flag: '🇹🇳', dialect: true,
      ai: 'اللهجة التونسية (Tunisian Arabic / Derja): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-LY', native: 'اللهجة الليبية', en: 'Libyan Arabic', flag: '🇱🇾', dialect: true,
      ai: 'اللهجة الليبية (Libyan Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-IQ', native: 'اللهجة العراقية', en: 'Iraqi Arabic', flag: '🇮🇶', dialect: true,
      ai: 'اللهجة العراقية (Iraqi Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-SY', native: 'اللهجة السورية', en: 'Syrian Arabic', flag: '🇸🇾', dialect: true,
      ai: 'اللهجة السورية الشامية (Syrian/Levantine Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-LB', native: 'اللهجة اللبنانية', en: 'Lebanese Arabic', flag: '🇱🇧', dialect: true,
      ai: 'اللهجة اللبنانية (Lebanese Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-JO', native: 'اللهجة الأردنية', en: 'Jordanian Arabic', flag: '🇯🇴', dialect: true,
      ai: 'اللهجة الأردنية (Jordanian Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-SD', native: 'اللهجة السودانية', en: 'Sudanese Arabic', flag: '🇸🇩', dialect: true,
      ai: 'اللهجة السودانية (Sudanese Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-YE', native: 'اللهجة اليمنية', en: 'Yemeni Arabic', flag: '🇾🇪', dialect: true,
      ai: 'اللهجة اليمنية (Yemeni Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' },
    { code: 'ar-PS', native: 'اللهجة الفلسطينية', en: 'Palestinian Arabic', flag: '🇵🇸', dialect: true,
      ai: 'اللهجة الفلسطينية الشامية (Palestinian/Levantine Arabic): تكلمي بلهجة بنات هاد البلد بشكل طبيعي وعفوي ومن أول رد، مكتوبة بالحروف العربية، بلا فصحى متكلفة' }
];

const ALL_LANGUAGES = [
    { code: 'af', native: 'Afrikaans', en: 'Afrikaans', flag: '🇿🇦' },
    { code: 'sq', native: 'Shqip', en: 'Albanian', flag: '🇦🇱' },
    { code: 'am', native: 'አማርኛ', en: 'Amharic', flag: '🇪🇹' },
    { code: 'hy', native: 'Հայերեն', en: 'Armenian', flag: '🇦🇲' },
    { code: 'az', native: 'Azərbaycanca', en: 'Azerbaijani', flag: '🇦🇿' },
    { code: 'eu', native: 'Euskara', en: 'Basque', flag: '🇪🇸' },
    { code: 'be', native: 'Беларуская', en: 'Belarusian', flag: '🇧🇾' },
    { code: 'bn', native: 'বাংলা', en: 'Bengali', flag: '🇧🇩' },
    { code: 'bs', native: 'Bosanski', en: 'Bosnian', flag: '🇧🇦' },
    { code: 'bg', native: 'Български', en: 'Bulgarian', flag: '🇧🇬' },
    { code: 'my', native: 'မြန်မာ', en: 'Burmese', flag: '🇲🇲' },
    { code: 'ca', native: 'Català', en: 'Catalan', flag: '🇪🇸' },
    { code: 'zh-CN', native: '中文（简体）', en: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'zh-TW', native: '中文（繁體）', en: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'hr', native: 'Hrvatski', en: 'Croatian', flag: '🇭🇷' },
    { code: 'cs', native: 'Čeština', en: 'Czech', flag: '🇨🇿' },
    { code: 'da', native: 'Dansk', en: 'Danish', flag: '🇩🇰' },
    { code: 'nl', native: 'Nederlands', en: 'Dutch', flag: '🇳🇱' },
    { code: 'et', native: 'Eesti', en: 'Estonian', flag: '🇪🇪' },
    { code: 'fil', native: 'Filipino', en: 'Filipino', flag: '🇵🇭' },
    { code: 'fi', native: 'Suomi', en: 'Finnish', flag: '🇫🇮' },
    { code: 'gl', native: 'Galego', en: 'Galician', flag: '🇪🇸' },
    { code: 'ka', native: 'ქართული', en: 'Georgian', flag: '🇬🇪' },
    { code: 'de', native: 'Deutsch', en: 'German', flag: '🇩🇪' },
    { code: 'el', native: 'Ελληνικά', en: 'Greek', flag: '🇬🇷' },
    { code: 'gu', native: 'ગુજરાતી', en: 'Gujarati', flag: '🇮🇳' },
    { code: 'ha', native: 'Hausa', en: 'Hausa', flag: '🇳🇬' },
    { code: 'he', native: 'עברית', en: 'Hebrew', flag: '🇮🇱', rtl: true },
    { code: 'hi', native: 'हिन्दी', en: 'Hindi', flag: '🇮🇳' },
    { code: 'hu', native: 'Magyar', en: 'Hungarian', flag: '🇭🇺' },
    { code: 'is', native: 'Íslenska', en: 'Icelandic', flag: '🇮🇸' },
    { code: 'id', native: 'Bahasa Indonesia', en: 'Indonesian', flag: '🇮🇩' },
    { code: 'it', native: 'Italiano', en: 'Italian', flag: '🇮🇹' },
    { code: 'ja', native: '日本語', en: 'Japanese', flag: '🇯🇵' },
    { code: 'kn', native: 'ಕನ್ನಡ', en: 'Kannada', flag: '🇮🇳' },
    { code: 'kk', native: 'Қазақша', en: 'Kazakh', flag: '🇰🇿' },
    { code: 'km', native: 'ខ្មែរ', en: 'Khmer', flag: '🇰🇭' },
    { code: 'ko', native: '한국어', en: 'Korean', flag: '🇰🇷' },
    { code: 'ku', native: 'Kurdî', en: 'Kurdish', flag: '🌍' },
    { code: 'ky', native: 'Кыргызча', en: 'Kyrgyz', flag: '🇰🇬' },
    { code: 'lo', native: 'ລາວ', en: 'Lao', flag: '🇱🇦' },
    { code: 'lv', native: 'Latviešu', en: 'Latvian', flag: '🇱🇻' },
    { code: 'lt', native: 'Lietuvių', en: 'Lithuanian', flag: '🇱🇹' },
    { code: 'mk', native: 'Македонски', en: 'Macedonian', flag: '🇲🇰' },
    { code: 'ms', native: 'Bahasa Melayu', en: 'Malay', flag: '🇲🇾' },
    { code: 'ml', native: 'മലയാളം', en: 'Malayalam', flag: '🇮🇳' },
    { code: 'mr', native: 'मराठी', en: 'Marathi', flag: '🇮🇳' },
    { code: 'mn', native: 'Монгол', en: 'Mongolian', flag: '🇲🇳' },
    { code: 'ne', native: 'नेपाली', en: 'Nepali', flag: '🇳🇵' },
    { code: 'no', native: 'Norsk', en: 'Norwegian', flag: '🇳🇴' },
    { code: 'ps', native: 'پښتو', en: 'Pashto', flag: '🇦🇫', rtl: true },
    { code: 'fa', native: 'فارسی', en: 'Persian', flag: '🇮🇷', rtl: true },
    { code: 'pl', native: 'Polski', en: 'Polish', flag: '🇵🇱' },
    { code: 'pt', native: 'Português', en: 'Portuguese', flag: '🇵🇹' },
    { code: 'pa', native: 'ਪੰਜਾਬੀ', en: 'Punjabi', flag: '🇮🇳' },
    { code: 'ro', native: 'Română', en: 'Romanian', flag: '🇷🇴' },
    { code: 'sr', native: 'Српски', en: 'Serbian', flag: '🇷🇸' },
    { code: 'si', native: 'සිංහල', en: 'Sinhala', flag: '🇱🇰' },
    { code: 'sk', native: 'Slovenčina', en: 'Slovak', flag: '🇸🇰' },
    { code: 'sl', native: 'Slovenščina', en: 'Slovenian', flag: '🇸🇮' },
    { code: 'so', native: 'Soomaali', en: 'Somali', flag: '🇸🇴' },
    { code: 'sw', native: 'Kiswahili', en: 'Swahili', flag: '🇰🇪' },
    { code: 'sv', native: 'Svenska', en: 'Swedish', flag: '🇸🇪' },
    { code: 'ta', native: 'தமிழ்', en: 'Tamil', flag: '🇮🇳' },
    { code: 'te', native: 'తెలుగు', en: 'Telugu', flag: '🇮🇳' },
    { code: 'th', native: 'ไทย', en: 'Thai', flag: '🇹🇭' },
    { code: 'tr', native: 'Türkçe', en: 'Turkish', flag: '🇹🇷' },
    { code: 'uk', native: 'Українська', en: 'Ukrainian', flag: '🇺🇦' },
    { code: 'ur', native: 'اردو', en: 'Urdu', flag: '🇵🇰', rtl: true },
    { code: 'uz', native: 'Oʻzbekcha', en: 'Uzbek', flag: '🇺🇿' },
    { code: 'vi', native: 'Tiếng Việt', en: 'Vietnamese', flag: '🇻🇳' },
    { code: 'cy', native: 'Cymraeg', en: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
    { code: 'yo', native: 'Yorùbá', en: 'Yoruba', flag: '🇳🇬' },
    { code: 'zu', native: 'isiZulu', en: 'Zulu', flag: '🇿🇦' }
];

/* القائمة الكاملة كما كتبان للمستخدمة: الأمازيغية، ثم اللهجات العربية، ثم باقي اللغات */
const LANGUAGE_LIST = [AMAZIGH_LANGUAGE].concat(ARABIC_DIALECTS, ALL_LANGUAGES);


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
        no_language_found: 'ما لقيت حتى لغة',

        /* صفحة الإعدادات */
        st_share: 'شاركي التطبيق',
        st_lang_title: '🌐 اختاري لغتك المفضلة',
        st_color_title: '🎨 اختاري لون الشاشة لي كتعجبك',
        st_c_default: '🟤 بني/ذهبي',
        st_c_emerald: '🟢 أخضر/ذهبي',
        st_c_vivid: '🔵 أزرق/ذهبي',
        st_c_blush: '💖 وردي/فاتح',
        st_c_cream: '🤍 كريمي/فاتح',
        st_c_sky: '🩵 أزرق/فاتح',
        st_c_black: '⚫ أسود/ذهبي',
        st_c_whatsapp: '💬 أبيض/كريمي',
        st_font_title: '🔠 حجم الخط',
        st_f_small: 'صغير',
        st_f_medium: 'متوسط',
        st_f_large: 'كبير',
        st_f_preview: 'هادا مثال على حجم الخط فالمحادثة ✨',
        st_notif: '🔔 التنبيهات والرسائل',
        st_soon: 'قريباً',
        st_vibration: '📳 الاهتزاز',
        st_trust: 'الشفافية والمصداقية',
        st_contact: '✉️ اتصلي بنا',
        st_contact_body: 'رأيك كيهمنا: ملاحظة، اقتراح، ولا مشكل؟ كتبي لينا وغادي نقراو رسالتك.',
        st_contact_btn: 'فتح البريد',
        st_privacy: '🔒 سياسة الخصوصية',
        st_privacy_1: 'المحادثات وما كتتذكرو روباتي عليك كيتحفظو فجهازك.',
        st_privacy_2: 'الرسائل لي كتصيفطي كتمشي لخدمة ذكاء اصطناعي من Google باش تولد الجواب.',
        st_privacy_3: 'تقدري تمسحي الذاكرة ديالك فأي وقت من قسم «حذف الذاكرة».',
        st_privacy_4: 'تسجيل الدخول بـ Google كيخدم غير للتعليقات والإعجاب والمتابعة. التعليقات كتبان للجميع بالاسم والصورة ديال حساب Google، وكتتحيد كاملة ملي كتحذفي الحساب.',
        st_terms: '📜 شروط الاستخدام',
        st_terms_1: 'روباتي للتعارف والترفيه والثقافة، وأجوبتها من الذكاء الاصطناعي وممكن يكون فيها غلط.',
        st_terms_2: 'ما كتعوضش رأي مختص فالصحة ولا القانون ولا الفلوس.',
        st_terms_3: 'من فضلك ما تدخليش معلومات حساسة بزاف فالمحادثة.',
        st_terms_4: 'ملي كتستعملي التطبيق معناها موافقة على هاد الشروط.',
        st_about: '✨ حول روباتي',
        st_about_1: 'روباتي سفيرة رقمية ديال التراث المغربي: الأزياء والأماكن والمطبخ والثقافة.',
        st_about_2: 'هي ذكاء اصطناعي ماشي إنسانة، وممكن تغلط، تأكدي من المعلومات المهمة.',
        st_mem: '🗑️ حذف الذاكرة',
        st_mem_body: 'كيمسح المحادثات وكلشي لي كتعرف روباتي عليك فهاد الجهاز، وكتبدا من جديد. ما كاينش رجوع.',
        st_mem_btn: 'حذف الذاكرة',
        st_mem_confirm: 'ضغطي مرة أخرى باش تأكدي',
        st_mem_done: 'تمسحات الذاكرة ✓',
        st_account: '👤 حساب Google وتسجيل الخروج',
        st_account_body: 'الحساب كيخدم غير باش تعلقي وتديري إعجاب وتتابعي. المحادثات والذاكرة ديالك كيبقاو فجهازك، ماشي فالسحابة.',
        st_delacc: '❌ حذف حسابي وبياناتي',
        st_delacc_body: 'حذف التطبيق من الهاتف: ضغطي بزاف على الأيقونة ديالو وختاري «إزالة» ولا «إلغاء التثبيت».',
        st_acc_signin: 'تسجيل الدخول بـ Google',
        st_acc_signout: 'تسجيل الخروج',
        st_acc_signed_out: 'خرجتي من الحساب ✓',
        st_acc_fail: 'ما قدرناش نتصلو، عاودي المحاولة.',
        st_acc_offline: 'خدمة الحساب ما متاحاش دابا، تأكدي من الإنترنت.',
        st_delacc_body_in: 'غادي نحيدو التعليقات والإعجابات ديالك، والحساب ديالك، وكلشي لي فهاد الجهاز (الذاكرة والإعدادات). ما كاينش رجوع.',
        st_delacc_body_out: 'غادي نمسحو كلشي لي فهاد الجهاز: الذاكرة والإعدادات والمتابعة. ما كاينش رجوع.',
        st_delacc_btn: 'حذف حسابي وبياناتي',
        st_delacc_confirm_text: 'واش متأكدة؟ هاد العملية نهائية.',
        st_delacc_confirm_btn: 'نعم، احذفي نهائياً',
        st_delacc_cancel: 'إلغاء',
        st_delacc_working: 'كنحذفو...',
        st_delacc_done: 'تحذفات البيانات ✓',
        st_delacc_fail: 'ما تحذفاتش كلشي، عاودي المحاولة.',
        st_delacc_reauth_fail: 'ما تأكدش الدخول بـ Google، وما تحذف والو.',
        st_copied: 'تنسخ الرابط ✓',
        st_share_text: 'اكتشفي روباتي، سفيرة التراث المغربي ✨',
        ui_translating: 'كنترجمو الواجهة...',
        ui_translated: 'تترجمات الواجهة ✓',
        ui_translate_failed: 'ما قدرناش نترجمو الواجهة، بقات بالإنجليزية.'
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
        no_language_found: 'لم أجد أي لغة',

        /* صفحة الإعدادات */
        st_share: 'مشاركة التطبيق',
        st_lang_title: '🌐 اختاري لغتك المفضلة',
        st_color_title: '🎨 اختاري لون الشاشة المفضّل لديكِ',
        st_c_default: '🟤 بني/ذهبي',
        st_c_emerald: '🟢 أخضر/ذهبي',
        st_c_vivid: '🔵 أزرق/ذهبي',
        st_c_blush: '💖 وردي/فاتح',
        st_c_cream: '🤍 كريمي/فاتح',
        st_c_sky: '🩵 أزرق/فاتح',
        st_c_black: '⚫ أسود/ذهبي',
        st_c_whatsapp: '💬 أبيض/كريمي',
        st_font_title: '🔠 حجم الخط',
        st_f_small: 'صغير',
        st_f_medium: 'متوسط',
        st_f_large: 'كبير',
        st_f_preview: 'هذا مثال على حجم الخط في المحادثة ✨',
        st_notif: '🔔 التنبيهات والرسائل',
        st_soon: 'قريباً',
        st_vibration: '📳 الاهتزاز',
        st_trust: 'الشفافية والمصداقية',
        st_contact: '✉️ اتصلي بنا',
        st_contact_body: 'رأيكِ يهمّنا: ملاحظة، اقتراح، أو مشكلة؟ راسلينا وسنقرأ رسالتكِ.',
        st_contact_btn: 'فتح البريد',
        st_privacy: '🔒 سياسة الخصوصية',
        st_privacy_1: 'محادثاتكِ وما تتذكره روباتي عنكِ يُحفظ على جهازكِ.',
        st_privacy_2: 'الرسائل التي ترسلينها تُرسل إلى خدمة ذكاء اصطناعي من Google لتوليد الرد.',
        st_privacy_3: 'يمكنكِ مسح ذاكرتكِ في أي وقت من قسم «حذف الذاكرة».',
        st_privacy_4: 'يُستخدم تسجيل الدخول بـ Google فقط للتعليق والإعجاب والمتابعة. تظهر التعليقات للجميع باسمك وصورتك من حساب Google، وتُحذف كلها عند حذف الحساب.',
        st_terms: '📜 شروط الاستخدام',
        st_terms_1: 'روباتي للتعارف والترفيه والثقافة، وردودها من الذكاء الاصطناعي وقد تحتوي أخطاء.',
        st_terms_2: 'لا تغني عن رأي مختص في الصحة أو القانون أو المال.',
        st_terms_3: 'يرجى عدم إدخال معلومات شديدة الحساسية في المحادثة.',
        st_terms_4: 'باستعمالكِ التطبيق فأنتِ توافقين على هذه الشروط.',
        st_about: '✨ حول روباتي',
        st_about_1: 'روباتي سفيرة رقمية للتراث المغربي: الأزياء والأماكن والمطبخ والثقافة.',
        st_about_2: 'هي ذكاء اصطناعي وليست إنساناً، وقد تخطئ، فتحققي من المعلومات المهمة.',
        st_mem: '🗑️ حذف الذاكرة',
        st_mem_body: 'يمسح المحادثات وكل ما تعرفه روباتي عنكِ على هذا الجهاز، وتبدأ من جديد. لا يمكن التراجع.',
        st_mem_btn: 'حذف الذاكرة',
        st_mem_confirm: 'اضغطي مرة أخرى للتأكيد',
        st_mem_done: 'تم حذف الذاكرة ✓',
        st_account: '👤 حساب Google وتسجيل الخروج',
        st_account_body: 'يُستخدم الحساب فقط للتعليق والإعجاب والمتابعة. تبقى محادثاتك وذاكرتك على جهازك وليس في السحابة.',
        st_delacc: '❌ حذف حسابي وبياناتي',
        st_delacc_body: 'لحذف التطبيق من هاتفك: اضغطي مطولاً على أيقونته ثم اختاري «إزالة» أو «إلغاء التثبيت».',
        st_acc_signin: 'تسجيل الدخول بـ Google',
        st_acc_signout: 'تسجيل الخروج',
        st_acc_signed_out: 'تم تسجيل الخروج ✓',
        st_acc_fail: 'تعذّر الاتصال، أعيدي المحاولة.',
        st_acc_offline: 'خدمة الحساب غير متاحة الآن، تحققي من الإنترنت.',
        st_delacc_body_in: 'سنحذف تعليقاتك وإعجاباتك وحسابك وكل ما على هذا الجهاز (الذاكرة والإعدادات). لا يمكن التراجع.',
        st_delacc_body_out: 'سنمسح كل ما على هذا الجهاز: الذاكرة والإعدادات والمتابعة. لا يمكن التراجع.',
        st_delacc_btn: 'حذف حسابي وبياناتي',
        st_delacc_confirm_text: 'هل أنتِ متأكدة؟ هذه العملية نهائية.',
        st_delacc_confirm_btn: 'نعم، احذفي نهائياً',
        st_delacc_cancel: 'إلغاء',
        st_delacc_working: 'جارٍ الحذف...',
        st_delacc_done: 'تم حذف البيانات ✓',
        st_delacc_fail: 'لم يُحذف كل شيء، أعيدي المحاولة.',
        st_delacc_reauth_fail: 'لم يتم تأكيد الدخول بـ Google، ولم يُحذف شيء.',
        st_copied: 'تم نسخ الرابط ✓',
        st_share_text: 'اكتشفي روباتي، سفيرة التراث المغربي ✨',
        ui_translating: 'جارٍ ترجمة الواجهة...',
        ui_translated: 'تمت الترجمة ✓',
        ui_translate_failed: 'تعذّرت ترجمة الواجهة، وبقيت بالإنجليزية.'
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
        no_language_found: 'No language found',

        /* صفحة الإعدادات */
        st_share: 'Share the app',
        st_lang_title: '🌐 Choose your preferred language',
        st_color_title: '🎨 Choose your favorite screen color',
        st_c_default: '🟤 Brown/Gold',
        st_c_emerald: '🟢 Green/Gold',
        st_c_vivid: '🔵 Blue/Gold',
        st_c_blush: '💖 Pink/Light',
        st_c_cream: '🤍 Cream/Light',
        st_c_sky: '🩵 Blue/Light',
        st_c_black: '⚫ Black/Gold',
        st_c_whatsapp: '💬 White/Cream',
        st_font_title: '🔠 Font size',
        st_f_small: 'Small',
        st_f_medium: 'Medium',
        st_f_large: 'Large',
        st_f_preview: 'This is a preview of the text size in the chat ✨',
        st_notif: '🔔 Notifications & messages',
        st_soon: 'Soon',
        st_vibration: '📳 Vibration',
        st_trust: 'Transparency & trust',
        st_contact: '✉️ Contact us',
        st_contact_body: 'Your opinion matters: a comment, a suggestion, or a problem? Write to us and we will read your message.',
        st_contact_btn: 'Open email',
        st_privacy: '🔒 Privacy policy',
        st_privacy_1: 'Your conversations and what Robaty remembers about you are stored on your device.',
        st_privacy_2: 'The messages you send go to an AI service from Google to generate the reply.',
        st_privacy_3: 'You can clear your memory at any time from the “Delete memory” section.',
        st_privacy_4: 'Google sign-in is only used for comments, likes and following. Comments are public with the name and photo from your Google account, and are all deleted when you delete your account.',
        st_terms: '📜 Terms of use',
        st_terms_1: 'Robaty is for companionship, entertainment and culture. Her replies come from AI and may contain mistakes.',
        st_terms_2: 'She does not replace the advice of a professional in health, law or finance.',
        st_terms_3: 'Please do not share highly sensitive information in the chat.',
        st_terms_4: 'By using the app, you agree to these terms.',
        st_about: '✨ About Robaty',
        st_about_1: 'Robaty is a digital ambassador of Moroccan heritage: fashion, places, cuisine and culture.',
        st_about_2: 'She is an AI, not a human, and she can make mistakes, so please double-check important information.',
        st_mem: '🗑️ Delete memory',
        st_mem_body: 'This erases the chats and everything Robaty knows about you on this device, and she starts fresh. This cannot be undone.',
        st_mem_btn: 'Delete memory',
        st_mem_confirm: 'Tap again to confirm',
        st_mem_done: 'Memory deleted ✓',
        st_account: '👤 Google account & sign out',
        st_account_body: 'Your account is only used to comment, like and follow. Your chats and memory stay on your device, not in the cloud.',
        st_delacc: '❌ Delete my account and data',
        st_delacc_body: 'To remove the app from your phone: long-press its icon, then choose “Remove” or “Uninstall”.',
        st_acc_signin: 'Sign in with Google',
        st_acc_signout: 'Sign out',
        st_acc_signed_out: 'Signed out ✓',
        st_acc_fail: 'Connection failed, please try again.',
        st_acc_offline: 'Account service unavailable right now, check your connection.',
        st_delacc_body_in: 'This will delete your comments, likes, your account and everything on this device (memory and settings). This cannot be undone.',
        st_delacc_body_out: 'This will erase everything on this device: memory, settings and follow status. This cannot be undone.',
        st_delacc_btn: 'Delete my account and data',
        st_delacc_confirm_text: 'Are you sure? This is permanent.',
        st_delacc_confirm_btn: 'Yes, delete permanently',
        st_delacc_cancel: 'Cancel',
        st_delacc_working: 'Deleting...',
        st_delacc_done: 'Data deleted ✓',
        st_delacc_fail: 'Not everything was deleted, please try again.',
        st_delacc_reauth_fail: 'Google sign-in was not confirmed, nothing was deleted.',
        st_copied: 'Link copied ✓',
        st_share_text: 'Discover Robaty, ambassador of Moroccan heritage ✨',
        ui_translating: 'Translating the app…',
        ui_translated: 'Translation ready ✓',
        ui_translate_failed: 'Could not translate the app; it stays in English.'
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
        no_language_found: 'Aucune langue trouvée',

        /* صفحة الإعدادات */
        st_share: 'Partager l\'app',
        st_lang_title: '🌐 Choisis ta langue préférée',
        st_color_title: '🎨 Choisis la couleur d\'écran que tu préfères',
        st_c_default: '🟤 Brun/Or',
        st_c_emerald: '🟢 Vert/Or',
        st_c_vivid: '🔵 Bleu/Or',
        st_c_blush: '💖 Rose/Clair',
        st_c_cream: '🤍 Crème/Clair',
        st_c_sky: '🩵 Bleu/Clair',
        st_c_black: '⚫ Noir/Or',
        st_c_whatsapp: '💬 Blanc/Crème',
        st_font_title: '🔠 Taille du texte',
        st_f_small: 'Petit',
        st_f_medium: 'Moyen',
        st_f_large: 'Grand',
        st_f_preview: 'Voici un aperçu de la taille du texte dans le chat ✨',
        st_notif: '🔔 Notifications et messages',
        st_soon: 'Bientôt',
        st_vibration: '📳 Vibrations',
        st_trust: 'Transparence et confiance',
        st_contact: '✉️ Nous contacter',
        st_contact_body: 'Ton avis compte : une remarque, une suggestion ou un souci ? Écris-nous, nous lirons ton message.',
        st_contact_btn: 'Ouvrir l\'e-mail',
        st_privacy: '🔒 Politique de confidentialité',
        st_privacy_1: 'Tes conversations et ce que Robaty retient de toi sont enregistrés sur ton appareil.',
        st_privacy_2: 'Les messages que tu envoies sont transmis à un service d’IA de Google pour générer la réponse.',
        st_privacy_3: 'Tu peux effacer ta mémoire à tout moment dans la section « Effacer la mémoire ».',
        st_privacy_4: 'La connexion Google sert uniquement aux commentaires, aux j’aime et à l’abonnement. Les commentaires sont publics avec le nom et la photo de ton compte Google, et tous supprimés avec ton compte.',
        st_terms: '📜 Conditions d\'utilisation',
        st_terms_1: 'Robaty est là pour la compagnie, le divertissement et la culture. Ses réponses viennent d\'une IA et peuvent contenir des erreurs.',
        st_terms_2: 'Elle ne remplace pas l\'avis d\'un professionnel de la santé, du droit ou de la finance.',
        st_terms_3: 'Merci de ne pas partager d\'informations très sensibles dans la conversation.',
        st_terms_4: 'En utilisant l\'application, tu acceptes ces conditions.',
        st_about: '✨ À propos de Robaty',
        st_about_1: 'Robaty est une ambassadrice numérique du patrimoine marocain : mode, lieux, cuisine et culture.',
        st_about_2: 'C\'est une IA, pas une humaine, et elle peut se tromper : vérifie les informations importantes.',
        st_mem: '🗑️ Effacer la mémoire',
        st_mem_body: 'Cela efface les conversations et tout ce que Robaty sait de toi sur cet appareil, et elle repart de zéro. Action irréversible.',
        st_mem_btn: 'Effacer la mémoire',
        st_mem_confirm: 'Appuie encore pour confirmer',
        st_mem_done: 'Mémoire effacée ✓',
        st_account: '👤 Compte Google et déconnexion',
        st_account_body: 'Le compte sert uniquement à commenter, aimer et suivre. Tes conversations et ta mémoire restent sur ton appareil, pas dans le cloud.',
        st_delacc: '❌ Supprimer mon compte et mes données',
        st_delacc_body: 'Pour retirer l’app de ton téléphone : appuie longuement sur son icône puis choisis « Supprimer » ou « Désinstaller ».',
        st_acc_signin: 'Se connecter avec Google',
        st_acc_signout: 'Se déconnecter',
        st_acc_signed_out: 'Déconnexion effectuée ✓',
        st_acc_fail: 'Connexion impossible, réessaie.',
        st_acc_offline: 'Service de compte indisponible, vérifie ta connexion.',
        st_delacc_body_in: 'Cela supprimera tes commentaires, tes j’aime, ton compte et tout ce qui est sur cet appareil (mémoire et réglages). Irréversible.',
        st_delacc_body_out: 'Cela effacera tout ce qui est sur cet appareil : mémoire, réglages et abonnement. Irréversible.',
        st_delacc_btn: 'Supprimer mon compte et mes données',
        st_delacc_confirm_text: 'Tu confirmes ? C’est définitif.',
        st_delacc_confirm_btn: 'Oui, supprimer définitivement',
        st_delacc_cancel: 'Annuler',
        st_delacc_working: 'Suppression…',
        st_delacc_done: 'Données supprimées ✓',
        st_delacc_fail: 'Tout n’a pas été supprimé, réessaie.',
        st_delacc_reauth_fail: 'La connexion Google n’a pas été confirmée, rien n’a été supprimé.',
        st_copied: 'Lien copié ✓',
        st_share_text: 'Découvre Robaty, ambassadrice du patrimoine marocain ✨',
        ui_translating: 'Traduction de l\'app en cours…',
        ui_translated: 'Traduction terminée ✓',
        ui_translate_failed: 'Impossible de traduire l\'app ; elle reste en anglais.'
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
        no_language_found: 'No se encontró ningún idioma',

        /* صفحة الإعدادات */
        st_share: 'Compartir la app',
        st_lang_title: '🌐 Elige tu idioma preferido',
        st_color_title: '🎨 Elige el color de pantalla que más te guste',
        st_c_default: '🟤 Marrón/Dorado',
        st_c_emerald: '🟢 Verde/Dorado',
        st_c_vivid: '🔵 Azul/Dorado',
        st_c_blush: '💖 Rosa/Claro',
        st_c_cream: '🤍 Crema/Claro',
        st_c_sky: '🩵 Azul/Claro',
        st_c_black: '⚫ Negro/Dorado',
        st_c_whatsapp: '💬 Blanco/Crema',
        st_font_title: '🔠 Tamaño de letra',
        st_f_small: 'Pequeño',
        st_f_medium: 'Mediano',
        st_f_large: 'Grande',
        st_f_preview: 'Esta es una vista previa del tamaño de letra en el chat ✨',
        st_notif: '🔔 Notificaciones y mensajes',
        st_soon: 'Pronto',
        st_vibration: '📳 Vibración',
        st_trust: 'Transparencia y confianza',
        st_contact: '✉️ Contáctanos',
        st_contact_body: 'Tu opinión nos importa: ¿un comentario, una sugerencia o un problema? Escríbenos y leeremos tu mensaje.',
        st_contact_btn: 'Abrir correo',
        st_privacy: '🔒 Política de privacidad',
        st_privacy_1: 'Tus conversaciones y lo que Robaty recuerda de ti se guardan en tu dispositivo.',
        st_privacy_2: 'Los mensajes que envías se transmiten a un servicio de IA de Google para generar la respuesta.',
        st_privacy_3: 'Puedes borrar tu memoria en cualquier momento desde la sección «Borrar memoria».',
        st_privacy_4: 'El inicio de sesión con Google solo se usa para comentarios, me gusta y seguimiento. Los comentarios son públicos con el nombre y la foto de tu cuenta de Google, y se borran todos al eliminar tu cuenta.',
        st_terms: '📜 Términos de uso',
        st_terms_1: 'Robaty es para compañía, entretenimiento y cultura. Sus respuestas provienen de una IA y pueden contener errores.',
        st_terms_2: 'No sustituye el consejo de un profesional de la salud, el derecho o las finanzas.',
        st_terms_3: 'Por favor, no compartas información muy sensible en el chat.',
        st_terms_4: 'Al usar la aplicación, aceptas estos términos.',
        st_about: '✨ Acerca de Robaty',
        st_about_1: 'Robaty es una embajadora digital del patrimonio marroquí: moda, lugares, cocina y cultura.',
        st_about_2: 'Es una IA, no una persona, y puede equivocarse: verifica la información importante.',
        st_mem: '🗑️ Borrar memoria',
        st_mem_body: 'Esto borra los chats y todo lo que Robaty sabe de ti en este dispositivo, y empieza de cero. No se puede deshacer.',
        st_mem_btn: 'Borrar memoria',
        st_mem_confirm: 'Toca de nuevo para confirmar',
        st_mem_done: 'Memoria borrada ✓',
        st_account: '👤 Cuenta de Google y cerrar sesión',
        st_account_body: 'La cuenta solo sirve para comentar, dar me gusta y seguir. Tus conversaciones y tu memoria se quedan en tu dispositivo, no en la nube.',
        st_delacc: '❌ Eliminar mi cuenta y mis datos',
        st_delacc_body: 'Para quitar la app del teléfono: mantén pulsado su icono y elige «Quitar» o «Desinstalar».',
        st_acc_signin: 'Iniciar sesión con Google',
        st_acc_signout: 'Cerrar sesión',
        st_acc_signed_out: 'Sesión cerrada ✓',
        st_acc_fail: 'Sin conexión, inténtalo de nuevo.',
        st_acc_offline: 'El servicio de cuenta no está disponible ahora, revisa tu conexión.',
        st_delacc_body_in: 'Se borrarán tus comentarios, tus me gusta, tu cuenta y todo lo de este dispositivo (memoria y ajustes). No se puede deshacer.',
        st_delacc_body_out: 'Se borrará todo lo de este dispositivo: memoria, ajustes y seguimiento. No se puede deshacer.',
        st_delacc_btn: 'Eliminar mi cuenta y mis datos',
        st_delacc_confirm_text: '¿Seguro? Es definitivo.',
        st_delacc_confirm_btn: 'Sí, eliminar para siempre',
        st_delacc_cancel: 'Cancelar',
        st_delacc_working: 'Eliminando…',
        st_delacc_done: 'Datos eliminados ✓',
        st_delacc_fail: 'No se borró todo, inténtalo de nuevo.',
        st_delacc_reauth_fail: 'No se confirmó el acceso con Google, no se borró nada.',
        st_copied: 'Enlace copiado ✓',
        st_share_text: 'Descubre a Robaty, embajadora del patrimonio marroquí ✨',
        ui_translating: 'Traduciendo la app…',
        ui_translated: 'Traducción lista ✓',
        ui_translate_failed: 'No se pudo traducir la app; se queda en inglés.'
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
        no_language_found: 'Язык не найден',

        /* صفحة الإعدادات */
        st_share: 'Поделиться приложением',
        st_lang_title: '🌐 Выбери любимый язык',
        st_color_title: '🎨 Выбери любимый цвет экрана',
        st_c_default: '🟤 Коричневый/золотой',
        st_c_emerald: '🟢 Зелёный/золотой',
        st_c_vivid: '🔵 Синий/золотой',
        st_c_blush: '💖 Розовый/светлый',
        st_c_cream: '🤍 Кремовый/светлый',
        st_c_sky: '🩵 Голубой/светлый',
        st_c_black: '⚫ Чёрный/золотой',
        st_c_whatsapp: '💬 Белый/кремовый',
        st_font_title: '🔠 Размер шрифта',
        st_f_small: 'Маленький',
        st_f_medium: 'Средний',
        st_f_large: 'Большой',
        st_f_preview: 'Так будет выглядеть размер шрифта в чате ✨',
        st_notif: '🔔 Уведомления и сообщения',
        st_soon: 'Скоро',
        st_vibration: '📳 Вибрация',
        st_trust: 'Прозрачность и доверие',
        st_contact: '✉️ Связаться с нами',
        st_contact_body: 'Твоё мнение важно: замечание, предложение или проблема? Напиши нам, и мы прочитаем твоё сообщение.',
        st_contact_btn: 'Открыть почту',
        st_privacy: '🔒 Политика конфиденциальности',
        st_privacy_1: 'Твои разговоры и то, что Robaty помнит о тебе, хранятся на твоём устройстве.',
        st_privacy_2: 'Сообщения, которые ты отправляешь, передаются сервису ИИ от Google для создания ответа.',
        st_privacy_3: 'Ты можешь в любой момент очистить память в разделе «Удалить память».',
        st_privacy_4: 'Вход через Google нужен только для комментариев, лайков и подписки. Комментарии публичны и показываются с именем и фото из твоего аккаунта Google; все удаляются вместе с аккаунтом.',
        st_terms: '📜 Условия использования',
        st_terms_1: 'Robaty создана для общения, развлечения и знакомства с культурой. Её ответы генерирует ИИ, и в них могут быть ошибки.',
        st_terms_2: 'Она не заменяет совет специалиста в области здоровья, права или финансов.',
        st_terms_3: 'Пожалуйста, не делись в чате очень конфиденциальной информацией.',
        st_terms_4: 'Используя приложение, ты соглашаешься с этими условиями.',
        st_about: '✨ О Robaty',
        st_about_1: 'Robaty — цифровой посол марокканского наследия: мода, места, кухня и культура.',
        st_about_2: 'Она — ИИ, а не человек, и может ошибаться, поэтому проверяй важную информацию.',
        st_mem: '🗑️ Удалить память',
        st_mem_body: 'Это удалит чаты и всё, что Robaty знает о тебе на этом устройстве, и она начнёт с чистого листа. Действие необратимо.',
        st_mem_btn: 'Удалить память',
        st_mem_confirm: 'Нажми ещё раз для подтверждения',
        st_mem_done: 'Память удалена ✓',
        st_account: '👤 Аккаунт Google и выход',
        st_account_body: 'Аккаунт нужен только для комментариев, лайков и подписки. Твои чаты и память остаются на устройстве, а не в облаке.',
        st_delacc: '❌ Удалить аккаунт и данные',
        st_delacc_body: 'Чтобы удалить приложение с телефона, нажми и удерживай его значок и выбери «Удалить».',
        st_acc_signin: 'Войти через Google',
        st_acc_signout: 'Выйти',
        st_acc_signed_out: 'Выход выполнен ✓',
        st_acc_fail: 'Нет соединения, попробуй ещё раз.',
        st_acc_offline: 'Сервис аккаунта сейчас недоступен, проверь соединение.',
        st_delacc_body_in: 'Будут удалены твои комментарии, лайки, аккаунт и всё на этом устройстве (память и настройки). Это необратимо.',
        st_delacc_body_out: 'Будет удалено всё на этом устройстве: память, настройки и подписка. Это необратимо.',
        st_delacc_btn: 'Удалить аккаунт и данные',
        st_delacc_confirm_text: 'Точно? Это необратимо.',
        st_delacc_confirm_btn: 'Да, удалить навсегда',
        st_delacc_cancel: 'Отмена',
        st_delacc_working: 'Удаление…',
        st_delacc_done: 'Данные удалены ✓',
        st_delacc_fail: 'Удалено не всё, попробуй ещё раз.',
        st_delacc_reauth_fail: 'Вход через Google не подтверждён, ничего не удалено.',
        st_copied: 'Ссылка скопирована ✓',
        st_share_text: 'Знакомься: Robaty, посол марокканского наследия ✨',
        ui_translating: 'Переводим приложение…',
        ui_translated: 'Перевод готов ✓',
        ui_translate_failed: 'Не удалось перевести приложение, оно осталось на английском.'
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

    let htmlLang = lang;
    let rtl = RTL_LANGS.includes(lang);

    /* لغة مترجمة من "جميع اللغات" (عبرية، فارسية، أردية...) */
    const reply = (lang === 'en') ? getReplyLanguage() : null;
    if (reply && !reply.dialect && readUiTranslation(reply.code)) {
        htmlLang = reply.code;
        rtl = !!reply.rtl;
    }

    document.documentElement.lang = htmlLang;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';

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


/* ===== ترجمة الواجهة بالذكاء الاصطناعي (لغات "جميع اللغات") ===== */

let translatingCode = null;

function emitTranslation(status, code) {
    try {
        window.dispatchEvent(new CustomEvent('robaty-ui-translation', { detail: { status: status, code: code } }));
    } catch (error) {}
}

/* كنخليو غير <b> و <br> فالنصوص اللي فيها HTML، ونحيدو أي حدث (onclick...) */
function cleanTranslation(value) {
    return String(value)
        .replace(/<(?!\/?(b|br)\b)[^>]*>/gi, '')
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
        .trim();
}

async function requestTranslationChunk(item, chunk) {

    const apiKey = localStorage.getItem(TRANSLATION_KEY_STORAGE) || '';
    if (!apiKey) throw new Error('no key');

    const prompt =
        'You are a professional app localizer. Translate the VALUES of the following JSON object from English into ' +
        item.en + ' (' + item.native + '). Keep every KEY exactly unchanged. ' +
        'Keep emojis, HTML tags (<b>, <br>), line breaks (\\n) and brand names (Robaty, Google, Gemini, Chrome, WhatsApp, API) as they are. ' +
        'The app speaks warmly to women: use feminine forms where the language distinguishes gender. ' +
        'Return ONLY the translated JSON object.\n\n' + JSON.stringify(chunk);

    const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + TRANSLATION_MODEL + ':generateContent?key=' + apiKey,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' }
            })
        }
    );

    const data = await res.json();
    if (!res.ok) throw new Error('api ' + res.status);

    const text = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
        data.candidates[0].content.parts && data.candidates[0].content.parts[0].text || '';

    return JSON.parse(text.replace(/```json|```/g, '').trim());

}

function refreshUi() {
    const lang = getCurrentLang();
    applyDirection(lang);
    applyTranslations(lang);
    renderLanguageOptions(lang);
}

async function ensureUiTranslation() {

    const reply = getReplyLanguage();
    if (!reply || reply.dialect) return;

    const cached = readUiTranslation(reply.code);
    if (cached && cached.hash === sourceHash()) return;
    if (translatingCode === reply.code) return;

    translatingCode = reply.code;
    emitTranslation('start', reply.code);

    try {

        const en = translations.en;
        const keys = Object.keys(en).filter(k => typeof en[k] === 'string');
        const chunks = [];

        for (let i = 0; i < keys.length; i += 40) chunks.push(keys.slice(i, i + 40));

        const parts = await Promise.all(chunks.map(ch => {
            const obj = {};
            ch.forEach(k => { obj[k] = en[k]; });
            return requestTranslationChunk(reply, obj);
        }));

        const dict = {};

        parts.forEach(part => {
            Object.keys(part || {}).forEach(k => {
                if (typeof part[k] === 'string' && typeof en[k] === 'string') dict[k] = cleanTranslation(part[k]);
            });
        });

        if (Object.keys(dict).length < keys.length * 0.6) throw new Error('incomplete');

        saveUiTranslation(reply.code, dict);

        /* إلا بدلات اللغة فالوقت هاد المدة، ما نطبقوش ترجمة قديمة */
        const now = getReplyLanguage();
        if (now && now.code === reply.code) refreshUi();

        emitTranslation('done', reply.code);

    } catch (error) {

        console.log('تعذرت ترجمة الواجهة:', error.message);
        emitTranslation('error', reply.code);

    } finally {

        translatingCode = null;

    }

}


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

let uiTranslationCache = { code: null, entry: null };

function readUiTranslation(code) {
    if (uiTranslationCache.code === code) return uiTranslationCache.entry;
    let entry = null;
    try {
        const raw = localStorage.getItem(UI_TRANSLATION_PREFIX + code);
        const obj = raw ? JSON.parse(raw) : null;
        if (obj && obj.dict) entry = obj;
    } catch (error) {}
    uiTranslationCache = { code: code, entry: entry };
    return entry;
}

function saveUiTranslation(code, dict) {
    try {
        localStorage.setItem(UI_TRANSLATION_PREFIX + code, JSON.stringify({ hash: sourceHash(), dict: dict }));
    } catch (error) {}
    uiTranslationCache = { code: null, entry: null };
}

/* بصمة بسيطة للنصوص الإنجليزية: إلا زدنا/بدلنا نصوص كنعاودو الترجمة */
function sourceHash() {
    const str = JSON.stringify(translations.en);
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
}

function getDictionary(lang) {

    if (lang === 'ar' && getArabicVariant() === 'fus') {
        return Object.assign({}, translations.ar, translations.ar_fus);
    }

    /* لغة من "جميع اللغات": الإنجليزية + الترجمة المحفوظة (إلا كانت) */
    if (lang === 'en') {
        const reply = getReplyLanguage();
        if (reply && !reply.dialect) {
            const entry = readUiTranslation(reply.code);
            if (entry) return Object.assign({}, translations.en, entry.dict);
        }
        return translations.en;
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
    allBtn.textContent = '🌍 ' + translate('all_languages_btn') + (reply ? ' · ' + (reply.flag ? reply.flag + ' ' : '') + reply.native : '');

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

    const item = LANGUAGE_LIST.find(l => l.code === code);
    if (!item) return;

    saveReplyLanguage({
        code: item.code,
        name: item.en,
        native: item.native,
        label: item.label || '',
        flag: item.flag || '',
        rtl: !!item.rtl,
        dialect: !!item.dialect,
        ai: item.ai || null
    });

    if (item.dialect) {
        /* لهجة عربية: الواجهة بالفصحى، و Robaty كتجاوب بلهجة البلد */
        setLanguage('ar', { variant: 'fus', keepReply: true });
    } else {
        /* باقي اللغات: الواجهة بالإنجليزية فورا، ثم كتترجم بالذكاء الاصطناعي */
        setLanguage('en', { keepReply: true });
        ensureUiTranslation();
    }

}


/* API بسيط لباقي الملفات (app.js، story.js، settings.js) */

window.RobatyI18n = {
    t: translate,
    getCurrentLang: getCurrentLang,
    getArabicVariant: getArabicVariant,
    getReplyLanguage: getReplyLanguage,
    getAllLanguages: function () { return LANGUAGE_LIST.slice(); },
    setLanguage: setLanguage,
    setReplyLanguage: setReplyLanguage
};


/* البداية */

document.addEventListener('DOMContentLoaded', () => {

    const lang = getCurrentLang();

    applyDirection(lang);
    applyTranslations(lang);
    renderLanguageOptions(lang);
    ensureUiTranslation();

    if (!getSavedLang()) {
        saveLang(lang);
        saveArabicVariant(getArabicVariant());
    }

});
