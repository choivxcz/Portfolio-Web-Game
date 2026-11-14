import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ENV } from "../config";
import { LIGHT } from "../lightState";
import { player } from "../store";
import { terrainHeight } from "../terrain";
import { rng } from "../../utils/random";
import { wind } from "./Models";

/**
 * Small signs of life: butterflies around the explorer, a flock of birds wheeling
 * high over the valley, and leaves drifting down. Each is one instanced mesh whose
 * wings flap (or leaves tumble) in the vertex shader; paths are updated on the CPU.
 * Counts and colours are in ENV.life (config.ts).
 */

/** Wrap a value into [-size/2, size/2]. */
const wrap = (v: number, size: number) => v - size * Math.round(v / size);

/** Wings spread along x, body along z, flat in the xz plane; a centre column of vertices is the hinge. */
function wingGeometry(span: number, length: number) {
  const g = new THREE.PlaneGeometry(span, length, 2, 1);
  g.rotateX(-Math.PI / 2);
  return g;
}

/** Flapping: vertices away from the hinge fold up and down. `uFlap` = beats per second (×2π). */
function flapMaterial(base: THREE.Material, flap: number, amp: number, phaseFromPosition = true) {
  base.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = wind;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime;").replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
#ifdef USE_INSTANCING
float ph = ${phaseFromPosition ? "dot(instanceMatrix[3].xyz, vec3(1.7, 0.3, 2.3))" : "0.0"};
#else
float ph = 0.0;
#endif
float side = sign(transformed.x);
float reach = abs(transformed.x);
float a = sin(uTime * ${flap.toFixed(2)} + ph) * ${amp.toFixed(2)};
transformed.y += reach * sin(a);
transformed.x = side * reach * cos(a);`,
    );
  };
  return base;
}

/** Butterfly wings: two rounded pairs with a dark edge, white so instance colour tints them. */
function butterflyTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 96;
  const x = c.getContext("2d")!;
  for (const s of [-1, 1]) {
    x.save();
    x.translate(64, 48);
    x.scale(s, 1);
    x.fillStyle = "#ffffff";
    x.strokeStyle = "rgba(40,30,40,0.8)";
    x.lineWidth = 4;
    x.beginPath();
    x.ellipse(28, -14, 30, 24, -0.4, 0, Math.PI * 2);
    x.fill();
    x.stroke();
    x.beginPath();
    x.ellipse(22, 20, 20, 17, 0.5, 0, Math.PI * 2);
    x.fill();
    x.stroke();
    x.fillStyle = "rgba(255,255,255,0.9)";
    x.beginPath();
    x.arc(36, -18, 6, 0, Math.PI * 2);
    x.fill();
    x.restore();
  }
  x.fillStyle = "#2a2028";
  x.fillRect(61, 18, 6, 58);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Butterflies({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geometry, material, homes } = useMemo(() => {
    const r = rng(404);
    const m = flapMaterial(new THREE.MeshBasicMaterial({ map: butterflyTexture(), alphaTest: 0.5, side: THREE.DoubleSide }), 16, 1.0);
    const homes = Array.from({ length: count }, () => ({
      ox: (r() - 0.5) * 44,
      oz: (r() - 0.5) * 44,
      rad: 1.5 + r() * 3,
      speed: 0.3 + r() * 0.4,
      phase: r() * 100,
      color: ENV.life.butterflies[Math.floor(r() * ENV.life.butterflies.length)],
    }));
    return { geometry: wingGeometry(0.42, 0.3), material: m, homes };
  }, [count]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new THREE.Color();
    homes.forEach((h, i) => mesh.setColorAt(i, c.set(h.color)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [homes]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    homes.forEach((h, i) => {
      // homes stay fixed in the world as you walk past, and wrap round to the far side
      // once they fall 22 m behind, so there are always butterflies nearby
      const ax = player.x + wrap(h.ox - player.x, 44);
      const az = player.z + wrap(h.oz - player.z, 44);
      const a = t * h.speed + h.phase;
      const x = ax + Math.cos(a) * h.rad + Math.sin(a * 2.3) * 0.6;
      const z = az + Math.sin(a * 1.3) * h.rad;
      const y = terrainHeight(x, z) + 0.7 + Math.sin(a * 3.1) * 0.35 + Math.sin(t * 7 + h.phase) * 0.05;
      const heading = Math.atan2(-Math.sin(a) * h.rad, Math.cos(a * 1.3) * h.rad * 1.3);
      q.setFromEuler(e.set(0.15, heading, 0));
      mesh.setMatrixAt(i, m.compose(v.set(x, y, z), q, one));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} userData={{ noReflect: true }} />;
}

function Birds({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geometry, material, flock } = useMemo(() => {
    const r = rng(77);
    const g = wingGeometry(1.6, 0.35);
    const m = flapMaterial(new THREE.MeshBasicMaterial({ color: ENV.life.birds, side: THREE.DoubleSide, fog: true }), 5, 0.55);
    const flock = Array.from({ length: count }, (_, i) => ({ lag: i * 0.035 + r() * 0.01, side: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 2.2, up: r() * 3 }));
    return { geometry: g, material: m, flock };
  }, [count]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime * 0.05;
    flock.forEach((b, i) => {
      // a loose V wheeling in a wide loop over the valley
      const a = t - b.lag;
      const cx = 10 + Math.cos(a) * 95;
      const cz = -40 + Math.sin(a * 1.4) * 70;
      const dx = -Math.sin(a) * 95;
      const dz = Math.cos(a * 1.4) * 98;
      const heading = Math.atan2(dx, dz);
      const px = cx + Math.cos(heading) * b.side;
      const pz = cz - Math.sin(heading) * b.side;
      q.setFromEuler(e.set(0, heading, Math.sin(a * 3) * 0.25));
      mesh.setMatrixAt(i, m.compose(v.set(px, 58 + b.up + Math.sin(a * 5) * 3, pz), q, one));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} userData={{ noReflect: true }} />;
}

/** A single pointed leaf silhouette (alpha mask). */
function leafShape() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 48;
  const x = c.getContext("2d")!;
  x.fillStyle = "#ffffff";
  x.beginPath();
  x.moveTo(4, 24);
  x.quadraticCurveTo(30, -2, 60, 24);
  x.quadraticCurveTo(30, 50, 4, 24);
  x.fill();
  return new THREE.CanvasTexture(c);
}

/** Leaves drifting down around the explorer, tumbling as they fall; recycled at the ground. */
function FallingLeaves({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const r = useMemo(() => rng(919), []);
  const { geometry, material, leaves } = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.14, 0.1);
    const m = new THREE.MeshToonMaterial({ side: THREE.DoubleSide, alphaMap: leafShape(), alphaTest: 0.5 });
    const leaves = Array.from({ length: count }, () => ({ x: 0, y: -1, z: 0, vy: 0, spin: 0, phase: 0 }));
    return { geometry: g, material: m, leaves };
  }, [count]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new THREE.Color();
    leaves.forEach((_, i) => mesh.setColorAt(i, c.set(ENV.life.leaves[i % ENV.life.leaves.length])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leaves]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const hidden = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  useFrame(({ clock, camera }, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    const step = Math.min(dt, 0.05);
    const cam = camera.position;
    leaves.forEach((l, i) => {
      if (l.y < terrainHeight(l.x, l.z) || Math.hypot(l.x - player.x, l.z - player.z) > 30) {
        // respawn high up somewhere around the explorer
        l.x = player.x + (r() - 0.5) * 50;
        l.z = player.z + (r() - 0.5) * 50;
        l.y = terrainHeight(l.x, l.z) + 4 + r() * 6;
        l.vy = 0.5 + r() * 0.5;
        l.spin = 1 + r() * 2;
        l.phase = r() * 10;
      }
      l.y -= l.vy * step;
      l.x += (Math.sin(t * 0.9 + l.phase) * 0.6 + ENV.wind.speed[0]) * step;
      l.z += (Math.cos(t * 0.7 + l.phase) * 0.4 + ENV.wind.speed[1]) * step;
      q.setFromEuler(e.set(t * l.spin + l.phase, t * l.spin * 0.6, Math.sin(t * 2 + l.phase)));
      // a leaf brushing past the lens would fill the screen: hide it while it is that close
      const near = Math.hypot(l.x - cam.x, l.y - cam.y, l.z - cam.z) < 3;
      mesh.setMatrixAt(i, m.compose(v.set(l.x, l.y, l.z), q, near ? hidden : one));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} castShadow={false} userData={{ noReflect: true }} />;
}

/** Wildlife for the current time of day: butterflies and birds by day, leaves always. */
export function Wildlife({ animate }: { animate: boolean }) {
  if (!animate) return null;
  const day = LIGHT.p.stars < 0.5;
  return (
    <>
      {day && <Butterflies count={ENV.life.butterflyCount} />}
      {day && <Birds count={ENV.life.birdCount} />}
      <FallingLeaves count={ENV.life.leafCount} />
    </>
  );
}
