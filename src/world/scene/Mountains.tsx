import { useMemo } from "react";
import * as THREE from "three";
import { ENV } from "../config";
import { createNoise, fbm, ridged, smoothstep } from "../noise";
import { SKY, SUN_DIR } from "./Sky";

/**
 * Three layered mountain ranges around the valley, drawn with a stylized shader:
 * crisp two-tone cel shading (warm sunlit faces / cool blue shadow faces), bare rock
 * with strata on steep faces, ragged snow caps that settle on the gentler slopes,
 * and aerial perspective that fades each layer into the sky's horizon colour.
 */
interface Layer {
  r0: number;
  r1: number;
  base: number;
  amp: number;
  freq: number;
  seed: number;
  low: string; // foothills
  high: string; // upper slopes
  rock: string; // bare rock on steep faces
  snow: number; // snow line (world height)
}

const LAYERS: Layer[] = [
  { r0: 430, r1: 690, base: 18, amp: 225, freq: 2.2, seed: 11, low: "#7fa673", high: "#8d9fb9", rock: "#7d8aa3", snow: 150 },
  { r0: 650, r1: 1010, base: 28, amp: 300, freq: 1.8, seed: 23, low: "#7d9c8a", high: "#8fa3c2", rock: "#7f8eac", snow: 228 },
  { r0: 970, r1: 1420, base: 40, amp: 350, freq: 1.4, seed: 37, low: "#93aacb", high: "#9fb4d4", rock: "#92a5c6", snow: 245 },
];

/** Prominent snowy peaks: direction (x = cos a, z = sin a), layer, position across it, height, width. */
const PEAKS = [
  { a: -Math.PI / 2 - 0.45, layer: 1, t: 0.5, h: 380, w: 0.17 },
  { a: -Math.PI / 2 + 0.55, layer: 0, t: 0.5, h: 230, w: 0.12 },
  { a: 0.35, layer: 1, t: 0.5, h: 330, w: 0.16 },
  { a: Math.PI - 0.3, layer: 1, t: 0.5, h: 320, w: 0.15 },
  { a: 2.45, layer: 2, t: 0.45, h: 400, w: 0.18 },
  { a: -0.95, layer: 2, t: 0.5, h: 340, w: 0.15 },
  { a: 1.35, layer: 0, t: 0.55, h: 210, w: 0.13 },
];

function layerGeometry(L: Layer, index: number) {
  const n = createNoise(L.seed);
  const m = createNoise(L.seed + 100);
  const g2 = createNoise(L.seed + 200);
  const segs = 960;
  const rings = 40;
  const cols = segs + 1;
  const pos = new Float32Array(cols * (rings + 1) * 3);
  const col = new Float32Array(cols * (rings + 1) * 3);
  const low = new THREE.Color(L.low);
  const high = new THREE.Color(L.high);
  const c = new THREE.Color();
  const peaks = PEAKS.filter((p) => p.layer === index);
  const top = L.base + L.amp;
  let k = 0;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const rad = L.r0 + (L.r1 - L.r0) * t;
    const env = Math.pow(Math.sin(t * Math.PI), 0.6);
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // massifs: broad groups of mountains separated by lower saddles
      const mass = smoothstep(0.25, 0.75, fbm(m, ca * 1.2, sa * 1.2, 3) * 0.5 + 0.5);
      // broad, rounded masses carry the shape; ridged noise only adds crest detail
      const broad = fbm(m, ca * L.freq * 0.8 + t * 1.2 + 7, sa * L.freq * 0.8 + t * 0.8, 4) * 0.5 + 0.5;
      const crest = ridged(n, ca * L.freq + t * 1.6, sa * L.freq + t * 1.1, 4);
      let h = env * (L.base + L.amp * (0.3 + 0.7 * mass) * (0.7 * Math.pow(broad, 1.5) + 0.3 * crest * broad));
      for (const p of peaks) {
        // a broad pyramid broken up by ridged noise reads as a rocky massif, not a smooth spike
        const da = Math.atan2(Math.sin(a - p.a), Math.cos(a - p.a));
        const r = Math.hypot(da / p.w, (t - p.t) / 0.32);
        const cone = Math.max(0, 1 - r);
        const jag = ridged(n, ca * 9 + t * 4, sa * 9 - t * 3, 3);
        h += Math.pow(cone, 1.25) * p.h * (0.55 + 0.3 * crest + 0.15 * jag);
      }
      // spurs and gullies running down the upper slopes: high frequency around the ring,
      // low frequency across it, so the ridges point down toward the valley
      const upper = smoothstep(0.12, 0.55, h / top);
      const spur = ridged(g2, ca * L.freq * 7 + t * 1.4, sa * L.freq * 7 - t * 0.9, 3);
      h += env * upper * L.amp * 0.09 * (spur - 0.35);
      pos[k * 3] = ca * rad;
      pos[k * 3 + 1] = h - 15;
      pos[k * 3 + 2] = sa * rad;
      c.copy(low).lerp(high, smoothstep(0.05, 0.35, h / top));
      col[k * 3] = c.r;
      col[k * 3 + 1] = c.g;
      col[k * 3 + 2] = c.b;
      k++;
    }
  }
  const idx = new Uint32Array(segs * rings * 6);
  let p = 0;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segs; i++) {
      const a = j * cols + i;
      idx[p++] = a;
      idx[p++] = a + cols;
      idx[p++] = a + 1;
      idx[p++] = a + 1;
      idx[p++] = a + cols;
      idx[p++] = a + cols + 1;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

function mountainMaterial(L: Layer) {
  return new THREE.ShaderMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    uniforms: {
      uSun: { value: SUN_DIR },
      uSky: { value: new THREE.Color(SKY.horizon) },
      uWarm: { value: new THREE.Color(ENV.haze.warm) },
      uWarmPower: { value: ENV.haze.warmPower },
      uHaze: { value: new THREE.Vector3(ENV.mountainHaze.start, ENV.mountainHaze.end, ENV.mountainHaze.max) },
      uRock: { value: new THREE.Color(L.rock) },
      uSnow: { value: L.snow - 15 },
    },
    vertexShader: /* glsl */ `
varying vec3 vColor;
varying vec3 vN;
varying vec3 vW;
void main(){
  vColor = color;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: /* glsl */ `
uniform vec3 uSun;
uniform vec3 uSky;
uniform vec3 uWarm;
uniform float uWarmPower;
uniform vec3 uHaze; // start, end, max
uniform vec3 uRock;
uniform float uSnow;
varying vec3 vColor;
varying vec3 vN;
varying vec3 vW;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

void main(){
  vec3 n = normalize(vN);
  if (n.y < 0.0) n = -n;
  float slope = 1.0 - n.y;
  float steep = smoothstep(0.28, 0.58, slope);
  float h = vW.y;
  float grain = fbm(vW.xz * 0.011);
  float fine = fbm(vW.xz * 0.045 + 17.0);

  // bare rock on steep faces, with faint strata bands
  vec3 col = mix(vColor, uRock, steep * 0.8);
  float strata = smoothstep(0.6, 0.95, sin(h * 0.17 + grain * 7.0) * 0.5 + 0.5);
  col *= 1.0 - steep * strata * 0.14;
  col *= 0.93 + 0.14 * fine;

  // snow settles on the gentler slopes; the line is ragged but its edge stays crisp
  float line = uSnow + (grain - 0.5) * 80.0 + steep * 42.0 - (1.0 - steep) * 18.0;
  float snow = smoothstep(line - 2.5, line + 2.5, h);

  // crisp two-tone light, the terminator broken up a little so it follows the rock
  vec3 L = normalize(uSun);
  float lit = smoothstep(0.02, 0.1, dot(n, L) + (fine - 0.5) * 0.14);
  vec3 c = mix(col * vec3(0.56, 0.63, 0.92), col * vec3(1.16, 1.09, 0.97), lit);
  c = mix(c, mix(vec3(0.72, 0.8, 0.96), vec3(1.0, 0.99, 0.96), lit), snow);
  c *= 0.94 + 0.08 * clamp(n.y, 0.0, 1.0);

  // warm rim along sunlit silhouettes
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 4.0) * lit;
  c += vec3(1.0, 0.9, 0.74) * rim * 0.16;

  float d = distance(cameraPosition, vW);
  float haze = smoothstep(uHaze.x, uHaze.y, d);
  // air is thinner higher up: summits stay crisper than the hazy foothills
  haze *= 1.0 - 0.35 * smoothstep(60.0, 380.0, h);
  float valley = 1.0 - smoothstep(-10.0, 150.0, h);
  haze = clamp(haze * 0.72 + valley * 0.2, 0.0, uHaze.z);
  // same warm glow toward the sun as the sky and the land's haze
  vec3 sunFlat = normalize(vec3(uSun.x, 0.0, uSun.z));
  vec3 dirFlat = normalize(vec3(vW.x - cameraPosition.x, 0.0, vW.z - cameraPosition.z) + 1e-5);
  float toSun = pow(max(dot(dirFlat, sunFlat), 0.0), uWarmPower);
  vec3 air = mix(uSky, uWarm, toSun * 0.55);
  gl_FragColor = vec4(mix(c, air, haze), 1.0);
  #include <colorspace_fragment>
}`,
  });
}

export function Mountains() {
  const layers = useMemo(() => LAYERS.map((L, i) => ({ geometry: layerGeometry(L, i), material: mountainMaterial(L) })), []);
  return (
    <>
      {layers.map((l, i) => (
        <mesh key={i} geometry={l.geometry} material={l.material} />
      ))}
    </>
  );
}
