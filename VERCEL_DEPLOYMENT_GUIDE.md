# 🚀 Быстрое развертывание на Vercel + YooMoney

## ⚡ 30-минутный план полного развертывания

### 📋 Содержание
1. [Требования](#requirements)
2. [Быстрое развертывание](#quick-deploy)
3. [Настройка домена](#domain-setup)
4. [Обновление YooMoney](#yoomoney-update)
5. [Тестирование](#testing)
6. [Бот развертывание](#bot-deploy)
7. [Резюме](#summary)

---

## 🛠️ Требования <a name="requirements"></a>

### Что нужно установить:
```bash
# Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vercel CLI
npm install -g vercel

# Git (для коммитов)
sudo apt-get install git
```

### Аккаунты:
- ✅ [Vercel](https://vercel.com) - бесплатно
- ✅ [Namecheap](https://namecheap.com) - для домена $8
- ✅ [Supabase](https://supabase.com) - готов
- ✅ [YooMoney](https://yoomoney.ru) - готов

---

## ⚡ 1. Быстрое развертывание (10 минут) <a name="quick-deploy"></a>

### Шаг 1: Клонируйте проект
```bash
cd ~/projects
git clone <your-repo-url> photo_doc_prod
cd photo_doc_prod
```

### Шаг 2: Установите зависимости
```bash
npm install
```

### Шаг 3: Авторизация в Vercel
```bash
vercel login
# Введите email, подтвердите в почте
```

### Шаг 4: Разверните приложение
```bash
# Preview deployment (тестовый)
npm run deploy:preview

# Production deployment (финальный)
npm run deploy
```

### Шаг 5: Получите URL
```
✅ Success! Deployed to https://your-app.vercel.app
```

---

## 🌐 2. Настройка домена (15 минут) <a name="domain-setup"></a>

### Как получить домен за $8?

1. **Buy domain at Namecheap:**
   - Go to [namecheap.com](https://namecheap.com)
   - Search: `myphotodoc.xyz`
   - Price: ~$8/year

2. **Configure DNS:**
   ```bash
   # In Vercel dashboard:
   # 1. Settings → Domains
   # 2. Add: myphotodoc.xyz
   # 3. Copy DNS records
   #
   # In Namecheap:
   # Advanced DNS → Add new records:
   # CNAME @ cname.vercel-dns.com
   # CNAME www cname.vercel-dns.com
   ```

3. **Wait 5-60 min** for DNS propagation

**Result:** `https://myphotodoc.xyz` ✨

---

## 💳 3. Обновление YooMoney (5 минут) <a name="yoomoney-update"></a>

### Настройка production переменных:

```bash
# Создаем production конфиг
cp .env.production.example .env.production

# Редактируем с реальными данными:
NODE_ENV=production
SERVER_URL=https://myphotodoc.xyz
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
YOOMONEY_PROD_SERVER_URL=https://myphotodoc.xyz
YOOMONEY_PROD_REDIRECT_URI=https://myphotodoc.xyz/auth/callback
YOOMONEY_ACCESS_TOKEN=your-prod-token
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

### В YooMoney Dashboard:
1. **Приложения → Ваше приложение**
2. **Redirect URI:** `https://myphotodoc.xyz/auth/callback`
3. **Webhook URL:** `https://myphotodoc.xyz/webhooks`

### Переразверните с новыми переменными:
```bash
npm run deploy
```

---

## 🧪 4. Тестирование <a name="testing"></a>

### Тестируем основные endpoints:
```bash
# Здоровье приложения
curl https://myphotodoc.xyz/

# API endpoints
curl https://myphotodoc.xyz/api/users
curl https://myphotodoc.xyz/webhooks

# DNS records
dig myphotodoc.xyz
```

### Тестируем платежи:
1. Перейдите: `https://myphotodoc.xyz`
2. Создайте заказ через Telegram бота
3. Попробуйте оплатить через YooMoney

---

## 🤖 5. Развертывание бота (Опционально) <a name="bot-deploy"></a>

### Бесплатные варианты:
```bash
# Railway (рекомендую)
npm install -g @railway/cli
railway login
railway up

# Или Heroku
npm install -g heroku
heroku create
git push heroku main

# Или вечно запущенный процесс
npm run dev:bot-only
```

**Vercel не подходит для бота** (нужен постоянно запущенный процесс)

---

## 📊 Стоимость и время <a name="summary"></a>

| Компонент | Стоимость | Время | Статус |
|-----------|-----------|-------|--------|
| **Хостинг** | $0 | 5 мин | ✅ Vercel |
| **Домен** | $8/год | 10 мин | ⭐ Namecheap |
| **SSL** | $0 | Авто | ✅ Vercel |
| **База данных** | $0 | Готово | ✅ Supabase |
| **Платежи** | $0 | Готово | ✅ YooMoney |
| **Итого** | **$8/год** | **30 мин** | 🚀 |

### Что работает после развертывания:
- ✅ Веб-приложение на `myphotodoc.xyz`
- ✅ API для заказов и оплаты
- ✅ YooMoney интеграция
- ✅ База данных Supabase
- ✅ SSL сертификаты
- ✅ Автоматические деплойменты

### Что нужно сделать отдельно:
- 🔄 Развернуть Telegram бота (Railway/Heroku)
- 🔄 Настроить бота на production webhook

---

## 🎯 Шаблон .env для продакшена

```bash
# Основные настройки
NODE_ENV=production
SERVER_URL=https://myphotodoc.xyz
YOOMONEY_PROD_SERVER_URL=https://myphotodoc.xyz
YOOMONEY_PROD_REDIRECT_URI=https://myphotodoc.xyz/auth/callback

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# YooMoney
YOOMONEY_ACCESS_TOKEN=production-token-here
YOOMONEY_WALLET_NUMBER=410011234567890
YOOMONEY_CLIENT_ID=your-client-id

# Админ
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-password-here
```

---

## 🎉 Готово!

**Ваш сайт работает на:** `https://myphotodoc.xyz`

**Общая стоимость:** $8 за домен (один раз) + бесплатный хостинг

**Время развертывания:** 30 минут

**Следующие шаги:**
1. ✅ Тестируйте все функции
2. 🔄 Разверните бота (опционально)
3. 🔄 Настройте мониторинг
4. 🔄 Добавьте дополнительные домены если нужно

---

**🚀 Удачи с развертыванием!**