-- SQL скрипт для создания таблиц и добавления тестовых данных
-- Выполните этот скрипт в Supabase SQL Editor

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

-- Индекс для user_id для быстрого поиска заказов пользователя
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Индекс для status для фильтрации
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Индекс для created_at для сортировки по дате
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Триггер для обновления updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Вставка тестовых пользователей
INSERT INTO users (email, password_hash, full_name) VALUES
('user1@example.com', 'hashed_password_1', 'Иван Иванов'),
('user2@example.com', 'hashed_password_2', 'Мария Петрова'),
('user3@example.com', 'hashed_password_3', 'Алексей Сидоров'),
('user4@example.com', 'hashed_password_4', 'Елена Кузнецова'),
('user5@example.com', 'hashed_password_5', 'Дмитрий Новиков'),
('user6@example.com', 'hashed_password_6', 'Ольга Морозова'),
('user7@example.com', 'hashed_password_7', 'Сергей Волков'),
('user8@example.com', 'hashed_password_8', 'Анна Соколова');

-- Получение user_id для заказов
-- Вставка тестовых заказов
INSERT INTO orders (user_id, status, total_amount, payment_method, payment_status, order_details) VALUES
((SELECT id FROM users WHERE email = 'user1@example.com'), 'pending', 150.50, 'card', 'pending', '{"items": [{"name": "Фото печать", "quantity": 2, "price": 75.25}]}'),
((SELECT id FROM users WHERE email = 'user2@example.com'), 'processing', 299.99, 'paypal', 'paid', '{"items": [{"name": "Фото альбом", "quantity": 1, "price": 299.99}]}'),
((SELECT id FROM users WHERE email = 'user3@example.com'), 'completed', 89.00, 'card', 'paid', '{"items": [{"name": "Фото на документы", "quantity": 3, "price": 29.67}]}'),
((SELECT id FROM users WHERE email = 'user4@example.com'), 'cancelled', 450.00, 'bank_transfer', 'failed', '{"items": [{"name": "Свадебный фото пакет", "quantity": 1, "price": 450.00}]}'),
((SELECT id FROM users WHERE email = 'user5@example.com'), 'pending', 120.75, 'card', 'pending', '{"items": [{"name": "Фото ретушь", "quantity": 5, "price": 24.15}]}'),
((SELECT id FROM users WHERE email = 'user6@example.com'), 'processing', 199.99, 'paypal', 'paid', '{"items": [{"name": "Фото сессия", "quantity": 1, "price": 199.99}]}'),
((SELECT id FROM users WHERE email = 'user7@example.com'), 'completed', 350.00, 'card', 'paid', '{"items": [{"name": "Корпоративное фото", "quantity": 2, "price": 175.00}]}'),
((SELECT id FROM users WHERE email = 'user8@example.com'), 'completed', 75.25, 'cash', 'paid', '{"items": [{"name": "Фото печать", "quantity": 1, "price": 75.25}]}'),
((SELECT id FROM users WHERE email = 'user1@example.com'), 'pending', 225.50, 'card', 'pending', '{"items": [{"name": "Фото коллаж", "quantity": 3, "price": 75.17}]}'),
((SELECT id FROM users WHERE email = 'user2@example.com'), 'processing', 499.99, 'paypal', 'paid', '{"items": [{"name": "Премиум фото пакет", "quantity": 1, "price": 499.99}]}');

-- Настройка Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

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

-- Проверка результатов
SELECT 'Users count:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Orders count:', COUNT(*) FROM orders;