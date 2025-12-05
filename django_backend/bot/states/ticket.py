from aiogram.fsm.state import StatesGroup, State

class TicketFSM(StatesGroup):
    collecting_content = State()
