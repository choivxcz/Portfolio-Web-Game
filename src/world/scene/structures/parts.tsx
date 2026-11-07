import type { ThreeElements } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { toonRamp } from "../Vegetation";
import { withDetail } from "./detail";

/* ── Shared materials (toon-shaded to match the painted look) ── */
const toon = (color: string) => new THREE.MeshToonMaterial({ color, gradientMap: toonRamp });
export const MAT = {
  stone: withDetail(toon("#e6dfd0"), "stone"),
  stoneWarm: withDetail(toon("#d8ccb5"), "stone"),
  stoneDark: withDetail(toon("#a9a091"), "stone"),
  roofBlue: withDetail(toon("#4a8c84"), "tiles"),
  roofRed: withDetail(toon("#d0663f"), "tiles"),
  plaster: withDetail(toon("#f3ecdf"), "plaster"),
  wood: withDetail(toon("#8b6141"), "wood"),
  woodDark: withDetail(toon("#5d4130"), "wood"),
  woodDoor: withDetail(toon("#7a4b2c"), "wood"),
  shutter: withDetail(toon("#4d7d8c"), "wood"),
  glass: new THREE.MeshToonMaterial({ color: "#3b4a63", gradientMap: toonRamp, emissive: "#1c2638", emissiveIntensity: 0.5 }),
  flowerRed: toon("#e0574a"),
  flowerYellow: toon("#f2c84b"),
  cloth: toon("#3f8a5e"),
  paper: toon("#f4ecd9"),
  gold: new THREE.MeshToonMaterial({ color: "#efc463", gradientMap: toonRamp, emissive: "#6b4a10", emissiveIntensity: 0.35 }),
  glow: new THREE.MeshBasicMaterial({ color: "#ffe39a", toneMapped: false }),
  crystal: new THREE.MeshBasicMaterial({ color: "#8eeaff", toneMapped: false }),
  rose: new THREE.MeshToonMaterial({ color: "#a4524a", gradientMap: toonRamp }),
};

/* ── Modelled parts ── */
export function columnGeometry(height: number, radius: number, broken = false) {
  const r = radius;
  const shaftTop = broken ? height : height - r * 0.9;
  const pts = [
    [0, 0], [r * 1.5, 0], [r * 1.5, r * 0.35], [r * 1.25, r * 0.5], [r * 1.1, r * 0.75], [r, r * 0.95],
    [r * 0.9, shaftTop * 0.5], [r * 0.86, shaftTop],
    ...(broken ? [[r * 0.5, height + r * 0.2], [0, height - r * 0.3]] : [[r * 1.15, height - r * 0.6], [r * 1.45, height - r * 0.3], [r * 1.45, height], [0, height]]),
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 12);
}

export function Column({ height = 6, radius = 0.45, broken = false, ...props }: { height?: number; radius?: number; broken?: boolean } & ThreeElements["group"]) {
  const g = useMemo(() => columnGeometry(height, radius, broken), [height, radius, broken]);
  return (
    <group {...props}>
      <mesh geometry={g} material={MAT.stone} castShadow receiveShadow />
    </group>
  );
}

/** An arch gate: a slab with a round-topped opening, extruded and bevelled. */
export function archGeometry(width: number, height: number, depth: number, opening: number) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(width / 2, 0);
  s.lineTo(width / 2, height);
  s.lineTo(-width / 2, height);
  s.lineTo(-width / 2, 0);
  const hole = new THREE.Path();
  const springing = height - opening / 2 - 0.9;
  hole.moveTo(-opening / 2, 0);
  hole.lineTo(-opening / 2, springing);
  hole.absarc(0, springing, opening / 2, Math.PI, 0, true);
  hole.lineTo(opening / 2, 0);
  hole.lineTo(-opening / 2, 0);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Gable roof prism (local front faces +z). */
export function gableGeometry(width: number, rise: number, depth: number, overhang = 0.5) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2 - overhang, 0);
  s.lineTo(0, rise);
  s.lineTo(width / 2 + overhang, 0);
  s.lineTo(width / 2 + overhang - 0.35, 0);
  s.lineTo(0, rise - 0.35);
  s.lineTo(-width / 2 - overhang + 0.35, 0);
  s.lineTo(-width / 2 - overhang, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: depth + overhang * 2, bevelEnabled: false });
  g.translate(0, 0, -(depth + overhang * 2) / 2);
  return g;
}
export function gableFill(width: number, rise: number, depth: number) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(0, rise);
  s.lineTo(width / 2, 0);
  s.lineTo(-width / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Four-point star used for emblems. */
export function starGeometry(outer: number, inner: number, depth: number) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: depth * 0.4, bevelThickness: depth * 0.4, bevelSegments: 1 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** A post lantern with a warm glowing lamp. */
export function Lantern(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh material={MAT.woodDark} position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.18, 2.6, 0.18]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0.32, 2.5, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.12]} />
      </mesh>
      <mesh material={MAT.glow} position={[0.6, 2.15, 0]}>
        <boxGeometry args={[0.32, 0.42, 0.32]} />
      </mesh>
      <mesh material={MAT.roofRed} position={[0.6, 2.42, 0]}>
        <coneGeometry args={[0.3, 0.24, 4]} />
      </mesh>
    </group>
  );
}
