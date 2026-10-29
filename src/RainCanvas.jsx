import { useEffect, useRef } from 'react';

export default function RainCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    let w, h, cols, drops, raf;
    const CH = '01アイウエオカキクケコサシスセソ#$%&*+=.<>'.split('');

    const resize = () => {
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
      cols = Math.floor(w / 18);
      drops = Array(cols).fill(0).map(() => Math.random() * -50);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 66) return;
      last = t;
      ctx.fillStyle = 'rgba(3, 8, 5, 0.28)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '13px "JetBrains Mono", monospace';
      for (let i = 0; i < cols; i++) {
        const x = i * 18;
        const y = drops[i] * 18;
        const ch = CH[Math.floor(Math.random() * CH.length)];
        ctx.fillStyle = Math.random() > 0.975
          ? 'rgba(140, 255, 190, 0.85)'
          : 'rgba(0, 255, 136, 0.22)';
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="rain" aria-hidden="true" />;
}
