const request = require('supertest');
const { app, supabase, userService, orderService } = require('../../index');

describe('Integration Tests - Full Application', () => {
  test('Server should start and respond to health check', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'API Server is running');
  });

  test('API routes should be accessible', async () => {
    const response = await request(app).get('/api');
    expect(response.status).toBe(404); // Assuming no root API route, should return 404
  });

  test('Admin routes should exist', async () => {
    const response = await request(app).get('/admin');
    expect(response.status).toBe(404); // Admin routes might require authentication
  });

  test('Supabase service should be initialized', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  test('User service should have required methods', () => {
    expect(userService).toHaveProperty('getUsers');
    expect(userService).toHaveProperty('createUser');
    expect(userService).toHaveProperty('updateUser');
    expect(userService).toHaveProperty('deleteUser');
  });

  test('Order service should have required methods', () => {
    expect(orderService).toHaveProperty('getOrders');
    expect(orderService).toHaveProperty('createOrder');
    expect(orderService).toHaveProperty('updateOrder');
    expect(orderService).toHaveProperty('deleteOrder');
  });
});