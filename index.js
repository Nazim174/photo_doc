require('dotenv').config();
const app = require('./src/server/app');

// Инициализация сервисов
const { supabase, userService, orderService } = require('./src/services/supabase');
const { createPayment, checkPaymentStatus, handleWebhook } = require('./src/services/payments');
const { removeBackground, processWithClipDrop, sendToServer } = require('./src/services/images');

// Порт для сервера
const PORT = process.env.PORT || 3000;

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Экспорт для Vercel
module.exports = app;

// Экспорт для тестирования
module.exports = {
  app,
  supabase,
  userService,
  orderService,
  createPayment,
  checkPaymentStatus,
  handleWebhook,
  removeBackground,
  processWithClipDrop,
  sendToServer
};