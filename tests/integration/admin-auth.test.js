const request = require('supertest');
const app = require('../../src/server/app');
require('dotenv').config();

describe('Admin Authentication', () => {
  test('should redirect to login if not authenticated', async () => {
    const response = await request(app).get('/admin');
    expect(response.status).toBe(302); // Redirect
    expect(response.headers.location).toBe('/admin/login');
  });

  test('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/admin/login')
      .send({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
      });

    expect(response.status).toBe(302); // Redirect to /admin
    expect(response.headers.location).toBe('/admin');
  });

  test('should fail login with incorrect credentials', async () => {
    const response = await request(app)
      .post('/admin/login')
      .send({
        username: 'wrong',
        password: 'wrong'
      });

    expect(response.status).toBe(200); // Render login page with error
    expect(response.text).toContain('Неверные учетные данные');
  });

  test('should logout successfully', async () => {
    // First login
    const agent = request.agent(app);

    await agent
      .post('/admin/login')
      .send({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
      });

    // Then logout
    const response = await agent.post('/admin/logout');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin/login');
  });
});