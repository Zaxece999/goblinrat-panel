import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, getToken } from '../api.js';
import Footer from '../components/Footer.jsx';

export default function Login() {
  const nav = useNavigate();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  if (getToken()) nav('/panel', { replace: true });

  const submit = async (e) => {
    e && e.preventDefault();
    setBusy(true); setErr('');
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { username: u, password: p } });
      setToken(token);
      nav('/panel', { replace: true });
    } catch (e2) {
      setErr(e2.message);
      setShake(true);
      setTimeout(() => setShake(false), 420);
    } finally { setBusy(false); }
  };

  return (
    <div className="page login-page">
      <main className={`login-wrap ${shake ? 'shake' : ''}`}>
        <div className="login-card">
          <div className="login-head">
            <div className="login-dots"><i /><i /><i /></div>
            <pre className="login-ascii">/root/authorize --user</pre>
          </div>

          <form onSubmit={submit} className="login-form">
            <label className="field">
              <span className="field-label">&gt; USERNAME</span>
              <input
                autoFocus value={u} onChange={e => setU(e.target.value)}
                placeholder="admin" spellCheck="false" autoComplete="off"
              />
            </label>
            <label className="field">
              <span className="field-label">&gt; PASSWORD</span>
              <input
                type="password" value={p} onChange={e => setP(e.target.value)}
                placeholder="••••••••" autoComplete="off"
              />
            </label>

            {err && <div className="login-err">! {err}</div>}

            <button className="btn btn-solid btn-lg btn-full" disabled={busy}>
              {busy ? 'AUTHORIZING…' : 'AUTHORIZE →'}
            </button>
          </form>

          <div className="login-foot">
            <span className="dim">// телеметрия шифруется AES-256</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
