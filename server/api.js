import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, JWT_SECRET, getSetting, setSetting } from './db.js';
import { auth, adminOnly } from './auth.js';

const ASCII_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'ASCII.TXT');

function readAsciiFile() {
  try {
    const t = fs.readFileSync(ASCII_FILE, 'utf8').trim();
    return t || null;
  } catch { return null; }
}
function writeAsciiFile(text) {
  try { fs.writeFileSync(ASCII_FILE, text, 'utf8'); } catch { /* ignore */ }
}

export const api = express.Router();
api.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: 'too many attempts, wait 15 min' }
});

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  role: u.role,
  banned: !!u.banned,
  note: u.note || '',
  created_at: u.created_at,
  expires_at: u.expires_at || null,
  expired: u.expires_at ? new Date(u.expires_at) < new Date() : false
});

function validateExpiry(expires_at) {
  if (expires_at === null || expires_at === undefined || expires_at === '') return null;
  const d = new Date(expires_at);
  if (isNaN(d.getTime())) throw new Error('bad date');
  return d.toISOString();
}

// ---------- auth ----------
api.post('/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'введи логин и пароль' });

  const u = db.prepare(`SELECT * FROM users WHERE username=?`).get(String(username).trim());
  if (!u || !bcrypt.compareSync(String(password), u.password_hash)) {
    return res.status(401).json({ error: 'неверный логин или пароль' });
  }
  if (u.banned) return res.status(403).json({ error: 'аккаунт заблокирован' });
  if (u.expires_at && new Date(u.expires_at) < new Date()) {
    return res.status(403).json({ error: 'срок доступа истёк, свяжись с админом' });
  }

  const token = jwt.sign({ id: u.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password_hash, ...safe } = u;
  res.json({ token, user: safe });
});

api.get('/auth/me', auth(), (req, res) => {
  res.json(publicUser(req.user));
});

// ---------- devices (панель ратника) ----------
api.get('/devices', auth(), (req, res) => {
  const rows = db.prepare(`SELECT * FROM devices ORDER BY status='online' DESC, name ASC`).all();
  res.json(rows);
});

// ---------- settings ----------
api.get('/settings', (req, res) => {
  const keys = ['ascii_text', 'tg_url', 'site_title'];
  const out = {};
  for (const k of keys) out[k] = getSetting(k);
  // ASCII.TXT в корне проекта имеет приоритет — Goatic правит текст прямо в файле
  const fromFile = readAsciiFile();
  if (fromFile) out.ascii_text = fromFile;
  res.json(out);
});

api.put('/settings', auth(), adminOnly, (req, res) => {
  for (const k of ['ascii_text', 'tg_url', 'site_title']) {
    if (typeof req.body?.[k] === 'string') setSetting(k, req.body[k].slice(0, 500));
  }
  if (typeof req.body?.ascii_text === 'string') writeAsciiFile(req.body.ascii_text.slice(0, 500));
  res.json({ ok: true });
});

// ---------- users (admin) ----------
api.get('/users', auth(), adminOnly, (req, res) => {
  const rows = db.prepare(`SELECT * FROM users ORDER BY id ASC`).all();
  res.json(rows.map(publicUser));
});

api.post('/users', auth(), adminOnly, (req, res) => {
  const { username, password, days, lifetime, note } = req.body || {};
  const name = String(username || '').trim();
  if (!name || name.length < 2 || !/^[\w .\-]+$/u.test(name)) {
    return res.status(400).json({ error: 'юзернейм: мин 2 символа, буквы/цифры/_-. ' });
  }
  if (!password || String(password).length < 3) {
    return res.status(400).json({ error: 'пароль мин 3 символа' });
  }
  if (db.prepare(`SELECT id FROM users WHERE username=?`).get(name)) {
    return res.status(409).json({ error: 'такой юзер уже есть' });
  }
  let expires_at = null;
  if (!lifetime) {
    const daysN = Number(days);
    if (!daysN || daysN <= 0) return res.status(400).json({ error: 'укажи срок (дни) или lifetime' });
    expires_at = new Date(Date.now() + daysN * 86400000).toISOString();
  }
  const hash = bcrypt.hashSync(String(password), 10);
  const info = db.prepare(
    `INSERT INTO users (username, password_hash, role, note, created_at, expires_at)
     VALUES (?, ?, 'user', ?, ?, ?)`
  ).run(name, hash, String(note || ''), new Date().toISOString(), expires_at);
  const u = db.prepare(`SELECT * FROM users WHERE id=?`).get(info.lastInsertRowid);
  res.status(201).json(publicUser(u));
});

api.patch('/users/:id', auth(), adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const u = db.prepare(`SELECT * FROM users WHERE id=?`).get(id);
  if (!u) return res.status(404).json({ error: 'юзер не найден' });

  const b = req.body || {};
  try {
    if (b.banned !== undefined) {
      db.prepare(`UPDATE users SET banned=? WHERE id=?`).run(b.banned ? 1 : 0, id);
    }
    if (b.extend_days) {
      const base = u.expires_at && new Date(u.expires_at) > new Date() ? new Date(u.expires_at) : new Date();
      const next = new Date(base.getTime() + Number(b.extend_days) * 86400000);
      db.prepare(`UPDATE users SET expires_at=? WHERE id=?`).run(next.toISOString(), id);
    }
    if (b.expires_at !== undefined) {
      const iso = validateExpiry(b.expires_at);
      db.prepare(`UPDATE users SET expires_at=? WHERE id=?`).run(iso, id);
    }
    if (b.lifetime === true) {
      db.prepare(`UPDATE users SET expires_at=NULL WHERE id=?`).run(id);
    }
    if (b.note !== undefined) {
      db.prepare(`UPDATE users SET note=? WHERE id=?`).run(String(b.note).slice(0, 300), id);
    }
    if (b.username !== undefined) {
      const name = String(b.username).trim();
      if (name.length < 2) return res.status(400).json({ error: 'юзернейм мин 2 символа' });
      if (db.prepare(`SELECT id FROM users WHERE username=? AND id != ?`).get(name, id)) {
        return res.status(409).json({ error: 'такой юзер уже есть' });
      }
      db.prepare(`UPDATE users SET username=? WHERE id=?`).run(name, id);
    }
    if (b.password) {
      if (String(b.password).length < 3) return res.status(400).json({ error: 'пароль мин 3 символа' });
      db.prepare(`UPDATE users SET password_hash=? WHERE id=?`)
        .run(bcrypt.hashSync(String(b.password), 10), id);
    }
    const fresh = db.prepare(`SELECT * FROM users WHERE id=?`).get(id);
    res.json(publicUser(fresh));
  } catch (e) {
    res.status(400).json({ error: e.message || 'ошибка обновления' });
  }
});

api.delete('/users/:id', auth(), adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const u = db.prepare(`SELECT * FROM users WHERE id=?`).get(id);
  if (!u) return res.status(404).json({ error: 'юзер не найден' });
  if (u.role === 'admin') return res.status(400).json({ error: 'админа удалить нельзя' });
  db.prepare(`DELETE FROM users WHERE id=?`).run(id);
  res.json({ ok: true });
});
