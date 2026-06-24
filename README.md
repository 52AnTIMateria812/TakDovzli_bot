# ТАК ДОВЕЗЛИ

Telegram Mini App магазин.

## Структура проекта
- `frontend/` - Фронтенд (HTML, CSS, JS)
- `backend/` - Бэкенд (FastAPI, SQLite, pyTelegramBotAPI)

## Запуск
1. Создайте `.env` файл в корне проекта и добавьте `BOT_TOKEN=ваш_токен`.
2. Установите зависимости: `pip install -r requirements.txt` (если есть).
3. Запустите сервер: `python backend/server.py`.
4. Запустите бота: `python backend/bot.py`.
