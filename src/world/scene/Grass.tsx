import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../../utils/random";
import { player } from "../store";
import { HEIGHT_GLSL, heightUniforms } from "./heightmap";

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
      const w = 0.03 * (1 - y) ** 0.75;
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

/** A stem with two crossed petal quads on top. */
function flowerHead(): THREE.BufferGeometry {
  const pos = [
    -0.012, 0, 0, 0.012, 0, 0, -0.012, 0.32, 0, 0.012, 0.32, 0, // stem
    -0.09, 0.3, -0.09, 0.09, 0.3, 0.09, -0.09, 0.42, -0.09, 0.09, 0.42, 0.09,
    -0.09, 0.3, 0.09, 0.09, 0.3, -0.09, -0.09, 0.42, 0.09, 0.09, 0.42, -0.09,
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
attribute vec2 aOffset;
attribute vec4 aRand; // rotation, scale, tint, phase
varying float vY;
varying float vTint;
varying vec2 vWorld;
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
  p.x += sway * bendAmt;
  p.z += sway * bendAmt * 0.45;
  vec3 wp = vec3(world.x, field.x, world.y) + p;
  vY = position.y;
  vTint = aRand.z;
  vWorld = world;
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
uniform vec3 uBase;
uniform vec3 uTip;
uniform vec3 uGoldBase;
uniform vec3 uGoldTip;
varying float vY;
varying float vTint;
varying vec2 vWorld;
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash2(i), hash2(i+vec2(1,0)), f.x), mix(hash2(i+vec2(0,1)), hash2(i+vec2(1,1)), f.x), f.y); }
void main(){
  #ifdef FLOWER
  vec3 petals[4];
  petals[0] = vec3(1.0, 0.98, 0.92);
  petals[1] = vec3(1.0, 0.85, 0.3);
  petals[2] = vec3(0.98, 0.62, 0.72);
  petals[3] = vec3(0.62, 0.78, 1.0);
  vec3 col = vY > 0.7 ? petals[int(vTint * 3.99)] : vec3(0.3, 0.55, 0.22);
  #else
  float gm = smoothstep(0.6, 0.8, vnoise(vWorld * 0.018) * 0.7 + vnoise(vWorld * 0.061) * 0.3);
  vec3 col = mix(mix(uBase, uTip, smoothstep(0.0, 1.0, vY)), mix(uGoldBase, uGoldTip, smoothstep(0.0, 1.0, vY)), gm * 0.75);
  col *= 0.9 + vTint * 0.22;
  col *= 0.8 + 0.26 * vY;
  #endif
  // crisp cel edge on the shadow, tinted the same cool blue as shaded toon surfaces
  float sun = smoothstep(0.3, 0.7, getShadowMask());
  col *= mix(uShade, vec3(1.03, 1.01, 0.97), sun);
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
      rand[i * 4 + 1] = flowers ? 0.8 + r() * 0.5 : 0.24 + r() * 0.36;
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
        uBase: { value: new THREE.Color("#44702f") },
        uTip: { value: new THREE.Color("#a3bd5f") },
        uGoldBase: { value: new THREE.Color("#8d8436") },
        uGoldTip: { value: new THREE.Color("#e3cf6a") },
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
