import { rng } from "../utils/random";
import { PLAY_CENTER } from "./config";
import type { Placement } from "./scatter";
import { terrainHeight } from "./terrain";

/**
 * A ring of flat-topped cliff mesas just outside the walkable valley,
 * overlapping into a rim with a few gaps that open views to the far ranges.
 */
export interface Mesa {
  x: number;
  z: number;
  r: number;
  base: number; // bottom (sunk into the ground)
  top: number; // height of the grassy cap
  seed: number;
}

export const MESAS: Mesa[] = (() => {
  const r = rng(4242);
  const out: Mesa[] = [];
  let a = 0.05;
  while (a < Math.PI * 2 - 0.08) {
    const rad = 15 + r() * 18;
    const dist = 202 + r() * 30;
    const step = (rad * 1.3) / dist;
    if (r() > 0.16) {
      const x = PLAY_CENTER[0] + Math.cos(a) * dist;
      const z = PLAY_CENTER[1] + Math.sin(a) * dist;
      let lo = Infinity;
      let hi = -Infinity;
      for (let k = 0; k < 9; k++) {
        const ang = (k / 8) * Math.PI * 2;
        const d = k === 8 ? 0 : rad;
        const h = terrainHeight(x + Math.cos(ang) * d, z + Math.sin(ang) * d);
        lo = Math.min(lo, h);
        hi = Math.max(hi, h);
      }
      out.push({ x, z, r: rad, base: lo - 5, top: hi + 5 + r() * 14, seed: out.length + 1 });
    }
    a += step;
  }
  return out;
})();

/** A few trees on each mesa top (pines and round broadleaf trees). */
export function mesaTrees(): Placement[] {
  const r = rng(5151);
  const out: Placement[] = [];
  for (const m of MESAS) {
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * m.r * 0.45;
      out.push({ x: m.x + Math.cos(ang) * d, z: m.z + Math.sin(ang) * d, y: m.top + 0.9, s: 1.0 + r() * 0.5, ry: r() * Math.PI * 2, variant: r() < 0.5 ? 3 : r() < 0.85 ? 0 : 2 });
    }
  }
  return out;
}

export const insideMesa = (x: number, z: number) => MESAS.some((m) => Math.hypot(x - m.x, z - m.z) < m.r * 1.05);
