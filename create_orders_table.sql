-- Создание таблицы orders
CREATE TABLE orders (
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
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Индекс для status для фильтрации
CREATE INDEX idx_orders_status ON orders(status);

-- Индекс для created_at для сортировки по дате
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Триггер для обновления updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();