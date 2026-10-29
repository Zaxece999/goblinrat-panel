import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const db = new DatabaseSync(path.join(__dirname, 'data.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    banned INTEGER NOT NULL DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    expires_at TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    model TEXT DEFAULT '',
    brand TEXT DEFAULT '',
    android TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    status TEXT DEFAULT 'offline',
    last_seen TEXT DEFAULT ''
  );
`);

// --- seed demo device ---
const hasDevice = db.prepare(`SELECT id FROM devices LIMIT 1`).get();
if (!hasDevice) {
  db.prepare(`INSERT INTO devices (name, model, brand, android, ip, status, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('sdk_gphone64_x86_64', 'Brand // 1', 'Google', '14', '127.0.0.1', 'online', new Date().toISOString());
}

const now = new Date().toISOString();

// --- bootstrap admin ---
const hasAdmin = db.prepare(`SELECT id FROM users LIMIT 1`).get();
if (!hasAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, 'admin', ?)`)
    .run('admin', hash, now);
  console.log('[db] created default admin: admin / admin123');
}

// --- jwt secret persistence ---
let secretRow = db.prepare(`SELECT value FROM settings WHERE key='jwt_secret'`).get();
if (!secretRow) {
  const secret = crypto.randomBytes(32).toString('hex');
  db.prepare(`INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)`).run(secret);
  secretRow = { value: secret };
}
export const JWT_SECRET = secretRow.value;

// --- default site settings ---
const DEFAULTS = {
  ascii_text: 'GREENLINK',
  tg_url: 'https://t.me/your_channel',
  site_title: 'GREENLINK'
};
const ins = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
for (const [k, v] of Object.entries(DEFAULTS)) ins.run(k, v);

export function getSetting(key) {
  const r = db.prepare(`SELECT value FROM settings WHERE key=?`).get(key);
  return r ? r.value : null;
}
export function setSetting(key, value) {
  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(key, String(value));
}
