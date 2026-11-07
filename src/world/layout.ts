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

/** CC0 town props (Kenney Fantasy Town Kit): model file, placement, height in metres, collider radius. */
export const PROPS: { model: string; x: number; z: number; yaw: number; height: number; r: number }[] = [
  { model: "fountain-round-detail", x: 3, z: -59, yaw: 0, height: 2.4, r: 3.2 },
  { model: "stall-red", x: -7, z: -58, yaw: 0.9, height: 3.2, r: 1.8 },
  { model: "stall-green", x: 10, z: -62, yaw: -0.8, height: 3.2, r: 1.8 },
  { model: "stall-bench", x: -9.5, z: -61.5, yaw: 0.5, height: 0.9, r: 0 },
  { model: "cart", x: -12, z: -42, yaw: 1.9, height: 1.8, r: 1.4 },
  { model: "cart", x: 20, z: -62, yaw: -2.4, height: 1.8, r: 1.4 },
  { model: "fountain-round-detail", x: 60, z: -82, yaw: 0, height: 2.4, r: 0 },
];

/** Ruins scattered along the way: arches and broken colonnades. */
export const RUINS: { x: number; z: number; yaw: number; kind: "arch" | "colonnade" }[] = [
  { x: -22, z: 24, yaw: 0.8, kind: "arch" },
  { x: -96, z: -44, yaw: 1.4, kind: "colonnade" },
  { x: 84, z: 28, yaw: -0.6, kind: "arch" },
  { x: -104, z: -78, yaw: 0.4, kind: "arch" },
  { x: 22, z: 6, yaw: -0.2, kind: "colonnade" },
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
  // Adventurer's Journal shrine: lectern, stele and its ring of columns
  const ab = L("about");
  add(ab.pos, facing("about"), 0, 0, 1.6);
  add(ab.pos, facing("about"), 0, -2.6, 1.6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    add(ab.pos, facing("about"), Math.cos(a) * 5.4, Math.sin(a) * 5.4, 0.8);
  }
  // Academy: main hall and towers
  const ac = L("skills");
  const ay = facing("skills");
  for (const lx of [-5.5, 0, 5.5]) add(ac.pos, ay, lx, -1, 6.2);
  for (const lx of [-6, -3.6, -1.2, 1.2, 3.6, 6]) add(ac.pos, ay, lx, 6.6, 0.6);
  // Expedition board
  add(L("projects").pos, facing("projects"), 0, 0, 2.7);
  // Hall of Achievements: perimeter columns, pedestal, back wall
  const ha = L("achievements");
  const hy = facing("achievements");
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    add(ha.pos, hy, Math.cos(a) * 6.8, Math.sin(a) * 6.8, 0.75);
  }
  add(ha.pos, hy, 0, 0, 1.8);
  // Beacon tower
  add(L("contact").pos, 0, 0, 0, 4.4);
  // Village
  for (const h of HOUSES) out.push({ x: h.x, z: h.z, r: Math.max(h.w, h.d) * 0.62 });
  out.push({ x: WINDMILL.x, z: WINDMILL.z, r: 2.8 });
  for (const p of PROPS) if (p.r > 0) out.push({ x: p.x, z: p.z, r: p.r });
  for (const r of RUINS) {
    if (r.kind === "arch") {
      add([r.x, r.z], r.yaw, -2.6, 0, 0.9);
      add([r.x, r.z], r.yaw, 2.6, 0, 0.9);
    } else {
      for (const lx of [-4, 0, 4]) add([r.x, r.z], r.yaw, lx, 0, 0.7);
    }
  }
  return out;
}
