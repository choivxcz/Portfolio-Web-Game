import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ENV } from "../config";
import type { Placement } from "../scatter";
import { useWorld } from "../store";
import { addOutlineNormals, outlineMaterial } from "./outline";
import { toonRamp } from "./Vegetation";
import { withRim, withTranslucency } from "./toonShading";

/**
 * CC0 models (see public/models/CREDITS.md), drawn with instancing and
 * converted to toon materials so they match the rest of the world.
 */
const BASE = `${import.meta.env.BASE_URL}models/`;
export const MODELS = {
  pineA: `${BASE}nature/Pine_1.gltf`,
  pineB: `${BASE}nature/Pine_3.gltf`,
  rock1: `${BASE}nature/Rock_Medium_1.gltf`,
  rock2: `${BASE}nature/Rock_Medium_2.gltf`,
  rock3: `${BASE}nature/Rock_Medium_3.gltf`,
  bush: `${BASE}nature/Bush_Common.gltf`,
  bushFlowers: `${BASE}nature/Bush_Common_Flowers.gltf`,
  fern: `${BASE}nature/Fern_1.gltf`,
  flowersA: `${BASE}nature/Flower_3_Group.gltf`,
  flowersB: `${BASE}nature/Flower_4_Group.gltf`,
  plant: `${BASE}nature/Plant_7_Big.gltf`,
} as const;
Object.values(MODELS).forEach((u) => useGLTF.preload(u));

/** Shared wind clock for every foliage material. */
export const wind = { value: 0 };
export function WindClock({ animate }: { animate: boolean }) {
  useFrame((_, dt) => {
    if (animate) wind.value += dt;
  });
  return null;
}

interface Part {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  depth?: THREE.Material;
  /** Ink outline shell for solid parts (rocks, trunks, props); none for leaf cards. */
  outline?: THREE.Material;
  leafy: boolean;
}

/** Coloured line art: a darkened, cool-shifted version of the surface colour. */
function outlineFor(m: THREE.MeshToonMaterial) {
  const o = ENV.outline;
  const ink = m.color.clone().multiplyScalar(o.darken).lerp(new THREE.Color(o.tint), o.tintAmount);
  return outlineMaterial(ink);
}

function toToon(src: THREE.MeshStandardMaterial, foliage: boolean, tint?: string): Part["material"] {
  const leafy = foliage || src.alphaTest > 0 || /leaf|leaves|flower|pine/i.test(src.name);
  const m = new THREE.MeshToonMaterial({
    color: src.color.clone().multiply(new THREE.Color(tint ?? "#ffffff")),
    map: src.map,
    gradientMap: toonRamp,
    alphaTest: leafy ? Math.max(0.45, src.alphaTest) : 0,
    side: leafy ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (src.map) src.map.anisotropy = 16; // crisp textures at grazing angles
  if (leafy) {
    withTranslucency(withRim(m));
    // a little self-illumination keeps canopies from ever reading as black
    m.emissive = m.color.clone().multiplyScalar(0.22);
    m.emissiveMap = src.map;
  }
  if (/rock/i.test(src.name)) {
    // the stock rock texture is dark; lift it to the game's pale blue-grey stone
    m.color.multiply(new THREE.Color("#e4e9f2")).multiplyScalar(1.8);
  }
  if (leafy) {
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = wind;
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime;").replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
vec4 ip = instanceMatrix[3];
float hgt = max(transformed.y, 0.0);
transformed.x += sin(uTime * 1.3 + ip.x * 0.3 + ip.z * 0.2) * 0.03 * hgt;
transformed.z += cos(uTime * 1.0 + ip.x * 0.2) * 0.02 * hgt;
#endif`,
      );
    };
  }
  return m;
}

/** Load a model once, bake node transforms, stand it on y=0 and convert materials. */
function useParts(url: string, height: number, tint?: string) {
  const gltf = useGLTF(url);
  return useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const parts: Part[] = [];
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const g = mesh.geometry.clone();
      g.applyMatrix4(mesh.matrixWorld);
      g.translate(0, -box.min.y, 0);
      const src = mesh.material as THREE.MeshStandardMaterial;
      const leafy = src.alphaTest > 0 || /leaf|leaves|flower/i.test(src.name);
      if (leafy) {
        // Volume normals: shade the canopy like one soft mass instead of noisy per-card facets
        g.computeBoundingBox();
        const c = new THREE.Vector3();
        g.boundingBox!.getCenter(c);
        const p = g.attributes.position;
        const n = new Float32Array(p.count * 3);
        const v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
          v.set(p.getX(i) - c.x, (p.getY(i) - c.y) * 1.25 + 0.15, p.getZ(i) - c.z).normalize();
          n[i * 3] = v.x;
          n[i * 3 + 1] = v.y;
          n[i * 3 + 2] = v.z;
        }
        g.setAttribute("normal", new THREE.BufferAttribute(n, 3));
      }
      const material = toToon(src, false, leafy ? tint : undefined);
      const depth = leafy && src.map ? new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: src.map, alphaTest: 0.45 }) : undefined;
      const solid = !leafy && (material as THREE.MeshToonMaterial).alphaTest === 0;
      if (solid) addOutlineNormals(g);
      const outline = solid ? outlineFor(material as THREE.MeshToonMaterial) : undefined;
      parts.push({ geometry: g, material, depth, outline, leafy });
    });
    return { parts, scale: height / Math.max(0.001, box.max.y - box.min.y) };
  }, [gltf, height, tint]);
}

function InstancedPart({ part, items, scale, shadows }: { part: Part; items: Placement[]; scale: number; shadows: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const shell = useRef<THREE.InstancedMesh>(null);
  const outlines = useWorld((s) => s.prefs.outlines);
  const showOutline = outlines && !!part.outline;
  useLayoutEffect(() => {
    const meshes = [ref.current, shell.current].filter((x): x is THREE.InstancedMesh => !!x);
    if (!meshes.length) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach((p, i) => {
      q.setFromAxisAngle(up, p.ry);
      const s = p.s * scale;
      m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(s, s, s));
      for (const mesh of meshes) mesh.setMatrixAt(i, m);
    });
    for (const mesh of meshes) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [items, scale, showOutline]);
  return (
    <>
      <instancedMesh ref={ref} args={[part.geometry, part.material, items.length]} castShadow={shadows} receiveShadow={shadows && !part.leafy} customDepthMaterial={part.depth} />
      {showOutline && <instancedMesh ref={shell} args={[part.geometry, part.outline, items.length]} userData={{ noReflect: true }} />}
    </>
  );
}

export function ModelInstances({ url, items, height, shadows, tint }: { url: string; items: Placement[]; height: number; shadows: boolean; tint?: string }) {
  const { parts, scale } = useParts(url, height, tint);
  if (!items.length) return null;
  return (
    <>
      {parts.map((p, i) => (
        <InstancedPart key={i} part={p} items={items} scale={scale} shadows={shadows} />
      ))}
    </>
  );
}

const split = (items: Placement[], n: number) => Array.from({ length: n }, (_, k) => items.filter((_, i) => i % n === k));

/** Pines (CC0 models); broadleaf trees are the original FluffyTrees. */
export function GltfPines({ items, shadows }: { items: Placement[]; shadows: boolean }) {
  const [a, b] = useMemo(() => split(items.filter((t) => t.variant === 3), 2), [items]);
  return (
    <>
      <ModelInstances url={MODELS.pineA} items={a} height={10} shadows={shadows} />
      <ModelInstances url={MODELS.pineB} items={b} height={11} shadows={shadows} />
    </>
  );
}

/** Small and medium boulders (the large cliff formations stay procedural). */
export function GltfRocks({ items, shadows }: { items: Placement[]; shadows: boolean }) {
  const [a, b, c] = useMemo(() => split(items.filter((r) => r.variant !== 2), 3), [items]);
  const [cliffA, cliffB] = useMemo(() => split(items.filter((r) => r.variant === 2), 2), [items]);
  return (
    <>
      <ModelInstances url={MODELS.rock3} items={cliffA} height={1.05} shadows={shadows} />
      <ModelInstances url={MODELS.rock1} items={cliffB} height={0.95} shadows={shadows} />
      <ModelInstances url={MODELS.rock1} items={a} height={1.5} shadows={shadows} />
      <ModelInstances url={MODELS.rock2} items={b} height={1.3} shadows={shadows} />
      <ModelInstances url={MODELS.rock3} items={c} height={1.7} shadows={shadows} />
    </>
  );
}

export interface PlantSet {
  bushes: Placement[];
  ferns: Placement[];
  flowers: Placement[];
}

/** Undergrowth: bushes, flowering bushes, ferns, flower clumps and leafy plants. */
export function Undergrowth({ plants, shadows }: { plants: PlantSet; shadows: boolean }) {
  const [bushA, bushB] = useMemo(() => split(plants.bushes, 2), [plants]);
  const [flA, flB, plantC] = useMemo(() => split(plants.flowers, 3), [plants]);
  return (
    <>
      <ModelInstances url={MODELS.bush} items={bushA} height={1.6} shadows={shadows} />
      <ModelInstances url={MODELS.bushFlowers} items={bushB} height={1.5} shadows={shadows} />
      <ModelInstances url={MODELS.fern} items={plants.ferns} height={0.9} shadows={false} />
      <ModelInstances url={MODELS.flowersA} items={flA} height={0.4} shadows={false} />
      <ModelInstances url={MODELS.flowersB} items={flB} height={0.42} shadows={false} />
      <ModelInstances url={MODELS.plant} items={plantC} height={0.6} shadows={false} />
    </>
  );
}
