const axios = require('axios');

/**
 * Функция для удаления фона из изображения с использованием RemoveBG API
 * @param {Buffer} imageBuffer - Буфер изображения
 * @param {string} apiKey - API ключ для RemoveBG
 * @returns {Buffer} - Обработанное изображение без фона
 */
async function removeBackground(imageBuffer, apiKey) {
  try {
    const response = await axios.post('https://api.remove.bg/v1.0/removebg', {
      image_file_b64: imageBuffer.toString('base64'),
      size: 'auto'
    }, {
      headers: {
        'X-Api-Key': apiKey
      },
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Ошибка при удалении фона: ${error.message}`);
  }
}

/**
 * Функция для обработки изображения с использованием ClipDrop API
 * @param {string} imageUrl - URL изображения
 * @param {string} prompt - Промпт для обработки
 * @param {string} apiKey - API ключ для ClipDrop
 * @returns {Object} - Результат обработки
 */
async function processWithClipDrop(imageUrl, prompt, apiKey) {
  try {
    const response = await axios.post('https://api.clipdrop.com/process', {
      image_url: imageUrl,
      prompt: prompt
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Ошибка при обработке изображения: ${error.message}`);
  }
}

/**
 * Функция для интеграции с API сервера - отправка обработанного изображения
 * @param {Object} data - Данные для отправки
 * @param {string} serverUrl - URL API сервера
 * @returns {Object} - Ответ от сервера
 */
async function sendToServer(data, serverUrl) {
  try {
    const response = await axios.post(`${serverUrl}/api/images`, data);
    return response.data;
  } catch (error) {
    throw new Error(`Ошибка при отправке на сервер: ${error.message}`);
  }
}

module.exports = {
  removeBackground,
  processWithClipDrop,
  sendToServer
};