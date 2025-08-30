require('dotenv').config();

describe('Environment Variables', () => {
  test('should have required environment variables set', () => {
    console.log('Testing environment variables...');

    // Required variables for Supabase
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();

    // Required variables for admin authentication
    expect(process.env.ADMIN_USERNAME).toBeDefined();
    expect(process.env.ADMIN_PASSWORD).toBeDefined();

    // Required variables for session
    expect(process.env.SESSION_SECRET).toBeDefined();

    // Optional but expected variables
    expect(process.env.TELEGRAM_BOT_TOKEN).toBeDefined();
    expect(process.env.PORT).toBeDefined();

    console.log('All required environment variables are set');
    console.log('SUPABASE_URL length:', process.env.SUPABASE_URL.length);
    console.log('SUPABASE_ANON_KEY length:', process.env.SUPABASE_ANON_KEY.length);
    console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
    console.log('SESSION_SECRET length:', process.env.SESSION_SECRET.length);
  });

  test('should validate Supabase URL format', () => {
    const url = process.env.SUPABASE_URL;
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
    console.log('Supabase URL format is valid');
  });

  test('should validate Supabase key format', () => {
    const key = process.env.SUPABASE_ANON_KEY;
    expect(key).toMatch(/^eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/);
    console.log('Supabase key format appears valid (JWT-like)');
  });

  test('should have non-empty admin credentials', () => {
    expect(process.env.ADMIN_USERNAME.length).toBeGreaterThan(0);
    expect(process.env.ADMIN_PASSWORD.length).toBeGreaterThan(0);
    console.log('Admin credentials are non-empty');
  });
});