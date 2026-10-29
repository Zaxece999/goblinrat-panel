import { useEffect, useRef } from 'react';

/** fade-in + rise when element scrolls into view */
export default function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('reveal');
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add('revealed');
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}
