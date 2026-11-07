import { rng } from "../utils/random";
import { LANDMARKS, PLAY_CENTER, PLAY_RADIUS, WORLD_SIZE } from "./config";
import { GROVES } from "./layout";
import { createNoise, fbm } from "./noise";
import type { TerrainData } from "./terrain";

export interface Placement {
  x: number;
  y: number;
  z: number;
  s: number; // scale
  ry: number; // rotation around Y
  variant: number;
}
export interface Collider {
  x: number;
  z: number;
  r: number;
}

/** Bilinear lookup into the precomputed terrain grid (much faster than re-sampling noise). */
export function gridSample(t: TerrainData, x: number, z: number) {
  const g = (v: number) => ((v + WORLD_SIZE / 2) / WORLD_SIZE) * (t.n - 1);
  const gx = Math.min(t.n - 1.001, Math.max(0, g(x)));
  const gz = Math.min(t.n - 1.001, Math.max(0, g(z)));
  const i = Math.floor(gx);
  const j = Math.floor(gz);
  const fx = gx - i;
  const fz = gz - j;
  const k = j * t.n + i;
  const bl = (arr: Float32Array) =>
    (arr[k] * (1 - fx) + arr[k + 1] * fx) * (1 - fz) + (arr[k + t.n] * (1 - fx) + arr[k + t.n + 1] * fx) * fz;
  return { h: bl(t.heights), grass: bl(t.grassMask) };
}

const forestNoise = createNoise(91);
const TREE_KINDS = { round: 0, tall: 1, autumn: 2, pine: 3 } as const;

function spaced(list: { x: number; z: number }[], x: number, z: number, min: number) {
  for (const p of list) if ((p.x - x) ** 2 + (p.z - z) ** 2 < min * min) return false;
  return true;
}

export function scatterTrees(t: TerrainData, count: number): Placement[] {
  const r = rng(404);
  const out: Placement[] = [];
  // small groves first (a mix of round, tall and autumn trees), so the scattered trees space around them
  const g = rng(707);
  for (const grove of GROVES) {
    const n = 4 + Math.floor(g() * 2);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + g() * 0.8;
      const d = i === 0 ? 0 : 4.2 + g() * 1.8;
      const x = grove.x + Math.cos(ang) * d;
      const z = grove.z + Math.sin(ang) * d;
      const variant = [TREE_KINDS.round, TREE_KINDS.tall, TREE_KINDS.autumn, TREE_KINDS.round, TREE_KINDS.tall][i % 5];
      out.push({ x, y: gridSample(t, x, z).h - 0.2, z, s: (i === 0 ? 1.25 : 0.9) + g() * 0.35, ry: g() * Math.PI * 2, variant });
    }
  }
  for (let a = 0; a < count * 30 && out.length < count; a++) {
    const ang = r() * Math.PI * 2;
    const dist = Math.sqrt(r()) * (PLAY_RADIUS + 40);
    const x = PLAY_CENTER[0] + Math.cos(ang) * dist;
    const z = PLAY_CENTER[1] + Math.sin(ang) * dist;
    const { h, grass } = gridSample(t, x, z);
    const forest = fbm(forestNoise, x * 0.013, z * 0.013, 3);
    let variant: number;
    if (dist > PLAY_RADIUS - 18) {
      if (h > 46 || h < 2) continue;
      variant = TREE_KINDS.pine;
    } else {
      if (grass < 0.6 || forest < 0.02) continue;
      variant = r() < 0.12 ? TREE_KINDS.autumn : r() < 0.4 ? TREE_KINDS.tall : r() < 0.82 ? TREE_KINDS.round : TREE_KINDS.pine;
    }
    if (LANDMARKS.some((L) => Math.hypot(x - L.approach[0], z - L.approach[1]) < 11 || Math.hypot(x - L.pos[0], z - L.pos[1]) < L.pad + 5)) continue;
    if (!spaced(out, x, z, variant === TREE_KINDS.pine ? 3.2 : 4.6)) continue;
    out.push({ x, y: h - 0.2, z, s: 0.85 + r() * 0.55, ry: r() * Math.PI * 2, variant });
  }
  // hero trees that frame the opening view and the village approach
  const HERO: [number, number, number, number][] = [[-13, 33, 1.5, 0], [15, 27, 1.35, 2], [-17, 4, 1.3, 1], [19, -14, 1.4, 0], [-24, -24, 1.25, 2]];
  for (const [x, z, s, variant] of HERO) out.push({ x, y: gridSample(t, x, z).h - 0.2, z, s, ry: x * 0.7, variant });
  return out;
}

/** Lowest ground height within `rad` of (x, z). */
function lowestGround(t: TerrainData, x: number, z: number, rad: number) {
  let lo = Infinity;
  for (let a = 0; a < 16; a++) {
    for (const f of [0.5, 1]) lo = Math.min(lo, gridSample(t, x + Math.cos(a) * rad * f, z + Math.sin(a) * rad * f).h);
  }
  return lo;
}

/** Fixed cliff formations that frame the landmarks, plus scattered boulders. */
export function scatterRocks(t: TerrainData, count: number): Placement[] {
  const r = rng(808);
  const out: Placement[] = [];
  const cliffs: [number, number, number][] = [
    [-66, -2, 9], [-60, -26, 7], [-34, -28, 6], // around the journal hill
    [112, -110, 9], [104, -122, 7], [86, -116, 6], // beacon cliff
    [-80, -110, 8], [-44, -112, 6], // behind the hall
    [96, 2, 6], [30, 70, 5], [-40, 60, 6], // first one frames the Academy from behind
  ];
  for (const [x, z, s] of cliffs) {
    out.push({ x, y: gridSample(t, x, z).h - s * 0.35, z, s, ry: r() * Math.PI * 2, variant: 2 });
  }
  for (let a = 0; a < count * 20 && out.length < count; a++) {
    const ang = r() * Math.PI * 2;
    const dist = Math.sqrt(r()) * PLAY_RADIUS;
    const x = PLAY_CENTER[0] + Math.cos(ang) * dist;
    const z = PLAY_CENTER[1] + Math.sin(ang) * dist;
    const { h, grass } = gridSample(t, x, z);
    if (h < 0.6 || grass < 0.3) continue;
    if (LANDMARKS.some((L) => Math.hypot(x - L.pos[0], z - L.pos[1]) < L.pad + 3 || Math.hypot(x - L.approach[0], z - L.approach[1]) < 12)) continue;
    if (!spaced(out, x, z, 5)) continue;
    const s = r() < 0.15 ? 1.6 + r() * 1.4 : 0.35 + r() * 0.7;
    const y = h - s * 0.25;
    const ry = r() * Math.PI * 2;
    const variant = r() < 0.5 ? 0 : 1;
    // skip rocks perched on a slope or bank edge, where part of them would hang in the air
    if (y - lowestGround(t, x, z, s * 1.1) > 0.5) continue;
    out.push({ x, y, z, s, ry, variant });
  }
  return out;
}

/** Bushes and ferns near trees, flower clumps in open meadows. */
export function scatterPlants(t: TerrainData, trees: Placement[], density: number) {
  const r = rng(1212);
  const ok = (x: number, z: number) =>
    gridSample(t, x, z).grass > 0.55 && !LANDMARKS.some((L) => Math.hypot(x - L.approach[0], z - L.approach[1]) < 7);
  const near = (count: number, min: number, max: number, scale: [number, number]) => {
    const out: Placement[] = [];
    for (let a = 0; a < count * 6 && out.length < count && trees.length; a++) {
      const tr = trees[Math.floor(r() * trees.length)];
      const ang = r() * Math.PI * 2;
      const d = min + r() * (max - min);
      const x = tr.x + Math.cos(ang) * d;
      const z = tr.z + Math.sin(ang) * d;
      if (!ok(x, z)) continue;
      out.push({ x, z, y: gridSample(t, x, z).h - 0.05, s: scale[0] + r() * (scale[1] - scale[0]), ry: r() * Math.PI * 2, variant: 0 });
    }
    return out;
  };
  const flowers: Placement[] = [];
  const target = Math.round(160 * density);
  for (let a = 0; a < target * 10 && flowers.length < target; a++) {
    const ang = r() * Math.PI * 2;
    const dist = Math.sqrt(r()) * (PLAY_RADIUS - 10);
    const x = PLAY_CENTER[0] + Math.cos(ang) * dist;
    const z = PLAY_CENTER[1] + Math.sin(ang) * dist;
    if (!ok(x, z) || fbm(forestNoise, x * 0.03 + 9, z * 0.03, 2) < 0.1) continue;
    flowers.push({ x, z, y: gridSample(t, x, z).h - 0.03, s: 0.8 + r() * 0.6, ry: r() * Math.PI * 2, variant: 0 });
  }
  return {
    bushes: near(Math.round(110 * density), 2.2, 4.5, [0.8, 1.4]),
    ferns: near(Math.round(120 * density), 1.4, 3.2, [0.8, 1.3]),
    flowers,
  };
}

export function collidersFor(trees: Placement[], rocks: Placement[]): Collider[] {
  return [
    ...trees.map((p) => ({ x: p.x, z: p.z, r: 0.7 * p.s })),
    ...rocks.filter((p) => p.s > 0.9).map((p) => ({ x: p.x, z: p.z, r: p.s * (p.variant === 2 ? 1.05 : 0.85) })),
  ];
}
