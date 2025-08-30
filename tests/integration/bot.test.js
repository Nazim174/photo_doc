const { Telegraf } = require('telegraf');

// Mock Telegraf to avoid actual bot initialization in tests
jest.mock('telegraf');

describe('Integration Tests - Bot', () => {
  let bot;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock bot instance
    bot = {
      start: jest.fn(),
      help: jest.fn(),
      command: jest.fn(),
      launch: jest.fn().mockResolvedValue(),
      stop: jest.fn(),
    };

    // Mock the Telegraf constructor
    Telegraf.mockImplementation(() => bot);
  });

  test('Bot should be instantiated with token', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    const { bot: actualBot } = require('../../index');

    expect(Telegraf).toHaveBeenCalledWith('test-token');
    expect(actualBot).toBeDefined();
  });

  test('Bot should have start handler', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    require('../../index');

    expect(bot.start).toHaveBeenCalled();
    expect(typeof bot.start.mock.calls[0][0]).toBe('function');
  });

  test('Bot should have help handler', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    require('../../index');

    expect(bot.help).toHaveBeenCalled();
    expect(typeof bot.help.mock.calls[0][0]).toBe('function');
  });

  test('Bot should have users command', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    require('../../index');

    expect(bot.command).toHaveBeenCalledWith('users', expect.any(Function));
  });

  test('Bot should have orders command', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    require('../../index');

    expect(bot.command).toHaveBeenCalledWith('orders', expect.any(Function));
  });

  test('Bot should launch successfully', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    const { bot: actualBot } = require('../../index');

    // The launch should have been called in the index.js
    expect(actualBot.launch).toHaveBeenCalled();
  });

  test('Bot should handle missing token gracefully', () => {
    delete process.env.TELEGRAM_BOT_TOKEN;

    // This would normally cause process.exit(1), but for testing we'll mock it
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    try {
      require('../../index');
    } catch (error) {
      expect(error.message).toContain('TELEGRAM_BOT_TOKEN');
    }

    mockExit.mockRestore();
  });
});