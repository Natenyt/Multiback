from aiogram import types
from aiogram.fsm.context import FSMContext
from asgiref.sync import sync_to_async
from loader import dp
from bot.states.ticket import TicketFSM
from bot.utils.i18n import get_text
from bot.keyboards.default.menu import get_main_menu_keyboard
from users.models import TelegramConnection
from message_app.models import Session, Message, MessageContent
from support_tools.ai_client import send_to_ai_service
from django.conf import settings
from django.urls import reverse
import httpx
import logging

logger = logging.getLogger(__name__)

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
        if not connection:
            await message.answer(get_text("error_generic", lang), reply_markup=get_main_menu_keyboard(lang))
            await state.clear()
            return
        
        user = connection.user
        
        @sync_to_async
        def create_session_and_message(user_obj, text_content):
            try:
                # Find open session (status should be 'unassigned' or 'assigned', not 'open')
                session = Session.objects.filter(citizen=user_obj, status__in=['unassigned', 'assigned']).first()
                if not session:
                    session = Session.objects.create(citizen=user_obj, status='unassigned', origin='telegram')
                
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
            def check_if_needs_routing(session_obj):
                # Reload to ensure we have latest state if needed
                session_obj.refresh_from_db()
                return session_obj.assigned_department

            assigned_dept = await check_if_needs_routing(session)
            
            if assigned_dept:
                # Direct Route - Call API endpoint instead of AI
                async def call_route_api():
                    try:
                        # Construct API URL
                        base_url = getattr(settings, 'API_BASE_URL', 'http://localhost:8000/api')
                        webhook_url = f"{base_url}/ai/route_message/"
                        
                        route_payload = {
                            "department_id": assigned_dept.id,
                            "session_uuid": str(session.session_uuid),
                            "message_uuid": str(msg_uuid)
                        }
                        
                        async with httpx.AsyncClient() as client:
                            response = await client.post(webhook_url, json=route_payload, timeout=5.0)
                            if response.status_code == 200:
                                logger.info(f"Successfully routed message {msg_uuid} to department {assigned_dept.id}")
                                return True
                            else:
                                logger.error(f"Failed to route message: {response.status_code} - {response.text}")
                                return False
                    except Exception as e:
                        logger.error(f"Error calling route API: {e}")
                        return False
                
                await call_route_api()
                # Message was automatically routed to the existing assigned department
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


# Handler for photos/images from citizens with active sessions
@dp.message(lambda msg: msg.photo is not None or msg.document is not None)
async def handle_citizen_media_in_active_session(message: types.Message, state: FSMContext):
    """
    Handle photos/images/files from citizens who have active sessions with assigned staff.
    """
    telegram_id = message.from_user.id
    
    # Skip if user is in FSM state
    current_state = await state.get_state()
    if current_state is not None:
        return
    
    # Check if user has an active session
    @sync_to_async
    def get_active_session(telegram_id):
        try:
            connection = TelegramConnection.objects.filter(
                telegram_chat_id=telegram_id
            ).select_related('user').first()
            
            if not connection:
                return None
            
            session = Session.objects.filter(
                citizen=connection.user,
                status__in=['assigned', 'unassigned'],
                origin='telegram'
            ).select_related('assigned_department').first()
            
            return session, connection.user
        except Exception as e:
            logger.error(f"Error getting active session: {e}")
            return None
    
    result = await get_active_session(telegram_id)
    if not result:
        return
    
    session, user = result
    
    # Only process if session has assigned_department
    if not session.assigned_department:
        return
    
    # Download and save media
    @sync_to_async
    def create_citizen_media_message(user_obj, session_obj, photo=None, document=None, caption=None):
        try:
            from django.core.files.base import ContentFile
            import requests
            from django.conf import settings
            
            # Create Message
            msg = Message.objects.create(
                session=session_obj,
                sender=user_obj,
                is_staff_message=False,
                sender_platform='telegram'
            )
            
            # Handle photo
            if photo:
                # Get the largest photo size
                largest_photo = max(photo, key=lambda p: p.file_size) if isinstance(photo, list) else photo
                file_id = largest_photo.file_id
                
                # Download photo from Telegram
                bot_token = getattr(settings, "TOKEN_BOT", None) or getattr(settings, "TELEGRAM_BOT_TOKEN", None)
                if bot_token:
                    # Get file info
                    file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
                    file_info = requests.get(file_info_url, timeout=15).json()
                    
                    if file_info.get('ok'):
                        file_path = file_info['result']['file_path']
                        file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
                        
                        # Download file
                        file_response = requests.get(file_url, timeout=30)
                        if file_response.status_code == 200:
                            # Determine file extension
                            ext = file_path.split('.')[-1] if '.' in file_path else 'jpg'
                            filename = f"telegram_photo_{msg.message_uuid}.{ext}"
                            
                            # Save to MessageContent
                            content = MessageContent.objects.create(
                                message=msg,
                                content_type='image',
                                caption=caption,
                                telegram_file_id=file_id
                            )
                            
                            # Save file
                            content.file.save(
                                filename,
                                ContentFile(file_response.content),
                                save=True
                            )
                            
                            return msg.message_uuid
            
            # Handle document
            if document:
                file_id = document.file_id
                bot_token = getattr(settings, "TOKEN_BOT", None) or getattr(settings, "TELEGRAM_BOT_TOKEN", None)
                if bot_token:
                    file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
                    file_info = requests.get(file_info_url, timeout=15).json()
                    
                    if file_info.get('ok'):
                        file_path = file_info['result']['file_path']
                        file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
                        
                        file_response = requests.get(file_url, timeout=60)
                        if file_response.status_code == 200:
                            filename = document.file_name or f"telegram_file_{msg.message_uuid}"
                            
                            # Determine content type
                            mime_type = getattr(document, 'mime_type', 'application/octet-stream')
                            if mime_type.startswith('image/'):
                                content_type = 'image'
                            elif mime_type.startswith('video/'):
                                content_type = 'video'
                            else:
                                content_type = 'file'
                            
                            content = MessageContent.objects.create(
                                message=msg,
                                content_type=content_type,
                                caption=caption,
                                telegram_file_id=file_id
                            )
                            
                            content.file.save(
                                filename,
                                ContentFile(file_response.content),
                                save=True
                            )
                            
                            return msg.message_uuid
            
            return None
        except Exception as e:
            logger.error(f"Error creating citizen media message: {e}")
            raise e
    
    try:
        photo = message.photo
        document = message.document
        caption = message.caption
        
        msg_uuid = await create_citizen_media_message(user, session, photo=photo, document=document, caption=caption)
        
        if msg_uuid:
            # Route the message using the API
            async def route_citizen_message():
                try:
                    base_url = getattr(settings, 'API_BASE_URL', 'http://localhost:8000/api')
                    webhook_url = f"{base_url}/ai/route_message/"
                    
                    route_payload = {
                        "department_id": session.assigned_department.id,
                        "session_uuid": str(session.session_uuid),
                        "message_uuid": str(msg_uuid)
                    }
                    
                    async with httpx.AsyncClient() as client:
                        response = await client.post(webhook_url, json=route_payload, timeout=5.0)
                        if response.status_code == 200:
                            logger.info(f"Successfully routed citizen media message {msg_uuid} to department {session.assigned_department.id}")
                            return True
                        else:
                            logger.error(f"Failed to route citizen media message: {response.status_code} - {response.text}")
                            return False
                except Exception as e:
                    logger.error(f"Error calling route API for citizen media message: {e}")
                    return False
            
            await route_citizen_message()
        
    except Exception as e:
        logger.error(f"Error handling citizen media in active session: {e}")


# Handler for messages from citizens with active sessions (when staff is assigned)
# This runs when user is NOT in FSM state and has an active session
# Note: This handler has lower priority than FSM handlers due to no FSM filter
@dp.message(lambda msg: msg.text is not None)  # Only catch text messages
async def handle_citizen_message_in_active_session(message: types.Message, state: FSMContext):
    """
    Handle messages from citizens who have active sessions with assigned staff.
    These messages should be saved and routed to the assigned department.
    """
    telegram_id = message.from_user.id
    
    # Skip if user is in FSM state (FSM handlers should take precedence)
    current_state = await state.get_state()
    if current_state is not None:
        return  # Let FSM handlers process it
    
    # Skip menu button clicks
    menu_texts = [
        "📝 Yangi xabar yuborish", "📝 Отправить новое сообщение",
        "❌ Bekor qilish", "❌ Отмена",
        "✅ Tugallash", "✅ Завершить"
    ]
    if message.text in menu_texts:
        return  # Let menu handlers process it
    
    # Check if user has an active session
    @sync_to_async
    def get_active_session(telegram_id):
        try:
            connection = TelegramConnection.objects.filter(
                telegram_chat_id=telegram_id
            ).select_related('user').first()
            
            if not connection:
                return None
            
            # Find active session (assigned or unassigned, not closed)
            session = Session.objects.filter(
                citizen=connection.user,
                status__in=['assigned', 'unassigned'],
                origin='telegram'
            ).select_related('assigned_department').first()
            
            return session, connection.user
        except Exception as e:
            logger.error(f"Error getting active session: {e}")
            return None
    
    result = await get_active_session(telegram_id)
    if not result:
        return  # No active session, let other handlers process
    
    session, user = result
    
    # Only process if session has assigned_department (staff is connected)
    if not session.assigned_department:
        return  # No department assigned yet, skip
    
    # Extract message text
    text = message.text
    if not text:
        # For non-text messages (photos, files, etc.), we could handle them later
        # For now, just skip
        return
    
    # Create message in database
    @sync_to_async
    def create_citizen_message(user_obj, session_obj, text_content):
        try:
            # Create Message
            msg = Message.objects.create(
                session=session_obj,
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
            
            return msg.message_uuid
        except Exception as e:
            logger.error(f"Error creating citizen message: {e}")
            raise e
    
    try:
        msg_uuid = await create_citizen_message(user, session, text)
        
        # Route the message using the API
        async def route_citizen_message():
            try:
                base_url = getattr(settings, 'API_BASE_URL', 'http://localhost:8000/api')
                webhook_url = f"{base_url}/ai/route_message/"
                
                route_payload = {
                    "department_id": session.assigned_department.id,
                    "session_uuid": str(session.session_uuid),
                    "message_uuid": str(msg_uuid)
                    # intent_label is optional, so we don't include it
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(webhook_url, json=route_payload, timeout=5.0)
                    if response.status_code == 200:
                        logger.info(f"Successfully routed citizen message {msg_uuid} to department {session.assigned_department.id}")
                        return True
                    else:
                        logger.error(f"Failed to route citizen message: {response.status_code} - {response.text}")
                        return False
            except Exception as e:
                logger.error(f"Error calling route API for citizen message: {e}")
                return False
        
        await route_citizen_message()
        
        # Don't send any response to user - they can continue messaging naturally
        
    except Exception as e:
        logger.error(f"Error handling citizen message in active session: {e}")
        # Silently fail - don't interrupt user experience
