const express = require('express');
const router = express.Router();
const path = require('path');
const { createPayment, checkPaymentStatus, createYooKassaPaymentLink, createYooKassaQR } = require(path.join(__dirname, '../../services/payments.js'));
const { orderService } = require(path.join(__dirname, '../../services/supabase'));

// Route to send a message via the bot
router.post('/sendMessage', (req, res) => {
   try {
     const { chatId, message } = req.body;
     if (!chatId || !message) {
       return res.status(400).json({ success: false, error: 'Missing required fields: chatId or message' });
     }
     // TODO: Integrate with bot logic to send message
     console.log(`Sending message to ${chatId}: ${message}`);
     res.json({ success: true, message: 'Message sent' });
   } catch (error) {
     console.error('Send message error:', error);
     res.status(500).json({ success: false, error: 'Internal server error' });
   }
 });

// Route to get bot status
router.get('/status', (req, res) => {
   try {
     // TODO: Check bot connection status
     res.json({ status: 'Bot is running' });
   } catch (error) {
     console.error('Bot status check error:', error);
     res.status(500).json({ success: false, error: 'Internal server error' });
   }
 });

// Route to handle commands
router.post('/command', (req, res) => {
   try {
     const { command, params } = req.body;
     if (!command) {
       return res.status(400).json({ success: false, error: 'Missing required field: command' });
     }
     // TODO: Process bot commands
     console.log(`Processing command: ${command} with params: ${params}`);
     res.json({ success: true, response: `Command ${command} processed` });
   } catch (error) {
     console.error('Command processing error:', error);
     res.status(500).json({ success: false, error: 'Internal server error' });
   }
 });

// Route to create payment
router.post('/payments/create', async (req, res) => {
   const { provider, amount, currency, description, successUrl, failUrl } = req.body;
   try {
     const payment = await createPayment(provider, amount, currency, description, successUrl, failUrl);
     res.json({ success: true, payment });
   } catch (error) {
     // Check if it's a client error or server error
     if (error.message.includes('Invalid provider') || error.message.includes('Amount must be positive')) {
       res.status(400).json({ success: false, error: error.message });
     } else {
       console.error('Payment creation error:', error);
       res.status(500).json({ success: false, error: 'Internal server error' });
     }
   }
 });

// Route to check payment status
router.get('/payments/status/:orderId/:provider', async (req, res) => {
   const { orderId, provider } = req.params;
   try {
     const status = await checkPaymentStatus(orderId, provider);
     res.json({ success: true, status });
   } catch (error) {
     // Check if it's a client error or server error
     if (error.message.includes('Invalid provider') || error.message.includes('Order not found')) {
       res.status(400).json({ success: false, error: error.message });
     } else {
       console.error('Payment status check error:', error);
       res.status(500).json({ success: false, error: 'Internal server error' });
     }
   }
 });

// Route to get order information
router.get('/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Route to create YooKassa payment link
router.post('/payments/yookassa/link', async (req, res) => {
  const { orderId, amount, currency = 'RUB', description } = req.body;
  try {
    const paymentLink = await createYooKassaPaymentLink(
      orderId,
      amount,
      currency,
      description || `Оплата заказа ${orderId.slice(0, 8)}`
    );
    res.json({ success: true, paymentUrl: paymentLink.paymentUrl, paymentId: paymentLink.paymentId });
  } catch (error) {
    console.error('YooKassa payment link creation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Route to create YooKassa QR payment
router.post('/payments/yookassa/qr', async (req, res) => {
  const { orderId, amount, currency = 'RUB', description } = req.body;
  try {
    const qrPayment = await createYooKassaQR(
      orderId,
      amount,
      currency,
      description || `Оплата заказа ${orderId.slice(0, 8)}`
    );
    res.json({
      success: true,
      paymentUrl: qrPayment.paymentUrl,
      qrUrl: qrPayment.qrUrl,
      paymentId: qrPayment.paymentId
    });
  } catch (error) {
    console.error('YooKassa QR payment creation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Route to get all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await orderService.getOrders();
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Route to create a new order
router.post('/orders', async (req, res) => {
  const { email, description, photo } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    const order = await orderService.createOrder({ email, description, photo });
    res.json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;