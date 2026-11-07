import * as THREE from "three";
import { rng } from "../../../utils/random";

/**
 * Original procedural surface textures (stone blocks, plaster, roof tiles, wood grain)
 * applied in world/object space by a small shader patch, so every structure gets
 * consistent material detail without hand-made UVs.
 */
export type DetailKind = "stone" | "plaster" | "tiles" | "wood" | "rock";

function canvasTex(seed: number, draw: (ctx: CanvasRenderingContext2D, r: () => number, s: number) => void) {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  draw(ctx, rng(seed), s);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace; // a multiplier, not a colour
  t.anisotropy = 16;
  return t;
}

const grain = (ctx: CanvasRenderingContext2D, r: () => number, s: number, n: number, lo: number, hi: number, size: number) => {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(lo + r() * (hi - lo));
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.fillRect(r() * s, r() * s, size, size);
  }
};

const TEX: Partial<Record<DetailKind, THREE.Texture>> = {
  // Ashlar blocks: 8 courses, staggered joints, per-block tone, soft mortar
  stone: canvasTex(1, (ctx, r, s) => {
    ctx.fillStyle = "rgb(150,150,150)";
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const rh = s / rows;
    for (let y = 0; y < rows; y++) {
      let x = -(r() * 40);
      while (x < s) {
        const w = 44 + r() * 52;
        const v = Math.floor(208 + r() * 40);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x + 2, y * rh + 2, w - 3, rh - 3);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x + 2, y * rh + 2, w - 3, 3);
        x += w;
      }
    }
    grain(ctx, r, s, 900, 120, 255, 2);
  }),
  // Plaster: soft mottling with a few faint stains
  plaster: canvasTex(2, (ctx, r, s) => {
    ctx.fillStyle = "rgb(242,242,242)";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 60; i++) {
      const v = Math.floor(222 + r() * 33);
      ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
      ctx.beginPath();
      ctx.ellipse(r() * s, r() * s, 10 + r() * 30, 8 + r() * 22, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    grain(ctx, r, s, 700, 200, 255, 2);
  }),
  // Roof tiles: overlapping scalloped rows, each tile lit at the top and shaded at the lip
  tiles: canvasTex(3, (ctx, r, s) => {
    ctx.fillStyle = "rgb(150,150,150)";
    ctx.fillRect(0, 0, s, s);
    const rows = 16;
    const rh = s / rows;
    const tw = 21.33;
    for (let y = 0; y < rows; y++) {
      const off = y % 2 ? tw / 2 : 0;
      for (let x = -tw; x < s + tw; x += tw) {
        const cx = x + off;
        const top = y * rh;
        const g = ctx.createLinearGradient(0, top, 0, top + rh * 1.15);
        const v = 225 + Math.floor(r() * 25);
        g.addColorStop(0, `rgb(${v},${v},${v})`);
        g.addColorStop(0.8, `rgb(${v - 30},${v - 30},${v - 30})`);
        g.addColorStop(1, "rgb(130,130,130)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx - tw / 2 + 1, top);
        ctx.lineTo(cx + tw / 2 - 1, top);
        ctx.lineTo(cx + tw / 2 - 1, top + rh * 0.65);
        ctx.quadraticCurveTo(cx, top + rh * 1.25, cx - tw / 2 + 1, top + rh * 0.65);
        ctx.closePath();
        ctx.fill();
      }
    }
  }),
  // Wood: long grain lines with knots
  wood: canvasTex(4, (ctx, r, s) => {
    ctx.fillStyle = "rgb(230,230,230)";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) {
      const y = r() * s;
      const v = Math.floor(185 + r() * 40);
      ctx.strokeStyle = `rgba(${v},${v},${v},0.7)`;
      ctx.lineWidth = 1 + r() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s * 0.3, y + (r() - 0.5) * 6, s * 0.6, y + (r() - 0.5) * 6, s, y);
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = "rgba(150,150,150,0.6)";
      ctx.beginPath();
      ctx.ellipse(r() * s, r() * s, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }),
};

/** Natural rock: horizontal strata of varying thickness, cracks and grain. */
const ROCK_TEX = canvasTex(5, (ctx, r, s) => {
  ctx.fillStyle = "rgb(228,228,228)";
  ctx.fillRect(0, 0, s, s);
  let y = 0;
  while (y < s) {
    const band = 10 + r() * 28;
    const v = Math.floor(196 + r() * 52);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, s, band);
    ctx.fillStyle = "rgba(118,118,118,0.55)";
    ctx.fillRect(0, y + band - 2, s, 2);
    y += band;
  }
  for (let i = 0; i < 16; i++) {
    let x = r() * s;
    let cy = r() * s;
    ctx.strokeStyle = "rgba(112,112,112,0.5)";
    ctx.lineWidth = 1 + r() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    const len = 20 + r() * 70;
    for (let d = 0; d < len; d += 8) {
      x += (r() - 0.5) * 6;
      cy += 8;
      ctx.lineTo(x, cy);
    }
    ctx.stroke();
  }
  grain(ctx, r, s, 900, 150, 255, 2);
});
TEX.rock = ROCK_TEX;

const SETTINGS: Record<DetailKind, { scale: number; strength: number }> = {
  rock: { scale: 0.05, strength: 0.45 },
  stone: { scale: 0.27, strength: 0.55 },
  plaster: { scale: 0.3, strength: 0.4 },
  tiles: { scale: 0.21, strength: 0.65 },
  wood: { scale: 0.7, strength: 0.4 },
};

/** Patch a material so it is multiplied by a projected detail texture. */
export function withDetail<T extends THREE.Material>(material: T, kind: DetailKind): T {
  const { scale, strength } = SETTINGS[kind];
  const roof = kind === "tiles";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDetail = { value: TEX[kind] };
    shader.uniforms.uDetailScale = { value: scale };
    shader.uniforms.uDetailStrength = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDetailPos;\nvarying vec3 vDetailNormal;")
      .replace(
        "#include <begin_vertex>",
        roof
          ? "#include <begin_vertex>\nvDetailPos = transformed;\nvDetailNormal = objectNormal;"
          : `#include <begin_vertex>
vec4 dWorld = modelMatrix * vec4(transformed, 1.0);
#ifdef USE_INSTANCING
dWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
#endif
vDetailPos = dWorld.xyz;
vDetailNormal = mat3(modelMatrix) * objectNormal;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D uDetail;\nuniform float uDetailScale;\nuniform float uDetailStrength;\nvarying vec3 vDetailPos;\nvarying vec3 vDetailNormal;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 dn = abs(normalize(vDetailNormal));
vec2 duv = dn.x > dn.z ? vDetailPos.zy : vDetailPos.xy;
${roof ? "if (dn.y > 0.75) duv = vDetailPos.zx;" : "if (dn.y > 0.62) duv = vDetailPos.xz;"}
float dval = texture2D(uDetail, duv * uDetailScale).r;
diffuseColor.rgb *= mix(1.0, dval * 1.08, uDetailStrength);`,
      );
  };
  material.customProgramCacheKey = () => `detail-${kind}`;
  return material;
}
