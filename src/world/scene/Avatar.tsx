import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { player, useWorld, worldStore } from "../store";
import { HERO } from "../config";
import { buildHero, heroClips } from "./hero";
import { attachOutline, outlineMaterial } from "./outline";
import { withRim } from "./toonShading";

/**
 * The explorer: the original hero (scene/hero.ts, built on the KayKit rig) or a CC0
 * KayKit adventurer (see public/models/CREDITS.md), drawn with the world's cel
 * shading, a rim light and an ink outline, and animated from movement.
 */
const BASE = `${import.meta.env.BASE_URL}models/characters/`;
export const CHARACTERS = {
  hero: { url: `${BASE}ranger.glb`, label: "Hero", ink: "#2a1f2a" },
  ranger: { url: `${BASE}ranger.glb`, label: "Ranger", ink: "#3b2a2e" },
  mage: { url: `${BASE}mage.glb`, label: "Mage", ink: "#2c2840" },
} as const;
export type CharacterId = keyof typeof CHARACTERS;

const HEIGHT = 1.75; // metres, feet to top of head
type Clip = "Idle" | "Walking_A" | "Running_A" | "Jump_Start" | "Jump_Idle" | "Jump_Land" | "Interact" | "Cheer";

export function Avatar({ shadows }: { shadows: boolean }) {
  const id = useWorld((s) => s.prefs.character);
  const outlines = useWorld((s) => s.prefs.outlines);
  const spec = CHARACTERS[id] ?? CHARACTERS.hero;
  const isHero = id === "hero" || !CHARACTERS[id];
  const gltf = useGLTF(spec.url);
  const group = useRef<THREE.Group>(null);

  // Toon materials + outline shells on a private copy of the model
  const { root, shells, cape } = useMemo(() => {
    const root = cloneSkinned(gltf.scene);
    if (isHero) {
      const hero = buildHero(root, shadows);
      root.traverse((o) => (o.frustumCulled = false)); // animated: the rest-pose bounds don't follow the pose
      fitHeight(root);
      return { root, shells: hero.shells, cape: hero.cape };
    }
    const ink = outlineMaterial(spec.ink);
    const shells: THREE.Object3D[] = [];
    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    for (const mesh of meshes) {
      const src = mesh.material as THREE.MeshStandardMaterial;
      if (src.map) {
        src.map.colorSpace = THREE.SRGBColorSpace;
        src.map.anisotropy = 8;
      }
      const m = withRim(
        new THREE.MeshToonMaterial({
          color: src.color.clone().multiplyScalar(1.08),
          map: src.map,
          // a little self-light so the shaded side stays soft and readable, like a lit character
          emissive: new THREE.Color("#2a2433"),
        }),
      );
      m.defines = { ...m.defines, TOON_SOFTNESS: "0.02" };
      mesh.material = m;
      mesh.castShadow = shadows;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false; // animated: the bind-pose bounds don't follow the pose
      shells.push(attachOutline(mesh, ink));
    }
    fitHeight(root);
    return { root, shells, cape: null };
  }, [gltf.scene, spec.ink, shadows, isHero]);

  useEffect(() => {
    shells.forEach((s) => (s.visible = outlines));
  }, [shells, outlines]);

  // Animation
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  const clips = useMemo(() => (isHero ? heroClips(gltf.animations) : gltf.animations), [gltf.animations, isHero]);
  const actions = useMemo(() => {
    const map = new Map<Clip, THREE.AnimationAction>();
    for (const clip of clips) map.set(clip.name as Clip, mixer.clipAction(clip));
    for (const name of ["Jump_Start", "Jump_Land", "Interact", "Cheer"] as Clip[]) {
      const a = map.get(name);
      if (a) {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
    }
    return map;
  }, [clips, mixer]);
  const state = useRef<{ cur: Clip | null; lock: number; wasAir: boolean }>({ cur: null, lock: 0, wasAir: false });

  const play = (name: Clip, fade = 0.18, lockFor = 0) => {
    const st = state.current;
    const next = actions.get(name);
    if (!next || st.cur === name) return;
    const prev = st.cur ? actions.get(st.cur) : undefined;
    next.reset().setEffectiveWeight(1).fadeIn(fade).play();
    prev?.fadeOut(fade);
    st.cur = name;
    st.lock = lockFor;
  };

  // A small gesture when a landmark opens
  useEffect(() => {
    let last = worldStore.get().panel;
    return worldStore.subscribe(() => {
      const p = worldStore.get().panel;
      if (p && p !== last) play("Interact", 0.15, 1.1);
      last = p;
    });
  }, [actions]);

  useEffect(() => () => void mixer.stopAllAction(), [mixer]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const g = group.current;
    if (!g) return;
    g.position.set(player.x, player.y, player.z);
    g.rotation.y = player.facing;

    const st = state.current;
    const inAir = player.air > 0.05;
    st.lock = Math.max(0, st.lock - dt);
    if (inAir) {
      if (!st.wasAir) play("Jump_Start", 0.08, 0.25);
      else if (st.lock === 0) play("Jump_Idle", 0.2);
    } else if (st.wasAir) {
      play("Jump_Land", 0.06, player.speed > 2 ? 0.12 : 0.35);
    } else if (st.lock === 0) {
      const v = player.speed;
      if (v > 3.2) play("Running_A", 0.2);
      else if (v > 0.4) play("Walking_A", 0.2);
      else play("Idle", 0.3);
    }
    st.wasAir = inAir;

    // match the stride to the ground speed so the feet don't slide
    const run = actions.get("Running_A");
    // (the hero's longer legs cover more ground per step)
    const stride = isHero ? HERO.stride : { run: 7, walk: 2.2 };
    if (run) run.timeScale = THREE.MathUtils.clamp(player.speed / stride.run, isHero ? 0.55 : 0.8, 1.9);
    const walk = actions.get("Walking_A");
    if (walk) walk.timeScale = THREE.MathUtils.clamp(player.speed / stride.walk, isHero ? 0.45 : 0.6, 1.6);

    // the cape streams out behind with speed and lifts when airborne
    if (cape) {
      const target = Math.min(1, player.speed / 8 + (inAir ? 0.5 : 0)) * HERO.capeLift;
      const flutter = Math.sin(clock.elapsedTime * (3 + player.speed)) * 0.04 * (0.3 + target);
      cape.rotation.x = THREE.MathUtils.damp(cape.rotation.x, target + flutter, 6, dt);
    }

    mixer.update(dt);
  });

  return (
    <group ref={group}>
      <primitive object={root} />
      <BlobShadow />
    </group>
  );
}

/** Scale a character to a consistent height, feet on the ground. */
function fitHeight(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root);
  const s = HEIGHT / Math.max(0.01, box.max.y - box.min.y);
  root.scale.setScalar(s);
  root.position.y = -box.min.y * s;
}

/** Soft contact shadow under the feet (reads well even when sun shadows are off). */
function BlobShadow() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(40,40,70,0.55)");
    g.addColorStop(1, "rgba(40,40,70,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    // stays on the ground while jumping, shrinking with height
    m.position.y = -player.air + 0.04;
    const k = 1 / (1 + player.air * 0.4);
    m.scale.setScalar(k);
    (m.material as THREE.MeshBasicMaterial).opacity = k;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <circleGeometry args={[0.55, 24]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

Object.values(CHARACTERS).forEach((c) => useGLTF.preload(c.url));
