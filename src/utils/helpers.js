const crypto = require('crypto');

/**
 * Логгер для вывода сообщений в консоль
 * @param {string} level - Уровень логирования (info, warn, error)
 * @param {string} message - Сообщение
 * @param {Object} data - Дополнительные данные
 */
function logger(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
}

/**
 * Валидация email адреса
 * @param {string} email - Email для проверки
 * @returns {boolean} - True если валидный
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Генерация уникального ID
 * @returns {string} - UUID v4
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Проверка на пустое значение
 * @param {*} value - Значение для проверки
 * @returns {boolean} - True если пустое
 */
function isEmpty(value) {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0);
}

/**
 * Форматирование даты в читаемый вид
 * @param {Date|string} date - Дата
 * @returns {string} - Отформатированная дата
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU');
}

/**
 * Обработка ошибок с логированием
 * @param {Error} error - Объект ошибки
 * @param {string} context - Контекст ошибки
 */
function handleError(error, context = '') {
  logger('error', `Ошибка в ${context}: ${error.message}`, { stack: error.stack });
}

/**
 * Асинхронная задержка
 * @param {number} ms - Миллисекунды
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Преобразование строки в slug
 * @param {string} str - Исходная строка
 * @returns {string} - Slug
 */
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Проверка типа значения
 * @param {*} value - Значение
 * @param {string} type - Ожидаемый тип
 * @returns {boolean}
 */
function isType(value, type) {
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
  return typeof value === type;
}

module.exports = {
  logger,
  isValidEmail,
  generateId,
  isEmpty,
  formatDate,
  handleError,
  delay,
  slugify,
  isType
};