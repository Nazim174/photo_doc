const { userService, orderService, supabase } = require('./src/services/supabase');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Функция задержки для обхода schema cache
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Создание клиента с service role для RPC (если доступен)
let supabaseAdmin = null;
try {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    supabaseAdmin = createClient(process.env.SUPABASE_URL, serviceRoleKey);
    console.log('✅ Supabase admin client создан для RPC операций');
  }
} catch (err) {
  console.log('⚠️  Service role key не найден, будет использоваться обычный клиент');
}

async function insertTestData() {
  console.log('📥 Вставка тестовых данных с обходом schema cache...\n');

  try {
    // Попытка использовать RPC функцию для вставки данных
    if (supabaseAdmin) {
      console.log('🚀 Использование RPC функции для обхода schema cache...');
      try {
        const { data, error } = await supabaseAdmin.rpc('insert_all_test_data');
        if (error) throw error;

        console.log('✅ Тестовые данные успешно добавлены через RPC!');
        console.log(`👥 Пользователи: ${data[0].users_count}`);
        console.log(`📦 Заказы: ${data[0].orders_count}`);

        return { insertedUsers: Array(data[0].users_count).fill({}), insertedOrders: Array(data[0].orders_count).fill({}) };
      } catch (err) {
        console.log('⚠️  RPC функция не доступна:', err.message);
        console.log('🔄 Переход к обычному методу вставки...');
      }
    }

    // Обновление schema cache путем выполнения запросов
    console.log('🔄 Обновление schema cache...');
    await sleep(1000);

    // Попытка обновить cache путем select запросов
    try {
      await supabase.from('users').select('id').limit(1);
      console.log('✅ Cache для таблицы users обновлен');
    } catch (err) {
      console.log('⚠️  Таблица users не существует или cache не обновлен:', err.message);
    }

    try {
      await supabase.from('orders').select('id').limit(1);
      console.log('✅ Cache для таблицы orders обновлен');
    } catch (err) {
      console.log('⚠️  Таблица orders не существует или cache не обновлен:', err.message);
    }

    // Дополнительная задержка
    await sleep(1000);

    // Тестовые пользователи
    const testUsers = [
      { email: 'user1@example.com', password_hash: 'hashed_password_1', full_name: 'Иван Иванов' },
      { email: 'user2@example.com', password_hash: 'hashed_password_2', full_name: 'Мария Петрова' },
      { email: 'user3@example.com', password_hash: 'hashed_password_3', full_name: 'Алексей Сидоров' },
      { email: 'user4@example.com', password_hash: 'hashed_password_4', full_name: 'Елена Кузнецова' },
      { email: 'user5@example.com', password_hash: 'hashed_password_5', full_name: 'Дмитрий Новиков' },
      { email: 'user6@example.com', password_hash: 'hashed_password_6', full_name: 'Ольга Морозова' },
      { email: 'user7@example.com', password_hash: 'hashed_password_7', full_name: 'Сергей Волков' },
      { email: 'user8@example.com', password_hash: 'hashed_password_8', full_name: 'Анна Соколова' }
    ];

    console.log('👥 Вставка тестовых пользователей с задержками...');
    const insertedUsers = [];
    for (const user of testUsers) {
      try {
        const result = await userService.createUser(user);
        insertedUsers.push(result);
        console.log(`✅ Пользователь ${user.email} добавлен`);

        // Задержка между вставками для обхода schema cache
        await sleep(500);
      } catch (err) {
        console.log(`⚠️  Пропускаем пользователя ${user.email}: ${err.message}`);
        await sleep(200); // Короткая задержка даже при ошибке
      }
    }

    if (insertedUsers.length === 0) {
      console.log('❌ Не удалось добавить ни одного пользователя');
      return;
    }

    console.log(`✅ Вставлено ${insertedUsers.length} пользователей`);

    // Дополнительная задержка перед вставкой заказов
    console.log('⏳ Ожидание перед вставкой заказов...');
    await sleep(1500);

    // Получить user_id для заказов
    const userIds = insertedUsers.map(user => user.id);

    // Тестовые заказы
    const testOrders = [
      {
        user_id: userIds[0],
        status: 'pending',
        total_amount: 150.50,
        payment_method: 'card',
        payment_status: 'pending',
        order_details: { items: [{ name: 'Фото печать', quantity: 2, price: 75.25 }] }
      },
      {
        user_id: userIds[1],
        status: 'processing',
        total_amount: 299.99,
        payment_method: 'paypal',
        payment_status: 'paid',
        order_details: { items: [{ name: 'Фото альбом', quantity: 1, price: 299.99 }] }
      },
      {
        user_id: userIds[2],
        status: 'completed',
        total_amount: 89.00,
        payment_method: 'card',
        payment_status: 'paid',
        order_details: { items: [{ name: 'Фото на документы', quantity: 3, price: 29.67 }] }
      },
      {
        user_id: userIds[3],
        status: 'cancelled',
        total_amount: 450.00,
        payment_method: 'bank_transfer',
        payment_status: 'failed',
        order_details: { items: [{ name: 'Свадебный фото пакет', quantity: 1, price: 450.00 }] }
      },
      {
        user_id: userIds[4],
        status: 'pending',
        total_amount: 120.75,
        payment_method: 'card',
        payment_status: 'pending',
        order_details: { items: [{ name: 'Фото ретушь', quantity: 5, price: 24.15 }] }
      },
      {
        user_id: userIds[5],
        status: 'processing',
        total_amount: 199.99,
        payment_method: 'paypal',
        payment_status: 'paid',
        order_details: { items: [{ name: 'Фото сессия', quantity: 1, price: 199.99 }] }
      },
      {
        user_id: userIds[6],
        status: 'completed',
        total_amount: 350.00,
        payment_method: 'card',
        payment_status: 'paid',
        order_details: { items: [{ name: 'Корпоративное фото', quantity: 2, price: 175.00 }] }
      },
      {
        user_id: userIds[7],
        status: 'completed',
        total_amount: 75.25,
        payment_method: 'cash',
        payment_status: 'paid',
        order_details: { items: [{ name: 'Фото печать', quantity: 1, price: 75.25 }] }
      },
      {
        user_id: userIds[0],
        status: 'pending',
        total_amount: 225.50,
        payment_method: 'card',
        payment_status: 'pending',
        order_details: { items: [{ name: 'Фото коллаж', quantity: 3, price: 75.17 }] }
      },
      {
        user_id: userIds[1],
        status: 'processing',
        total_amount: 499.99,
        payment_method: 'paypal',
        payment_status: 'paid',
        order_details: { items: [{ name: 'Премиум фото пакет', quantity: 1, price: 499.99 }] }
      }
    ];

    console.log('📦 Вставка тестовых заказов с задержками...');
    const insertedOrders = [];
    for (const order of testOrders) {
      try {
        const result = await orderService.createOrder(order);
        insertedOrders.push(result);
        console.log(`✅ Заказ для пользователя ${order.user_id} добавлен`);

        // Задержка между вставками заказов
        await sleep(700);
      } catch (err) {
        console.log(`⚠️  Пропускаем заказ: ${err.message}`);
        await sleep(300); // Короткая задержка даже при ошибке
      }
    }

    console.log(`✅ Вставлено ${insertedOrders.length} заказов`);
    console.log('\n🎉 Тестовые данные успешно добавлены с обходом schema cache!');

    return { insertedUsers, insertedOrders };

  } catch (err) {
    console.error('❌ Ошибка при вставке тестовых данных:', err.message);
    throw err;
  }
}

// Запуск скрипта
if (require.main === module) {
  insertTestData()
    .then((result) => {
      console.log('\n📊 Сводка добавленных данных:');
      console.log(`👥 Пользователи: ${result?.insertedUsers?.length || 0}`);
      console.log(`📦 Заказы: ${result?.insertedOrders?.length || 0}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Скрипт завершен с ошибкой:', err.message);
      process.exit(1);
    });
}

module.exports = insertTestData;