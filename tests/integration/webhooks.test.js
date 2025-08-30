const request = require('supertest');
const { app } = require('../../index');

describe('Webhooks Routes Tests', () => {
  describe('POST /webhooks/bot', () => {
    test('should return 200 for valid bot update', async () => {
      const response = await request(app)
        .post('/webhooks/bot')
        .send({
          message: {
            chat: { id: 123456 },
            text: 'Hello bot'
          }
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
    });

    test('should return 400 for invalid bot update', async () => {
      const response = await request(app)
        .post('/webhooks/bot')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /webhooks/general', () => {
    test('should return success for valid general webhook', async () => {
      const response = await request(app)
        .post('/webhooks/general')
        .send({ event: 'test', data: 'sample' });

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    test('should return 400 for invalid general webhook', async () => {
      const response = await request(app)
        .post('/webhooks/general')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /webhooks/payments', () => {
    test('should return success for valid payment webhook', async () => {
      const response = await request(app)
        .post('/webhooks/payments')
        .set('x-provider', 'tinkoff')
        .send({
          TerminalKey: 'test_key',
          OrderId: 'test_order',
          Status: 'CONFIRMED'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 400 for invalid payment webhook', async () => {
      const response = await request(app)
        .post('/webhooks/payments')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});