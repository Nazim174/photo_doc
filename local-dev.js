require('dotenv').config();
const app = require('./src/server/app');
const bot = require('./src/bot/bot.js');

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

// Запуск бота
bot.launch()
  .then(() => {
    console.log('Бот успешно запущен!');
  })
  .catch((err) => {
    console.error('Ошибка при запуске бота:', err);
  });

// Обработка завершения процесса
process.once('SIGINT', () => {
  console.log('Получен SIGINT, завершаем работу...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('Получен SIGTERM, завершаем работу...');
  bot.stop('SIGTERM');
});

// Экспорт для тестирования
module.exports = {
  app,
  bot,
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