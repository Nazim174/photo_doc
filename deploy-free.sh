#!/bin/bash

# Полная поддержка бесплатных доменов
# 🚀 Универсальный скрипт развертывания photo_doc

set -e

# ========== ОБЩИЕ ФУНКЦИИ ==========
check_files() {
    echo "🔍 Проверяем необходимые файлы..."

    if [ ! -f "package.json" ]; then
        echo "❌ package.json не найден"
        exit 1
    fi

    if [ ! -f ".env.production.example" ]; then
        echo "⚠️  Создаем .env.production.example..."
        cat > .env.production.example << 'EOF'
NODE_ENV=production
SERVER_URL=https://your-free-domain.vercel.app
YOOMONEY_PROD_SERVER_URL=https://your-free-domain.vercel.app
YOOMONEY_PROD_REDIRECT_URI=https://your-free-domain.vercel.app/auth/callback

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# YooMoney
YOOMONEY_ACCESS_TOKEN=your-token
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
EOF
    fi

    echo "✅ Файлы проверены"
}

setup_free_domain() {
    local url=$1
    local platform=$2

    echo ""
    echo "🎁 БЕСПЛАТНЫЙ ДОМЕН НАСТРОЕН!"
    echo "🌐 URL: $url"
    echo ""

    # Создаем .env.production с актуальным URL
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        # Заменяем плейсхолдеры на реальный URL
        sed -i "s|https://your-free-domain\.vercel\.app|$url|g" .env.production
        sed -i "s|https://your-project\.supabase\.co|$SUPABASE_URL|g" .env.production 2>/dev/null || true

        echo "📝 Обновлен .env.production"
        echo "🔧 Измените следующие переменные:"
        echo "   - SUPABASE_URL"
        echo "   - SUPABASE_ANON_KEY"
        echo "   - YOOMONEY_ACCESS_TOKEN"
        echo ""
    fi

    echo "✅ $platform развертывание завершено!"
    echo ""
    echo "🎯 Следующие шаги:"
    echo "1. Настройте платежи в YooMoney Dashboard"
    echo "2. Обновите webhook URL: $url/webhooks"
    echo "3. Протестируйте развертывание"
    echo ""
    echo "💡 Стоимость: 0₽ | Время: 5 минут"
}

setup_github_actions() {
    mkdir -p .github/workflows

    cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
EOF

    echo "✅ GitHub Actions workflow создан"
}

# ========== VERCEL DEPLOYMENT ==========
deploy_vercel() {
    echo "🚀 Развертывание на Vercel..."

    # Проверяем файлы
    check_files

    # Устанавливаем зависимости
    echo "📦 Устанавливаем зависимости..."
    npm install

    # Проверяем авторизацию (используем npx)
    if ! npx vercel whoami &> /dev/null; then
        echo "🔐 Авторизуемся в Vercel..."
        echo "Откройте браузер и войдите в Vercel..."
        npx vercel login
    fi

    # Развертывание (используем npx для совместимости с NixOS)
    echo "🎯 Создаем preview deployment..."
    DEPLOY_OUTPUT=$(npx vercel --yes 2>&1)
    echo "$DEPLOY_OUTPUT"

    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

    if [ -z "$DEPLOY_URL" ]; then
        echo "❌ Не удалось получить URL развертывания"
        echo "Проверяем возможный URL в выводе..."
        echo "Если развертывание прошло успешно, проверьте Vercel dashboard"
        exit 1
    fi

    echo "✅ Развернуто на: $DEPLOY_URL"

    # Настраиваем бесплатный домен
    setup_free_domain "$DEPLOY_URL" "vercel"
}

# ========== RAILWAY DEPLOYMENT ==========
deploy_railway() {
    echo "🚂 Развертывание на Railway..."

    # Проверяем файлы
    check_files

    # Проверяем и устанавливаем Railway CLI через nix-shell
    echo "🔧 Проверяем Railway CLI..."
    if ! command -v railway &> /dev/null; then
        echo "📦 Устанавливаем Railway CLI через nix-shell..."
        if command -v nix-shell &> /dev/null; then
            if ! nix-shell -p railway --run "railway --version" &> /dev/null; then
                echo "❌ Ошибка установки Railway CLI через nix-shell"
                echo "🔄 Пробуем глобальную установку..."
                npm install -g railway
            else
                echo "✅ Railway CLI доступен через nix-shell"
                RAILWAY_CMD="nix-shell -p railway --run 'railway"
                RAILWAY_SUFFIX="'"
            fi
        else
            echo "📦 Устанавливаем Railway CLI глобально..."
            npm install -g railway
            RAILWAY_CMD="railway"
            RAILWAY_SUFFIX=""
        fi
    else
        RAILWAY_CMD="railway"
        RAILWAY_SUFFIX=""
    fi

    # Устанавливаем зависимости проекта
    echo "📦 Устанавливаем зависимости проекта..."
    npm install

    # Создаем railway.toml если не существует (создаем до авторизации)
    if [ ! -f "railway.toml" ]; then
        echo "📝 Создаем railway.toml..."
        cat > railway.toml << 'EOF'
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"

[environments.production]
NODE_ENV = "production"
EOF
        echo "✅ Создан railway.toml"
    fi

    # Проверяем авторизацию Railway
    if ! eval "${RAILWAY_CMD} logout${RAILWAY_SUFFIX}" &> /dev/null; then
        echo "🔄 Проверяем статус авторизации..."
    fi

    if ! eval "${RAILWAY_CMD} whoami${RAILWAY_SUFFIX}" &> /dev/null; then
        echo "🔐 Требуется авторизация в Railway"
        echo ""
        echo "🚀 Инструкция по авторизации:"
        echo "1. Откройте новый терминал"
        echo "2. Выполните одну из команд:"
        echo "   • nix-shell -p railway --run 'railway login'"
        echo "   • npm install -g railway && railway login"
        echo ""
        echo "3. После успешной авторизации вернитесь и запустите:"
        echo "   bash deploy-free.sh railway"
        echo ""
        exit 1
    fi

    # Инициализируем проект если railway.json не существует
    if [ ! -f "railway.json" ]; then
        echo "🎯 Инициализируем Railway проект..."
        eval "${RAILWAY_CMD} init --yes --name 'photo-doc-$(date +%s)'${RAILWAY_SUFFIX}" 2>&1 || {
            echo "❌ Ошибка инициализации проекта"
            exit 1
        }
    fi

    # Развертываем на Railway
    echo "🚀 Развертываем приложение..."
    DEPLOY_OUTPUT=$(eval "${RAILWAY_CMD} up --detach${RAILWAY_SUFFIX}" 2>&1)
    echo "$DEPLOY_OUTPUT"

    # Ждем завершения развертывания
    echo "⏳ Ждем завершения развертывания..."
    sleep 15

    # Получаем URL развертывания
    DEPLOY_URL=$(eval "${RAILWAY_CMD} domain${RAILWAY_SUFFIX}" 2>&1 | grep -o 'https://[^ ]*.up.railway.app' | head -1)

    if [ -z "$DEPLOY_URL" ]; then
        echo "⚠️  Не удалось автоматически получить URL"
        echo "🔍 Проверяем статус развертывания..."
        eval "${RAILWAY_CMD} status${RAILWAY_SUFFIX}"

        echo ""
        echo "📋 Возможные действия:"
        echo "1. Проверьте Railway dashboard для получения URL"
        echo "2. Используйте: railway domain"
        echo "3. Или используйте: nix-shell -p railway --run 'railway domain'"

        # Попробуем получить URL через railway open
        DEPLOY_URL=$(eval "${RAILWAY_CMD} open --print-url${RAILWAY_SUFFIX}" 2>/dev/null || echo "")

        if [ -z "$DEPLOY_URL" ]; then
            echo "❌ Не удалось получить URL развертывания"
            echo "🙋 Проверьте Railway dashboard или выполните railway domain вручную"
            exit 1
        fi
    fi

    echo "✅ Развернуто на Railway: $DEPLOY_URL"

    # Настраиваем бесплатный домен
    setup_free_domain "$DEPLOY_URL" "railway"
}

# ========== LOGIC ==========
# Выбор платформы
if [ -n "$1" ]; then
    case "$1" in
        1|Vercel|vercel)
            deploy_vercel
            ;;
        2|Railway|railway)
            deploy_railway
            ;;
        *)
            echo "❌ Неверный выбор. Используйте: $0 [vercel|railway]"
            exit 1
            ;;
    esac
else
    echo "🚀 Выберите платформу для развертывания:"
    echo "1. Vercel (БЕСПЛАТНО, рекомендуется)"
    echo "2. Railway (БЕСПЛАТНО, 512MB RAM)"
    echo ""
    echo "Используйте: $0 [vercel|railway]"
    echo ""
    echo "🎉 Удачного развертывания! Обе платформы бесплатны."
fi