import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const KEEP = new Set(["position", "normal", "uv"]);

/**
 * Merges every static mesh inside it that shares a material into one mesh,
 * cutting hundreds of draw calls (and shadow-pass draws) down to a few dozen.
 * Anything under an object with `userData.dynamic` (spinning blades, floating
 * crystals) is left untouched.
 */
export function StaticBatch({ children }: { children: ReactNode }) {
  const root = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const g = root.current;
    if (!g) return;
    g.updateWorldMatrix(true, true);
    const inv = g.matrixWorld.clone().invert();
    const buckets = new Map<THREE.Material, THREE.Mesh[]>();
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || Array.isArray(mesh.material)) return;
      for (let p: THREE.Object3D | null = o; p && p !== g; p = p.parent) if (p.userData.dynamic) return;
      const list = buckets.get(mesh.material) ?? [];
      list.push(mesh);
      buckets.set(mesh.material, list);
    });

    const added: THREE.Mesh[] = [];
    const hidden: THREE.Mesh[] = [];
    const rel = new THREE.Matrix4();
    for (const [material, meshes] of buckets) {
      if (meshes.length < 2) continue;
      const useColors = (material as THREE.MeshStandardMaterial).vertexColors === true;
      const geos = meshes.map((m) => {
        const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const k of Object.keys(geo.attributes)) if (!KEEP.has(k) && !(useColors && k === "color")) geo.deleteAttribute(k);
        if (useColors && !geo.attributes.color) geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
        if (!geo.attributes.normal) geo.computeVertexNormals();
        if (!geo.attributes.uv) geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
        geo.clearGroups();
        geo.applyMatrix4(rel.multiplyMatrices(inv, m.matrixWorld));
        return geo;
      });
      const merged = mergeGeometries(geos);
      geos.forEach((x) => x.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const batch = new THREE.Mesh(merged, material);
      batch.castShadow = meshes.some((m) => m.castShadow);
      batch.receiveShadow = meshes.some((m) => m.receiveShadow);
      g.add(batch);
      added.push(batch);
      for (const m of meshes) {
        m.visible = false;
        hidden.push(m);
      }
    }
    return () => {
      for (const b of added) {
        g.remove(b);
        b.geometry.dispose();
      }
      for (const m of hidden) m.visible = true;
    };
  }, []);

  return <group ref={root}>{children}</group>;
}
