import * as THREE from "three";

/**
 * Anime-style cel lighting for every MeshToonMaterial, patched into three's shaders once
 * at start-up (import this module before anything renders).
 *
 * - Crisp light/shade terminator instead of the soft 4-step ramp.
 * - Shade is a cool lavender-blue (not just darker), like stylised open-world games.
 * - The sun's cast shadows go through the same terminator, so they get the same
 *   hard edge and the same cool tint as surfaces turned away from the sun.
 * - Optional sunlit rim glow on silhouettes (`TOON_RIM` define, used on foliage).
 *
 * Per-material knobs (material.defines):
 *   TOON_SOFTNESS  width of the terminator in N·L units (default 0.045; terrain uses wider)
 *   TOON_RIM       enable the rim glow
 *   TOON_TRANSLUCENT  leaves: sunlight glows through when the camera looks toward the sun
 */

/** Colour of the shaded side, multiplied by the sun colour. */
export const TOON_SHADE = new THREE.Color(0.42, 0.48, 0.79);

const LIGHTS_PARS = /* glsl */ `
varying vec3 vViewPosition;

#ifndef TOON_SOFTNESS
#define TOON_SOFTNESS 0.045
#endif

// < 0 while shading non-directional lights; the sun loop sets it to its shadow factor
float toonShadow = -1.0;

struct ToonMaterial {
	vec3 diffuseColor;
};

void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = dot( geometryNormal, directLight.direction );
	float w = TOON_SOFTNESS + fwidth( dotNL ) * 0.75;
	float lit = smoothstep( -w, w, dotNL - 0.03 );
	vec3 irradiance;
	if ( toonShadow >= 0.0 ) {
		// sharpen the filtered shadow-map edge into a clean cel boundary
		lit *= smoothstep( 0.3, 0.7, toonShadow );
		float body = mix( 0.88, 1.0, saturate( dotNL ) );
		irradiance = mix( vec3( ${TOON_SHADE.r.toFixed(3)}, ${TOON_SHADE.g.toFixed(3)}, ${TOON_SHADE.b.toFixed(3)} ), vec3( body ), lit ) * directLight.color;
	} else {
		// lanterns and other local lights: lit side only
		irradiance = lit * directLight.color;
	}
	toonShadow = -1.0;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}

void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}

#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon
`;

const RIM = /* glsl */ `
#if defined( TOON_RIM ) && NUM_DIR_LIGHTS > 0
{
	float toonFres = 1.0 - saturate( dot( normal, normalize( -vViewPosition ) ) );
	float toonRim = smoothstep( 0.6, 0.74, toonFres );
	float toonSun = saturate( dot( normal, directionalLights[ 0 ].direction ) + 0.4 );
	outgoingLight += diffuseColor.rgb * directionalLights[ 0 ].color * toonRim * toonSun * 0.16;
}
#endif
#if defined( TOON_TRANSLUCENT ) && NUM_DIR_LIGHTS > 0
{
	// light passing through thin leaves: strongest looking straight into the sun,
	// tinted warm-yellow like sunlit foliage
	vec3 toonView = normalize( vViewPosition );
	float toonBack = clamp( dot( toonView, -directionalLights[ 0 ].direction ) * -1.0, 0.0, 1.0 );
	toonBack = toonBack * toonBack * toonBack;
	outgoingLight += diffuseColor.rgb * vec3( 1.15, 1.1, 0.6 ) * directionalLights[ 0 ].color * toonBack * 0.32;
}
#endif
`;

function patch() {
  const chunks = THREE.ShaderChunk as Record<string, string>;
  if (chunks.lights_fragment_begin_toon) return;

  // Copy of the light loop where the sun's shadow is handed to the toon shader separately
  // instead of being multiplied into the light colour.
  const SHADOW_LINE = /directLight\.color \*= \( directLight\.visible && receiveShadow \) \? getShadow\( directionalShadowMap\[ i \]/;
  const begin = chunks.lights_fragment_begin;
  const dirStart = begin.indexOf("getDirectionalLightInfo( directionalLight, directLight );");
  if (dirStart < 0 || !SHADOW_LINE.test(begin)) {
    console.warn("toonShading: three.js light chunk changed; using stock toon lighting");
    return;
  }
  chunks.lights_fragment_begin_toon = begin
    .replace("getDirectionalLightInfo( directionalLight, directLight );", "getDirectionalLightInfo( directionalLight, directLight );\n\t\ttoonShadow = 1.0;")
    .replace(SHADOW_LINE, "toonShadow = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]");
  chunks.lights_toon_pars_fragment = LIGHTS_PARS;

  const toon = THREE.ShaderLib.toon;
  toon.fragmentShader = toon.fragmentShader
    .replace("#include <lights_fragment_begin>", "#include <lights_fragment_begin_toon>")
    .replace(
      "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",
      `vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n${RIM}`,
    );
}

patch();

/** Let sunlight glow through a toon material when it is back-lit (thin leaves). */
export function withTranslucency<T extends THREE.Material>(m: T): T {
  m.defines = { ...(m.defines ?? {}), TOON_TRANSLUCENT: "" };
  return m;
}

/** Turn on the sunlit rim glow for a toon material. */
export function withRim<T extends THREE.Material>(m: T): T {
  m.defines = { ...(m.defines ?? {}), TOON_RIM: "" };
  return m;
}
