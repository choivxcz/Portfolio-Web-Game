import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { LIGHT, applyTimeOfDay, resolveTime } from "./lighting";
import { EmissiveTune, LanternGlow } from "./scene/NightLights";
import { Wildlife } from "./scene/Wildlife";
import { FountainClock } from "./scene/structures/Fountain";
import { WaterSounds } from "./scene/WaterSounds";
import * as THREE from "three";
import { ENV, QUALITY, type Quality } from "./config";
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
import "./scene/atmosphere";
import { SKY, SUN_DIR, Sky } from "./scene/Sky";
import { Landmarks } from "./scene/structures/Landmarks";
import { StaticBatch } from "./scene/StaticBatch";
import { LakeTown } from "./scene/structures/LakeTown";
import { Ornaments } from "./scene/structures/Ornaments";
import { ornamentColliders } from "./ornaments";
import { Village } from "./scene/structures/Village";
import { Terrain } from "./scene/Terrain";
import { Water } from "./scene/Water";
import { Waterfall, nearWaterfall } from "./scene/Waterfall";
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
      // nothing scattered in the waterfall's path
      const trees = [...scatterTrees(terrain, q.trees).filter((t) => !insideMesa(t.x, t.z) && !nearWaterfall(t.x, t.z)), ...mesaTrees()];
      const rocks = scatterRocks(terrain, q.rocks).filter((r) => !nearWaterfall(r.x, r.z));
      const plants = scatterPlants(terrain, trees, q.trees / 200);
      step(0.75, "Raising the ruins");
      await nextFrame();
      const colliders = [...structureColliders(), ...ornamentColliders(), ...collidersFor(trees, rocks, plants.bushes)];
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
  return <directionalLight ref={light} color={LIGHT.p.sunColor} intensity={LIGHT.p.sunIntensity} castShadow={shadows > 0} />;
}

/**
 * A bright disc far along the sun's direction, following the camera: the source the
 * light-shaft effect traces rays from (it sits on the sky's own sun disc).
 */
function ShaftSource({ onReady }: { onReady: (m: THREE.Mesh) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (ref.current) onReady(ref.current);
  }, [onReady]);
  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position).addScaledVector(SUN_DIR, 1100);
  });
  return (
    <mesh ref={ref} frustumCulled={false} userData={{ noReflect: true }}>
      <sphereGeometry args={[28, 24, 12]} />
      <meshBasicMaterial color={LIGHT.p.sky.halo} fog={false} toneMapped={false} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}

/** Tiny pollen motes drifting around the explorer (fireflies at night). */
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
      {LIGHT.p.lanterns > 0.5 ? (
        <pointsMaterial color="#e6ff9a" size={0.2} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      ) : (
        <pointsMaterial color="#fff6c8" size={0.14} transparent opacity={0.75} depthWrite={false} />
      )}
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
  // the lighting is read as the scene builds, so it is applied before the canvas mounts,
  // and a change remounts the canvas (the built terrain is kept)
  const time = resolveTime(prefs.timeOfDay);
  useMemo(() => applyTimeOfDay(time), [time]);
  const [shaftSun, setShaftSun] = useState<THREE.Mesh | null>(null);
  const shafts = post && LIGHT.p.shafts > 0;

  return (
    <Canvas
      key={`${quality}-${time}`}
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
      {/* aerial perspective: see scene/atmosphere.ts for how this fog is drawn */}
      <fog attach="fog" args={[SKY.horizon, ENV.haze.start, ENV.haze.far]} />
      {/* cool sky fill: everything out of the sun picks up a soft blue cast */}
      <hemisphereLight args={LIGHT.p.hemi} />
      <ambientLight color={LIGHT.p.ambient[0]} intensity={LIGHT.p.ambient[1]} />
      {shafts && <ShaftSource onReady={setShaftSun} />}
      <Sun shadows={q.shadows} />
      <Sky clouds={quality === "low" ? 16 : 26} animate={animate} />
      <Mountains />
      {built && (
        <>
          <Terrain data={built.terrain} shadows={q.shadows > 0} />
          <Cliffs shadows={q.shadows > 0} />
          <Water heightTex={built.heightTex} n={built.terrain.n} reflect={quality === "high"} />
          <Waterfall animate={animate} />
          <VegetationPatch heightTex={built.heightTex} n={built.terrain.n} count={q.grass} patch={quality === "low" ? 54 : quality === "high" ? 92 : 80} wind={animate ? 0.22 : 0} />
          <VegetationPatch heightTex={built.heightTex} n={built.terrain.n} count={q.flowers} patch={90} flowers wind={animate ? 0.08 : 0} />
          <WindClock animate={animate} />
          <FluffyTrees items={built.trees} shadows={q.shadows > 0} />
          <StaticBatch>
            <Landmarks lights={quality !== "low"} />
            <Village />
            <LakeTown />
            <Ornaments />
          </StaticBatch>
          {prefs.markers && <Markers />}
          <Explorer colliders={built.colliders} />
          {animate && <Pollen animate={animate} />}
          <LanternGlow />
          <Wildlife animate={animate} />
          <FountainClock animate={animate} />
          <WaterSounds />
          <Suspense fallback={<ModelProgress />}>
            <GltfPines items={built.trees} shadows={q.shadows > 0} />
            <GltfRocks items={built.rocks} shadows={q.shadows > 0} />
            <Undergrowth plants={built.plants} shadows={q.shadows > 0} />
            <TownProps shadows={q.shadows > 0} />
            <Avatar shadows={q.shadows > 0} />
            {post && (
              <PostFX
                multisampling={q.msaa}
                bloom={prefs.bloom}
                vignette={prefs.vignette}
                sharpen={prefs.sharpen}
                ao={prefs.ao}
                shafts={shafts ? shaftSun : null}
              />
            )}
            <EmissiveTune />
            <ReadySignal />
          </Suspense>
        </>
      )}
    </Canvas>
  );
}
