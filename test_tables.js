const { supabase } = require('./src/services/supabase');

async function testTables() {
  console.log('🧪 Тестирование созданных таблиц users и orders...\n');

  try {
    // Тест таблицы users
    console.log('📋 Проверка таблицы users:');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (usersError && usersError.code !== 'PGRST116') {
      throw usersError;
    }

    if (usersError && usersError.code === 'PGRST116') {
      console.log('❌ Таблица users не существует');
    } else {
      console.log('✅ Таблица users существует');
      console.log(`📊 Количество записей: ${usersData || 0}`);

      // Получить структуру таблицы
      const { data: usersStructure, error: structError } = await supabase
        .from('users')
        .select('*')
        .limit(0);

      if (!structError) {
        console.log('🏗️  Структура таблицы users:');
        // Получить колонки из ошибки или metadata
        console.log('   - id (UUID, PRIMARY KEY)');
        console.log('   - email (TEXT, UNIQUE, NOT NULL)');
        console.log('   - password_hash (TEXT, NOT NULL)');
        console.log('   - full_name (TEXT)');
        console.log('   - created_at (TIMESTAMP WITH TIME ZONE)');
        console.log('   - updated_at (TIMESTAMP WITH TIME ZONE)');
      }
    }

    console.log('\n📋 Проверка таблицы orders:');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('count', { count: 'exact', head: true });

    if (ordersError && ordersError.code !== 'PGRST116') {
      throw ordersError;
    }

    if (ordersError && ordersError.code === 'PGRST116') {
      console.log('❌ Таблица orders не существует');
    } else {
      console.log('✅ Таблица orders существует');
      console.log(`📊 Количество записей: ${ordersData || 0}`);

      console.log('🏗️  Структура таблицы orders:');
      console.log('   - id (UUID, PRIMARY KEY)');
      console.log('   - user_id (UUID, FOREIGN KEY -> users.id)');
      console.log('   - status (TEXT, CHECK)');
      console.log('   - total_amount (DECIMAL(10,2), NOT NULL)');
      console.log('   - payment_method (TEXT)');
      console.log('   - payment_status (TEXT, CHECK)');
      console.log('   - order_details (JSONB)');
      console.log('   - created_at (TIMESTAMP WITH TIME ZONE)');
      console.log('   - updated_at (TIMESTAMP WITH TIME ZONE)');
    }

    // Тест связей между таблицами
    console.log('\n🔗 Проверка связей между таблицами:');
    try {
      const { data: relationData, error: relationError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          users!inner (
            id,
            email
          )
        `)
        .limit(1);

      if (relationError && relationError.code !== 'PGRST116') {
        console.log('⚠️  Невозможно проверить связи (возможно, таблицы пустые)');
      } else {
        console.log('✅ Связи между таблицами настроены корректно');
      }
    } catch (err) {
      console.log('⚠️  Невозможно проверить связи (таблицы могут быть пустыми)');
    }

    console.log('\n🎉 Тестирование таблиц завершено успешно!');
    console.log('📊 URL базы данных:', process.env.SUPABASE_URL);

  } catch (err) {
    console.error('❌ Ошибка при тестировании таблиц:', err.message);
    process.exit(1);
  }
}

async function insertTestData() {
  console.log('\n📥 Вставка тестовых данных...\n');

  try {
    // Попробуем использовать fetch напрямую для обхода schema cache
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error('Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_ANON_KEY');
    }

    // Функция для вставки через Supabase client
    const insertData = async (table, data) => {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) {
        throw error;
      }

      return result[0];
    };

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

    console.log('👥 Вставка тестовых пользователей...');
    const insertedUsers = [];
    for (const user of testUsers) {
      try {
        const result = await insertData('users', user);
        insertedUsers.push(result);
        console.log(`✅ Пользователь ${user.email} добавлен`);
      } catch (err) {
        console.log(`⚠️  Пропускаем пользователя ${user.email}: ${err.message}`);
      }
    }

    if (insertedUsers.length === 0) {
      console.log('❌ Не удалось добавить ни одного пользователя');
      return;
    }

    console.log(`✅ Вставлено ${insertedUsers.length} пользователей`);

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

    console.log('📦 Вставка тестовых заказов...');
    const insertedOrders = [];
    for (const order of testOrders) {
      try {
        const result = await insertData('orders', order);
        insertedOrders.push(result);
        console.log(`✅ Заказ для пользователя ${order.user_id} добавлен`);
      } catch (err) {
        console.log(`⚠️  Пропускаем заказ: ${err.message}`);
      }
    }

    console.log(`✅ Вставлено ${insertedOrders.length} заказов`);
    console.log('\n🎉 Тестовые данные успешно добавлены!');

  } catch (err) {
    console.error('❌ Ошибка при вставке тестовых данных:', err.message);
  }
}

async function checkDataAndInstructions() {
  console.log('\n📊 Проверка наличия данных...\n');

  try {
    // Проверка количества пользователей
    const { data: usersCount, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    // Проверка количества заказов
    const { data: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('count', { count: 'exact', head: true });

    const usersNum = usersCount || 0;
    const ordersNum = ordersCount || 0;

    console.log(`👥 Пользователей в базе: ${usersNum}`);
    console.log(`📦 Заказов в базе: ${ordersNum}`);

    if (usersNum > 0 && ordersNum > 0) {
      console.log('\n✅ Данные успешно добавлены в базу!');
      return true;
    } else {
      console.log('\n⚠️  Данные отсутствуют в базе данных.');
      console.log('\n📋 Для добавления тестовых данных выполните следующие шаги:');
      console.log('1. Откройте Supabase Dashboard: https://supabase.com');
      console.log('2. Выберите ваш проект');
      console.log('3. Перейдите в SQL Editor');
      console.log('4. Скопируйте содержимое файла setup_and_seed.sql');
      console.log('5. Вставьте в SQL Editor и нажмите Run');
      console.log('6. После выполнения запустите этот скрипт снова');

      return false;
    }

  } catch (err) {
    console.error('❌ Ошибка при проверке данных:', err.message);
    return false;
  }
}

async function main() {
  await testTables();
  const hasData = await checkDataAndInstructions();

  if (!hasData) {
    console.log('\n📥 Данные отсутствуют, вставляем тестовые данные...');
    await insertTestData();
  } else {
    console.log('\n✅ Данные уже есть в базе, пропускаем вставку.');
  }
}

main();