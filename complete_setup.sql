-- ПОЛНАЯ НАСТРОЙКА БАЗЫ ДАННЫХ SUPABASE ДЛЯ ПРОЕКТА PHOTO_DOC
-- Выполните этот скрипт в Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- =============================================================================
-- 1. СОЗДАНИЕ ТАБЛИЦ
-- =============================================================================

-- Создание таблицы users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для email для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Создание таблицы orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для таблицы orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =============================================================================
-- 2. СОЗДАНИЕ ФУНКЦИЙ И ТРИГГЕРОВ
-- =============================================================================

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для вставки пользователя
CREATE OR REPLACE FUNCTION insert_test_user(
  user_email TEXT,
  user_password_hash TEXT,
  user_full_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO users (email, password_hash, full_name)
  VALUES (user_email, user_password_hash, user_full_name)
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$;

-- Функция для вставки заказа
CREATE OR REPLACE FUNCTION insert_test_order(
  order_user_id UUID,
  order_status TEXT,
  order_total_amount DECIMAL,
  order_payment_method TEXT,
  order_payment_status TEXT,
  order_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
BEGIN
  INSERT INTO orders (user_id, status, total_amount, payment_method, payment_status, order_details)
  VALUES (order_user_id, order_status, order_total_amount, order_payment_method, order_payment_status, order_details)
  RETURNING id INTO new_order_id;

  RETURN new_order_id;
END;
$$;

-- Функция для массовой вставки тестовых данных
CREATE OR REPLACE FUNCTION insert_all_test_data()
RETURNS TABLE(users_count BIGINT, orders_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_ids UUID[];
  i INTEGER;
BEGIN
  -- Вставка пользователей
  FOR i IN 1..8 LOOP
    user_ids := array_append(user_ids, insert_test_user(
      'user' || i || '@example.com',
      'hashed_password_' || i,
      CASE i
        WHEN 1 THEN 'Иван Иванов'
        WHEN 2 THEN 'Мария Петрова'
        WHEN 3 THEN 'Алексей Сидоров'
        WHEN 4 THEN 'Елена Кузнецова'
        WHEN 5 THEN 'Дмитрий Новиков'
        WHEN 6 THEN 'Ольга Морозова'
        WHEN 7 THEN 'Сергей Волков'
        WHEN 8 THEN 'Анна Соколова'
      END
    ));
  END LOOP;

  -- Вставка заказов
  PERFORM insert_test_order(user_ids[1], 'pending', 150.50, 'card', 'pending', '{"items": [{"name": "Фото печать", "quantity": 2, "price": 75.25}]}');
  PERFORM insert_test_order(user_ids[2], 'processing', 299.99, 'paypal', 'paid', '{"items": [{"name": "Фото альбом", "quantity": 1, "price": 299.99}]}');
  PERFORM insert_test_order(user_ids[3], 'completed', 89.00, 'card', 'paid', '{"items": [{"name": "Фото на документы", "quantity": 3, "price": 29.67}]}');
  PERFORM insert_test_order(user_ids[4], 'cancelled', 450.00, 'bank_transfer', 'failed', '{"items": [{"name": "Свадебный фото пакет", "quantity": 1, "price": 450.00}]}');
  PERFORM insert_test_order(user_ids[5], 'pending', 120.75, 'card', 'pending', '{"items": [{"name": "Фото ретушь", "quantity": 5, "price": 24.15}]}');
  PERFORM insert_test_order(user_ids[6], 'processing', 199.99, 'paypal', 'paid', '{"items": [{"name": "Фото сессия", "quantity": 1, "price": 199.99}]}');
  PERFORM insert_test_order(user_ids[7], 'completed', 350.00, 'card', 'paid', '{"items": [{"name": "Корпоративное фото", "quantity": 2, "price": 175.00}]}');
  PERFORM insert_test_order(user_ids[8], 'completed', 75.25, 'cash', 'paid', '{"items": [{"name": "Фото печать", "quantity": 1, "price": 75.25}]}');
  PERFORM insert_test_order(user_ids[1], 'pending', 225.50, 'card', 'pending', '{"items": [{"name": "Фото коллаж", "quantity": 3, "price": 75.17}]}');
  PERFORM insert_test_order(user_ids[2], 'processing', 499.99, 'paypal', 'paid', '{"items": [{"name": "Премиум фото пакет", "quantity": 1, "price": 499.99}]}');

  -- Возврат количества вставленных записей
  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM users WHERE email LIKE 'user%@example.com') as users_count,
    (SELECT COUNT(*) FROM orders WHERE user_id = ANY(user_ids)) as orders_count;
END;
$$;

-- =============================================================================
-- 3. НАСТРОЙКА ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Включение RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Удаление существующих политик (если есть)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users for testing" ON users;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Allow all operations on orders for testing" ON orders;

-- Политики для таблицы users
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert users" ON users
    FOR INSERT WITH CHECK (true);

-- Политики для таблицы orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Временные политики для тестирования (разрешить все операции для анонимных пользователей)
-- Удалите эти политики после настройки аутентификации
CREATE POLICY "Allow all operations on users for testing" ON users
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on orders for testing" ON orders
    FOR ALL USING (true);

-- =============================================================================
-- 4. ДОБАВЛЕНИЕ ТЕСТОВЫХ ДАННЫХ
-- =============================================================================

-- Выполнение функции для вставки тестовых данных
SELECT * FROM insert_all_test_data();

-- =============================================================================
-- 5. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- =============================================================================

-- Проверка количества записей
SELECT 'Users count:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Orders count:', COUNT(*) FROM orders;

-- Проверка политик RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('users', 'orders')
ORDER BY tablename, policyname;

-- Проверка функций
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_name IN ('insert_test_user', 'insert_test_order', 'insert_all_test_data', 'update_updated_at_column')
AND routine_schema = 'public';

-- =============================================================================
-- НАСТРОЙКА ЗАВЕРШЕНА!
-- =============================================================================

-- Следующие шаги:
-- 1. Запустите test_connection.js для проверки подключения
-- 2. Запустите test_tables.js для проверки таблиц и данных
-- 3. После настройки аутентификации удалите временные RLS политики:
--    DROP POLICY "Allow all operations on users for testing" ON users;
--    DROP POLICY "Allow all operations on orders for testing" ON orders;