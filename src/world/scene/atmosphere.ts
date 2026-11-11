import * as THREE from "three";
import { ENV } from "../config";
import { SUN_DIR } from "./Sky";

/**
 * Aerial perspective for every material that uses fog, patched into three's fog
 * shader chunks once at start-up (import this module before anything renders).
 *
 * Replaces the flat linear fog with:
 * - exponential haze that starts after `ENV.haze.start` metres of clear air,
 * - a warm tint toward the sun and the cool sky colour away from it,
 * - thin mist pooled in the valleys, below `ENV.haze.mistHeight`.
 *
 * The scene's <fog> still supplies the colour and enables USE_FOG; `fogNear`
 * is read as the start of the haze.
 */

const glsl = (n: number) => n.toFixed(5);
const vec3 = (c: THREE.Color) => `vec3(${glsl(c.r)}, ${glsl(c.g)}, ${glsl(c.b)})`;

function patch() {
  const chunks = THREE.ShaderChunk as Record<string, string>;
  if (chunks.fog_fragment.includes("vFogView")) return;
  const h = ENV.haze;
  const warm = new THREE.Color(h.warm); // converted to linear, like the fog colour uniform
  const sun = SUN_DIR.clone().normalize();

  chunks.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
varying float vFogDepth;
varying vec3 vFogView;
#endif`;

  chunks.fog_vertex = /* glsl */ `
#ifdef USE_FOG
vFogDepth = - mvPosition.z;
vFogView = mvPosition.xyz;
#endif`;

  chunks.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
uniform vec3 fogColor;
varying float vFogDepth;
varying vec3 vFogView;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear;
uniform float fogFar;
#endif
#endif`;

  chunks.fog_fragment = /* glsl */ `
#ifdef USE_FOG
{
  // camera-to-fragment offset in world space (the view matrix is a pure rotation + translation)
  vec3 fogOff = transpose( mat3( viewMatrix ) ) * vFogView;
  float fogDist = length( fogOff );
  vec3 fogDir = fogOff / max( fogDist, 1e-4 );
  float fogY = cameraPosition.y + fogOff.y;
  #ifdef FOG_EXP2
  float fogStart = 0.0;
  #else
  float fogStart = fogNear;
  #endif
  float aerial = ( 1.0 - exp( - max( fogDist - fogStart, 0.0 ) * ${glsl(h.density)} ) ) * ${glsl(h.max)};
  float mist = exp( - max( fogY - ${glsl(h.mistHeight)}, 0.0 ) * ${glsl(h.mistFalloff)} )
    * ( 1.0 - exp( - fogDist * ${glsl(h.mistDensity)} ) ) * ${glsl(h.mistMax)};
  float fogFactor = clamp( max( aerial, mist ), 0.0, 1.0 );
  // warm toward the sun, measured along the horizon so the glow sits low like the sky's
  vec3 sunFlat = normalize( vec3( ${glsl(sun.x)}, 0.0, ${glsl(sun.z)} ) );
  float toSun = pow( max( dot( normalize( vec3( fogDir.x, 0.0, fogDir.z ) + 1e-5 ), sunFlat ), 0.0 ), ${glsl(h.warmPower)} );
  vec3 hazeColor = mix( fogColor, ${vec3(warm)}, toSun * 0.55 );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, hazeColor, fogFactor );
}
#endif`;
}

patch();
