import * as THREE from "three";
import { H_MIN, H_RANGE, packHeightTexture, type TerrainData } from "../terrain";
import { WORLD_SIZE } from "../config";

/** RGBA8 texture: R/G = 16-bit height, B = grass mask, A = flower mask. */
export function createHeightTexture(data: TerrainData): THREE.DataTexture {
  const tex = new THREE.DataTexture(packHeightTexture(data), data.n, data.n, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export const heightUniforms = (tex: THREE.DataTexture, n: number) => ({
  uHeight: { value: tex },
  uN: { value: n },
  uWorld: { value: WORLD_SIZE },
  uHMin: { value: H_MIN },
  uHRange: { value: H_RANGE },
});

/** GLSL helpers: manual bilinear sampling of the packed texture (works without float textures). */
export const HEIGHT_GLSL = /* glsl */ `
uniform sampler2D uHeight;
uniform float uN;
uniform float uWorld;
uniform float uHMin;
uniform float uHRange;
vec4 texelAt(vec2 cell){ return texture2D(uHeight, (cell + 0.5) / uN); }
float decodeH(vec4 t){ return (t.r * 65280.0 + t.g * 255.0) / 65535.0 * uHRange + uHMin; }
vec4 sampleField(vec2 xz){
  vec2 g = clamp((xz + uWorld * 0.5) / uWorld * (uN - 1.0), vec2(0.0), vec2(uN - 1.001));
  vec2 i = floor(g);
  vec2 f = g - i;
  vec4 a = texelAt(i);
  vec4 b = texelAt(i + vec2(1.0, 0.0));
  vec4 c = texelAt(i + vec2(0.0, 1.0));
  vec4 d = texelAt(i + vec2(1.0, 1.0));
  float h = mix(mix(decodeH(a), decodeH(b), f.x), mix(decodeH(c), decodeH(d), f.x), f.y);
  vec2 m = mix(mix(a.ba, b.ba, f.x), mix(c.ba, d.ba, f.x), f.y);
  return vec4(h, m.x, m.y, 0.0); // height, grass mask, flower mask
}
`;
