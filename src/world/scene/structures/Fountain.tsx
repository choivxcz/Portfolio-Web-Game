import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LIGHT } from "../../lightState";
import { MAT, starGeometry } from "./parts";

/**
 * An original tiered fountain: an octagonal basin with a gilded rim, two carved
 * bowls on a fluted column, water spilling over each rim in thin curtains, rippling
 * water in the basin, and a slowly turning gilded star on top.
 * Water animates in shaders; the star turns on the CPU.
 */

const WATER_NOISE = /* glsl */ `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
`;

/** Shared clock for every fountain's water. */
const clock = { value: 0 };

/** A curtain of water falling from a rim: streaks scroll downward, the bottom foams. */
function curtainMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: clock, uTint: { value: new THREE.Color(LIGHT.p.tint) } },
    vertexShader: /* glsl */ `
#include <fog_pars_vertex>
varying vec2 vUv;
void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */ `
#include <fog_pars_fragment>
${WATER_NOISE}
uniform float uTime;
uniform vec3 uTint;
varying vec2 vUv;
void main(){
  float y = 1.0 - vUv.y; // 0 at the rim, 1 at the bottom
  vec2 q = vec2(vUv.x * 40.0, y * 4.0 - uTime * 2.4);
  float streak = smoothstep(0.35, 0.9, vn(vec2(q.x, q.y * 0.4)) * 0.6 + vn(vec2(q.x * 2.1, q.y)) * 0.4);
  float foam = smoothstep(0.7, 1.0, y);
  vec3 col = mix(vec3(0.55, 0.82, 0.95), vec3(0.95, 0.99, 1.0), clamp(streak * 0.8 + foam, 0.0, 1.0));
  float a = (0.35 + 0.45 * streak + 0.3 * foam) * smoothstep(0.0, 0.08, y + 0.02);
  gl_FragColor = vec4(col * uTint, clamp(a, 0.0, 0.9));
  #include <colorspace_fragment>
  #include <fog_fragment>
}`,
  });
}

/** Still-ish water in a bowl or basin: soft ripples spreading from the falling water. */
function poolMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: clock, uTint: { value: new THREE.Color(LIGHT.p.tint) } },
    vertexShader: /* glsl */ `
#include <fog_pars_vertex>
varying vec2 vUv;
void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */ `
#include <fog_pars_fragment>
${WATER_NOISE}
uniform float uTime;
uniform vec3 uTint;
varying vec2 vUv;
void main(){
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  float rings = 0.0;
  for (int i = 0; i < 3; i++) {
    float ph = fract(uTime * 0.4 + float(i) / 3.0);
    rings += smoothstep(0.04, 0.0, abs(r - ph)) * (1.0 - ph);
  }
  float glint = smoothstep(0.75, 0.95, vn(vUv * 18.0 + uTime * 0.3));
  vec3 col = mix(vec3(0.24, 0.62, 0.72), vec3(0.5, 0.82, 0.88), r);
  col = mix(col, vec3(0.96, 1.0, 1.0), clamp(rings * 0.55 + glint * 0.4, 0.0, 1.0));
  gl_FragColor = vec4(col * uTint, 0.82 * smoothstep(1.0, 0.96, r));
  #include <colorspace_fragment>
  #include <fog_fragment>
}`,
  });
}

/** A carved bowl (outside profile), open at the top. */
function bowlGeometry(r: number, depth: number) {
  const pts: [number, number][] = [
    [0.18 * r, -depth],
    [0.55 * r, -depth * 0.92],
    [0.85 * r, -depth * 0.6],
    [r, -depth * 0.15],
    [r * 1.06, 0],
    [r * 1.06, 0.06],
    [r * 0.94, 0.06],
  ];
  return new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    24,
  );
}

/** Fluted column: a lathe with a base and capital. */
function columnGeometry(h: number, r: number) {
  const pts: [number, number][] = [
    [r * 1.5, 0],
    [r * 1.5, 0.14],
    [r * 1.1, 0.24],
    [r, 0.34],
    [r * 0.9, h * 0.5],
    [r, h - 0.3],
    [r * 1.3, h - 0.16],
    [r * 1.3, h],
    [0.001, h],
  ];
  return new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    16,
  );
}

const curtain = (r: number, h: number) => new THREE.CylinderGeometry(r, r * 1.12, h, 32, 1, true);

export function Fountain({ position }: { position: [number, number, number] }) {
  const star = useRef<THREE.Group>(null);
  const parts = useMemo(
    () => ({
      curtain: curtainMaterial(),
      pool: poolMaterial(),
      star: starGeometry(0.34, 0.12, 0.12),
      bowlLow: bowlGeometry(1.25, 0.45),
      bowlHigh: bowlGeometry(0.62, 0.28),
      column: columnGeometry(1.5, 0.22),
      columnTop: columnGeometry(0.7, 0.13),
      curtainLow: curtain(1.33, 1.1),
      curtainHigh: curtain(0.67, 0.78),
    }),
    [],
  );
  useFrame((_, dt) => {
    if (star.current) star.current.rotation.y += dt * 0.5;
  });
  return (
    <group position={position}>
      {/* octagonal basin: wall, gilded rim, carved panels */}
      <mesh material={MAT.stoneWarm} position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.6, 0.75, 8, 1, true]} />
      </mesh>
      <mesh material={MAT.stoneWarm} position={[0, 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[2.18, 2.18, 0.75, 8, 1, true]} />
      </mesh>
      <mesh material={MAT.stone} position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]} receiveShadow>
        <ringGeometry args={[2.18, 2.62, 8, 1]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[2.55, 2.66, 8, 1]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return (
          <mesh key={i} material={MAT.gold} position={[Math.sin(a) * 2.47, 0.32, Math.cos(a) * 2.47]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.32, 0.32, 0.05]} />
          </mesh>
        );
      })}
      {/* basin water */}
      <mesh material={parts.pool} position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <circleGeometry args={[2.2, 40]} />
      </mesh>
      {/* column, lower bowl, upper column and bowl */}
      <mesh geometry={parts.column} material={MAT.stone} position={[0, 0.1, 0]} castShadow />
      <mesh geometry={parts.bowlLow} material={MAT.stone} position={[0, 1.6, 0]} castShadow />
      <mesh material={MAT.gold} position={[0, 1.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.32, 0.035, 6, 40]} />
      </mesh>
      <mesh material={parts.pool} position={[0, 1.6, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <circleGeometry args={[1.2, 32]} />
      </mesh>
      <mesh geometry={parts.columnTop} material={MAT.stone} position={[0, 1.55, 0]} castShadow />
      <mesh geometry={parts.bowlHigh} material={MAT.stone} position={[0, 2.35, 0]} castShadow />
      <mesh material={parts.pool} position={[0, 2.36, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <circleGeometry args={[0.6, 24]} />
      </mesh>
      {/* water spilling over both rims */}
      <mesh geometry={parts.curtainLow} material={parts.curtain} position={[0, 1.1, 0]} renderOrder={3} />
      <mesh geometry={parts.curtainHigh} material={parts.curtain} position={[0, 1.98, 0]} renderOrder={3} />
      {/* gilded star crowning the fountain */}
      <group ref={star} position={[0, 2.85, 0]} userData={{ dynamic: true }}>
        <mesh geometry={parts.star} material={MAT.gold} />
        <mesh geometry={parts.star} material={MAT.gold} rotation={[0, Math.PI / 2, 0]} />
      </group>
      <mesh material={MAT.gold} position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.12, 12, 10]} />
      </mesh>
    </group>
  );
}

/** Advances every fountain's water. Mount once. */
export function FountainClock({ animate }: { animate: boolean }) {
  useFrame((_, dt) => {
    if (animate) clock.value += dt;
  });
  return null;
}
