# Инструкции по выполнению SQL скриптов в Supabase

## 1. Вход в Supabase Dashboard

1. Перейдите на сайт [supabase.com](https://supabase.com) и войдите в свою учетную запись.
2. Выберите ваш проект из списка или создайте новый проект, если его еще нет.

## 2. Доступ к SQL Editor

1. В левой панели навигации выберите **SQL Editor** (редактор SQL).
2. Нажмите на кнопку **+ New query** (Новая запрос), чтобы открыть новый редактор запросов.

## 3. Выполнение скрипта для таблицы users

1. Скопируйте содержимое файла `create_users_table.sql`:

```
-- Создание таблицы users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для email для быстрого поиска
CREATE INDEX idx_users_email ON users(email);

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
```

2. Вставьте этот код в SQL Editor.
3. Нажмите кнопку **Run** (Выполнить) для выполнения скрипта.
4. Проверьте, что скрипт выполнен успешно (в нижней части появится сообщение об успехе).

## 4. Выполнение скрипта для таблицы orders

1. Создайте новый запрос (**+ New query**).
2. Скопируйте содержимое файла `create_orders_table.sql`:

```
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
```

3. Вставьте этот код в SQL Editor.
4. Нажмите кнопку **Run** (Выполнить) для выполнения скрипта.
5. Убедитесь, что скрипт выполнен успешно.

## 5. Проверка созданных таблиц

1. В левой панели навигации выберите **Table Editor**.
2. Убедитесь, что таблицы `users` и `orders` появились в списке.
3. Нажмите на каждую таблицу, чтобы просмотреть ее структуру и убедиться, что все поля и индексы созданы корректно.

## Важные замечания

- **Порядок выполнения**: Сначала выполните скрипт для таблицы `users`, затем для `orders`, так как `orders` ссылается на `users` через внешний ключ.
- **Безопасность**: Не выполняйте эти скрипты в продакшен среде без предварительного тестирования.
- **Резервное копирование**: Рекомендуется создать резервную копию базы данных перед выполнением скриптов.
- **Ошибки**: Если возникают ошибки, проверьте права доступа вашей учетной записи и корректность переменных окружения.