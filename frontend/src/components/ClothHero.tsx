'use client';
import { useEffect, useRef } from 'react';

/**
 * A verlet-integration cloth mesh pinned along the top, draping under gravity.
 * The cursor pushes the fabric, so it ripples and sways — the copy's promise,
 * made literal. Pure canvas, no deps, pauses when offscreen.
 */
export function ClothHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, down: false };

    // Cloth grid
    let COLS = 0, ROWS = 0;
    const SPACING = 22;
    const GRAVITY = 0.28;
    const FRICTION = 0.985;
    const BOUNCE = 0.4;

    interface P { x: number; y: number; ox: number; oy: number; pinX: number | null; pinY: number | null; }
    let points: P[] = [];

    function build() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      COLS = Math.max(8, Math.floor(W / SPACING));
      ROWS = Math.max(6, Math.floor((H * 0.72) / SPACING));
      const startX = (W - (COLS - 1) * SPACING) / 2;
      const startY = H * 0.06;

      points = [];
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const px = startX + x * SPACING;
          const py = startY + y * SPACING;
          const pinned = y === 0 && (x % 3 === 0 || x === COLS - 1);
          points.push({ x: px, y: py, ox: px, oy: py, pinX: pinned ? px : null, pinY: pinned ? py : null });
        }
      }
    }

    const idx = (x: number, y: number) => y * COLS + x;

    function update() {
      for (const p of points) {
        if (p.pinX !== null) { p.x = p.pinX; p.y = p.pinY!; continue; }
        const vx = (p.x - p.ox) * FRICTION;
        const vy = (p.y - p.oy) * FRICTION;
        p.ox = p.x; p.oy = p.y;
        p.x += vx; p.y += vy + GRAVITY;

        // Cursor interaction
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        const R = 90;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const force = (1 - d / R) * 10;
          p.x += (dx / d) * force;
          p.y += (dy / d) * force;
        }

        if (p.y > H) { p.y = H; p.oy = p.y + vy * BOUNCE; }
        if (p.x < 0) { p.x = 0; p.ox = p.x + vx * BOUNCE; }
        if (p.x > W) { p.x = W; p.ox = p.x + vx * BOUNCE; }
      }

      // Constraint relaxation
      for (let k = 0; k < 2; k++) {
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (x < COLS - 1) constrain(points[idx(x, y)], points[idx(x + 1, y)]);
            if (y < ROWS - 1) constrain(points[idx(x, y)], points[idx(x, y + 1)]);
          }
        }
      }
    }

    function constrain(a: P, b: P) {
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const diff = (SPACING - d) / d * 0.5;
      const ox = dx * diff, oy = dy * diff;
      if (a.pinX === null) { a.x -= ox; a.y -= oy; }
      if (b.pinX === null) { b.x += ox; b.y += oy; }
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Soft contact shadow beneath the drape.
      ctx!.save();
      ctx!.filter = 'blur(18px)';
      ctx!.fillStyle = 'rgba(40,34,28,0.18)';
      ctx!.beginPath();
      for (let x = 0; x < COLS; x++) {
        const p = points[idx(x, ROWS - 1)];
        if (x === 0) ctx!.moveTo(p.x, p.y + 10); else ctx!.lineTo(p.x, p.y + 10);
      }
      for (let x = COLS - 1; x >= 0; x--) {
        const p = points[idx(x, ROWS - 1)];
        ctx!.lineTo(p.x, p.y + 40);
      }
      ctx!.closePath(); ctx!.fill();
      ctx!.restore();

      // Woven cells — a warm bone fabric, shaded by fold tension for real depth.
      for (let y = 0; y < ROWS - 1; y++) {
        for (let x = 0; x < COLS - 1; x++) {
          const a = points[idx(x, y)];
          const b = points[idx(x + 1, y)];
          const c = points[idx(x + 1, y + 1)];
          const d = points[idx(x, y + 1)];
          const t = y / ROWS;
          // local stretch → how much a fold catches or loses light
          const stretchX = Math.abs(b.x - a.x) - SPACING;
          const stretchY = Math.abs(d.y - a.y) - SPACING;
          const fold = Math.max(-1, Math.min(1, (stretchX + stretchY) / (SPACING * 1.1)));
          // base warm bone, lifts to highlight on stretch, drops to charcoal shadow in slack folds
          const L = 238 - t * 34 + fold * 30;
          const r = Math.max(20, Math.min(246, L));
          const g = Math.max(16, Math.min(238, L - 8));
          const bl = Math.max(12, Math.min(222, L - 26));
          ctx!.fillStyle = `rgb(${r|0}, ${g|0}, ${bl|0})`;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.lineTo(c.x, c.y);
          ctx!.lineTo(d.x, d.y);
          ctx!.closePath();
          ctx!.fill();
        }
      }
      // Fine weave threads
      ctx!.strokeStyle = 'rgba(70,60,48,0.05)';
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS - 1; x++) {
          const a = points[idx(x, y)], b = points[idx(x + 1, y)];
          ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y);
        }
      }
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS - 1; y++) {
          const a = points[idx(x, y)], b = points[idx(x, y + 1)];
          ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y);
        }
      }
      ctx!.stroke();

      // Warm vignette for a lit-studio feel.
      const vg = ctx!.createRadialGradient(W * 0.5, H * 0.42, Math.min(W, H) * 0.2, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(60,50,38,0.14)');
      ctx!.fillStyle = vg;
      ctx!.fillRect(0, 0, W, H);
    }

    let raf = 0;
    let running = true;
    function loop() {
      if (!running) return;
      if (!prefersReduced) update();
      draw();
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.px = mouse.x; mouse.py = mouse.y;
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() { mouse.x = -9999; mouse.y = -9999; }

    build();
    draw();
    if (!prefersReduced) loop();

    const io = new IntersectionObserver((entries) => {
      const vis = entries[0]?.isIntersecting;
      if (vis && !running && !prefersReduced) { running = true; loop(); }
      else if (!vis) { running = false; cancelAnimationFrame(raf); }
    }, { threshold: 0.05 });
    io.observe(canvas);

    const onResize = () => { build(); };
    window.addEventListener('resize', onResize);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="cloth-canvas" aria-hidden="true" />;
}
