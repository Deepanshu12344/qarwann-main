const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

  const token = jwt.sign(
    { sub: adminEmail, role: 'admin' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  res.json({ token, user: { email: adminEmail, role: 'admin' } });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: { email: req.admin.sub, role: req.admin.role } });
});
