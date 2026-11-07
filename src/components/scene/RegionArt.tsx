import { memo, type ReactNode } from "react";
import { rng } from "../../utils/random";
import { Windmill } from "./City";
import { placeLayer } from "./places";
import { regionPresets, type RegionPreset, type Structure, type TreeStyle } from "./regionPresets";
import { Framing, Grade, Motes, PaintDefs, RimLight, SkyClouds, SunRays, WaterGlints } from "./paint";
import { H, W, hill, hillLine, pillar, ridge } from "./shapes";

/* ── Structures (drawn around a baseline point) ── */
function structure(kind: Structure, p: RegionPreset): ReactNode {
  const glow = p.night ? "#ffd27a" : "#ffe9a8";
  switch (kind) {
    case "academy":
      return (
        <g transform="translate(560 668)">
          <rect x="-150" y="-150" width="300" height="150" fill="#f1e8da" />
          <rect x="0" y="-150" width="150" height="150" fill="#ddd0bc" />
          <path d="M-166 -150L0 -214L166 -150Z" fill="#5b74ad" />
          <rect x="-40" y="-330" width="80" height="180" fill="#f1e8da" />
          <rect x="0" y="-330" width="40" height="180" fill="#ddd0bc" />
          <path d="M-52 -330Q0 -410 52 -330Z" fill="#d9a646" />
          <path d="M-4 -400h8v-40h-8z" fill="#d9a646" />
          <path d="M-60 -250v70l-18-10v-60zM60 -250v70l18-10v-60z" fill="#4f8f5b" />
          {[-110, -70, 70, 110].map((x) => (
            <rect key={x} x={x - 9} y="-110" width="18" height="34" rx="9" fill={glow} opacity=".85" />
          ))}
          <rect x="-16" y="-290" width="32" height="44" rx="16" fill={glow} opacity=".85" />
        </g>
      );
    case "pagoda":
      return (
        <g transform="translate(470 676)">
          <rect x="-150" y="-26" width="300" height="26" fill="#8c6b52" />
          {[0, 1, 2].map((i) => {
            const w = 200 - i * 50;
            const y = -26 - i * 92;
            return (
              <g key={i}>
                <rect x={-w / 2 + 16} y={y - 64} width={w - 32} height="64" fill="#efe1c8" />
                <path d={`M${-w / 2 - 30} ${y - 60}Q0 ${y - 110} ${w / 2 + 30} ${y - 60}Q${w / 2} ${y - 70} ${w / 2 - 10} ${y - 66}H${-w / 2 + 10}Q${-w / 2} ${y - 70} ${-w / 2 - 30} ${y - 60}Z`} fill="#c2492f" />
              </g>
            );
          })}
          <path d="M-4 -310h8v-50h-8z" fill="#d9a646" />
        </g>
      );
    case "market":
      return (
        <g transform="translate(1100 690)">
          <rect x="-170" y="-120" width="340" height="120" fill="#f1e2c4" />
          {[-140, -70, 0, 70, 140].map((x) => (
            <rect key={x} x={x - 8} y="-120" width="16" height="120" fill="#a8452f" />
          ))}
          <path d="M-210 -120Q0 -240 210 -120Q170 -130 150 -126H-150Q-170 -130 -210 -120Z" fill="#d9a646" />
          <circle cx="0" cy="-160" r="26" fill="#f6e3a8" stroke="#a8452f" strokeWidth="6" />
          <rect x="-8" y="-168" width="16" height="16" fill="#a8452f" />
          <path d="M-330 0v-60h110v60M220 0v-60h110v60" fill="#e8d7b6" />
          <path d="M-340 -60l55-30 55 30zM210 -60l55-30 55 30z" fill="#4f8f8a" />
        </g>
      );
    case "shrine":
      // A raised nipa hut with a warm lit window
      return (
        <g transform="translate(980 700)">
          {[-90, -40, 40, 90].map((x) => (
            <rect key={x} x={x - 6} y="-70" width="12" height="70" fill="#5a4330" />
          ))}
          <rect x="-110" y="-180" width="220" height="110" fill="#8a6a46" />
          <path d="M-110 -150h220M-110 -120h220M-110 -90h220" stroke="#6f5436" strokeWidth="4" />
          <path d="M-150 -170L0 -300L150 -170Z" fill="#4a3a2a" />
          <path d="M-150 -170L0 -300L150 -170" stroke="#6b5640" strokeWidth="6" fill="none" />
          <rect x="-34" y="-160" width="68" height="56" fill={glow} />
          <circle cx="0" cy="-132" r="80" fill={glow} opacity=".16" />
        </g>
      );
    case "observatory":
      return (
        <g transform="translate(540 684)">
          <rect x="-110" y="-150" width="220" height="150" fill="#e9eef4" />
          <rect x="0" y="-150" width="110" height="150" fill="#c9d6e3" />
          <path d="M-120 -150A120 110 0 0 1 120 -150Z" fill="#7d98bd" />
          <path d="M-120 -150A120 110 0 0 1 120 -150" fill="none" stroke="#ffffff" strokeWidth="10" opacity=".8" />
          <rect x="-14" y="-258" width="28" height="100" fill="#3d5478" transform="rotate(20 0 -150)" />
          <rect x="-30" y="-100" width="60" height="100" rx="30" fill={glow} opacity=".8" />
        </g>
      );
    case "windmill":
      return <Windmill x={980} y={690} s={2.4} />;
    case "village":
      return (
        <g transform="translate(560 650)">
          {[-180, -60, 60, 180].map((x, i) => (
            <g key={x} transform={`translate(${x} ${i % 2 ? 12 : 0})`}>
              <rect x="-50" y="-80" width="100" height="80" fill="#f1e8da" />
              <rect x="0" y="-80" width="50" height="80" fill="#ddd0bc" />
              <path d="M-64 -80L0 -134L64 -80Z" fill={i % 2 ? "#c56f4f" : "#5b74ad"} />
              <rect x="-24" y="-56" width="18" height="24" fill={glow} />
            </g>
          ))}
        </g>
      );
    case "spires":
      return (
        <g transform="translate(1060 670)">
          <rect x="-180" y="-130" width="360" height="130" fill="#efe4f0" />
          <rect x="0" y="-130" width="180" height="130" fill="#d6c6dc" />
          {[-150, 0, 150].map((x, i) => (
            <g key={x}>
              <rect x={x - 26} y={i === 1 ? -360 : -260} width="52" height={i === 1 ? 230 : 130} fill="#efe4f0" />
              <path d={`M${x - 34} ${i === 1 ? -360 : -260}L${x} ${i === 1 ? -450 : -330}L${x + 34} ${i === 1 ? -360 : -260}Z`} fill="#5d4f9c" />
            </g>
          ))}
          {[-120, -80, -40, 40, 80, 120].map((x) => (
            <rect key={x} x={x - 8} y="-96" width="16" height="30" rx="8" fill={glow} opacity=".9" />
          ))}
        </g>
      );
  }
}

/* ── Trees ── */
function treeShape(style: TreeStyle, x: number, y: number, s: number, key: number, night?: boolean): ReactNode {
  if (style === "pine") {
    const c1 = night ? "#1d3a3a" : "#3f6f5a";
    const c2 = night ? "#2a4c48" : "#e9f2f8";
    return (
      <g key={key}>
        <path d={`M${x} ${y - s * 2.4}L${x + s * 0.8} ${y}H${x - s * 0.8}Z`} fill={c1} />
        <path d={`M${x} ${y - s * 2.4}L${x + s * 0.3} ${y - s * 1.6}H${x - s * 0.3}Z`} fill={c2} />
      </g>
    );
  }
  if (style === "poplar") {
    return (
      <g key={key}>
        <rect x={x - s * 0.06} y={y - s * 0.5} width={s * 0.12} height={s * 0.5} fill="#6b4f3c" />
        <ellipse cx={x} cy={y - s * 1.5} rx={s * 0.34} ry={s * 1.15} fill="#3d6f4a" />
        <ellipse cx={x - s * 0.1} cy={y - s * 1.7} rx={s * 0.16} ry={s * 0.8} fill="#5f9a5a" />
      </g>
    );
  }
  if (style === "jungle") {
    return (
      <g key={key}>
        <path d={`M${x - s * 0.07} ${y}Q${x + s * 0.1} ${y - s} ${x - s * 0.03} ${y - s * 1.9}H${x + s * 0.07}Q${x + s * 0.2} ${y - s} ${x + s * 0.07} ${y}Z`} fill="#6b4f3c" />
        <ellipse cx={x} cy={y - s * 1.9} rx={s * 0.95} ry={s * 0.36} fill="#2f6f45" />
        <ellipse cx={x - s * 0.1} cy={y - s * 2.08} rx={s * 0.66} ry={s * 0.26} fill="#4f9a55" />
        <ellipse cx={x - s * 0.2} cy={y - s * 2.2} rx={s * 0.3} ry={s * 0.13} fill="#7cc36a" />
      </g>
    );
  }
  if (style === "palm") {
    const top = { x: x + s * 0.25, y: y - s * 2 };
    return (
      <g key={key}>
        <path d={`M${x} ${y}Q${x + s * 0.05} ${y - s} ${top.x} ${top.y}`} stroke="#7a5a3c" strokeWidth={s * 0.13} fill="none" strokeLinecap="round" />
        {[-160, -125, -55, -20, -95].map((a, i) => {
          const r = (a * Math.PI) / 180;
          const ex = top.x + Math.cos(r) * s * 1.2;
          const ey = top.y + Math.sin(r) * s * 1.2 + s * 0.45;
          const cx = top.x + Math.cos(r) * s * 0.7;
          const cy = top.y + Math.sin(r) * s * 0.7 - s * 0.2;
          return <path key={i} d={`M${top.x} ${top.y}Q${cx} ${cy} ${ex} ${ey}`} stroke={i % 2 ? "#5f8a3a" : "#86a84a"} strokeWidth={s * 0.2} fill="none" strokeLinecap="round" />;
        })}
      </g>
    );
  }
  const palette: Record<string, [string, string]> = {
    round: ["#3f7f4a", "#69a95a"],
    blossom: ["#d98aa8", "#f6c3d3"],
    gold: ["#c48f2e", "#ecc35a"],
    autumn: key % 2 ? ["#8a3a2a", "#c86a34"] : ["#9a6a2a", "#d19a3a"],
  };
  const [dark, light] = palette[style];
  return (
    <g key={key}>
      <rect x={x - s * 0.08} y={y - s * 0.9} width={s * 0.16} height={s * 0.9} fill="#6b4f3c" />
      <circle cx={x} cy={y - s * 1.3} r={s * 0.75} fill={dark} />
      <circle cx={x - s * 0.22} cy={y - s * 1.5} r={s * 0.45} fill={light} />
    </g>
  );
}

export const RegionArt = memo(function RegionArt({ preset, id, className = "" }: { preset: string; id: string; className?: string }) {
  const p = regionPresets[preset] ?? regionPresets.plains;
  const r = rng(id.length * 31 + preset.length * 7);
  const g = `ra-${id}`;
  const farPath =
    p.far === "pillars" || p.far === "none"
      ? null
      : p.far === "hills"
        ? hill([[0, 560], [300, 520], [640, 560], [980, 500], [1300, 540], [1600, 510]])
        : ridge(preset.length * 13, 600, p.far === "snow" ? 220 : 170, { step: 14 });
  // Scatter trees in depth (smaller further back), keeping clear of the building.
  const structX = { academy: 560, pagoda: 470, market: 1100, shrine: 980, observatory: 540, windmill: 980, village: 560, spires: 1060 }[p.structure ?? "village"];
  const [gapX, gapW] = p.treeGap ?? [structX, 300];
  const treeCount = p.treeCount ?? 13;
  const treesAt: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < (p.place ? 40 : 26) && treesAt.length < treeCount; i++) {
    const x = r() * W;
    if (Math.abs(x - gapX) < gapW) continue;
    const y = 684 + r() * 96;
    treesAt.push({ x, y, s: ((y - 640) / 100) * (36 + r() * 30) });
  }
  treesAt.sort((a, b) => a.y - b.y);
  // how golden the light is (warm horizons get warmer cloud crowns)
  const hz = parseInt(p.sky[2].slice(1), 16);
  const warmth = Math.max(0, Math.min(1, (((hz >> 16) & 255) - (hz & 255)) / 90));
  const midHill: [number, number][] = [[0, 680], [300, 650], [700, 690], [1100, 662], [1600, 690]];
  const nearHill: [number, number][] = [[0, 780], [400, 760], [900, 800], [1300, 770], [1600, 790]];
  const seed = id.length * 7 + preset.length * 13;

  return (
    <svg className={`region-art ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <PaintDefs g={g} sun={p.sun} night={p.night} />
        <linearGradient id={`${g}-aerial`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky[2]} stopOpacity="0" />
          <stop offset="100%" stopColor={p.sky[2]} stopOpacity={p.night ? ".25" : ".5"} />
        </linearGradient>
        <linearGradient id={`${g}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky[0]} />
          <stop offset="55%" stopColor={p.sky[1]} />
          <stop offset="100%" stopColor={p.sky[2]} />
        </linearGradient>
        <radialGradient id={`${g}-sun`}>
          <stop offset="0%" stopColor={p.sun.color} />
          <stop offset="25%" stopColor={p.sun.color} stopOpacity=".7" />
          <stop offset="100%" stopColor={p.sun.color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${g}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.farColor[0]} />
          <stop offset="100%" stopColor={p.farColor[1]} />
        </linearGradient>
        <linearGradient id={`${g}-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.mid[0]} />
          <stop offset="100%" stopColor={p.mid[1]} />
        </linearGradient>
        <linearGradient id={`${g}-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.near[0]} />
          <stop offset="100%" stopColor={p.near[1]} />
        </linearGradient>
        <linearGradient id={`${g}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.night ? "#6d78b0" : "#ffffff"} stopOpacity="0" />
          <stop offset="60%" stopColor={p.night ? "#6d78b0" : "#ffffff"} stopOpacity={p.night ? ".18" : ".38"} />
          <stop offset="100%" stopColor={p.night ? "#6d78b0" : "#ffffff"} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${g}-light`} cx={p.sun.x / W} cy={p.sun.y / H} r="1">
          <stop offset="0%" stopColor="#fff4d6" stopOpacity={p.night ? ".08" : ".22"} />
          <stop offset="55%" stopColor="#fff4d6" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a2440" stopOpacity=".22" />
        </radialGradient>
        {p.water && (
          <linearGradient id={`${g}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.water[0]} />
            <stop offset="100%" stopColor={p.water[1]} />
          </linearGradient>
        )}
      </defs>
      <rect width={W} height={H} fill={`url(#${g}-sky)`} />
      {p.night &&
        (p.stars ?? true) &&
        Array.from({ length: 60 }, (_, i) => <circle key={i} cx={r() * W} cy={r() * 480} r={1 + r() * 2.2} fill="#fff" opacity={0.4 + r() * 0.6} />)}
      <circle cx={p.sun.x} cy={p.sun.y} r={p.night ? 160 : 260} fill={`url(#${g}-sun)`} />
      {p.night && (p.moon ?? 58) > 0 && <circle cx={p.sun.x} cy={p.sun.y} r={p.moon ?? 58} fill="#f6efd9" />}
      {(p.clouds ?? !p.night) && <SkyClouds g={g} sun={p.sun} night={p.night} warmth={warmth} seed={seed} />}
      {placeLayer(p.place, "sky", g)}
      {farPath && <path d={farPath} fill={`url(#${g}-far)`} />}
      {p.far === "snow" && farPath && <path d={farPath} fill="#ffffff" opacity=".85" style={{ clipPath: "inset(0 0 62% 0)" }} />}
      {p.far === "pillars" &&
        [
          [930, 300, 70],
          [1040, 210, 84],
          [1160, 340, 60],
          [1280, 250, 76],
          [1410, 320, 64],
        ].map(([x, top, w], i) => (
          <g key={i}>
            <path d={pillar(i + 3, x, top, w, 700)} fill={`url(#${g}-far)`} />
            <path d={`M${x - w * 0.3} ${top + 90}h${w * 0.45}M${x - w * 0.1} ${top + 170}h${w * 0.4}`} stroke="#000" strokeOpacity=".12" strokeWidth="4" />
            <ellipse cx={x - 4} cy={top + 6} rx={w * 0.48} ry="14" fill="#86b36f" />
          </g>
        ))}
      {placeLayer(p.place, "far", g)}
      {/* aerial perspective: the distance melts into the horizon colour */}
      <rect y="250" width={W} height="450" fill={`url(#${g}-aerial)`} />
      {/* haze between distance and foreground */}
      <rect y="520" width={W} height="170" fill={`url(#${g}-haze)`} />
      {p.water && <path d="M0 600C400 580 1200 580 1600 600V760H0Z" fill={`url(#${g}-water)`} />}
      {p.water && <path d="M200 640h200M700 625h260M1150 650h200" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity=".5" />}
      {p.water && <WaterGlints sunX={Math.max(250, Math.min(1350, p.sun.x))} y0={604} y1={690} seed={seed} night={p.night} />}
      <path d={hill(midHill)} fill={`url(#${g}-mid)`} />
      <RimLight d={hillLine(midHill)} g={g} color={p.night ? "#aab6ee" : "#fff1c4"} opacity={p.night ? 0.3 : 0.55} />
      <g filter={`url(#${g}-build)`}>{p.place ? placeLayer(p.place, "mid", g) : p.structure && structure(p.structure, p)}</g>
      {treesAt.map((t, i) => treeShape(p.trees, t.x, t.y, t.s, i, p.night))}
      <path d={hill(nearHill)} fill={`url(#${g}-near)`} />
      <RimLight d={hillLine(nearHill)} g={g} color={p.night ? "#aab6ee" : "#fff1c4"} width={4} opacity={p.night ? 0.25 : 0.45} />
      {/* sky lanterns drifting upward (ground lanterns at night) */}
      {p.lanterns &&
        (p.lanternsAt ?? (p.night ? [[700, 640], [1250, 650], [300, 700]] : [[250, 330], [420, 220], [700, 300], [1300, 200], [1450, 330]])).map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="40" fill="#ffc46b" opacity=".25" />
            <rect x={x - 13} y={y - 18} width="26" height="34" rx="10" fill="#f2a548" />
            <rect x={x - 13} y={y - 18} width="26" height="10" rx="5" fill="#c2492f" />
          </g>
        ))}
      <Framing g={g} near={p.near} sunX={p.sun.x} night={p.night} seed={seed} />
      {placeLayer(p.place, "front", g)}
      {!p.night && <SunRays g={g} sun={p.sun} />}
      {!p.night && <Motes seed={seed + 1} />}
      {/* warm sunlight and a soft vignette */}
      <rect width={W} height={H} fill={`url(#${g}-light)`} />
      <Grade g={g} />
      {p.night &&
        (p.fireflies ?? true) &&
        Array.from({ length: 18 }, (_, i) => <circle key={`f${i}`} cx={r() * W} cy={560 + r() * 280} r={3 + r() * 3} fill="#f9e68a" opacity=".8" />)}
    </svg>
  );
});
