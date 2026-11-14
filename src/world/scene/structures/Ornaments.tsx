import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { HERO } from "../../config";
import { LIGHT } from "../../lightState";
import { BANNERS, GATE, SHRINES } from "../../ornaments";
import { terrainHeight } from "../../terrain";
import { wind } from "../Models";
import { MAT, gableGeometry, starGeometry } from "./parts";

/**
 * Decorative structures in an original fantasy style: waypoint shrines beside the
 * landmarks, swaying cloth banners, and a timber gate into the village.
 * Placement lives in ornaments.ts. Moving parts carry `userData.dynamic` so the
 * StaticBatch leaves them alone.
 */

const CLOTH = HERO.colors.jacket;
const TRIM = HERO.colors.trim;
const GOLD = HERO.colors.gold;

/** Banner cloth: teal with a cream border, a gold compass star and a leaf, swallowtail hem. */
export function bannerTexture() {
  const W = 128;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  // swallowtail outline
  x.beginPath();
  x.moveTo(0, 0);
  x.lineTo(W, 0);
  x.lineTo(W, H);
  x.lineTo(W / 2, H - 46);
  x.lineTo(0, H);
  x.closePath();
  x.save();
  x.clip();
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, CLOTH);
  g.addColorStop(1, "#174f59");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = TRIM;
  x.lineWidth = 10;
  x.stroke();
  x.restore();
  x.strokeStyle = GOLD;
  x.lineWidth = 3;
  x.strokeRect(14, 14, W - 28, H - 90);
  // eight-point compass star
  x.fillStyle = GOLD;
  x.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const r = i % 4 === 0 ? 34 : i % 2 === 0 ? 20 : 9;
    const px = W / 2 + Math.cos(a) * r;
    const py = 92 + Math.sin(a) * r;
    if (i === 0) x.moveTo(px, py);
    else x.lineTo(px, py);
  }
  x.closePath();
  x.fill();
  x.fillStyle = CLOTH;
  x.beginPath();
  x.arc(W / 2, 92, 6, 0, Math.PI * 2);
  x.fill();
  // leaf
  x.fillStyle = TRIM;
  x.beginPath();
  x.moveTo(W / 2, 140);
  x.quadraticCurveTo(W / 2 + 18, 156, W / 2, 178);
  x.quadraticCurveTo(W / 2 - 18, 156, W / 2, 140);
  x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cloth that ripples in the shared wind; the hem moves most. */
export function clothMaterial(map: THREE.Texture) {
  const m = new THREE.MeshToonMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = wind;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime;").replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
float hang = 1.0 - uv.y;
transformed.z += (sin(uTime * 2.1 + position.y * 2.2 + position.x * 1.3) * 0.09 + sin(uTime * 0.7) * 0.05) * hang;
transformed.x += sin(uTime * 1.4 + position.y * 1.6) * 0.03 * hang;`,
    );
  };
  return m;
}

function Banner({ x, y, z, yaw, mat }: { x: number; y: number; z: number; yaw: number; mat: THREE.Material }) {
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]} userData={{ dynamic: true }}>
      <mesh material={MAT.woodDark} position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 4.4, 8]} />
      </mesh>
      <mesh material={MAT.stoneDark} position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.3, 8]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0, 4.1, 0.02]}>
        <boxGeometry args={[1.5, 0.08, 0.08]} />
      </mesh>
      {[-0.75, 0.75].map((ex) => (
        <mesh key={ex} material={MAT.gold} position={[ex, 4.1, 0.02]}>
          <sphereGeometry args={[0.07, 8, 6]} />
        </mesh>
      ))}
      <mesh material={MAT.gold} position={[0, 4.5, 0]}>
        <coneGeometry args={[0.1, 0.32, 8]} />
      </mesh>
      {/* the cloth hangs from the crossbar, just in front of the pole */}
      <mesh material={mat} position={[0, 2.95, 0.1]} castShadow>
        <planeGeometry args={[1.3, 2.3, 4, 14]} />
      </mesh>
    </group>
  );
}

/** Soft vertical beam of light, brighter at the base. */
function beamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: { uColor: { value: new THREE.Color("#9ff3e4") }, uAmount: { value: 0.1 + 0.22 * LIGHT.p.lanterns } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
uniform vec3 uColor; uniform float uAmount; varying vec2 vUv;
void main(){
  // clamp first: pow() of a value even slightly below zero is NaN on D3D GPUs, and
  // bloom spreads one NaN pixel over the whole screen (it turns black)
  float fade = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.6);
  float edge = sin(vUv.x * 3.14159 * 2.0) * 0.5 + 0.5; // brighter where the cylinder faces the camera
  gl_FragColor = vec4(uColor, fade * (0.35 + 0.65 * edge) * uAmount);
}`,
  });
}

/** A waypoint shrine: stepped plinth, carved pillar, and a floating star crystal with rings. */
function Shrine({ x, y, z, yaw, beam }: { x: number; y: number; z: number; yaw: number; beam: THREE.Material }) {
  const float = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const star = useMemo(() => starGeometry(0.42, 0.14, 0.18), []);
  const phase = useMemo(() => (x * 0.37 + z * 0.11) % 6.28, [x, z]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (float.current) {
      float.current.position.y = 3.05 + Math.sin(t * 1.3) * 0.12;
      float.current.rotation.y = t * 0.6;
    }
    if (rings.current) {
      rings.current.rotation.x = Math.sin(t * 0.5) * 0.4 + 1.2;
      rings.current.rotation.z = t * 0.8;
    }
  });
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {/* stepped octagonal plinth */}
      <mesh material={MAT.stoneDark} position={[0, -0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.35, 1.5, 0.6, 8]} />
      </mesh>
      <mesh material={MAT.stone} position={[0, 0.32, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.0, 1.15, 0.3, 8]} />
      </mesh>
      {/* pillar with gold bands, a cupped top */}
      <mesh material={MAT.stone} position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.42, 1.5, 8]} />
      </mesh>
      {[0.65, 1.75].map((by) => (
        <mesh key={by} material={MAT.gold} position={[0, by, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 8]} />
        </mesh>
      ))}
      <mesh material={MAT.stoneWarm} position={[0, 2.08, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.34, 0.36, 8]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 2.27, 0]}>
        <torusGeometry args={[0.6, 0.05, 6, 16]} />
      </mesh>
      {/* floating crystal, rings and the light beam */}
      <group ref={float} userData={{ dynamic: true }} position={[0, 3.05, 0]}>
        <mesh geometry={star} material={MAT.crystal} />
        <mesh geometry={star} material={MAT.crystal} rotation={[0, Math.PI / 2, 0]} />
      </group>
      <group ref={rings} userData={{ dynamic: true }} position={[0, 3.05, 0]}>
        <mesh material={MAT.gold}>
          <torusGeometry args={[0.72, 0.025, 6, 32]} />
        </mesh>
        <mesh material={MAT.gold} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.02, 6, 32]} />
        </mesh>
      </group>
      <mesh material={beam} position={[0, 6.4, 0]} userData={{ dynamic: true, noReflect: true }}>
        <cylinderGeometry args={[0.16, 0.3, 8.2, 16, 1, true]} />
      </mesh>
    </group>
  );
}

/** Timber gate with a small tiled roof, a star sign and two hanging lanterns. */
function VillageGate() {
  const { x, z, yaw, span } = GATE;
  const y = terrainHeight(x, z);
  // gable profile across the path (1.6 m deep), extruded along the span; turned below
  const roof = useMemo(() => gableGeometry(1.6, 0.85, span + 0.4, 0.3), [span]);
  const star = useMemo(() => starGeometry(0.34, 0.12, 0.08), []);
  const h = 4.3;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {[-1, 1].map((sx) => (
        <group key={sx} position={[(sx * span) / 2, 0, 0]}>
          <mesh material={MAT.stoneDark} position={[0, 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
          </mesh>
          <mesh material={MAT.woodDark} position={[0, h / 2 + 0.4, 0]} castShadow>
            <boxGeometry args={[0.36, h, 0.36]} />
          </mesh>
          {/* diagonal brace */}
          <mesh material={MAT.wood} position={[-sx * 0.42, h - 0.35, 0]} rotation={[0, 0, sx * 0.75]}>
            <boxGeometry args={[0.14, 1.1, 0.14]} />
          </mesh>
          {/* hanging lantern */}
          <mesh material={MAT.woodDark} position={[-sx * 0.75, h - 0.35, 0.35]}>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
          </mesh>
          <mesh material={MAT.glow} position={[-sx * 0.75, h - 0.75, 0.35]}>
            <boxGeometry args={[0.26, 0.34, 0.26]} />
          </mesh>
          <mesh material={MAT.roofRed} position={[-sx * 0.75, h - 0.52, 0.35]}>
            <coneGeometry args={[0.24, 0.18, 4]} />
          </mesh>
        </group>
      ))}
      {/* lintel beams */}
      <mesh material={MAT.woodDark} position={[0, h + 0.45, 0]} castShadow>
        <boxGeometry args={[span + 0.9, 0.32, 0.5]} />
      </mesh>
      <mesh material={MAT.wood} position={[0, h - 0.05, 0]}>
        <boxGeometry args={[span - 0.2, 0.18, 0.3]} />
      </mesh>
      {/* tiled roof, ridge running across the path */}
      <mesh geometry={roof} material={MAT.roofRed} position={[0, h + 0.6, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      <mesh material={MAT.gold} position={[0, h + 1.5, 0]}>
        <coneGeometry args={[0.12, 0.4, 8]} />
      </mesh>
      {/* sign board with the valley's star */}
      <mesh material={MAT.wood} position={[0, h - 0.55, 0.18]}>
        <boxGeometry args={[1.5, 0.6, 0.08]} />
      </mesh>
      <mesh geometry={star} material={MAT.gold} position={[0, h - 0.55, 0.25]} />
    </group>
  );
}

export function Ornaments() {
  const banner = useMemo(() => clothMaterial(bannerTexture()), []);
  const beam = useMemo(beamMaterial, []);
  return (
    <>
      {SHRINES.map((s) => (
        <Shrine key={s.id} {...s} beam={beam} />
      ))}
      {BANNERS.map((b, i) => (
        <Banner key={i} {...b} mat={banner} />
      ))}
      <VillageGate />
    </>
  );
}
