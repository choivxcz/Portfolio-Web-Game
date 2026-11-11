import * as THREE from "three";
import { HERO } from "../config";
import { attachOutline, outlineMaterial } from "./outline";
import { withRim } from "./toonShading";

/**
 * An original anime-style hero, modelled in code on top of the CC0 KayKit rig so it
 * reuses that rig's animations (see public/models/CREDITS.md).
 *
 * The rig has chibi proportions (big head, short legs). `buildHero` lengthens its
 * bones to adult anime proportions (about 7 heads tall), removes the KayKit meshes
 * and attaches rigid, cel-shaded body parts to the bones: face, hair, jacket, a
 * half cape, gloves and boots. `heroClips` adapts the animations to the new bones.
 */

const bone = (name: string) => THREE.PropertyBinding.sanitizeNodeName(name);

/** Rest offsets (bone-local, metres before the final height fit) for adult proportions. */
const BUILD: Record<string, [number, number, number]> = {
  hips: [0, 0.86, 0],
  spine: [0, 0.12, 0],
  chest: [0, 0.24, 0],
  head: [0, 0.27, 0],
  "upperarm.l": [0.165, 0.2, 0],
  "upperarm.r": [-0.165, 0.2, 0],
  "lowerarm.l": [0, 0.28, 0],
  "lowerarm.r": [0, 0.28, 0],
  "wrist.l": [0, 0.25, 0],
  "wrist.r": [0, 0.25, 0],
  "upperleg.l": [0.095, 0.06, 0],
  "upperleg.r": [-0.095, 0.06, 0],
  "lowerleg.l": [0, 0.43, 0],
  "lowerleg.r": [0, 0.43, 0],
  "foot.l": [0, 0.42, 0],
  "foot.r": [0, 0.42, 0],
  "toes.l": [0, 0.13, 0],
  "toes.r": [0, 0.13, 0],
};
/** KayKit rest values the animations were authored for. */
const RIG_HIPS_Y = 0.4056634306907654;
const RIG_LEG = 0.22707749903202057 + 0.14943702518939972;
const LEG_RATIO = (BUILD["lowerleg.l"][1] + BUILD["foot.l"][1]) / RIG_LEG;

/**
 * Adapt KayKit clips to the hero's bones: drop per-bone position keys (they would
 * pin the old bone lengths), and scale the hips' motion to the longer legs so the
 * feet still meet the ground.
 */
export function heroClips(clips: THREE.AnimationClip[]): THREE.AnimationClip[] {
  const hipsTrack = `${bone("hips")}.position`;
  const keep = new Set([hipsTrack, `${bone("root")}.position`]);
  return clips.map((src) => {
    const clip = src.clone();
    clip.tracks = clip.tracks.filter((t) => !t.name.endsWith(".position") || keep.has(t.name));
    const hips = clip.tracks.find((t) => t.name === hipsTrack);
    if (hips) {
      const v = hips.values;
      for (let i = 0; i < v.length; i += 3) {
        v[i] *= LEG_RATIO;
        v[i + 1] = BUILD.hips[1] + (v[i + 1] - RIG_HIPS_Y) * LEG_RATIO;
        v[i + 2] *= LEG_RATIO;
      }
    }
    return clip;
  });
}

/* ── geometry helpers ── */

/** Solid of revolution from [radius, y] pairs (radius first, like a lathe profile). */
function lathe(profile: [number, number][], segments = 14, phiStart = 0, phiLength = Math.PI * 2) {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)),
    segments,
    phiStart,
    phiLength,
  );
}

/** Tapered capsule along +y from 0 to `len` (rounded past both joints so limbs blend). */
function limb(len: number, r0: number, r1: number) {
  const pts: [number, number][] = [];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * (Math.PI / 2);
    pts.push([Math.cos(a) * r0, Math.sin(a) * r0]);
  }
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push([Math.cos(a) * r1, len + Math.sin(a) * r1]);
  }
  return lathe(pts, 12);
}

const HEAD_R = 0.115;

/** Anime head shape: a rounded cranium narrowing to a small, pointed chin. */
function shapeHead(g: THREE.BufferGeometry) {
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const t = THREE.MathUtils.clamp(-v.y / HEAD_R, 0, 1);
    v.x *= 1 - 0.34 * t * t;
    v.z *= 1 - 0.12 * t;
    v.y *= 1 + 0.16 * t;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Point on the (unshaped) head sphere: theta from the top, phi = PI/2 faces forward (+z). */
function onHead(r: number, theta: number, phi: number) {
  return new THREE.Vector3(-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta));
}

/**
 * One lock of hair: a tapered, slightly flattened tube that follows the head from
 * `t0` to `t1` (polar angle), lifting off to `lift` × head radius at the tip, with
 * the tip flicked sideways by `flick` radians.
 */
function lock(phi: number, t0: number, t1: number, width: number, lift = 1.12, flick = 0) {
  const pts: THREE.Vector3[] = [];
  const steps = 5;
  for (let k = 0; k <= steps; k++) {
    const s = k / steps;
    const r = HEAD_R * THREE.MathUtils.lerp(1.04, lift, s * s);
    pts.push(onHead(r, THREE.MathUtils.lerp(t0, t1, s), phi + flick * s * s));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tub = 10;
  const rad = 6;
  const g = new THREE.TubeGeometry(curve, tub, width, rad, false);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const c = new THREE.Vector3();
  const out = new THREE.Vector3();
  for (let i = 0; i <= tub; i++) {
    curve.getPointAt(i / tub, c);
    out.copy(c).normalize();
    const taper = Math.max(0.03, Math.pow(1 - i / tub, 0.75));
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      v.fromBufferAttribute(p, k).sub(c);
      // flatten against the head so locks read as ribbons, not noodles
      const along = v.dot(out);
      v.addScaledVector(out, -along * 0.55).multiplyScalar(taper);
      p.setXYZ(k, c.x + v.x, c.y + v.y, c.z + v.z);
    }
  }
  g.computeVertexNormals();
  return g;
}

/* ── face ── */

/** Large anime eyes, brows, a small mouth and a soft blush, painted once. */
function faceTexture() {
  const W = 512;
  const H = 448;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  const col = HERO.colors;
  const eye = (cx: number, cy: number, dir: 1 | -1) => {
    const w = 46;
    const h = 40;
    // sclera
    x.save();
    x.beginPath();
    x.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
    x.clip();
    x.fillStyle = "#fffaf6";
    x.fillRect(cx - w, cy - h, w * 2, h * 2);
    // iris: dark at the top, bright toward the bottom
    const g = x.createLinearGradient(0, cy - 34, 0, cy + 34);
    g.addColorStop(0, col.lash);
    g.addColorStop(0.35, col.iris);
    g.addColorStop(1, col.irisLight);
    x.fillStyle = g;
    x.beginPath();
    x.ellipse(cx + dir * 2, cy + 4, 27, 35, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "rgba(20,24,30,0.85)";
    x.beginPath();
    x.ellipse(cx + dir * 2, cy + 6, 11, 16, 0, 0, Math.PI * 2);
    x.fill();
    // highlights
    x.fillStyle = "#ffffff";
    x.beginPath();
    x.ellipse(cx - dir * 9, cy - 10, 8, 10, 0, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.ellipse(cx + dir * 12, cy + 18, 4, 4, 0, 0, Math.PI * 2);
    x.fill();
    // shadow of the upper lid across the top of the eye
    x.fillStyle = "rgba(60,40,60,0.28)";
    x.fillRect(cx - w, cy - h, w * 2, 16);
    x.restore();
    // upper lash line, thick with a flick at the outer corner
    x.strokeStyle = col.lash;
    x.lineCap = "round";
    x.lineWidth = 9;
    x.beginPath();
    x.moveTo(cx - dir * 48, cy - 6);
    x.quadraticCurveTo(cx, cy - 52, cx + dir * 50, cy - 16);
    x.lineTo(cx + dir * 60, cy - 6);
    x.stroke();
    // lower lash: a short, thin line under the outer half
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(cx + dir * 8, cy + 40);
    x.quadraticCurveTo(cx + dir * 30, cy + 38, cx + dir * 42, cy + 24);
    x.stroke();
    // brow
    x.lineWidth = 6;
    x.strokeStyle = col.hair;
    x.beginPath();
    x.moveTo(cx - dir * 34, cy - 70);
    x.quadraticCurveTo(cx + dir * 4, cy - 86, cx + dir * 44, cy - 74);
    x.stroke();
  };
  // character's right eye is on the viewer's left
  eye(160, 195, -1);
  eye(352, 195, 1);
  // blush
  for (const bx of [150, 362]) {
    const g = x.createRadialGradient(bx, 268, 0, bx, 268, 46);
    g.addColorStop(0, "rgba(255,140,140,0.32)");
    g.addColorStop(1, "rgba(255,140,140,0)");
    x.fillStyle = g;
    x.fillRect(bx - 50, 220, 100, 100);
  }
  // mouth: a small, slightly open smile
  x.strokeStyle = "#b0524a";
  x.lineWidth = 5;
  x.lineCap = "round";
  x.beginPath();
  x.moveTo(234, 336);
  x.quadraticCurveTo(256, 350, 278, 334);
  x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ── materials ── */

function toon(color: string, glow = 0.2, side: THREE.Side = THREE.FrontSide) {
  const c = new THREE.Color(color);
  const m = withRim(new THREE.MeshToonMaterial({ color: c, emissive: c.clone().multiplyScalar(glow), side }));
  m.defines = { ...m.defines, TOON_SOFTNESS: "0.02" };
  return m;
}

/** Ink colour for a part: its own colour, darkened and shifted cool. */
function ink(color: string) {
  return new THREE.Color(color).multiplyScalar(0.3).lerp(new THREE.Color("#241c30"), 0.45);
}

export interface Hero {
  /** Outline shells, toggled by the "Character Outlines" setting. */
  shells: THREE.Object3D[];
  /** Pivot of the half cape: rotate on x to lift it behind the hero. */
  cape: THREE.Object3D | null;
}

/** Rebuild a cloned KayKit rig as the hero. `root` must be a private (skinned) clone. */
export function buildHero(root: THREE.Object3D, shadows: boolean): Hero {
  const col = HERO.colors;
  const bones = new Map<string, THREE.Object3D>();
  const old: THREE.Object3D[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.set(o.name, o);
    if ((o as THREE.Mesh).isMesh) old.push(o);
  });
  for (const o of old) o.parent?.remove(o);
  for (const [name, [x, y, z]] of Object.entries(BUILD)) bones.get(bone(name))?.position.set(x, y, z);

  const shells: THREE.Object3D[] = [];
  const mats = new Map<string, THREE.Material>();
  const inks = new Map<string, THREE.Material>();
  const matFor = (color: string, glow?: number, side?: THREE.Side) => {
    const key = `${color}|${glow}|${side}`;
    if (!mats.has(key)) mats.set(key, toon(color, glow, side));
    return mats.get(key)!;
  };
  const inkFor = (color: string) => {
    if (!inks.has(color)) inks.set(color, outlineMaterial(ink(color)));
    return inks.get(color)!;
  };
  /** Attach a part to a bone (or any parent), with an outline unless `bare`. */
  const add = (
    parent: THREE.Object3D | undefined,
    geometry: THREE.BufferGeometry,
    color: string,
    o: { pos?: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number]; glow?: number; side?: THREE.Side; bare?: boolean } = {},
  ) => {
    if (!parent) return null;
    const mesh = new THREE.Mesh(geometry, matFor(color, o.glow, o.side));
    if (o.pos) mesh.position.set(...o.pos);
    if (o.rot) mesh.rotation.set(...o.rot);
    if (o.scale) mesh.scale.set(...o.scale);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (!o.bare) shells.push(attachOutline(mesh, inkFor(color)));
    return mesh;
  };
  const b = (n: string) => bones.get(bone(n));
  const FLAT: [number, number, number] = [1, 1, 0.7]; // torso pieces are wider than deep

  /* torso: pelvis, waist and chest, with a belt and a high collar */
  add(b("hips"), lathe([[0, -0.07], [0.09, -0.05], [0.145, 0.02], [0.14, 0.1], [0.125, 0.16]]), col.pants, { scale: FLAT });
  add(b("spine"), lathe([[0.13, -0.02], [0.118, 0.1], [0.122, 0.2], [0.13, 0.26]]), col.jacket, { scale: FLAT });
  add(b("chest"), lathe([[0.13, -0.04], [0.15, 0.06], [0.17, 0.16], [0.16, 0.22], [0.09, 0.27], [0.05, 0.29]]), col.jacket, { scale: [1, 1, 0.66] });
  // jacket front panel and lapel trim
  add(b("chest"), new THREE.BoxGeometry(0.06, 0.32, 0.02), col.trim, { pos: [0, 0.08, 0.1], bare: true });
  add(b("chest"), lathe([[0.075, 0.2], [0.085, 0.26], [0.09, 0.32]], 16, Math.PI * 0.25, Math.PI * 1.5), col.trim, { side: THREE.DoubleSide, scale: [1, 1, 0.9] });
  add(b("hips"), new THREE.TorusGeometry(0.135, 0.016, 6, 24), col.gold, { pos: [0, 0.13, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 0.7, 1], bare: true });
  add(b("hips"), new THREE.BoxGeometry(0.05, 0.04, 0.02), col.gold, { pos: [0, 0.13, 0.1], bare: true });
  // coat skirt: flares from the belt, open at the front so the legs can stride
  add(
    b("hips"),
    lathe([[0.14, 0.14], [0.17, 0.0], [0.21, -0.16], [0.24, -0.3]], 18, Math.PI * 0.32, Math.PI * 1.36),
    col.jacket,
    { side: THREE.DoubleSide, scale: [1, 1, 0.78] },
  );
  add(
    b("hips"),
    lathe([[0.243, -0.27], [0.245, -0.31]], 18, Math.PI * 0.32, Math.PI * 1.36),
    col.trim,
    { side: THREE.DoubleSide, scale: [1, 1, 0.78], bare: true },
  );

  /* half cape over the left shoulder, on a pivot so it can lift in the wind */
  let cape: THREE.Object3D | null = null;
  const chest = b("chest");
  if (chest) {
    cape = new THREE.Group();
    cape.position.set(0, 0.24, -0.01);
    chest.add(cape);
    add(cape, lathe([[0.15, 0.02], [0.2, -0.2], [0.26, -0.5], [0.3, -0.78]], 18, Math.PI * 0.42, Math.PI * 0.9), col.cape, {
      side: THREE.DoubleSide,
      scale: [1, 1, 0.72],
    });
    add(cape, lathe([[0.298, -0.74], [0.302, -0.79]], 18, Math.PI * 0.42, Math.PI * 0.9), col.gold, { side: THREE.DoubleSide, scale: [1, 1, 0.72], bare: true });
    // clasp at the shoulder
    add(cape, new THREE.SphereGeometry(0.03, 10, 8), col.gold, { pos: [0.13, 0.0, 0.07], bare: true });
  }

  /* arms: sleeves with cream cuffs, dark gloves */
  for (const s of ["l", "r"]) {
    add(b(`upperarm.${s}`), limb(0.28, 0.05, 0.043), col.jacket);
    add(b(`lowerarm.${s}`), limb(0.25, 0.043, 0.033), col.jacket);
    add(b(`lowerarm.${s}`), lathe([[0.046, 0.15], [0.056, 0.2], [0.06, 0.24]], 12), col.trim, { side: THREE.DoubleSide });
    add(b(`hand.${s}`), new THREE.SphereGeometry(0.042, 12, 10), col.under, { pos: [0, 0.035, 0], scale: [0.85, 1.25, 0.6] });
  }
  // shoulder pad on the cape side
  add(b("upperarm.l"), new THREE.SphereGeometry(0.07, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), col.trim, { pos: [0, 0.02, 0], scale: [1.05, 0.8, 1], side: THREE.DoubleSide });

  /* legs: slim trousers into tall boots */
  for (const s of ["l", "r"]) {
    add(b(`upperleg.${s}`), limb(0.43, 0.075, 0.055), col.pants);
    add(b(`lowerleg.${s}`), limb(0.42, 0.054, 0.04), col.pants);
    add(b(`lowerleg.${s}`), lathe([[0.058, 0.12], [0.064, 0.15], [0.052, 0.3], [0.048, 0.44]], 12), col.boots, { side: THREE.DoubleSide });
    add(b(`foot.${s}`), limb(0.14, 0.048, 0.042), col.boots, { scale: [0.9, 1, 0.85] });
  }

  /* neck and head */
  const head = b("head");
  add(head, limb(0.08, 0.042, 0.04), col.skin, { pos: [0, -0.02, 0], glow: 0.32 });
  const skull = add(head, shapeHead(new THREE.SphereGeometry(HEAD_R, 32, 24)), col.skin, {
    pos: [0, 0.16, 0.005],
    scale: [0.93, 1.03, 0.98],
    glow: 0.32,
  });
  if (skull) {
    // the face is painted on a patch that follows the head's shape
    const patch = shapeHead(new THREE.SphereGeometry(HEAD_R * 1.006, 24, 18, Math.PI / 2 - 0.78, 1.56, Math.PI * 0.36, Math.PI * 0.42));
    const face = new THREE.Mesh(
      patch,
      new THREE.MeshBasicMaterial({ map: faceTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    );
    face.renderOrder = 2;
    skull.add(face);
    // ears
    for (const sx of [1, -1]) {
      add(skull, new THREE.SphereGeometry(0.022, 10, 8), col.skin, { pos: [sx * HEAD_R * 0.93, -0.01, -0.005], scale: [0.45, 1, 0.8], glow: 0.32, bare: true });
    }
    /* hair: a cap over the crown and back, then layered locks */
    add(skull, new THREE.SphereGeometry(HEAD_R * 1.06, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.4), col.hair, { side: THREE.DoubleSide, glow: 0.18 });
    add(skull, new THREE.SphereGeometry(HEAD_R * 1.05, 28, 18, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.74), col.hair, {
      side: THREE.DoubleSide,
      glow: 0.18,
    });
    const F = Math.PI / 2; // front
    const locks: [number, number, number, number, number?, number?][] = [
      // bangs over the forehead, ending above the eyes
      [F - 0.55, 0.12, 0.47, 0.024, 1.1, -0.15],
      [F - 0.3, 0.08, 0.5, 0.026, 1.08, -0.08],
      [F - 0.08, 0.06, 0.46, 0.027, 1.1, 0.05],
      [F + 0.16, 0.07, 0.5, 0.026, 1.08, 0.1],
      [F + 0.42, 0.1, 0.48, 0.025, 1.1, 0.16],
      [F + 0.66, 0.16, 0.44, 0.022, 1.12, 0.12],
      // side locks framing the face, down to the jaw
      [F - 0.98, 0.18, 0.78, 0.024, 1.08, 0.12],
      [F + 0.98, 0.18, 0.78, 0.024, 1.08, -0.12],
      [F - 1.25, 0.22, 0.72, 0.026, 1.14, -0.1],
      [F + 1.25, 0.22, 0.72, 0.026, 1.14, 0.1],
      // spiky layers over the back
      [F + Math.PI - 0.9, 0.18, 0.8, 0.03, 1.28, -0.25],
      [F + Math.PI - 0.45, 0.14, 0.86, 0.032, 1.3, -0.12],
      [F + Math.PI, 0.12, 0.9, 0.034, 1.32, 0],
      [F + Math.PI + 0.45, 0.14, 0.86, 0.032, 1.3, 0.12],
      [F + Math.PI + 0.9, 0.18, 0.8, 0.03, 1.28, 0.25],
      // a few strands lifting off the crown
      [F + 0.3, 0.02, 0.24, 0.02, 1.3, 0.5],
      [F + Math.PI - 0.2, 0.02, 0.3, 0.022, 1.36, -0.4],
    ];
    for (const [phi, t0, t1, w, lift, flick] of locks) {
      add(skull, lock(phi, t0 * Math.PI, t1 * Math.PI, w, lift, flick), col.hair, { glow: 0.18 });
    }
    // short tail tied at the nape
    add(skull, lock(F + Math.PI, 0.62 * Math.PI, 0.98 * Math.PI, 0.03, 1.55, 0), col.hair, { glow: 0.18 });
    add(skull, new THREE.TorusGeometry(0.022, 0.008, 6, 14), col.gold, { pos: [0, -0.06, -HEAD_R * 0.98], bare: true });
  }

  return { shells, cape };
}
