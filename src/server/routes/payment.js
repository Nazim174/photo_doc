const express = require('express');
const router = express.Router();
const path = require('path');
const { orderService } = require(path.join(__dirname, '../../services/supabase'));
const { createYooKassaPaymentLink, createYooKassaQR } = require(path.join(__dirname, '../../services/payments'));

// Показать страницу оплаты для конкретного заказа
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Получаем информацию о заказе
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.render('payment', {
        title: 'Заказ не найден',
        error: 'Указанный заказ не найден в системе.',
        order: null
      });
    }

    // Показываем страницу оплаты
    res.render('payment', {
      title: `Оплата заказа ${order.id.slice(0, 8)}`,
      order: order,
      error: null
    });

  } catch (error) {
    console.error('Error displaying payment page:', error);
    res.render('payment', {
      title: 'Ошибка',
      error: 'Произошла ошибка при загрузке страницы оплаты.',
      order: null
    });
  }
});

// Показать главную страницу оплаты (форма для ввода номера заказа)
router.get('/', (req, res) => {
  res.render('payment', {
    title: 'Оплата заказа - YooKassa',
    order: null,
    error: null
  });
});

// Создать платеж (обработчик для AJAX запросов со страницы)
router.post('/create', async (req, res) => {
  try {
    const { orderId, method, amount } = req.body;

    if (!orderId || !method) {
      return res.status(400).json({
        success: false,
        error: 'Не указан номер заказа или метод оплаты'
      });
    }

    // Получаем информацию о заказе
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Заказ не найден'
      });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Этот заказ уже оплачен'
      });
    }

    const description = `Оплата заказа ${order.id.slice(0, 8)}`;

    let result;
    if (method === 'link') {
      // Создаем платежную ссылку
      result = await createYooKassaPaymentLink(orderId, amount || order.total_amount, 'RUB', description);
    } else if (method === 'qr') {
      // Создаем QR-код
      result = await createYooKassaQR(orderId, amount || order.total_amount, 'RUB', description);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Неподдерживаемый метод оплаты'
      });
    }

    res.json({
      success: true,
      paymentUrl: result.paymentUrl,
      qrUrl: result.qrUrl, // для QR метода
      paymentId: result.paymentId,
      amount: result.amount || order.total_amount
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка создания платежа'
    });
  }
});

// Страница успешной оплаты
router.get('/success', (req, res) => {
  res.render('payment_success', {
    title: 'Оплата успешна',
    orderId: req.query.order_id,
    paymentId: req.query.payment_id
  });
});

// Страница неудачной оплаты
router.get('/fail', (req, res) => {
  res.render('payment_fail', {
    title: 'Ошибка оплаты',
    error: req.query.error || 'Произошла ошибка при оплате',
    orderId: req.query.order_id
  });
});

module.exports = router;