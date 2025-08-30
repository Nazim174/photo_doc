const request = require('supertest');
const { app } = require('../../index');

describe('API Routes Tests', () => {
  describe('POST /api/sendMessage', () => {
    test('should return success for valid message', async () => {
      const response = await request(app)
        .post('/api/sendMessage')
        .set('x-api-key', 'your_api_key_here')
        .set('Authorization', 'Bearer your_bearer_token_here')
        .send({ chatId: '123456', message: 'Test message' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message sent');
    });

    test('should return 400 for missing chatId', async () => {
      const response = await request(app)
        .post('/api/sendMessage')
        .set('x-api-key', 'your_api_key_here')
        .set('Authorization', 'Bearer your_bearer_token_here')
        .send({ message: 'Test message' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 for missing message', async () => {
      const response = await request(app)
        .post('/api/sendMessage')
        .set('x-api-key', 'your_api_key_here')
        .set('Authorization', 'Bearer your_bearer_token_here')
        .send({ chatId: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/status', () => {
    test('should return bot status', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('x-api-key', 'your_api_key_here')
        .set('Authorization', 'Bearer your_bearer_token_here');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Bot is running');
    });
  });

  describe('POST /api/command', () => {
    test('should return success for valid command', async () => {
      const response = await request(app)
        .post('/api/command')
        .set('x-api-key', 'your_api_key_here')
        .set('Authorization', 'Bearer your_bearer_token_here')
        .send({ command: 'test', params: 'param1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('test');
    });

    test('should return 400 for missing command', async () => {
      const response = await request(app)
        .post('/api/command')
        .set('x-api-key', 'your_api_key_here')
        .set('Authorization', 'Bearer your_bearer_token_here')
        .send({ params: 'param1' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/create', () => {
    test('should return 400 for invalid provider', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .set('x-api-key', 'your_api_key_here')
        .set('Authorization', 'Bearer your_bearer_token_here')
        .send({
          provider: 'invalid',
          amount: 100,
          currency: 'RUB',
          description: 'Test',
          successUrl: 'http://example.com/success',
          failUrl: 'http://example.com/fail'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid provider');
    });

    test('should return 400 for negative amount', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .set('x-api-key', 'your_api_key_here')
        .set('Authorization', 'Bearer your_bearer_token_here')
        .send({
          provider: 'tinkoff',
          amount: -100,
          currency: 'RUB',
          description: 'Test',
          successUrl: 'http://example.com/success',
          failUrl: 'http://example.com/fail'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Amount must be positive');
    });
  });
});