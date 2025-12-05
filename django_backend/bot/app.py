import asyncio
import logging
import sys

from loader import dp, bot
import handlers  # noqa
import middlewares # noqa

async def main():
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("Bot stopped!")
