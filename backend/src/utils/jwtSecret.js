const crypto = require('crypto');

let cachedFallbackSecret = null;

const getJwtSecret = () => {
  const envSecret = String(process.env.JWT_SECRET || '').trim();
  if (envSecret) {
    return envSecret;
  }

  if (!cachedFallbackSecret) {
    cachedFallbackSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Auth] JWT_SECRET is missing. Using an in-memory fallback secret.');
  }

  return cachedFallbackSecret;
};

module.exports = { getJwtSecret };