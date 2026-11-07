import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "../../utils/random";
import { createNoise } from "../noise";
import type { Placement } from "../scatter";
import { withRim } from "./toonShading";

const noise = createNoise(19);

/** Soft 4-step ramp for anime-style toon lighting. */
export const toonRamp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([150, 196, 234, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

function paint(g: THREE.BufferGeometry, dark: THREE.Color, light: THREE.Color) {
  g.computeBoundingBox();
  const { min, max } = g.boundingBox!;
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - min.y) / (max.y - min.y);
    c.copy(dark).lerp(light, Math.min(1, t * 0.75 + Math.max(0, nor.getY(i)) * 0.35));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
}

function blobCanopy(seed: number, blobs: [number, number, number, number][], wobble: number) {
  const r = rng(seed);
  const parts = blobs.map(([x, y, z, rad]) => {
    const g = new THREE.IcosahedronGeometry(rad * (0.92 + r() * 0.16), 2);
    g.translate(x, y, z);
    return g;
  });
  let g = mergeGeometries(parts)!;
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    const n = noise(v.x * 0.9 + seed, v.y * 0.9 + v.z * 0.7) * wobble;
    v.multiplyScalar(1 + n / Math.max(1, v.length()));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function pineCanopy() {
  const parts = [0, 1, 2, 3].map((i) => {
    const g = new THREE.ConeGeometry(2.3 - i * 0.45, 2.8, 9, 1);
    g.translate(0, 3 + i * 1.55, 0);
    return g;
  });
  let g = mergeGeometries(parts)!;
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  g = mergeVertices(g);
  g.computeVertexNormals();
  return g;
}

function trunk(height: number) {
  const g = new THREE.CylinderGeometry(0.2, 0.42, height, 7, 3);
  g.translate(0, height / 2 - 0.1, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + Math.sin(p.getY(i) * 0.6) * 0.12);
  g.computeVertexNormals();
  return g;
}

/** Painted leaf-cluster texture (white, tinted per vertex); alpha-tested on cards. */
const leafTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const r = rng(12);
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 46;
    const shade = 200 + Math.floor(r() * 55);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.ellipse(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 10 + r() * 6, 5 + r() * 3, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const leafDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.45 });

type Blobs = [number, number, number, number][];

/** Leaf cards scattered over blob surfaces, with spherical normals for soft, volumetric shading. */
function cardCanopy(seed: number, blobs: Blobs, cards: number) {
  const r = rng(seed + 100);
  const center = new THREE.Vector3();
  blobs.forEach(([x, y, z]) => center.add(new THREE.Vector3(x, y, z)));
  center.divideScalar(blobs.length);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const q = new THREE.Quaternion();
  for (let i = 0; i < cards; i++) {
    const [bx, by, bz, rad] = blobs[i % blobs.length];
    const dir = new THREE.Vector3(r() * 2 - 1, r() * 2 - 0.6, r() * 2 - 1).normalize();
    const p = new THREE.Vector3(bx, by, bz).addScaledVector(dir, rad * (0.7 + r() * 0.3));
    const n = p.clone().sub(center).normalize();
    const size = 1.5 + r() * 0.9;
    q.setFromAxisAngle(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), r() * Math.PI);
    const base = pos.length / 3;
    for (const [cx, cy] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
      const v = new THREE.Vector3(cx * size, cy * size, 0).applyQuaternion(q).add(p);
      pos.push(v.x, v.y, v.z);
      nor.push(n.x, n.y, n.z);
      uv.push(cx + 0.5, cy + 0.5);
    }
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

const ROUND: Blobs = [[0, 4.6, 0, 2.3], [1.4, 4.1, 0.5, 1.6], [-1.3, 4.2, -0.4, 1.7], [0.3, 5.7, -0.6, 1.5], [-0.4, 4.0, 1.3, 1.4]];
const TALL: Blobs = [[0, 5.2, 0, 1.9], [0.3, 6.6, 0.2, 1.6], [-0.4, 4.4, -0.3, 1.6], [0.6, 4.6, 0.7, 1.3], [0, 7.6, 0, 1.1]];
const AUTUMN: Blobs = [[0, 4.5, 0, 2.1], [1.2, 4.0, 0.6, 1.5], [-1.1, 4.1, -0.5, 1.6], [0.2, 5.5, -0.4, 1.4]];
const shrink = (b: Blobs, k: number): Blobs => b.map(([x, y, z, rr]) => [x, y, z, rr * k]);

const KINDS: { blobs?: Blobs; seed: number; dark: string; light: string; trunk: number }[] = [
  { blobs: ROUND, seed: 1, dark: "#3a7a3c", light: "#a2d65c", trunk: 4.2 },
  { blobs: TALL, seed: 2, dark: "#33703f", light: "#8fcc5e", trunk: 5 },
  { blobs: AUTUMN, seed: 3, dark: "#c25a26", light: "#ffc25a", trunk: 4 },
  { seed: 4, dark: "#2c5f48", light: "#5e9a5f", trunk: 3.4 }, // pine
];

function useWindMaterial(leaves: boolean) {
  return useMemo(() => {
    const m = new THREE.MeshToonMaterial({
      vertexColors: true,
      gradientMap: toonRamp,
      ...(leaves ? { map: leafTex, alphaTest: 0.45, side: THREE.DoubleSide } : {}),
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime;").replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
vec4 ip = instanceMatrix[3];
float hgt = max(transformed.y - 2.5, 0.0) / 4.0;
transformed.x += sin(uTime * 1.2 + ip.x * 0.3 + ip.z * 0.2) * 0.12 * hgt;
transformed.z += cos(uTime * 0.9 + ip.x * 0.2) * 0.08 * hgt;
#endif`,
      );
      m.userData.shader = shader;
    };
    return leaves ? withRim(m) : m;
  }, [leaves]);
}

function Instanced({ geometry, material, items, shadows, depth }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Placement[]; shadows: boolean; depth?: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    items.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.ry);
      m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.s, p.s, p.s));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={shadows} receiveShadow={shadows} customDepthMaterial={depth} />;
}

export function Trees({ items, shadows, animate }: { items: Placement[]; shadows: boolean; animate: boolean }) {
  const parts = useMemo(
    () =>
      KINDS.map((k) => {
        const core = k.blobs ? blobCanopy(k.seed, shrink(k.blobs, 0.72), 0.25) : pineCanopy();
        paint(core, new THREE.Color(k.dark).multiplyScalar(k.blobs ? 0.8 : 1), new THREE.Color(k.blobs ? k.dark : k.light));
        let cards: THREE.BufferGeometry | null = null;
        if (k.blobs) {
          cards = cardCanopy(k.seed, k.blobs, 70);
          paint(cards, new THREE.Color(k.dark), new THREE.Color(k.light));
        }
        return { core, cards, trunk: trunk(k.trunk) };
      }),
    [],
  );
  const solid = useWindMaterial(false);
  const leaves = useWindMaterial(true);
  const bark = useMemo(() => new THREE.MeshToonMaterial({ color: "#7a5a3e", gradientMap: toonRamp }), []);
  useFrame((_, dt) => {
    if (!animate) return;
    for (const m of [solid, leaves]) if (m.userData.shader) m.userData.shader.uniforms.uTime.value += dt;
  });
  return (
    <>
      {parts.map((p, kind) => {
        const list = items.filter((t) => t.variant === kind);
        return (
          <group key={kind}>
            <Instanced geometry={p.core} material={solid} items={list} shadows={shadows} />
            {p.cards && <Instanced geometry={p.cards} material={leaves} items={list} shadows={shadows} depth={leafDepth} />}
            <Instanced geometry={p.trunk} material={bark} items={list} shadows={shadows} />
          </group>
        );
      })}
    </>
  );
}

function rockGeometry(seed: number, squash: number) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 2);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    v.multiplyScalar(1 + noise(v.x * 1.3 + seed, v.z * 1.3 + v.y) * 0.32);
    v.y *= squash;
    if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const col = new Float32Array(p.count * 3);
  const nor = g.attributes.normal;
  const stone = new THREE.Color("#a9b3c6");
  const deep = new THREE.Color("#8994ab");
  const moss = new THREE.Color("#86b153");
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    c.copy(deep).lerp(stone, Math.min(1, (p.getY(i) + 0.3) * 0.9));
    if (nor.getY(i) > 0.72) c.lerp(moss, 0.75);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

export function Rocks({ items, shadows }: { items: Placement[]; shadows: boolean }) {
  const geos = useMemo(() => [rockGeometry(1, 0.7), rockGeometry(5, 0.9), rockGeometry(9, 1.15)], []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }), []);
  return (
    <>
      {geos.map((g, v) => (
        <Instanced key={v} geometry={g} material={material} items={items.filter((r) => r.variant === v)} shadows={shadows} />
      ))}
    </>
  );
}
