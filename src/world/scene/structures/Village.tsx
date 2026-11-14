import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useMemo, useRef, type ReactElement } from "react";
import * as THREE from "three";
import { BRIDGE } from "../../config";
import { HOUSES, LANTERNS, SIGNPOST, WINDMILL } from "../../layout";
import { bridgeDeck, terrainHeight } from "../../terrain";
import { Ivy } from "./Ivy";
import { Townhouse } from "./Townhouse";
import { Lantern, MAT, archGeometry, gableFill, gableGeometry } from "./parts";

const ground = (x: number, z: number) => terrainHeight(x, z);

/** Sloped roof built from two thick slabs (visible tile edge and overhang) plus a ridge cap. */
function RoofSlabs({ w, d, top, rise, mat, ov = 0.6 }: { w: number; d: number; top: number; rise: number; mat: THREE.Material; ov?: number }) {
  const theta = Math.atan2(rise, w / 2);
  const hs = w / 2 + ov;
  const len = hs / Math.cos(theta) + 0.12;
  const eaveY = top - ov * Math.tan(theta);
  const midY = (eaveY + top + rise) / 2;
  return (
    <>
      {[1, -1].map((side) => (
        <mesh key={side} material={mat} position={[(side * hs) / 2, midY + 0.12, 0]} rotation={[0, 0, -side * theta]} castShadow receiveShadow>
          <boxGeometry args={[len, 0.3, d + ov * 2]} />
        </mesh>
      ))}
      <mesh material={mat} position={[0, top + rise + 0.2, 0]} castShadow>
        <boxGeometry args={[0.46, 0.32, d + ov * 2 + 0.06]} />
      </mesh>
    </>
  );
}

/**
 * Carved cream bargeboards along both gable ends, with a gilded finial at each end
 * of the ridge (same slope maths as RoofSlabs).
 */
function GableTrim({ w, d, top, rise, ov = 0.6 }: { w: number; d: number; top: number; rise: number; ov?: number }) {
  const theta = Math.atan2(rise, w / 2);
  const hs = w / 2 + ov;
  const len = hs / Math.cos(theta) + 0.1;
  const eaveY = top - ov * Math.tan(theta);
  const midY = (eaveY + top + rise) / 2;
  const ez = d / 2 + ov + 0.06;
  return (
    <>
      {[1, -1].map((end) => (
        <group key={end} position={[0, 0, end * ez]}>
          {[1, -1].map((side) => (
            <mesh key={side} material={MAT.plaster} position={[(side * hs) / 2, midY + 0.06, 0]} rotation={[0, 0, -side * theta]}>
              <boxGeometry args={[len, 0.22, 0.1]} />
            </mesh>
          ))}
          <mesh material={MAT.gold} position={[0, top + rise + 0.62, 0]}>
            <coneGeometry args={[0.1, 0.55, 8]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, top + rise + 0.34, 0]}>
            <sphereGeometry args={[0.13, 10, 8]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Framed window with mullions, painted shutters and a flower box. */
function Window(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh material={MAT.woodDark}>
        <boxGeometry args={[1.02, 1.18, 0.1]} />
      </mesh>
      <mesh material={MAT.glass} position={[0, 0, 0.04]}>
        <boxGeometry args={[0.82, 0.98, 0.06]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0, 0, 0.08]}>
        <boxGeometry args={[0.07, 0.98, 0.04]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0, 0.05, 0.08]}>
        <boxGeometry args={[0.82, 0.07, 0.04]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={MAT.shutter} position={[s * 0.8, 0, 0.12]} rotation={[0, s * 0.35, 0]}>
          <boxGeometry args={[0.5, 1.12, 0.06]} />
        </mesh>
      ))}
      <mesh material={MAT.wood} position={[0, -0.7, 0.18]}>
        <boxGeometry args={[1.08, 0.22, 0.34]} />
      </mesh>
      {[-0.32, 0, 0.32].map((fx, i) => (
        <mesh key={fx} material={i === 1 ? MAT.flowerYellow : MAT.flowerRed} position={[fx, -0.52, 0.2]}>
          <icosahedronGeometry args={[0.17, 0]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Diagonal half-timber braces in the corners of one wall, on both storeys.
 * `span` is the wall's width; the wall faces +z at `face`.
 */
function Braces({ span, face, base, h }: { span: number; face: number; base: number; h: number }) {
  const mid = base + h * 0.47;
  const top = base + h - 0.12;
  const reach = Math.min(0.95, span * 0.16);
  const out: ReactElement[] = [];
  for (const [y0, y1] of [
    [base, mid],
    [mid, top],
  ]) {
    const dy = y1 - y0;
    const len = Math.hypot(reach, dy);
    const ang = Math.atan2(dy, reach);
    for (const side of [-1, 1]) {
      const cx = side * (span / 2 - reach / 2);
      out.push(
        <mesh key={`${y0}${side}`} material={MAT.woodDark} position={[cx, (y0 + y1) / 2, face]} rotation={[0, 0, side * (Math.PI / 2 - ang)]}>
          <boxGeometry args={[0.16, len, 0.08]} />
        </mesh>,
      );
    }
  }
  return <>{out}</>;
}

/** Stone half-round arch over a doorway (flat faces toward ±z, arc upward). */
function ArchTop({ r, depth, material, ...props }: { r: number; depth: number; material: THREE.Material } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh material={material} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, depth, 18, 1, false, Math.PI / 2, Math.PI]} />
      </mesh>
    </group>
  );
}

/** A small gabled dormer window sticking out of the roof slope (its window faces local +z). */
function Dormer(props: ThreeElements["group"]) {
  const roof = useMemo(() => gableGeometry(1.3, 0.62, 1.7, 0.14), []);
  return (
    <group {...props}>
      <mesh material={MAT.plaster} position={[0, 0.5, -0.35]} castShadow>
        <boxGeometry args={[1.3, 1.2, 1.5]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0, 1.12, -0.35]}>
        <boxGeometry args={[1.42, 0.12, 1.56]} />
      </mesh>
      <mesh geometry={roof} material={MAT.roofRed} position={[0, 1.16, -0.35]} castShadow />
      <Window position={[0, 0.62, 0.42]} scale={0.72} />
    </group>
  );
}

export function House({ x, z, yaw, roof, w, d }: (typeof HOUSES)[number]) {
  const base = 0.9;
  const h = 3.9;
  const top = base + h;
  const rise = w * 0.5;
  const fill = useMemo(() => gableFill(w, rise, d - 0.06), [w, d, rise]);
  const roofMat = roof === "red" ? MAT.roofRed : MAT.roofBlue;
  const beams = [base + h * 0.47, top - 0.12];
  return (
    <group position={[x, ground(x, z) - 0.2, z]} rotation={[0, yaw, 0]}>
      <mesh material={MAT.stoneDark} position={[0, base / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.42, base, d + 0.42]} />
      </mesh>
      <mesh material={MAT.plaster} position={[0, base + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh geometry={fill} material={MAT.plaster} position={[0, top, 0]} castShadow />
      {/* timber frame */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} material={MAT.woodDark} position={[(sx * w) / 2, base + h / 2, (sz * d) / 2]}>
          <boxGeometry args={[0.3, h, 0.3]} />
        </mesh>
      ))}
      {beams.map((y) => (
        <group key={y}>
          <mesh material={MAT.woodDark} position={[0, y, d / 2 + 0.03]}>
            <boxGeometry args={[w + 0.12, 0.24, 0.1]} />
          </mesh>
          <mesh material={MAT.woodDark} position={[0, y, -d / 2 - 0.03]}>
            <boxGeometry args={[w + 0.12, 0.24, 0.1]} />
          </mesh>
          <mesh material={MAT.woodDark} position={[w / 2 + 0.03, y, 0]}>
            <boxGeometry args={[0.1, 0.24, d + 0.12]} />
          </mesh>
          <mesh material={MAT.woodDark} position={[-w / 2 - 0.03, y, 0]}>
            <boxGeometry args={[0.1, 0.24, d + 0.12]} />
          </mesh>
        </group>
      ))}
      <RoofSlabs w={w} d={d} top={top} rise={rise} mat={roofMat} />
      <GableTrim w={w} d={d} top={top} rise={rise} />
      {/* half-timber bracing on all four walls */}
      <Braces span={w} face={d / 2 + 0.05} base={base} h={h} />
      <group rotation={[0, Math.PI, 0]}>
        <Braces span={w} face={d / 2 + 0.05} base={base} h={h} />
      </group>
      <group rotation={[0, Math.PI / 2, 0]}>
        <Braces span={d} face={w / 2 + 0.05} base={base} h={h} />
      </group>
      <group rotation={[0, -Math.PI / 2, 0]}>
        <Braces span={d} face={w / 2 + 0.05} base={base} h={h} />
      </group>
      {/* round window in the front gable */}
      <group position={[0, top + rise * 0.38, d / 2 + 0.06]}>
        <mesh material={MAT.woodDark}>
          <torusGeometry args={[0.42, 0.08, 8, 24]} />
        </mesh>
        <mesh material={MAT.glass} position={[0, 0, -0.02]}>
          <circleGeometry args={[0.4, 24]} />
        </mesh>
        <mesh material={MAT.woodDark}>
          <boxGeometry args={[0.06, 0.8, 0.05]} />
        </mesh>
        <mesh material={MAT.woodDark}>
          <boxGeometry args={[0.8, 0.06, 0.05]} />
        </mesh>
      </group>
      {/* dormer on the side slope */}
      {w >= 5.5 && <Dormer position={[w * 0.27, top + rise * 0.42, -d * 0.05]} rotation={[0, Math.PI / 2, 0]} />}
      {/* door with stone surround and step */}
      <mesh material={MAT.stone} position={[-w * 0.2, base + 1.2, d / 2 + 0.05]}>
        <boxGeometry args={[1.45, 2.5, 0.12]} />
      </mesh>
      <mesh material={MAT.woodDoor} position={[-w * 0.2, base + 1.08, d / 2 + 0.11]}>
        <boxGeometry args={[1.05, 2.15, 0.08]} />
      </mesh>
      <ArchTop r={0.72} depth={0.12} material={MAT.stone} position={[-w * 0.2, base + 2.45, d / 2 + 0.05]} />
      <ArchTop r={0.52} depth={0.08} material={MAT.woodDoor} position={[-w * 0.2, base + 2.15, d / 2 + 0.11]} />
      <group position={[-w * 0.2 + 1.05, base + 2.2, d / 2 + 0.08]}>
        <mesh material={MAT.woodDark} position={[0, 0.1, 0.15]}>
          <boxGeometry args={[0.06, 0.06, 0.34]} />
        </mesh>
        <mesh material={MAT.glow} position={[0, -0.1, 0.3]}>
          <boxGeometry args={[0.2, 0.28, 0.2]} />
        </mesh>
        <mesh material={MAT.roofRed} position={[0, 0.1, 0.3]}>
          <coneGeometry args={[0.18, 0.16, 4]} />
        </mesh>
      </group>
      <mesh material={MAT.stoneWarm} position={[-w * 0.2, base - 0.12, d / 2 + 0.6]} receiveShadow>
        <boxGeometry args={[1.7, 0.26, 0.95]} />
      </mesh>
      {/* windows */}
      <Window position={[w * 0.25, base + h * 0.27, d / 2 + 0.06]} />
      <Window position={[-w * 0.22, base + h * 0.74, d / 2 + 0.06]} />
      <Window position={[w * 0.25, base + h * 0.74, d / 2 + 0.06]} />
      <Window position={[w / 2 + 0.06, base + h * 0.3, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Window position={[-w / 2 - 0.06, base + h * 0.3, 0]} rotation={[0, -Math.PI / 2, 0]} />
      {/* climbing ivy */}
      <Ivy position={[w * 0.28, top - 0.05, d / 2 + 0.12]} w={w * 0.5} h={h * 0.78} seed={Math.round(x * 7 + z * 3)} />
      {roof === "red" && <Ivy position={[-w / 2 - 0.12, top - 0.05, -d * 0.12]} rotation={[0, -Math.PI / 2, 0]} w={d * 0.7} h={h * 0.85} seed={Math.round(x * 3 - z * 5)} />}
      {/* chimney */}
      <mesh material={MAT.stoneDark} position={[w * 0.25, top + rise * 0.5 + 0.55, -d * 0.18]} castShadow>
        <boxGeometry args={[0.7, 2.5, 0.7]} />
      </mesh>
      <mesh material={MAT.stone} position={[w * 0.25, top + rise * 0.5 + 1.85, -d * 0.18]}>
        <boxGeometry args={[0.9, 0.18, 0.9]} />
      </mesh>
    </group>
  );
}

function Windmill() {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 0.45;
  });
  const { x, z, yaw } = WINDMILL;
  return (
    <group position={[x, ground(x, z) - 0.2, z]} rotation={[0, yaw, 0]}>
      <mesh material={MAT.stone} position={[0, 5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 2.5, 10, 12]} />
      </mesh>
      <mesh material={MAT.roofRed} position={[0, 11.3, 0]} castShadow>
        <coneGeometry args={[2.4, 3, 12]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0, 1.5, 2.45]}>
        <boxGeometry args={[1.2, 2.4, 0.1]} />
      </mesh>
      <group ref={blades} position={[0, 9.6, 2.2]} userData={{ dynamic: true }}>
        <mesh material={MAT.woodDark} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.8, 10]} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
            <mesh material={MAT.wood} position={[0, 3.6, 0.3]} castShadow>
              <boxGeometry args={[0.22, 7, 0.12]} />
            </mesh>
            <mesh material={MAT.paper} position={[0.78, 4.4, 0.32]} rotation={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[1.3, 5.4, 0.06]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Signpost() {
  const { x, z, yaw } = SIGNPOST;
  return (
    <group position={[x, ground(x, z), z]} rotation={[0, yaw, 0]}>
      <mesh material={MAT.woodDark} position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[0.22, 3.2, 0.22]} />
      </mesh>
      {[0.6, -0.9, 2.3].map((r, i) => (
        <mesh key={i} material={MAT.wood} position={[0, 2.7 - i * 0.5, 0]} rotation={[0, r, 0]}>
          <boxGeometry args={[1.8, 0.36, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

/** Arched stone bridge whose deck follows the same curve the explorer walks on. */
function Bridge() {
  const segs = 10;
  const c = Math.cos(BRIDGE.angle);
  const s = Math.sin(BRIDGE.angle);
  const pieces = Array.from({ length: segs }, (_, i) => {
    const u = -BRIDGE.length / 2 + (i + 0.5) * (BRIDGE.length / segs);
    const x = BRIDGE.x + c * u;
    const z = BRIDGE.z + s * u;
    return { x, z, y: (bridgeDeck(x, z) ?? 2) - 0.25, u };
  });
  const arch = useMemo(() => archGeometry(BRIDGE.length * 0.85, 4.6, BRIDGE.width - 0.2, 7.5), []);
  const yaw = -BRIDGE.angle + Math.PI / 2;
  return (
    <group>
      {pieces.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} rotation={[0, yaw, 0]}>
          <mesh material={MAT.stoneWarm} receiveShadow castShadow>
            <boxGeometry args={[BRIDGE.width, 0.5, BRIDGE.length / segs + 0.05]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} material={MAT.stone} position={[side * (BRIDGE.width / 2 - 0.15), 0.55, 0]} castShadow>
              <boxGeometry args={[0.3, 0.7, BRIDGE.length / segs + 0.05]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh geometry={arch} material={MAT.stone} position={[BRIDGE.x, pieces[segs / 2].y - 4.65, BRIDGE.z]} rotation={[0, -BRIDGE.angle, 0]} castShadow />
    </group>
  );
}

export function Village() {
  return (
    <>
      {HOUSES.map((h, i) => (
        <Townhouse key={i} {...h} />
      ))}
      <Windmill />
      <Signpost />
      {LANTERNS.map((l, i) => (
        <Lantern key={i} position={[l.x, ground(l.x, l.z) - 0.1, l.z]} rotation={[0, l.yaw, 0]} />
      ))}
      <Bridge />
    </>
  );
}
