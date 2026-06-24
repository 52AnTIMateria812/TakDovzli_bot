import telebot
from telebot.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import json
import os
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла (на уровень выше, т.к. бот в папке backend)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Токен теперь берется из .env
TOKEN = os.getenv('BOT_TOKEN')
if not TOKEN:
    raise ValueError("Не найден BOT_TOKEN в файле .env")
# ВАЖНО: Telegram требует, чтобы Web App был доступен по протоколу HTTPS.
# Для локального тестирования вы можете использовать утилиту ngrok:
# 1. Запустите в этой папке локальный сервер: python -m http.server 8000
# 2. В другом терминале запустите ngrok: ngrok http 8000
# 3. Скопируйте HTTPS ссылку, которую выдаст ngrok, и вставьте её сюда:
WEBAPP_URL = "https://your-ngrok-url.ngrok-free.app" 

bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start_handler(message):
    # Создаем клавиатуру с кнопкой Web App
    markup = ReplyKeyboardMarkup(resize_keyboard=True)
    # Кнопка, открывающая наше мини-приложение
    web_app_btn = KeyboardButton(
        text="🛍 Открыть магазин", 
        web_app=WebAppInfo(url=WEBAPP_URL)
    )
    markup.add(web_app_btn)

    bot.send_message(
        message.chat.id, 
        "Добро пожаловать в магазин ТАК ДОВЕЗЛИ!\n\nНажмите на кнопку ниже, чтобы открыть каталог товаров.",
        reply_markup=markup
    )

@bot.message_handler(content_types=['web_app_data'])
def web_app_data_handler(message):
    """
    Этот хэндлер ловит данные, которые отправляются из Web App 
    с помощью метода tg.sendData(...)
    """
    try:
        # Парсим JSON данные, пришедшие из корзины
        data = json.loads(message.web_app_data.data)
        
        name = data.get('name', 'Не указано')
        phone = data.get('phone', 'Не указан')
        address = data.get('address', 'Не указан')
        comment = data.get('comment', 'Нет комментария')
        items = data.get('items', [])
        total = data.get('total', 0)

        # Формируем красивое сообщение с заказом
        order_text = f"🆕 <b>Новый заказ!</b>\n\n"
        order_text += f"👤 <b>Покупатель:</b> {name}\n"
        order_text += f"📞 <b>Телефон:</b> {phone}\n"
        order_text += f"📍 <b>Адрес:</b> {address}\n"
        order_text += f"📝 <b>Комментарий:</b> {comment}\n\n"
        order_text += f"🛒 <b>Корзина:</b>\n"
        
        for item in items:
            # item содержит id и qty. В реальном проекте мы бы брали названия из БД по id.
            # Здесь мы просто выводим id и количество для примера.
            order_text += f"- Товар ID {item['id']} x {item['qty']} шт.\n"
            
        order_text += f"\n💰 <b>Итого к оплате:</b> {total} ₽"

        # Отправляем подтверждение пользователю
        bot.send_message(message.chat.id, order_text, parse_mode='HTML')
        
        # Убираем клавиатуру или отправляем сообщение "Заказ принят"
        # markup = ReplyKeyboardRemove()
        # bot.send_message(message.chat.id, "Ваш заказ успешно оформлен! Мы скоро с вами свяжемся.", reply_markup=markup)

    except Exception as e:
        bot.send_message(message.chat.id, f"Произошла ошибка при обработке заказа: {e}")

if __name__ == '__main__':
    print("Бот запущен...")
    bot.polling(none_stop=True)
