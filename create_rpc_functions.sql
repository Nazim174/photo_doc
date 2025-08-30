-- SQL скрипт для создания RPC функций для вставки тестовых данных
-- Выполните этот скрипт в Supabase SQL Editor

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