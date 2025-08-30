const { createYooMoneyWalletPayment, checkYooMoneyWalletStatus, handleYoomoneyWebhook } = require('../../src/services/payments');

describe('YooMoney Wallet Integration Tests', () => {
  // Пропускаем тесты если не настроены переменные окружения
  const accessToken = process.env.YOOMONEY_ACCESS_TOKEN;
  const walletNumber = process.env.YOOMONEY_WALLET_NUMBER;

  const skipTests = !accessToken || !walletNumber;

  (skipTests ? describe.skip : describe)('YooMoney Wallet Payments', () => {
    test('should create payment link successfully', async () => {
      const orderId = 'test-order-' + Date.now();
      const amount = 100;
      const currency = 'RUB';
      const description = 'Тестовый платеж';

      const result = await createYooMoneyWalletPayment(orderId, amount, currency, description);

      expect(result).toHaveProperty('orderId', orderId);
      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('paymentUrl');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('provider', 'yoomoney');
      expect(result).toHaveProperty('walletPayment', true);
    });

    test('should check payment status', async () => {
      // Создаём платеж для тестирования
      const orderId = 'status-test-' + Date.now();
      const amount = 50;
      const currency = 'RUB';
      const description = 'Тест статуса платежа';

      const paymentResult = await createYooMoneyWalletPayment(orderId, amount, currency, description);

      // Проверяем статус
      const statusResult = await checkYooMoneyWalletStatus(orderId);

      expect(statusResult).toHaveProperty('orderId', orderId);
      expect(statusResult).toHaveProperty('status');
      expect(statusResult).toHaveProperty('provider', 'yoomoney');
      expect(statusResult).toHaveProperty('walletPayment', true);
    });

    test('should handle webhook notifications', () => {
      // Мокаем данные вебхука YooMoney
      const webhookData = {
        operation_id: '123456789',
        amount: '100.00',
        label: 'test-order-123',
        status: 'success',
        datetime: new Date().toISOString()
      };

      const result = handleYoomoneyWebhook(webhookData);

      expect(result).toHaveProperty('orderId', 'test-order-123');
      expect(result).toHaveProperty('paymentId', '123456789');
      expect(result).toHaveProperty('status', 'paid');
      expect(result).toHaveProperty('provider', 'yoomoney');
      expect(result).toHaveProperty('processed', true);
      expect(result).toHaveProperty('walletPayment', true);
    });

    test('should handle failed payment webhook', () => {
      const webhookData = {
        operation_id: '987654321',
        amount: '150.00',
        label: 'failed-order-456',
        status: 'refused',
        datetime: new Date().toISOString()
      };

      const result = handleYoomoneyWebhook(webhookData);

      expect(result).toHaveProperty('status', 'failed');
      expect(result).toHaveProperty('provider', 'yoomoney');
      expect(result).toHaveProperty('processed', true);
    });
  });

  describe('Environment Configuration', () => {
    test('should have required environment variables', () => {
      expect(accessToken).toBeDefined();
      expect(walletNumber).toBeDefined();
      expect(walletNumber).toMatch(/^41001\d{10}$/); // Формат номера кошелька
    });
  });
});