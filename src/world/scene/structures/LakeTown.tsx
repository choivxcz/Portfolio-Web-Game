import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CITY_BRIDGE, ISLAND } from "../../config";
import { toonRamp } from "../Vegetation";
import { withDetail } from "./detail";
import { MAT, archGeometry, gableFill, gableGeometry } from "./parts";
import { House } from "./Village";

/**
 * An original walled town on the lake island: a crenellated ring wall with round
 * towers and a gatehouse, half-timbered houses around a fountain plaza, a tall
 * cathedral with a spire, windmills on the shore, and a long arched bridge.
 * Scenery only (the island isn't walkable).
 */
const WALL_R = 14.5;
const WALL_H = 4.6;
const GATE = Math.atan2(CITY_BRIDGE.to[1] - ISLAND.z, CITY_BRIDGE.to[0] - ISLAND.x);
const NORTH = -Math.PI / 2;
const ang = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const at = (a: number, r: number): [number, number] => [Math.cos(a) * r, Math.sin(a) * r];
/** Yaw that turns local +z toward the direction (cos a, sin a). */
const face = (a: number) => Math.atan2(Math.cos(a), Math.sin(a));

const wallMat = withDetail(new THREE.MeshToonMaterial({ color: "#e6e1d6", gradientMap: toonRamp, side: THREE.DoubleSide }), "stone");

function Walls() {
  const wall = useMemo(() => {
    const gap = 0.36;
    const phiGate = Math.PI / 2 - GATE; // lathe angle: x = sin(phi), z = cos(phi)
    const pts = [
      [WALL_R - 0.7, -1],
      [WALL_R + 0.7, -1],
      [WALL_R + 0.7, WALL_H],
      [WALL_R - 0.7, WALL_H],
      [WALL_R - 0.7, -1],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 96, phiGate + gap / 2, Math.PI * 2 - gap);
  }, []);
  const merlons = useMemo(() => {
    const out: { x: number; z: number; yaw: number }[] = [];
    const n = Math.round((2 * Math.PI * WALL_R) / 1.6);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      if (ang(a, GATE) < 0.3) continue;
      const [x, z] = at(a, WALL_R + 0.45);
      out.push({ x, z, yaw: face(a) });
    }
    return out;
  }, []);
  const towers = useMemo(() => Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2 + 0.2).filter((a) => ang(a, GATE) > 0.5), []);
  const arch = useMemo(() => archGeometry(5.4, 6.4, 2.4, 3.2), []);
  const [gx, gz] = at(GATE, WALL_R);
  return (
    <>
      <mesh geometry={wall} material={wallMat} castShadow receiveShadow />
      {merlons.map((m, i) => (
        <mesh key={i} material={wallMat} position={[m.x, WALL_H + 0.45, m.z]} rotation={[0, m.yaw, 0]}>
          <boxGeometry args={[0.8, 0.9, 0.5]} />
        </mesh>
      ))}
      {towers.map((a, i) => {
        const [x, z] = at(a, WALL_R);
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh material={wallMat} position={[0, 4.4, 0]} castShadow>
              <cylinderGeometry args={[1.8, 2.0, 9.8, 14]} />
            </mesh>
            <mesh material={MAT.stoneDark} position={[0, 8.9, 0]}>
              <cylinderGeometry args={[2.05, 2.05, 0.5, 14]} />
            </mesh>
            <mesh material={MAT.roofBlue} position={[0, 11.4, 0]} castShadow>
              <coneGeometry args={[2.35, 4.6, 14]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 14.1, 0]}>
              <coneGeometry args={[0.18, 1, 6]} />
            </mesh>
            <mesh material={MAT.glass} position={[Math.cos(a) * 1.82, 6.5, Math.sin(a) * 1.82]} rotation={[0, face(a), 0]}>
              <boxGeometry args={[0.45, 1.1, 0.08]} />
            </mesh>
          </group>
        );
      })}
      {[-0.27, 0.27].map((da) => {
        const [x, z] = at(GATE + da, WALL_R);
        return (
          <group key={da} position={[x, 0, z]} rotation={[0, face(GATE), 0]}>
            <mesh material={wallMat} position={[0, 4.2, 0]} castShadow>
              <boxGeometry args={[3, 9.4, 3]} />
            </mesh>
            <mesh material={MAT.roofBlue} position={[0, 10.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[2.5, 3.6, 4]} />
            </mesh>
          </group>
        );
      })}
      <mesh geometry={arch} material={wallMat} position={[gx, -0.2, gz]} rotation={[0, face(GATE), 0]} castShadow />
    </>
  );
}

function Cathedral() {
  const naveRoof = useMemo(() => gableGeometry(7, 5.2, 8.5, 0.4), []);
  const naveFill = useMemo(() => gableFill(7, 5.2, 8.4), []);
  return (
    <group position={[0, 0, -3]}>
      {/* nave, behind the tower (toward the north) */}
      <mesh material={MAT.stone} position={[0, 4.6, -6]} castShadow receiveShadow>
        <boxGeometry args={[7, 9.2, 8.5]} />
      </mesh>
      <mesh geometry={naveFill} material={MAT.stone} position={[0, 9.2, -6]} />
      <mesh geometry={naveRoof} material={MAT.roofBlue} position={[0, 9.2, -6]} castShadow />
      {[-1, 1].map((s) =>
        [-9, -6, -3].map((z) => (
          <mesh key={`${s}${z}`} material={MAT.stoneDark} position={[s * 3.8, 3.4, z]} castShadow>
            <boxGeometry args={[0.9, 6.8, 1.0]} />
          </mesh>
        )),
      )}
      {[-1, 1].map((s) =>
        [-7.5, -4.5].map((z) => (
          <mesh key={`w${s}${z}`} material={MAT.glass} position={[s * 3.52, 5.6, z]}>
            <boxGeometry args={[0.08, 3.4, 1.0]} />
          </mesh>
        )),
      )}
      {/* front tower and spire */}
      <mesh material={MAT.stone} position={[0, 10, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 20, 5]} />
      </mesh>
      <mesh material={MAT.stoneDark} position={[0, 20.2, 0]}>
        <boxGeometry args={[5.6, 0.6, 5.6]} />
      </mesh>
      <mesh material={MAT.roofBlue} position={[0, 27, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.7, 13, 4]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 34.2, 0]}>
        <coneGeometry args={[0.25, 1.6, 6]} />
      </mesh>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <group key={i} position={[sx * 2.5, 20.5, sz * 2.5]}>
          <mesh material={MAT.stone} position={[0, 1.5, 0]}>
            <boxGeometry args={[0.8, 3, 0.8]} />
          </mesh>
          <mesh material={MAT.roofBlue} position={[0, 4, 0]}>
            <coneGeometry args={[0.6, 2.2, 4]} />
          </mesh>
        </group>
      ))}
      {/* facade: rose window, lancets, door */}
      <mesh material={MAT.glow} position={[0, 14, 2.53]}>
        <circleGeometry args={[1.25, 24]} />
      </mesh>
      <mesh material={MAT.stoneDark} position={[0, 14, 2.52]}>
        <ringGeometry args={[1.25, 1.55, 24]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={MAT.glass} position={[s * 1.4, 8, 2.53]}>
          <boxGeometry args={[0.7, 2.4, 0.06]} />
        </mesh>
      ))}
      <mesh material={MAT.woodDoor} position={[0, 1.9, 2.55]}>
        <boxGeometry args={[2, 3.8, 0.1]} />
      </mesh>
      <mesh material={MAT.stone} position={[0, 4.1, 2.56]}>
        <boxGeometry args={[2.8, 0.5, 0.14]} />
      </mesh>
    </group>
  );
}

function Windmill({ a, r }: { a: number; r: number }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 0.35;
  });
  const [x, z] = at(a, r);
  return (
    <group position={[x, -0.4, z]} rotation={[0, face(a), 0]}>
      <mesh material={MAT.stone} position={[0, 5.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2.2, 11, 12]} />
      </mesh>
      <mesh material={MAT.roofRed} position={[0, 12.4, 0]} castShadow>
        <coneGeometry args={[2.1, 3, 12]} />
      </mesh>
      <group ref={blades} position={[0, 10.4, 1.9]} userData={{ dynamic: true }}>
        <mesh material={MAT.woodDark} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.6, 10]} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
            <mesh material={MAT.wood} position={[0, 3.7, 0.2]}>
              <boxGeometry args={[0.2, 7.4, 0.1]} />
            </mesh>
            <mesh material={MAT.paper} position={[0.72, 4.3, 0.22]} rotation={[0, 0.3, 0]}>
              <boxGeometry args={[1.25, 5.6, 0.05]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function TownBridge() {
  const [ax, az] = CITY_BRIDGE.from;
  const [bx, bz] = CITY_BRIDGE.to;
  const len = Math.hypot(bx - ax, bz - az);
  const yaw = Math.atan2(bz - az, bx - ax);
  const spans = 4;
  const arch = useMemo(() => archGeometry(len / spans + 0.4, 3.4, 3.2, len / spans - 1.6), [len]);
  return (
    <group position={[(ax + bx) / 2, 0, (az + bz) / 2]} rotation={[0, -yaw, 0]}>
      {Array.from({ length: spans }, (_, i) => (
        <mesh key={i} geometry={arch} material={MAT.stone} position={[-len / 2 + (i + 0.5) * (len / spans), -1.2, 0]} castShadow receiveShadow />
      ))}
      <mesh material={MAT.stoneWarm} position={[0, 2.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[len + 1, 0.4, 3.4]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={MAT.stone} position={[0, 2.9, s * 1.55]} castShadow>
          <boxGeometry args={[len + 1, 0.7, 0.3]} />
        </mesh>
      ))}
      {[-0.42, -0.14, 0.14, 0.42].map((t, i) => (
        <mesh key={i} material={MAT.glow} position={[t * len, 3.6, 1.55]}>
          <boxGeometry args={[0.32, 0.4, 0.32]} />
        </mesh>
      ))}
    </group>
  );
}

export function LakeTown() {
  /** Houses in a ring around the plaza, leaving the gate street and the cathedral clear. */
  const houses = useMemo(() => {
    const out: { x: number; z: number; yaw: number; roof: "red" | "blue"; w: number; d: number }[] = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.15;
      if (ang(a, GATE) < 0.5 || ang(a, NORTH) < 0.9) continue;
      const [lx, lz] = at(a, 9.4);
      out.push({ x: ISLAND.x + lx, z: ISLAND.z + lz, yaw: face(a + Math.PI), roof: i % 3 === 0 ? "blue" : "red", w: 4.6, d: 4.2 });
    }
    return out;
  }, []);
  return (
    <>
      <group position={[ISLAND.x, ISLAND.h, ISLAND.z]}>
        <Walls />
        <Cathedral />
        <Windmill a={GATE + 1.5} r={17.4} />
        <Windmill a={GATE - 1.75} r={17.4} />
      </group>
      {houses.map((h, i) => (
        <House key={i} {...h} />
      ))}
      <TownBridge />
    </>
  );
}
