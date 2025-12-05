MESSAGES = {
    "select_language": {
        "uz": "Iltimos, tilni tanlang",
        "ru": "Пожалуйста, выберите язык"
    },
    "enter_fullname": {
        "uz": "Iltimos, to'liq ismingizni kiriting",
        "ru": "Пожалуйста, введите ваше полное имя"
    },
    "share_phone": {
        "uz": "Iltimos, telefon raqamingizni ulashing",
        "ru": "Пожалуйста, поделитесь своим номером телефона"
    },
    "share_phone_btn": {
        "uz": "📱 Telefon raqamni ulashish",
        "ru": "📱 Поделиться номером телефона"
    },
    "select_neighborhood": {
        "uz": "Iltimos, mahallangizni tanlang",
        "ru": "Пожалуйста, выберите вашу махаллю"
    },
    "enter_location": {
        "uz": "Iltimos, aniq manzilingizni tasvirlab bering. Misol: Amir Temur ko'chasi, 45-uy...",
        "ru": "Пожалуйста, опишите ваше точное местоположение. Пример: улица Амира Темура, дом 45..."
    },
    "back_btn": {
        "uz": "🔙 Orqaga",
        "ru": "🔙 Назад"
    },
    "main_menu": {
        "uz": "Asosiy menyu",
        "ru": "Главное меню"
    },
    "send_new_message_btn": {
        "uz": "📝 Yangi xabar yuborish",
        "ru": "📝 Отправить новое сообщение"
    },
    "website_btn": {
        "uz": "🌐 Veb-sayt",
        "ru": "🌐 Веб-сайт"
    },
    "news_btn": {
        "uz": "📰 Yangiliklar",
        "ru": "📰 Новости"
    },
    "change_language_btn": {
        "uz": "⚙️ Tilni o'zgartirish",
        "ru": "⚙️ Изменить язык"
    },
    "website_url": {
        "uz": "Bizning veb-saytimiz: https://example.com",
        "ru": "Наш веб-сайт: https://example.com"
    },
    "no_news": {
        "uz": "Hozircha yangiliklar yo'q.",
        "ru": "На данный момент новостей нет."
    },
    "staff_only": {
        "uz": "Iltimos, veb-boshqaruv panelidan foydalaning.",
        "ru": "Пожалуйста, используйте веб-панель управления."
    },
    "write_ticket": {
        "uz": "Xabaringizni quyida yozing. Siz bir nechta matn yuborishingiz mumkin. Yuborish uchun 'Tugatish' yoki to'xtatish uchun 'Bekor qilish' tugmasini bosing.",
        "ru": "Напишите ваше сообщение ниже. Вы можете отправить несколько текстов. Нажмите 'Завершить', чтобы отправить, или 'Отменить', чтобы остановить."
    },
    "finished_btn": {
        "uz": "✅ Tugatish",
        "ru": "✅ Завершить"
    },
    "cancel_btn": {
        "uz": "❌ Bekor qilish",
        "ru": "❌ Отменить"
    },
    "ticket_too_short": {
        "uz": "Xabar juda qisqa. Iltimos, batafsilroq yozing (kamida 20 belgi).",
        "ru": "Сообщение слишком короткое. Пожалуйста, напишите подробнее (минимум 20 символов)."
    },
    "ticket_received": {
        "uz": "Sizning so'rovingiz qabul qilindi. Operator javobini kuting.",
        "ru": "Ваш запрос принят. Ожидайте ответа оператора."
    },
    "cancelled": {
        "uz": "Bekor qilindi.",
        "ru": "Отменено."
    }
}

def get_text(key, lang='uz'):
    return MESSAGES.get(key, {}).get(lang, MESSAGES.get(key, {}).get('uz', key))
