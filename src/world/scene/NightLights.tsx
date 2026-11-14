import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { LANTERNS } from "../layout";
import { LIGHT } from "../lightState";
import { terrainHeight } from "../terrain";

/** Soft round glow, white (tinted by the sprite colour). */
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/**
 * Warm halos around the path lanterns at dusk and night. The lamp sits 0.6 m out
 * along the lantern's arm and 2.15 m up (see structures/parts.tsx, Lantern).
 */
export function LanternGlow() {
  const amount = LIGHT.p.lanterns;
  const tex = useMemo(glowTexture, []);
  if (amount <= 0) return null;
  return (
    <group userData={{ noReflect: true }}>
      {LANTERNS.map((l, i) => {
        const x = l.x + Math.cos(l.yaw) * 0.6;
        const z = l.z - Math.sin(l.yaw) * 0.6;
        return (
          <sprite key={i} position={[x, terrainHeight(l.x, l.z) - 0.1 + 2.15, z]} scale={[2.6, 2.6, 1]}>
            <spriteMaterial map={tex} color="#ffc46b" transparent opacity={0.85 * amount} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        );
      })}
    </group>
  );
}

/**
 * Scale the soft self-light that keeps foliage and characters readable by day, so
 * they darken properly at dusk and night. Re-applied as models stream in.
 */
export function EmissiveTune() {
  const scene = useThree((s) => s.scene);
  const k = LIGHT.p.emissive;
  const tune = useMemo(
    () => () => {
      scene.traverse((o) => {
        const mats = (o as THREE.Mesh).material;
        if (!mats) return;
        for (const m of Array.isArray(mats) ? mats : [mats]) {
          const t = m as THREE.MeshToonMaterial;
          if (!t.isMeshToonMaterial || !t.emissive) continue;
          const base = (t.userData.baseEmissive ??= t.emissive.clone()) as THREE.Color;
          t.emissive.copy(base).multiplyScalar(k);
        }
      });
    },
    [scene, k],
  );
  useEffect(tune, [tune]);
  let frames = 0;
  useFrame(() => {
    // models arrive over the first moments; tune a few more times, then stop
    if (frames < 240 && ++frames % 60 === 0) tune();
  });
  return null;
}
