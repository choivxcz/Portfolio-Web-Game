import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, Effect, EffectAttribute, ToneMappingMode } from "postprocessing";
import { useMemo } from "react";
import * as THREE from "three";
import { ENV } from "../config";

/**
 * Contrast-adaptive sharpening: boosts each pixel against its four neighbours, but
 * limits the overshoot to the local contrast so edges get crisper without halos.
 * It samples the rendered frame directly, so it runs first in the chain.
 */
class SharpenEffect extends Effect {
  constructor(strength: number) {
    super(
      "SharpenEffect",
      /* glsl */ `
uniform float strength;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  vec3 n = texture2D(inputBuffer, uv + vec2(0.0, texelSize.y)).rgb;
  vec3 s = texture2D(inputBuffer, uv - vec2(0.0, texelSize.y)).rgb;
  vec3 e = texture2D(inputBuffer, uv + vec2(texelSize.x, 0.0)).rgb;
  vec3 w = texture2D(inputBuffer, uv - vec2(texelSize.x, 0.0)).rgb;
  vec3 mn = min(c, min(min(n, s), min(e, w)));
  vec3 mx = max(c, max(max(n, s), max(e, w)));
  vec3 sharp = c + (4.0 * c - n - s - e - w) * strength;
  vec3 room = (mx - mn) * 0.35;
  outputColor = vec4(max(clamp(sharp, mn - room, mx + room), 0.0), inputColor.a);
}`,
      {
        attributes: EffectAttribute.CONVOLUTION,
        blendFunction: BlendFunction.NORMAL,
        uniforms: new Map([["strength", new THREE.Uniform(strength)]]),
      },
    );
  }
}

/**
 * Bright, saturated anime grade: vibrance (lifts muted colours most), a gentle
 * S-curve, cool-blue shadows and warm sunlit highlights.
 */
class AnimeGradeEffect extends Effect {
  constructor() {
    super(
      "AnimeGradeEffect",
      /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = max(inputColor.rgb, 0.0);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  c = max(mix(vec3(l), c, 1.0 + 0.1 * (1.0 - sat)), 0.0);
  c *= mix(vec3(0.93, 0.97, 1.08), vec3(1.04, 1.01, 0.95), smoothstep(0.04, 0.55, l));
  vec3 p = pow(c, vec3(1.0 / 2.2));
  p = mix(p, p * p * (3.0 - 2.0 * p), 0.16);
  outputColor = vec4(pow(max(p, 0.0), vec3(2.2)), inputColor.a);
}`,
      { blendFunction: BlendFunction.NORMAL },
    );
  }
}

interface PostFXProps {
  multisampling: number;
  bloom: boolean;
  vignette: boolean;
  sharpen: boolean;
  ao: boolean;
}

export function PostFX({ multisampling, bloom, vignette, sharpen: sharpenOn, ao }: PostFXProps) {
  // fresh effect objects for each chain: the old composer disposes the ones it held
  const chain = `${bloom}${vignette}${sharpenOn}${ao}`;
  const sharpen = useMemo(() => new SharpenEffect(0.55), [chain]);
  const grade = useMemo(() => new AnimeGradeEffect(), [chain]);
  return (
    // keyed so the effect chain is rebuilt cleanly when a toggle changes
    <EffectComposer key={chain} multisampling={multisampling}>
      {/* soft cool-blue contact shading in corners, under eaves and where things meet the ground */}
      {ao && <N8AO aoRadius={2.2} distanceFalloff={0.6} intensity={2.4} color="#25305e" halfRes quality="performance" />}
      {sharpenOn && <primitive object={sharpen} />}
      {bloom && <Bloom mipmapBlur intensity={ENV.post.bloom} luminanceThreshold={ENV.post.bloomThreshold} luminanceSmoothing={0.22} radius={0.72} />}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <primitive object={grade} />
      {vignette && <Vignette offset={0.42} darkness={0.2} />}
    </EffectComposer>
  );
}
