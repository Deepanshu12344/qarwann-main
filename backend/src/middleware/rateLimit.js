function rateLimit({ windowMs, max, key = (req) => req.ip, message }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const id = key(req);
    const entry = hits.get(id);
    const current = !entry || entry.resetAt <= now ? { count: 0, resetAt: now + windowMs } : entry;
    current.count += 1;
    hits.set(id, current);

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - current.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));
    if (current.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ message });
    }
    next();
  };
}

module.exports = { rateLimit };
