from aiogram import types, F
from asgiref.sync import sync_to_async
from loader import dp
from bot.keyboards.default.menu import get_main_menu_keyboard, get_ticket_keyboard
from bot.keyboards.inline.language import language_keyboard
from bot.utils.i18n import get_text
from users.models import TelegramConnection
from departments.models import StaffProfile
from bot.states.ticket import TicketFSM
from bot.states.registration import RegistrationFSM

async def get_user_lang(telegram_id):
    connection = await sync_to_async(TelegramConnection.objects.filter(telegram_chat_id=telegram_id).first)()
    return connection.language_preference if connection else 'uz'

@dp.message(lambda message: message.text in ["🌐 Veb-sayt", "🌐 Веб-сайт"])
async def website_handler(message: types.Message):
    lang = await get_user_lang(message.from_user.id)
    await message.answer(get_text("website_url", lang))

@dp.message(lambda message: message.text in ["📰 Yangiliklar", "📰 Новости"])
async def news_handler(message: types.Message):
    lang = await get_user_lang(message.from_user.id)
    await message.answer(get_text("no_news", lang))

@dp.message(lambda message: message.text in ["⚙️ Tilni o'zgartirish", "⚙️ Изменить язык"])
async def change_language_handler(message: types.Message, state):
    lang = await get_user_lang(message.from_user.id)
    await message.answer(get_text("select_language", "uz"), reply_markup=language_keyboard)
    # We can reuse the registration state or just update it directly via callback
    # Let's reuse RegistrationFSM.language but handle it slightly differently if needed
    # Actually, let's just use a callback handler that updates the DB directly if the user is already registered.
    
    # But wait, RegistrationFSM.language callback sets state to fullname. 
    # We need a separate handler for language change if we want to avoid full registration flow.
    # Or we can check state in the callback.
    
    # Let's add a specific state for changing language or just handle it in the callback with a check.
    # For simplicity, let's set a state ChangeLanguage
    pass 

@dp.callback_query(lambda c: c.data.startswith("lang_"))
async def language_callback(call: types.CallbackQuery, state):
    # This handler overlaps with registration.py
    # We need to distinguish between registration and just changing language.
    # We can check if user exists.
    
    telegram_id = call.from_user.id
    lang = call.data.split("_")[1]
    
    connection = await sync_to_async(TelegramConnection.objects.filter(telegram_chat_id=telegram_id).first)()
    
    if connection:
        # User exists, just update language
        connection.language_preference = lang
        await sync_to_async(connection.save)()
        
        await call.message.delete()
        await call.message.answer(get_text("language_changed", lang), reply_markup=get_main_menu_keyboard(lang))
    else:
        # User doesn't exist, proceed with registration
        # This should be handled by registration.py if state is RegistrationFSM.language
        # But if we didn't set state?
        # Let's ensure registration.py handles it if state is RegistrationFSM.language
        # If no state, and no user, we should probably start registration.
        pass

@dp.message(lambda message: message.text in ["📝 Yangi xabar yuborish", "📝 Отправить новое сообщение"])
async def new_message_handler(message: types.Message, state):
    lang = await get_user_lang(message.from_user.id)
    
    telegram_id = message.from_user.id
    connection = await sync_to_async(TelegramConnection.objects.filter(telegram_chat_id=telegram_id).select_related('user').first)()

    # 1) Block department staff (users linked to StaffProfile) from creating new tickets
    if connection and connection.user:
        @sync_to_async
        def is_department_staff(user_obj):
            return StaffProfile.objects.filter(user=user_obj).exists()

        if await is_department_staff(connection.user):
            # Localized warning message for staff users
            if lang == "ru":
                text = "Сотрудникам отдела нельзя пользоваться этой функцией. Пожалуйста, используйте веб-панель отдела."
            else:
                # Default to Uzbek
                text = "Bo‘lim xodimlariga bu funksiyadan foydalanishga ruxsat berilmagan. Iltimos, bo‘lim uchun veb-paneldan foydalaning."

            await message.answer(text)
            return

    # 2) For regular citizens, check if user has an existing active (unassigned or assigned, but not closed) session
    if connection and connection.user:
        from message_app.models import Session
        import logging
        logger = logging.getLogger(__name__)
        
        @sync_to_async
        def check_active_session(user_obj):
            # Check for any active session (unassigned or assigned, but not closed)
            # This prevents users from creating multiple appeals while they have an active one
            active_sessions = Session.objects.filter(
                citizen=user_obj, 
                status__in=['unassigned', 'assigned']
            )
            count = active_sessions.count()
            if count > 0:
                # Log the sessions for debugging
                session_list = list(active_sessions.values('session_uuid', 'status', 'created_at'))
                logger.info(f"Found {count} active session(s) for user {user_obj.user_uuid}: {session_list}")
            return count > 0
        
        has_active = await check_active_session(connection.user)
        if has_active:
            await message.answer(get_text("existing_active_session", lang))
            return
    
    await message.answer(get_text("write_ticket", lang), reply_markup=get_ticket_keyboard(lang))
    await state.set_state(TicketFSM.collecting_content)
    await state.update_data(messages=[])
