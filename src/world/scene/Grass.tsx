import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../../utils/random";
import { ENV } from "../config";
import { LIGHT } from "../lightState";
import { player } from "../store";
import { HEIGHT_GLSL, heightUniforms } from "./heightmap";
import { SUN_DIR } from "./Sky";

/** A clump of three tapered, slightly curved blades (unit height). */
function bladeClump(): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const seg = 4;
  for (let b = 0; b < 4; b++) {
    const a = (b / 4) * Math.PI * 2 + 0.4;
    const ox = Math.cos(a) * 0.07;
    const oz = Math.sin(a) * 0.07;
    const base = pos.length / 3;
    for (let s = 0; s <= seg; s++) {
      const y = s / seg;
      const w = 0.035 * (1 - y) ** 0.75;
      const bend = y * y * 0.18;
      const dx = Math.cos(a) * bend;
      const dz = Math.sin(a) * bend;
      pos.push(ox + dx - Math.sin(a) * w, y, oz + dz + Math.cos(a) * w);
      pos.push(ox + dx + Math.sin(a) * w, y, oz + dz - Math.cos(a) * w);
    }
    for (let s = 0; s < seg; s++) {
      const i = base + s * 2;
      idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/**
 * A flower: two crossed stem cards and a flat, slightly tilted head. The fragment
 * shader cuts the head into five rounded petals around a golden centre.
 */
export const FLOWER_HEAD_Y = 0.34;
function flowerHead(): THREE.BufferGeometry {
  const h = FLOWER_HEAD_Y;
  const s = 0.14; // half-size of the head
  const pos = [
    -0.012, 0, 0, 0.012, 0, 0, -0.012, h, 0, 0.012, h, 0, // stem
    0, 0, -0.012, 0, 0, 0.012, 0, h, -0.012, 0, h, 0.012,
    -s, h - 0.03, -s, s, h + 0.03, -s, -s, h - 0.03, s, s, h + 0.03, s, // head, tilted a little
  ];
  const idx = [0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

const VERT = /* glsl */ `
#include <common>
#include <shadowmap_pars_vertex>
${HEIGHT_GLSL}
#include <fog_pars_vertex>
uniform float uTime;
uniform float uWind;
uniform float uPatch;
uniform vec2 uCenter;
uniform vec4 uGust; // scale, drift x, drift z, extra bend
attribute vec2 aOffset;
attribute vec4 aRand; // rotation, scale, tint, phase
varying float vGust;
float ghash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(ghash(i), ghash(i+vec2(1,0)), f.x), mix(ghash(i+vec2(0,1)), ghash(i+vec2(1,1)), f.x), f.y); }
varying float vY;
varying float vTint;
varying vec2 vWorld;
varying vec3 vLocal;
varying float vBack;
uniform vec3 uSun;
void main(){
  vec2 rel = mod(aOffset * uPatch - uCenter + uPatch * 0.5, uPatch) - uPatch * 0.5;
  vec2 world = uCenter + rel;
  vec4 field = sampleField(world);
  #ifdef FLOWER
  float mask = field.z;
  #else
  float mask = field.y;
  #endif
  float fade = 1.0 - smoothstep(0.72, 1.0, length(rel) / (uPatch * 0.5));
  float s = aRand.y * smoothstep(0.25, 0.75, mask) * fade;
  float c = cos(aRand.x);
  float sn = sin(aRand.x);
  vec3 p = position;
  p.xz = vec2(p.x * c - p.z * sn, p.x * sn + p.z * c);
  p.y *= s;
  p.xz *= 0.6 + 0.6 * s;
  float sway = sin(uTime * 1.6 + world.x * 0.21 + world.y * 0.17 + aRand.w * 6.28) * 0.6 + sin(uTime * 0.7 + world.x * 0.05) * 0.4;
  float bendAmt = position.y * position.y * uWind * s;
  // gusts: broad bands drifting downwind; inside one the blades lean further over
  vec2 gp = world * uGust.x - uTime * uGust.yz;
  float gust = smoothstep(0.55, 0.85, gnoise(gp) * 0.7 + gnoise(gp * 2.3 + 5.1) * 0.3) * step(0.0001, uWind);
  vGust = gust;
  vec2 downwind = normalize(uGust.yz + 1e-5);
  p.xz += downwind * gust * uGust.w * position.y * position.y * s;
  p.x += sway * bendAmt;
  p.z += sway * bendAmt * 0.45;
  vec3 wp = vec3(world.x, field.x, world.y) + p;
  vY = position.y;
  vTint = aRand.z;
  vWorld = world;
  vLocal = position;
  // looking toward the sun through the blades: their tips glow
  vec3 toFrag = normalize(wp - cameraPosition);
  float back = max(dot(toFrag, normalize(uSun)), 0.0);
  vBack = back * back * back;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  // sun shadows from trees and buildings fall across the blades
  vec4 worldPosition = vec4(wp, 1.0);
  #include <shadowmap_vertex>
  #include <fog_vertex>
}`;

const FRAG = /* glsl */ `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <fog_pars_fragment>
uniform vec3 uShade;
varying vec3 vLocal;
varying float vBack;
uniform vec3 uBase;
uniform vec3 uTip;
uniform vec3 uGoldBase;
uniform vec3 uGoldTip;
uniform float uGustShine;
uniform vec3 uTint; // time of day
varying float vGust;
varying float vY;
varying float vTint;
varying vec2 vWorld;
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash2(i), hash2(i+vec2(1,0)), f.x), mix(hash2(i+vec2(0,1)), hash2(i+vec2(1,1)), f.x), f.y); }
void main(){
  #ifdef FLOWER
  vec3 petals[6];
  petals[0] = vec3(1.0, 0.98, 0.93);  // white
  petals[1] = vec3(1.0, 0.84, 0.32);  // buttercup
  petals[2] = vec3(0.98, 0.6, 0.72);  // pink
  petals[3] = vec3(0.6, 0.76, 1.0);   // sky blue
  petals[4] = vec3(0.78, 0.62, 0.98); // lilac
  petals[5] = vec3(1.0, 0.62, 0.45);  // coral
  vec3 col;
  if (vY > ${(0.34 - 0.04).toFixed(2)} && abs(vLocal.x) + abs(vLocal.z) > 0.02) {
    // five rounded petals around a golden centre
    vec2 q = vLocal.xz / 0.14;
    float r = length(q);
    float ang = atan(q.y, q.x) + vTint * 6.28;
    float edge = 0.6 + 0.4 * abs(cos(ang * 2.5));
    if (r > edge) discard;
    vec3 petal = petals[int(vTint * 5.99)];
    col = mix(petal * 0.82, petal, smoothstep(0.2, 0.8, r / edge));
    col = mix(vec3(1.0, 0.72, 0.18), col, smoothstep(0.16, 0.24, r));
  } else {
    col = mix(vec3(0.2, 0.42, 0.16), vec3(0.36, 0.62, 0.26), vY / 0.34);
  }
  #else
  float gm = smoothstep(0.6, 0.8, vnoise(vWorld * 0.018) * 0.7 + vnoise(vWorld * 0.061) * 0.3);
  vec3 col = mix(mix(uBase, uTip, smoothstep(0.0, 1.0, vY)), mix(uGoldBase, uGoldTip, smoothstep(0.0, 1.0, vY)), gm * 0.75);
  col *= 0.9 + vTint * 0.22;
  col *= 0.8 + 0.26 * vY;
  // broad patches of fresher yellow-green and cooler blue-green across the meadow
  float hueN = vnoise(vWorld * 0.03 + 11.0) * 0.65 + vnoise(vWorld * 0.09) * 0.35;
  col *= mix(vec3(0.9, 1.0, 1.06), vec3(1.1, 1.06, 0.84), smoothstep(0.25, 0.75, hueN));
  // a passing gust turns the blades so their pale undersides catch the light
  col += (col * 0.65 + vec3(0.18, 0.2, 0.1)) * vGust * smoothstep(0.2, 1.0, vY) * uGustShine;
  #endif
  // crisp cel edge on the shadow, tinted the same cool blue as shaded toon surfaces
  float sun = smoothstep(0.3, 0.7, getShadowMask());
  col *= mix(uShade, vec3(1.03, 1.01, 0.97), sun);
  // back-lit tips glow warm where the sun reaches them
  col += col * vec3(0.55, 0.5, 0.12) * vBack * smoothstep(0.3, 1.0, vY) * sun;
  col *= uTint;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

interface PatchProps {
  heightTex: THREE.DataTexture;
  n: number;
  count: number;
  patch: number;
  flowers?: boolean;
  wind: number;
}

export function VegetationPatch({ heightTex, n, count, patch, flowers = false, wind }: PatchProps) {
  const { geometry, material } = useMemo(() => {
    const base = flowers ? flowerHead() : bladeClump();
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute("position", base.getAttribute("position"));
    const r = rng(flowers ? 77 : 33);
    const offsets = new Float32Array(count * 2);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      offsets[i * 2] = r();
      offsets[i * 2 + 1] = r();
      rand[i * 4] = r() * Math.PI * 2;
      rand[i * 4 + 1] = flowers ? 0.8 + r() * 0.5 : 0.3 + r() * 0.45;
      rand[i * 4 + 2] = r();
      rand[i * 4 + 3] = r();
    }
    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 2));
    g.setAttribute("aRand", new THREE.InstancedBufferAttribute(rand, 4));
    g.instanceCount = count;
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.DoubleSide,
      fog: true,
      lights: true,
      defines: flowers ? { FLOWER: "" } : {},
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.lights),
        uShade: { value: new THREE.Color(0.58, 0.65, 0.9) },
        ...heightUniforms(heightTex, n),
        uTime: { value: 0 },
        uWind: { value: wind },
        uPatch: { value: patch },
        uCenter: { value: new THREE.Vector2() },
        uBase: { value: new THREE.Color(ENV.palette.grassBase) },
        uTip: { value: new THREE.Color(ENV.palette.grassTip) },
        uGoldBase: { value: new THREE.Color(ENV.palette.goldBase) },
        uGoldTip: { value: new THREE.Color(ENV.palette.goldTip) },
        uGust: { value: new THREE.Vector4(ENV.wind.scale, ENV.wind.speed[0], ENV.wind.speed[1], flowers ? ENV.wind.strength * 0.4 : ENV.wind.strength) },
        uGustShine: { value: ENV.wind.shine },
        uTint: { value: new THREE.Color(LIGHT.p.tint) },
        uSun: { value: SUN_DIR },
      },
    });
    return { geometry: g, material: m };
  }, [heightTex, n, count, patch, flowers, wind]);

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
    material.uniforms.uCenter.value.set(player.x, player.z);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} receiveShadow userData={{ noReflect: true }} />;
}
