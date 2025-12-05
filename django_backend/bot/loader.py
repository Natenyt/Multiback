import os
import django
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from django.conf import settings

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "graveyard.settings")
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
django.setup()

# Get token from settings
BOT_TOKEN = settings.TOKEN_BOT

# Initialize bot and dispatcher
bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)
