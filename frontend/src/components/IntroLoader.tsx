'use client';
import { useEffect, useState } from 'react';

/**
 * First-load curtain. Counts the cloth in, then wipes up to reveal the site.
 * Runs once per tab (sessionStorage), respects reduced-motion.
 */
export function IntroLoader() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('vnl_intro') === '1'; } catch {}
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduced) return;

    try { sessionStorage.setItem('vnl_intro', '1'); } catch {}
    setShow(true);
    document.body.style.overflow = 'hidden';

    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setCount(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setLeaving(true);
        setTimeout(() => { setShow(false); document.body.style.overflow = ''; }, 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = ''; };
  }, []);

  if (!show) return null;
  return (
    <div className={`intro ${leaving ? 'intro-leaving' : ''}`} aria-hidden="true">
      <div className="intro-inner">
        <div className="intro-word">Vanilla</div>
        <div className="intro-sub">Lahore · Est. 2026</div>
      </div>
      <div className="intro-count">{String(count).padStart(3, '0')}</div>
      <div className="intro-bar"><span style={{ transform: `scaleX(${count / 100})` }} /></div>
    </div>
  );
}
