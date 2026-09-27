const jwt = require('jsonwebtoken');
const { getJwtSecret, safeEqual } = require('../config/security');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map((part) => part.trim().split(/=(.*)/s))
      .filter(([name]) => name),
  );
  const token = cookies.qarwaan_admin_session || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!safeEqual(req.get('x-csrf-token'), req.admin?.csrf)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next();
}

module.exports = { requireAdmin, requireCsrf };
