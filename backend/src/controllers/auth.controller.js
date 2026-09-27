const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { createCsrfToken, getCookieOptions, getJwtSecret } = require('../config/security');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(1024),
}).strict();

exports.login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid credentials' });
  const { email, password } = parsed.data;

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH || '';
  if (!adminEmail || !hash) {
    return res.status(500).json({ message: 'Admin account not configured on server' });
  }
  if (email.toLowerCase() !== adminEmail) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const ok = await bcrypt.compare(password, hash);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

  const csrfToken = createCsrfToken();
  const token = jwt.sign(
    { sub: adminEmail, role: 'admin', csrf: csrfToken },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  res.cookie('qarwaan_admin_session', token, getCookieOptions());
  res.json({ csrfToken, user: { email: adminEmail, role: 'admin' } });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ csrfToken: req.admin.csrf, user: { email: req.admin.sub, role: req.admin.role } });
});

exports.logout = asyncHandler(async (_req, res) => {
  const { maxAge, ...cookieOptions } = getCookieOptions();
  res.clearCookie('qarwaan_admin_session', cookieOptions);
  res.status(204).end();
});
