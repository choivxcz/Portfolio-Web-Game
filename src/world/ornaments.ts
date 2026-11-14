import { LANDMARKS, PATHS, PATH_WIDTH, type LandmarkId, type Vec2 } from "./config";
import { facing, toWorld } from "./layout";
import type { Collider } from "./scatter";
import { terrainHeight } from "./terrain";

/**
 * Where the decorative structures stand: a waypoint shrine beside each landmark's
 * arrival point, banners flanking the landmarks, and a gate where the main path
 * enters the village. Offsets are in each landmark's frame (+z toward its approach).
 */

/** Banner pairs, as local [x, z] offsets from each landmark's centre. */
const BANNER_SPOTS: Record<LandmarkId, Vec2[]> = {
  about: [[-5.2, 6.6], [5.2, 6.6]],
  skills: [[-9.8, 7.8], [9.8, 7.8]],
  projects: [[-6.6, 2.8], [6.6, 2.8]],
  achievements: [[-4.8, 9.4], [4.8, 9.4]],
  contact: [[-4.4, 7.2], [4.4, 7.2]],
  reviews: [],
};

/** How far to the side of the arrival point the shrine stands (metres). */
const SHRINE_SIDE = 3.8;

/** Distance from a point to the nearest path centreline. */
function pathDistance(x: number, z: number) {
  let best = Infinity;
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, az] = path[i];
      const [bx, bz] = path[i + 1];
      const dx = bx - ax;
      const dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
    }
  }
  return best;
}
/** A shrine needs this much room from a path's centreline (plinth radius + path half-width + a step). */
const PATH_CLEAR = PATH_WIDTH / 2 + 1.5 + 1.2;

export interface Placed {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

/**
 * One shrine per landmark beside its arrival point: off the paths, and on the side
 * closer in height to the arrival point (so none ends up over a cliff edge). If both
 * sides touch a path, it steps further out.
 */
export const SHRINES: (Placed & { id: LandmarkId })[] = LANDMARKS.map((L) => {
  const yaw = facing(L.id);
  const d = Math.hypot(L.approach[0] - L.pos[0], L.approach[1] - L.pos[1]);
  const ay = terrainHeight(L.approach[0], L.approach[1]);
  const options: Vec2[] = [];
  for (const side of [SHRINE_SIDE, SHRINE_SIDE * 1.6, SHRINE_SIDE * 2.2]) {
    for (const s of [side, -side]) options.push(toWorld(L.pos, yaw, s, d));
  }
  const clear = options.filter(([x, z]) => pathDistance(x, z) >= PATH_CLEAR);
  const pool = clear.length ? clear : options;
  const score = ([x, z]: Vec2) => Math.abs(terrainHeight(x, z) - ay) + Math.hypot(x - L.approach[0], z - L.approach[1]) * 0.05;
  const pick = pool.reduce((p, q) => (score(q) < score(p) ? q : p));
  return { id: L.id, x: pick[0], y: terrainHeight(pick[0], pick[1]), z: pick[1], yaw };
});

export const BANNERS: Placed[] = LANDMARKS.flatMap((L) =>
  BANNER_SPOTS[L.id].map(([lx, lz]) => {
    const yaw = facing(L.id);
    const [x, z] = toWorld(L.pos, yaw, lx, lz);
    return { x, y: terrainHeight(x, z), z, yaw };
  }),
);

/**
 * The village gate, across the main path where it enters the village; far enough
 * up the path that the camera arriving at the Expedition Board stays clear of it.
 */
export const GATE = { x: -0.3, z: -17, yaw: 0, span: 6.4 };

/** Collision circles for the shrines, banner poles and gate posts. */
export function ornamentColliders(): Collider[] {
  const out: Collider[] = [];
  for (const s of SHRINES) out.push({ x: s.x, z: s.z, r: 1.3 });
  for (const b of BANNERS) out.push({ x: b.x, z: b.z, r: 0.3 });
  for (const sx of [-1, 1]) out.push({ x: GATE.x + (sx * GATE.span) / 2, z: GATE.z, r: 0.45 });
  return out;
}
