// yoomoney_final_test.js - Полная проверка настроек YooMoney с планами A, B, C
require('dotenv').config();

class YooMoneyFinalTester {
    constructor() {
        this.plans = {
            A: {
                name: 'План A: Разработка localhost',
                SERVER_URL: process.env.YOOMONEY_ALT_SERVER_URL || 'http://localhost:3000',
                REDIRECT_URI: process.env.YOOMONEY_ALT_REDIRECT_URI || 'http://localhost:3000/callback',
                NOTIFICATION_URI: process.env.YOOMONEY_ALT_SERVER_URL || 'http://localhost:3000' + '/webhooks/yoomoney',
                USE_CASE: 'Локальная разработка и тестирование'
            },
            B: {
                name: 'План B: Разработка с ngrok',
                SERVER_URL: process.env.YOOMONEY_NGROK_SERVER_URL || 'https://your-project.ngrok.io',
                REDIRECT_URI: process.env.YOOMONEY_NGROK_REDIRECT_URI || 'https://your-project.ngrok.io/callback',
                NOTIFICATION_URI: process.env.YOOMONEY_NGROK_SERVER_URL || 'https://your-project.ngrok.io' + '/webhooks/yoomoney',
                USE_CASE: 'Тестирование внешних вебхуков и платежей'
            },
            C: {
                name: 'План C: Production',
                SERVER_URL: process.env.YOOMONEY_PROD_SERVER_URL || 'https://your-domain.com',
                REDIRECT_URI: process.env.YOOMONEY_PROD_REDIRECT_URI || 'https://your-domain.com/auth/callback',
                NOTIFICATION_URI: process.env.YOOMONEY_PROD_SERVER_URL || 'https://your-domain.com' + '/webhooks/yoomoney',
                USE_CASE: 'Рабочая среда с реальными платежами'
            }
        };
    }

    async testAllPlans() {
        console.log('🎯 ПОЛНАЯ ВАЛИДАЦИЯ YOOMONEY НАСТРОЕК');
        console.log('=============================================\n');

        for (const [planKey, plan] of Object.entries(this.plans)) {
            console.log(`📋 ${plan.name}`);
            console.log(`   Назначение: ${plan.USE_CASE}`);
            console.log(`   SERVER_URL: ${plan.SERVER_URL}`);
            console.log(`   REDIRECT_URI: ${plan.REDIRECT_URI}`);
            console.log(`   NOTIFICATION_URI: ${plan.NOTIFICATION_URI}`);

            const results = await this.validatePlan(plan);
            this.displayResults(results);
            console.log('');
        }
    }

    async validatePlan(plan) {
        const results = {};

        // 1. Проверка формата URL
        results.serverUrlFormat = this.checkURLFormat(plan.SERVER_URL);
        results.redirectUriFormat = this.checkURLFormat(plan.REDIRECT_URI);
        results.notificationUriFormat = this.checkURLFormat(plan.NOTIFICATION_URI);

        // 2. Проверка HTTPS для production
        results.redirectHttpsSafe = this.checkHttpsForPayment(plan.REDIRECT_URI, plan.SERVER_URL);
        results.notificationHttpsSafe = this.checkHttpsForWebhook(plan.NOTIFICATION_URI);

        // 3. Проверка соответствия доменов
        results.domainConsistency = this.checkDomainConsistency(plan.SERVER_URL, plan.REDIRECT_URI, plan.NOTIFICATION_URI);

        // 4. Проверка структуры путей
        results.callbackPath = this.checkCallbackPath(plan.REDIRECT_URI);
        results.notificationPath = this.checkNotificationPath(plan.NOTIFICATION_URI);

        // 5. Общая оценка
        results.overall = this.calculateOverallScore(results);

        return results;
    }

    displayResults(results) {
        console.log('   ✅ Форматы URL:');
        console.log(`      - Server URL: ${results.serverUrlFormat.valid ? '✅' : '❌'} ${results.serverUrlFormat.error || 'OK'}`);
        console.log(`      - Redirect URI: ${results.redirectUriFormat.valid ? '✅' : '❌'} ${results.redirectUriFormat.error || 'OK'}`);
        console.log(`      - Notification URI: ${results.notificationUriFormat.valid ? '✅' : '❌'} ${results.notificationUriFormat.error || 'OK'}`);

        console.log('   🔒 Безопасность HTTPS:');
        console.log(`      - Redirect: ${results.redirectHttpsSafe.safe ? '✅' : '⚠️'} ${results.redirectHttpsSafe.message}`);
        console.log(`      - Notification: ${results.notificationHttpsSafe.safe ? '✅' : '⚠️'} ${results.notificationHttpsSafe.message}`);

        console.log('   🏛️ Согласованность:');
        console.log(`      - Домены: ${results.domainConsistency.consistent ? '✅' : '⚠️'} ${results.domainConsistency.message}`);

        console.log('   🏗️ Структура путей:');
        console.log(`      - Callback: ${results.callbackPath.correct ? '✅' : '⚠️'} ${results.callbackPath.message}`);
        console.log(`      - Notification: ${results.notificationPath.correct ? '✅' : '⚠️'} ${results.notificationPath.message}`);

        console.log(`   🎯 Общая оценка: ${results.overall.score}/10 - ${results.overall.status}`);
    }

    // Вспомогательные методы
    checkURLFormat(url) {
        try {
            new URL(url);
            return { valid: true };
        } catch (e) {
            return { valid: false, error: 'Неверный формат URL' };
        }
    }

    checkHttpsForPayment(redirectUrl, serverUrl) {
        const isHttps = redirectUrl.startsWith('https://');
        const isLocal = redirectUrl.includes('localhost') || redirectUrl.includes('127.0.0.1');

        if (isLocal) {
            return { safe: true, message: 'Локальный тест разрешен' };
        }

        if (serverUrl.includes('your-domain.com') || serverUrl.includes('ngrok.io')) {
            if (!isHttps) {
                return { safe: false, message: 'Для внешнего доступа требуется HTTPS' };
            }
        }

        return { safe: isHttps, message: isHttps ? 'HTTPS включен' : 'Работает по HTTP' };
    }

    checkHttpsForWebhook(notificationUrl) {
        const isHttps = notificationUrl.startsWith('https://');
        const isLocal = notificationUrl.includes('localhost') || notificationUrl.includes('127.0.0.1');

        if (isLocal) {
            return { safe: false, message: 'Для вебхуков требуется HTTPS (используйте ngrok или production)' };
        }

        if (!isHttps) {
            return { safe: false, message: 'YooMoney требует HTTPS для вебхуков' };
        }

        return { safe: true, message: 'HTTPS настроен правильно' };
    }

    checkDomainConsistency(serverUrl, redirectUri, notificationUri) {
        try {
            const serverDomain = new URL(serverUrl).host;
            const redirectDomain = new URL(redirectUri).host;
            const notificationDomain = new URL(notificationUri).host;

            const allSame = serverDomain === redirectDomain && redirectDomain === notificationDomain;

            if (allSame) {
                return { consistent: true, message: 'Все URI используют одинаковый домен' };
            }

            const serverRedirect = serverDomain === redirectDomain;
            const serverNotification = serverDomain === notificationDomain;

            if (serverRedirect && !serverNotification) {
                return { consistent: false, message: 'Notification URI использует другой домен' };
            }

            return { consistent: false, message: 'Разные домены могут вызвать проблемы CORS' };
        } catch (e) {
            return { consistent: false, message: 'Ошибка анализа доменов' };
        }
    }

    checkCallbackPath(redirectUri) {
        const path = redirectUri.split('/').pop();

        if (!path) {
            return { correct: false, message: 'Отсутствует путь в URL' };
        }

        const goodPaths = ['callback', 'authorize', 'oauth'];
        const isGood = goodPaths.some(goodPath => path.toLowerCase().includes(goodPath));

        if (isGood) {
            return { correct: true, message: `Правильное имя пути: ${path}` };
        }

        return { correct: false, message: 'Рекомендуем /callback, /authorize или /oauth' };
    }

    checkNotificationPath(notificationUri) {
        const path = notificationUri.split('/').slice(-2).join('/'); // последние 2 компонента

        const goodPatterns = [
            'webhooks/yoomoney',
            'webhooks/payments',
            'api/webhook',
            'hooks/yoomoney'
        ];

        const isGood = goodPatterns.some(pattern => path.toLowerCase().includes(pattern));

        if (isGood) {
            return { correct: true, message: `Хорошая структура: /${path}` };
        }

        return { correct: false, message: 'Рекомендуем /webhooks/yoomoney или /api/webhook' };
    }

    calculateOverallScore(results) {
        let score = 0;
        let maxScore = 10;

        // Форматы URL (3 балла)
        if (results.serverUrlFormat.valid) score += 1;
        if (results.redirectUriFormat.valid) score += 1;
        if (results.notificationUriFormat.valid) score += 1;

        // HTTPS безопасность (2 балла)
        if (results.redirectHttpsSafe.safe) score += 1;
        if (results.notificationHttpsSafe.safe) score += 1;

        // Согласованность доменов (2 балла)
        if (results.domainConsistency.consistent) score += 2;

        // Структура путей (3 балла)
        if (results.callbackPath.correct) score += 1;
        if (results.notificationPath.correct) score += 2;

        let status = '❌ Требует доработки';
        if (score >= 7) status = '✅ Хорошие настройки';
        else if (score >= 5) status = '⚠️ Приемлемо, но требует улучшений';

        return { score: score, maxScore: maxScore, status: status };
    }

    generateRecommendations() {
        console.log('\n💡 РЕКОМЕНДАЦИИ ДЛЯ УСТРАНЕНИЯ ПРОБЛЕМ');
        console.log('=============================================\n');

        console.log('🔧 Общие рекомендации:');
        console.log('1. Используйте HTTPS для всех внешних callback и вебхуков');
        console.log('2. Один домен для всех URI (избегайте CORS проблем)');
        console.log('3. Стандартизированные пути: /callback, /webhooks/yoomoney');
        console.log('');

        console.log('📋 Рекомендуемые настройки по планам:');
        console.log('');

        console.log('# Для разработки (План A)');
        console.log('SERVER_URL=http://localhost:3000');
        console.log('YOOMONEY_REDIRECT_URI=http://localhost:3000/callback');
        console.log('# Для уведомлений используйте ngrok');
        console.log('');

        console.log('# Для внешнего тестирования (План B)');
        console.log('YOOMONEY_NGROK_SERVER_URL=https://abc123.ngrok.io');
        console.log('YOOMONEY_NGROK_REDIRECT_URI=https://abc123.ngrok.io/callback');
        console.log('');

        console.log('# Для production (План C)');
        console.log('YOOMONEY_PROD_SERVER_URL=https://your-domain.com');
        console.log('YOOMONEY_PROD_REDIRECT_URI=https://your-domain.com/auth/callback');
    }
}

// Запуск полного тестирования
if (require.main === module) {
    const tester = new YooMoneyFinalTester();

    tester.testAllPlans().then(() => {
        tester.generateRecommendations();
        console.log('\n✅ ВАЛИДАЦИЯ YOOMONEY НАСТРОЕК ЗАВЕРШЕНА');
    }).catch(console.error);
}

module.exports = { YooMoneyFinalTester };