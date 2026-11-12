'use client';
import { useEffect, useRef } from 'react';

/**
 * A soft trailing cursor ring that grows over links/products. Desktop + fine
 * pointer only; hidden on touch and for reduced-motion.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    document.body.classList.add('has-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;

    let interactive = false;
    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      const t = e.target as HTMLElement;
      const hit = !!t.closest('a, button, .card, .tilt, input, .swatch, .size-btn');
      if (hit !== interactive) { interactive = hit; ring.current?.classList.toggle('big', hit); }
    };
    const loop = () => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move);
    loop();
    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf);
      document.body.classList.remove('has-cursor');
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
