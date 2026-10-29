import { useEffect, useMemo, useRef, useState } from 'react';
import FONT from './asciiFont.js';

const NOISE = '▓▒░█<>/*+?!-≈≡';
const MAX_PER_LINE = 12;

function wrapWords(str, max) {
  const words = str.replace(/[^A-Z0-9 .!?:\-_]/g, '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? cur + ' ' + w : w;
    if (cand.length <= max) cur = cand;
    else { if (cur) lines.push(cur); cur = w.slice(0, max); }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Animated ASCII banner. Multi-line (auto-wrap by words).
 * Phase 1: per-cell scramble -> resolve left to right.
 * Phase 2: scan sweep + periodic glitch corruption.
 */
export default function AsciiText({ text = '', small = false }) {
  const linesArr = useMemo(() => {
    const t = (text || '').toUpperCase().replace(/\s+/g, ' ').trim();
    if (!t) return [];
    const filtered = t.split('').filter(c => FONT[c] || c === ' ').join('').trim();
    return wrapWords(filtered, MAX_PER_LINE).slice(0, 3);
  }, [text]);
  const keySig = linesArr.join('|');

  const offsets = useMemo(() => {
    let o = 0;
    return linesArr.map(l => { const v = o; o += l.length; return v; });
  }, [keySig]);
  const total = linesArr.reduce((a, l) => a + l.length, 0) * 5;

  const [resolvedCount, setResolved] = useState(0);
  const [glitch, setGlitch] = useState({});
  const [sweep, setSweep] = useState(-999);
  const tick = useRef(0);

  // decode-in
  useEffect(() => {
    setResolved(0);
    let raf = 0, last = 0, i = 0;
    const step = (t) => {
      if (t - last > 45) {
        i += 1 + Math.floor(i / 24);
        setResolved(Math.min(i, total));
        last = t;
      }
      if (i < total) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [keySig]);

  // periodic glitch
  useEffect(() => {
    if (!linesArr.length) return;
    const id = setInterval(() => {
      const g = {};
      const n = 3 + Math.floor(Math.random() * 5);
      for (let k = 0; k < n; k++) {
        g[Math.floor(Math.random() * 5) + ':' + Math.floor(Math.random() * 60)] =
          NOISE[Math.floor(Math.random() * NOISE.length)];
      }
      setGlitch(g);
      setTimeout(() => setGlitch({}), 140 + Math.random() * 180);
    }, 3200 + Math.random() * 2500);
    return () => clearInterval(id);
  }, [keySig]);

  // scan sweep
  useEffect(() => {
    const id = setInterval(() => {
      tick.current++;
      setSweep((tick.current % 160) - 20);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const buildRow = (line, li, r) => {
    const cells = [];
    Array.from(line).forEach((ch, gi) => {
      const glyph = FONT[ch];
      const abs = offsets[li] * 5 + gi * 5 + r;
      for (let c = 0; c < glyph[r].length; c++) {
        cells.push({
          ch: glyph[r][c],
          isBlock: glyph[r][c] === '█',
          resolved: abs < resolvedCount,
          glow: glitch[r + ':' + ((gi * 7 + c + li * 61) % 60)],
          dist: Math.abs((offsets[li] + gi) * 6 + r * 0.7 - sweep)
        });
      }
      cells.push({ sep: true });
    });
    return cells;
  };

  const renderCell = (cell, key) => {
    if (cell.sep) return <span key={key} className="ascii-gap" />;
    let ch = cell.ch;
    let cls = 'ac';
    if (cell.glow && cell.isBlock) {
      ch = cell.glow;
      cls += ' ac-glitch';
    } else if (!cell.resolved) {
      if (cell.isBlock) { ch = NOISE[Math.floor((key * 7 + resolvedCount) % NOISE.length)]; cls += ' ac-dim'; }
    } else if (cell.isBlock) {
      cls += cell.dist < 5 ? ' ac-hot' : (cell.dist < 12 ? ' ac-warm' : '');
    }
    return <span key={key} className={cls}>{ch}</span>;
  };

  if (!linesArr.length) return (
    <pre className={`ascii ${small ? 'ascii-sm' : ''}`} aria-label="ascii banner">
      <span className="ac ac-dim">░░ text empty — edit ASCII.TXT ░░</span>
    </pre>
  );

  return (
    <pre className={`ascii ${small ? 'ascii-sm' : ''}`} aria-label={linesArr.join(' ')}>
      {linesArr.map((line, li) => (
        <span key={li}>
          {[0, 1, 2, 3, 4].map(r => (
            <div key={r} className="ascii-line">
              {buildRow(line, li, r).map((c, i) => renderCell(c, li * 500 + r * 100 + i))}
            </div>
          ))}
          {li < linesArr.length - 1 && <div className="ascii-break" />}
        </span>
      ))}
    </pre>
  );
}
