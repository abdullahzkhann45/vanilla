'use client';

/** A slow seamless ticker. Pauses on hover. */
export function Marquee({ items, speed = 38 }: { items: string[]; speed?: number }) {
  const run = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        {run.map((t, i) => (
          <span key={i} className="marquee-item">
            {t}<span className="marquee-dot">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
