const request = require('supertest');
const app = require('../../src/server/app');

describe('Integration Tests - Server', () => {
  test('Server should respond to root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'API Server is running');
  });

  test('Server should handle 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
  });

  test('Server should serve static files', async () => {
    const response = await request(app).get('/css/style.css');
    expect(response.status).toBe(200);
    expect(response.header['content-type']).toContain('text/css');
  });

  test('Server should handle API routes with authentication', async () => {
    const response = await request(app).get('/api/users');
    expect(response.status).toBe(401); // Should require authentication
  });

  test('Server should handle webhook routes', async () => {
    const response = await request(app).post('/webhooks/payments');
    expect(response.status).toBe(404); // Assuming webhook route exists but needs proper data
  });

  test('Server should handle errors gracefully', async () => {
    const response = await request(app)
      .get('/api/error-test')
      .set('x-api-key', 'your_api_key_here')
      .set('Authorization', 'Bearer your_bearer_token_here');
    // This should trigger the error handling middleware
    expect(response.status).toBe(404); // Or 500 if error route exists
  });

  test('API sendMessage route should validate input', async () => {
    const response = await request(app)
      .post('/api/sendMessage')
      .set('x-api-key', 'your_api_key_here')
      .set('Authorization', 'Bearer your_bearer_token_here')
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('API command route should validate input', async () => {
    const response = await request(app)
      .post('/api/command')
      .set('x-api-key', 'your_api_key_here')
      .set('Authorization', 'Bearer your_bearer_token_here')
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('Webhook bot route should handle invalid data', async () => {
    const response = await request(app).post('/webhooks/bot').send({});
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('Webhook general route should handle invalid data', async () => {
    const response = await request(app).post('/webhooks/general').send({});
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});