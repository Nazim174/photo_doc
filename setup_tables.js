const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Чтение SQL файлов
function readSqlFile(filename) {
  const filePath = path.join(__dirname, filename);
  return fs.readFileSync(filePath, 'utf8');
}

async function setupTables() {
  console.log('🚀 Начинаем настройку таблиц в Supabase...');

  // Проверяем наличие service role key
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('❌ Отсутствует SUPABASE_SERVICE_ROLE_KEY в .env файле');
    console.log('📝 Добавьте следующую строку в ваш .env файл:');
    console.log('SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key');
    console.log('🔑 Получить ключ можно в Supabase Dashboard -> Settings -> API -> Service Role Key');
    process.exit(1);
  }

  if (!supabaseUrl) {
    console.error('❌ Отсутствует SUPABASE_URL в .env файле');
    process.exit(1);
  }

  // Создаем клиент с service role key для выполнения DDL команд
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Читаем SQL скрипты
    const usersSql = readSqlFile('create_users_table.sql');
    const ordersSql = readSqlFile('create_orders_table.sql');

    console.log('📄 Выполняем скрипт создания таблицы users...');

    // Разбиваем SQL на отдельные команды (по точке с запятой)
    const usersCommands = usersSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of usersCommands) {
      if (command.trim()) {
        console.log(`⚡ Выполняем: ${command.substring(0, 50)}...`);
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: command + ';'
        });

        if (error) {
          // Если функция exec_sql не существует, пробуем другой подход
          if (error.message.includes('function exec_sql')) {
            console.log('🔄 Используем альтернативный метод выполнения SQL...');
            // Для Supabase нужно использовать REST API напрямую или создать функцию
            console.log('⚠️  Для автоматического выполнения DDL требуется настройка RPC функции в Supabase');
            console.log('📋 Рекомендуется выполнить скрипты через веб-интерфейс Supabase');
            break;
          }
          throw error;
        }
        console.log('✅ Команда выполнена успешно');
      }
    }

    console.log('📄 Выполняем скрипт создания таблицы orders...');

    const ordersCommands = ordersSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of ordersCommands) {
      if (command.trim()) {
        console.log(`⚡ Выполняем: ${command.substring(0, 50)}...`);
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: command + ';'
        });

        if (error) {
          throw error;
        }
        console.log('✅ Команда выполнена успешно');
      }
    }

    console.log('🎉 Все таблицы созданы успешно!');
    console.log('🔍 Запустите test_connection.js для проверки подключения');

  } catch (error) {
    console.error('❌ Ошибка при создании таблиц:', error.message);

    if (error.message.includes('exec_sql')) {
      console.log('\n📝 Для автоматического выполнения SQL скриптов:');
      console.log('1. Создайте RPC функцию в Supabase SQL Editor:');
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
      `);
      console.log('2. Или выполните скрипты вручную через веб-интерфейс Supabase');
    }

    process.exit(1);
  }
}

// Запуск скрипта
if (require.main === module) {
  setupTables().catch(console.error);
}

module.exports = { setupTables };