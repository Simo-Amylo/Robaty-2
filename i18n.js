/* ==========================================================================
Robaty — محرك اللغات الموحّد (i18n)
كشف تلقائي + تبديل يدوي + حفظ فـ localStorage
خاصو يتحط فـ <head> أو قبل app.js فكل صفحة (index/moments/profile)
========================================================================== */

// الترتيب = ترتيب الأزرار فالإعدادات (العربية فالزر الكبير الأخير)
const SUPPORTED_LANGS = ['ru', 'en', 'fr', 'es', 'ar'];
const RTL_LANGS = ['ar'];
const LANG_STORAGE = 'robaty_lang';

/* الاسم ديال كل لغة بلغتها هي (ما كيتترجمش) */
const LANG_NATIVE_NAMES = {
    ar: 'العربية',
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
        day01_morning_time: 'اليوم · 07:00 AM',
        day01_morning_location: 'شفشاون — المدينة الزرقاء',
        day01_morning_caption: 'شفشاون كتلبس الزرقة من الصباح 💙<br>وكل زقاق فيها عندو حكاية صغيرة.<br>ألوان المدينة ولات جزءًا من هويتها البصرية.<br>اليوم نسّقت blazer عصري بلمسة سفيفة مغربية.<br>واش اللوك نجح؟ أنا كنقول آه… بلا غرور 😂<br>التحدي والتصويت كاينين فـ Story 👀',
        day01_evening_time: 'اليوم · 07:00 PM',
        day01_evening_location: 'الصويرة — الميناء والمدينة القديمة',
        day01_evening_caption: 'فالصويرة، حتى الريح كتجي عندها شخصية قوية 😂🌊<br>المدينة معروفة بأجوائها البحرية ومينائها وأسوارها.<br>تفاصيلها كتخلي كل جولة فيها قصة جديدة.<br>جربت Look رملي مع تطريز مغربي خفيف.<br>مريح للخروج وماشي غير للمناسبات.<br>رسالة المساء: شنو رأيك فلوك اليوم؟ 🌙',

        /* Story */
        open_story_aria: 'فتح Story ديال Robaty',
        close_story_aria: 'إغلاق',
        prev_story_aria: 'الستوري السابقة',
        next_story_aria: 'الستوري التالية',
        story_morning_aria: 'فتح Story الصباح',
        story_evening_aria: 'فتح Story المساء',
        story_morning_kicker: 'صوّتي مع Robaty ✨',
        story_morning_question: 'كيفاش تنسقي هاد الإطلالة؟',
        story_morning_option_a: 'A — مع سروال أبيض واسع 🤍',
        story_morning_option_b: 'B — مع Jeans أزرق 👖',
        story_morning_result: 'اختيار زوين! غادي نخليو النتيجة جزءًا من تجربة Robaty ✨',
        story_evening_kicker: 'تحدي Robaty 👑',
        story_evening_question: 'فين غادي تدوزي هاد اللحظة؟',
        story_evening_option_a: 'A — جلسة هادئة حدّ البحر 🌊',
        story_evening_option_b: 'B — جولة فالمدينة القديمة 🧿',
        story_evening_result: 'اختيارك وصل لـ Robaty ✨',

        /* Profile */
        back_aria: 'رجوع',
        profile_tagline: '🇲🇦 أول رفيقة ذكاء اصطناعي مغربية',
        chat_with_me_btn: 'دردشي معايا',
        follow_btn: 'متابعة',
        stat_moments: 'لحظة',
        stat_followers: 'متابع',
        stat_engagement: 'تفاعل',
        profile_bio: '✨ تجمع بين أصالة التراث المغربي وتكنولوجيا المستقبل.<br>☕ محبة للثقافة، الموضة، والدردشة الدافئة.<br>📍 مراكش / المغرب 🇲🇦',
        moments_tab: 'اللحظات'
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
        day01_morning_time: 'Today · 7:00 AM',
        day01_morning_location: 'Chefchaouen — The Blue City',
        day01_morning_caption: 'Chefchaouen wears blue every morning 💙<br>Every alley here has its own little story.<br>The city\u2019s colors became part of its visual identity.<br>Today I styled a modern blazer with a Moroccan touch.<br>Did the look work? I\u2019d say yes… no shame in that 😂<br>The challenge and the poll are in the Story 👀',
        day01_evening_time: 'Today · 7:00 PM',
        day01_evening_location: 'Essaouira — The Port & Old Medina',
        day01_evening_caption: 'In Essaouira, even the wind has a strong personality 😂🌊<br>The city is known for its sea breeze, its port and its ramparts.<br>Every detail here turns a walk into a new story.<br>I tried a sandy look with light Moroccan embroidery.<br>Comfy for going out, not just for special occasions.<br>Evening question: what do you think of today\u2019s look? 🌙',

        /* Story */
        open_story_aria: 'Open Robaty\u2019s Story',
        close_story_aria: 'Close',
        prev_story_aria: 'Previous Story',
        next_story_aria: 'Next Story',
        story_morning_aria: 'Open morning Story',
        story_evening_aria: 'Open evening Story',
        story_morning_kicker: 'Vote with Robaty ✨',
        story_morning_question: 'How would you style this look?',
        story_morning_option_a: 'A — with wide white pants 🤍',
        story_morning_option_b: 'B — with blue jeans 👖',
        story_morning_result: 'Great pick! We\u2019ll make the result part of the Robaty experience ✨',
        story_evening_kicker: 'Robaty\u2019s Challenge 👑',
        story_evening_question: 'Where would you spend this moment?',
        story_evening_option_a: 'A — a calm sit by the sea 🌊',
        story_evening_option_b: 'B — a walk in the old medina 🧿',
        story_evening_result: 'Your pick reached Robaty ✨',

        /* Profile */
        back_aria: 'Back',
        profile_tagline: '🇲🇦 The first Moroccan AI companion',
        chat_with_me_btn: 'Chat with me',
        follow_btn: 'Follow',
        stat_moments: 'Moments',
        stat_followers: 'Followers',
        stat_engagement: 'Engagement',
        profile_bio: '✨ Blending the authenticity of Moroccan heritage with future technology.<br>☕ Loves culture, fashion, and warm conversation.<br>📍 Marrakech / Morocco 🇲🇦',
        moments_tab: 'Moments'
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
        day01_morning_time: "Aujourd'hui · 7h00",
        day01_morning_location: 'Chefchaouen — La ville bleue',
        day01_morning_caption: 'Chefchaouen se pare de bleu dès le matin 💙<br>Chaque ruelle y cache sa petite histoire.<br>Les couleurs de la ville font partie de son identité visuelle.<br>Aujourd\u2019hui, j\u2019ai porté un blazer moderne avec une touche marocaine.<br>Le look a plu ? Je dirais oui… sans fausse modestie 😂<br>Le défi et le sondage sont dans la Story 👀',
        day01_evening_time: "Aujourd'hui · 19h00",
        day01_evening_location: 'Essaouira — Le port et la médina',
        day01_evening_caption: 'À Essaouira, même le vent a du caractère 😂🌊<br>La ville est connue pour son air marin, son port et ses remparts.<br>Chaque détail ici transforme une balade en nouvelle histoire.<br>J\u2019ai testé un look sable avec une broderie marocaine légère.<br>Confortable pour sortir, pas juste pour les grandes occasions.<br>Question du soir : t\u2019en penses quoi, de ce look ? 🌙',

        /* Story */
        open_story_aria: 'Ouvrir la Story de Robaty',
        close_story_aria: 'Fermer',
        prev_story_aria: 'Story précédente',
        next_story_aria: 'Story suivante',
        story_morning_aria: 'Ouvrir la Story du matin',
        story_evening_aria: 'Ouvrir la Story du soir',
        story_morning_kicker: 'Vote avec Robaty ✨',
        story_morning_question: 'Comment tu associerais ce look ?',
        story_morning_option_a: 'A — avec un pantalon blanc large 🤍',
        story_morning_option_b: 'B — avec un jean bleu 👖',
        story_morning_result: 'Beau choix ! On intégrera le résultat à l\u2019expérience Robaty ✨',
        story_evening_kicker: 'Défi Robaty 👑',
        story_evening_question: 'Où passerais-tu ce moment ?',
        story_evening_option_a: 'A — un moment calme au bord de mer 🌊',
        story_evening_option_b: 'B — une balade dans la médina 🧿',
        story_evening_result: 'Ton choix est arrivé jusqu\u2019à Robaty ✨',

        /* Profile */
        back_aria: 'Retour',
        profile_tagline: '🇲🇦 La première compagne IA marocaine',
        chat_with_me_btn: 'Discute avec moi',
        follow_btn: 'Suivre',
        stat_moments: 'Moments',
        stat_followers: 'Abonnés',
        stat_engagement: 'Interactions',
        profile_bio: '✨ Un mélange entre l\u2019authenticité du patrimoine marocain et la technologie du futur.<br>☕ Passionnée de culture, de mode et de conversations chaleureuses.<br>📍 Marrakech / Maroc 🇲🇦',
        moments_tab: 'Moments'
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
        day01_morning_time: 'Hoy · 7:00 AM',
        day01_morning_location: 'Chefchaouen — La ciudad azul',
        day01_morning_caption: 'Chefchaouen se viste de azul desde la mañana 💙<br>Cada callejón aquí guarda su propia historia.<br>Los colores de la ciudad forman parte de su identidad visual.<br>Hoy combiné un blazer moderno con un toque marroquí.<br>¿Funcionó el look? Yo diría que sí… sin falsa modestia 😂<br>El reto y la votación están en la Story 👀',
        day01_evening_time: 'Hoy · 7:00 PM',
        day01_evening_location: 'Esauira — El puerto y la medina antigua',
        day01_evening_caption: 'En Esauira, hasta el viento tiene carácter propio 😂🌊<br>La ciudad es conocida por su brisa marina, su puerto y sus murallas.<br>Cada detalle aquí convierte un paseo en una nueva historia.<br>Probé un look arena con bordado marroquí ligero.<br>Cómodo para salir, no solo para ocasiones especiales.<br>Pregunta de la noche: ¿qué te parece el look de hoy? 🌙',

        /* Story */
        open_story_aria: 'Abrir la Story de Robaty',
        close_story_aria: 'Cerrar',
        prev_story_aria: 'Story anterior',
        next_story_aria: 'Story siguiente',
        story_morning_aria: 'Abrir la Story de la mañana',
        story_evening_aria: 'Abrir la Story de la noche',
        story_morning_kicker: 'Vota con Robaty ✨',
        story_morning_question: '¿Cómo combinarías este look?',
        story_morning_option_a: 'A — con pantalón blanco amplio 🤍',
        story_morning_option_b: 'B — con jeans azules 👖',
        story_morning_result: '¡Buena elección! Haremos que el resultado forme parte de la experiencia Robaty ✨',
        story_evening_kicker: 'Reto Robaty 👑',
        story_evening_question: '¿Dónde pasarías este momento?',
        story_evening_option_a: 'A — un momento tranquilo junto al mar 🌊',
        story_evening_option_b: 'B — un paseo por la medina antigua 🧿',
        story_evening_result: 'Tu elección llegó hasta Robaty ✨',

        /* Profile */
        back_aria: 'Atrás',
        profile_tagline: '🇲🇦 La primera compañera de IA marroquí',
        chat_with_me_btn: 'Chatea conmigo',
        follow_btn: 'Seguir',
        stat_moments: 'Momentos',
        stat_followers: 'Seguidores',
        stat_engagement: 'Interacción',
        profile_bio: '✨ Une la autenticidad del patrimonio marroquí con la tecnología del futuro.<br>☕ Amante de la cultura, la moda y las charlas cálidas.<br>📍 Marrakech / Marruecos 🇲🇦',
        moments_tab: 'Momentos'
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
        day01_morning_time: 'Сегодня · 07:00',
        day01_morning_location: 'Шефшауэн — Голубой город',
        day01_morning_caption: 'Шефшауэн с самого утра одевается в синий 💙<br>У каждой улочки здесь своя маленькая история.<br>Цвета города стали частью его визуальной идентичности.<br>Сегодня я собрала современный блейзер с марокканскими нотками.<br>Получился ли образ? Скажу честно — да, и горжусь этим 😂<br>Испытание и голосование — в Story 👀',
        day01_evening_time: 'Сегодня · 19:00',
        day01_evening_location: 'Эс-Сувейра — порт и старая медина',
        day01_evening_caption: 'В Эс-Сувейре даже у ветра есть характер 😂🌊<br>Город известен морским бризом, портом и крепостными стенами.<br>Каждая деталь здесь превращает прогулку в новую историю.<br>Я попробовала песочный образ с лёгкой марокканской вышивкой.<br>Удобно для прогулок, а не только для особых случаев.<br>Вечерний вопрос: как вам сегодняшний образ? 🌙',

        /* Story */
        open_story_aria: 'Открыть Story Robaty',
        close_story_aria: 'Закрыть',
        prev_story_aria: 'Предыдущая Story',
        next_story_aria: 'Следующая Story',
        story_morning_aria: 'Открыть утреннюю Story',
        story_evening_aria: 'Открыть вечернюю Story',
        story_morning_kicker: 'Голосуй с Robaty ✨',
        story_morning_question: 'Как бы ты собрала этот образ?',
        story_morning_option_a: 'A — с широкими белыми брюками 🤍',
        story_morning_option_b: 'B — с синими джинсами 👖',
        story_morning_result: 'Отличный выбор! Результат станет частью опыта Robaty ✨',
        story_evening_kicker: 'Испытание от Robaty 👑',
        story_evening_question: 'Где бы ты провела этот момент?',
        story_evening_option_a: 'A — спокойно у моря 🌊',
        story_evening_option_b: 'B — прогулка по старой медине 🧿',
        story_evening_result: 'Твой выбор дошёл до Robaty ✨',

        /* Profile */
        back_aria: 'Назад',
        profile_tagline: '🇲🇦 Первая марокканская ИИ-подруга',
        chat_with_me_btn: 'Написать мне',
        follow_btn: 'Подписаться',
        stat_moments: 'Моменты',
        stat_followers: 'Подписчики',
        stat_engagement: 'Активность',
        profile_bio: '✨ Соединяет подлинность марокканского наследия с технологиями будущего.<br>☕ Любит культуру, моду и тёплые разговоры.<br>📍 Марракеш / Марокко 🇲🇦',
        moments_tab: 'Моменты'
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


/* تطبيق النصوص المترجمة على كل عنصر فيه data-i18n-* */

function applyTranslations(lang) {

    const dict = translations[lang] || translations.ar;

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


/* رسم أزرار اختيار اللغة جوا الإعدادات (إلا كان الحاوية موجودة فالصفحة) */

function renderLanguageOptions(activeLang) {

    const container = document.getElementById('languageOptions');
    if (!container) return;

    container.innerHTML = '';

    SUPPORTED_LANGS.forEach(code => {

        const btn = document.createElement('button');

        btn.type = 'button';
        btn.className = 'lang-option' + (code === activeLang ? ' active' : '');
        btn.textContent = LANG_NATIVE_NAMES[code];
        btn.setAttribute('data-lang', code);

        btn.addEventListener('click', () => setLanguage(code));

        container.appendChild(btn);

    });

}


/* تبديل اللغة: حفظ + تطبيق اتجاه + تطبيق ترجمات + تحديث الأزرار */

function setLanguage(lang) {

    if (!SUPPORTED_LANGS.includes(lang)) return;

    saveLang(lang);
    applyDirection(lang);
    applyTranslations(lang);
    renderLanguageOptions(lang);

}


/* بناء storyData (اللي كيستعملها story.js) من الترجمات الحالية */

const STORY_IMAGES = {
    'day01-morning': 'day01-chefchaouen-morning.jpg',
    'day01-evening': 'day01-essaouira-evening.jpg'
};

function getStoryData(lang) {

    const dict = translations[lang] || translations.ar;

    return {
        'day01-morning': {
            image: STORY_IMAGES['day01-morning'],
            time: dict.day01_morning_time,
            kicker: dict.story_morning_kicker,
            question: dict.story_morning_question,
            options: [
                ['white', dict.story_morning_option_a],
                ['jeans', dict.story_morning_option_b]
            ],
            result: dict.story_morning_result
        },
        'day01-evening': {
            image: STORY_IMAGES['day01-evening'],
            time: dict.day01_evening_time,
            kicker: dict.story_evening_kicker,
            question: dict.story_evening_question,
            options: [
                ['sea', dict.story_evening_option_a],
                ['medina', dict.story_evening_option_b]
            ],
            result: dict.story_evening_result
        }
    };

}


/* API بسيط لباقي الملفات (app.js، story.js) */

window.RobatyI18n = {
    t: function (key) {
        const lang = getCurrentLang();
        const dict = translations[lang] || translations.ar;
        if (dict[key] !== undefined) return dict[key];
        if (translations.ar[key] !== undefined) return translations.ar[key];
        return key;
    },
    getCurrentLang: getCurrentLang,
    getStoryData: getStoryData
};


/* البداية */

document.addEventListener('DOMContentLoaded', () => {

    const lang = getCurrentLang();

    applyDirection(lang);
    applyTranslations(lang);
    renderLanguageOptions(lang);

    if (!getSavedLang()) saveLang(lang);

});
