import { useMemo } from "react";
import * as THREE from "three";
import { WORLD_SIZE } from "../config";
import type { TerrainData } from "../terrain";

/** The ground: one indexed grid mesh with painted vertex colours. */
export function Terrain({ data, shadows }: { data: TerrainData; shadows: boolean }) {
  const geometry = useMemo(() => {
    const { n, heights, colors } = data;
    const step = WORLD_SIZE / (n - 1);
    const positions = new Float32Array(n * n * 3);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        positions[k * 3] = -WORLD_SIZE / 2 + i * step;
        positions[k * 3 + 1] = heights[k];
        positions[k * 3 + 2] = -WORLD_SIZE / 2 + j * step;
      }
    }
    const index = new Uint32Array((n - 1) * (n - 1) * 6);
    let p = 0;
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const a = j * n + i;
        const b = a + 1;
        const c = a + n;
        const d = c + 1;
        index[p++] = a;
        index[p++] = c;
        index[p++] = b;
        index[p++] = b;
        index[p++] = c;
        index[p++] = d;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setIndex(new THREE.BufferAttribute(index, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, [data]);

  const material = useMemo(() => {
    const m = new THREE.MeshToonMaterial({ vertexColors: true });
    // wide terminator: hills shade gradually, cast shadows still get crisp cel edges
    m.defines = { ...m.defines, TOON_SOFTNESS: "0.32" };
    // Painterly mottling: break up flat colour with soft world-space noise.
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vWorldPos;
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash2(i), hash2(i+vec2(1,0)), f.x), mix(hash2(i+vec2(0,1)), hash2(i+vec2(1,1)), f.x), f.y); }`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
float mott = vnoise(vWorldPos.xz * 0.35) * 0.6 + vnoise(vWorldPos.xz * 1.7) * 0.4;
diffuseColor.rgb *= 0.92 + mott * 0.14;
float tpatch = vnoise(vWorldPos.xz * 0.035) * 0.65 + vnoise(vWorldPos.xz * 0.11) * 0.35;
diffuseColor.rgb *= mix(vec3(0.9, 0.95, 0.86), vec3(1.07, 1.04, 0.93), tpatch);
float gm = smoothstep(0.6, 0.8, vnoise(vWorldPos.xz * 0.018) * 0.7 + vnoise(vWorldPos.xz * 0.061) * 0.3);
float greenness = smoothstep(0.0, 0.08, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));
// golden meadows only on gentle ground (never on cliff faces)
float flatness = smoothstep(0.82, 0.94, dot(normalize(vNormal), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.42, 0.1) * (0.9 + mott * 0.2), gm * greenness * flatness * 0.55);
// bare rock (grey, unsaturated ground): layered strata with dark crack lines, so slopes read as stone
// rock colours are the only blue-leaning ground (grass is green-led, sand and dirt red-led); snow is excluded
float rock = smoothstep(0.0, 0.03, diffuseColor.b - max(diffuseColor.r, diffuseColor.g) * 0.98) * (1.0 - smoothstep(0.72, 0.84, diffuseColor.g));
float warp = vnoise(vWorldPos.xz * 0.18) * 1.2 + vnoise(vWorldPos.xz * 0.6) * 0.3;
float layer = fract(vWorldPos.y * 0.42 + warp);
float crack = 1.0 - smoothstep(0.0, 0.06, layer) * (1.0 - smoothstep(0.94, 1.0, layer));
float band = vnoise(vec2(vWorldPos.y * 0.42 + warp, 3.7));
vec3 stone = diffuseColor.rgb * (0.86 + band * 0.22) * mix(vec3(1.0), vec3(0.66, 0.7, 0.82), crack * 0.8);
diffuseColor.rgb = mix(diffuseColor.rgb, stone, rock);`,
        );
    };
    return m;
  }, []);

  return <mesh geometry={geometry} material={material} receiveShadow={shadows} />;
}
