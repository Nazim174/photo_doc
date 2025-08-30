const { supabase, userService, orderService } = require('../../src/services/supabase');
const { createPayment, checkPaymentStatus, handleWebhook } = require('../../src/services/payments');
const { removeBackground, processWithClipDrop, sendToServer } = require('../../src/services/images');

describe('Integration Tests - Services', () => {
  test('Supabase client should be initialized', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  test('User service should have all required methods', () => {
    expect(userService.getUsers).toBeDefined();
    expect(typeof userService.getUsers).toBe('function');
    expect(userService.createUser).toBeDefined();
    expect(typeof userService.createUser).toBe('function');
    expect(userService.updateUser).toBeDefined();
    expect(typeof userService.updateUser).toBe('function');
    expect(userService.deleteUser).toBeDefined();
    expect(typeof userService.deleteUser).toBe('function');
  });

  test('Order service should have all required methods', () => {
    expect(orderService.getOrders).toBeDefined();
    expect(typeof orderService.getOrders).toBe('function');
    expect(orderService.createOrder).toBeDefined();
    expect(typeof orderService.createOrder).toBe('function');
    expect(orderService.updateOrder).toBeDefined();
    expect(typeof orderService.updateOrder).toBe('function');
    expect(orderService.deleteOrder).toBeDefined();
    expect(typeof orderService.deleteOrder).toBe('function');
  });

  test('Payment service should have all required functions', () => {
    expect(createPayment).toBeDefined();
    expect(typeof createPayment).toBe('function');
    expect(checkPaymentStatus).toBeDefined();
    expect(typeof checkPaymentStatus).toBe('function');
    expect(handleWebhook).toBeDefined();
    expect(typeof handleWebhook).toBe('function');
  });

  test('Image service should have all required functions', () => {
    expect(removeBackground).toBeDefined();
    expect(typeof removeBackground).toBe('function');
    expect(processWithClipDrop).toBeDefined();
    expect(typeof processWithClipDrop).toBe('function');
    expect(sendToServer).toBeDefined();
    expect(typeof sendToServer).toBe('function');
  });

  // Note: These tests would require actual API keys and database connections
  // For real integration testing, you would mock external dependencies
  test('Payment creation should validate parameters', async () => {
    await expect(createPayment('invalid-provider', 100, 'RUB', 'test', 'success', 'fail'))
      .rejects.toThrow('Invalid provider');
  });

  test('Payment amount validation', async () => {
    await expect(createPayment('tinkoff', -100, 'RUB', 'test', 'success', 'fail'))
      .rejects.toThrow('Amount must be positive');
  });
});