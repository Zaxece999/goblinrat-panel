import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, setToken } from '../api.js';
import { useSettings } from '../settings.jsx';
import Footer from '../components/Footer.jsx';
import AsciiText from '../AsciiText.jsx';

/* ---------------- helpers ---------------- */
const fmt = (iso) => iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

function statusOf(u) {
  if (u.banned) return { c: 'banned', t: 'BANNED' };
  if (u.expires_at === null) return { c: 'life', t: 'LIFETIME' };
  const left = (new Date(u.expires_at) - Date.now()) / 86400000;
  if (left <= 0) return { c: 'banned', t: 'EXPIRED' };
  if (left <= 3) return { c: 'soon', t: `SOON ${left.toFixed(1)}d` };
  return { c: 'ok', t: `${Math.floor(left)}d LEFT` };
}

const TO_LOCAL = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const FROM_LOCAL = (v) => v ? new Date(v).toISOString() : null;

/* ---------------- modal ---------------- */
function UserModal({ initial, onClose, onDone }) {
  const isEdit = !!initial;
  const [f, setF] = useState({
    username: initial?.username || '',
    password: '',
    note: initial?.note || '',
    mode: initial ? (initial.expires_at === null ? 'LIFE' : 'KEEP') : '30',
    custom: initial?.expires_at ? TO_LOCAL(initial.expires_at) : '',
    banned: initial?.banned || false
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF(v => ({ ...v, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      if (isEdit) {
        const body = { username: f.username, note: f.note, banned: f.banned };
        if (f.password) body.password = f.password;
        if (f.mode === 'LIFE') body.lifetime = true;
        else if (f.mode === 'CUSTOM') body.expires_at = FROM_LOCAL(f.custom);
        await api(`/users/${initial.id}`, { method: 'PATCH', body });
      } else {
        const body = { username: f.username, password: f.password, note: f.note };
        if (f.mode === 'LIFE') body.lifetime = true;
        else if (f.mode === 'CUSTOM') body.expires_at = FROM_LOCAL(f.custom);
        else body.days = f.mode;
        await api('/users', { method: 'POST', body });
      }
      onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span>{isEdit ? '>EDIT_USER' : '>NEW_USER'}</span>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <label className="field">
          <span className="field-label">&gt; USERNAME</span>
          <input autoFocus value={f.username} onChange={set('username')} spellCheck="false" />
        </label>

        <label className="field">
          <span className="field-label">&gt; PASSWORD {isEdit && <em className="dim">(пусто = не менять)</em>}</span>
          <input type="password" value={f.password} onChange={set('password')} spellCheck="false" />
        </label>

        <label className="field">
          <span className="field-label">&gt; NOTE</span>
          <input value={f.note} onChange={set('note')} placeholder="кто это / тг / камент" spellCheck="false" />
        </label>

        <div className="field">
          <span className="field-label">&gt; ACCESS TIME</span>
          <div className="chips">
            {[
              ['7', '7 ДНЕЙ'],
              ['30', '30 ДНЕЙ'],
              ['90', '90 ДНЕЙ'],
              ['LIFE', 'LIFETIME'],
              ['CUSTOM', 'CUSTOM…']
            ].map(([v, l]) => (
              <button key={v}
                className={`chip ${f.mode === v ? 'chip-on' : ''}`}
                onClick={() => setF(x => ({ ...x, mode: v }))}>
                {l}
              </button>
            ))}
          </div>
          {f.mode === 'CUSTOM' && (
            <input type="datetime-local" className="mt" value={f.custom} onChange={set('custom')} />
          )}
        </div>

        {isEdit && (
          <label className="switch-row">
            <span className="field-label">&gt; BANNED</span>
            <button className={`chip ${f.banned ? 'chip-red' : ''}`}
              onClick={() => setF(x => ({ ...x, banned: !x.banned }))}>
              {f.banned ? 'ЗАБЛОКИРОВАН' : 'АКТИВЕН'}
            </button>
          </label>
        )}

        {err && <div className="login-err">! {err}</div>}

        <button className="btn btn-solid btn-lg btn-full" onClick={submit} disabled={busy}>
          {busy ? 'SAVING…' : (isEdit ? 'SAVE →' : 'CREATE USER →')}
        </button>
      </div>
    </div>
  );
}

/* ---------------- settings tab ---------------- */
function SettingsTab() {
  const { s, reload } = useSettings();
  const [f, setF] = useState({ ascii_text: '', tg_url: '', site_title: '' });
  const [ok, setOk] = useState(false);

  useEffect(() => setF({ ascii_text: s.ascii_text, tg_url: s.tg_url, site_title: s.site_title }), [s]);

  const save = async () => {
    await api('/settings', { method: 'PUT', body: f });
    await reload();
    setOk(true); setTimeout(() => setOk(false), 1600);
  };

  return (
    <div className="tab-body">
      <div className="panel">
        <div className="panel-title">// SITE SETTINGS <span className="dim">— применяется везде сразу</span></div>

        <label className="field">
          <span className="field-label">&gt; ASCII TEXT (главный баннер) <em>— или просто правь файл ASCII.TXT в корне, файл в приоритете</em></span>
          <input
            value={f.ascii_text} onChange={e => setF(x => ({ ...x, ascii_text: e.target.value }))}
            placeholder="GOBLINRAT" spellCheck="false"
          />
        </label>
        <div className="ascii-preview"><AsciiText text={f.ascii_text} small /></div>
        <label className="field">
          <span className="field-label">&gt; ASCII TITLE (крупный текст на главной)</span>
          <input
            value={f.ascii_text} onChange={e => setF(x => ({ ...x, ascii_text: e.target.value }))}
            placeholder="GREENLINK" spellCheck="false"
          />
        </label>
        <label className="field">
          <span className="field-label">&gt; TELEGRAM CHANNEL URL (в футер всех страниц)</span>
          <input
            value={f.tg_url} onChange={e => setF(x => ({ ...x, tg_url: e.target.value }))}
            placeholder="https://t.me/your_channel" spellCheck="false"
          />
        </label>
        <label className="field">
          <span className="field-label">&gt; SITE NAME (шапка/заголовок)</span>
          <input
            value={f.site_title} onChange={e => setF(x => ({ ...x, site_title: e.target.value }))}
            placeholder="GREENLINK" spellCheck="false"
          />
        </label>

        <button className="btn btn-solid" onClick={save}>SAVE SETTINGS →</button>
        {ok && <span className="save-ok">SAVED ✓</span>}
      </div>
    </div>
  );
}

/* ---------------- main ---------------- */
export default function Admin() {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('users');
  const [me, setMe] = useState(null);
  const [modal, setModal] = useState(null); // {user or null}
  const [err, setErr] = useState('');

  const load = () => api('/users').then(setUsers).catch(e => setErr(e.message));
  useEffect(() => {
    load();
    api('/auth/me').then(setMe).catch(() => {});
    const t = setInterval(load, 15000); // live refresh
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return !s ? users : users.filter(u =>
      u.username.toLowerCase().includes(s) || (u.note || '').toLowerCase().includes(s)
    );
  }, [users, q]);

  const logout = () => { setToken(null); nav('/login', { replace: true }); };

  const act = async (id, body) => {
    try { await api(`/users/${id}`, { method: 'PATCH', body }); load(); }
    catch (e) { setErr(e.message); setTimeout(() => setErr(''), 3000); }
  };
  const del = async (u) => {
    if (!confirm(`DELETE USER "${u.username}" навсегда?`)) return;
    try { await api(`/users/${u.id}`, { method: 'DELETE' }); load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div className="page admin">
      <header className="admin-top">
        <div className="logo" onClick={() => setTab('users')}>
          <span className="logo-bracket">[</span> GOBLINRAT ADMIN <span className="logo-bracket">]</span>
        </div>
        <div className="admin-me">
          <button className="btn btn-ghost" onClick={() => nav('/panel')}>← ПАНЕЛЬ</button>
          <span className="me-name">&gt;_ {me?.username || '…'}</span>
          <button className="btn btn-ghost" onClick={logout}>LOGOUT</button>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-side">
          <div className="side-label">// SECTIONS</div>
          {[
            ['users', 'USERS', `▚ ${users.length}`],
            ['settings', 'SETTINGS', '⚙']
          ].map(([k, l, n]) => (
            <button key={k} className={`side-btn ${tab === k ? 'side-on' : ''}`} onClick={() => setTab(k)}>
              {l} <span className="side-n">{n}</span>
            </button>
          ))}
        </aside>

        <main className="admin-main">
          {tab === 'users' ? (
            <>
              <div className="toolbar">
                <input className="search" placeholder="grep users… (ник или коммент)"
                  value={q} onChange={e => setQ(e.target.value)} />
                <button className="btn btn-solid" onClick={() => setModal({})}>+ ADD USER</button>
              </div>

              {err && <div className="login-err">! {err}</div>}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>USER</th><th>STATUS</th><th>CREATED</th>
                      <th>EXPIRES</th><th>NOTE</th><th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(u => {
                      const st = statusOf(u);
                      return (
                        <tr key={u.id} className={u.banned || u.expired ? 'row-dead' : ''}>
                          <td className="dim">#{u.id}</td>
                          <td className="td-user">{u.username}{u.role === 'admin' && <b className="admin-tag">ADMIN</b>}</td>
                          <td><span className={`pill pill-${st.c}`}>{st.t}</span></td>
                          <td className="dim">{fmt(u.created_at)}</td>
                          <td>{u.expires_at === null ? '∞' : fmt(u.expires_at)}</td>
                          <td className="dim td-note">{u.note}</td>
                          <td className="td-actions">
                            <button className="mini" title="+1 день" onClick={() => act(u.id, { extend_days: 1 })}>+1d</button>
                            <button className="mini" title="+7 дней" onClick={() => act(u.id, { extend_days: 7 })}>+7d</button>
                            <button className="mini" onClick={() => setModal({ user: u })}>EDIT</button>
                            <button className="mini mini-warn"
                              onClick={() => act(u.id, { banned: !u.banned })}>
                              {u.banned ? 'UNBAN' : 'BAN'}
                            </button>
                            <button className="mini mini-red" onClick={() => del(u)}>DEL</button>
                          </td>
                        </tr>
                      );
                    })}
                    {!rows.length && (
                      <tr><td colSpan="7" className="empty">— пусто. создай первого юзера кнопкой <b>+ ADD USER</b> —</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : <SettingsTab />}
        </main>
      </div>

      {modal && (
        <UserModal
          initial={modal.user}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(); }}
        />
      )}
      <Footer />
    </div>
  );
}
