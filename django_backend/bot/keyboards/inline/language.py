from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

language_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(text="🇺🇿 O'zbek", callback_data="lang_uz"),
            InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang_ru"),
        ]
    ]
)
