# 🧪 План тестирования с бесплатными доменами

## 📋 Быстрое тестирование (10 минут)

### Автоматическое тестирование всех бесплатных опций

#### **Скрипт быстрого тестирования**
```bash
#!/bin/bash
# quick-free-test.sh

echo "🧪 Быстрое тестирование бесплатных доменов..."

# Тестируем Vercel (рекомендуется)
echo "1️⃣ Тестируем Vercel..."
npm run deploy:preview
echo "✅ Vercel развернут"

# Тестируем Netlify
echo "2️⃣ Тестируем Netlify..."
npx netlify-cli deploy --prod --yes --dir=.
echo "✅ Netlify развернут"

# Проверка функциональности
echo "3️⃣ Тестируем функциональность..."
test_free_domains

echo "🎉 Все бесплатные опции протестированы!"
```

---

## 🎯 Детальный план тестирования

### **Фаза 1: Базовое развертывание (5 минут)**

#### 1.1 Развертывание на Vercel
```bash
# Быстрое развертывание
./deploy-free.sh vercel

# Проверка развертывания
curl https://your-app.vercel.app/
curl https://your-app.vercel.app/health
```

#### 1.2 Развертывание на Netlify
```bash
# Альтернативное развертывание
./deploy-free.sh netlify

# Проверка домена
curl https://your-app.netlify.app/
```

### **Фаза 2: Функциональное тестирование (10 минут)**

#### 2.1 Тестирование API эндпоинтов
```javascript
// tests/free-domains-api.test.js
const testUrls = [
  'https://your-app.vercel.app',
  'https://your-app.netlify.app',
  'https://your-app.onrender.com'
];

describe('Free Domain API Tests', () => {
  testUrls.forEach(url => {
    it(`should work on ${url}`, async () => {
      const response = await axios.get(`${url}/api/test`);
      expect(response.status).toBe(200);
      expect(response.data.free_domain).toBe(true);
    });
  });
});
```

#### 2.2 Тестирование платежей YooMoney
```javascript
// Тестирование бесплатных доменов с платежами
const freeDomains = {
  vercel: 'https://your-app.vercel.app',
  netlify: 'https://your-app.netlify.app',
  railway: 'https://your-app.railway.app'
};

async function testYooMoneyIntegration(domain) {
  // Тестируем создание платежа
  const payment = await createPayment(domain);

  // Тестируем webhook
  await testWebhook(domain + '/webhooks');

  // Тестируем успешный редирект
  await testSuccessRedirect(domain + '/payment/success');
}
```

### **Фаза 3: Интеграционное тестирование (15 минут)**

#### 3.1 Telegram бот интеграция
```javascript
// tests/integration/free-domains-bot.test.js
describe('Bot + Free Domains Integration', () => {
  it('should handle payments on free domains', async () => {
    const domain = 'https://your-app.vercel.app';

    // Создаем заказ через бота
    const order = await bot.createOrder();

    // Проверяем webhook от YooMoney
    await expectWebhookCall(domain + '/webhooks');

    // Проверяем успешную оплату
    await expectPaymentSuccess(order.id);
  });
});
```

#### 3.2 База данных интеграция
```sql
-- Тестирование подключения к Supabase с бесплатных доменов
SELECT test_connection('https://your-supabase-project.supabase.co');

-- Проверка orders table
SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '1 hour';
```

### **Фаза 4: Производственный тест (20 минут)**

#### 4.1 Нагрузочное тестирование
```bash
# Тестирование производительности
ab -n 1000 -c 10 https://your-app.vercel.app/

# Тестирование SSL
curl -I https://your-app.vercel.app/

# Тестирование DNS
dig your-app.vercel.app
```

#### 4.2 Реальный пользовательский путь
```javascript
// end-to-end тест с бесплатным доменом
describe('Real User Journey on Free Domain', () => {
  it('should complete full payment flow', async () => {
    // 1. Посещение сайта
    await page.goto('https://your-app.vercel.app');

    // 2. Создание заказа через бот
    await createOrderViaBot();

    // 3. Переход по платежной ссылке
    await followPaymentLink();

    // 4. Успешная оплата через YooMoney
    await completeYooMoneyPayment();

    // 5. Проверка успешного редиректа
    await expectSuccessPage();
  });
});
```

---

## 🛠️ Инструменты тестирования

### **Автоматизация тестирования**
```javascript
// test-runner-free-domains.js
const { exec } = require('child_process');

const platforms = [
  { name: 'Vercel', cmd: './deploy-free.sh vercel' },
  { name: 'Netlify', cmd: './deploy-free.sh netlify' },
  { name: 'Railway', cmd: './deploy-free.sh railway' },
  { name: 'GitHub Pages', cmd: './deploy-free.sh github' }
];

async function runFreeDomainTests() {
  for (const platform of platforms) {
    console.log(`🚀 Тестируем ${platform.name}...`);

    await executeTest(platform.cmd);

    console.log(`✅ ${platform.name} протестирован`);
  }

  console.log('🎉 Все бесплатные домены протестированы!');
}
```

### **Мониторинг и отладка**
```bash
# Проверка логов Vercel
vercel logs --follow

# Проверка логов Railway
railway logs

# Мониторинг webhook'ов
tail -f webhook-logs.log

# Проверка базы данных
psql -h your-db.railway.app -d railway
```

---

## 📊 Критерии успешности

### **Минимальные требования**
- ✅ **Время развертывания:** < 10 минут
- ✅ **Стоимость:** 0₽
- ✅ **SSL сертификат:** Автоматический
- ✅ **HTTPS редиректы:** Рабочие
- ✅ **Basic API:** Отвечает на запросы

### **Оптимальные показатели**
- ✅ **Время ответа:** < 500ms
- ✅ **Uptime:** > 99.9%
- ✅ **SEO friendly:** Корректные meta tags
- ✅ **Mobile оптимизация:** Адаптивный дизайн

### **Производственные требования**
- ✅ **Webhook обработка:** 100% доставка
- ✅ **Платежная интеграция:** YooMoney работает
- ✅ **База данных:** Подключена и работает
- ✅ **Безопасность:** CORS, headers настроены

---

## 🚨 Решение проблем

### **Проблема: Домен не доступен**
```bash
# Проверка DNS
dig your-app.vercel.app

# Проверка логов Vercel
vercel logs

# Проверка состояния
curl -I https://your-app.vercel.app/
```

### **Проблема: API не работает**
```bash
# Локальный тест
curl http://localhost:3000/api/test

# Тест развернутого API
curl https://your-app.vercel.app/api/test

# Проверка переменных окружения
vercel env ls
```

### **Проблема: Webhook не приходит**
```javascript
// Отладка webhook'ов
app.post('/webhooks', (req, res) => {
  console.log('Webhook received:', req.body);
  console.log('Headers:', req.headers);

  res.status(200).send('OK');
});
```

### **Проблема: База данных недоступна**
```bash
# Тест подключения к Supabase
node test_connection.js

# Проверка переменных
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

---

## 📈 Метрики и отчеты

### **Автоматический отчет о тестировании**
```javascript
// generate-free-domain-report.js
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    tested_domains: results.length,
    successful_deployments: results.filter(r => r.success).length,
    average_response_time: calculateAverageResponseTime(results),
    cost_savings: '$8+/год сэкономлено',
    recommendations: generateRecommendations(results)
  };

  fs.writeFileSync('free-domains-test-report.json', JSON.stringify(report, null, 2));
  return report;
}
```

### **Пример отчета**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "tested_domains": 5,
  "successful_deployments": 5,
  "average_response_time": "245ms",
  "cost_savings": "$8+/год сэкономлено",
  "recommendations": [
    "Используйте Vercel для production",
    "Netlify подходит для форм",
    "Railway хорош для баз данных"
  ]
}
```

---

## 🎯 Резюме: Что тестировать

### **Обязательные тесты**
- ✅ Развертывание работает (`npm run deploy:preview`)
- ✅ Домены доступны (`curl https://domain.app/`)
- ✅ SSL работает (`https` без ошибок)
- ✅ API отвечает (`/api/test` endpoint)
- ✅ Webhook'и приходят от YooMoney
- ✅ База данных подключена

### **Рекомендуемые тесты**
- 🔄 Полный пользовательский путь оплаты
- 🔄 Мобильная оптимизация
- 🔄 Производительность под нагрузкой
- 🔄 SEO оптимизация
- 🔄 Кроссбраузерная совместимость

### **Время на тестирование**
| Тест | Время | Стоимость |
|------|-------|-----------|
| Базовое развертывание | 5 мин | 0₽ |
| Функциональное тестирование | 10 мин | 0₽ |
| Интеграционное тестирование | 15 мин | 0₽ |
| Полное E2E тестирование | 20 мин | 0₽ |
| **Итого** | **50 мин** | **0₽** |

---

## 🚀 Следующие шаги после успешного тестирования

### **Шаг 1: Выберите основную платформу**
```bash
# Vercel (рекомендую)
./deploy-free.sh vercel

# Или Netlify
./deploy-free.sh netlify
```

### **Шаг 2: Настройте YooMoney**
```javascript
// Обновите в YooMoney Dashboard
const yooMoneySettings = {
  server_url: 'https://your-app.vercel.app',
  redirect_uri: 'https://your-app.vercel.app/auth/callback',
  webhook_url: 'https://your-app.vercel.app/webhooks'
};
```

### **Шаг 3: Перейдите к продаже**
```bash
# Когда будешь готов к платному домену
# Купи домен на namecheap.com (~$8/год)

# Добавь в Vercel
vercel domains add yourdomain.xyz

# Обнови настройки
# Все остальное останется бесплатным! 🎉
```

---

**🎊 Поздравляем! Вы готовы развернуть проект за 0₽**

**Бесплатные домены отлично подойдут для:**
- 🧪 **Тестирования MVP**
- 🎓 **Обучения и демонстраций**
- 🚀 **Быстрого старта проекта**
- 💡 **Proof of concept**

**Следующий шаг:** `./deploy-free.sh vercel` - и ваш проект онлайн! 🌐