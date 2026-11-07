import { rng } from "../../utils/random";

/** Scene size every generator works in (SVG user units). */
export const W = 1600;
export const H = 900;

/** A ridge line as a closed path, built from layered sine waves plus jitter. */
export function ridge(
  seed: number,
  base: number,
  amp: number,
  opts: { step?: number; rough?: number; lift?: (x: number) => number; sharp?: number } = {},
): string {
  const r = rng(seed);
  const { step = 10, rough = 0.2, lift = () => 0, sharp = 0.9 } = opts;
  const waves = Array.from({ length: 4 }, (_, i) => ({
    f: (0.0015 + r() * 0.0011) * (i + 1) ** 1.35,
    p: r() * Math.PI * 2,
    a: 1 / (i + 1) ** 1.25,
  }));
  let d = `M0 ${H} `;
  for (let x = 0; x <= W; x += step) {
    let y = 0;
    for (const w of waves) y += Math.sin(x * w.f + w.p) * w.a;
    y = Math.abs(y) ** sharp;
    const jitter = (r() - 0.5) * amp * rough * 0.3;
    d += `L${x} ${(base - y * amp + jitter - lift(x)).toFixed(1)} `;
  }
  return d + `L${W} ${H} Z`;
}

/** Smooth rolling hill through the given points (Catmull-Rom → cubic Bézier). */
export function hill(points: [number, number][]): string {
  const p = [[points[0][0] - 1, points[0][1]], ...points, [points[points.length - 1][0] + 1, points[points.length - 1][1]]];
  let d = `M${points[0][0]} ${H} L${points[0][0]} ${points[0][1]} `;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    d += `C${(x1 + (x2 - x0) / 6).toFixed(1)} ${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)} ${(y2 - (y3 - y1) / 6).toFixed(1)} ${x2} ${y2} `;
  }
  return d + `L${points[points.length - 1][0]} ${H} Z`;
}

/** Just the top edge of `hill(points)` (an open curve), for rim light along the crest. */
export function hillLine(points: [number, number][]): string {
  const full = hill(points);
  // drop the leading "M x H L x y" drop-down and the trailing "L x H Z"
  const start = full.indexOf("L");
  const body = full.slice(start + 1, full.lastIndexOf("L"));
  return `M${body}`;
}

export interface Puff {
  x: number;
  y: number;
  r: number;
}

/** A cumulus cloud as overlapping puffs; the caller draws shadow + light passes. */
export function cloud(seed: number, cx: number, cy: number, w: number, h: number): Puff[] {
  const r = rng(seed);
  const puffs: Puff[] = [];
  const n = Math.max(5, Math.round(w / 38));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = cx - w / 2 + t * w;
    const bulge = Math.sin(t * Math.PI); // taller in the middle
    const rad = (h * 0.32 + h * 0.5 * bulge) * (0.75 + r() * 0.4);
    puffs.push({ x, y: cy - rad * 0.55 + r() * h * 0.12, r: rad });
  }
  // a few crown puffs on top
  for (let i = 0; i < Math.round(n / 2.5); i++) {
    const x = cx - w * 0.28 + r() * w * 0.56;
    const rad = h * (0.35 + r() * 0.3);
    puffs.push({ x, y: cy - h * 0.55 - r() * h * 0.25, r: rad });
  }
  return puffs;
}

/** A floating island: bumpy grassy top and a jagged rock base tapering to a point. */
export function island(seed: number, cx: number, cy: number, w: number) {
  const r = rng(seed);
  const half = w / 2;
  let top = `M${cx - half} ${cy} `;
  for (let x = -half; x <= half; x += w / 12) {
    top += `L${(cx + x).toFixed(1)} ${(cy - 2 - r() * w * 0.03).toFixed(1)} `;
  }
  top += `L${cx + half} ${cy} `;
  let bottom = "";
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = 1 - (i / n) * 2;
    const depth = w * 0.62 * (1 - Math.abs(t) ** 1.25) * (0.8 + r() * 0.3);
    bottom += `L${(cx + t * half).toFixed(1)} ${(cy + 4 + depth).toFixed(1)} `;
  }
  return { body: top + bottom + "Z", rim: top };
}

/** A tall weathered stone pillar with slightly irregular, tapering sides and a rounded cap. */
export function pillar(seed: number, x: number, top: number, w: number, base = 720): string {
  const r = rng(seed + 50);
  const steps = 8;
  const shoulder = top + w * 0.45;
  const edge = (t: number, side: 1 | -1) => {
    const y = base - t * (base - shoulder);
    const half = ((1 - t * 0.12) * w) / 2;
    return `L${(x + side * half + (r() - 0.5) * 6).toFixed(1)} ${y.toFixed(1)} `;
  };
  let d = `M${x - w / 2} ${base} `;
  for (let i = 0; i <= steps; i++) d += edge(i / steps, -1);
  d += `Q${(x - w * 0.44).toFixed(1)} ${top} ${x} ${top - 2} Q${(x + w * 0.44).toFixed(1)} ${top} ${(x + w * 0.44).toFixed(1)} ${shoulder.toFixed(1)} `;
  for (let i = steps; i >= 0; i--) d += edge(i / steps, 1);
  return d + "Z";
}

/** Round, two-tone tree canopies along a line (painterly cel-shaded look). */
export function trees(seed: number, x0: number, x1: number, yAt: (x: number) => number, count: number, size: number) {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const x = x0 + r() * (x1 - x0);
    const s = size * (0.7 + r() * 0.6);
    return { x, y: yAt(x), s };
  }).sort((a, b) => a.y - b.y);
}
