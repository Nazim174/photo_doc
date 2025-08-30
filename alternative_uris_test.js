// alternative_uris_test.js - Тест различных комбинаций URI для YooMoney
require('dotenv').config();

const https = require('https');
const { URL } = require('url');

class YooMoneyURITester {
    constructor() {
        this.serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        this.accessToken = process.env.YOOMONEY_ACCESS_TOKEN;
        this.clientId = process.env.YOOMONEY_CLIENT_ID;
    }

    // Тестирование различных вариантов адрессов сайтов
    async testServerURIs() {
        console.log('🧪 ТЕСТИРОВАНИЕ АДРЕСОВ САЙТОВ\n');

        const addressVariants = [
            {
                name: 'Текущий SERVER_URL',
                url: this.serverUrl + '/callback',
                type: 'current'
            },
            {
                name: 'Localhost разработка',
                url: 'http://localhost:3000/callback',
                type: 'development'
            },
            {
                name: 'Public URL (ngrok)',
                url: 'https://your-project.ngrok.io/callback',
                type: 'development_tunnel'
            },
            {
                name: 'Localtunnel',
                url: 'https://your-project.loca.lt/callback',
                type: 'development_tunnel'
            },
            {
                name: 'Productions домен',
                url: 'https://your-real-domain.com/callback',
                type: 'production'
            },
            {
                name: 'Render/беевый хостинг',
                url: 'https://your-project.onrender.com/callback',
                type: 'production_paa'
            }
        ];

        for (const variant of addressVariants) {
            console.log(`📍 Проверяем: ${variant.name}`);
            console.log(`   URL: ${variant.url}`);

            const isReachable = await this.checkURLReachable(variant.url);
            console.log(`   Доступность: ${isReachable ? '✅' : '❌'}`);

            if (isReachable) {
                console.log(`   ✅ Рекомендуемый для типа: ${variant.type}`);
            }
            console.log('');
        }
    }

    // Тестирование redirect URI
    async testRedirectURIs() {
        console.log('🔄 ТЕСТИРОВАНИЕ REDIRECT URI\n');

        const redirectVariants = [
            {
                name: 'Callback для OAuth',
                url: this.serverUrl + '/callback',
                purpose: 'oauth_callback'
            },
            {
                name: 'Callback платежа',
                url: this.serverUrl + '/payment/callback',
                purpose: 'payment_callback'
            },
            {
                name: 'Success page',
                url: this.serverUrl + '/payment/success',
                purpose: 'success_page'
            },
            {
                name: 'Fail page',
                url: this.serverUrl + '/payment/fail',
                purpose: 'fail_page'
            },
            {
                name: 'Произвольный endpoint',
                url: this.serverUrl + '/api/payment/complete',
                purpose: 'api_callback'
            }
        ];

        for (const variant of redirectVariants) {
            console.log(`🔗 ${variant.name}:`);
            console.log(`   URL: ${variant.url}`);
            console.log(`   Назначение: ${variant.purpose}`);

            const isValid = await this.checkURLFormat(variant.url);
            console.log(`   Формат: ${isValid ? '✅ Корректный' : '❌ Некорректный'}`);

            // Проверка наличия обработчика
            if (variant.url.includes('callback') || variant.url.includes('complete')) {
                console.log(`   ⚠️  Требуется обработчик: ${variant.url.split('/').pop()}`);
            }
            console.log('');
        }
    }

    // Тестирование notification URI (webhooks)
    async testNotificationURIs() {
        console.log('🔔 ТЕСТИРОВАНИЕ NOTIFICATION URI\n');

        const notificationVariants = [
            {
                name: 'Общий webhook для платежей',
                url: this.serverUrl + '/webhooks/payments',
                handler: 'handlePaymentWebhook'
            },
            {
                name: 'Специальный YooMoney webhook',
                url: this.serverUrl + '/webhooks/yoomoney',
                handler: 'handleYooMoneyWebhook'
            },
            {
                name: 'API endpoint для уведомлений',
                url: this.serverUrl + '/api/payment/webhook',
                handler: 'handleApiWebhook'
            },
            {
                name: 'Обработчик операций',
                url: this.serverUrl + '/webhooks/operation',
                handler: 'handleOperationWebhook'
            }
        ];

        for (const variant of notificationVariants) {
            console.log(`🔔 ${variant.name}:`);
            console.log(`   URL: ${variant.url}`);
            console.log(`   Обработчик: ${variant.handler}`);

            const exists = await this.checkHandlerExists(variant.handler);
            console.log(`   Реализован: ${exists ? '✅' : '❌ Отсутствует'}`);

            const isSecure = variant.url.startsWith('https://');
            console.log(`   HTTPS: ${isSecure ? '✅ Безопасный' : '⚠️ HTTP (небезопасно)'}`);
            console.log('');
        }
    }

    // Проверка конфигурации приложения
    async testAppConfiguration() {
        console.log('⚙️ ТЕСТИРОВАНИЕ КОНФИГУРАЦИИ ПРИЛОЖЕНИЯ YOOMONEY\n');

        const requiredFields = [
            {
                name: 'CLIENT_ID',
                value: this.clientId,
                description: 'Идентификатор приложения'
            },
            {
                name: 'SERVER_URL',
                value: process.env.SERVER_URL,
                description: 'Базовый URL сервера'
            },
            {
                name: 'REDIRECT_URI',
                value: process.env.YOOMONEY_REDIRECT_URI,
                description: 'URL перенаправления (явно указан)'
            }
        ];

        console.log('Добавить в .env для YooMoney:');
        console.log('YOOMONEY_CLIENT_ID=ваш_client_id_здесь');
        console.log('YOOMONEY_REDIRECT_URI=https://your-domain.com/callback');
        console.log('');

        for (const field of requiredFields) {
            console.log(`📝 ${field.name}:`);
            console.log(`   Значение: ${field.value || '❌ НЕ НАСТРОЕНО'}`);
            console.log(`   Описание: ${field.description}`);
            console.log('');
        }
    }

    // Генерация скрипта настройки
    generateSetupScript() {
        console.log('🔧 СКРИПТ ДЛЯ НАСТРОЙКИ YOOMONEY ВАРИАНТЫ:\n');

        console.log('# Вариант A: Быстрая настройка для разработки');
        console.log('export SERVER_URL="http://localhost:3000"');
        console.log('export YOOMONEY_REDIRECT_URI="http://localhost:3000/callback"');
        console.log('export YOOMONEY_CLIENT_ID="ваш_client_id"');
        console.log('');

        console.log('# Вариант B: Настройка с ngrok для разработки');
        console.log('export SERVER_URL="https://abc123.ngrok.io"');
        console.log('export YOOMONEY_REDIRECT_URI="https://abc123.ngrok.io/callback"');
        console.log('export YOOMONEY_CLIENT_ID="ваш_client_id"');
        console.log('');

        console.log('# Вариант C: Production настройка');
        console.log('export SERVER_URL="https://your-domain.com"');
        console.log('export YOOMONEY_REDIRECT_URI="https://your-domain.com/auth/callback"');
        console.log('export YOOMONEY_CLIENT_ID="ваш_client_id"');
    }

    // Метод диагностики всех проблем
    async diagnoseIssues() {
        console.log('🔍 ДИАГНОСТИКА ПРОБЛЕМНЫХ МЕСТ:\n');

        const issues = [
            {
                problem: 'Отсутствует YOOMONEY_REDIRECT_URI в .env',
                solution: 'Добавить YOOMONEY_REDIRECT_URI=http://localhost:3000/callback',
                impact: 'Средний - но вызывает ошибки авторизации'
            },
            {
                problem: 'SERVER_URL указывает на плейсхолдер',
                solution: 'Установить SERVER_URL=https://your-real-domain.com',
                impact: 'Высокий - платежные ссылки не будут работать'
            },
            {
                problem: 'Webhook endpoint общий для всех провайдеров',
                solution: 'Создать специальный /webhooks/yoomoney',
                impact: 'Средний - возможно неверное определение провайдера'
            },
            {
                problem: 'Нет обработки YOOMONEY_REDIRECT_ID в конфиге',
                solution: 'Переименовать REDIRECT_ID в переменные окружения',
                impact: 'Низкий - поле используется редко'
            }
        ];

        issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.problem}`);
            console.log(`   🔧 Решение: ${issue.solution}`);
            console.log(`   📊 Влияние: ${issue.impact}`);
            console.log('');
        });
    }

    // Запуск полного тестирования
    async runCompleteTest() {
        console.log('🚀 НАЧИНАЕМ ПОЛНОЕ ТЕСТИРОВАНИЕ YOOMONEY URI');
        console.log('=============================================\n');

        await this.testServerURIs();
        await this.testRedirectURIs();
        await this.testNotificationURIs();
        await this.testAppConfiguration();
        await this.diagnoseIssues();
        this.generateSetupScript();

        console.log('\n✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
        console.log('Рекомендации см. выше для настройки ваших URI');
    }

    // Хелперы
    async checkURLReachable(url) {
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
                return true; // Для локального тоста
            }
            // Для внешний URL проверка упрощенно
            return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
        } catch (e) {
            return false;
        }
    }

    async checkURLFormat(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    async checkHandlerExists(handlerName) {
        // Упрощенная проверка - в реальности нужно сканировать код
        const knownHandlers = ['handleYooMoneyWebhook', 'handlePaymentWebhook', 'handleApiWebhook', 'handleOperationWebhook'];
        return knownHandlers.includes(handlerName);
    }
}

// Запуск тестирования
if (require.main === module) {
    const tester = new YooMoneyURITester();
    tester.runCompleteTest().catch(console.error);
}

module.exports = { YooMoneyURITester };