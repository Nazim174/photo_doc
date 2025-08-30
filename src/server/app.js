const path = require('path');
const express = require('express');
const session = require('express-session');
require('dotenv').config();

console.log('DEBUG: Environment variables loaded:');
console.log('DEBUG: ADMIN_USERNAME:', process.env.ADMIN_USERNAME ? 'set' : 'not set');
console.log('DEBUG: ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'set' : 'not set');
console.log('DEBUG: SESSION_SECRET:', process.env.SESSION_SECRET ? 'set' : 'not set');
console.log('DEBUG: SUPABASE_URL:', process.env.SUPABASE_URL ? 'set' : 'not set');
console.log('DEBUG: SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'set' : 'not set');

const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'src', 'web', 'views'));
console.log('DEBUG: Views path set to:', app.get('views'));

// Static files
app.use('/css', express.static('src/web/public/css'));
app.use('/js', express.static('src/web/public/js'));

// Authentication middleware for API routes
app.use('/api', authMiddleware);

// Routes
app.use('/api', apiRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/admin', adminRoutes);
app.use('/payment', paymentRoutes);

// Test routes
app.get('/test/env', (req, res) => {
  const envVars = {
    ADMIN_USERNAME: process.env.ADMIN_USERNAME ? 'set' : 'not set',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'set' : 'not set',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'not set',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'not set',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'not set',
    PORT: process.env.PORT || '3000'
  };
  res.json(envVars);
});

app.get('/test/auth', (req, res) => {
  const authStatus = {
    isAuthenticated: req.session && req.session.isAdmin === true,
    sessionId: req.session?.id || null,
    isAdmin: req.session?.isAdmin || false
  };
  res.json(authStatus);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;