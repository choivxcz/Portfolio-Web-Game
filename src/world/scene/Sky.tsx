import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { rng } from "../../utils/random";
import { ENV } from "../config";

export const SUN_DIR = new THREE.Vector3(0.55, 0.72, 0.42).normalize();
/** Sky colours. The horizon is the haze colour, so distant land melts into the sky. */
export const SKY = { top: ENV.sky.top, mid: ENV.sky.mid, horizon: ENV.haze.color, bottom: ENV.sky.bottom };

function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uTop: { value: new THREE.Color(SKY.top) },
          uMid: { value: new THREE.Color(SKY.mid) },
          uHorizon: { value: new THREE.Color(SKY.horizon) },
          uBottom: { value: new THREE.Color(SKY.bottom) },
          uWarm: { value: new THREE.Color(ENV.haze.warm) },
          uHalo: { value: new THREE.Color(ENV.sky.sunHalo) },
          uWarmPower: { value: ENV.haze.warmPower },
          uSun: { value: SUN_DIR },
        },
        vertexShader: `varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uBottom; uniform vec3 uWarm; uniform vec3 uHalo;
uniform float uWarmPower; uniform vec3 uSun; varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  // three bands: pale horizon, clear mid-blue, deep zenith
  float a = clamp(h, 0.0, 1.0);
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.32, pow(a, 0.75)));
  col = mix(col, uTop, smoothstep(0.18, 0.85, a));
  // the horizon warms toward the sun, matching the haze on the land (atmosphere.ts)
  vec3 sunFlat = normalize(vec3(uSun.x, 0.0, uSun.z));
  float toSun = pow(max(dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), sunFlat), 0.0), uWarmPower);
  col = mix(col, uWarm, toSun * 0.55 * (1.0 - smoothstep(0.0, 0.3, a)));
  col = mix(col, uBottom, smoothstep(0.0, -0.3, h));
  float s = max(dot(d, uSun), 0.0);
  // sun disc, a soft halo and a wide glow
  col += uHalo * (pow(s, 1400.0) * 4.0 + pow(s, 90.0) * 0.4 + pow(s, 12.0) * 0.16 + pow(s, 3.0) * 0.06);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`,
      }),
    [],
  );
  return (
    <mesh material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[1500, 32, 16]} />
    </mesh>
  );
}

/**
 * Paint a soft cumulus: dozens of overlapping puffs, each lit from above with a
 * radial gradient (bright crown, pale mid-tone, cool blue-grey underside), then a
 * shading pass that darkens toward a flat, slightly blurred base.
 */
function cloudTexture(seed: number) {
  const W = 1024;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const r = rng(seed);
  const base = 400;
  const puffs: { x: number; y: number; rad: number }[] = [];
  // a long low body, then towers rising from it
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const bulge = Math.sin(t * Math.PI);
    puffs.push({ x: 110 + t * 800 + (r() - 0.5) * 30, y: base - 30 - bulge * 60 - r() * 30, rad: 46 + bulge * 50 + r() * 26 });
  }
  const towers = 2 + Math.floor(r() * 3);
  for (let k = 0; k < towers; k++) {
    const cx = 260 + r() * 500;
    const top = 130 + r() * 90;
    for (let y = base - 90; y > top; y -= 34) {
      const f = (y - top) / (base - 90 - top);
      puffs.push({ x: cx + (r() - 0.5) * 120 * (0.4 + f), y, rad: 40 + f * 40 + r() * 28 });
    }
  }
  // draw lower puffs first so the sunlit tops overlap them
  puffs.sort((p, q) => q.y - p.y);
  ctx.filter = "blur(2px)";
  for (const p of puffs) {
    const g = ctx.createRadialGradient(p.x - p.rad * 0.18, p.y - p.rad * 0.35, p.rad * 0.1, p.x, p.y, p.rad);
    // no dark rim on each puff: the edges fade out pale, and the base shading pass does the volume
    g.addColorStop(0, ENV.clouds.crown);
    g.addColorStop(0.6, ENV.clouds.mid);
    g.addColorStop(0.86, ENV.clouds.edge);
    g.addColorStop(1, `${ENV.clouds.edge}00`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
    ctx.fill();
  }
  // cool shading toward the base, only where there is cloud
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-atop";
  const shade = ctx.createLinearGradient(0, 120, 0, base + 40);
  const [sr, sg, sb] = ENV.clouds.shade;
  shade.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
  shade.addColorStop(0.55, `rgba(${sr},${sg},${sb},0.24)`);
  shade.addColorStop(1, `rgba(${sr - 22},${sg - 18},${sb - 10},0.62)`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  // flatten and soften the base
  ctx.globalCompositeOperation = "destination-out";
  const cut = ctx.createLinearGradient(0, base - 8, 0, base + 26);
  cut.addColorStop(0, "rgba(0,0,0,0)");
  cut.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = cut;
  ctx.fillRect(0, base - 8, W, H);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Clouds({ count, animate }: { count: number; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const r = rng(5);
    const textures = [cloudTexture(1), cloudTexture(2), cloudTexture(3), cloudTexture(4), cloudTexture(5)];
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + r() * 0.35;
      const high = i % 3 === 0;
      // big cumulus banks low on the horizon (some behind the mountains), smaller ones overhead
      const dist = high ? 600 + r() * 200 : 900 + r() * 300;
      const w = high ? 120 + r() * 90 : 260 + r() * 220;
      const pos: [number, number, number] = [Math.cos(a) * dist, high ? 300 + r() * 120 : 150 + r() * 110, Math.sin(a) * dist];
      return { pos, w, tex: textures[i % textures.length] };
    });
  }, [count]);
  useFrame((_, dt) => {
    if (animate && group.current) group.current.rotation.y += dt * 0.003;
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <sprite key={i} position={c.pos} scale={[c.w, c.w * 0.5, 1]}>
          <spriteMaterial map={c.tex} transparent depthWrite={false} fog={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
}

export function Sky({ clouds, animate }: { clouds: number; animate: boolean }) {
  return (
    <>
      <SkyDome />
      <Clouds count={clouds} animate={animate} />
    </>
  );
}
