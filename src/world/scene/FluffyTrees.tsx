import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "../../utils/random";
import { ENV } from "../config";
import type { Placement } from "../scatter";
import { wind } from "./Models";
import { withDetail } from "./structures/detail";
import { toonRamp } from "./Vegetation";
import { withRim, withTranslucency } from "./toonShading";

/**
 * "Fluffy" stylized trees: each canopy is a few overlapping clumps filled with
 * camera-facing leaf-cluster cards. Spherical normals shade the whole canopy as
 * one soft volume, which gives the round, clumpy look of anime open-world trees.
 */

/** Painted cluster of pointed leaves (white; tinted by vertex colour). */
export const leafClumpTexture = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const r = rng(31);
  ctx.translate(64, 64);
  for (let i = 0; i < 24; i++) {
    const a = r() * Math.PI * 2;
    const d = 4 + r() * 34;
    const len = 15 + r() * 14;
    const wdt = len * 0.44;
    const shade = 200 + Math.floor(r() * 55);
    ctx.save();
    ctx.rotate(a);
    ctx.translate(d, 0);
    ctx.rotate(r() * 0.9 - 0.45);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.quadraticCurveTo(0, -wdt, len / 2, 0);
    ctx.quadraticCurveTo(0, wdt, -len / 2, 0);
    ctx.fill();
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

type Clump = [number, number, number, number]; // x, y, z, radius
interface Spec {
  clumps: Clump[];
  count: number;
  size: [number, number];
  dark: string;
  light: string;
  trunk: number;
  branches: number;
}

const ROUND: Clump[] = [
  [0, 5.3, 0, 2.6],
  [1.8, 4.7, 0.6, 1.9],
  [-1.7, 4.8, -0.5, 2.0],
  [0.4, 6.8, -0.4, 1.9],
  [-0.5, 4.5, 1.7, 1.7],
  [0.6, 4.5, -1.8, 1.7],
  [1.3, 6.1, 1.2, 1.5],
];
const TALL: Clump[] = [
  [0, 5.6, 0, 2.0],
  [0.3, 7.2, 0.1, 1.8],
  [-0.2, 8.6, 0, 1.4],
  [0.9, 5.2, 0.7, 1.5],
  [-0.9, 5.4, -0.6, 1.5],
];

const SPECS: Spec[] = [
  { clumps: ROUND, count: 460, size: [1.05, 1.5], ...ENV.palette.treeGreen, trunk: 3.8, branches: 3 },
  { clumps: TALL, count: 370, size: [0.95, 1.35], ...ENV.palette.treeGreenTall, trunk: 4.8, branches: 2 },
  { clumps: ROUND, count: 420, size: [1.05, 1.5], ...ENV.palette.treeGold, trunk: 3.6, branches: 3 },
];

function canopyGeometry(spec: Spec, seed: number) {
  const r = rng(seed * 97);
  const center = new THREE.Vector3();
  let wsum = 0;
  for (const [x, y, z, rad] of spec.clumps) {
    center.add(new THREE.Vector3(x, y, z).multiplyScalar(rad));
    wsum += rad;
  }
  center.divideScalar(wsum);
  const minY = Math.min(...spec.clumps.map((c) => c[1] - c[3]));
  const maxY = Math.max(...spec.clumps.map((c) => c[1] + c[3]));
  const area = spec.clumps.reduce((s, c) => s + c[3] * c[3], 0);
  const dark = new THREE.Color(spec.dark);
  const light = new THREE.Color(spec.light);

  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const corner: number[] = [];
  const size: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const [cx, cy, cz, rad] of spec.clumps) {
    const count = Math.round((spec.count * rad * rad) / area);
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(r() * 2 - 1, r() * 2 - 0.7, r() * 2 - 1).normalize();
      const dist = rad * (0.5 + 0.5 * Math.sqrt(r()));
      p.set(cx, cy, cz).addScaledVector(dir, dist);
      n.copy(p).sub(center).normalize().multiplyScalar(0.6).addScaledVector(dir, 0.4).normalize();
      const t = THREE.MathUtils.clamp((p.y - minY) / (maxY - minY), 0, 1) * 0.5 + Math.max(0, n.y) * 0.3 + (dist / rad) * 0.2;
      c.copy(dark).lerp(light, THREE.MathUtils.clamp(t + (r() - 0.5) * 0.12, 0, 1));
      const s = (spec.size[0] + r() * (spec.size[1] - spec.size[0])) * (0.8 + 0.3 * (dist / rad));
      const a = r() * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const base = pos.length / 3;
      for (const [ux, uy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        pos.push(p.x, p.y, p.z);
        nor.push(n.x, n.y, n.z);
        col.push(c.r, c.g, c.b);
        uv.push((ux + 1) / 2, (uy + 1) / 2);
        corner.push((ux * ca - uy * sa) * 0.5, (ux * sa + uy * ca) * 0.5);
        size.push(s);
      }
      idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aCorner", new THREE.Float32BufferAttribute(corner, 2));
  g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  g.boundingSphere!.radius += 1.5; // billboards extend past their centres
  return g;
}

function trunkGeometry(spec: Spec, seed: number) {
  const r = rng(seed * 13);
  const parts: THREE.BufferGeometry[] = [];
  const h = spec.trunk + 1.2;
  const main = new THREE.CylinderGeometry(0.2, 0.44, h, 8, 4);
  main.translate(0, h / 2 - 0.25, 0);
  const pa = main.attributes.position;
  for (let i = 0; i < pa.count; i++) pa.setX(i, pa.getX(i) + Math.sin(pa.getY(i) * 0.55) * 0.14);
  parts.push(main);
  for (let b = 0; b < spec.branches; b++) {
    const len = 1.5 + r() * 1.1;
    const g = new THREE.CylinderGeometry(0.07, 0.15, len, 6);
    g.translate(0, len / 2, 0);
    g.rotateZ(0.65 + r() * 0.4);
    g.rotateY((b / spec.branches) * Math.PI * 2 + r() * 0.8);
    g.translate(0, spec.trunk * 0.62 + r() * 0.8, 0);
    parts.push(g);
  }
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  return merged;
}

/** Replace the standard projection with a camera-facing expansion of each card. */
const BILLBOARD = /* glsl */ `
vec4 mvPosition = vec4( transformed, 1.0 );
float bbScale = 1.0;
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
bbScale = length( instanceMatrix[0].xyz );
#endif
mvPosition = modelViewMatrix * mvPosition;
mvPosition.xy += aCorner * aSize * bbScale;
gl_Position = projectionMatrix * mvPosition;`;

function leafMaterial() {
  const m = new THREE.MeshToonMaterial({
    vertexColors: true,
    map: leafClumpTexture,
    alphaTest: 0.5,
    gradientMap: toonRamp,
    side: THREE.DoubleSide,
  });
  // a little self-light so the shaded side stays green, never black
  m.emissive = new THREE.Color("#203d1c");
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = wind;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aCorner;\nattribute float aSize;\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
vec4 tPos = instanceMatrix[3];
float sway = max(transformed.y - 2.5, 0.0) * 0.04;
transformed.x += sin(uTime * 1.2 + tPos.x * 0.21 + transformed.y * 0.35) * sway;
transformed.z += cos(uTime * 0.9 + tPos.z * 0.17 + transformed.x * 0.3) * sway * 0.7;
#endif`,
      )
      .replace("#include <project_vertex>", BILLBOARD);
  };
  m.customProgramCacheKey = () => "fluffy-leaves";
  return withTranslucency(withRim(m));
}

function leafDepthMaterial() {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafClumpTexture, alphaTest: 0.5 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aCorner;\nattribute float aSize;")
      .replace("#include <project_vertex>", BILLBOARD);
  };
  m.customProgramCacheKey = () => "fluffy-depth";
  return m;
}

function Instances({ geometry, material, items, cast, receive, depth }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Placement[]; cast: boolean; receive: boolean; depth?: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach((p, i) => {
      q.setFromAxisAngle(up, p.ry);
      m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.s, p.s, p.s));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={cast} receiveShadow={receive} customDepthMaterial={depth} />;
}

/** Broadleaf trees: variant 0 = round, 1 = tall, 2 = golden. (Pines use CC0 models.) */
export function FluffyTrees({ items, shadows }: { items: Placement[]; shadows: boolean }) {
  const parts = useMemo(() => SPECS.map((s, i) => ({ canopy: canopyGeometry(s, i + 1), trunk: trunkGeometry(s, i + 1) })), []);
  const mats = useMemo(
    () => ({
      leaf: leafMaterial(),
      depth: leafDepthMaterial(),
      bark: withDetail(new THREE.MeshToonMaterial({ color: "#6b4a33", gradientMap: toonRamp }), "wood"),
    }),
    [],
  );
  const groups = useMemo(() => [0, 1, 2].map((v) => items.filter((t) => t.variant === v)), [items]);
  return (
    <>
      {parts.map((p, i) => (
        <group key={i}>
          <Instances geometry={p.canopy} material={mats.leaf} items={groups[i]} cast={shadows} receive={false} depth={mats.depth} />
          <Instances geometry={p.trunk} material={mats.bark} items={groups[i]} cast={shadows} receive={shadows} />
        </group>
      ))}
    </>
  );
}
