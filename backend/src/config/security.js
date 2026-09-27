const crypto = require('crypto');

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function getAllowedOrigins() {
  const configured = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length) return configured;
  if (!isProduction()) return ['http://localhost:3000', 'http://localhost:5173'];
  throw new Error('CORS_ORIGIN must list the permitted frontend origin(s) in production');
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret === 'replace-with-a-long-random-string') {
    throw new Error('JWT_SECRET must be a unique random value of at least 32 characters');
  }
  return secret;
}

function getCookieOptions() {
  const sameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    throw new Error('COOKIE_SAME_SITE must be lax, strict, or none');
  }
  const secure = isProduction() || process.env.COOKIE_SECURE === 'true';
  if (sameSite === 'none' && !secure) {
    throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
  }
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = { createCsrfToken, getAllowedOrigins, getCookieOptions, getJwtSecret, safeEqual };
