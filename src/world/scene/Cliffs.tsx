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
const STAIN_WARM = new THREE.Color(ENV.palette.stoneSun);
const STAIN_COOL = new THREE.Color(ENV.palette.stoneShade);
const GRASS = new THREE.Color(ENV.palette.groundB);
const GRASS_LIGHT = new THREE.Color(ENV.palette.grassTip);

function mesaGeometry(m: Mesa, noise: Noise2D) {
  const r = rng(m.seed * 31 + 7);
  const segs = 96;
  const levels = 32;
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
      // big jutting masses break the silhouette so no two stretches of wall look alike
      const mass = noise(ca * 0.8 + m.seed * 1.7 + 40, sa * 0.8 + t * 0.35);
      const relief =
        0.22 * bulge + 0.1 * Math.sign(pillar) * Math.pow(Math.abs(pillar), 0.6) + 0.035 * crack + 0.08 * Math.max(0, mass) * (1 - t * 0.5);
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
      // broad sun-baked (warm ochre) and shaded (cool lavender) patches across the face
      const patch = noise(ca * 2.3 + m.seed * 5.3 + 90, sa * 2.3 + t * 0.9);
      c.lerp(patch > 0 ? STAIN_WARM : STAIN_COOL, Math.min(0.32, Math.abs(patch) * 0.45));
      // vertical water stains running down from the ledges
      const drip = noise(ca * 18 + phase * 3, sa * 18 + t * 0.25);
      if (drip > 0.35) c.multiplyScalar(1 - Math.min(0.2, (drip - 0.35) * 0.5) * (0.4 + 0.6 * t));
      // chalky highlights on the most prominent bulges
      if (relief > 0.2) c.lerp(STONE_HIGH, Math.min(0.25, (relief - 0.2) * 1.5));
      // moss on the ledge tops
      if (local > 0.82 && k < levels) c.lerp(MOSS, 0.35 * (0.5 + 0.5 * bulge));
      // moss and grass spilling over the top edge in uneven tongues
      const tongue = noise(ca * 7 + phase, sa * 7 - 3.3) * 0.5 + 0.5;
      const spill = THREE.MathUtils.smoothstep(t, 0.92 - tongue * 0.22, 1.0);
      if (spill > 0) c.lerp(spill > 0.6 ? GRASS : MOSS, Math.min(0.85, spill));
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
