const express = require('express');
const router = express.Router();
const path = require('path');
const { handleWebhook } = require(path.join(__dirname, '../../services/payments.js'));

// Webhook endpoint for bot updates (e.g., from Telegram)
router.post('/bot', (req, res) => {
    try {
      const update = req.body;
      if (!update) {
        return res.status(400).json({ success: false, error: 'Missing update data' });
      }

      console.log('Received webhook update:', update);

      // Обработка successful_payment через webhook
      if (update.message && update.message.successful_payment) {
        const payment = update.message.successful_payment;
        const orderId = payment.invoice_payload;

        // Импортируем сервис заказов для обновления статуса
        const pathModule = require('path');
        const { orderService } = require(pathModule.join(__dirname, '../../services/supabase'));

        console.log('Processing successful payment via webhook:', orderId);

        // Обновляем статус заказа в базе данных
        orderService.updateOrder(orderId, {
          payment_status: 'paid',
          status: 'processing' // Меняем статус заказа на "в обработке"
        }).then(() => {
          console.log('Order status updated via webhook for order:', orderId);
        }).catch(err => {
          console.error('Error updating order status via webhook:', err);
        });
      }

      // Assuming it's a message update
      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text || (update.message.successful_payment ? 'successful_payment' : '');
        console.log(`Message from ${chatId}: ${text}`);
        // TODO: Send response back or process the message
      }
      res.status(200).send('OK'); // Respond to acknowledge the webhook
    } catch (error) {
      console.error('Bot webhook error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

// General webhook endpoint
router.post('/general', (req, res) => {
   try {
     const data = req.body;
     if (!data) {
       return res.status(400).json({ success: false, error: 'Missing webhook data' });
     }
     console.log('Received general webhook:', data);
     // TODO: Handle general webhook logic
     res.json({ received: true });
   } catch (error) {
     console.error('General webhook error:', error);
     res.status(500).json({ success: false, error: 'Internal server error' });
   }
 });

// Webhook endpoint for payment notifications
router.post('/payments', (req, res) => {
// Специальный webhook endpoint для YooMoney
router.post('/yoomoney', (req, res) => {
    console.log(`[YOOMONEY WEBHOOK] Processing YooMoney notification`);
    console.log(`[YOOMONEY WEBHOOK] Body keys: ${Object.keys(req.body)}`);

    const provider = req.headers['x-provider'] || 'yoomoney';
    try {
        const result = handleWebhook(req.body, provider);

        // Обработка специфичных для YooMoney полей
        if (result.processed && req.body.operation_id) {
            console.log(`[YOOMONEY WEBHOOK] Processing operation: ${req.body.operation_id}`);
            console.log(`[YOOMONEY WEBHOOK] Label: ${req.body.label}, Status: ${req.body.status}`);

            // Импортируем сервис заказов
            const pathModule = require('path');
            const { orderService } = require(pathModule.join(__dirname, '../../services/supabase'));

            let updateData = {};
            let logMessage = '';

            switch (result.status) {
                case 'paid':
                    updateData = {
                        payment_status: 'paid',
                        status: 'processing'
                    };
                    logMessage = 'YooMoney operation completed successfully';
                    break;
                case 'failed':
                    updateData = {
                        payment_status: 'failed',
                        status: 'cancelled'
                    };
                    logMessage = 'YooMoney operation failed';
                    break;
                case 'pending':
                    updateData = {
                        payment_status: 'pending',
                        status: 'pending'
                    };
                    logMessage = 'YooMoney operation in progress';
                    break;
                default:
                    console.log(`[YOOMONEY WEBHOOK] Status ${result.status} - no database update needed`);
                    return res.json({ success: true, result });
            }

            // Обновляем статус заказа
            if (Object.keys(updateData).length > 0 && result.orderId) {
                orderService.updateOrder(result.orderId, updateData).then(() => {
                    console.log(`[YOOMONEY WEBHOOK] ${logMessage}:`, result.orderId);
                    if (result.paymentId) {
                        console.log(`[YOOMONEY WEBHOOK] Payment ID:`, result.paymentId);
                    }
                }).catch(err => {
                    console.error(`[YOOMONEY WEBHOOK] Error updating order status:`, err);
                });
            }
        }

        console.log('YooMoney webhook processed successfully:', result);
        res.json({ success: true, result });
    } catch (error) {
        console.error('YooMoney webhook error:', error.message);
        if (error.message.includes('Invalid webhook data') || error.message.includes('Unsupported provider')) {
            res.status(400).json({ success: false, error: error.message });
        } else {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
});
    const data = req.body;
    const provider = req.headers['x-provider'] ||
                     (data.successful_payment || (data.message && data.message.successful_payment) ? 'telegram' :
                     (data.TerminalKey ? 'tinkoff' :
                     (data.object || data.event ? 'yookassa' : 'yoomoney'))); // Определить провайдера по данным
    console.log(`Webhook provider detected: ${provider}, data keys: ${Object.keys(data)}, has successful_payment: ${!!data.successful_payment}`);
    try {
      const result = handleWebhook(data, provider);

      // Обработка платежей
      if (result.processed) {
        // Импортируем сервис заказов для обновления статуса
        const pathModule = require('path');
        const { orderService } = require(pathModule.join(__dirname, '../../services/supabase'));

        let updateData = {};
        let logMessage = '';

        if (provider === 'yoomoney' || provider === 'yookassa') {
          // Обработка YooKassa платежей
          switch (result.status) {
            case 'paid':
              updateData = {
                payment_status: 'paid',
                status: 'processing'
              };
              logMessage = 'Order payment status updated for YooKassa payment';
              break;
            case 'pending':
              updateData = {
                payment_status: 'pending',
                status: 'pending'
              };
              logMessage = 'Order payment status set to pending for YooKassa payment';
              break;
            case 'canceled':
              updateData = {
                payment_status: 'failed',
                status: 'cancelled'
              };
              logMessage = 'Order payment canceled for YooKassa payment';
              break;
            default:
              console.log(`[WEBHOOK] YooKassa status ${result.status} for order ${result.orderId} - no database update needed`);
              return res.json({ success: true, result });
          }
        } else if (provider === 'telegram' && result.status === 'completed') {
          // Обработка Telegram платежей
          updateData = {
            payment_status: 'paid',
            status: 'processing'
          };
          logMessage = 'Order payment status updated for Telegram payment';
        } else if (provider === 'tinkoff') {
          // Обработка Tinkoff платежей
          if (result.status === 'CONFIRMED') {
            updateData = {
              payment_status: 'paid',
              status: 'processing'
            };
            logMessage = 'Order payment status updated for Tinkoff payment';
          } else if (result.status === 'REJECTED') {
            updateData = {
              payment_status: 'failed',
              status: 'cancelled'
            };
            logMessage = 'Order payment rejected for Tinkoff payment';
          }
        }

        // Обновляем статус заказа в базе данных
        if (Object.keys(updateData).length > 0) {
          orderService.updateOrder(result.orderId, updateData).then(() => {
            console.log(`[${provider.toUpperCase()}] ${logMessage}:`, result.orderId);
            if (result.paymentId) {
              console.log(`[${provider.toUpperCase()}] Payment ID:`, result.paymentId);
            }
          }).catch(err => {
            console.error(`[${provider.toUpperCase()}] Error updating order status:`, err);
          });
        }
      }

      console.log('Payment webhook processed:', result);
      res.json({ success: true, result });
    } catch (error) {
      console.error('Payment webhook error:', error.message);
      // Check if it's a client error or server error
      if (error.message.includes('Invalid webhook data') || error.message.includes('Unsupported provider')) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  });

module.exports = router;