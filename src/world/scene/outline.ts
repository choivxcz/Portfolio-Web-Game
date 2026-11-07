import * as THREE from "three";

/**
 * Anime-style ink outlines by the "inverted hull" method: a back-face copy of the
 * mesh, pushed outward in screen space so the line keeps the same pixel width at
 * any distance. Works for skinned (animated) and static meshes.
 *
 * The push direction uses normals averaged across hard edges (`outlineNormal`),
 * so corners don't split open.
 */

/** Line width as a fraction of the screen height (≈1.6 px at 900 px tall). */
export const OUTLINE_WIDTH = { value: 0.0018 };

export function outlineMaterial(color: THREE.ColorRepresentation, width = OUTLINE_WIDTH) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, fog: true });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = width;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec3 outlineNormal;\nuniform float uOutline;")
      .replace(
        "#include <project_vertex>",
        /* glsl */ `#include <project_vertex>
{
  vec3 oN = outlineNormal;
  #ifdef USE_SKINNING
    oN = ( skinMatrix * vec4( oN, 0.0 ) ).xyz;
  #endif
  #ifdef USE_INSTANCING
    oN = mat3( instanceMatrix ) * oN;
  #endif
  vec3 vN = normalize( normalMatrix * oN );
  vec2 dir = ( projectionMatrix * vec4( vN, 0.0 ) ).xy;
  float l = length( dir );
  if ( l > 1e-5 ) {
    dir /= l;
    // keep the width constant on screen: scale by w, correct for aspect ratio
    dir.x *= projectionMatrix[0][0] / projectionMatrix[1][1];
    gl_Position.xy += dir * uOutline * 2.0 * gl_Position.w;
  }
}`,
      );
  };
  return m;
}

/** Normals averaged over vertices that share a position (hard edges joined). */
export function addOutlineNormals(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute("outlineNormal")) return;
  const pos = geometry.getAttribute("position");
  const nor = geometry.getAttribute("normal");
  const sums = new Map<string, THREE.Vector3>();
  const keys: string[] = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const k = `${Math.round(p.x * 1e4)},${Math.round(p.y * 1e4)},${Math.round(p.z * 1e4)}`;
    keys.push(k);
    if (nor) n.fromBufferAttribute(nor, i);
    else n.set(0, 1, 0);
    const s = sums.get(k);
    if (s) s.add(n);
    else sums.set(k, n.clone());
  }
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const s = sums.get(keys[i])!;
    const len = s.length() || 1;
    out[i * 3] = s.x / len;
    out[i * 3 + 1] = s.y / len;
    out[i * 3 + 2] = s.z / len;
  }
  geometry.setAttribute("outlineNormal", new THREE.BufferAttribute(out, 3));
}

/** Adds an outline shell next to a mesh (sharing its geometry and skeleton). */
export function attachOutline(mesh: THREE.Mesh, material: THREE.Material) {
  addOutlineNormals(mesh.geometry);
  let shell: THREE.Mesh;
  if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
    const sk = mesh as THREE.SkinnedMesh;
    const s = new THREE.SkinnedMesh(sk.geometry, material);
    s.bind(sk.skeleton, sk.bindMatrix);
    s.bindMode = sk.bindMode;
    shell = s;
  } else {
    shell = new THREE.Mesh(mesh.geometry, material);
  }
  shell.name = `${mesh.name}_outline`;
  shell.position.copy(mesh.position);
  shell.quaternion.copy(mesh.quaternion);
  shell.scale.copy(mesh.scale);
  shell.frustumCulled = mesh.frustumCulled;
  shell.castShadow = false;
  shell.receiveShadow = false;
  shell.renderOrder = mesh.renderOrder;
  mesh.parent?.add(shell);
  return shell;
}
