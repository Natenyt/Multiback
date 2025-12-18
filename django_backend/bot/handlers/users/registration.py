from aiogram import types, F
from aiogram.fsm.context import FSMContext
from asgiref.sync import sync_to_async
from loader import dp
from bot.states.registration import RegistrationFSM
from bot.keyboards.default.menu import get_phone_keyboard, get_neighborhood_keyboard, get_location_keyboard, get_main_menu_keyboard, get_back_keyboard
from bot.utils.i18n import get_text
from users.models import User, TelegramConnection
from support_tools.models import Neighborhood

@dp.callback_query(RegistrationFSM.language)
async def select_language(call: types.CallbackQuery, state: FSMContext):
    lang = call.data.split("_")[1]
    await state.update_data(language=lang)
    
    await call.message.delete()
    await call.message.answer(get_text("enter_fullname", lang), reply_markup=get_back_keyboard(lang))
    await state.set_state(RegistrationFSM.fullname)

@dp.message(RegistrationFSM.fullname)
async def enter_fullname(message: types.Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language")
    
    if message.text == get_text("back_btn", lang):
        from bot.keyboards.inline.language import language_keyboard
        await message.answer(get_text("select_language", "uz"), reply_markup=language_keyboard)
        await state.set_state(RegistrationFSM.language)
        return

    # Validate full name length (minimum 9 characters)
    if len(message.text.strip()) < 9:
        await message.answer(get_text("invalid_fullname", lang), reply_markup=get_back_keyboard(lang))
        return

    await state.update_data(fullname=message.text)
    await message.answer(get_text("share_phone", lang), reply_markup=get_phone_keyboard(lang))
    await state.set_state(RegistrationFSM.phone)

@dp.message(RegistrationFSM.phone)
async def enter_phone(message: types.Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language")
    
    if message.text == get_text("back_btn", lang):
        await message.answer(get_text("enter_fullname", lang), reply_markup=get_back_keyboard(lang))
        await state.set_state(RegistrationFSM.fullname)
        return

    # Strict Check: Must be a contact
    if not message.contact:
        await message.answer(get_text("share_phone", lang), reply_markup=get_phone_keyboard(lang))
        return

    # Clean phone number
    raw_phone = message.contact.phone_number
    phone = raw_phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    # Ensure it starts with + if missing (Telegram sometimes sends without +)
    if not phone.startswith("+"):
        phone = "+" + phone

    await state.update_data(phone=phone)
    
    # Fetch neighborhoods
    neighborhoods = await sync_to_async(list)(Neighborhood.objects.filter(is_active=True))
    
    await message.answer(get_text("select_neighborhood", lang), reply_markup=get_neighborhood_keyboard(neighborhoods, lang))
    await state.set_state(RegistrationFSM.neighborhood)

@dp.message(RegistrationFSM.neighborhood)
async def select_neighborhood(message: types.Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language")
    
    if message.text == get_text("back_btn", lang):
        await message.answer(get_text("share_phone", lang), reply_markup=get_phone_keyboard(lang))
        await state.set_state(RegistrationFSM.phone)
        return

    # Validate that user selected from the menu, not typed
    @sync_to_async
    def validate_neighborhood(neighborhood_text):
        # Check if the text matches any active neighborhood name (name_uz or name_ru)
        neighborhoods = Neighborhood.objects.filter(is_active=True)
        for n in neighborhoods:
            if n.name_uz == neighborhood_text:
                return True
            if n.name_ru and n.name_ru == neighborhood_text:
                return True
        return False
    
    is_valid = await validate_neighborhood(message.text)
    
    if not is_valid:
        # Re-fetch neighborhoods to show the keyboard again
        neighborhoods = await sync_to_async(list)(Neighborhood.objects.filter(is_active=True))
        await message.answer(get_text("invalid_neighborhood", lang), reply_markup=get_neighborhood_keyboard(neighborhoods, lang))
        return
    
    # Store chosen neighborhood and COMPLETE registration without asking for a free-text location
    await state.update_data(neighborhood=message.text)

    # Fetch latest state data
    data = await state.get_data()
    fullname = data.get("fullname")
    phone = data.get("phone")
    neighborhood_name = data.get("neighborhood")
    language = data.get("language")

    telegram_id = message.from_user.id
    telegram_username = message.from_user.username

    # We no longer ask for full-text location; treat it as empty/optional
    location = ""

    @sync_to_async
    def create_user_and_connection():
        # Look up the Neighborhood instance by name (try name_uz first, then name_ru)
        neighborhood_obj = None
        if neighborhood_name:
            try:
                neighborhood_obj = Neighborhood.objects.filter(is_active=True).get(name_uz=neighborhood_name)
            except Neighborhood.DoesNotExist:
                try:
                    neighborhood_obj = Neighborhood.objects.filter(is_active=True).get(name_ru=neighborhood_name)
                except Neighborhood.DoesNotExist:
                    # If not found, just continue without neighborhood
                    pass

        user, created = User.objects.get_or_create(
            phone_number=phone,
            defaults={
                "full_name": fullname,
                "neighborhood": neighborhood_obj,
                "location": location,
            },
        )
        if not created:
            # Update info if needed
            user.full_name = fullname
            user.neighborhood = neighborhood_obj
            user.location = location
            user.save()

        TelegramConnection.objects.create(
            user=user,
            telegram_chat_id=telegram_id,
            telegram_username=telegram_username,
            language_preference=language,
        )
        return user

    try:
        await create_user_and_connection()
        await message.answer(get_text("main_menu", language), reply_markup=get_main_menu_keyboard(language))
        await state.clear()
    except Exception as e:
        await message.answer(f"Error: {e}")

@dp.message(RegistrationFSM.location)
async def enter_location(message: types.Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language")
    
    if message.text == get_text("back_btn", lang):
        neighborhoods = await sync_to_async(list)(Neighborhood.objects.filter(is_active=True))
        await message.answer(get_text("select_neighborhood", lang), reply_markup=get_neighborhood_keyboard(neighborhoods, lang))
        await state.set_state(RegistrationFSM.neighborhood)
        return

    location = message.text
    # Save everything
    fullname = data.get("fullname")
    phone = data.get("phone")
    neighborhood_name = data.get("neighborhood")  # This is the text name, not the instance
    language = data.get("language")
    
    telegram_id = message.from_user.id
    telegram_username = message.from_user.username
    
    # Create User and Connection
    # We need to be careful about phone uniqueness. 
    # If user exists with phone, we link. If not, we create.
    
    @sync_to_async
    def create_user_and_connection():
        # Look up the Neighborhood instance by name (try name_uz first, then name_ru)
        neighborhood_obj = None
        if neighborhood_name:
            try:
                # Try to find by name_uz first
                neighborhood_obj = Neighborhood.objects.filter(is_active=True).get(name_uz=neighborhood_name)
            except Neighborhood.DoesNotExist:
                try:
                    # Fallback to name_ru
                    neighborhood_obj = Neighborhood.objects.filter(is_active=True).get(name_ru=neighborhood_name)
                except Neighborhood.DoesNotExist:
                    # If not found, just log and continue without neighborhood
                    pass
        
        user, created = User.objects.get_or_create(
            phone_number=phone,
            defaults={
                'full_name': fullname,
                'neighborhood': neighborhood_obj,
                'location': location
            }
        )
        if not created:
            # Update info if needed
            user.full_name = fullname
            user.neighborhood = neighborhood_obj
            user.location = location
            user.save()
            
        TelegramConnection.objects.create(
            user=user,
            telegram_chat_id=telegram_id,
            telegram_username=telegram_username,
            language_preference=language
        )
        return user

    try:
        user = await create_user_and_connection()
        await message.answer(get_text("main_menu", language), reply_markup=get_main_menu_keyboard(language))
        await state.clear()
    except Exception as e:
        # Handle phone unique constraint violation if user tries to register with existing phone 
        # but from different telegram account? Or if connection already exists?
        # For now simple error handling
        await message.answer(f"Error: {e}")

