# Настройка базы данных и RPC функций для тестирования

## 1. Создание таблиц

Выполните SQL из файла `setup_and_seed.sql` в Supabase SQL Editor для создания таблиц `users` и `orders` с тестовыми данными.

ИЛИ выполните по отдельности:
1. `create_users_table.sql` - для создания таблицы пользователей
2. `create_orders_table.sql` - для создания таблицы заказов

## 2. Создание RPC функций

Выполните SQL из файла `create_rpc_functions.sql` в Supabase SQL Editor для создания RPC функций:
- `insert_test_user()` - вставка одного пользователя
- `insert_test_order()` - вставка одного заказа
- `insert_all_test_data()` - вставка всех тестовых данных

## 3. Добавление Service Role Key (опционально)

Для использования RPC функций добавьте в `.env` файл:
```
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
```

Service Role Key можно получить в Supabase Dashboard -> Settings -> API -> Service Role Key

## 4. Запуск скрипта вставки данных

```bash
node insert_test_data.js
```

Скрипт автоматически:
- Попробует использовать RPC функцию (если доступен service role key)
- Или использует обычный метод с задержками для обхода schema cache
- Добавит 8 пользователей и 10 заказов

## 5. Проверка результатов

После выполнения скрипта проверьте админ-панель для подтверждения отображения данных.