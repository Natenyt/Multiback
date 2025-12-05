from aiogram.fsm.state import StatesGroup, State

class RegistrationFSM(StatesGroup):
    language = State()
    fullname = State()
    phone = State()
    neighborhood = State()
    location = State()
