'use client';
import { useRef, ReactNode } from 'react';

/** A button/link that leans toward the cursor and springs back. */
export function Magnetic({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = 'translate(0,0)';
  };

  return (
    <span ref={ref} className={`magnetic ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </span>
  );
}
