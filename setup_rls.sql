-- Настройка Row Level Security (RLS) для существующих таблиц
-- Выполните этот скрипт в Supabase SQL Editor после создания таблиц

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

-- Проверка политик
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('users', 'orders')
ORDER BY tablename, policyname;