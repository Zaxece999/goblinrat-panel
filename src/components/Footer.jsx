import { useSettings } from '../settings.jsx';

export default function Footer() {
  const { s } = useSettings();
  const tg = s.tg_url || '';

  return (
    <footer className="footer">
      <button
        className="footer-dot"
        title="системный статус"
        onClick={() => {}}
        aria-hidden="true"
      />
      <span className="footer-status">
        <i className="blink" /> SYS::ONLINE
      </span>
      <span className="footer-sep">|</span>
      {tg ? (
        <a
          className="footer-tg"
          href={tg}
          target="_blank"
          rel="noreferrer"
        >
          [ TELEGRAM ↗ {tg.replace(/^https?:\/\/(www\.)?/, '').slice(0, 34)} ]
        </a>
      ) : (
        <span className="footer-tg footer-tg-empty">[ TG CHANNEL NOT SET ]</span>
      )}
      <span className="footer-sep">|</span>
      <span className="footer-copy">© {new Date().getFullYear()} {s.site_title || 'GREENLINK'}</span>
    </footer>
  );
}
