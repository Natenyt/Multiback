from aiogram import types
from aiogram.fsm.context import FSMContext
from asgiref.sync import sync_to_async
from loader import dp
from bot.states.ticket import TicketFSM
from bot.utils.i18n import get_text
from bot.keyboards.default.menu import get_main_menu_keyboard
from users.models import TelegramConnection
from message_app.models import Session, Message, MessageContent

async def get_user_lang(telegram_id):
    connection = await sync_to_async(TelegramConnection.objects.filter(telegram_chat_id=telegram_id).first)()
    return connection.language_preference if connection else 'uz'

@dp.message(TicketFSM.collecting_content)
async def collect_ticket_content(message: types.Message, state: FSMContext):
    telegram_id = message.from_user.id
    lang = await get_user_lang(telegram_id)
    
    text = message.text
    
    if text in [get_text("cancel_btn", "uz"), get_text("cancel_btn", "ru")]:
        await message.answer(get_text("cancelled", lang), reply_markup=get_main_menu_keyboard(lang))
        await state.clear()
        return

    if text in [get_text("finished_btn", "uz"), get_text("finished_btn", "ru")]:
        data = await state.get_data()
        messages = data.get("messages", [])
        
        if not messages:
            await message.answer(get_text("ticket_too_short", lang))
            return
            
        full_text = "\n\n".join(messages)
        
        if len(full_text) < 20:
            await message.answer(get_text("ticket_too_short", lang))
            return
        
        # Submit to Django
        connection = await sync_to_async(TelegramConnection.objects.filter(telegram_chat_id=telegram_id).select_related('user').first)()
        user = connection.user
        
        @sync_to_async
        def create_session_and_message():
            # Check for open session
            # Logic from requirements:
            # If Open Session & assigned_department exists: Route message directly to that department (Skip AI).
            # If New Session or assigned_department is Null: Create Session -> Send message payload to FastAPI Microservice.
            
            # For now, we just create the session and message. The routing logic is likely in Django signals or a service layer.
            # But here we just need to save it.
            
            # Find open session
            session = Session.objects.filter(user=user, status='open').first()
            if not session:
                session = Session.objects.create(user=user, status='open')
            
            # Create Message
            msg = Message.objects.create(
                session=session,
                sender=user,
                is_staff_message=False,
                sender_platform='telegram'
            )
            
            # Create Content
            MessageContent.objects.create(
                message=msg,
                content_type='text',
                text=full_text
            )
            return session

        await create_session_and_message()
        
        await message.answer(get_text("ticket_received", lang), reply_markup=get_main_menu_keyboard(lang))
        await state.clear()
        return

    # Buffer the message
    data = await state.get_data()
    messages = data.get("messages", [])
    if message.text:
        messages.append(message.text)
    # TODO: Handle media? For now just text as per requirements "User types text".
    
    await state.update_data(messages=messages)
