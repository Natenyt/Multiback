from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from bot.utils.i18n import get_text

def get_main_menu_keyboard(lang='uz'):
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=get_text("send_new_message_btn", lang)),
            ],
            [
                KeyboardButton(text=get_text("news_btn", lang)),
                KeyboardButton(text=get_text("change_language_btn", lang)),
            ],
        ],
        resize_keyboard=True
    )

def get_phone_keyboard(lang='uz'):
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=get_text("share_phone_btn", lang), request_contact=True)
            ],
        ],
        resize_keyboard=True
    )

def get_location_keyboard(lang='uz'):
    # Location request is usually just text input based on the prompt, 
    # but if we wanted a button to send location:
    # KeyboardButton(text="📍 Share Location", request_location=True)
    # The prompt says "Please describe your exact location", so it implies text input.
    # But we need a Back button.
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=get_text("back_btn", lang))
            ]
        ],
        resize_keyboard=True
    )

def get_back_keyboard(lang='uz'):
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=get_text("back_btn", lang))
            ]
        ],
        resize_keyboard=True
    )

def get_ticket_keyboard(lang='uz'):
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=get_text("finished_btn", lang)),
                KeyboardButton(text=get_text("cancel_btn", lang)),
            ]
        ],
        resize_keyboard=True
    )

def get_neighborhood_keyboard(neighborhoods, lang='uz'):
    keyboard = []
    row = []
    for n in neighborhoods:
        # Use name_uz or name_ru based on lang, fallback to name_uz
        name = n.name_uz
        if lang == 'ru' and n.name_ru:
            name = n.name_ru
            
        row.append(KeyboardButton(text=name))
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    
    keyboard.append([KeyboardButton(text=get_text("back_btn", lang))])
    
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)
