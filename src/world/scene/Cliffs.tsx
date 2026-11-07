import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "../../utils/random";
import { MESAS, type Mesa } from "../cliffLayout";
import { createNoise, type Noise2D } from "../noise";
import { withDetail } from "./structures/detail";
import { toonRamp } from "./Vegetation";

/**
 * Cliff mesas around the valley: layered pale-stone walls with bulging ledges,
 * smooth shading plus a natural rock-strata texture, and an overhanging grassy cap.
 */
const STONE_LOW = new THREE.Color("#93a0b5");
const STONE_HIGH = new THREE.Color("#c9d0dc");
const GRASS = new THREE.Color("#7db649");
const GRASS_LIGHT = new THREE.Color("#a3cf5b");

function mesaGeometry(m: Mesa, noise: Noise2D) {
  const r = rng(m.seed * 31 + 7);
  const segs = 22;
  const levels = 9;
  const H = m.top - m.base;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  // stone rings (shared vertices → smooth shading)
  for (let k = 0; k <= levels; k++) {
    const t = k / levels;
    const ledge = k > 0 && k < levels && k % 2 === 1 ? 0.93 : 1;
    const taper = 1 - t * 0.18;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const nz = noise(Math.cos(a) * 1.5 + m.seed * 3.1, Math.sin(a) * 1.5 + k * 0.35);
      const rad = m.r * taper * ledge * (1 + nz * 0.22);
      const y = m.base + t * H + (k > 0 && k < levels ? (r() - 0.5) * (H / levels) * 0.3 : 0);
      pos.push(m.x + Math.cos(a) * rad, y, m.z + Math.sin(a) * rad);
      c.copy(STONE_LOW).lerp(STONE_HIGH, t * 0.75 + r() * 0.25);
      col.push(c.r, c.g, c.b);
    }
  }
  // overhanging grass lip, then the cap centre
  const topStart = levels * segs;
  const lipStart = pos.length / 3;
  for (let i = 0; i < segs; i++) {
    const k = (topStart + i) * 3;
    pos.push(m.x + (pos[k] - m.x) * 1.06, pos[k + 1] + 0.7, m.z + (pos[k + 2] - m.z) * 1.06);
    col.push(GRASS.r, GRASS.g, GRASS.b);
  }
  const center = pos.length / 3;
  pos.push(m.x, m.top + 1.2, m.z);
  c.copy(GRASS).lerp(GRASS_LIGHT, 0.6);
  col.push(c.r, c.g, c.b);
  // the top stone ring blends into the grass
  for (let i = 0; i < segs; i++) {
    const k = (topStart + i) * 3;
    col[k] = (col[k] + GRASS.r) / 2;
    col[k + 1] = (col[k + 1] + GRASS.g) / 2;
    col[k + 2] = (col[k + 2] + GRASS.b) / 2;
  }
  const ring = (k: number, i: number) => k * segs + (i % segs);
  for (let k = 0; k < levels; k++) {
    for (let i = 0; i < segs; i++) {
      const v0 = ring(k, i);
      const v1 = ring(k + 1, i);
      const v2 = ring(k, i + 1);
      const v3 = ring(k + 1, i + 1);
      idx.push(v0, v1, v2, v2, v1, v3);
    }
  }
  for (let i = 0; i < segs; i++) {
    const t0 = topStart + i;
    const t1 = topStart + ((i + 1) % segs);
    const l0 = lipStart + i;
    const l1 = lipStart + ((i + 1) % segs);
    idx.push(t0, l0, t1, t1, l0, l1);
    idx.push(center, l1, l0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

export function Cliffs({ shadows }: { shadows: boolean }) {
  const geometry = useMemo(() => {
    const noise = createNoise(616);
    const merged = mergeGeometries(MESAS.map((m) => mesaGeometry(m, noise)))!;
    merged.computeVertexNormals();
    merged.computeBoundingSphere();
    return merged;
  }, []);
  const material = useMemo(() => withDetail(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp }), "rock"), []);
  return <mesh geometry={geometry} material={material} receiveShadow={shadows} />;
}
