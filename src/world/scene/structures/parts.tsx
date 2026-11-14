import type { ThreeElements } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
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
  moss: toon("#6f9a4e"),
  rock: withDetail(toon("#a3a1ac"), "rock"),
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

/**
 * Profile of a flared pavilion roof: nearly flat at the eaves with an upturned lip,
 * rising steeply toward the top. `top` > 0 stops short of the apex (for a cupola).
 */
function roofProfile(radius: number, height: number, top = 0) {
  const pts: [number, number][] = [
    [radius * 1.01, height * 0.07],
    [radius * 0.985, height * 0.035],
  ];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const s = 0.02 + (i / steps) * 0.98;
    const x = radius * (1 - s);
    if (x < top) break;
    pts.push([x, height * Math.pow(s, 2.1)]);
  }
  if (top > 0) pts.push([top, height * Math.pow(1 - top / radius, 2.1)]);
  return pts;
}

/**
 * A flared, faceted roof with one facet per side (corners line up with the columns
 * when `phiStart` matches them). Flat-shaded so each facet catches the light.
 */
export function pavilionRoofGeometry(radius: number, height: number, sides: number, phiStart: number, top = 0) {
  const pts = roofProfile(radius, height, top).map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts.reverse(), sides, phiStart).toNonIndexed();
  g.computeVertexNormals();
  return g;
}

/** Gold ribs along the roof's corners, following its curve. */
export function roofRibGeometry(radius: number, height: number, sides: number, phiStart: number, top = 0, thickness = 0.09) {
  const prof = roofProfile(radius * 1.012, height, top).map(([x, y]) => [x, y + thickness * 0.8] as const);
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < sides; k++) {
    const phi = phiStart + (k / sides) * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3(prof.map(([x, y]) => new THREE.Vector3(Math.sin(phi) * x, y, Math.cos(phi) * x)));
    parts.push(new THREE.TubeGeometry(curve, 24, thickness, 5, false));
  }
  return mergeGeometries(parts)!;
}

/**
 * A complete roof for a ring of columns: a cornice ring on the column tops, a ceiling,
 * the flared tiled roof, gold corner ribs with curled tips, and a finial.
 * Sits at y = 0 (put the group on top of the columns).
 */
export function PavilionRoof({
  ring,
  radius,
  height,
  sides,
  phiStart,
  material,
  cupola = false,
  ...props
}: {
  ring: number; // column ring radius
  radius: number; // eave radius
  height: number;
  sides: number;
  phiStart: number;
  material: THREE.Material;
  cupola?: boolean;
} & ThreeElements["group"]) {
  const top = cupola ? 1.7 : 0;
  const roofY = 0.8;
  const roof = useMemo(() => pavilionRoofGeometry(radius, height, sides, phiStart, top), [radius, height, sides, phiStart, top]);
  const ribs = useMemo(() => roofRibGeometry(radius, height, sides, phiStart, top), [radius, height, sides, phiStart, top]);
  const capY = roofY + height * Math.pow(1 - top / radius, 2.1);
  const small = useMemo(() => (cupola ? pavilionRoofGeometry(2.5, 2.1, sides, phiStart) : null), [cupola, sides, phiStart]);
  const smallRibs = useMemo(() => (cupola ? roofRibGeometry(2.5, 2.1, sides, phiStart, 0, 0.06) : null), [cupola, sides, phiStart]);
  // the prism's corners line up with the roof's (CylinderGeometry starts at +z, like the lathe)
  const prism = (r: number, h: number, y: number, mat: THREE.Material, key?: string) => (
    <mesh key={key} material={mat} position={[0, y, 0]} rotation={[0, phiStart, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, sides]} />
    </mesh>
  );
  return (
    <group {...props}>
      {/* entablature: architrave, a gold band, then a projecting cornice */}
      {prism(ring + 0.75, 0.5, 0.25, MAT.stone)}
      {prism(ring + 0.8, 0.12, 0.52, MAT.gold)}
      {prism(ring + 1.05, 0.22, 0.69, MAT.stoneWarm)}
      {/* ceiling under the eaves, so the roof reads solid from below */}
      {prism(radius * 0.97, 0.08, roofY - 0.02, MAT.woodDark)}
      <mesh geometry={roof} material={material} position={[0, roofY, 0]} castShadow receiveShadow />
      <mesh geometry={ribs} material={MAT.gold} position={[0, roofY, 0]} castShadow />
      {/* upturned gold points at each corner */}
      {Array.from({ length: sides }, (_, k) => {
        const phi = phiStart + (k / sides) * Math.PI * 2;
        const r = radius * 1.04;
        return (
          <group key={k} position={[Math.sin(phi) * r, roofY + height * 0.09, Math.cos(phi) * r]} rotation={[0, phi, 0]}>
            <mesh material={MAT.gold} rotation={[0.85, 0, 0]} position={[0, 0.16, 0.1]}>
              <coneGeometry args={[0.1, 0.55, 6]} />
            </mesh>
          </group>
        );
      })}
      {cupola && small && smallRibs ? (
        <group position={[0, capY, 0]}>
          {/* lantern drum with glowing windows, then its own small roof */}
          {prism(1.75, 0.18, 0.09, MAT.stoneWarm)}
          {prism(1.45, 1.5, 0.93, MAT.plaster)}
          {Array.from({ length: sides }, (_, k) => {
            const phi = phiStart + ((k + 0.5) / sides) * Math.PI * 2;
            const r = 1.45 * Math.cos(Math.PI / sides) + 0.02;
            return (
              <mesh key={k} material={MAT.glow} position={[Math.sin(phi) * r, 0.95, Math.cos(phi) * r]} rotation={[0, phi, 0]}>
                <boxGeometry args={[0.42, 0.85, 0.04]} />
              </mesh>
            );
          })}
          {prism(1.7, 0.16, 1.76, MAT.gold)}
          <mesh geometry={small} material={material} position={[0, 1.84, 0]} castShadow />
          <mesh geometry={smallRibs} material={MAT.gold} position={[0, 1.84, 0]} />
          <Finial position={[0, 1.84 + 2.1, 0]} />
        </group>
      ) : (
        <Finial position={[0, capY, 0]} />
      )}
    </group>
  );
}

/** A gold finial: knop, orb and spire. */
function Finial(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh material={MAT.gold} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.16, 0.3, 0.3, 10]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.24, 14, 10]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 1.1, 0]}>
        <coneGeometry args={[0.09, 0.9, 8]} />
      </mesh>
    </group>
  );
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
