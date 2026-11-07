import { BRIDGE, ISLAND, LAKE, LANDMARKS, PATHS, PATH_WIDTH, PLAY_CENTER, PLAY_RADIUS, STREAM, WATER_LEVEL, WORLD_SIZE, type Vec2 } from "./config";
import { createNoise, fbm, lerp, smoothstep } from "./noise";
import { HOUSES, PROPS, RUINS, WINDMILL } from "./layout";

const nA = createNoise(11);
const nB = createNoise(23);
const nC = createNoise(37);
const nD = createNoise(51);
const nE = createNoise(67);

/* ── Distance helpers ── */
function distToPolyline(px: number, pz: number, pts: Vec2[]): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
    const d = Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
    if (d < best) best = d;
  }
  return best;
}
export function pathDistance(x: number, z: number): number {
  let best = Infinity;
  for (const p of PATHS) best = Math.min(best, distToPolyline(x, z, p));
  return best;
}
export const streamDistance = (x: number, z: number) => distToPolyline(x, z, STREAM);

/* ── Height field ── */
function base(x: number, z: number) {
  const big = fbm(nA, x * 0.0042, z * 0.0042, 4) * 0.5 + 0.5;
  return 3.6 + big * 15;
}
/** Flat-topped plateaus with steep rims — the pale cliff bands seen across Mondstadt. */
const TERRACE = 5;
function terraceFrac(h: number) {
  const t = h / TERRACE;
  return t - Math.floor(t);
}
function terrace(h: number) {
  const t = h / TERRACE;
  return (Math.floor(t) + smoothstep(0.34, 0.66, t - Math.floor(t))) * TERRACE;
}
/** Areas kept smooth: the village, ruins and the stream bank below the Academy (paths are handled separately). */
const SMOOTH_ZONES: [number, number, number][] = [[5, -58, 36], [42, -6, 12], ...RUINS.map((r) => [r.x, r.z, 10] as [number, number, number])];

function detail(x: number, z: number) {
  return fbm(nB, x * 0.02, z * 0.02, 3) * 2.6 + fbm(nC, x * 0.075, z * 0.075, 2) * 0.45;
}
function plateau(d: number, r: number) {
  // flat-topped mesa with a steep rim, like the game's grassy cliffs
  return 1 - smoothstep(r * 1.05, r * 1.75, d);
}
const padHeights = Object.fromEntries(
  LANDMARKS.map((L) => [L.id, base(L.pos[0], L.pos[1]) + L.bump]),
) as Record<string, number>;

export interface Sample {
  h: number;
  path: number; // 0..1 how much this point is on a path
  mountain: number; // 0..1 edge mountains
  water: number; // 0..1 lake/stream influence
  cliff: number; // 0..1 inside a plateau rim
}

/**
 * Level building pads in the village: each house, the fountain, the stalls and the
 * windmill stand on flat ground (at the height the hillside had at their centre),
 * blended smoothly back into the slope around them.
 */
interface Pad {
  x: number;
  z: number;
  r: number;
  h: number;
}
let PADS: Pad[] | null = null;
function buildingPads(): Pad[] {
  if (PADS) return PADS;
  const spots: { x: number; z: number; r: number }[] = [
    ...HOUSES.map((h) => ({ x: h.x, z: h.z, r: Math.hypot(h.w + 0.42, h.d + 0.42) / 2 + 0.8 })),
    { x: WINDMILL.x, z: WINDMILL.z, r: 3.8 },
    ...PROPS.filter((p) => Math.hypot(p.x - ISLAND.x, p.z - ISLAND.z) > ISLAND.r).map((p) => ({
      x: p.x,
      z: p.z,
      r: Math.max(1.4, p.r + 0.9),
    })),
  ];
  PADS = spots.map((s) => ({ ...s, h: sample(s.x, s.z, false).h }));
  return PADS;
}

export function sample(x: number, z: number, pads = true): Sample {
  const smoothH = base(x, z);
  const pd = pathDistance(x, z);
  const path = 1 - smoothstep(PATH_WIDTH * 0.55, PATH_WIDTH * 1.9, pd);
  let keep = 1 - smoothstep(5, 16, pd);
  for (const [zx, zz, zr] of SMOOTH_ZONES) keep = Math.max(keep, 1 - smoothstep(zr * 0.7, zr, Math.hypot(x - zx, z - zz)));
  let h = lerp(terrace(smoothH), smoothH, keep);
  h += detail(x, z) * (1 - path * 0.85) * lerp(0.3, 1, keep);
  const tf = terraceFrac(smoothH);
  const cliff = (1 - keep) * (smoothstep(0.36, 0.5, tf) - smoothstep(0.5, 0.64, tf));

  for (const L of LANDMARKS) {
    const d = Math.hypot(x - L.pos[0], z - L.pos[1]);
    if (L.bump) h += L.bump * plateau(d, L.pad);
    const t = 1 - smoothstep(L.pad * 0.75, L.pad * 1.2, d);
    if (t > 0) h = lerp(h, padHeights[L.id], t);
  }

  if (pads) {
    for (const p of buildingPads()) {
      const d = Math.hypot(x - p.x, z - p.z);
      const t = 1 - smoothstep(p.r, p.r * 1.7 + 1.5, d);
      if (t > 0) h = lerp(h, p.h, t);
    }
  }

  const dc = Math.hypot(x - PLAY_CENTER[0], z - PLAY_CENTER[1]);
  const mountain = smoothstep(PLAY_RADIUS + 4, PLAY_RADIUS + 95, dc);
  if (mountain > 0) {
    // rolling highlands behind the cliff rim (the rim itself is the Cliffs mesh)
    h += mountain * (8 + (fbm(nD, x * 0.006, z * 0.006, 4) * 0.5 + 0.5) * 24);
  }

  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  const lake = 1 - smoothstep(LAKE.r * 0.72, LAKE.r * 1.1, dl);
  h = lerp(h, -4.6, lake);
  const di = Math.hypot(x - ISLAND.x, z - ISLAND.z);
  h = lerp(h, ISLAND.h, 1 - smoothstep(ISLAND.r * 0.82, ISLAND.r * 1.08, di));

  const ds = streamDistance(x, z);
  const stream = 1 - smoothstep(2.2, 6.4, ds);
  const valley = 1 - smoothstep(6, 20, ds);
  h -= valley * Math.max(0, h - 1.4) * 0.45;
  h = lerp(h, -1.5, stream);

  return { h, path, mountain, water: Math.max(lake, stream), cliff };
}

export const terrainHeight = (x: number, z: number) => sample(x, z).h;

/* ── Bridge deck and walkability ── */
const bc = Math.cos(BRIDGE.angle);
const bs = Math.sin(BRIDGE.angle);
const bEndA = terrainHeight(BRIDGE.x - (bc * BRIDGE.length) / 2, BRIDGE.z - (bs * BRIDGE.length) / 2);
const bEndB = terrainHeight(BRIDGE.x + (bc * BRIDGE.length) / 2, BRIDGE.z + (bs * BRIDGE.length) / 2);
export function bridgeDeck(x: number, z: number): number | null {
  const dx = x - BRIDGE.x;
  const dz = z - BRIDGE.z;
  const u = dx * bc + dz * bs;
  const v = -dx * bs + dz * bc;
  if (Math.abs(u) > BRIDGE.length / 2 || Math.abs(v) > BRIDGE.width / 2) return null;
  const t = u / BRIDGE.length + 0.5;
  return lerp(bEndA, bEndB, t) + 1.1 * (1 - (2 * u / BRIDGE.length) ** 2) + 0.15;
}
export const bridgeEnds = { a: bEndA, b: bEndB };

export function groundAt(x: number, z: number): number {
  const h = terrainHeight(x, z);
  const deck = bridgeDeck(x, z);
  return deck !== null ? Math.max(h, deck) : h;
}

export function isWalkable(x: number, z: number): boolean {
  if (Math.hypot(x - PLAY_CENTER[0], z - PLAY_CENTER[1]) > PLAY_RADIUS) return false;
  if (bridgeDeck(x, z) !== null) return true;
  return terrainHeight(x, z) > WATER_LEVEL - 0.3;
}

/* ── Colour palette (sampled from in-game references, tuned) ── */
/** sRGB hex → linear RGB (vertex colours are linear in three.js). */
const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const hex = (h: string) => [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
export const toSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

/* ── Colour palette (sRGB, sampled from in-game references, tuned) ── */
const C = {
  grassA: hex("#70a346"),
  grassB: hex("#8db954"),
  grassDark: hex("#4f8a3d"),
  dirt: hex("#b29b72"),
  sand: hex("#e2d3a3"),
  bed: hex("#9f9c74"),
  rock: hex("#a3adbf"),
  rockDark: hex("#8590a6"),
  cliff: hex("#c3c7cf"),
  cliffDark: hex("#9ba3b3"),
  snow: hex("#f2f5fa"),
  town: hex("#c9c0ae"),
};
const mix3 = (a: number[], b: number[], t: number) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export interface TerrainData {
  n: number; // vertices per side
  heights: Float32Array;
  colors: Float32Array;
  grassMask: Float32Array;
  flowerMask: Float32Array;
}

/** Evaluate the whole grid once: heights, colours, vegetation masks. */
export function buildTerrainData(segments: number): TerrainData {
  const n = segments + 1;
  const step = WORLD_SIZE / segments;
  const heights = new Float32Array(n * n);
  const paths = new Float32Array(n * n);
  const mountains = new Float32Array(n * n);
  const waters = new Float32Array(n * n);
  const cliffs = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const s = sample(-WORLD_SIZE / 2 + i * step, -WORLD_SIZE / 2 + j * step);
      const k = j * n + i;
      heights[k] = s.h;
      paths[k] = s.path;
      mountains[k] = s.mountain;
      waters[k] = s.water;
      cliffs[k] = s.cliff;
    }
  }
  const colors = new Float32Array(n * n * 3);
  const grassMask = new Float32Array(n * n);
  const flowerMask = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const k = j * n + i;
      const x = -WORLD_SIZE / 2 + i * step;
      const z = -WORLD_SIZE / 2 + j * step;
      const h = heights[k];
      const hx = heights[j * n + Math.min(n - 1, i + 1)] - heights[j * n + Math.max(0, i - 1)];
      const hz = heights[Math.min(n - 1, j + 1) * n + i] - heights[Math.max(0, j - 1) * n + i];
      const slope = Math.hypot(hx, hz) / (2 * step); // rise over run
      const tint = fbm(nC, x * 0.03, z * 0.03, 2) * 0.5 + 0.5;
      let c = mix3(C.grassA, C.grassB, tint);
      c = mix3(c, C.grassDark, smoothstep(0.55, 0.9, fbm(nE, x * 0.012, z * 0.012, 2) * 0.5 + 0.5) * 0.25);
      c = mix3(c, C.dirt, smoothstep(0.35, 0.8, paths[k]));
      // bare rock on steep ground, but never on a path (paths in cuttings stay dirt)
      const rockT = Math.max(smoothstep(0.85, 1.35, slope), cliffs[k] * smoothstep(0.45, 0.8, slope)) * (1 - smoothstep(0.2, 0.6, paths[k]));
      c = mix3(c, mix3(C.cliff, C.cliffDark, tint), rockT);
      // plateau tops stay green; only the highest summits turn to bare rock
      c = mix3(c, mix3(C.cliff, C.cliffDark, 0.4), smoothstep(46, 72, h) * smoothstep(0.2, 0.6, mountains[k]) * 0.85);
      const shore = 1 - smoothstep(0.4, 1.6, h);
      c = mix3(c, C.sand, shore * (1 - rockT * 0.6));
      if (h < 0) c = mix3(C.sand, C.bed, smoothstep(0, -3.5, h));
      const town = 1 - smoothstep(ISLAND.r * 0.7, ISLAND.r * 0.85, Math.hypot(x - ISLAND.x, z - ISLAND.z));
      c = mix3(c, C.town, town);
      c = mix3(c, C.snow, smoothstep(88, 96, h));
      colors.set(c, k * 3);

      let g = 1 - smoothstep(0.25, 0.6, paths[k]);
      g *= smoothstep(0.9, 1.6, h);
      g *= 1 - smoothstep(0.8, 1.15, slope);
      g *= 1 - cliffs[k] * smoothstep(0.3, 0.6, slope);
      g *= 1 - smoothstep(0.35, 0.7, mountains[k]);
      g *= 1 - waters[k] * 0.9;
      for (const L of LANDMARKS) {
        const d = Math.hypot(x - L.pos[0], z - L.pos[1]);
        g *= smoothstep(L.pad * 0.45, L.pad * 0.8, d);
        // a clear forecourt where the explorer arrives
        g *= smoothstep(3.5, 7.5, Math.hypot(x - L.approach[0], z - L.approach[1]));
      }
      if (bridgeDeck(x, z) !== null) g = 0;
      if (Math.hypot(x - ISLAND.x, z - ISLAND.z) < ISLAND.r * 0.9) g = 0;
      grassMask[k] = g;
      flowerMask[k] = g * smoothstep(0.15, 0.55, fbm(nA, x * 0.025 + 40, z * 0.025, 2));
    }
  }
  return { n, heights, colors, grassMask, flowerMask };
}

/** Pack heights (16-bit) and masks into an RGBA8 texture for the grass and water shaders. */
export const H_MIN = -12;
export const H_RANGE = 150;
export function packHeightTexture(t: TerrainData): Uint8Array {
  const out = new Uint8Array(t.n * t.n * 4);
  for (let k = 0; k < t.n * t.n; k++) {
    const v = Math.round(Math.min(1, Math.max(0, (t.heights[k] - H_MIN) / H_RANGE)) * 65535);
    out[k * 4] = v >> 8;
    out[k * 4 + 1] = v & 255;
    out[k * 4 + 2] = Math.round(t.grassMask[k] * 255);
    out[k * 4 + 3] = Math.round(t.flowerMask[k] * 255);
  }
  return out;
}

/** Top-down minimap image of the walkable area. */
export function minimapImage(t: TerrainData, size = 256): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(size, size);
  const span = PLAY_RADIUS * 2.3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wx = PLAY_CENTER[0] + (x / size - 0.5) * span;
      const wz = PLAY_CENTER[1] + (y / size - 0.5) * span;
      const i = Math.round(((wx + WORLD_SIZE / 2) / WORLD_SIZE) * (t.n - 1));
      const j = Math.round(((wz + WORLD_SIZE / 2) / WORLD_SIZE) * (t.n - 1));
      const k = Math.max(0, Math.min(t.n - 1, j)) * t.n + Math.max(0, Math.min(t.n - 1, i));
      const h = t.heights[k];
      let [r, g, b] = [toSrgb(t.colors[k * 3]), toSrgb(t.colors[k * 3 + 1]), toSrgb(t.colors[k * 3 + 2])];
      if (h < WATER_LEVEL) [r, g, b] = [0.42, 0.74, 0.86];
      // parchment-tinted, like the in-game map
      const p = (y * size + x) * 4;
      img.data[p] = (r * 0.6 + 0.38) * 255 * 0.86;
      img.data[p + 1] = (g * 0.6 + 0.36) * 255 * 0.86;
      img.data[p + 2] = (b * 0.6 + 0.3) * 255 * 0.86;
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}
export const MINIMAP_SPAN = PLAY_RADIUS * 2.3;
