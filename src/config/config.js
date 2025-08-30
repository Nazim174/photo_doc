require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,

  // Payments
  tinkoffTerminalKey: process.env.TINKOFF_TERMINAL_KEY,
  tinkoffPassword: process.env.TINKOFF_PASSWORD,
  yoomoneyClientId: process.env.YOOMONEY_CLIENT_ID,
  yoomoneyAccessToken: process.env.YOOMONEY_ACCESS_TOKEN,

  // Images
  removebgApiKey: process.env.REMOVEBG_API_KEY,
  clipdropApiKey: process.env.CLIPDROP_API_KEY,
  serverUrl: process.env.SERVER_URL,

  // Auth
  apiKey: process.env.API_KEY,
  bearerToken: process.env.BEARER_TOKEN,

  // Bot
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
};

// Валидация обязательных переменных
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'TINKOFF_TERMINAL_KEY',
  'TINKOFF_PASSWORD',
  'YOOMONEY_CLIENT_ID',
  'YOOMONEY_ACCESS_TOKEN',
  'API_KEY',
  'BEARER_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'SESSION_SECRET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Отсутствуют обязательные переменные окружения: ${missingVars.join(', ')}`);
}

module.exports = config;