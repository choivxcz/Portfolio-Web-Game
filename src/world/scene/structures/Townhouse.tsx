import type { ThreeElements } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { HOUSES } from "../../layout";
import { terrainHeight } from "../../terrain";
import { toonRamp } from "../Vegetation";
import { withDetail } from "./detail";
import { Ivy } from "./Ivy";
import { MAT, archGeometry, gableFill } from "./parts";

/**
 * An original storybook townhouse, replacing the old cottage: a warm stone ground
 * floor with an arched doorway and corner quoins, an overhanging timber-framed upper
 * storey with a front balcony, a steep side-gabled roof with twin dormers, and a round
 * corner turret with a conical roof. Each house picks its plaster colour, roof and
 * turret side from its position, so the street doesn't repeat.
 * The front faces local +z, inside the same w × d footprint as before (colliders unchanged).
 */

const toon = (color: string) => new THREE.MeshToonMaterial({ color, gradientMap: toonRamp });
const PLASTER = [
  MAT.plaster,
  withDetail(toon("#f6dcc6"), "plaster"), // soft peach
  withDetail(toon("#e3ead2"), "plaster"), // pale sage
  withDetail(toon("#f3e3b8"), "plaster"), // warm butter
];
const RAIL = toon("#f2e8d2");

/** Deterministic 0..1 from a position, so each house keeps its look. */
const pick = (x: number, z: number, salt: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233 + salt * 37.719) * 43758.5453;
  return s - Math.floor(s);
};

/** A side-gabled roof: two thick slabs sloping toward ±z, the ridge running along x. */
function Roof({ w, d, top, rise, mat, ov = 0.55 }: { w: number; d: number; top: number; rise: number; mat: THREE.Material; ov?: number }) {
  const theta = Math.atan2(rise, d / 2);
  const hs = d / 2 + ov;
  const len = hs / Math.cos(theta) + 0.12;
  const eaveY = top - ov * Math.tan(theta);
  const midY = (eaveY + top + rise) / 2;
  return (
    <>
      {[1, -1].map((side) => (
        <mesh key={side} material={mat} position={[0, midY + 0.12, (side * hs) / 2]} rotation={[side * theta, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[w + ov * 2, 0.32, len]} />
        </mesh>
      ))}
      {/* ridge cap and gilded finials */}
      <mesh material={mat} position={[0, top + rise + 0.2, 0]} castShadow>
        <boxGeometry args={[w + ov * 2 + 0.06, 0.34, 0.48]} />
      </mesh>
      {[-1, 1].map((e) => (
        <group key={e} position={[e * (w / 2 + ov), top + rise + 0.4, 0]}>
          <mesh material={MAT.gold} position={[0, 0.3, 0]}>
            <coneGeometry args={[0.09, 0.5, 8]} />
          </mesh>
          <mesh material={MAT.gold}>
            <sphereGeometry args={[0.12, 10, 8]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Arched window with a coloured frame, mullion, shutters and a flower box. */
function ArchWindow({ shutter, box = true, ...props }: { shutter: THREE.Material; box?: boolean } & ThreeElements["group"]) {
  const frame = useMemo(() => archGeometry(1.0, 1.45, 0.1, 0.74), []);
  return (
    <group {...props}>
      <mesh geometry={frame} material={MAT.woodDark} position={[0, -0.72, 0]} />
      <mesh material={MAT.glass} position={[0, -0.12, -0.02]}>
        <boxGeometry args={[0.76, 1.1, 0.04]} />
      </mesh>
      <mesh material={MAT.glass} position={[0, 0.33, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.04, 16, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0, -0.05, 0.04]}>
        <boxGeometry args={[0.06, 1.15, 0.04]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={shutter} position={[s * 0.68, -0.14, 0.1]} rotation={[0, s * 0.4, 0]}>
          <boxGeometry args={[0.42, 1.02, 0.05]} />
        </mesh>
      ))}
      {box && (
        <>
          <mesh material={MAT.wood} position={[0, -0.8, 0.18]}>
            <boxGeometry args={[1.04, 0.2, 0.32]} />
          </mesh>
          {[-0.32, 0, 0.32].map((fx, i) => (
            <mesh key={fx} material={i === 1 ? MAT.flowerYellow : MAT.flowerRed} position={[fx, -0.63, 0.2]}>
              <icosahedronGeometry args={[0.16, 0]} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

/** Timber frame on one upper wall: posts, rails and curved-look braces. */
function Frame({ span, face, y0, h }: { span: number; face: number; y0: number; h: number }) {
  const posts = Math.max(3, Math.round(span / 1.5));
  const reach = Math.min(0.8, span * 0.14);
  const brace = Math.hypot(reach, h * 0.55);
  const ang = Math.atan2(h * 0.55, reach);
  return (
    <group position={[0, 0, face]}>
      {Array.from({ length: posts + 1 }, (_, i) => (
        <mesh key={i} material={MAT.woodDark} position={[-span / 2 + (i * span) / posts, y0 + h / 2, 0]}>
          <boxGeometry args={[0.16, h, 0.08]} />
        </mesh>
      ))}
      {[y0 + 0.08, y0 + h - 0.08].map((y) => (
        <mesh key={y} material={MAT.woodDark} position={[0, y, 0]}>
          <boxGeometry args={[span + 0.1, 0.18, 0.09]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} material={MAT.woodDark} position={[side * (span / 2 - reach / 2), y0 + h * 0.3, 0.01]} rotation={[0, 0, side * (Math.PI / 2 - ang)]}>
          <boxGeometry args={[0.13, brace, 0.07]} />
        </mesh>
      ))}
    </group>
  );
}

/** Small gabled dormer (window faces local +z), sitting on a roof slope. */
function Dormer({ roof, shutter, ...props }: { roof: THREE.Material; shutter: THREE.Material } & ThreeElements["group"]) {
  const fill = useMemo(() => gableFill(1.3, 0.62, 0.1), []);
  return (
    <group {...props}>
      <mesh material={MAT.plaster} position={[0, 0.5, -0.45]} castShadow>
        <boxGeometry args={[1.3, 1.2, 1.5]} />
      </mesh>
      <mesh geometry={fill} material={MAT.plaster} position={[0, 1.1, 0.28]} />
      {[1, -1].map((s) => (
        <mesh key={s} material={roof} position={[s * 0.38, 1.38, -0.4]} rotation={[0, 0, -s * 0.78]} castShadow>
          <boxGeometry args={[1.05, 0.14, 1.75]} />
        </mesh>
      ))}
      <ArchWindow shutter={shutter} box={false} position={[0, 0.62, 0.33]} scale={0.62} />
    </group>
  );
}

export function Townhouse({ x, z, yaw, roof, w, d }: (typeof HOUSES)[number]) {
  const plaster = PLASTER[Math.floor(pick(x, z, 1) * PLASTER.length)];
  const turretSide = pick(x, z, 2) > 0.5 ? 1 : -1;
  const shutter = pick(x, z, 3) > 0.5 ? MAT.shutter : MAT.roofRed;
  const roofMat = roof === "red" ? MAT.roofRed : MAT.roofBlue;
  const turretMat = roof === "red" ? MAT.roofBlue : MAT.roofRed;

  const plinth = 0.5;
  const g0 = plinth; // ground floor (stone)
  const gh = 2.7;
  const u0 = g0 + gh; // upper floor (plaster, jettied)
  const uh = 2.5;
  const jetty = 0.32;
  const top = u0 + uh;
  const rise = d * 0.62;
  const uw = w + jetty * 2;
  const ud = d + jetty * 2;
  const door = useMemo(() => archGeometry(1.7, 2.6, 0.32, 1.1), []);
  const sideFill = useMemo(() => gableFill(ud, rise, 0.2), [ud, rise]);
  const tx = turretSide * (uw / 2 - 0.2);
  const tz = ud / 2 - 0.2;

  return (
    <group position={[x, terrainHeight(x, z) - 0.2, z]} rotation={[0, yaw, 0]}>
      {/* stone plinth and ground floor, with lighter corner quoins */}
      <mesh material={MAT.stoneDark} position={[0, plinth / 2, 0]} receiveShadow>
        <boxGeometry args={[w + 0.4, plinth, d + 0.4]} />
      </mesh>
      <mesh material={MAT.stoneWarm} position={[0, g0 + gh / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, gh, d]} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].flatMap((sz) =>
          [0, 1, 2, 3].map((k) => (
            <mesh key={`${sx}${sz}${k}`} material={k % 2 ? MAT.stone : MAT.stoneDark} position={[(sx * w) / 2, g0 + 0.32 + k * 0.62, (sz * d) / 2]}>
              <boxGeometry args={[k % 2 ? 0.62 : 0.5, 0.5, k % 2 ? 0.5 : 0.62]} />
            </mesh>
          )),
        ),
      )}
      {/* arched doorway with a wooden door and a step */}
      <mesh geometry={door} material={MAT.stone} position={[-w * 0.18, g0 - 0.05, d / 2 + 0.06]} castShadow />
      <mesh material={MAT.woodDoor} position={[-w * 0.18, g0 + 0.95, d / 2 + 0.02]}>
        <boxGeometry args={[1.1, 1.95, 0.08]} />
      </mesh>
      <mesh material={MAT.woodDoor} position={[-w * 0.18, g0 + 1.93, d / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 16, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh material={MAT.stoneWarm} position={[-w * 0.18, plinth - 0.1, d / 2 + 0.6]} receiveShadow>
        <boxGeometry args={[1.9, 0.24, 0.9]} />
      </mesh>
      {/* ground-floor window and a hanging sign */}
      <ArchWindow shutter={shutter} position={[w * 0.24, g0 + 1.55, d / 2 + 0.06]} />
      <group position={[-w * 0.18 + 1.3, g0 + 2.35, d / 2 + 0.05]}>
        <mesh material={MAT.woodDark} position={[0.35, 0.1, 0]}>
          <boxGeometry args={[0.8, 0.06, 0.06]} />
        </mesh>
        <mesh material={MAT.wood} position={[0.5, -0.32, 0]}>
          <boxGeometry args={[0.62, 0.62, 0.06]} />
        </mesh>
        <mesh material={MAT.gold} position={[0.5, -0.32, 0.04]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.22, 0.22, 0.03]} />
        </mesh>
      </group>
      {/* a moulding where the upper floor overhangs */}
      <mesh material={MAT.woodDark} position={[0, u0 - 0.06, 0]}>
        <boxGeometry args={[uw + 0.06, 0.22, ud + 0.06]} />
      </mesh>
      {/* jettied upper storey */}
      <mesh material={plaster} position={[0, u0 + uh / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[uw, uh, ud]} />
      </mesh>
      <Frame span={uw} face={ud / 2 + 0.03} y0={u0} h={uh} />
      <group rotation={[0, Math.PI, 0]}>
        <Frame span={uw} face={ud / 2 + 0.03} y0={u0} h={uh} />
      </group>
      <group rotation={[0, Math.PI / 2, 0]}>
        <Frame span={ud} face={uw / 2 + 0.03} y0={u0} h={uh} />
      </group>
      <group rotation={[0, -Math.PI / 2, 0]}>
        <Frame span={ud} face={uw / 2 + 0.03} y0={u0} h={uh} />
      </group>
      {/* gable ends (the roof ridge runs side to side) */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={sideFill} material={plaster} position={[(s * uw) / 2, top, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      ))}
      {/* front balcony with a cream rail and flower pots, and the door out onto it */}
      <group position={[turretSide * 0.3, u0, ud / 2]}>
        <mesh material={MAT.woodDark} position={[0, 0.02, 0.38]} castShadow>
          <boxGeometry args={[2.2, 0.12, 0.78]} />
        </mesh>
        {[-0.95, 0.95].map((bx) => (
          <mesh key={bx} material={MAT.woodDark} position={[bx, -0.3, 0.55]} rotation={[0.6, 0, 0]}>
            <boxGeometry args={[0.1, 0.7, 0.1]} />
          </mesh>
        ))}
        <mesh material={RAIL} position={[0, 0.82, 0.74]}>
          <boxGeometry args={[2.25, 0.08, 0.08]} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} material={RAIL} position={[-1.05 + i * 0.2625, 0.45, 0.74]}>
            <cylinderGeometry args={[0.035, 0.045, 0.74, 6]} />
          </mesh>
        ))}
        {[-0.75, 0.75].map((px) => (
          <group key={px} position={[px, 0.2, 0.62]}>
            <mesh material={MAT.roofRed}>
              <cylinderGeometry args={[0.13, 0.1, 0.22, 8]} />
            </mesh>
            <mesh material={px < 0 ? MAT.flowerYellow : MAT.flowerRed} position={[0, 0.2, 0]}>
              <icosahedronGeometry args={[0.18, 0]} />
            </mesh>
          </group>
        ))}
        <mesh material={MAT.woodDoor} position={[0, 1.05, 0.03]}>
          <boxGeometry args={[0.9, 1.8, 0.06]} />
        </mesh>
        <mesh material={MAT.glass} position={[0, 1.25, 0.07]}>
          <boxGeometry args={[0.6, 0.9, 0.03]} />
        </mesh>
      </group>
      <ArchWindow shutter={shutter} position={[-turretSide * uw * 0.3, u0 + 1.35, ud / 2 + 0.06]} />
      <ArchWindow shutter={shutter} position={[0, u0 + 1.35, -ud / 2 - 0.06]} rotation={[0, Math.PI, 0]} />
      {/* steep roof with twin dormers on the front slope */}
      <Roof w={uw} d={ud} top={top} rise={rise} mat={roofMat} />
      {w >= 5 &&
        [-0.22, 0.22].map((f) => (
          <Dormer key={f} roof={roofMat} shutter={shutter} position={[f * uw, top + rise * 0.45, ud * 0.2]} />
        ))}
      {/* round corner turret with a conical roof */}
      <group position={[tx, 0, tz]}>
        <mesh material={plaster} position={[0, u0 + (uh + rise * 0.55) / 2, 0]} castShadow>
          <cylinderGeometry args={[0.85, 0.85, uh + rise * 0.55, 14]} />
        </mesh>
        <mesh material={MAT.woodDark} position={[0, u0 + 0.05, 0]}>
          <cylinderGeometry args={[0.95, 0.75, 0.3, 14]} />
        </mesh>
        <mesh material={MAT.gold} position={[0, top + rise * 0.55 - 0.08, 0]}>
          <cylinderGeometry args={[0.92, 0.92, 0.1, 14]} />
        </mesh>
        <mesh material={turretMat} position={[0, top + rise * 0.55 + 1.15, 0]} castShadow>
          <coneGeometry args={[1.08, 2.4, 14]} />
        </mesh>
        <mesh material={MAT.gold} position={[0, top + rise * 0.55 + 2.6, 0]}>
          <coneGeometry args={[0.07, 0.6, 6]} />
        </mesh>
        <ArchWindow shutter={shutter} box={false} position={[0, u0 + uh * 0.55, 0.86]} scale={0.6} />
      </group>
      {/* chimney */}
      <mesh material={MAT.stoneDark} position={[-turretSide * uw * 0.3, top + rise * 0.55, -ud * 0.15]} castShadow>
        <boxGeometry args={[0.7, rise * 1.2 + 1, 0.7]} />
      </mesh>
      <mesh material={MAT.stone} position={[-turretSide * uw * 0.3, top + rise * 1.15 + 0.55, -ud * 0.15]}>
        <boxGeometry args={[0.92, 0.18, 0.92]} />
      </mesh>
      {/* ivy climbing the stone */}
      <Ivy position={[w * 0.32, u0 - 0.1, d / 2 + 0.08]} w={w * 0.34} h={gh * 0.9} seed={Math.round(x * 7 + z * 3)} />
      {/* lantern beside the door */}
      <group position={[-w * 0.18 - 1.15, g0 + 2.1, d / 2 + 0.06]}>
        <mesh material={MAT.woodDark} position={[0, 0.1, 0.16]}>
          <boxGeometry args={[0.06, 0.06, 0.34]} />
        </mesh>
        <mesh material={MAT.glow} position={[0, -0.1, 0.3]}>
          <boxGeometry args={[0.2, 0.28, 0.2]} />
        </mesh>
        <mesh material={turretMat} position={[0, 0.1, 0.3]}>
          <coneGeometry args={[0.18, 0.16, 4]} />
        </mesh>
      </group>
    </group>
  );
}
