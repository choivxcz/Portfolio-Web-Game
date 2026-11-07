import { LANDMARKS, PATHS, type LandmarkId } from "./config";
import type { Collider } from "./scatter";

/** Yaw that turns a model's local +z (its front) toward its approach point. */
export function facing(id: LandmarkId): number {
  const L = LANDMARKS.find((l) => l.id === id)!;
  return Math.atan2(L.approach[0] - L.pos[0], L.approach[1] - L.pos[1]);
}

/** Rotate a local offset by yaw and add the origin. */
export function toWorld(origin: [number, number], yaw: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [origin[0] + lx * c + lz * s, origin[1] - lx * s + lz * c];
}

export const HOUSES: { x: number; z: number; yaw: number; roof: "red" | "blue"; w: number; d: number }[] = [
  { x: -16, z: -50, yaw: 0.6, roof: "red", w: 6, d: 5 },
  { x: 16, z: -56, yaw: -0.5, roof: "blue", w: 6.5, d: 5 },
  { x: 12, z: -68, yaw: 0.2, roof: "red", w: 5.5, d: 4.5 },
  { x: -8, z: -68, yaw: -0.3, roof: "blue", w: 6, d: 5 },
  { x: 26, z: -48, yaw: -1.2, roof: "red", w: 5, d: 4.5 },
];
export const WINDMILL = { x: -27, z: -46, yaw: 0.9 };
export const SIGNPOST = { x: 4.2, z: -36, yaw: 0.3 };

/**
 * CC0 town props (Kenney Fantasy Town Kit): model file, placement, height in metres, and
 * collider: radius `r`, stretched along the model's length (local z) by `len` for long props.
 * Footprints measured from the models (the fountain basin is 5 m across).
 */
export const PROPS: { model: string; x: number; z: number; yaw: number; height: number; r: number; len?: number }[] = [
  { model: "fountain-round-detail", x: 3, z: -59, yaw: 0, height: 2.4, r: 4.7 },
  { model: "stall-red", x: -7, z: -58, yaw: 0.9, height: 3.2, r: 1.5 },
  { model: "stall-green", x: 10, z: -62, yaw: -0.8, height: 3.2, r: 1.5 },
  { model: "stall-bench", x: -9.5, z: -61.5, yaw: 0.5, height: 0.9, r: 0.5, len: 1.4 },
  { model: "cart", x: -12, z: -42, yaw: 1.9, height: 1.8, r: 1.3, len: 1.0 },
  { model: "cart", x: 20, z: -62, yaw: -2.4, height: 1.8, r: 1.3, len: 1.0 },
  { model: "fountain-round-detail", x: 60, z: -82, yaw: 0, height: 2.4, r: 0 },
];

/** Small groves of trees in the open meadows (centres; see scatterTrees). */
export const GROVES: { x: number; z: number }[] = [
  { x: -22, z: 24 },
  { x: -96, z: -44 },
  { x: 84, z: 28 },
  { x: -104, z: -78 },
  { x: 22, z: 6 },
];

/** Lanterns every ~16 m along the main paths. */
export const LANTERNS: { x: number; z: number; yaw: number }[] = (() => {
  const out: { x: number; z: number; yaw: number }[] = [];
  for (const path of [PATHS[0], PATHS[3], PATHS[1]]) {
    let carry = 8;
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, az] = path[i];
      const [bx, bz] = path[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const nx = (bz - az) / len;
      const nz = -(bx - ax) / len;
      for (let d = carry; d < len; d += 16) {
        const t = d / len;
        out.push({ x: ax + (bx - ax) * t + nx * 2.6, z: az + (bz - az) * t + nz * 2.6, yaw: Math.atan2(-nx, -nz) });
      }
      carry = 16 - ((len - carry) % 16);
    }
  }
  return out;
})();

/** Collision circles for every structure. */
export function structureColliders(): Collider[] {
  const out: Collider[] = [];
  const L = (id: LandmarkId) => LANDMARKS.find((l) => l.id === id)!;
  const add = (o: [number, number], yaw: number, lx: number, lz: number, r: number) => {
    const [x, z] = toWorld(o, yaw, lx, lz);
    out.push({ x, z, r });
  };
  /** A solid rectangle (local centre cx, cz; size w × d), outlined with small overlapping circles. */
  const box = (o: [number, number], yaw: number, cx: number, cz: number, w: number, d: number) => {
    const r = Math.min(0.7, Math.min(w, d) / 2);
    const nx = Math.max(1, Math.ceil((w - 2 * r) / r));
    const nz = Math.max(1, Math.ceil((d - 2 * r) / r));
    for (let i = 0; i <= nx; i++) {
      const lx = cx - w / 2 + r + ((w - 2 * r) * i) / nx;
      add(o, yaw, lx, cz - d / 2 + r, r);
      add(o, yaw, lx, cz + d / 2 - r, r);
    }
    for (let j = 1; j < nz; j++) {
      const lz = cz - d / 2 + r + ((d - 2 * r) * j) / nz;
      add(o, yaw, cx - w / 2 + r, lz, r);
      add(o, yaw, cx + w / 2 - r, lz, r);
    }
  };
  // Adventurer's Journal shrine: lectern, stele and its ring of columns
  const ab = L("about");
  add(ab.pos, facing("about"), 0, 0, 1.6);
  add(ab.pos, facing("about"), 0, -2.6, 1.6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    add(ab.pos, facing("about"), Math.cos(a) * 5.4, Math.sin(a) * 5.4, 0.8);
  }
  for (const lx of [-3.4, 3.4]) add(ab.pos, facing("about"), lx, 3.2, 0.3); // lanterns
  // Academy: main hall and towers
  const ac = L("skills");
  const ay = facing("skills");
  box(ac.pos, ay, 0, -1, 16, 12); // the hall's walls
  for (const lx of [-5.5, 0, 5.5]) add(ac.pos, ay, lx, -1, 5.4); // and its inside
  for (const lx of [-8.4, 8.4]) add(ac.pos, ay, lx, -6.6, 1.8); // corner turrets
  for (const lx of [-6, -3.6, -1.2, 1.2, 3.6, 6]) add(ac.pos, ay, lx, 6.6, 0.6);
  // Expedition board: the board itself, its lantern, crates and barrel
  const ex = L("projects");
  const ey = facing("projects");
  box(ex.pos, ey, 0, 0, 5.4, 0.5);
  add(ex.pos, ey, 3.2, 0.6, 0.3);
  add(ex.pos, ey, -3.5, 1.15, 0.75);
  add(ex.pos, ey, -4.6, 0.2, 0.5);
  // Hall of Achievements: perimeter columns, pedestal, back wall
  const ha = L("achievements");
  const hy = facing("achievements");
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    add(ha.pos, hy, Math.cos(a) * 6.8, Math.sin(a) * 6.8, 0.75);
  }
  add(ha.pos, hy, 0, 0, 1.8);
  box(ha.pos, hy, 0, -7.4, 11.9, 0.9); // back wall
  for (const lx of [-2.2, 2.2]) add(ha.pos, hy, lx, 8, 0.65); // the arch's two piers
  // Beacon tower
  add(L("contact").pos, 0, 0, 0, 4.4);
  // Traveler's Guestbook: lectern, mailbox and bench
  const gb = L("reviews");
  const gy = facing("reviews");
  add(gb.pos, gy, 0, 0, 1.3);
  add(gb.pos, gy, 2.3, 0.4, 0.5);
  add(gb.pos, gy, -2.6, -0.6, 0.9);
  add(gb.pos, gy, 1.6, 1.5, 0.3); // lantern
  // Village
  for (const h of HOUSES) out.push({ x: h.x, z: h.z, r: Math.max(h.w, h.d) * 0.62 });
  out.push({ x: WINDMILL.x, z: WINDMILL.z, r: 2.8 });
  for (const p of PROPS) {
    if (p.r <= 0) continue;
    const n = p.len ? Math.ceil(p.len / (p.r * 0.7)) : 0;
    for (let i = -n; i <= n; i++) add([p.x, p.z], p.yaw, 0, n ? (p.len! * i) / n : 0, p.r);
  }
  // signpost and the lanterns along the paths
  out.push({ x: SIGNPOST.x, z: SIGNPOST.z, r: 0.3 });
  for (const l of LANTERNS) out.push({ x: l.x, z: l.z, r: 0.25 });
  return out;
}
