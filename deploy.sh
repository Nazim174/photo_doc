#!/bin/bash

echo "🚀 Начинаем развертывание на Vercel..."

# Проверяем наличие Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI не установлен"
    echo "Установите Vercel CLI: npm i -g vercel"
    exit 1
fi

# Проверяем наличие package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json не найден"
    exit 1
fi

# Проверяем наличие .env.production.example
if [ ! -f ".env.production.example" ]; then
    echo "⚠️  .env.production.example не найден"
    echo "Создайте его на основе .env.production.example"
fi

echo "✅ Все файлы найдены"

# Вход в Vercel (если не выполнен)
echo "🔐 Проверяем авторизацию в Vercel..."
if ! vercel whoami &> /dev/null; then
    echo "Необходимо авторизоваться в Vercel"
    vercel login
fi

echo "📦 Устанавливаем зависимости..."
npm install

echo "🎯 Создаем проект на Vercel (Preview deployment)..."
echo "Примечание: Используйте 'npm run deploy' для production deployment"

# Создаем preview deployment
vercel --yes

echo ""
echo "✅ Preview deployment завершен!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте работу приложения на предоставленном URL"
echo "2. Настройте кастомный домен (если планируете)"
echo "3. Запустите 'npm run deploy' для production"
echo ""
echo "🔗 Шаг 2: Настройка кастомного домена"
echo "В Vercel Dashboard:"
echo "1. Перейдите в проект"
echo "2. Settings > Domains"
echo "3. Добавьте свой домен"
echo "4. Добавьте DNS записи (CNAME на vercel-dns.com)"
echo ""
echo "💡 Для бесплатного домена:"
echo "- Идите на версайты типа Namecheap (.xyz за ~$15/год)"
echo "- Или используйте бесплатные домены от GitHub Pages"
echo ""
echo "🎉 Готово к работе!"