import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { QUALITY, type Quality } from "./config";
import { structureColliders } from "./layout";
import { collidersFor, scatterPlants, scatterRocks, scatterTrees, type Collider, type Placement } from "./scatter";
import { GltfPines, GltfRocks, Undergrowth, WindClock, type PlantSet } from "./scene/Models";
import { FluffyTrees } from "./scene/FluffyTrees";
import { TownProps } from "./scene/TownProps";
import { createHeightTexture } from "./scene/heightmap";
import { Avatar } from "./scene/Avatar";
import { Explorer } from "./scene/Explorer";
import { VegetationPatch } from "./scene/Grass";
import { Markers } from "./scene/Markers";
import { Mountains } from "./scene/Mountains";
import { Cliffs } from "./scene/Cliffs";
import { insideMesa, mesaTrees } from "./cliffLayout";
import { PostFX } from "./scene/PostFX";
import "./scene/toonShading";
import { SKY, SUN_DIR, Sky } from "./scene/Sky";
import { Landmarks } from "./scene/structures/Landmarks";
import { StaticBatch } from "./scene/StaticBatch";
import { LakeTown } from "./scene/structures/LakeTown";
import { Village } from "./scene/structures/Village";
import { Terrain } from "./scene/Terrain";
import { Water } from "./scene/Water";
import { player, useWorld, worldStore } from "./store";
import { buildTerrainData, minimapImage, type TerrainData } from "./terrain";

interface Built {
  terrain: TerrainData;
  heightTex: THREE.DataTexture;
  trees: Placement[];
  rocks: Placement[];
  plants: PlantSet;
  colliders: Collider[];
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** Build the world in real steps, reporting genuine progress to the loading screen. */
function useWorldBuild(quality: Quality): Built | null {
  const [built, setBuilt] = useState<Built | null>(null);
  useEffect(() => {
    let cancelled = false;
    const q = QUALITY[quality];
    (async () => {
      const step = (progress: number, stage: string) => worldStore.set({ progress, stage, ready: false });
      setBuilt(null);
      step(0.2, "Shaping the land");
      await nextFrame();
      const terrain = buildTerrainData(q.segments);
      if (cancelled) return;
      step(0.45, "Charting the map");
      await nextFrame();
      worldStore.set({ minimap: minimapImage(terrain) });
      step(0.6, "Growing the forests");
      await nextFrame();
      const trees = [...scatterTrees(terrain, q.trees).filter((t) => !insideMesa(t.x, t.z)), ...mesaTrees()];
      const rocks = scatterRocks(terrain, q.rocks);
      const plants = scatterPlants(terrain, trees, q.trees / 200);
      step(0.75, "Raising the ruins");
      await nextFrame();
      const colliders = [...structureColliders(), ...collidersFor(trees, rocks)];
      const heightTex = createHeightTexture(terrain);
      if (cancelled) return;
      step(0.88, "Lighting the sky");
      await nextFrame();
      setBuilt({ terrain, heightTex, trees, rocks, plants, colliders });
    })();
    return () => {
      cancelled = true;
    };
  }, [quality]);
  return built;
}

/** The sun: casts shadows in a box that follows the explorer. */
function Sun({ shadows }: { shadows: number }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    scene.add(l.target);
    if (shadows) {
      l.shadow.mapSize.set(shadows, shadows);
      const cam = l.shadow.camera;
      cam.left = cam.bottom = -58;
      cam.right = cam.top = 58;
      cam.near = 10;
      cam.far = 420;
      l.shadow.bias = -0.0004;
      l.shadow.normalBias = 0.1;
    }
    return () => {
      scene.remove(l.target);
    };
  }, [scene, shadows]);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const sx = Math.round(player.x / 4) * 4;
    const sz = Math.round(player.z / 4) * 4;
    l.position.set(sx + SUN_DIR.x * 200, player.y + SUN_DIR.y * 200, sz + SUN_DIR.z * 200);
    l.target.position.set(sx, player.y, sz);
  });
  return <directionalLight ref={light} color="#ffeccc" intensity={3.1} castShadow={shadows > 0} />;
}

/** Tiny pollen motes drifting around the explorer. */
function Pollen({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      p[i * 3] = (Math.random() - 0.5) * 60;
      p[i * 3 + 1] = Math.random() * 10 + 0.5;
      p[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.set(player.x, player.y, player.z);
    if (animate) ref.current.rotation.y = clock.elapsedTime * 0.03;
  });
  return (
    <points ref={ref} geometry={geometry} userData={{ noReflect: true }}>
      <pointsMaterial color="#fff6c8" size={0.14} transparent opacity={0.75} depthWrite={false} />
    </points>
  );
}

/** Report real model download progress to the loading screen. */
function ModelProgress() {
  useEffect(() => {
    // Loader callbacks run outside React rendering, so updating the store here is safe.
    const mgr = THREE.DefaultLoadingManager;
    const previous = mgr.onProgress;
    worldStore.set({ progress: 0.9, stage: "Planting forests and village props" });
    mgr.onProgress = (_url, loaded, total) => {
      worldStore.set({ progress: 0.9 + (loaded / Math.max(1, total)) * 0.09 });
    };
    return () => {
      mgr.onProgress = previous;
    };
  }, []);
  return null;
}

function ReadySignal() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    worldStore.set({ ready: true, progress: 1, stage: "Ready" });
    document.documentElement.dataset.worldReady = "true";
  });
  return null;
}

export default function World() {
  const quality = useWorld((s) => s.quality);
  const reduced = useWorld((s) => s.reduced);
  const prefs = useWorld((s) => s.prefs);
  const q = QUALITY[quality];
  const built = useWorldBuild(quality);
  const [dpr, setDpr] = useState(q.dpr[1]);
  useEffect(() => setDpr(q.dpr[1]), [q.dpr]);
  const animate = !reduced;
  const post = quality !== "low";

  return (
    <Canvas
      key={quality}
      className="world-canvas"
      dpr={THREE.MathUtils.clamp(window.devicePixelRatio, q.dpr[0], dpr) * prefs.renderScale}
      shadows={q.shadows > 0 ? "percentage" : false}
      gl={{ antialias: q.antialias, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.5, far: 3200, position: [0, 30, 80] }}
      onCreated={({ gl }) => {
        // With post-processing the ToneMapping effect grades the final image instead.
        gl.toneMapping = post ? THREE.NoToneMapping : THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <fog attach="fog" args={[SKY.horizon, 160, 1500]} />
      {/* cool sky fill: everything out of the sun picks up a soft blue cast */}
      <hemisphereLight args={["#b9cdff", "#9aa874", 1.0]} />
      <ambientLight color="#dde6ff" intensity={0.12} />
      <Sun shadows={q.shadows} />
      <Sky clouds={quality === "low" ? 16 : 26} animate={animate} />
      <Mountains />
      {built && (
        <>
          <Terrain data={built.terrain} shadows={q.shadows > 0} />
          <Cliffs shadows={q.shadows > 0} />
          <Water heightTex={built.heightTex} n={built.terrain.n} reflect={quality === "high"} />
          <VegetationPatch heightTex={built.heightTex} n={built.terrain.n} count={q.grass} patch={quality === "low" ? 54 : 74} wind={animate ? 0.22 : 0} />
          <VegetationPatch heightTex={built.heightTex} n={built.terrain.n} count={q.flowers} patch={90} flowers wind={animate ? 0.08 : 0} />
          <WindClock animate={animate} />
          <FluffyTrees items={built.trees} shadows={q.shadows > 0} />
          <StaticBatch>
            <Landmarks lights={quality !== "low"} />
            <Village />
            <LakeTown />
          </StaticBatch>
          {prefs.markers && <Markers />}
          <Explorer colliders={built.colliders} />
          {animate && <Pollen animate={animate} />}
          <Suspense fallback={<ModelProgress />}>
            <GltfPines items={built.trees} shadows={q.shadows > 0} />
            <GltfRocks items={built.rocks} shadows={q.shadows > 0} />
            <Undergrowth plants={built.plants} shadows={q.shadows > 0} />
            <TownProps shadows={q.shadows > 0} />
            <Avatar shadows={q.shadows > 0} />
            {post && <PostFX multisampling={q.msaa} bloom={prefs.bloom} vignette={prefs.vignette} sharpen={prefs.sharpen} ao={prefs.ao} />}
            <ReadySignal />
          </Suspense>
        </>
      )}
    </Canvas>
  );
}
