from aiogram import types
from aiogram.fsm.context import FSMContext
from asgiref.sync import sync_to_async
from loader import dp
from bot.states.ticket import TicketFSM
from bot.utils.i18n import get_text
from bot.keyboards.default.menu import get_main_menu_keyboard
from users.models import TelegramConnection
from message_app.models import Session, Message, MessageContent
from message_app.routing import route_message
from support_tools.ai_client import send_to_ai_service

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
        def create_session_and_message(user_obj, text_content):
            try:
                # Find open session
                session = Session.objects.filter(user=user_obj, status='open').first()
                if not session:
                    session = Session.objects.create(user=user_obj, status='open')
                
                # Create Message
                msg = Message.objects.create(
                    session=session,
                    sender=user_obj,
                    is_staff_message=False,
                    sender_platform='telegram'
                )
                
                # Create Content
                MessageContent.objects.create(
                    message=msg,
                    content_type='text',
                    text=text_content
                )
                return session, msg.message_uuid
            except Exception as e:
                print(f"Error in create_session_and_message: {e}")
                raise e

        try:
            session, msg_uuid = await create_session_and_message(user, full_text)
            
            # Post-Creation Logic: Check Routing vs AI
            
            @sync_to_async
            def check_and_route(session_obj, message_uuid_str):
                # Reload to ensure we have latest state if needed
                session_obj.refresh_from_db()
                
                if session_obj.assigned_department:
                    # Direct Route - Skip AI
                    route_payload = {
                        "department_id": session_obj.assigned_department.id,
                        "session_uuid": str(session_obj.session_uuid),
                        "message_uuid": str(message_uuid_str)
                    }
                    route_message(route_payload)
                    return "routed"
                return "needs_ai"

            action = await check_and_route(session, msg_uuid)
            
            if action == "routed":
                # Message was automatically routed to the existing assigned department
                pass
            else:
                # New session or unassigned -> Send to AI Microservice
                success = await send_to_ai_service(
                    session_uuid=session.session_uuid,
                    message_uuid=msg_uuid,
                    text=full_text,
                    language=lang
                )
                if not success:
                     # Log error but don't fail the user interaction entirely if possible?
                     # For now, we notify user as requested.
                     await message.answer(get_text("error_generic", lang))
                     return

        except Exception as e:
            print(f"Handler Error: {e}")
            await message.answer(get_text("error_generic", lang))
            return
        
        await message.answer(get_text("ticket_received", lang), reply_markup=get_main_menu_keyboard(lang))
        await state.clear()
        return

    # Buffer the message
    data = await state.get_data()
    messages = data.get("messages", [])
    if message.text:
        messages.append(message.text)
    
    await state.update_data(messages=messages)
