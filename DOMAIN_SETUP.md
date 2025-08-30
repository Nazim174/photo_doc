# 🔗 Настройка кастомного домена для Vercel

## 📋 Оглавление
1. [Быстрый домен за минимум денег](#fast-domain)
2. [Настройка домена в Vercel](#vercel-domain)
3. [Дешевые домены](#cheap-domains)
4. [Бесплатные альтернативы](#free-alternatives)
5. [Обновление конфигурации YooMoney](#update-yoomoney)

## 🚀 Быстрый домен за минимум денег <a name="fast-domain"></a>

### Опция 1: Namecheap (.xyz домен) - **$8-15/год** ⭐ РЕКОМЕНДУЮ

1. **Зарегистрируйтесь** на [namecheap.com](https://namecheap.com) (или перейдите)
2. **Введите домен** (например: `my-photodoc.xyz`)
3. **Оформите заказ** за ~$8-15/год
4. **Оплатите** любым удобным способом (Карта/Tinkoff/etc)

**Время:** 5-10 минут
**Стоимость:** $8-15/год (в рублях ~500-1000₽)
**Качество:** Отличное, надежный регистратор

### Опция 2: Reg.ru - **$15-25/год**

1. Перейдите на [reg.ru](https://reg.ru)
2. Выберите `.site`, `.info`, `.online`
3. Оформите заказ + настройте
4. Оплатите и получите домен

## ⚙️ Настройка домена в Vercel <a name="vercel-domain"></a>

### Шаг 1: Авторизация
```bash
# Устанавливаем Vercel CLI (если не установлен)
npm install -g vercel

# Логинимся
vercel login
```

### Шаг 2: Добавляем домен в Vercel
```bash
# Переходим в проект
cd /path/to/your/project

# Разворачиваем приложение
vercel --prod

# Или используем наш скрипт
./deploy.sh
```

### Шаг 3: Настройка DNS записей

**3.1 В Vercel Dashboard:**
1. Перейдите в https://vercel.com/dashboard
2. Найдите ваш проект
3. **Settings → Domains**
4. Введите ваш домен: `my-photodoc.xyz`
5. Нажмите **Add**

**3.2 Скопируйте DNS записи:**

| Type  | Name  | Value                      |
|-------|-------|----------------------------|
| CNAME | @     | cname.vercel-dns.com       |
| CNAME | www   | cname.vercel-dns.com       |

**3.3 Добавьте записи в Namecheap:**

![DNS Settings](https://i.imgur.com/dns-example.png)

1. Войдите в **Namecheap Dashboard**
2. **Domain List → Manage** (рядом с вашим доменом)
3. **Advanced DNS**
4. **Add New Record** для каждой записи выше

### Шаг 4: Проверка
```bash
# Проверяем что домен работает
curl https://my-photodoc.xyz
```

**Время распространения DNS:** 5-60 минут

## 💰 Дешевые домены <a name="cheap-domains"></a>

| Регистратор | Популярные зоны | Цена/год | Рекомендация |
|-------------|----------------|----------|-------------|
| **Namecheap** | .xyz, .site | $8-15 | ⭐ Лучший выбор |
| **Reg.ru** | .info, .online | $15-25 | ✅ Хороший |
| **Porkbun** | .xyz, .site | $8-12 | ⭐ Альтернатива |
| **Cloudflare** | Все зоны | $8+ | ⚡ С DNS включено |

### Советы по выбору домена:
- ✅ **Короткий** - легче запомнить
- ✅ **Английский** - проще найти
- ✅ **Без дефисов** - myphotodoc лучше чем my-photo-doc
- ✅ **Ключевые слова** - photodocument, myphotos

## 🎁 Бесплатные альтернативы <a name="free-alternatives"></a>

### 1. Используйте Vercel subdomain БЕСПЛАТНО
- `your-project.vercel.app` - работает сразу
- На 100% бесплатен
- Хорошая производительность
- SSL сертификат включен

### 2. GitHub Pages (Без домена)
- `yourusername.github.io` - бесплатно
- Но без кастомного домена ограничения

### 3. Netlify (Бесплатный план)
- `your-app.netlify.app` - бесплатно
- Аналогично Vercel

## 🔄 Обновление конфигурации YooMoney <a name="update-yoomoney"></a>

### После настройки домена обновите `.env`:

```bash
# Копируйте шаблон
cp .env.production.example .env.production

# Редактируем URL'ы
YOOMONEY_PROD_SERVER_URL=https://my-photodoc.xyz
YOOMONEY_PROD_REDIRECT_URI=https://my-photodoc.xyz/auth/callback
WEBHOOK_SUCCESS_URL=https://my-photodoc.xyz/payment/success
WEBHOOK_FAIL_URL=https://my-photodoc.xyz/payment/fail
```

### В YooMoney настройках:
1. Перейдите в **Настройки приложения**
2. Измените **Redirect URI** на `https://my-photodoc.xyz/auth/callback`
3. Измените **Webhook URL** на `https://my-photodoc.xyz/webhooks`

## ✅ Проверка работоспособности

```bash
# Тестируем основные endpoints
curl https://my-photodoc.xyz/
curl https://my-photodoc.xyz/test/health

# Тестируем с www
curl https://www.my-photodoc.xyz/
```

## 🔧 Troubleshooting

### "DNS not propagated"
```bash
# Проверьте статус DNS
dig my-photodoc.xyz
nslookup my-photodoc.xyz
```

### "SSL certificate error"
- Vercel автоматически выставляет SSL
- Подождите 5-10 минут

### "Domain not found in Vercel"
```
vercel domains add my-photodoc.xyz
```

## 🎯 Резюме быстрого развертывания:

1. **Домен:** Namecheap (.xyz) - $8-15/год
2. **Хостинг:** Vercel - БЕСПЛАТЕН
3. **Время:** 15-30 минут
4. **Стоимость:** 500-1000₽ + 0₽ (один раз)

**Готово! 🚀**