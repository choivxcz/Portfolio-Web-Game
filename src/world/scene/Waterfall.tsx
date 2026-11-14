import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { LIGHT } from "../lightState";
import { LAKE_LOBES, LANDMARKS, WATER_LEVEL } from "../config";
import { terrainHeight } from "../terrain";
import { MAT } from "./structures/parts";

/**
 * A waterfall pouring off the Beacon's hilltop into the lake channel below.
 * The falling sheet follows a real ballistic arc from the lip (so it clears the cliff),
 * its streaks speed up as they fall, and the base churns with foam rings, rising mist
 * and spray. All animation runs in shaders driven by one time uniform.
 */
/** From the Beacon toward the open bay below its cliff (config.ts LAKE_LOBES[0]), clear of the town island. */
const BAY = LAKE_LOBES[0];
const BEACON = LANDMARKS.find((l) => l.id === "contact")!.pos;
const ANGLE = Math.atan2(BAY.z - BEACON[1], BAY.x - BEACON[0]);
const WIDTH = 12;
/** A narrower cascade beside the main fall: offset across the lip (metres) and width. */
const SIDE = { offset: WIDTH / 2 + 2.4, width: 3.4 };

/** The fall's path: lip on the plateau edge, then a parabola down to the water. */
function fallPath() {
  const beacon = LANDMARKS.find((l) => l.id === "contact")!.pos;
  const dir = new THREE.Vector2(Math.cos(ANGLE), Math.sin(ANGLE));
  const at = (d: number) => new THREE.Vector2(beacon[0] + dir.x * d, beacon[1] + dir.y * d);
  // the lip: the first point where the hilltop starts to fall away
  const plateau = terrainHeight(at(6).x, at(6).y);
  let lipD = 6;
  while (lipD < 20 && terrainHeight(at(lipD + 0.5).x, at(lipD + 0.5).y) > plateau - 0.6) lipD += 0.5;
  const lip = at(lipD);
  const top = terrainHeight(lip.x, lip.y) + 0.25;
  // pick the gentlest launch speed that keeps the whole sheet clear of the cliff face
  const g = 9.8;
  let v = 2.5;
  let pts: THREE.Vector3[] = [];
  for (; v < 9; v += 0.25) {
    pts = [];
    let ok = true;
    for (let t = 0; ; t += 0.04) {
      const d = v * t;
      const y = top - 0.5 * g * t * t;
      const p = at(lipD + d);
      if (t > 0.15 && y < terrainHeight(p.x, p.y) + 0.5 && y > WATER_LEVEL) ok = false;
      pts.push(new THREE.Vector3(p.x, Math.max(y, WATER_LEVEL - 0.3), p.y));
      if (y <= WATER_LEVEL - 0.3) break;
    }
    if (ok) break;
  }
  return { pts, dir, base: pts[pts.length - 1], lip: new THREE.Vector3(lip.x, top, lip.y) };
}

let cached: ReturnType<typeof fallPath> | null = null;
const path = () => (cached ??= fallPath());
/** Where the fall meets the lake (for the water sounds). */
export function waterfallSpot() {
  return path().base.clone();
}
/**
 * True near the waterfall: on the lip, along the falling water or at its foot.
 * Scattered rocks and trees are kept out of here so nothing sits in the fall.
 */
export function nearWaterfall(x: number, z: number, margin = 4) {
  const { lip, base } = path();
  const dx = base.x - lip.x;
  const dz = base.z - lip.z;
  // the corridor starts a few metres behind the lip, on the hilltop
  const t = ((x - lip.x) * dx + (z - lip.z) * dz) / (dx * dx + dz * dz);
  const len = Math.hypot(dx, dz);
  const back = 6 / Math.max(1, len);
  const tc = Math.max(-back, Math.min(1, t));
  const d = Math.hypot(x - (lip.x + dx * tc), z - (lip.z + dz * tc));
  // out to the far edge of the side cascade, plus a margin
  return d < SIDE.offset + SIDE.width / 2 + margin;
}

/** A curved ribbon along the path; uv.y = distance fallen (0 at the lip → 1 at the water). */
function sheetGeometry(pts: THREE.Vector3[], dir: THREE.Vector2, width: number, spread: number) {
  const across = new THREE.Vector3(-dir.y, 0, dir.x);
  const out = new THREE.Vector3(dir.x, 0, dir.y);
  const cols = 14;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let len = 0;
  const lens = pts.map((p, i) => (i ? (len += p.distanceTo(pts[i - 1])) : 0));
  pts.forEach((p, i) => {
    const t = lens[i] / len;
    const w = width * (1 + spread * t); // the sheet widens a little as it falls
    for (let j = 0; j <= cols; j++) {
      const u = j / cols;
      const s = (u - 0.5) * w;
      const bow = (1 - (2 * u - 1) ** 2) * 0.35; // the middle bulges outward, like a real sheet
      pos.push(p.x + across.x * s + out.x * bow, p.y, p.z + across.z * s + out.z * bow);
      uv.push(u, t);
    }
  });
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j;
      idx.push(a, a + cols + 1, a + 1, a + 1, a + cols + 1, a + cols + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const NOISE = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
`;

function sheetMaterial(speed: number, opacity: number, tint: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: { ...THREE.UniformsLib.fog, uTime: { value: 0 }, uSpeed: { value: speed }, uOpacity: { value: opacity }, uTint: { value: new THREE.Color(tint).multiply(new THREE.Color(LIGHT.p.tint)) } },
    vertexShader: /* glsl */ `
#include <fog_pars_vertex>
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */ `
#include <fog_pars_fragment>
${NOISE}
uniform float uTime;
uniform float uSpeed;
uniform float uOpacity;
uniform vec3 uTint;
varying vec2 vUv;
void main(){
  // water accelerates as it falls: stretch the pattern so streaks lengthen lower down
  float fall = pow(clamp(vUv.y, 0.0, 1.0), 0.7);
  vec2 q = vec2(vUv.x * 9.0, fall * 6.0 - uTime * uSpeed);
  float streak = vnoise(vec2(q.x, q.y * 0.35)) * 0.6 + vnoise(vec2(q.x * 2.3, q.y * 0.8)) * 0.4;
  // a second, faster and finer layer: the sheet reads as many threads of water
  vec2 q2 = vec2(vUv.x * 23.0 + 4.0, fall * 11.0 - uTime * uSpeed * 1.7);
  float fine = vnoise(vec2(q2.x, q2.y * 0.3));
  float bands = smoothstep(0.45, 0.85, streak) * 0.75 + smoothstep(0.62, 0.9, fine) * 0.45;
  // churning white at the lip and where it meets the lake
  float foam = smoothstep(0.06, 0.0, vUv.y) * 0.6 + smoothstep(0.78, 1.0, vUv.y) * (0.6 + 0.4 * vnoise(q * 1.7));
  // glassy aqua at the edges, deep teal through the thick middle of the sheet
  float middle = 1.0 - abs(vUv.x * 2.0 - 1.0);
  vec3 deep = mix(uTint * vec3(1.25, 1.18, 1.05), uTint * vec3(0.72, 0.86, 0.95), smoothstep(0.2, 0.9, middle));
  // brighter columns where more water pours
  deep *= 0.9 + 0.22 * vnoise(vec2(vUv.x * 5.0, 1.7));
  // crisp white ribbons over the blue: the painted look of a stylised waterfall
  float ribbons = smoothstep(0.62, 0.7, streak);
  vec3 col = mix(deep, vec3(0.93, 0.98, 1.0), clamp(bands * 0.7 + ribbons * 0.5 + foam, 0.0, 1.0));
  // a bright glassy band just below the lip where the water rolls over
  col += vec3(0.25, 0.3, 0.32) * smoothstep(0.02, 0.06, vUv.y) * smoothstep(0.16, 0.08, vUv.y);
  // frothy white along the sides
  float side = min(vUv.x, 1.0 - vUv.x);
  col = mix(col, vec3(0.96, 0.99, 1.0), smoothstep(0.12, 0.02, side) * 0.55);
  // sparkles sliding down the sheet
  float glint = smoothstep(0.93, 0.99, vnoise(vec2(vUv.x * 40.0, fall * 30.0 - uTime * uSpeed * 2.2)));
  col += vec3(0.6, 0.65, 0.7) * glint * (1.0 - foam);
  // soft, ragged side edges
  float edge = smoothstep(0.0, 0.14 + 0.06 * vnoise(vec2(vUv.y * 20.0 - uTime * uSpeed, 3.0)), side);
  float a = uOpacity * edge * (0.72 + 0.28 * bands + 0.3 * foam);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  #include <colorspace_fragment>
  #include <fog_fragment>
}`,
  });
}

/** Foam on the lake where the fall lands: rings spreading out and fading. */
function foamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: { ...THREE.UniformsLib.fog, uTime: { value: 0 }, uTint: { value: new THREE.Color(LIGHT.p.tint) } },
    vertexShader: /* glsl */ `
#include <fog_pars_vertex>
varying vec2 vUv;
void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */ `
#include <fog_pars_fragment>
${NOISE}
uniform float uTime;
uniform vec3 uTint;
varying vec2 vUv;
void main(){
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  float ang = atan(c.y, c.x);
  float churn = vnoise(vec2(ang * 3.0, r * 6.0 - uTime * 1.6)) ;
  float core = smoothstep(0.45, 0.0, r) * (0.7 + 0.3 * churn);
  float rings = 0.0;
  for (int i = 0; i < 3; i++) {
    float ph = fract(uTime * 0.35 + float(i) / 3.0);
    float rr = 0.25 + ph * 0.75;
    rings += smoothstep(0.05, 0.0, abs(r - rr)) * (1.0 - ph) * (0.6 + 0.4 * churn);
  }
  float a = clamp(core + rings * 0.8, 0.0, 1.0) * smoothstep(1.0, 0.85, r);
  gl_FragColor = vec4(vec3(0.95, 0.99, 1.0) * uTint, a * 0.9);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`,
  });
}

/** Boulders half-sunk around the plunge pool (none at the lip, which the wide fall spans). */
function waterfallRocks(base: THREE.Vector3) {
  const out: { pos: [number, number, number]; rot: [number, number, number]; scale: [number, number, number] }[] = [];
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + r() * 0.5;
    const d = 8.5 + r() * 2.2; // outside the wider foam
    const size = 0.9 + r() * 1.1;
    out.push({ pos: [base.x + Math.cos(a) * d, WATER_LEVEL + size * 0.15, base.z + Math.sin(a) * d], rot: [r() * 3, r() * 3, r() * 3], scale: [size * 1.2, size * 0.7, size] });
  }
  return out;
}

/** Spectrum across the ring's width, fading at both ends; additive and faint. */
function rainbowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
    vertexShader: /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
varying vec2 vP;
vec3 spectrum(float t){ return clamp(vec3(abs(t * 6.0 - 3.0) - 1.0, 2.0 - abs(t * 6.0 - 2.0), 2.0 - abs(t * 6.0 - 4.0)), 0.0, 1.0); }
void main(){
  float r = length(vP);
  float t = clamp((r - 8.5) / 2.0, 0.0, 1.0);
  float ends = smoothstep(0.0, 0.35, vP.y / 10.0);
  float edge = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.85, t);
  gl_FragColor = vec4(spectrum(1.0 - t) * 0.16 * ends * edge, 1.0);
}`,
  });
}

/** Soft round sprite for mist and spray. */
function puffTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Particles that loop forever: each has a seed and a phase; its position at any time
 * comes from the shader (rising mist, or spray thrown up and falling back).
 */
function particles(count: number, spray: boolean, tex: THREE.Texture) {
  const g = new THREE.BufferGeometry();
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seed[i * 3] = Math.random();
    seed[i * 3 + 1] = Math.random();
    seed[i * 3 + 2] = Math.random();
  }
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("seed", new THREE.BufferAttribute(seed, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uTex: { value: tex }, uScale: { value: 300 } },
    vertexShader: /* glsl */ `
attribute vec3 seed;
uniform float uTime;
uniform float uScale;
varying float vFade;
void main(){
  float life = ${spray ? "1.1" : "4.5"};
  float ph = fract(uTime / life + seed.x);
  float ang = seed.y * 6.2831;
  vec3 p;
  ${
    spray
      ? `float sp = 2.0 + seed.z * 3.0;
  p = vec3(cos(ang) * sp * ph * 1.2, (5.0 + seed.z * 3.0) * ph - 4.9 * ph * ph * 1.6, sin(ang) * sp * ph * 1.2);
  vFade = (1.0 - ph) * 0.9;
  float size = 0.35 + seed.z * 0.3;`
      : `float rad = 1.0 + ph * (4.5 + seed.z * 3.0);
  p = vec3(cos(ang) * rad, ph * (5.0 + seed.z * 4.0), sin(ang) * rad);
  vFade = sin(ph * 3.14159) * 0.55;
  float size = 3.0 + ph * 6.0 + seed.z * 2.0;`
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = size * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: /* glsl */ `
uniform sampler2D uTex;
varying float vFade;
void main(){
  float a = texture2D(uTex, gl_PointCoord).a * vFade;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vec3(0.96, 0.99, 1.0), a);
}`,
  });
  return { g, m };
}

export function Waterfall({ animate }: { animate: boolean }) {
  const parts = useMemo(() => {
    const { pts, dir, base, lip } = fallPath();
    const tex = puffTexture();
    const pool = new THREE.Vector3(lip.x - dir.x * 1.6, lip.y - 0.05, lip.z - dir.y * 1.6);
    return {
      outer: { g: sheetGeometry(pts, dir, WIDTH, 0.4), m: sheetMaterial(0.9, 0.92, "#4fa9cf") },
      inner: { g: sheetGeometry(pts.map((p) => p.clone().addScaledVector(new THREE.Vector3(dir.x, 0, dir.y), 0.25)), dir, WIDTH * 0.7, 0.25), m: sheetMaterial(1.35, 0.8, "#8fd4ea") },
      side: {
        g: sheetGeometry(
          pts.map((p) => p.clone().addScaledVector(new THREE.Vector3(-dir.y, 0, dir.x), SIDE.offset).addScaledVector(new THREE.Vector3(dir.x, 0, dir.y), -0.3)),
          dir,
          SIDE.width,
          0.35,
        ),
        m: sheetMaterial(1.1, 0.88, "#6fc0dc"),
      },
      foam: foamMaterial(),
      mist: particles(150, false, tex),
      spray: particles(200, true, tex),
      base,
      pool,
      dir,
      lip,
    };
  }, []);

  useFrame(({ clock, size }) => {
    // keep particle sizes consistent across screen sizes
    parts.mist.m.uniforms.uScale.value = size.height * 0.5;
    parts.spray.m.uniforms.uScale.value = size.height * 0.5;
    if (!animate) return;
    const t = clock.elapsedTime;
    parts.outer.m.uniforms.uTime.value = t;
    parts.inner.m.uniforms.uTime.value = t;
    parts.side.m.uniforms.uTime.value = t;
    parts.foam.uniforms.uTime.value = t;
    parts.mist.m.uniforms.uTime.value = t;
    parts.spray.m.uniforms.uTime.value = t;
  });

  const { base, pool, dir } = parts;
  const yaw = Math.atan2(dir.x, dir.y);
  const rocks = useMemo(() => waterfallRocks(base), [base]);
  const rainbow = useMemo(rainbowMaterial, []);
  const showRainbow = LIGHT.p.stars < 0.5 && LIGHT.p.sunIntensity > 2;
  return (
    <group>
      {rocks.map((r, i) => (
        <mesh key={i} material={MAT.rock} position={r.pos} rotation={r.rot} scale={r.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {rocks.map((r, i) => (
        // moss caps on the boulders
        <mesh key={`m${i}`} material={MAT.moss} position={[r.pos[0], r.pos[1] + r.scale[1] * 0.55, r.pos[2]]} rotation={r.rot} scale={[r.scale[0] * 0.8, r.scale[1] * 0.35, r.scale[2] * 0.8]}>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {showRainbow && (
        // a faint rainbow standing in the mist
        <mesh material={rainbow} position={[base.x - dir.x * 2, WATER_LEVEL - 1, base.z - dir.y * 2]} rotation={[0, yaw + Math.PI / 2, 0]} renderOrder={5} userData={{ noReflect: true }}>
          <ringGeometry args={[8.5, 10.5, 64, 1, 0.12 * Math.PI, 0.76 * Math.PI]} />
        </mesh>
      )}
      <mesh geometry={parts.outer.g} material={parts.outer.m} renderOrder={2} />
      <mesh geometry={parts.inner.g} material={parts.inner.m} renderOrder={3} />
      <mesh geometry={parts.side.g} material={parts.side.m} renderOrder={3} />
      {/* the spring pool on the hilltop that feeds the fall */}
      <mesh position={[pool.x, pool.y, pool.z]} rotation={[-Math.PI / 2, 0, -yaw]} material={parts.foam} renderOrder={2}>
        <planeGeometry args={[4.5, 4.5]} />
      </mesh>
      {/* churning foam where it lands */}
      <mesh position={[base.x, WATER_LEVEL + 0.06, base.z]} rotation={[-Math.PI / 2, 0, 0]} material={parts.foam} renderOrder={2}>
        <planeGeometry args={[24, 24]} />
      </mesh>
      <points geometry={parts.mist.g} material={parts.mist.m} position={[base.x, WATER_LEVEL, base.z]} renderOrder={4} frustumCulled={false} />
      <points geometry={parts.spray.g} material={parts.spray.m} position={[base.x, WATER_LEVEL, base.z]} renderOrder={4} frustumCulled={false} />
    </group>
  );
}
