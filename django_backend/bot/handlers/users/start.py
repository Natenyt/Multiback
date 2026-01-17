from aiogram import types
from aiogram.filters import CommandStart
from asgiref.sync import sync_to_async
from loader import dp
from users.models import TelegramConnection
from bot.states.registration import RegistrationFSM
from bot.keyboards.inline.language import language_keyboard
from bot.keyboards.default.menu import get_main_menu_keyboard
from bot.utils.i18n import get_text

@dp.message(CommandStart())
async def bot_start(message: types.Message, state):
    telegram_id = message.from_user.id
    
    # Check for existing user.
    connection = await sync_to_async(TelegramConnection.objects.filter(telegram_chat_id=telegram_id).select_related('user').first)()
    
    if connection:
        lang = connection.language_preference
        welcome_text = get_text("welcome_back", lang).format(name=connection.user.full_name)
        await message.answer(welcome_text, reply_markup=get_main_menu_keyboard(lang))
    else:
        # New user: show welcome and language selection.
        welcome_text = get_text("welcome", "uz")
        await message.answer(welcome_text)
        await message.answer(get_text("select_language", "uz"), reply_markup=language_keyboard)
        await state.set_state(RegistrationFSM.language)
