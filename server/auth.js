import jwt from 'jsonwebtoken';
import { db, JWT_SECRET } from './db.js';

export function auth(required = true) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return res.status(401).json({ error: 'no token' });
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.prepare(`SELECT id, username, role, banned, expires_at FROM users WHERE id=?`).get(payload.id);
      if (!user) return res.status(401).json({ error: 'user gone' });
      if (user.banned) return res.status(403).json({ error: 'banned' });
      if (user.expires_at && new Date(user.expires_at) < new Date()) {
        return res.status(403).json({ error: 'expired' });
      }
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: 'bad token' });
    }
  };
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  next();
}
