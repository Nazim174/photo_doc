const crypto = require('crypto');

// Функция для генерации уникального OrderId
function generateOrderId() {
  return crypto.randomUUID();
}

// Вспомогательная функция для извлечения request_id из ответа YooMoney
function extractRequestId(responseData) {
  // YooMoney может возвращать ответ в разных форматах
  // Обычно это HTML-форма или простой текст
  const requestIdMatch = responseData.match(/request_id=([^;&]+)/);
  if (requestIdMatch) {
    return requestIdMatch[1];
  }

  // Альтернативный вариант - ищем в HTML
  const htmlMatch = responseData.match(/name="request_id"\s+value="([^"]+)"/);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  return null;
}

// Функция для создания платежа
async function createPayment(provider, amount, currency = 'RUB', description, successUrl, failUrl) {
   // Валидация входных данных
   if (!provider || !amount || !description || !successUrl || !failUrl) {
     throw new Error('Missing required parameters for payment creation');
   }
   if (amount <= 0) {
     throw new Error('Amount must be positive');
   }
   if (!['tinkoff', 'yoomoney', 'telegram'].includes(provider)) {
     throw new Error('Invalid provider');
   }

   const orderId = generateOrderId();

   if (provider === 'tinkoff') {
     return await createTinkoffPayment(orderId, amount, currency, description, successUrl, failUrl);
   } else if (provider === 'yoomoney') {
     return await createYooMoneyWalletPayment(orderId, amount, currency, description, successUrl, failUrl);
   } else if (provider === 'telegram') {
     return await createTelegramPayment(orderId, amount, currency, description, successUrl, failUrl);
   }
 }

// Функция для проверки статуса платежа
async function checkPaymentStatus(orderId, provider) {
  if (!orderId || !provider) {
    throw new Error('Missing orderId or provider');
  }
  if (!['tinkoff', 'yoomoney', 'telegram'].includes(provider)) {
    throw new Error('Invalid provider');
  }

  if (provider === 'tinkoff') {
    return await checkTinkoffStatus(orderId);
  } else if (provider === 'yoomoney') {
    return await checkYoomoneyStatus(orderId);
  } else if (provider === 'telegram') {
    return await checkTelegramStatus(orderId);
  }
}

// Функция для обработки вебхука
function handleWebhook(data, provider) {
  console.log(`[PAYMENTS SERVICE] Handling webhook for provider: ${provider}`);
  console.log(`[PAYMENTS SERVICE] Data keys: ${Object.keys(data)}`);
  if (!data || !provider) {
    throw new Error('Missing data or provider');
  }
  if (!['tinkoff', 'yoomoney', 'telegram'].includes(provider)) {
    throw new Error('Invalid provider');
  }

  if (provider === 'tinkoff') {
    return handleTinkoffWebhook(data);
  } else if (provider === 'yoomoney') {
    return handleYoomoneyWebhook(data);
  } else if (provider === 'telegram') {
    return handleTelegramWebhook(data);
  }
}

// Вспомогательные функции для Tinkoff
async function createTinkoffPayment(orderId, amount, currency, description, successUrl, failUrl) {
  const terminalKey = process.env.TINKOFF_TERMINAL_KEY;
  const password = process.env.TINKOFF_PASSWORD;

  if (!terminalKey || !password) {
    throw new Error('Tinkoff credentials not set');
  }

  const response = await fetch('https://securepay.tinkoff.ru/v2/Init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      TerminalKey: terminalKey,
      Amount: amount * 100, // в копейках
      OrderId: orderId,
      Description: description,
      SuccessURL: successUrl,
      FailURL: failUrl,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.Success) {
    throw new Error(`Tinkoff payment creation failed: ${result.Message || 'Unknown error'}`);
  }

  return { orderId, paymentUrl: result.PaymentURL, provider: 'tinkoff' };
}

async function checkTinkoffStatus(orderId) {
  const terminalKey = process.env.TINKOFF_TERMINAL_KEY;
  const password = process.env.TINKOFF_PASSWORD;

  const response = await fetch('https://securepay.tinkoff.ru/v2/GetState', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      TerminalKey: terminalKey,
      PaymentId: orderId, // Предполагаем, что orderId используется как PaymentId
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error('Failed to check Tinkoff status');
  }

  return { orderId, status: result.Status, provider: 'tinkoff' };
}

function handleTinkoffWebhook(data) {
  // Проверка подписи, если есть
  // Обработка данных
  const { OrderId, Status } = data;
  // Сохранить в БД или обработать
  return { orderId: OrderId, status: Status, provider: 'tinkoff', processed: true };
}

// Вспомогательные функции для YooMoney кошельковых платежей
async function createYooMoneyWalletPayment(orderId, amount, currency, description, successUrl, failUrl) {
  const accessToken = process.env.YOOMONEY_ACCESS_TOKEN;
  const walletNumber = process.env.YOOMONEY_WALLET_NUMBER;

  if (!accessToken || !walletNumber) {
    throw new Error('YooMoney wallet credentials not configured');
  }

  console.log('[YOOMONEY] Creating wallet payment:', orderId);

  // YooMoney API для кошельковых платежей
  const response = await fetch('https://yoomoney.ru/api/request-payment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      pattern_id: 'p2p',
      to: walletNumber,
      amount: amount.toString(),
      comment: `Заказ ${orderId}: ${description}`,
      message: description,
      label: orderId,
    }),
  });

  const data = await response.text();
  console.log('[YOOMONEY] Payment request response:', data);

  if (!response.ok) {
    throw new Error(`YooMoney payment request failed: ${data}`);
  }

  // Парсим ответ YooMoney (обычно это HTML или простой текст)
  const requestId = extractRequestId(data);
  if (!requestId) {
    throw new Error('Failed to extract request_id from YooMoney response');
  }

  // Подтверждаем plat0eh
  const confirmResponse = await fetch('https://yoomoney.ru/api/process-payment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      request_id: requestId,
    }),
  });

  const confirmData = await confirmResponse.text();
  console.log('[YOOMONEY] Payment confirmation response:', confirmData);

  if (!confirmResponse.ok) {
    throw new Error(`YooMoney payment confirmation failed: ${confirmData}`);
  }

  return {
    orderId,
    paymentId: requestId,
    paymentUrl: `${process.env.SERVER_URL || 'https://yourdomain.com'}/success?order_id=${orderId}`,
    status: 'pending',
    provider: 'yoomoney',
    walletPayment: true
  };
}

// Вспомогательные функции для YooKassa (legacy)
async function createYoomoneyPayment(orderId, amount, currency, description, successUrl, failUrl) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  // Fallback to legacy Yoomoney credentials if YooKassa not configured
  if (!shopId || !secretKey) {
    console.log('YooKassa credentials not found, trying new YooMoney wallet API');
    return await createYooMoneyWalletPayment(orderId, amount, currency, description, successUrl, failUrl);
  }

  // Создание аутентификационной строки для Basic Auth
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  // Подготовка объекта платежа согласно API YooKassa v3
  const paymentData = {
    amount: {
      value: amount.toFixed(2),
      currency: currency
    },
    confirmation: {
      type: 'redirect',
      return_url: successUrl,
      confirmation_url: successUrl
    },
    capture: true,
    description: description,
    metadata: {
      order_id: orderId
    },
    receipt: {
      customer: {
        email: 'test@example.com' // В реальном проекте нужно брать из данных пользователя
      },
      items: [{
        description: description,
        quantity: '1.00',
        amount: {
          value: amount.toFixed(2),
          currency: currency
        },
        vat_code: '2', // Без НДС
        payment_mode: 'full_payment',
        payment_subject: 'service'
      }]
    }
  };

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'Idempotence-Key': orderId // Ключ идемпотентности
    },
    body: JSON.stringify(paymentData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`YooKassa payment creation failed: ${result.description || 'Unknown error'}`);
  }

  console.log(`[YOOKASSA] Payment created: ${result.id}, status: ${result.status}`);

  return {
    orderId,
    paymentId: result.id,
    paymentUrl: result.confirmation.confirmation_url,
    status: result.status,
    provider: 'yoomoney'
  };
}

// Функция для поддержки устаревшего YooMoney API
async function createLegacyYoomoneyPayment(orderId, amount, currency, description, successUrl, failUrl) {
  const clientId = process.env.YOOMONEY_CLIENT_ID;
  const accessToken = process.env.YOOMONEY_ACCESS_TOKEN;

  if (!clientId || !accessToken) {
    throw new Error('Neither YooKassa nor legacy Yoomoney credentials are set');
  }

  console.log('[LEGACY YOOMONEY] Using legacy transfer API');

  const response = await fetch('https://yoomoney.ru/transfer/request-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      amount: amount,
      currency: currency,
      comment: description,
      message: description,
      to: clientId,
      label: orderId,
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(`Legacy Yoomoney payment creation failed: ${result.error_description || 'Unknown error'}`);
  }

  return { orderId, paymentUrl: result.confirmation_url, provider: 'yoomoney' };
}

async function checkYooMoneyWalletStatus(orderId) {
  const accessToken = process.env.YOOMONEY_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('YooMoney access token not configured');
  }

  console.log('[YOOMONEY] Checking wallet payment status:', orderId);

  // YooMoney API для проверки статуса операций
  const response = await fetch('https://yoomoney.ru/api/operation-history', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      label: orderId,
      records: '10', // Получить последние 10 операций
    }),
  });

  const data = await response.json();
  console.log('[YOOMONEY] Status check response:', data);

  if (!response.ok) {
    throw new Error(`YooMoney status check failed: ${data.error || 'Unknown error'}`);
  }

  // Найти операцию по метке (label)
  const operation = data.operations?.find(op => op.label === orderId);

  if (!operation) {
    return {
      orderId,
      status: 'unknown',
      provider: 'yoomoney',
      walletPayment: true
    };
  }

  // Маппинг статусов YooMoney на внутренние статусы
  const statusMap = {
    'success': 'paid',
    'refused': 'failed',
    'in_progress': 'pending'
  };

  return {
    orderId,
    paymentId: operation.operation_id,
    status: statusMap[operation.status] || operation.status,
    amount: operation.amount,
    provider: 'yoomoney',
    walletPayment: true,
    operation: operation
  };
}

// Legacy функция для проверки статуса
async function checkYoomoneyStatus(orderId) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  // Fallback to new YooMoney wallet API if YooKassa not configured
  if (!shopId || !secretKey) {
    console.log('YooKassa credentials not found, trying new YooMoney wallet API');
    return await checkYooMoneyWalletStatus(orderId);
  }

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  // Сначала попробуем найти платеж по метаданным (order_id)
  try {
    const searchResponse = await fetch(`https://api.yookassa.ru/v3/payments?metadata.order_id=${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.items && searchResult.items.length > 0) {
        const payment = searchResult.items[0];
        return {
          orderId,
          paymentId: payment.id,
          status: mapYooKassaStatus(payment.status),
          provider: 'yoomoney'
        };
      }
    }
  } catch (error) {
    console.log('Error searching payment by metadata, trying legacy API');
    return await checkLegacyYoomoneyStatus(orderId);
  }

  // Fallback to legacy API if search failed
  return await checkLegacyYoomoneyStatus(orderId);
}

// Функция для поддержки устаревшего YooMoney API проверки статуса
async function checkLegacyYoomoneyStatus(orderId) {
  const accessToken = process.env.YOOMONEY_ACCESS_TOKEN;

  const response = await fetch(`https://yoomoney.ru/api/operation-history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      label: orderId,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error('Failed to check Yoomoney status');
  }

  const operation = result.operations.find(op => op.label === orderId);
  const status = operation ? operation.status : 'unknown';

  return { orderId, status, provider: 'yoomoney' };
}

// Функция для маппинга статусов YooKassa
function mapYooKassaStatus(yookassaStatus) {
  const statusMap = {
    'pending': 'pending',
    'waiting_for_capture': 'pending',
    'succeeded': 'paid',
    'canceled': 'canceled'
  };
  return statusMap[yookassaStatus] || yookassaStatus;
}

function handleYoomoneyWebhook(data) {
  console.log(`[YOOMONEY] Processing webhook event for wallet payments`);

  // Обработка уведомлений YooMoney кошельковых платежей
  // YooMoney отправляет уведомления в формате операций
  if (data.operation_id) {
    const { operation_id, amount, label, status, datetime } = data;
    console.log(`[YOOMONEY] Processing operation: ${operation_id}, label: ${label}, status: ${status}`);

    // Маппинг статусов YooMoney на внутренние статусы
    const statusMap = {
      'success': 'paid',
      'refused': 'failed',
      'in_progress': 'pending'
    };

    return {
      orderId: label || operation_id,
      paymentId: operation_id,
      amount: parseFloat(amount),
      currency: 'RUB', // YooMoney работает преимущественно с рублями
      status: statusMap[status] || status,
      provider: 'yoomoney',
      processed: true,
      event: 'wallet_operation',
      walletPayment: true,
      operation: data
    };
  }

  // Обработка YooKassa форматов (если все еще используются)
  if (data.event && data.object) {
    console.log(`[YOOKASSA] Processing webhook event: ${data.event}`);

    // Проверка типа события
    if (data.event === 'payment.succeeded') {
      const { id, amount, metadata, status } = data.object;
      return {
        orderId: metadata?.order_id || id,
        paymentId: id,
        amount: parseFloat(amount.value),
        currency: amount.currency,
        status: 'paid',
        provider: 'yoomoney',
        processed: true,
        event: data.event,
        walletPayment: false
      };
    } else if (data.event === 'payment.canceled') {
      const { id, metadata, status, cancellation_details } = data.object;
      return {
        orderId: metadata?.order_id || id,
        paymentId: id,
        status: 'canceled',
        provider: 'yoomoney',
        processed: true,
        event: data.event,
        walletPayment: false,
        cancellationReason: cancellation_details?.reason
      };
    } else if (data.event === 'payment.waiting_for_capture') {
      const { id, metadata, status } = data.object;
      return {
        orderId: metadata?.order_id || id,
        paymentId: id,
        status: 'pending',
        provider: 'yoomoney',
        processed: true,
        event: data.event,
        walletPayment: false
      };
    }
  }

  // Обработка неизвестного формата
  console.log('[YOOMONEY] Unknown webhook format:', Object.keys(data));
  return {
    status: 'unknown',
    provider: 'yoomoney',
    processed: false,
    rawData: data,
    walletPayment: false
  };
}

// Функция создания QR-кода для оплаты
async function createYooKassaQR(orderId, amount, currency, description) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error('YooKassa credentials not set for QR payment');
  }

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  const paymentData = {
    amount: {
      value: amount.toFixed(2),
      currency: currency
    },
    confirmation: {
      type: 'qr',
      return_url: `${process.env.SERVER_URL || 'https://yourdomain.com'}/success`
    },
    capture: true,
    description: description,
    metadata: {
      order_id: orderId
    }
  };

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'Idempotence-Key': `${orderId}_qr`
    },
    body: JSON.stringify(paymentData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`YooKassa QR payment creation failed: ${result.description || 'Unknown error'}`);
  }

  console.log(`[YOOKASSA] QR Payment created: ${result.id}, QR URL: ${result.confirmation?.qr_url}`);

  return {
    orderId,
    paymentId: result.id,
    paymentUrl: result.confirmation.confirmation_url,
    qrUrl: result.confirmation.qr_url,
    status: result.status,
    provider: 'yoomoney',
    paymentType: 'qr'
  };
}

// Функция создания платежной ссылки
async function createYooKassaPaymentLink(orderId, amount, currency, description) {
  const result = await createYoomoneyPayment(orderId, amount, currency, description,
    `${process.env.SERVER_URL || 'https://yourdomain.com'}/payment/success`,
    `${process.env.SERVER_URL || 'https://yourdomain.com'}/payment/fail`);

  return {
    orderId: result.orderId,
    paymentUrl: result.paymentUrl,
    paymentId: result.paymentId,
    provider: 'yoomoney',
    description: description,
    amount: amount,
    currency: currency
  };
}

// Вспомогательные функции для Telegram
async function createTelegramPayment(orderId, amount, currency, description, successUrl, failUrl) {
  // Telegram payments работают через Bot API sendInvoice
  // Возвращаем данные для создания инвойса через бота
  const providerToken = process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN;

  if (!providerToken) {
    throw new Error('Telegram payment provider token not set. Please configure TELEGRAM_PAYMENT_PROVIDER_TOKEN');
  }

  // Возвращаем данные для использования в sendInvoice
  return {
    orderId,
    provider: 'telegram',
    invoiceData: {
      title: description,
      description: `Заказ #${orderId.slice(0, 8)}`,
      payload: orderId,
      provider_token: providerToken,
      currency: currency,
      prices: [{
        label: 'Услуги',
        amount: Math.round(amount * 100) // в копейках
      }]
    }
  };
}

async function checkTelegramStatus(orderId) {
  // Для Telegram payments статус проверяется через бота или вебхуки
  // Обычно используется база данных для отслеживания статуса
  return {
    orderId,
    status: 'pending', // Статус должен проверяться из БД
    provider: 'telegram',
    note: 'Telegram payment status should be tracked via webhooks or database'
  };
}

function handleTelegramWebhook(data) {
  // Обработка вебхука от Telegram Payments
  // Структура данных зависит от типа уведомления
  if (data.successful_payment) {
    const payment = data.successful_payment;
    return {
      orderId: payment.invoice_payload,
      amount: payment.total_amount / 100,
      status: 'completed',
      provider: 'telegram',
      payment_charge_id: payment.telegram_payment_charge_id,
      processed: true
    };
  }

  // Обработка других типов уведомлений
  return {
    orderId: data.invoice_payload || 'unknown',
    status: 'unknown',
    provider: 'telegram',
    processed: false,
    rawData: data
  };
}

// Функция создания платежной ссылки для YooMoney кошелька
async function createYooMoneyPaymentLink(orderId, amount, currency, description) {
  console.log('[YOOMONEY] Creating wallet payment link for order:', orderId);

  const result = await createYooMoneyWalletPayment(orderId, amount, currency, description,
    `${process.env.SERVER_URL || 'https://yourdomain.com'}/payment/success`,
    `${process.env.SERVER_URL || 'https://yourdomain.com'}/payment/fail`);

  return {
    orderId: result.orderId,
    paymentUrl: result.paymentUrl,
    paymentId: result.paymentId,
    provider: 'yoomoney',
    walletPayment: true,
    description: description,
    amount: amount,
    currency: currency
  };
}

// Функция создания QR-кода для YooMoney кошелька
async function createYooMoneyWalletQR(orderId, amount, currency, description) {
  console.log('[YOOMONEY] Creating wallet QR payment for order:', orderId);

  const result = await createYooMoneyWalletPayment(orderId, amount, currency, description,
    `${process.env.SERVER_URL || 'https://yourdomain.com'}/success`,
    `${process.env.SERVER_URL || 'https://yourdomain.com'}/fail`);

  // Для QR-кода YooMoney создаём ссылку на приложение
  const qrUrl = `https://yoomoney.ru/transfer/quickpay?requestId=${result.paymentId}`;

  return {
    orderId,
    paymentId: result.paymentId,
    paymentUrl: result.paymentUrl,
    qrUrl: qrUrl,
    status: result.status,
    provider: 'yoomoney',
    walletPayment: true,
    paymentType: 'qr'
  };
}

module.exports = {
  createPayment,
  checkPaymentStatus,
  handleWebhook,
  createYooKassaQR,
  createYooKassaPaymentLink,
  createYooMoneyWalletPayment,
  checkYooMoneyWalletStatus,
  createYooMoneyPaymentLink,
  createYooMoneyWalletQR
};