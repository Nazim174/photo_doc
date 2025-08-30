const { supabase } = require('./src/services/supabase');

async function testConnection() {
  try {
    console.log('Тестирование подключения к Supabase...');

    // Простой запрос для проверки подключения
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') { // PGRST116 - таблица не существует
      throw error;
    }

    console.log('✅ Подключение к Supabase успешно установлено!');
    console.log('📊 URL базы данных:', process.env.SUPABASE_URL);

    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Таблица users не существует. Необходимо выполнить SQL скрипты для создания таблиц.');
    } else {
      console.log('📋 Количество записей в таблице users:', data || 0);
    }

  } catch (err) {
    console.error('❌ Ошибка подключения к Supabase:', err.message);
    console.error('❌ Детали ошибки:', err);
    if (err.cause) {
      console.error('❌ Причина:', err.cause);
    }
    process.exit(1);
  }
}

testConnection();