# Проект: Многофункциональный Сервис

## 🚀 Быстрое развертывание БЕСПЛАТНО

### 🔥 **Запустите проект за 0₽ и 3 минуты!**

**🎁 ДОСТУПНЫ БЕСПЛАТНЫЕ ДОМЕНЫ:**
- ✅ **Vercel**: `your-project.vercel.app` (рекомендую)
- ✅ **Netlify**: `your-app.netlify.app`
- ✅ **Railway**: `your-site.railway.app`
- ✅ **Render**: `your-app.onrender.com`
- ✅ **GitHub Pages**: `username.github.io`

### ⚡ Быстрый старт:
```bash
# Шаг 1: Выберите платформу
./deploy-free.sh vercel    # Рекомендую
./deploy-free.sh netlify   # Альтернатива

# Шаг 2: Получите готовый сайт!
✅ https://your-project.vercel.app

# Шаг 3: Настройте платежи
# Обновите YooMoney с новым URL
```

**📖 Подробная инструкция:** [FREE_DOMAINS_GUIDE.md](./FREE_DOMAINS_GUIDE.md)
**🧪 План тестирования:** [FREE_DOMAIN_TESTING.md](./FREE_DOMAIN_TESTING.md)
**📋 Полное резюме:** [FREE_DOMAINS_SUMMARY.md](./FREE_DOMAINS_SUMMARY.md)

---

## Описание

Этот проект представляет собой многофункциональный веб-сервис, включающий API сервер, Telegram бота, обработку платежей, работу с изображениями и административную панель. Сервис построен на Node.js с использованием Express.js и интегрируется с Supabase для хранения данных, поддерживает платежи через Tinkoff и YooMoney (кошельковые платежи), обработку изображений через RemoveBG и ClipDrop API.

## Структура проекта

```
src/
├── bot/                    # Telegram бот
│   └── bot.js
├── config/                 # Конфигурация
│   └── config.js
├── server/                 # Серверная часть
│   ├── app.js              # Главный файл приложения
│   ├── middleware/         # Middleware
│   │   └── auth.js
│   └── routes/             # Маршруты
│       ├── api.js
│       ├── webhooks.js
│       └── admin.js
├── services/               # Сервисы
│   ├── supabase.js         # Работа с Supabase
│   ├── payments.js         # Обработка платежей
│   └── images.js           # Обработка изображений
├── utils/                  # Утилиты
│   └── helpers.js          # Вспомогательные функции
└── web/                    # Веб-интерфейс
    ├── public/             # Статические файлы
    │   ├── css/
    │   └── js/
    └── views/              # Шаблоны EJS
        ├── index.ejs
        └── login.ejs
```

## Установка и запуск

### Предварительные требования

- Node.js (версия 16 или выше)
- npm или yarn
- Аккаунты для внешних сервисов (Supabase, Tinkoff, Yoomoney, RemoveBG, ClipDrop)

### Установка

1. Клонируйте репозиторий:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Скопируйте файл переменных окружения:
   ```bash
   cp .env.example .env
   ```

4. Настройте переменные окружения в файле `.env` (см. раздел "Переменные окружения")

### Запуск

Для запуска сервера:
```bash
npm start
```

Для запуска в режиме разработки с автоматическим перезапуском:
```bash
npm run dev
```

Для запуска Telegram бота:
```bash
node src/bot/bot.js
```

## Переменные окружения

Создайте файл `.env` в корне проекта и настройте следующие переменные:

### Обязательные переменные

- `PORT` - Порт для запуска сервера (по умолчанию 3000)
- `NODE_ENV` - Среда выполнения (development/production)
- `SESSION_SECRET` - Секретный ключ для сессий

### Supabase
- `SUPABASE_URL` - URL вашего проекта Supabase
- `SUPABASE_ANON_KEY` - Анонимный ключ Supabase

### Платежи
- `TINKOFF_TERMINAL_KEY` - Терминальный ключ Tinkoff
- `TINKOFF_PASSWORD` - Пароль Tinkoff
- `YOOMONEY_ACCESS_TOKEN` - Access Token для YooMoney API
- `YOOMONEY_WALLET_NUMBER` - Номер YooMoney кошелька для переводов

### Обработка изображений
- `REMOVEBG_API_KEY` - API ключ RemoveBG
- `CLIPDROP_API_KEY` - API ключ ClipDrop
- `SERVER_URL` - URL API сервера

### Аутентификация
- `API_KEY` - Ключ для API аутентификации
- `BEARER_TOKEN` - Bearer токен для авторизации

### Telegram бот
- `TELEGRAM_BOT_TOKEN` - Токен Telegram бота

## API Endpoints

### Основные маршруты

- `GET /` - Проверка работоспособности сервера
- `GET /api/*` - API endpoints (требуют аутентификации)
- `POST /webhooks/*` - Webhook endpoints для платежей
- `GET /admin/*` - Административная панель

### API для пользователей

- `GET /api/users` - Получить всех пользователей
- `POST /api/users` - Создать нового пользователя
- `GET /api/users/:id` - Получить пользователя по ID
- `PUT /api/users/:id` - Обновить пользователя
- `DELETE /api/users/:id` - Удалить пользователя

### API для заказов

- `GET /api/orders` - Получить все заказы
- `POST /api/orders` - Создать новый заказ
- `GET /api/orders/:id` - Получить заказ по ID
- `PUT /api/orders/:id` - Обновить заказ
- `DELETE /api/orders/:id` - Удалить заказ

## Использование

### Команды Telegram бота

#### Команды оплаты
- `/pay` - Выбрать способ оплаты заказа
- `/yookassa` - Оплата через YooMoney кошелёк
- `/qr` - Оплата через QR-код
- `/invoice` - Создание счета на оплату

#### Другие команды
- `/start` - Начать работу с ботом
- `/help` - Показать справку
- `/menu` - Показать меню товаров и услуг
- `/order` - Оформить новый заказ
- `/status` - Проверить статус заказа
- `/cancel` - Отменить активный заказ

### Платежные системы

#### YooMoney (кошельковые платежи)
- **Тип платежей**: P2P переводы между кошельками
- **Преимущества**: Низкие комиссии, прямые переводы
- **Поддержка**: Webhooks для автоматического обновления статуса
- **Тестирование**: Поддерживаются тестовые кошельки

#### Tinkoff
- **Тип платежей**: Банковские переводы
- **Преимущества**: Высокая надежность, поддержка карт
- **Поддержка**: Full API integration

#### Telegram Payments
- **Тип платежей**: Встроенная система Telegram
- **Преимущества**: Удобство, интеграция с ботом
- **Ограничения**: Требует настройки провайдера

### Аутентификация

API endpoints защищены middleware аутентификации. Используйте один из следующих способов:

1. **API Key**: Добавьте заголовок `x-api-key` с вашим API ключом
2. **Bearer Token**: Добавьте заголовок `Authorization: Bearer <your-token>`

### Примеры запросов

```javascript
// Создание платежа через YooMoney кошелёк
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    provider: 'yoomoney',
    amount: 1000,
    currency: 'RUB',
    description: 'Оплата заказа через YooMoney кошелёк'
  })
});

// Создание платежа через Tinkoff
const tinkoffResponse = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    provider: 'tinkoff',
    amount: 1000,
    currency: 'RUB',
    description: 'Оплата заказа через Tinkoff'
  })
});
```

## Разработка

### Добавление новых функций

1. Добавьте новый маршрут в соответствующую папку `src/server/routes/`
2. Если нужно, создайте новый сервис в `src/services/`
3. Обновите документацию в этом README файле

### Тестирование

```bash
npm test
```

## Безопасность

- Все чувствительные данные хранятся в переменных окружения
- API endpoints защищены аутентификацией
- Используйте HTTPS в продакшене
- Регулярно обновляйте зависимости

## Лицензия

Этот проект лицензирован под MIT License.