const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Настройка клиента Supabase с использованием переменных из .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('DEBUG: Supabase initialization:');
console.log('DEBUG: SUPABASE_URL:', supabaseUrl ? 'set (length: ' + supabaseUrl.length + ')' : 'not set');
console.log('DEBUG: SUPABASE_ANON_KEY:', supabaseKey ? 'set (length: ' + supabaseKey.length + ')' : 'not set');

// Проверка на плейсхолдеры
const isPlaceholderUrl = supabaseUrl && supabaseUrl.includes('your-project-id');
const isPlaceholderKey = supabaseKey && supabaseKey.includes('your_supabase_anon_key_here');

console.log('DEBUG: URL is placeholder:', isPlaceholderUrl);
console.log('DEBUG: KEY is placeholder:', isPlaceholderKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('DEBUG: Supabase initialization failed - missing environment variables');
  throw new Error('Отсутствуют переменные SUPABASE_URL или SUPABASE_ANON_KEY в .env файле');
}

if (isPlaceholderUrl || isPlaceholderKey) {
  console.error('DEBUG: Supabase initialization failed - placeholder values detected');
  throw new Error('Переменные SUPABASE_URL или SUPABASE_ANON_KEY содержат плейсхолдеры. Замените их на реальные значения из вашего проекта Supabase.');
}

console.log('DEBUG: Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('DEBUG: Supabase client created successfully');
console.log('DEBUG: supabase type:', typeof supabase);
console.log('DEBUG: supabase.from method exists:', typeof supabase.from);

// Базовые функции для работы с пользователями
const userService = {
  // Получить всех пользователей
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;
    return data;
  },

  // Найти пользователя по email
  findUserByEmail: async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 - not found
    return data;
  },

  // Создать нового пользователя
  createUser: async (userData) => {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Обновить пользователя
  updateUser: async (id, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Удалить пользователя
  deleteUser: async (id) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Базовые функции для работы с заказами
const orderService = {
  // Получить все заказы
  getOrders: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*');
    if (error) throw error;
    return data;
  },

  // Создать новый заказ
  createOrder: async (orderData) => {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Обновить заказ
  updateOrder: async (id, updates) => {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Удалить заказ
  deleteOrder: async (id) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Найти заказы по user_id
  getOrdersByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Найти заказы по email пользователя
  getOrdersByEmail: async (email) => {
    // Сначала найти пользователя по email
    const user = await userService.findUserByEmail(email);
    if (!user) return [];

    // Затем получить его заказы
    return await orderService.getOrdersByUserId(user.id);
  },

  // Найти заказы по номеру телефона (поиск в JSON order_details)
  getOrdersByPhone: async (phone) => {
    // Нормализуем номер телефона для поиска (убираем пробелы, дефисы и т.д.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Фильтруем заказы, где телефон совпадает (поиск в JSON)
    return data.filter(order => {
      const contactInfo = order.order_details?.contact_info;
      if (!contactInfo || !contactInfo.phone) return false;

      const orderPhone = contactInfo.phone.replace(/[\s\-\(\)]/g, '');
      return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
    });
  },

  // Найти заказ по ID
  getOrderById: async (id) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 - not found
    return data;
  }
};

module.exports = {
  supabase,
  userService,
  orderService
};