const express = require('express');
const router = express.Router();
const { supabase } = require('../../services/supabase');
console.log('DEBUG: supabase imported:', typeof supabase, supabase ? 'defined' : 'undefined');

// Middleware для проверки админ-доступа
const requireAdmin = (req, res, next) => {
  console.log('DEBUG: requireAdmin - req.session:', req.session ? 'exists' : 'null');
  console.log('DEBUG: requireAdmin - req.session.isAdmin:', req.session?.isAdmin);
  if (!req.session || !req.session.isAdmin) {
    console.log('DEBUG: requireAdmin - redirecting to /admin/login');
    return res.redirect('/admin/login');
  }
  // Обновляем время жизни сессии при активности
  req.session.touch();
  console.log('DEBUG: requireAdmin - session touched, proceeding to next');
  next();
};

// Главная страница админ-панели
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Получаем общее количество заказов
    const ordersResult = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    console.log('DEBUG: ordersResult:', ordersResult);
    const { count: totalOrders } = ordersResult;
    console.log('DEBUG: totalOrders after destructuring:', totalOrders);

    // Получаем общее количество пользователей
    const usersResult = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    console.log('DEBUG: usersResult:', usersResult);
    const { count: totalUsers } = usersResult;
    console.log('DEBUG: totalUsers after destructuring:', totalUsers);

    // Получаем недавние заказы (последние 10)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Получаем недавних пользователей (последние 10)
    const { data: recentUsers } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Логи для диагностики
    console.log('DEBUG: totalOrders value:', totalOrders);
    console.log('DEBUG: totalUsers value:', totalUsers);
    console.log('DEBUG: recentOrders length:', recentOrders?.length || 0);
    console.log('DEBUG: recentUsers length:', recentUsers?.length || 0);

    const renderData = {
      totalOrders: totalOrders || 0,
      totalUsers: totalUsers || 0,
      orders: recentOrders || [],
      users: recentUsers || []
    };
    console.log('DEBUG: renderData:', renderData);

    res.render('admin/index', renderData);
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    console.log('DEBUG: catch block - error details:', error.message, error.code);
    const catchRenderData = {
      totalOrders: 0,
      totalUsers: 0,
      orders: [],
      users: [],
      error: 'Ошибка загрузки данных'
    };
    console.log('DEBUG: catch block renderData:', catchRenderData);
    res.status(500).render('admin/index', catchRenderData);
  }
});

// Страница входа в админ-панель
router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

// Обработка входа
router.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
   const { username, password } = req.body;
   console.log('DEBUG: login POST - received username:', username);
   console.log('DEBUG: login POST - password provided:', password ? 'yes' : 'no');
   console.log('DEBUG: login POST - req.session before:', req.session);

   // Проверка наличия переменных окружения
   console.log('DEBUG: login POST - ADMIN_USERNAME:', process.env.ADMIN_USERNAME ? 'set' : 'not set');
   console.log('DEBUG: login POST - ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'set' : 'not set');
   console.log('DEBUG: login POST - ADMIN_USERNAME value:', process.env.ADMIN_USERNAME);
   console.log('DEBUG: login POST - ADMIN_PASSWORD value:', process.env.ADMIN_PASSWORD);
   if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
     console.error('ADMIN_USERNAME или ADMIN_PASSWORD не установлены в переменных окружения');
     res.render('admin/login', { error: 'Ошибка конфигурации сервера' });
     return;
   }

   // Простая проверка (в продакшене использовать bcrypt)
   console.log('DEBUG: comparing username:', username, '===', process.env.ADMIN_USERNAME, username === process.env.ADMIN_USERNAME);
   console.log('DEBUG: comparing password:', password, '===', process.env.ADMIN_PASSWORD, password === process.env.ADMIN_PASSWORD);
   console.log('DEBUG: password lengths - input:', password ? password.length : 0, 'expected:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0);
   console.log('DEBUG: password characters breakdown:');
   if (password) {
     console.log('  Input password chars:', password.split('').join(','));
   }
   if (process.env.ADMIN_PASSWORD) {
     console.log('  Expected password chars:', process.env.ADMIN_PASSWORD.split('').join(','));
   }
   console.log('DEBUG: password format check:');
   console.log('  Input has underscores:', password ? password.includes('_') : false);
   console.log('  Expected has underscores:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.includes('_') : false);
   const isValid = username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD;
   console.log('DEBUG: login POST - credentials valid:', isValid);
   if (isValid) {
     req.session.isAdmin = true;
     console.log('DEBUG: login POST - setting isAdmin to true');
     console.log('DEBUG: login POST - req.session after setting isAdmin:', req.session);
     console.log('DEBUG: login POST - req.session.id:', req.session.id);
     console.log('DEBUG: login POST - req.session.cookie:', req.session.cookie);
     console.log('DEBUG: login POST - redirecting to /admin');
     res.redirect('/admin');
   } else {
     console.log('DEBUG: login POST - invalid credentials, rendering error');
     console.log('DEBUG: attempting to render admin/login with error: Неверные учетные данные');
     res.render('admin/login', { error: 'Неверные учетные данные' });
   }
});

// Выход
router.post('/logout', (req, res) => {
  console.log('DEBUG: logout POST - destroying session');
  req.session.destroy((err) => {
    if (err) {
      console.error('Ошибка при уничтожении сессии:', err);
      return res.status(500).render('admin/login', { error: 'Ошибка при выходе' });
    }
    console.log('DEBUG: logout POST - session destroyed, clearing cookie');
    res.clearCookie('connect.sid'); // Очищаем cookie сессии
    res.redirect('/admin/login');
  });
});

module.exports = router;