// ⚠️ بدلي هاد القيم بالـ config الحقيقي اللي عطاتك Firebase (خطوة 6 فالتعليمات)
// نسخي بالضبط من console.firebase.google.com → Project settings → Your apps

var firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

firebase.initializeApp(firebaseConfig);
