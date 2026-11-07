import type { ThreeElements } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../../../utils/random";
import { leafClumpTexture } from "../FluffyTrees";
import { toonRamp } from "../Vegetation";

/** One shared material, so all ivy across the village batches into a single draw call. */
const ivyMaterial = new THREE.MeshToonMaterial({
  vertexColors: true,
  map: leafClumpTexture,
  alphaTest: 0.5,
  side: THREE.DoubleSide,
  gradientMap: toonRamp,
  emissive: new THREE.Color("#1d3a19"),
});

/**
 * Climbing ivy hanging from a wall's top edge: leaf-cluster cards in drooping
 * strands, longest in the middle. Local +z faces out of the wall; y=0 is the top.
 */
export function Ivy({ w, h, seed = 1, ...props }: { w: number; h: number; seed?: number } & ThreeElements["group"]) {
  const geometry = useMemo(() => {
    const r = rng(seed);
    const pos: number[] = [];
    const col: number[] = [];
    const uv: number[] = [];
    const nor: number[] = [];
    const idx: number[] = [];
    const dark = new THREE.Color("#2f6a2e");
    const light = new THREE.Color("#7ab64a");
    const c = new THREE.Color();
    const strands = Math.max(3, Math.round(w / 0.3));
    for (let si = 0; si < strands; si++) {
      const x = -w / 2 + (si + 0.5) * (w / strands) + (r() - 0.5) * 0.2;
      const middle = 1 - Math.abs(si / Math.max(1, strands - 1) - 0.5) * 1.3;
      const len = h * (0.3 + r() * 0.5) * Math.max(0.25, middle);
      for (let y = 0; y > -len; y -= 0.24 + r() * 0.1) {
        const s = (0.5 + r() * 0.3) * (1 + (y / Math.max(len, 0.01)) * 0.35);
        const cx = x + (r() - 0.5) * 0.28;
        const cz = 0.03 + r() * 0.14;
        const a = r() * Math.PI * 2;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        c.copy(dark).lerp(light, THREE.MathUtils.clamp(0.25 + r() * 0.6 - (y / h) * 0.1, 0, 1));
        const base = pos.length / 3;
        for (const [ux, uy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          pos.push(cx + ((ux * ca - uy * sa) * s) / 2, y + ((ux * sa + uy * ca) * s) / 2, cz);
          uv.push((ux + 1) / 2, (uy + 1) / 2);
          nor.push(0, 0.34, 0.94);
          col.push(c.r, c.g, c.b);
        }
        idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }, [w, h, seed]);
  return (
    <group {...props}>
      <mesh geometry={geometry} material={ivyMaterial} />
    </group>
  );
}
