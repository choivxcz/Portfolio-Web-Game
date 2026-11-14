import { useMemo } from "react";
import * as THREE from "three";
import { CITY_BRIDGE, ISLAND } from "../../config";
import { toonRamp } from "../Vegetation";
import { withDetail } from "./detail";
import { MAT, archGeometry, gableFill, gableGeometry } from "./parts";
import { Townhouse } from "./Townhouse";
import { bannerTexture, clothMaterial } from "./Ornaments";
import { glassMaterial } from "./ornate";

/** One swaying cloth material for every flag and banner in the town. */
const bannerCloth = (() => {
  let m: THREE.Material | null = null;
  return () => (m ??= clothMaterial(bannerTexture()));
})();

/** A small swallowtail flag on a pole, flying out to the side. */
function Flag({ size = 1, ...props }: { size?: number; position?: [number, number, number] }) {
  return (
    <group {...props} scale={size}>
      <mesh material={MAT.woodDark} position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.8, 6]} />
      </mesh>
      <group position={[0, 1.4, 0]} userData={{ dynamic: true }}>
        <mesh material={bannerCloth()} position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <planeGeometry args={[0.65, 1.2, 2, 8]} />
        </mesh>
      </group>
    </group>
  );
}

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
  // a carved band running round the outside of the wall, just below the battlements
  const band = useMemo(() => {
    const phiGate = Math.PI / 2 - GATE;
    const pts = [
      [WALL_R + 0.7, WALL_H - 0.75],
      [WALL_R + 0.92, WALL_H - 0.68],
      [WALL_R + 0.92, WALL_H - 0.42],
      [WALL_R + 0.7, WALL_H - 0.35],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 96, phiGate + 0.2, Math.PI * 2 - 0.4);
  }, []);
  // banners hang on the outer face midway between the towers
  const banners = useMemo(() => {
    const all = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2 + 0.2 + Math.PI / 7);
    return all.filter((a) => ang(a, GATE) > 0.6);
  }, []);
  const [gx, gz] = at(GATE, WALL_R);
  return (
    <>
      <mesh geometry={wall} material={wallMat} castShadow receiveShadow />
      <mesh geometry={band} material={MAT.stoneWarm} />
      {merlons.map((m, i) => (
        <mesh key={`c${i}`} material={MAT.stoneDark} position={[m.x * ((WALL_R + 0.95) / (WALL_R + 0.45)), WALL_H - 0.2, m.z * ((WALL_R + 0.95) / (WALL_R + 0.45))]} rotation={[0, m.yaw, 0]}>
          <boxGeometry args={[0.36, 0.45, 0.5]} />
        </mesh>
      ))}
      {merlons
        .filter((_, i) => i % 3 === 1)
        .map((m, i) => (
          <mesh key={`s${i}`} material={MAT.woodDark} position={[m.x * ((WALL_R + 0.73) / (WALL_R + 0.45)), 2.2, m.z * ((WALL_R + 0.73) / (WALL_R + 0.45))]} rotation={[0, m.yaw, 0]}>
            <boxGeometry args={[0.16, 1.1, 0.06]} />
          </mesh>
        ))}
      {banners.map((a, i) => {
        const [x, z] = at(a, WALL_R + 0.78);
        return (
          <group key={`b${i}`} position={[x, WALL_H - 1.75, z]} rotation={[0, face(a), 0]} userData={{ dynamic: true }}>
            <mesh material={MAT.woodDark} position={[0, 1.22, 0.06]}>
              <boxGeometry args={[1.5, 0.08, 0.08]} />
            </mesh>
            <mesh material={bannerCloth()} position={[0, 0, 0.1]}>
              <planeGeometry args={[1.25, 2.3, 4, 14]} />
            </mesh>
          </group>
        );
      })}
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
            {/* corbels carrying an overhanging upper storey */}
            {Array.from({ length: 14 }, (_, k) => {
              const ca = (k / 14) * Math.PI * 2;
              return (
                <mesh key={k} material={MAT.stoneDark} position={[Math.cos(ca) * 1.95, 9.05, Math.sin(ca) * 1.95]} rotation={[0, -ca, 0]}>
                  <boxGeometry args={[0.45, 0.5, 0.3]} />
                </mesh>
              );
            })}
            <mesh material={wallMat} position={[0, 10.5, 0]} castShadow>
              <cylinderGeometry args={[2.3, 2.15, 2.6, 16]} />
            </mesh>
            {Array.from({ length: 4 }, (_, k) => {
              const ca = (k / 4) * Math.PI * 2 + a;
              return (
                <mesh key={k} material={glassMaterial()} position={[Math.cos(ca) * 2.27, 10.6, Math.sin(ca) * 2.27]} rotation={[0, face(ca), 0]}>
                  <planeGeometry args={[0.5, 1.0]} />
                </mesh>
              );
            })}
            <mesh material={MAT.gold} position={[0, 11.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[2.38, 0.07, 6, 28]} />
            </mesh>
            <mesh material={MAT.roofBlue} position={[0, 14.6, 0]} castShadow>
              <coneGeometry args={[2.65, 5.6, 16]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 17.8, 0]}>
              <coneGeometry args={[0.14, 1.1, 6]} />
            </mesh>
            <Flag position={[0, 18.3, 0]} />
            <mesh material={MAT.glass} position={[Math.cos(a) * 1.82, 6.5, Math.sin(a) * 1.82]} rotation={[0, face(a), 0]}>
              <boxGeometry args={[0.45, 1.1, 0.08]} />
            </mesh>
            <mesh material={MAT.glass} position={[Math.cos(a) * 1.9, 3.4, Math.sin(a) * 1.9]} rotation={[0, face(a), 0]}>
              <boxGeometry args={[0.32, 0.8, 0.08]} />
            </mesh>
            {/* gilded ring under the roof and a stone band at mid-height */}
            <mesh material={MAT.gold} position={[0, 9.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[2.1, 0.07, 6, 28]} />
            </mesh>
            <mesh material={MAT.stoneWarm} position={[0, 5.2, 0]}>
              <cylinderGeometry args={[1.97, 1.97, 0.28, 14]} />
            </mesh>
          </group>
        );
      })}
      {[-0.27, 0.27].map((da) => {
        const [x, z] = at(GATE + da, WALL_R);
        return (
          <group key={da} position={[x, 0, z]} rotation={[0, face(GATE), 0]}>
            <mesh material={wallMat} position={[0, 5, 0]} castShadow>
              <cylinderGeometry args={[1.85, 2.05, 11, 16]} />
            </mesh>
            <mesh material={MAT.stoneWarm} position={[0, 10.7, 0]}>
              <cylinderGeometry args={[2.15, 1.9, 0.6, 16]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 11.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[2.12, 0.07, 6, 28]} />
            </mesh>
            <mesh material={MAT.roofRed} position={[0, 14, 0]} castShadow>
              <coneGeometry args={[2.35, 5.6, 16]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 17.2, 0]}>
              <coneGeometry args={[0.13, 1, 6]} />
            </mesh>
            <Flag position={[0, 17.7, 0]} />
            <mesh material={glassMaterial()} position={[0, 7.2, 1.95]}>
              <planeGeometry args={[0.55, 1.2]} />
            </mesh>
          </group>
        );
      })}
      <group position={[gx, -0.2, gz]} rotation={[0, face(GATE), 0]}>
        <mesh geometry={arch} material={wallMat} castShadow />
        {/* raised portcullis just under the arch, and a banner over the gate */}
        {Array.from({ length: 6 }, (_, k) => (
          <mesh key={k} material={MAT.woodDark} position={[-1.25 + k * 0.5, 4.4, 0]}>
            <boxGeometry args={[0.1, 1.6, 0.1]} />
          </mesh>
        ))}
        {[3.7, 4.4, 5.1].map((y) => (
          <mesh key={y} material={MAT.woodDark} position={[0, y, 0]}>
            <boxGeometry args={[2.9, 0.1, 0.1]} />
          </mesh>
        ))}
        <group position={[0, 5.4, 1.32]} userData={{ dynamic: true }}>
          <mesh material={MAT.woodDark} position={[0, 0.85, 0]}>
            <boxGeometry args={[2.1, 0.08, 0.08]} />
          </mesh>
          <mesh material={bannerCloth()} position={[0, -0.4, 0.04]}>
            <planeGeometry args={[1.6, 2.5, 4, 12]} />
          </mesh>
        </group>
      </group>
    </>
  );
}

/** Arched window: a stone frame with stained glass set just in front of the wall. */
function GlassWindow({ w, h, ...props }: { w: number; h: number } & { position?: [number, number, number]; rotation?: [number, number, number] }) {
  const frame = useMemo(() => archGeometry(w + 0.36, h, 0.16, w), [w, h]);
  // archGeometry: the opening's straight sides rise to h - w/2 - 0.9, then a half-circle
  const straight = h - w / 2 - 0.9;
  return (
    <group {...props}>
      <mesh geometry={frame} material={MAT.stone} position={[0, 0, 0.06]} />
      <mesh material={glassMaterial()} position={[0, straight / 2, 0.05]}>
        <planeGeometry args={[w, straight]} />
      </mesh>
      <mesh material={glassMaterial()} position={[0, straight, 0.05]}>
        <circleGeometry args={[w / 2, 16, 0, Math.PI]} />
      </mesh>
    </group>
  );
}

/**
 * The citadel at the heart of the island: a square keep with round corner turrets,
 * a stained-glass octagonal drum, a slender upper tower with a railed balcony and a
 * crowned spire, with a great hall behind it. The front faces +z (toward the plaza).
 */
function Citadel() {
  const door = useMemo(() => archGeometry(3.2, 4.6, 0.6, 2.0), []);
  const hallRoof = useMemo(() => gableGeometry(6, 3.8, 6.5, 0.35), []);
  const hallFill = useMemo(() => gableFill(6, 3.8, 6.4), []);
  const K = 4.5; // half-width of the keep
  const merlons = Array.from({ length: 6 }, (_, i) => -K + 0.75 + i * ((K * 2 - 1.5) / 5));
  return (
    <group position={[0, 0, -4]}>
      {/* stepped plinth and the keep */}
      <mesh material={MAT.stoneDark} position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[K * 2 + 1.4, 0.6, K * 2 + 1.4]} />
      </mesh>
      <mesh material={wallMat} position={[0, 4.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[K * 2, 7.6, K * 2]} />
      </mesh>
      <mesh material={MAT.stoneWarm} position={[0, 8.05, 0]}>
        <boxGeometry args={[K * 2 + 0.5, 0.5, K * 2 + 0.5]} />
      </mesh>
      {/* battlements around the keep roof */}
      {[-1, 1].flatMap((s) =>
        merlons.flatMap((t) => [
          <mesh key={`x${s}${t}`} material={wallMat} position={[t, 8.65, s * (K + 0.05)]}>
            <boxGeometry args={[0.7, 0.7, 0.4]} />
          </mesh>,
          <mesh key={`z${s}${t}`} material={wallMat} position={[s * (K + 0.05), 8.65, t]}>
            <boxGeometry args={[0.4, 0.7, 0.7]} />
          </mesh>,
        ]),
      )}
      {/* grand doorway, steps and windows */}
      <mesh geometry={door} material={MAT.stone} position={[0, 0.6, K + 0.05]} castShadow />
      <mesh material={MAT.woodDoor} position={[0, 2.2, K - 0.02]}>
        <boxGeometry args={[2, 3.3, 0.1]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 4.75, K + 0.4]}>
        <torusGeometry args={[0.5, 0.06, 6, 20]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={MAT.stoneWarm} position={[0, i * 0.25 - 0.15, K + 1.2 + (2 - i) * 0.45]} receiveShadow>
          <boxGeometry args={[4.4, 0.3, 0.9]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <GlassWindow key={s} w={1.0} h={3.0} position={[s * 2.7, 2.6, K]} />
      ))}
      {[-1, 1].map((s) => (
        <GlassWindow key={`side${s}`} w={1.0} h={3.0} position={[s * K, 2.6, 0]} rotation={[0, (s * Math.PI) / 2, 0]} />
      ))}
      {/* corner turrets */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * K, 0, sz * K]}>
            <mesh material={wallMat} position={[0, 6.2, 0]} castShadow>
              <cylinderGeometry args={[1.3, 1.45, 12.4, 14]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 12.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.38, 0.06, 6, 24]} />
            </mesh>
            <mesh material={MAT.roofBlue} position={[0, 15.0, 0]} castShadow>
              <coneGeometry args={[1.62, 5.0, 14]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 17.85, 0]}>
              <coneGeometry args={[0.1, 0.8, 6]} />
            </mesh>
            <Flag position={[0, 18.2, 0]} size={0.8} />
            <mesh material={glassMaterial()} position={[sx * 0.97, 9.6, sz * 0.97]} rotation={[0, Math.atan2(sx, sz), 0]}>
              <planeGeometry args={[0.4, 0.9]} />
            </mesh>
          </group>
        )),
      )}
      {/* octagonal drum with tall stained-glass windows */}
      <mesh material={wallMat} position={[0, 11.6, 0]} rotation={[0, Math.PI / 8, 0]} castShadow>
        <cylinderGeometry args={[3.5, 3.7, 6.6, 8]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        // centre of each flat face (the drum is turned so its faces point along these angles)
        const r = 3.6 * Math.cos(Math.PI / 8) + 0.02;
        return <GlassWindow key={i} w={1.1} h={4.0} position={[Math.sin(a) * r, 9.0, Math.cos(a) * r]} rotation={[0, a, 0]} />;
      })}
      <mesh material={MAT.stoneWarm} position={[0, 15.1, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[3.95, 3.6, 0.5, 8]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 15.38, 0]} rotation={[Math.PI / 2, 0, Math.PI / 8]}>
        <torusGeometry args={[3.92, 0.08, 6, 8]} />
      </mesh>
      {/* upper tower with a railed balcony */}
      <mesh material={wallMat} position={[0, 19.6, 0]} castShadow>
        <cylinderGeometry args={[2.0, 2.3, 8.6, 16]} />
      </mesh>
      <mesh material={MAT.stone} position={[0, 20.4, 0]}>
        <cylinderGeometry args={[3.0, 2.3, 0.4, 20]} />
      </mesh>
      {Array.from({ length: 20 }, (_, k) => {
        const a = (k / 20) * Math.PI * 2;
        return (
          <mesh key={k} material={MAT.stone} position={[Math.cos(a) * 2.85, 20.95, Math.sin(a) * 2.85]}>
            <cylinderGeometry args={[0.06, 0.08, 0.7, 6]} />
          </mesh>
        );
      })}
      <mesh material={MAT.gold} position={[0, 21.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.85, 0.07, 6, 32]} />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} material={glassMaterial()} position={[Math.sin(a) * 2.14, 22.4, Math.cos(a) * 2.14]} rotation={[0, a, 0]}>
            <planeGeometry args={[0.7, 1.6]} />
          </mesh>
        );
      })}
      {/* crown: flared gold ring, tall spire, orb and a big flag */}
      <mesh material={MAT.gold} position={[0, 24.05, 0]}>
        <cylinderGeometry args={[2.6, 2.2, 0.35, 20]} />
      </mesh>
      <mesh material={MAT.roofBlue} position={[0, 28.2, 0]} castShadow>
        <coneGeometry args={[2.45, 8.0, 20]} />
      </mesh>
      {[26, 29].map((y) => (
        // gold bands hugging the cone (its radius shrinks linearly from 2.45 at y 24.2 to 0 at y 32.2)
        <mesh key={y} material={MAT.gold} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.45 * (1 - (y - 24.2) / 8) + 0.04, 0.06, 6, 24]} />
        </mesh>
      ))}
      <mesh material={MAT.gold} position={[0, 32.5, 0]}>
        <sphereGeometry args={[0.3, 12, 10]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 33.5, 0]}>
        <coneGeometry args={[0.12, 1.6, 6]} />
      </mesh>
      <Flag position={[0, 34, 0]} size={1.6} />
      {/* great hall behind the keep */}
      <group position={[0, 0, -K - 3]}>
        <mesh material={wallMat} position={[0, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 6.4, 6]} />
        </mesh>
        <mesh geometry={hallFill} material={wallMat} position={[0, 6.4, 0]} rotation={[0, Math.PI / 2, 0]} />
        <mesh geometry={hallRoof} material={MAT.roofRed} position={[0, 6.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
        {[-1, 1].map((s) => (
          <GlassWindow key={s} w={0.9} h={3.2} position={[s * 3, 1.8, 0]} rotation={[0, (s * Math.PI) / 2, 0]} />
        ))}
      </group>
    </group>
  );
}

/**
 * A wooden pier reaching out from the island's shore at angle `a`, with posts,
 * lanterns and a little moored sailing boat. Replaces the old shore windmills.
 */
function Pier({ a }: { a: number }) {
  const hull = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.75, 0.75, 4.2, 16, 1, false, Math.PI / 2, Math.PI);
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.7, 1);
    return g;
  }, []);
  const deckY = 0.75 - ISLAND.h; // just above the water (the group sits at the island's height)
  const [x, z] = at(a, 17.5);
  return (
    <group position={[x, 0, z]} rotation={[0, face(a), 0]}>
      <mesh material={MAT.wood} position={[0, deckY, 4.5]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.22, 10]} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} material={MAT.woodDark} position={[0, deckY + 0.12, -0.3 + i]}>
          <boxGeometry args={[2.24, 0.04, 0.08]} />
        </mesh>
      ))}
      {[1.5, 4.5, 7.5, 9.4].flatMap((pz) =>
        [-1, 1].map((s) => (
          <mesh key={`${pz}${s}`} material={MAT.woodDark} position={[s * 1.15, deckY - 0.6, pz]}>
            <cylinderGeometry args={[0.13, 0.15, 2.4, 6]} />
          </mesh>
        )),
      )}
      {[3, 9].map((pz) => (
        <group key={pz} position={[1.0, deckY, pz]}>
          <mesh material={MAT.woodDark} position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 1.6, 6]} />
          </mesh>
          <mesh material={MAT.glow} position={[0, 1.75, 0]}>
            <boxGeometry args={[0.26, 0.34, 0.26]} />
          </mesh>
          <mesh material={MAT.roofRed} position={[0, 2.0, 0]}>
            <coneGeometry args={[0.22, 0.18, 4]} />
          </mesh>
        </group>
      ))}
      {/* moored boat alongside, with a mast and a cream sail */}
      <group position={[-2.3, 0.25 - ISLAND.h, 6.5]}>
        <mesh geometry={hull} material={MAT.woodDoor} castShadow />
        <mesh material={MAT.wood} position={[0, 0.02, 0]}>
          <boxGeometry args={[1.3, 0.06, 3.8]} />
        </mesh>
        <mesh material={MAT.woodDark} position={[0, 2.0, 0.3]}>
          <cylinderGeometry args={[0.05, 0.07, 4, 6]} />
        </mesh>
        <mesh material={MAT.paper} position={[0, 2.5, -0.35]}>
          <boxGeometry args={[0.06, 2.4, 1.2]} />
        </mesh>
      </group>
    </group>
  );
}

function TownBridge() {
  const [ax, az] = CITY_BRIDGE.from;
  const [bx, bz] = CITY_BRIDGE.to;
  const len = Math.hypot(bx - ax, bz - az);
  const yaw = Math.atan2(bz - az, bx - ax);
  const spans = Math.max(4, Math.round(len / 5)); // one arch every ~5 m
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
      {/* lamp posts along both railings, one over every pier */}
      {Array.from({ length: spans + 1 }, (_, i) => -len / 2 + (i * len) / spans).flatMap((x) =>
        [-1, 1].map((s) => (
          <group key={`${x}${s}`} position={[x, 3.25, s * 1.55]}>
            <mesh material={MAT.woodDark} position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 1.2, 6]} />
            </mesh>
            <mesh material={MAT.glow} position={[0, 1.35, 0]}>
              <boxGeometry args={[0.28, 0.36, 0.28]} />
            </mesh>
            <mesh material={MAT.gold} position={[0, 1.62, 0]}>
              <coneGeometry args={[0.24, 0.2, 4]} />
            </mesh>
          </group>
        )),
      )}
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
        <Citadel />
        <Pier a={GATE + 1.5} />
        <Pier a={GATE - 1.75} />
      </group>
      {houses.map((h, i) => (
        <Townhouse key={i} {...h} />
      ))}
      <TownBridge />
    </>
  );
}
