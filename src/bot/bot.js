require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const { userService, orderService } = require('../services/supabase');

console.log('DEBUG: Bot initialization:');
console.log('DEBUG: TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'set (length: ' + process.env.TELEGRAM_BOT_TOKEN.length + ')' : 'not set');

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('DEBUG: Bot initialization failed - TELEGRAM_BOT_TOKEN not found in environment');
  throw new Error('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
console.log('DEBUG: Bot instance created successfully');

// Использование session middleware
bot.use(session());

// Определение меню категорий и товаров
const menuCategories = {
  photosession: { name: 'Фотосессии', items: ['Портретная съемка - 5000 руб.', 'Семейная съемка - 7000 руб.'] },
  printing: { name: 'Печать фотографий', items: ['Печать 10x15 - 100 руб.', 'Печать 20x30 - 300 руб.'] },
  editing: { name: 'Цифровое редактирование', items: ['Базовое редактирование - 1000 руб.', 'Расширенное редактирование - 2500 руб.'] }
};

// Обработка команды /start
bot.start((ctx) => {
  ctx.reply('Привет! Я ваш Telegram бот. Используйте /help для получения списка команд.');
});

// Обработка команды /help
bot.help((ctx) => {
  ctx.reply(
    '📋 Список доступных команд:\n\n' +
    '🚀 /start - начать работу с ботом\n' +
    '❓ /help - показать эту справку\n\n' +
    '📖 /menu - показать меню товаров и услуг\n' +
    '   Выберите категорию для просмотра доступных товаров\n\n' +
    '🛒 /order - оформить новый заказ\n' +
    '   Следуйте инструкциям для выбора товаров и ввода контактных данных\n\n' +
    '💳 /pay - оплатить существующий заказ через Telegram\n' +
    '   Введите номер заказа для создания инвойса\n\n' +
    '📄 /invoice - создать счет на оплату\n' +
    '   Создайте инвойс для заказа или услуги\n\n' +
    '📊 /status - проверить статус существующего заказа\n' +
    '   Введите email или телефон, использованный при оформлении заказа\n\n' +
    '❌ /cancel - отменить активный заказ\n' +
    '   Введите email или телефон для поиска и отмены заказа\n\n' +
    '💡 Для получения дополнительной помощи обратитесь в поддержку.'
  );
});

// Обработка команды /order
bot.command('order', (ctx) => {
   try {
     // Инициализация сессии, если не существует
     if (!ctx.session) ctx.session = {};
     // Инициализация состояния заказа
     ctx.session.order = {
       step: 'select_category',
       selectedItems: [],
       contactInfo: {},
       totalAmount: 0
     };

     const keyboard = Object.keys(menuCategories).map(key => [{ text: menuCategories[key].name, callback_data: `order_category_${key}` }]);
     ctx.reply('Добро пожаловать в процесс оформления заказа! Выберите категорию товара:', {
       reply_markup: { inline_keyboard: keyboard }
     });
   } catch (error) {
     console.error('Ошибка в команде /order:', error);
     ctx.reply('Произошла ошибка при запуске оформления заказа. Попробуйте позже.');
   }
 });

// Обработка команды /status
bot.command('status', (ctx) => {
   try {
     // Инициализация сессии, если не существует
     if (!ctx.session) ctx.session = {};
     // Инициализация состояния проверки статуса
     ctx.session.statusCheck = {
       step: 'request_contact'
     };

     ctx.reply(
       'Проверка статуса заказа\n\n' +
       'Введите ваш email или номер телефона, использованный при оформлении заказа:'
     );
   } catch (error) {
     console.error('Ошибка в команде /status:', error);
     ctx.reply('Произошла ошибка при запуске проверки статуса. Попробуйте позже.');
   }
 });

// Обработка команды /cancel
bot.command('cancel', (ctx) => {
   try {
     // Инициализация сессии, если не существует
     if (!ctx.session) ctx.session = {};
     // Инициализация состояния отмены заказа
     ctx.session.cancelOrder = {
       step: 'request_contact'
     };

     ctx.reply(
       'Отмена заказа\n\n' +
       'Введите ваш email или номер телефона, использованный при оформлении заказа:'
     );
   } catch (error) {
     console.error('Ошибка в команде /cancel:', error);
     ctx.reply('Произошла ошибка при запуске отмены заказа. Попробуйте позже.');
   }
 });

// Обработка команды /menu
bot.command('menu', (ctx) => {
   const keyboard = Object.keys(menuCategories).map(key => [{ text: menuCategories[key].name, callback_data: key }]);
   ctx.reply('Добро пожаловать в наше меню! Выберите категорию:', {
     reply_markup: { inline_keyboard: keyboard }
   });
});

// Обработка команды /yookassa - оплата через YooMoney (обновлено)
bot.command('yookassa', async (ctx) => {
    try {
       if (!ctx.session) ctx.session = {};
       ctx.session.yookassaProcess = { step: 'request_order_id' };

       ctx.reply(
          '💳 Оплата заказа через YooMoney кошелёк\n\n' +
          'Для оплаты существующего заказа введите номер заказа (можно получить из /status).\n\n' +
          'Формат: order_id (например: 123e4567-e89b-12d3-a456-426614174000)\n\n' +
          'После ввода номера система создаст платёжную ссылку для оплаты через YooMoney кошелёк.'
       );
    } catch (error) {
       console.error('Ошибка в команде /yookassa:', error);
       ctx.reply('Произошла ошибка при запуске оплаты через YooMoney. Попробуйте позже.');
    }
});

// Обработка команды /qr - оплата через QR-код
bot.command('qr', async (ctx) => {
   try {
      if (!ctx.session) ctx.session = {};
      ctx.session.qrProcess = { step: 'request_order_id' };

      ctx.reply(
         '📱 Оплата заказа через QR-код\n\n' +
         'Для оплаты существующего заказа введите номер заказа (можно получить из /status).\n\n' +
         'Формат: order_id (например: 123e4567-e89b-12d3-a456-426614174000)\n\n' +
         'После ввода номера система создаст QR-код и ссылку для оплаты.'
      );
   } catch (error) {
      console.error('Ошибка в команде /qr:', error);
      ctx.reply('Произошла ошибка при запуске оплаты через QR. Попробуйте позже.');
   }
});

// Обработка команды /pay
bot.command('pay', async (ctx) => {
    try {
       // Инициализация сессии, если не существует
       if (!ctx.session) ctx.session = {};

       // Создаем клавиатуру с вариантами оплаты
       const paymentKeyboard = {
          reply_markup: {
             inline_keyboard: [
                [{ text: '💳 Telegram Payments', callback_data: 'pay_telegram' }],
                [{ text: '🏦 YooMoney кошелёк', callback_data: 'pay_yookassa' }],
                [{ text: '📱 QR-код для оплаты', callback_data: 'pay_qr' }],
                [{ text: '🚫 Отмена', callback_data: 'pay_cancel' }]
             ]
          }
       };

       ctx.reply(
          '💳 Выберите способ оплаты заказа:\n\n' +
          '1. 💳 Telegram Payments - оплата через Telegram\n' +
          '2. 🏦 YooMoney кошелёк - оплата через YooMoney\n' +
          '3. 📱 QR-код - оплата через QR-код\n\n' +
          'Или используйте команды:\n' +
          '• /yookassa для оплаты через YooMoney\n' +
          '• /qr для оплаты через QR-код'
       ).then(() => {
          ctx.reply('Выберите способ оплаты:', paymentKeyboard);
       });
    } catch (error) {
       console.error('Ошибка в команде /pay:', error);
       ctx.reply('Произошла ошибка при запуске оплаты. Попробуйте позже.');
    }
 });

// Обработка команды /invoice
bot.command('invoice', async (ctx) => {
   try {
      // Инициализация сессии, если не существует
      if (!ctx.session) ctx.session = {};

      ctx.reply(
         '📄 Создание счета на оплату\n\n' +
         'Эта функция позволяет создать счет для оплаты услуг.\n' +
         'Выберите услугу из меню или введите номер заказа для создания счета:',
         {
            reply_markup: {
               inline_keyboard: [
                  [{ text: '📋 Выбрать услугу из меню', callback_data: 'invoice_from_menu' }],
                  [{ text: '🔍 Найти существующий заказ', callback_data: 'invoice_from_order' }],
                  [{ text: '❌ Отмена', callback_data: 'invoice_cancel' }]
               ]
            }
         }
      );
   } catch (error) {
      console.error('Ошибка в команде /invoice:', error);
      ctx.reply('Произошла ошибка при создании счета. Попробуйте позже.');
   }
});

// Обработка callback запросов для меню
bot.on('callback_query', (ctx) => {
    try {
      const data = ctx.callbackQuery.data;
      if (!data) {
        ctx.answerCbQuery('Неверные данные запроса');
        return;
      }

      // Обработка платежей и инвойсов
      if (data.startsWith('invoice_') || data.startsWith('payment_') || data.startsWith('pay_')) {
        handlePaymentCallback(ctx, data);
        return;
      }

      // Обработка проверки статуса заказа
      if (data.startsWith('status_') && ctx.session?.statusCheck) {
        handleStatusCallback(ctx, data);
        return;
      }

      // Обработка отмены заказа
      if (data.startsWith('cancel_') && ctx.session?.cancelOrder) {
        handleCancelCallback(ctx, data);
        return;
      }

     // Обработка простого просмотра меню
     if (!data.startsWith('order_') && ctx.session?.order === undefined) {
       const category = data;
       if (menuCategories[category]) {
         const items = menuCategories[category].items.map((item, index) => [{ text: item, callback_data: `item_${category}_${index}` }]);
         items.push([{ text: 'Назад к категориям', callback_data: 'back_to_categories' }]);
         ctx.editMessageText(`Категория: ${menuCategories[category].name}\n\nВыберите товар:`, {
           reply_markup: { inline_keyboard: items }
         });
       } else if (category === 'back_to_categories') {
         const keyboard = Object.keys(menuCategories).map(key => [{ text: menuCategories[key].name, callback_data: key }]);
         ctx.editMessageText('Добро пожаловать в наше меню! Выберите категорию:', {
           reply_markup: { inline_keyboard: keyboard }
         });
       } else if (category.startsWith('item_')) {
         const parts = category.split('_');
         if (parts.length < 3) {
           ctx.answerCbQuery('Неверный формат товара');
           return;
         }
         const cat = parts[1];
         const index = parseInt(parts[2]);
         if (isNaN(index) || !menuCategories[cat] || !menuCategories[cat].items[index]) {
           ctx.answerCbQuery('Товар не найден');
           return;
         }
         const item = menuCategories[cat].items[index];
         ctx.answerCbQuery(`Вы выбрали: ${item}`);
       } else {
         ctx.answerCbQuery('Неизвестная команда');
       }
     }
     // Обработка процесса заказа
     else if (data.startsWith('order_') && ctx.session?.order) {
       handleOrderCallback(ctx, data);
     } else {
       ctx.answerCbQuery('Неизвестная команда или сессия истекла');
     }
   } catch (error) {
     console.error('Ошибка в callback обработчике:', error);
     ctx.answerCbQuery('Произошла ошибка при обработке запроса');
   }
 });

// Обработка текстовых сообщений для процесса заказа
bot.on('text', (ctx) => {
     try {
       const order = ctx.session?.order;
       const statusCheck = ctx.session?.statusCheck;
       const cancelOrder = ctx.session?.cancelOrder;
       const paymentProcess = ctx.session?.paymentProcess;
       const yookassaProcess = ctx.session?.yookassaProcess;
       const qrProcess = ctx.session?.qrProcess;

       if (!order && !statusCheck && !cancelOrder && !paymentProcess && !yookassaProcess && !qrProcess) return;

      const text = ctx.message?.text;
      if (!text) return;

      // Обработка проверки статуса
      if (statusCheck && statusCheck.step === 'request_contact') {
        handleStatusCheck(ctx, text);
        return;
      }

      // Обработка отмены заказа
      if (cancelOrder && cancelOrder.step === 'request_contact') {
        handleCancelOrderCheck(ctx, text);
        return;
      }

      // Обработка распределения платежного процесса
      if (paymentProcess && paymentProcess.step === 'request_order_id') {
        handlePaymentDistribution(ctx, text);
        return;
      }

      // Обработка YooKassa платежного процесса
      if (yookassaProcess && yookassaProcess.step === 'request_order_id') {
        handleYooKassaPayment(ctx, text);
        return;
      }

      // Обработка QR платежного процесса
      if (qrProcess && qrProcess.step === 'request_order_id') {
        handleQRPayment(ctx, text);
        return;
      }

     // Обработка заказа
     if (order && order.step === 'collect_contact') {
       if (!order.contactInfo.name) {
         if (text.trim().length < 2) {
           ctx.reply('Пожалуйста, введите корректное имя (минимум 2 символа):');
           return;
         }
         order.contactInfo.name = text.trim();
         ctx.reply('Теперь введите ваш email:');
       } else if (!order.contactInfo.email) {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(text.trim())) {
           ctx.reply('Пожалуйста, введите корректный email:');
           return;
         }
         order.contactInfo.email = text.trim();
         ctx.reply('Теперь введите ваш номер телефона:');
       } else if (!order.contactInfo.phone) {
         const phoneRegex = /^\+?\d[\d\s\-\(\)]{8,}$/;
         if (!phoneRegex.test(text.trim())) {
           ctx.reply('Пожалуйста, введите корректный номер телефона:');
           return;
         }
         order.contactInfo.phone = text.trim();
         order.step = 'confirm_order';
         const itemsText = order.selectedItems.map((item, idx) => `${idx + 1}. ${item.item}`).join('\n');
         ctx.reply(
           `Подтвердите ваш заказ:\n\n` +
           `Товары:\n${itemsText}\n\n` +
           `Общая сумма: ${order.totalAmount} руб.\n\n` +
           `Контактная информация:\n` +
           `Имя: ${order.contactInfo.name}\n` +
           `Email: ${order.contactInfo.email}\n` +
           `Телефон: ${order.contactInfo.phone}\n\n` +
           `Введите "да" для подтверждения или "нет" для отмены:`
         );
       }
     } else if (order && order.step === 'confirm_order') {
       if (text.toLowerCase() === 'да' || text.toLowerCase() === 'yes') {
         handleOrderConfirmation(ctx);
       } else if (text.toLowerCase() === 'нет' || text.toLowerCase() === 'no') {
         ctx.reply('Заказ отменен. Используйте /order для начала нового заказа.');
         delete ctx.session.order;
       } else {
         ctx.reply('Пожалуйста, введите "да" или "нет":');
       }
     }
   } catch (error) {
     console.error('Ошибка в обработчике текстовых сообщений:', error);
     ctx.reply('Произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.');
   }
 });

// Обработка pre-checkout query (проверка платежа перед обработкой)
bot.on('pre_checkout_query', async (ctx) => {
 try {
   // Здесь можно добавить дополнительную валидацию платежа
   // Например, проверить что товар еще доступен, проверить сумму и т.д.

   // Подтверждаем платеж
   await ctx.answerPreCheckoutQuery(true);

   console.log('Pre-checkout query approved for order:', ctx.preCheckoutQuery.invoice_payload);

 } catch (error) {
   console.error('Ошибка в pre_checkout_query:', error);
   await ctx.answerPreCheckoutQuery(false, 'Произошла ошибка при обработке платежа');
 }
});

// Обработка успешного платежа
bot.on('successful_payment', async (ctx) => {
 try {
   const payment = ctx.message.successful_payment;
   const orderId = payment.invoice_payload; // order ID из payload

   console.log('Payment successful for order:', orderId);

   // Обновляем статус платежа в базе данных
   await orderService.updateOrder(orderId, {
     payment_status: 'paid',
     status: 'processing' // Меняем статус заказа на "в обработке"
   });

   // Отправляем подтверждение пользователю
   ctx.reply(
     `✅ Платеж успешно обработан!\n\n` +
     `💳 Сумма: ${payment.total_amount / 100} RUB\n` +
     `🧾 Номер платежа: ${payment.telegram_payment_charge_id}\n` +
     `📋 Заказ #${orderId.slice(0, 8)}\n\n` +
     `🎉 Благодарим за оплату! Ваш заказ будет обработан в ближайшее время.`
   );

 } catch (error) {
   console.error('Ошибка при обработке успешного платежа:', error);
   ctx.reply('❌ Платеж был получен, но произошла ошибка при обновлении статуса заказа. Свяжитесь с поддержкой.');
 }
});

// Функция обработки callback'ов для заказа
function handleOrderCallback(ctx, data) {
   try {
     const order = ctx.session.order;
     if (!order) {
       ctx.answerCbQuery('Сессия заказа истекла. Начните заново с /order');
       return;
     }

     if (data === 'order_back_to_categories') {
       order.step = 'select_category';
       const keyboard = Object.keys(menuCategories).map(key => [{ text: menuCategories[key].name, callback_data: `order_category_${key}` }]);
       ctx.editMessageText('Выберите категорию товара:', {
         reply_markup: { inline_keyboard: keyboard }
       });
     } else if (data.startsWith('order_category_')) {
       const category = data.replace('order_category_', '');
       if (menuCategories[category]) {
         order.step = 'select_item';
         order.currentCategory = category;
         const items = menuCategories[category].items.map((item, index) => [
           { text: item, callback_data: `order_item_${category}_${index}` },
           { text: 'Добавить', callback_data: `order_add_${category}_${index}` }
         ]).flat();
         items.push({ text: 'Назад к категориям', callback_data: 'order_back_to_categories' });
         items.push({ text: 'Завершить выбор товаров', callback_data: 'order_finish_selection' });
         ctx.editMessageText(`Категория: ${menuCategories[category].name}\n\nВыберите товары для добавления в заказ:`, {
           reply_markup: { inline_keyboard: items.map(item => [item]) }
         });
       } else {
         ctx.answerCbQuery('Категория не найдена');
       }
     } else if (data.startsWith('order_add_')) {
       const parts = data.split('_');
       if (parts.length < 4) {
         ctx.answerCbQuery('Неверный формат данных товара');
         return;
       }
       const category = parts[2];
       const index = parseInt(parts[3]);
       if (isNaN(index) || !menuCategories[category] || !menuCategories[category].items[index]) {
         ctx.answerCbQuery('Товар не найден');
         return;
       }
       const item = menuCategories[category].items[index];
       const priceMatch = item.match(/(\d+)\s*руб\./);
       if (!priceMatch) {
         ctx.answerCbQuery('Ошибка в формате цены товара');
         return;
       }
       const price = parseFloat(priceMatch[1]);
       order.selectedItems.push({
         category,
         item,
         price: price
       });
       order.totalAmount += price;
       ctx.answerCbQuery(`Товар добавлен: ${item}`);
     } else if (data === 'order_finish_selection') {
       if (order.selectedItems.length === 0) {
         ctx.answerCbQuery('Выберите хотя бы один товар!');
         return;
       }
       order.step = 'collect_contact';
       ctx.editMessageText(`Вы выбрали следующие товары:\n${order.selectedItems.map((item, idx) => `${idx + 1}. ${item.item}`).join('\n')}\n\nОбщая сумма: ${order.totalAmount} руб.\n\nТеперь введите ваше имя:`, {
         reply_markup: { inline_keyboard: [] }
       });
     }
   } catch (error) {
     console.error('Ошибка в handleOrderCallback:', error);
     ctx.answerCbQuery('Произошла ошибка при обработке заказа');
   }
 }

// Функция подтверждения и сохранения заказа
async function handleOrderConfirmation(ctx) {
  const order = ctx.session.order;

  try {
    // Поиск существующего пользователя по email или создание нового
    let user = await userService.findUserByEmail(order.contactInfo.email);

    if (!user) {
      // Создаем нового пользователя
      user = await userService.createUser({
        email: order.contactInfo.email,
        password_hash: 'telegram_user_' + Date.now(), // Уникальный пароль для telegram пользователей
        full_name: order.contactInfo.name
      });
    }

    // Создание заказа
    const orderData = {
      user_id: user.id,
      status: 'pending',
      total_amount: order.totalAmount,
      payment_method: 'telegram_bot',
      payment_status: 'pending',
      order_details: {
        items: order.selectedItems,
        contact_info: order.contactInfo
      }
    };

    const savedOrder = await orderService.createOrder(orderData);

    // Создание инвойса для оплаты заказа
    ctx.reply(
      `✅ Заказ успешно оформлен!\n\n` +
      `📋 Номер заказа: ${savedOrder.id}\n` +
      `📊 Статус: Ожидает оплаты\n` +
      `💰 Общая сумма: ${order.totalAmount} руб.\n\n` +
      `💳 Готовим счет для оплаты...`
    );

    // Создаем инвойс для оплаты
    try {
      await createInvoiceForOrder(ctx, savedOrder);

      ctx.reply(
        `💳 Для оплаты заказа используйте инвойс выше или команду /pay ${savedOrder.id}\n\n` +
        `📞 Ваши контактные данные:\n` +
        `Имя: ${order.contactInfo.name}\n` +
        `Email: ${order.contactInfo.email}\n` +
        `Телефон: ${order.contactInfo.phone}\n\n` +
        `💡 После оплаты заказ будет обработан автоматически.`
      );
    } catch (error) {
      console.error('Ошибка при создании инвойса после заказа:', error);
      ctx.reply(
        `❌ Заказ создан, но не удалось подготовить счет для оплаты.\n` +
        `Используйте команду /pay ${savedOrder.id} для оплаты позже.\n\n` +
        `📞 Мы свяжемся с вами для решения вопроса оплаты.`
      );
    }

    // Очистка состояния
    delete ctx.session.order;

  } catch (error) {
    console.error('Ошибка при сохранении заказа:', error);
    ctx.reply('❌ Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте позже или обратитесь в поддержку.');
    delete ctx.session.order;
  }
}

// Функция обработки проверки статуса заказа
async function handleStatusCheck(ctx, input) {
  const statusCheck = ctx.session.statusCheck;

  try {
    let orders = [];

    // Определяем тип ввода (email или телефон)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());

    if (isEmail) {
      // Поиск по email
      orders = await orderService.getOrdersByEmail(input.trim());
    } else {
      // Поиск по телефону
      orders = await orderService.getOrdersByPhone(input.trim());
    }

    if (orders.length === 0) {
      ctx.reply(
        'Заказы не найдены.\n\n' +
        'Возможные причины:\n' +
        '• Неверно введен email или телефон\n' +
        '• Заказ еще не оформлен\n' +
        '• Произошла ошибка в системе\n\n' +
        'Попробуйте ввести данные еще раз или обратитесь в поддержку.'
      );
      delete ctx.session.statusCheck;
      return;
    }

    // Сохраняем найденные заказы в сессии
    statusCheck.orders = orders;
    statusCheck.step = 'select_order';

    // Создаем клавиатуру с заказами
    const keyboard = orders.map((order, index) => [{
      text: `Заказ #${order.id.slice(0, 8)} - ${formatStatus(order.status)} - ${order.total_amount} руб.`,
      callback_data: `status_order_${index}`
    }]);

    keyboard.push([{ text: 'Начать заново', callback_data: 'status_restart' }]);

    ctx.reply(
      `Найдено ${orders.length} заказ(ов):\n\n` +
      'Выберите заказ для просмотра подробной информации:',
      {
        reply_markup: { inline_keyboard: keyboard }
      }
    );

  } catch (error) {
    console.error('Ошибка при поиске заказов:', error);
    ctx.reply('Произошла ошибка при поиске заказов. Пожалуйста, попробуйте позже.');
    delete ctx.session.statusCheck;
  }
}

// Функция обработки callback'ов для статуса заказа
async function handleStatusCallback(ctx, data) {
  const statusCheck = ctx.session.statusCheck;

  if (data === 'status_restart') {
    delete ctx.session.statusCheck;
    ctx.editMessageText(
      'Проверка статуса заказа\n\n' +
      'Введите ваш email или номер телефона, использованный при оформлении заказа:'
    );
    return;
  }

  if (data.startsWith('status_order_')) {
    const orderIndex = parseInt(data.replace('status_order_', ''));
    const order = statusCheck.orders[orderIndex];

    if (!order) {
      ctx.answerCbQuery('Заказ не найден');
      return;
    }

    try {
      // Получаем полную информацию о заказе
      const fullOrder = await orderService.getOrderById(order.id);

      const itemsText = fullOrder.order_details?.items ?
        fullOrder.order_details.items.map((item, idx) => `${idx + 1}. ${item.item}`).join('\n') :
        'Информация о товарах недоступна';

      const contactInfo = fullOrder.order_details?.contact_info || {};

      const message =
        `📋 Детали заказа #${fullOrder.id.slice(0, 8)}\n\n` +
        `📊 Статус: ${formatStatus(fullOrder.status)}\n` +
        `💰 Сумма: ${fullOrder.total_amount} руб.\n` +
        `💳 Статус оплаты: ${formatPaymentStatus(fullOrder.payment_status)}\n` +
        `📅 Дата заказа: ${formatDate(fullOrder.created_at)}\n\n` +
        `🛒 Товары:\n${itemsText}\n\n` +
        `👤 Контактная информация:\n` +
        `Имя: ${contactInfo.name || 'Не указано'}\n` +
        `Email: ${contactInfo.email || 'Не указан'}\n` +
        `Телефон: ${contactInfo.phone || 'Не указан'}`;

      const keyboard = [[{ text: '← Назад к списку заказов', callback_data: 'status_back_to_list' }]];

      ctx.editMessageText(message, {
        reply_markup: { inline_keyboard: keyboard }
      });

    } catch (error) {
      console.error('Ошибка при получении деталей заказа:', error);
      ctx.answerCbQuery('Ошибка при загрузке деталей заказа');
    }
  } else if (data === 'status_back_to_list') {
    // Возврат к списку заказов
    const orders = statusCheck.orders;
    const keyboard = orders.map((order, index) => [{
      text: `Заказ #${order.id.slice(0, 8)} - ${formatStatus(order.status)} - ${order.total_amount} руб.`,
      callback_data: `status_order_${index}`
    }]);

    keyboard.push([{ text: 'Начать заново', callback_data: 'status_restart' }]);

    ctx.editMessageText(
      `Найдено ${orders.length} заказ(ов):\n\n` +
      'Выберите заказ для просмотра подробной информации:',
      {
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }
}

// Функция обработки отмены заказа
async function handleCancelOrderCheck(ctx, input) {
  const cancelOrder = ctx.session.cancelOrder;

  try {
    let orders = [];

    // Определяем тип ввода (email или телефон)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());

    if (isEmail) {
      // Поиск по email
      orders = await orderService.getOrdersByEmail(input.trim());
    } else {
      // Поиск по телефону
      orders = await orderService.getOrdersByPhone(input.trim());
    }

    // Фильтруем только активные заказы (не отмененные)
    const activeOrders = orders.filter(order => order.status !== 'cancelled');

    if (activeOrders.length === 0) {
      ctx.reply(
        'Активные заказы не найдены.\n\n' +
        'Возможные причины:\n' +
        '• Неверно введен email или телефон\n' +
        '• У вас нет активных заказов\n' +
        '• Все заказы уже отменены или завершены\n\n' +
        'Попробуйте ввести данные еще раз или обратитесь в поддержку.'
      );
      delete ctx.session.cancelOrder;
      return;
    }

    // Сохраняем найденные активные заказы в сессии
    cancelOrder.orders = activeOrders;
    cancelOrder.step = 'select_order';

    // Создаем клавиатуру с активными заказами
    const keyboard = activeOrders.map((order, index) => [{
      text: `Заказ #${order.id.slice(0, 8)} - ${formatStatus(order.status)} - ${order.total_amount} руб.`,
      callback_data: `cancel_order_${index}`
    }]);

    keyboard.push([{ text: 'Начать заново', callback_data: 'cancel_restart' }]);

    ctx.reply(
      `Найдено ${activeOrders.length} активных заказ(ов):\n\n` +
      'Выберите заказ для отмены:',
      {
        reply_markup: { inline_keyboard: keyboard }
      }
    );

  } catch (error) {
    console.error('Ошибка при поиске заказов для отмены:', error);
    ctx.reply('Произошла ошибка при поиске заказов. Пожалуйста, попробуйте позже.');
    delete ctx.session.cancelOrder;
  }
}

// Функция обработки callback'ов для отмены заказа
async function handleCancelCallback(ctx, data) {
  const cancelOrder = ctx.session.cancelOrder;

  if (data === 'cancel_restart') {
    delete ctx.session.cancelOrder;
    ctx.editMessageText(
      'Отмена заказа\n\n' +
      'Введите ваш email или номер телефона, использованный при оформлении заказа:'
    );
    return;
  }

  if (data.startsWith('cancel_order_')) {
    const orderIndex = parseInt(data.replace('cancel_order_', ''));
    const order = cancelOrder.orders[orderIndex];

    if (!order) {
      ctx.answerCbQuery('Заказ не найден');
      return;
    }

    try {
      // Получаем полную информацию о заказе
      const fullOrder = await orderService.getOrderById(order.id);

      const itemsText = fullOrder.order_details?.items ?
        fullOrder.order_details.items.map((item, idx) => `${idx + 1}. ${item.item}`).join('\n') :
        'Информация о товарах недоступна';

      const contactInfo = fullOrder.order_details?.contact_info || {};

      const message =
        `📋 Детали заказа #${fullOrder.id.slice(0, 8)}\n\n` +
        `📊 Статус: ${formatStatus(fullOrder.status)}\n` +
        `💰 Сумма: ${fullOrder.total_amount} руб.\n` +
        `💳 Статус оплаты: ${formatPaymentStatus(fullOrder.payment_status)}\n` +
        `📅 Дата заказа: ${formatDate(fullOrder.created_at)}\n\n` +
        `🛒 Товары:\n${itemsText}\n\n` +
        `👤 Контактная информация:\n` +
        `Имя: ${contactInfo.name || 'Не указано'}\n` +
        `Email: ${contactInfo.email || 'Не указан'}\n` +
        `Телефон: ${contactInfo.phone || 'Не указан'}\n\n` +
        `⚠️ Вы уверены, что хотите отменить этот заказ?`;

      const keyboard = [
        [{ text: '✅ Да, отменить заказ', callback_data: `cancel_confirm_${orderIndex}` }],
        [{ text: '❌ Нет, вернуться к списку', callback_data: 'cancel_back_to_list' }]
      ];

      ctx.editMessageText(message, {
        reply_markup: { inline_keyboard: keyboard }
      });

    } catch (error) {
      console.error('Ошибка при получении деталей заказа:', error);
      ctx.answerCbQuery('Ошибка при загрузке деталей заказа');
    }
  } else if (data === 'cancel_back_to_list') {
    // Возврат к списку заказов
    const orders = cancelOrder.orders;
    const keyboard = orders.map((order, index) => [{
      text: `Заказ #${order.id.slice(0, 8)} - ${formatStatus(order.status)} - ${order.total_amount} руб.`,
      callback_data: `cancel_order_${index}`
    }]);

    keyboard.push([{ text: 'Начать заново', callback_data: 'cancel_restart' }]);

    ctx.editMessageText(
      `Найдено ${orders.length} активных заказ(ов):\n\n` +
      'Выберите заказ для отмены:',
      {
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  } else if (data.startsWith('cancel_confirm_')) {
    const orderIndex = parseInt(data.replace('cancel_confirm_', ''));
    const order = cancelOrder.orders[orderIndex];

    if (!order) {
      ctx.answerCbQuery('Заказ не найден');
      return;
    }

    try {
      // Обновляем статус заказа на 'cancelled'
      await orderService.updateOrder(order.id, { status: 'cancelled' });

      ctx.editMessageText(
        `✅ Заказ #${order.id.slice(0, 8)} успешно отменен!\n\n` +
        `📊 Новый статус: Отменен\n` +
        `💰 Сумма: ${order.total_amount} руб.\n\n` +
        `Если у вас возникнут вопросы, пожалуйста, обратитесь в поддержку.`
      );

      delete ctx.session.cancelOrder;

    } catch (error) {
      console.error('Ошибка при отмене заказа:', error);
      ctx.answerCbQuery('Ошибка при отмене заказа');
    }
  }
}

// Вспомогательные функции форматирования
function formatStatus(status) {
  const statusMap = {
    'pending': 'Ожидает обработки',
    'processing': 'В обработке',
    'completed': 'Завершен',
    'cancelled': 'Отменен'
  };
  return statusMap[status] || status;
}

function formatPaymentStatus(paymentStatus) {
  const paymentMap = {
    'pending': 'Ожидает оплаты',
    'paid': 'Оплачен',
    'failed': 'Ошибка оплаты',
    'refunded': 'Возвращен'
  };
  return paymentMap[paymentStatus] || paymentStatus;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Функция обработки распределения платежей
async function handlePaymentDistribution(ctx, orderId) {
   // Определяем провайдера на основе сессии
   const provider = ctx.session.paymentProcess?.provider || 'telegram';

   try {
     // Поиск заказа по ID
     const order = await orderService.getOrderById(orderId.trim());

     if (!order) {
       ctx.reply(
         '❌ Заказ не найден.\n\n' +
         'Проверьте правильность введенного номера заказа или используйте /status для поиска.'
       );
       delete ctx.session.paymentProcess;
       return;
     }

     if (order.payment_status === 'paid') {
       ctx.reply(
         `✅ Заказ #${order.id.slice(0, 8)} уже оплачен!\n\n` +
         `📊 Статус: Оплачен\n` +
         `💰 Сумма: ${order.total_amount} руб.`
       );
       delete ctx.session.paymentProcess;
       return;
     }

     // В зависимости от провайдера создаем соответствующий платеж
     if (provider === 'telegram') {
       await createInvoiceForOrder(ctx, order);
     } else if (provider === 'yookassa') {
       await createYooKassaPaymentForOrder(ctx, order);
     } else if (provider === 'qr') {
       await createQRPaymentForOrder(ctx, order);
     }
   } catch (error) {
     console.error('Ошибка при обработке распределения платежей:', error);
     ctx.reply('❌ Произошла ошибка при обработке оплаты. Попробуйте позже.');
     if (ctx.session) {
       delete ctx.session.paymentProcess;
       delete ctx.session.yookassaProcess;
       delete ctx.session.qrProcess;
     }
   }
}

// Функция обработки YooKassa платежей
async function handleYooKassaPayment(ctx, orderId) {
   try {
     // Поиск заказа по ID
     const order = await orderService.getOrderById(orderId.trim());

     if (!order) {
       ctx.reply(
         '❌ Заказ не найден.\n\n' +
         'Проверьте правильность введенного номера заказа или используйте /status для поиска.'
       );
       delete ctx.session.yookassaProcess;
       return;
     }

     if (order.payment_status === 'paid') {
       ctx.reply(
         `✅ Заказ #${order.id.slice(0, 8)} уже оплачен!\n\n` +
         `📊 Статус: Оплачен\n` +
         `💰 Сумма: ${order.total_amount} руб.`
       );
       delete ctx.session.yookassaProcess;
       return;
     }

     // Создание платежа через YooKassa
     await createYooKassaPaymentForOrder(ctx, order);
   } catch (error) {
     console.error('Ошибка при обработке YooKassa платежа:', error);
     ctx.reply('❌ Произошла ошибка при создании платежа через YooKassa. Попробуйте позже.');
     delete ctx.session.yookassaProcess;
   }
}

// Функция обработки QR платежей
async function handleQRPayment(ctx, orderId) {
   try {
     // Поиск заказа по ID
     const order = await orderService.getOrderById(orderId.trim());

     if (!order) {
       ctx.reply(
         '❌ Заказ не найден.\n\n' +
         'Проверьте правильность введенного номера заказа или используйте /status для поиска.'
       );
       delete ctx.session.qrProcess;
       return;
     }

     if (order.payment_status === 'paid') {
       ctx.reply(
         `✅ Заказ #${order.id.slice(0, 8)} уже оплачен!\n\n` +
         `📊 Статус: Оплачен\n` +
         `💰 Сумма: ${order.total_amount} руб.`
       );
       delete ctx.session.qrProcess;
       return;
     }

     // Создание QR платежа через YooKassa
     await createQRPaymentForOrder(ctx, order);
   } catch (error) {
     console.error('Ошибка при обработке QR платежа:', error);
     ctx.reply('❌ Произошла ошибка при создании QR платежа. Попробуйте позже.');
     delete ctx.session.qrProcess;
   }
}

// Функция обработки оплаты по номеру заказа
async function handlePaymentByOrderId(ctx, orderId) {
   const paymentProcess = ctx.session.paymentProcess;

   try {
     // Поиск заказа по ID
     const order = await orderService.getOrderById(orderId.trim());

     if (!order) {
       ctx.reply(
         '❌ Заказ не найден.\n\n' +
         'Проверьте правильность введенного номера заказа или используйте /status для поиска.'
       );
       delete ctx.session.paymentProcess;
       return;
     }

     if (order.payment_status === 'paid') {
       ctx.reply(
         `✅ Заказ #${order.id.slice(0, 8)} уже оплачен!\n\n` +
         `📊 Статус: Оплачен\n` +
         `💰 Сумма: ${order.total_amount} руб.`
       );
       delete ctx.session.paymentProcess;
       return;
     }

     // Создание инвойса через Telegram Payments
     await createInvoiceForOrder(ctx, order);

   } catch (error) {
     console.error('Ошибка при обработке оплаты:', error);
     ctx.reply('❌ Произошла ошибка при обработке оплаты. Попробуйте позже.');
     delete ctx.session.paymentProcess;
   }
}

// Функция создания инвойса для заказа
async function createInvoiceForOrder(ctx, order) {
  try {
    // Импортируем платежный сервис
    const { createPayment } = require('../services/payments');

    const invoiceDescription = `Оплата заказа #${order.id.slice(0, 8)}`;

    // Используем платежный сервис для создания Telegram платежа
    const paymentResult = await createPayment(
      'telegram',
      order.total_amount,
      'RUB',
      invoiceDescription,
      `${process.env.SERVER_URL || 'https://yourdomain.com'}/success`,
      `${process.env.SERVER_URL || 'https://yourdomain.com'}/fail`
    );

    // Извлекаем данные для инвойса
    const invoiceData = paymentResult.invoiceData;

    // Улучшаем параметры инвойса данными из заказа
    const enhancedPrices = [];
    if (order.order_details && order.order_details.items) {
      order.order_details.items.forEach(item => {
        enhancedPrices.push({
          label: item.item,
          amount: Math.round(item.price * 100) // в копейках
        });
      });
    } else {
      enhancedPrices.push({
        label: 'Услуги фотографии',
        amount: Math.round(order.total_amount * 100)
      });
    }

    // Создаем инвойс с улучшенными данными
    const invoice = {
      chat_id: ctx.chat.id,
      title: invoiceData.title,
      description: invoiceData.description,
      payload: invoiceData.payload,
      provider_token: invoiceData.provider_token,
      currency: invoiceData.currency,
      prices: enhancedPrices,
      start_parameter: 'payment',
      photo_url: undefined, // Можно добавить фото заказа
      photo_size: undefined,
      photo_width: undefined,
      photo_height: undefined,
      need_name: true, // Запрашивать имя
      need_phone_number: false, // Номер телефона уже есть
      need_email: true, // Запрашивать email
      need_shipping_address: false, // Доставка не нужна
      send_phone_number_to_provider: false,
      send_email_to_provider: true,
      is_flexible: false
    };

    // Отправка инвойса
    const result = await ctx.telegram.sendInvoice(invoice.chat_id, invoice.title, invoice.description,
      invoice.payload, invoice.provider_token, invoice.currency, invoice.prices, {
        start_parameter: invoice.start_parameter,
        photo_url: invoice.photo_url,
        photo_size: invoice.photo_size,
        photo_width: invoice.photo_width,
        photo_height: invoice.photo_height,
        need_name: invoice.need_name,
        need_phone_number: invoice.need_phone_number,
        need_email: invoice.need_email,
        need_shipping_address: invoice.need_shipping_address,
        send_phone_number_to_provider: invoice.send_phone_number_to_provider,
        send_email_to_provider: invoice.send_email_to_provider,
        is_flexible: invoice.is_flexible
      });

    // Сохранение информации о платеже в сессии для обработки результата
    ctx.session.paymentProcess = {
      step: 'invoice_sent',
      orderId: order.id,
      invoiceMessageId: result.message_id,
      paymentResult: paymentResult
    };

    console.log('Invoice sent for order:', order.id);

  } catch (error) {
    console.error('Ошибка при создании инвойса:', error);
    ctx.reply(`❌ Не удалось создать счет на оплату: ${error.message}\n\nПроверьте настройки платежной системы.`);
  }
}

// Функция создания YooMoney платежа для заказа
async function createYooKassaPaymentForOrder(ctx, order) {
  try {
    // Импортируем платежный сервис
    const { createYooMoneyPaymentLink } = require('../services/payments');

    const description = `Оплата заказа #${order.id.slice(0, 8)} через YooMoney кошелёк`;

    // Создание платежной ссылки через YooMoney
    const paymentResult = await createYooMoneyPaymentLink(
      order.id,
      order.total_amount,
      'RUB',
      description
    );

    // Сохраняем информацию о платеже в сессии
    if (!ctx.session.yookassaProcess) {
      ctx.session.yookassaProcess = {};
    }
    ctx.session.yookassaProcess.orderId = order.id;
    ctx.session.yookassaProcess.paymentId = paymentResult.paymentId;

    // Отправляем пользователю ссылку для оплаты
    ctx.reply(
      `✅ Создана платежная ссылка!\n\n` +
      `💳 Для оплаты заказа #${order.id.slice(0, 8)} перейдите по ссылке:\n` +
      `${paymentResult.paymentUrl}\n\n` +
      `💰 Сумма к оплате: ${order.total_amount} руб.\n\n` +
      `🔗 ID платежа: ${paymentResult.paymentId}\n\n` +
      `⚠️ После оплаты статус заказа обновится автоматически.\n\n` +
      `💡 Если у вас возникнут проблемы с оплатой, обратитесь в поддержку.`
    );

    console.log('YooMoney payment link created for order:', order.id);

  } catch (error) {
    console.error('Ошибка при создании YooMoney платежа:', error);
    ctx.reply(`❌ Не удалось создать платеж через YooMoney: ${error.message}\n\nПроверьте настройки платежной системы.`);
  }
}

// Функция создания QR платежа для заказа
async function createQRPaymentForOrder(ctx, order) {
  try {
    // Импортируем платежный сервис
    const { createYooMoneyWalletQR } = require('../services/payments');

    const description = `Оплата заказа #${order.id.slice(0, 8)} через QR-код`;

    // Создание QR платежа через YooMoney
    const paymentResult = await createYooMoneyWalletQR(
      order.id,
      order.total_amount,
      'RUB',
      description
    );

    // Сохраняем информацию о платеже в сессии
    if (!ctx.session.qrProcess) {
      ctx.session.qrProcess = {};
    }
    ctx.session.qrProcess.orderId = order.id;
    ctx.session.qrProcess.paymentId = paymentResult.paymentId;

    // Отправляем пользователю QR-код и ссылку для оплаты
    const qrMessage =
      `✅ Создан QR-код для оплаты!\n\n` +
      `💳 QR-код для оплаты заказа #${order.id.slice(0, 8)}\n\n` +
      `💰 Сумма к оплате: ${order.total_amount} руб.\n\n` +
      `🔗 ID платежа: ${paymentResult.paymentId}\n\n` +
      `📱 Ссылка для оплаты: ${paymentResult.paymentUrl}\n\n` +
      `⚠️ После оплаты статус заказа обновится автоматически.`;

    if (paymentResult.qrUrl) {
      // Если есть прямая ссылка на QR
      qrMessage += `\n\n📸 QR-код: ${paymentResult.qrUrl}`;
    }

    qrMessage += `\n\n💡 Если камера телефона не может считать QR-код, используйте ссылку для оплаты.`;

    ctx.reply(qrMessage);

    console.log('QR payment created for order:', order.id);

  } catch (error) {
    console.error('Ошибка при создании QR платежа:', error);
    ctx.reply(`❌ Не удалось создать QR платеж: ${error.message}\n\nПроверьте настройки платежной системы.`);
  }
}

// Функция обработки callback'ов платежей
async function handlePaymentCallback(ctx, data) {
   try {
     // Обработка основных команд оплаты
     if (data === 'pay_telegram') {
       // Запуск оплаты через Telegram
       if (!ctx.session) ctx.session = {};
       ctx.session.paymentProcess = { step: 'request_order_id', provider: 'telegram' };

       ctx.editMessageText(
         '💳 Оплата через Telegram Payments\n\n' +
         'Введите номер заказа для оплаты:\n\n' +
         'Формат: order_id (например: 123e4567-e89b-12d3-a456-426614174000)',
         {
           reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'pay_cancel' }]] }
         }
       );
     } else if (data === 'pay_yookassa') {
       // Запуск оплаты через YooMoney
       if (!ctx.session) ctx.session = {};
       ctx.session.yookassaProcess = { step: 'request_order_id' };

       ctx.editMessageText(
         '🏦 Оплата через YooMoney кошелёк\n\n' +
         'Введите номер заказа для оплаты:\n\n' +
         'Формат: order_id (например: 123e4567-e89b-12d3-a456-426614174000)',
         {
           reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'pay_cancel' }]] }
         }
       );
     } else if (data === 'pay_qr') {
       // Запуск оплаты через QR-код
       if (!ctx.session) ctx.session = {};
       ctx.session.qrProcess = { step: 'request_order_id' };

       ctx.editMessageText(
         '📱 Оплата через QR-код\n\n' +
         'Введите номер заказа для оплаты:\n\n' +
         'Формат: order_id (например: 123e4567-e89b-12d3-a456-426614174000)',
         {
           reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'pay_cancel' }]] }
         }
       );
     } else if (data === 'pay_cancel') {
       // Отмена оплаты
       if (ctx.session) {
         delete ctx.session.paymentProcess;
         delete ctx.session.yookassaProcess;
         delete ctx.session.qrProcess;
       }
       ctx.editMessageText('Операция оплаты отменена.', {
         reply_markup: { inline_keyboard: [] }
       });
     } else if (data === 'invoice_from_menu') {
       // Создание счета на основе выбранных услуг из меню
       ctx.editMessageText(
         'Для создания счета выберите услуги из меню /menu, а затем используйте /pay для оплаты.',
         {
           reply_markup: { inline_keyboard: [] }
         }
       );
     } else if (data === 'invoice_from_order') {
       // Поиск и создание счета для существующего заказа
       if (!ctx.session) ctx.session = {};
       ctx.session.paymentProcess = { step: 'request_order_id' };

       ctx.editMessageText(
         'Введите номер заказа для создания счета на оплату:\n\n' +
         'Формат: полный order_id (например: 123e4567-e89b-12d3-a456-426614174000)',
         {
           reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'invoice_cancel' }]] }
         }
       );
     } else if (data === 'invoice_cancel') {
       // Отмена создания счета
       if (ctx.session?.paymentProcess) {
         delete ctx.session.paymentProcess;
       }
       ctx.editMessageText('Создание счета отменено.', {
         reply_markup: { inline_keyboard: [] }
       });
     } else {
       ctx.answerCbQuery('Неизвестная команда оплаты');
     }
   } catch (error) {
     console.error('Ошибка в handlePaymentCallback:', error);
     ctx.answerCbQuery('Произошла ошибка при обработке платежа');
   }
}

// Экспорт бота для использования в других модулях
module.exports = bot;