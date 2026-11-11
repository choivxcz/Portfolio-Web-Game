import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "../../utils/random";
import { MESAS, type Mesa } from "../cliffLayout";
import { ENV } from "../config";
import { createNoise, type Noise2D } from "../noise";
import { withDetail } from "./structures/detail";
import { toonRamp } from "./Vegetation";

/**
 * Cliff mesas around the valley, sculpted rather than smooth: vertical buttresses and
 * cracks, stepped strata whose lower edges overhang (so each band casts a shadow line),
 * darker recesses, moss on the ledges, and an overhanging grassy cap.
 */
// warm cream stone with cool lower faces; the grassy cap matches the meadow below
const STONE_LOW = new THREE.Color(ENV.palette.stoneLow);
const STONE_HIGH = new THREE.Color(ENV.palette.stoneHigh);
const STONE_WARM = new THREE.Color(ENV.palette.stoneWarm);
const MOSS = new THREE.Color(ENV.palette.moss);
const GRASS = new THREE.Color(ENV.palette.groundB);
const GRASS_LIGHT = new THREE.Color(ENV.palette.grassTip);

function mesaGeometry(m: Mesa, noise: Noise2D) {
  const r = rng(m.seed * 31 + 7);
  const segs = 64;
  const levels = 24;
  const H = m.top - m.base;
  const bands = 3 + Math.floor(r() * 3); // strata steps up the face
  const phase = r() * 10;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  // stone rings (shared vertices → smooth shading)
  for (let k = 0; k <= levels; k++) {
    const t = k / levels;
    const local = (t * bands) % 1; // 0 at the bottom of a band, → 1 at its top
    const taper = 1 - t * 0.16;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // broad bulges, vertical buttresses and narrow cracks (stretched vertically)
      const bulge = noise(ca * 1.5 + m.seed * 3.1, sa * 1.5 + t * 0.5);
      const pillar = noise(ca * 4.2 + phase, sa * 4.2 + t * 0.7);
      const crack = noise(ca * 11 + phase * 2, sa * 11 + t * 1.6);
      const relief = 0.18 * bulge + 0.09 * Math.sign(pillar) * Math.pow(Math.abs(pillar), 0.6) + 0.035 * crack;
      // each band leans back a little as it rises, so the band above overhangs it
      const step = k > 0 && k < levels ? -0.06 * local : 0;
      const rad = m.r * taper * (1 + relief + step);
      const y = m.base + t * H + (k > 0 && k < levels ? (r() - 0.5) * (H / levels) * 0.25 : 0);
      pos.push(m.x + ca * rad, y, m.z + sa * rad);
      // tone: lighter higher up, alternating warm/cool strata, darker in recesses and under overhangs
      const band = Math.floor(t * bands);
      c.copy(STONE_LOW).lerp(STONE_HIGH, t * 0.7 + r() * 0.12);
      if (band % 2) c.lerp(STONE_WARM, 0.22);
      const ao = 0.7 + 0.3 * Math.min(1, Math.max(0, (relief + 0.12) / 0.3));
      const under = local < 0.18 && k > 0 ? 0.86 : 1;
      c.multiplyScalar(ao * under * (0.86 + 0.14 * t));
      // moss on the ledge tops
      if (local > 0.82 && k < levels) c.lerp(MOSS, 0.35 * (0.5 + 0.5 * bulge));
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
