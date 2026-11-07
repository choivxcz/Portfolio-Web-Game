import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { WATER_LEVEL, WORLD_SIZE } from "../config";
import { HEIGHT_GLSL, heightUniforms } from "./heightmap";
import { SKY, SUN_DIR } from "./Sky";

/**
 * Lake and stream. Clear turquoise shallows over sand, deep blue further out,
 * a sky reflection that strengthens at grazing angles, sun glints, drifting
 * anime-style ripple streaks and a crisp foam line at the shore.
 *
 * On High quality the reflection is real: the scene is drawn from a mirrored
 * camera into a half-resolution texture each frame (grass and water skipped).
 */
const VERT = /* glsl */ `
#include <fog_pars_vertex>
uniform mat4 uReflMatrix;
varying vec3 vWorld;
varying vec4 vRefl;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vRefl = uReflMatrix * wp;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */ `
${HEIGHT_GLSL}
#include <fog_pars_fragment>
uniform float uTime;
uniform vec3 uSun;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform sampler2D uRefl;
uniform float uUseRefl;
varying vec3 vWorld;
varying vec4 vRefl;
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash2(i), hash2(i+vec2(1,0)), f.x), mix(hash2(i+vec2(0,1)), hash2(i+vec2(1,1)), f.x), f.y); }
void main(){
  float depth = ${WATER_LEVEL.toFixed(2)} - sampleField(vWorld.xz).x;
  if (depth < -0.02) discard;
  vec2 p = vWorld.xz;
  float t = uTime;
  vec3 n = normalize(vec3(
    cos(p.x * 0.31 + t * 1.1) * 0.05 + cos((p.x + p.y) * 0.83 + t * 1.6) * 0.035 + cos(p.x * 2.1 - t * 2.3) * 0.015,
    1.0,
    cos(p.y * 0.37 - t * 0.9) * 0.05 + cos((p.x - p.y) * 0.71 - t * 1.3) * 0.035 + cos(p.y * 2.4 + t * 2.1) * 0.015));
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float fres = 0.08 + 0.92 * pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

  // body colour: turquoise shallows → deep blue
  float dt = smoothstep(0.0, 4.0, depth);
  vec3 body = mix(uShallow, uDeep, dt);

  // what the surface reflects: the real scene on High, otherwise the sky gradient
  vec3 r = reflect(-viewDir, n);
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(r.y, 0.0, 1.0), 0.5));
  vec3 refl = sky;
  if (uUseRefl > 0.5) {
    vec4 uv = vRefl;
    uv.xy += n.xz * 1.6 * uv.w * 0.04;
    refl = texture2DProj(uRefl, uv).rgb;
  }
  // reflections read a touch darker and bluer than what they mirror
  refl *= vec3(0.8, 0.88, 0.98);
  // shallow water shows its colour and the bed; deep open water mirrors more
  float reflAmt = clamp(fres * 0.8, 0.0, 0.62) * mix(0.35, 1.0, smoothstep(0.2, 2.0, depth));
  vec3 col = mix(body, refl, reflAmt);

  // sun glint
  vec3 h = normalize(uSun + viewDir);
  col += vec3(1.0, 0.96, 0.85) * pow(max(dot(n, h), 0.0), 600.0) * 3.0;

  // drifting ripple streaks: thin bright lines, more where the water is deeper
  float w = vnoise(p * 0.18 + vec2(t * 0.05, -t * 0.03)) * 6.0;
  float streak = smoothstep(0.93, 0.985, sin(dot(p, vec2(0.55, 0.83)) * 1.7 + w + t * 0.6));
  col = mix(col, vec3(0.95, 0.99, 1.0), streak * 0.35 * smoothstep(0.3, 1.5, depth));

  // shoreline: a crisp foam band that laps in and out
  float lap = sin(p.x * 1.3 + t * 1.4) * sin(p.y * 1.1 - t * 1.2);
  float edge = 0.09 + lap * 0.03;
  float aa = fwidth(depth) * 1.2 + 0.004;
  float foam = 1.0 - smoothstep(edge - aa, edge + aa, depth);
  col = mix(col, vec3(0.97, 0.99, 1.0), foam * 0.85);

  float alpha = mix(0.58, 0.95, smoothstep(0.0, 2.2, depth));
  alpha = max(alpha, foam * 0.9);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** Mirrored-camera render of the scene for the water's reflection (High quality only). */
function useReflection(enabled: boolean, material: THREE.ShaderMaterial) {
  const { gl, scene, camera, size } = useThree();
  const state = useMemo(() => {
    if (!enabled) return null;
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    return {
      target,
      cam: new THREE.PerspectiveCamera(),
      plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_LEVEL),
      bias: new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1),
      hidden: [] as THREE.Object3D[],
      lastScan: -1,
    };
  }, [enabled]);

  useEffect(() => {
    if (!state) return;
    const dpr = gl.getPixelRatio();
    state.target.setSize(Math.max(1, Math.round(size.width * dpr * 0.5)), Math.max(1, Math.round(size.height * dpr * 0.5)));
  }, [state, gl, size]);
  useEffect(() => () => state?.target.dispose(), [state]);
  useEffect(() => {
    material.uniforms.uUseRefl.value = state ? 1 : 0;
    material.uniforms.uRefl.value = state ? state.target.texture : null;
  }, [state, material]);

  useFrame(({ clock }) => {
    if (!state) return;
    const cam = camera as THREE.PerspectiveCamera;
    // only bother when water can be in view: the camera is above it
    if (cam.position.y < WATER_LEVEL + 0.2) return;
    // mirror the camera across the water plane
    const m = state.cam;
    m.fov = cam.fov;
    m.aspect = cam.aspect;
    m.near = cam.near;
    m.far = cam.far;
    m.updateProjectionMatrix();
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    m.position.set(cam.position.x, 2 * WATER_LEVEL - cam.position.y, cam.position.z);
    m.up.set(0, -1, 0);
    m.lookAt(m.position.x + fwd.x, m.position.y - fwd.y, m.position.z + fwd.z);
    m.updateMatrixWorld();
    material.uniforms.uReflMatrix.value.copy(state.bias).multiply(m.projectionMatrix).multiply(m.matrixWorldInverse);

    // skip grass, flowers, pollen and the water itself (refreshed every couple of seconds)
    if (clock.elapsedTime - state.lastScan > 2) {
      state.lastScan = clock.elapsedTime;
      state.hidden = [];
      scene.traverse((o) => {
        if (o.userData.noReflect) state.hidden.push(o);
      });
    }
    const was = state.hidden.map((o) => o.visible);
    state.hidden.forEach((o) => (o.visible = false));
    const prevTarget = gl.getRenderTarget();
    const prevClip = gl.clippingPlanes;
    const prevShadow = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false; // reuse this frame's sun shadows
    gl.clippingPlanes = [state.plane]; // nothing below the waterline
    gl.setRenderTarget(state.target);
    gl.clear();
    gl.render(scene, m);
    gl.setRenderTarget(prevTarget);
    gl.clippingPlanes = prevClip;
    gl.shadowMap.autoUpdate = prevShadow;
    state.hidden.forEach((o, i) => (o.visible = was[i]));
  });
}

export function Water({ heightTex, n, reflect }: { heightTex: THREE.DataTexture; n: number; reflect: boolean }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        fog: true,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          ...heightUniforms(heightTex, n),
          uTime: { value: 0 },
          uSun: { value: SUN_DIR },
          uShallow: { value: new THREE.Color("#2fc6bd") },
          uDeep: { value: new THREE.Color("#1a78b8") },
          uSkyTop: { value: new THREE.Color(SKY.top) },
          uSkyHorizon: { value: new THREE.Color(SKY.horizon) },
          uRefl: { value: null },
          uUseRefl: { value: 0 },
          uReflMatrix: { value: new THREE.Matrix4() },
        },
      }),
    [heightTex, n],
  );
  useReflection(reflect, material);
  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });
  return (
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL, 0]} renderOrder={2} userData={{ noReflect: true }}>
      <planeGeometry args={[WORLD_SIZE, WORLD_SIZE, 1, 1]} />
    </mesh>
  );
}
