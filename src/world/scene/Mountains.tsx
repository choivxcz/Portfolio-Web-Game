import { useMemo } from "react";
import * as THREE from "three";
import { createNoise, fbm, ridged, smoothstep } from "../noise";
import { SKY, SUN_DIR } from "./Sky";

/**
 * Three layered mountain ranges around the valley, drawn with a stylized shader:
 * two-tone cel shading (sunlit faces / cool blue shadow faces), snow caps, and
 * strong aerial perspective that fades each layer into the sky's horizon colour.
 */
interface Layer {
  r0: number;
  r1: number;
  base: number;
  amp: number;
  freq: number;
  seed: number;
  low: string;
  rock: string;
  snow: number;
}

const LAYERS: Layer[] = [
  { r0: 430, r1: 690, base: 18, amp: 200, freq: 2.2, seed: 11, low: "#86a77f", rock: "#93a5c0", snow: 190 },
  { r0: 650, r1: 1010, base: 28, amp: 290, freq: 1.8, seed: 23, low: "#91a8c6", rock: "#9cb0cd", snow: 290 },
  { r0: 970, r1: 1420, base: 40, amp: 350, freq: 1.4, seed: 37, low: "#a8bcd9", rock: "#aabedb", snow: 300 },
];

/** Prominent snowy peaks: direction (x = cos a, z = sin a), layer, position across it, height, width. */
const PEAKS = [
  { a: -Math.PI / 2 - 0.45, layer: 1, t: 0.5, h: 380, w: 0.17 },
  { a: 0.35, layer: 1, t: 0.5, h: 330, w: 0.16 },
  { a: 2.45, layer: 2, t: 0.45, h: 400, w: 0.18 },
  { a: -0.95, layer: 2, t: 0.5, h: 340, w: 0.15 },
  { a: 1.35, layer: 0, t: 0.55, h: 210, w: 0.13 },
];

function layerGeometry(L: Layer, index: number) {
  const n = createNoise(L.seed);
  const m = createNoise(L.seed + 100);
  const segs = 960;
  const rings = 28;
  const cols = segs + 1;
  const pos = new Float32Array(cols * (rings + 1) * 3);
  const col = new Float32Array(cols * (rings + 1) * 3);
  const low = new THREE.Color(L.low);
  const rock = new THREE.Color(L.rock);
  const snow = new THREE.Color("#f2f6fb");
  const c = new THREE.Color();
  const peaks = PEAKS.filter((p) => p.layer === index);
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
      pos[k * 3] = ca * rad;
      pos[k * 3 + 1] = h - 15;
      pos[k * 3 + 2] = sa * rad;
      c.copy(low).lerp(rock, smoothstep(0.06, 0.3, h / (L.base + L.amp)));
      const line = L.snow + fbm(n, ca * 9, sa * 9, 2) * 30;
      c.lerp(snow, smoothstep(line - 10, line + 28, h));
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

function mountainMaterial() {
  return new THREE.ShaderMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    uniforms: {
      uSun: { value: SUN_DIR },
      uSky: { value: new THREE.Color(SKY.horizon) },
      uHaze: { value: new THREE.Vector2(260, 1500) },
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
uniform vec2 uHaze;
varying vec3 vColor;
varying vec3 vN;
varying vec3 vW;
void main(){
  vec3 n = normalize(vN);
  if (n.y < 0.0) n = -n;
  float l = dot(n, normalize(uSun)) * 0.5 + 0.5;
  float lit = smoothstep(0.55, 0.6, l);
  vec3 col = vColor * mix(vec3(0.5, 0.57, 0.86), vec3(1.16, 1.1, 0.98), lit);
  col *= 0.93 + 0.1 * clamp(n.y, 0.0, 1.0);
  float d = distance(cameraPosition, vW);
  float haze = smoothstep(uHaze.x, uHaze.y, d);
  // air is thinner higher up: summits stay crisper than the hazy foothills
  haze *= 1.0 - 0.32 * smoothstep(60.0, 380.0, vW.y);
  float valley = 1.0 - smoothstep(-10.0, 150.0, vW.y);
  haze = clamp(haze * 0.8 + valley * 0.3, 0.0, 0.9);
  gl_FragColor = vec4(mix(col, uSky, haze), 1.0);
  #include <colorspace_fragment>
}`,
  });
}

export function Mountains() {
  const geometries = useMemo(() => LAYERS.map((L, i) => layerGeometry(L, i)), []);
  const material = useMemo(() => mountainMaterial(), []);
  return (
    <>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} material={material} />
      ))}
    </>
  );
}
