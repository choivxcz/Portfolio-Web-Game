import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

const DEFAULT_COLORS = ["#f2c66f", "#5ee6c9", "#a9e8ff"];

interface ParticlesProps {
  /** Particles per 100,000 px² of canvas (scaled down on small screens). */
  density?: number;
  colors?: string[];
  /** Sideways wind in px per frame (0 = motes only rise). */
  drift?: number;
  className?: string;
}

interface Mote {
  x: number;
  y: number;
  r: number;
  vy: number;
  phase: number;
  speed: number;
  color: string;
  alpha: number;
}

/**
 * Lightweight floating motes on a canvas. Pauses when off-screen or when the
 * tab is hidden; draws a single static frame when reduced motion is requested.
 */
export function Particles({ density = 4, colors = DEFAULT_COLORS, drift = 0, className = "" }: ParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let motes: Mote[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const spawn = (anywhere: boolean): Mote => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.08 + Math.random() * 0.28,
      phase: Math.random() * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.01,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.35 + Math.random() * 0.6,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(110, Math.round(((w * h) / 100000) * density * (w < 700 ? 0.6 : 1)));
      motes = Array.from({ length: target }, () => spawn(true));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        const flicker = 0.65 + 0.35 * Math.sin(t * 0.0012 + m.phase * 3);
        const x = m.x + Math.sin(t * m.speed * 0.1 + m.phase) * 14;
        ctx.globalAlpha = m.alpha * flicker * 0.22;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = m.alpha * flicker;
        ctx.beginPath();
        ctx.arc(x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = (t: number) => {
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.y -= m.vy;
        m.x += drift * (0.6 + m.r * 0.4);
        if (m.x > w + 20) m.x = -20;
        if (m.y < -12) motes[i] = spawn(false);
      }
      draw(t);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    if (reduced) draw(0);
    else start();

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density, colors, drift, reduced]);

  return <canvas ref={ref} className={`particles ${className}`} aria-hidden="true" />;
}
