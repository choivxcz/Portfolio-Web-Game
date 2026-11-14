import type { ThreeElements } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { MAT } from "./parts";

/**
 * Ornamental pieces shared by the landmarks: an original stained-glass pattern,
 * a ribbed dome, an open lantern cupola and a lantern hanging on a short chain.
 */

/** Stained glass: a radiating eight-point star in teal, gold and rose behind dark lead lines. */
export const stainedGlass = (() => {
  let tex: THREE.CanvasTexture | null = null;
  return () => {
    if (tex) return tex;
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const x = c.getContext("2d")!;
    const colors = ["#2f9c94", "#e8b64a", "#6aa3e0", "#d86a74", "#8fd0b8", "#f2d27a", "#4b6fbf", "#c78ad8"];
    // wedges radiating from the centre
    for (let i = 0; i < 16; i++) {
      x.fillStyle = colors[i % colors.length];
      x.beginPath();
      x.moveTo(S / 2, S / 2);
      x.arc(S / 2, S / 2, S, (i / 16) * Math.PI * 2, ((i + 1) / 16) * Math.PI * 2);
      x.closePath();
      x.fill();
    }
    // concentric rings of lighter glass
    for (const [r, a] of [
      [S * 0.42, 0.18],
      [S * 0.26, 0.28],
    ] as const) {
      x.fillStyle = `rgba(255,250,235,${a})`;
      x.beginPath();
      x.arc(S / 2, S / 2, r, 0, Math.PI * 2);
      x.fill();
    }
    // the eight-point star in gold
    x.fillStyle = "#f6d070";
    x.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? (i % 4 === 0 ? S * 0.3 : S * 0.2) : S * 0.08;
      const px = S / 2 + Math.cos(a) * r;
      const py = S / 2 + Math.sin(a) * r;
      if (i === 0) x.moveTo(px, py);
      else x.lineTo(px, py);
    }
    x.closePath();
    x.fill();
    // lead lines
    x.strokeStyle = "#2a2433";
    x.lineWidth = 4;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      x.beginPath();
      x.moveTo(S / 2, S / 2);
      x.lineTo(S / 2 + Math.cos(a) * S, S / 2 + Math.sin(a) * S);
      x.stroke();
    }
    for (const r of [S * 0.42, S * 0.26, S * 0.08]) {
      x.beginPath();
      x.arc(S / 2, S / 2, r, 0, Math.PI * 2);
      x.stroke();
    }
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
})();

/**
 * Glass that glows softly, like light coming through it. Pulled toward the camera in
 * the depth test so it never flickers against the wall it is set into.
 */
export const glassMaterial = (() => {
  let m: THREE.MeshBasicMaterial | null = null;
  return () =>
    (m ??= new THREE.MeshBasicMaterial({
      map: stainedGlass(),
      toneMapped: false,
      color: "#e8e8e8",
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }));
})();

/**
 * A dome over a ring (base at y = 0), with gold ribs, a gilded rim and an open
 * lantern cupola and spire on top. `sides` facets it (8 = octagonal).
 */
export function RibbedDome({
  radius,
  rise,
  ribs,
  material,
  sides = 32,
  ...props
}: { radius: number; rise: number; ribs: number; material: THREE.Material; sides?: number } & ThreeElements["group"]) {
  const rib = useMemo(() => new THREE.TorusGeometry(radius * 1.01, Math.max(0.06, radius * 0.014), 6, 24, Math.PI / 2), [radius]);
  const k = rise / radius;
  return (
    <group {...props}>
      <mesh material={material} scale={[1, k, 1]} castShadow>
        <sphereGeometry args={[radius, sides, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {Array.from({ length: ribs }, (_, i) => (
        <group key={i} rotation={[0, (i / ribs) * Math.PI * 2, 0]} scale={[1, k, 1]}>
          <mesh geometry={rib} material={MAT.gold} />
        </group>
      ))}
      <mesh material={MAT.gold} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.01, Math.max(0.08, radius * 0.02), 6, sides]} />
      </mesh>
      <Cupola radius={Math.max(0.6, radius * 0.2)} position={[0, rise - 0.05, 0]} />
    </group>
  );
}

/** Open lantern cupola: a ring of slim posts around a glowing core, a small dome and a spire. */
export function Cupola({ radius, ...props }: { radius: number } & ThreeElements["group"]) {
  const h = radius * 1.4;
  return (
    <group {...props}>
      <mesh material={MAT.stone}>
        <cylinderGeometry args={[radius * 1.15, radius * 1.2, 0.2, 12]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} material={MAT.stone} position={[Math.cos(a) * radius, h / 2 + 0.1, Math.sin(a) * radius]}>
            <cylinderGeometry args={[radius * 0.09, radius * 0.11, h, 6]} />
          </mesh>
        );
      })}
      <mesh material={MAT.glow} position={[0, h / 2 + 0.1, 0]}>
        <cylinderGeometry args={[radius * 0.55, radius * 0.55, h * 0.7, 10]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, h + 0.15, 0]}>
        <cylinderGeometry args={[radius * 1.2, radius * 1.2, 0.14, 12]} />
      </mesh>
      <mesh material={MAT.roofBlue} position={[0, h + 0.2, 0]}>
        <sphereGeometry args={[radius * 1.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, h + radius * 1.05 + 0.6, 0]}>
        <coneGeometry args={[radius * 0.14, 1.4, 8]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, h + radius * 1.05 + 0.1, 0]}>
        <sphereGeometry args={[radius * 0.2, 10, 8]} />
      </mesh>
    </group>
  );
}

/** A small lantern hanging on a chain below its mounting point (y = 0). */
export function HangingLantern({ drop = 0.6, ...props }: { drop?: number } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh material={MAT.woodDark} position={[0, -drop / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, drop, 4]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, -drop - 0.05, 0]}>
        <coneGeometry args={[0.24, 0.18, 6]} />
      </mesh>
      <mesh material={MAT.glow} position={[0, -drop - 0.3, 0]}>
        <cylinderGeometry args={[0.17, 0.15, 0.36, 6]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, -drop - 0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.12, 0.06, 6]} />
      </mesh>
    </group>
  );
}
