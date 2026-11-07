/**
 * Painterly finishing for the region banners: soft volumetric clouds lit from the sun,
 * god rays, rim light along ridges, blurred foreground framing, light motes and a fine
 * paint grain. Shared by every region, so each scene keeps its own original content
 * and only the rendering gets richer.
 */
import { rng } from "../../utils/random";
import { cloud, H, W, type Puff } from "./shapes";

/* ── Paint grain: one small noise tile, generated once and reused by every banner ── */
let grainURL: string | null = null;
export function grainTile(): string {
  if (grainURL !== null) return grainURL;
  grainURL = "";
  if (typeof document === "undefined") return grainURL;
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const ctx = c.getContext("2d");
  if (!ctx) return grainURL;
  const img = ctx.createImageData(160, 160);
  const r = rng(99);
  for (let i = 0; i < img.data.length; i += 4) {
    // soft, slightly clumpy grey noise (two octaves) reads like canvas tooth
    const v = 128 + (r() - 0.5) * 120 + (r() - 0.5) * 50;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainURL = c.toDataURL("image/png");
  return grainURL;
}

/** Filters and patterns every painterly element refers to (ids prefixed by the banner id). */
export function PaintDefs({ g, sun, night }: { g: string; sun: { x: number; y: number; color: string }; night?: boolean }) {
  const tile = grainTile();
  // light direction (toward the sun), always a little from above
  const len = Math.hypot(sun.x - W / 2, sun.y - H / 2) || 1;
  const lx = (sun.x - W / 2) / len;
  const ly = Math.min(-0.45, (sun.y - H / 2) / len);
  return (
    <>
      {/*
        Painted lighting for buildings and landmarks: a soft cool shadow band on the side
        away from the sun, a warm lit rim on the side facing it, faint brush mottling,
        a thin ink outline and a grounding shadow.
      */}
      <filter id={`${g}-build`} x="-4%" y="-6%" width="108%" height="114%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="fat" />
        <feFlood floodColor={night ? "#05081a" : "#2a2238"} floodOpacity={night ? 0.7 : 0.45} />
        <feComposite in2="fat" operator="in" result="ink" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="soft" />
        <feOffset in="soft" dx={-lx * 6} dy="9" result="drop" />
        <feFlood floodColor={night ? "#000010" : "#28305e"} floodOpacity={night ? 0.55 : 0.32} />
        <feComposite in2="drop" operator="in" result="ground" />
        <feOffset in="SourceAlpha" dx={lx * 14} dy={ly * 14} result="toLight" />
        <feComposite in="SourceAlpha" in2="toLight" operator="out" result="far" />
        <feGaussianBlur in="far" stdDeviation="6" result="farSoft" />
        <feFlood floodColor={night ? "#0c1238" : "#2f3d86"} floodOpacity={night ? 0.5 : 0.34} />
        <feComposite in2="farSoft" operator="in" />
        <feComposite in2="SourceAlpha" operator="in" result="shade" />
        <feOffset in="SourceAlpha" dx={-lx * 5} dy={-ly * 5} result="away" />
        <feComposite in="SourceAlpha" in2="away" operator="out" result="near" />
        <feGaussianBlur in="near" stdDeviation="1.6" result="nearSoft" />
        <feFlood floodColor={night ? "#c9d2ff" : "#fff3cf"} floodOpacity={night ? 0.4 : 0.8} />
        <feComposite in2="nearSoft" operator="in" />
        <feComposite in2="SourceAlpha" operator="in" result="rim" />
        <feTurbulence type="fractalNoise" baseFrequency="0.06 0.16" numOctaves="2" seed="7" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.13  0 0 0 0 0.3  0.3 0 0 0 -0.1" result="mottle" />
        <feComposite in="mottle" in2="SourceAlpha" operator="in" result="brush" />
        <feMerge>
          <feMergeNode in="ground" />
          <feMergeNode in="ink" />
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="brush" />
          <feMergeNode in="shade" />
          <feMergeNode in="rim" />
        </feMerge>
      </filter>
      <filter id={`${g}-blur6`} x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id={`${g}-blur3`} x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={`${g}-blur18`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
      <filter id={`${g}-dof`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="1.3" />
      </filter>
      <linearGradient id={`${g}-ray`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={sun.color} stopOpacity={night ? 0.25 : 0.55} />
        <stop offset="100%" stopColor={sun.color} stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${g}-warm`} cx={sun.x / W} cy={sun.y / H} r="0.9">
        <stop offset="0%" stopColor={night ? "#9fa8e0" : "#ffd79a"} stopOpacity=".55" />
        <stop offset="45%" stopColor={night ? "#9fa8e0" : "#ffd79a"} stopOpacity=".12" />
        <stop offset="100%" stopColor="#3b4a9a" stopOpacity=".28" />
      </radialGradient>
      {tile && (
        <pattern id={`${g}-grain`} width="160" height="160" patternUnits="userSpaceOnUse">
          <image href={tile} width="160" height="160" />
        </pattern>
      )}
    </>
  );
}

/**
 * A soft cumulus: a cool shaded body, a pale middle and a warm sunlit crown pushed
 * toward the light, each pass blurred so edges melt like brushed paint.
 */
export function PaintedCloud({
  puffs,
  g,
  sun,
  night,
  warmth = 0.5,
}: {
  puffs: Puff[];
  g: string;
  sun: { x: number; y: number };
  night?: boolean;
  warmth?: number;
}) {
  const cx = puffs.reduce((s, p) => s + p.x, 0) / puffs.length;
  const cy = puffs.reduce((s, p) => s + p.y, 0) / puffs.length;
  const len = Math.hypot(sun.x - cx, sun.y - cy) || 1;
  const lx = (sun.x - cx) / len;
  const ly = Math.min(-0.35, (sun.y - cy) / len); // light always comes a little from above
  const shade = night ? "#3b4676" : "#b3bde3";
  const body = night ? "#6b77aa" : "#f2f4fb";
  const lit = night ? "#b8c0e6" : mix("#fffaf0", "#ffe2a8", warmth);
  return (
    <g>
      <g filter={`url(#${g}-blur6)`}>
        {puffs.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y + p.r * 0.12} r={p.r} fill={shade} />
        ))}
      </g>
      <g filter={`url(#${g}-blur3)`}>
        {puffs.map((p, i) => (
          <circle key={i} cx={p.x + lx * p.r * 0.1} cy={p.y + ly * p.r * 0.14} r={p.r * 0.88} fill={body} />
        ))}
      </g>
      <g filter={`url(#${g}-blur3)`} opacity=".95">
        {puffs.map((p, i) => (
          <circle key={i} cx={p.x + lx * p.r * 0.3} cy={p.y + ly * p.r * 0.34} r={p.r * 0.6} fill={lit} />
        ))}
      </g>
    </g>
  );
}

/** The day sky's clouds: two drifting cumulus plus a big glowing bank low on the horizon. */
export function SkyClouds({ g, sun, night, warmth, seed }: { g: string; sun: { x: number; y: number }; night?: boolean; warmth: number; seed: number }) {
  return (
    <>
      <PaintedCloud puffs={cloud(seed + 21, 800, 560, 1500, 210)} g={g} sun={sun} night={night} warmth={warmth + 0.2} />
      <PaintedCloud puffs={cloud(seed + 3, 300, 270, 340, 92)} g={g} sun={sun} night={night} warmth={warmth} />
      <PaintedCloud puffs={cloud(seed + 5, 1200, 330, 300, 80)} g={g} sun={sun} night={night} warmth={warmth} />
    </>
  );
}

/** Soft god rays fanning down from the sun. */
export function SunRays({ g, sun, night }: { g: string; sun: { x: number; y: number }; night?: boolean }) {
  const r = rng(Math.round(sun.x + sun.y));
  const toward = sun.x < W / 2 ? 1 : -1; // rays lean across the picture, away from the sun's side
  const beams = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI / 2 + toward * (0.12 + i * 0.13 + r() * 0.05);
    const spread = 0.025 + r() * 0.035;
    const len = 900 + r() * 400;
    const p1 = [sun.x + Math.cos(a - spread) * len, sun.y + Math.sin(a - spread) * len];
    const p2 = [sun.x + Math.cos(a + spread) * len, sun.y + Math.sin(a + spread) * len];
    return { d: `M${sun.x} ${sun.y}L${p1[0].toFixed(0)} ${p1[1].toFixed(0)}L${p2[0].toFixed(0)} ${p2[1].toFixed(0)}Z`, o: 0.35 + r() * 0.4 };
  });
  return (
    <g filter={`url(#${g}-blur18)`} style={{ mixBlendMode: "screen" }} opacity={night ? 0.35 : 0.8}>
      {beams.map((b, i) => (
        <path key={i} d={b.d} fill={`url(#${g}-ray)`} opacity={b.o} />
      ))}
    </g>
  );
}

/** A thin warm highlight along a ridge or hill top, where the light catches it. */
export function RimLight({ d, g, color = "#fff1c4", width = 5, opacity = 0.5 }: { d: string; g: string; color?: string; width?: number; opacity?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity} filter={`url(#${g}-blur3)`} />;
}

/** Glitter on the water under the sun. */
export function WaterGlints({ sunX, y0, y1, seed, night }: { sunX: number; y0: number; y1: number; seed: number; night?: boolean }) {
  const r = rng(seed);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: 26 }, (_, i) => {
        const t = r();
        const y = y0 + t * (y1 - y0);
        const spread = 40 + t * 180;
        const x = sunX + (r() - 0.5) * spread * 2;
        const w = 12 + r() * 40 * (0.4 + t);
        return <rect key={i} x={x - w / 2} y={y} width={w} height={2 + t * 2} rx="2" fill={night ? "#dfe6ff" : "#fff6dc"} opacity={0.35 + r() * 0.5} />;
      })}
    </g>
  );
}

/** Floating light motes (pollen by day). */
export function Motes({ seed, night }: { seed: number; night?: boolean }) {
  const r = rng(seed);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: 16 }, (_, i) => {
        const x = r() * W;
        const y = 300 + r() * 480;
        const s = 2 + r() * 3.5;
        return (
          <g key={i} opacity={0.4 + r() * 0.5}>
            <circle cx={x} cy={y} r={s * 3} fill={night ? "#f9e68a" : "#fff8dc"} opacity=".25" />
            <circle cx={x} cy={y} r={s} fill={night ? "#fdf2b0" : "#ffffff"} />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Foreground foliage in the bottom corners, slightly out of focus, with a sunlit
 * edge on the side facing the light: frames the scene like a key-art vista.
 */
export function Framing({ g, near, sunX, night, seed }: { g: string; near: [string, string]; sunX: number; night?: boolean; seed: number }) {
  const r = rng(seed);
  const dark = mix(near[1], night ? "#05070f" : "#14261c", 0.45);
  const midC = mix(near[0], near[1], 0.6);
  const lit = night ? mix(near[0], "#9fb0e8", 0.35) : mix(near[0], "#fff0b8", 0.45);
  const clump = (x0: number, side: 1 | -1) => {
    // a mound of many small leaf clusters, tallest at the frame edge
    const puffs: Puff[] = [];
    for (let i = 0; i < 46; i++) {
      const t = Math.pow(r(), 0.8); // 0 at the edge → 1 toward the middle
      const top = 900 - (1 - t) * 190 - 20;
      const x = x0 + side * (t * 300 - 40) + (r() - 0.5) * 24;
      const y = top + r() * (900 - top) * 0.9;
      puffs.push({ x, y, r: 16 + r() * 22 + (1 - t) * 10 });
    }
    puffs.sort((p1, p2) => p1.y - p2.y);
    const towardSun = sunX > x0 ? 1 : -1;
    return (
      <g filter={`url(#${g}-dof)`}>
        {puffs.map((p, i) => (
          <circle key={`d${i}`} cx={p.x} cy={p.y} r={p.r} fill={dark} />
        ))}
        {puffs.map((p, i) => (
          <circle key={`m${i}`} cx={p.x + towardSun * p.r * 0.15} cy={p.y - p.r * 0.2} r={p.r * 0.72} fill={midC} />
        ))}
        {puffs
          .filter((_, i) => i % 3 === 0)
          .map((p, i) => (
            <ellipse key={`l${i}`} cx={p.x + towardSun * p.r * 0.32} cy={p.y - p.r * 0.45} rx={p.r * 0.34} ry={p.r * 0.22} fill={lit} opacity=".8" />
          ))}
      </g>
    );
  };
  return (
    <>
      {clump(70, 1)}
      {clump(W - 70, -1)}
    </>
  );
}

/** Final grade: warm light from the sun's side, cool shadow far from it, and paint grain. */
export function Grade({ g }: { g: string }) {
  const tile = grainTile();
  return (
    <>
      <rect width={W} height={H} fill={`url(#${g}-warm)`} style={{ mixBlendMode: "soft-light" }} />
      {tile && <rect width={W} height={H} fill={`url(#${g}-grain)`} opacity=".12" style={{ mixBlendMode: "overlay" }} />}
    </>
  );
}

/** Blend two hex colours. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

