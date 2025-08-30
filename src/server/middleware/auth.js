const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // Check for API key or Bearer token
  if (apiKey && apiKey === process.env.API_KEY) {
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: Verify the token (e.g., JWT verification)
    if (token === process.env.BEARER_TOKEN) {
      return next();
    }
  }

  // If no valid authentication, return 401
  res.status(401).json({ error: 'Unauthorized' });
};

module.exports = authMiddleware;