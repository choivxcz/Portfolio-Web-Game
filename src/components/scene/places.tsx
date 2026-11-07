import type { ReactNode } from "react";
import type { PlaceId } from "../../data/places";
import { rng } from "../../utils/random";
import { City, Windmill } from "./City";
import { cloud, hill, island } from "./shapes";

/**
 * Region scenes for the Expedition Board banners. Each region adds its own layers to
 * the shared landscape in RegionArt: "sky" (behind the distance), "far" (distant
 * shapes), "mid" (the landmark, in place of a generic building) and "front"
 * (atmosphere over everything). Every shape is original: the scenes are inspired by
 * each region's mood and architecture, not traced from the game.
 */
export type PlaceLayer = "sky" | "far" | "mid" | "front";
type Scene = Partial<Record<PlaceLayer, (g: string) => ReactNode>>;

/* ── Shared helpers ── */

/** Seeded scatter of points with a 0–1 value for size/opacity variety. */
function scatter(seed: number, n: number, x0: number, x1: number, y0: number, y1: number) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({ x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0), t: r() }));
}

/** Hip roof with up-turned eaves; (cx, y) is the middle of the eave line. */
function eaveRoof(cx: number, y: number, w: number, h: number, flare = 16) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  return (
    `M${l - flare} ${y - flare * 0.7}Q${l + w * 0.18} ${y - h * 0.08} ${l + w * 0.32} ${y - h}` +
    `H${r - w * 0.32}Q${r - w * 0.18} ${y - h * 0.08} ${r + flare} ${y - flare * 0.7}` +
    `Q${r} ${y + 6} ${r - 10} ${y + 6}H${l + 10}Q${l} ${y + 6} ${l - flare} ${y - flare * 0.7}Z`
  );
}

/**
 * A painted eave roof: the shadow it casts on the wall below, the roof itself,
 * rows of tile courses following its curve, a lit ridge and a pale edge on the eave.
 */
function Roof({ cx, y, w, h, flare = 16, fill }: { cx: number; y: number; w: number; h: number; flare?: number; fill: string }) {
  const courses = Math.max(2, Math.round(h / 9));
  const lines: string[] = [];
  for (let i = 1; i <= courses; i++) {
    const t = i / (courses + 1); // 0 at the eave, 1 at the ridge
    const half = (w / 2 + flare * (1 - t)) * (1 - t * 0.62);
    const yy = y - h * t - flare * 0.5 * (1 - t);
    const sag = 5 * (1 - t);
    lines.push(`M${(cx - half).toFixed(1)} ${(yy - sag).toFixed(1)}Q${cx} ${(yy + sag).toFixed(1)} ${(cx + half).toFixed(1)} ${(yy - sag).toFixed(1)}`);
  }
  return (
    <>
      <rect x={cx - w / 2 + 6} y={y + 2} width={w - 12} height={Math.max(6, h * 0.28)} fill="#2a2238" opacity=".28" />
      <path d={eaveRoof(cx, y, w, h, flare)} fill={fill} />
      <path d={lines.join("")} stroke="#000" strokeOpacity=".22" strokeWidth="2.4" fill="none" />
      <path d={lines.join("")} stroke="#fff" strokeOpacity=".12" strokeWidth="1.2" fill="none" transform="translate(0 -2.4)" />
      <path d={`M${cx - w * 0.17} ${y - h + 1}H${cx + w * 0.17}`} stroke="#fff6d8" strokeOpacity=".7" strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M${cx - w / 2 - flare} ${y - flare * 0.7}Q${cx - w / 2} ${y + 4} ${cx - w / 2 + 12} ${y + 5}H${cx + w / 2 - 12}Q${cx + w / 2} ${y + 4} ${cx + w / 2 + flare} ${y - flare * 0.7}`} stroke="#fff" strokeOpacity=".35" strokeWidth="2.4" fill="none" />
    </>
  );
}

/** Onion dome standing on (cx, y). */
function onion(cx: number, y: number, r: number) {
  return (
    `M${cx - r} ${y}C${cx - r * 1.55} ${y - r * 0.95} ${cx - r * 0.25} ${y - r * 1.45} ${cx} ${y - r * 2.4}` +
    `C${cx + r * 0.25} ${y - r * 1.45} ${cx + r * 1.55} ${y - r * 0.95} ${cx + r} ${y}Z`
  );
}

/** A long crystal shard from (x0, y0) to (x1, y1), widest at 40%. */
function shard(x0: number, y0: number, x1: number, y1: number, w: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * w;
  const py = (dx / len) * w;
  const mx = x0 + dx * 0.4;
  const my = y0 + dy * 0.4;
  return `M${x0} ${y0}L${mx + px} ${my + py}L${x1} ${y1}L${mx - px} ${my - py}Z`;
}

const INK = "#3a2f45";

/**
 * Wall with a lit left part and a shaded right half, painted with a pale cornice,
 * the shadow it casts, weathering toward the base and a plinth line.
 */
function Block({ x, y, w, h, lit, shade }: { x: number; y: number; w: number; h: number; lit: string; shade: string }) {
  const c = Math.max(3, h * 0.05);
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={lit} />
      <rect x={x + w / 2} y={y} width={w / 2} height={h} fill={shade} />
      <rect x={x} y={y + h * 0.7} width={w} height={h * 0.3} fill={INK} opacity=".1" />
      <rect x={x - 1} y={y} width={w + 2} height={c} fill="#fffaf0" opacity=".6" />
      <rect x={x} y={y + c} width={w} height={Math.max(2, c * 0.7)} fill={INK} opacity=".16" />
      <rect x={x} y={y + h - 3} width={w} height="3" fill={INK} opacity=".28" />
    </>
  );
}

/** A framed window: pale frame, glass with a reflection streak, and a sill shadow. */
function Win({ x, y, w, h, glass, arch = true, glow = false }: { x: number; y: number; w: number; h: number; glass: string; arch?: boolean; glow?: boolean }) {
  const r = arch ? w / 2 : 1.5;
  return (
    <>
      {glow && <rect x={x - w * 0.6} y={y - h * 0.3} width={w * 2.2} height={h * 1.6} rx={w} fill="#ffd98a" opacity=".22" />}
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={r + 2} fill="#fffaf0" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={glass} />
      {!glow && <path d={`M${x + w * 0.25} ${y + h * 0.75}L${x + w * 0.75} ${y + h * 0.2}`} stroke="#ffffff" strokeWidth={Math.max(1.5, w * 0.16)} opacity=".55" strokeLinecap="round" />}
      <path d={`M${x + w / 2} ${y + 2}V${y + h}M${x} ${y + h * 0.55}H${x + w}`} stroke="#fffaf0" strokeWidth="1.4" opacity=".75" />
      <rect x={x - 3} y={y + h + 2} width={w + 6} height="3" fill={INK} opacity=".3" />
    </>
  );
}

/** A soft highlight down the lit side of a dome or round shape. */
function DomeLight({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <path d={`M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx + r} ${cy}H${cx}Z`} fill={INK} opacity=".18" />
      <path d={`M${cx - r * 0.62} ${cy - r * 0.08}A${r * 0.7} ${r * 0.72} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.7}`} stroke="#ffffff" strokeWidth={Math.max(2, r * 0.12)} strokeLinecap="round" fill="none" opacity=".55" />
    </>
  );
}

/** Round, two-tone canopy cluster. */
function Canopy({ puffs, dark, mid, light }: { puffs: [number, number, number][]; dark: string; mid: string; light: string }) {
  return (
    <>
      {puffs.map(([x, y, r], i) => (
        <circle key={`d${i}`} cx={x} cy={y} r={r} fill={dark} />
      ))}
      {puffs.map(([x, y, r], i) => (
        <circle key={`m${i}`} cx={x - r * 0.16} cy={y - r * 0.2} r={r * 0.76} fill={mid} />
      ))}
      {puffs.map(([x, y, r], i) => (
        <circle key={`l${i}`} cx={x - r * 0.3} cy={y - r * 0.38} r={r * 0.4} fill={light} />
      ))}
      {/* cool underside and small sunlit leaf clusters for texture */}
      {puffs.map(([x, y, r], i) => (
        <path key={`u${i}`} d={`M${x - r * 0.86} ${y + r * 0.3}A${r} ${r * 0.55} 0 0 0 ${x + r * 0.86} ${y + r * 0.3}A${r * 0.9} ${r * 0.62} 0 0 1 ${x - r * 0.86} ${y + r * 0.3}Z`} fill="#1f2c4a" opacity=".18" />
      ))}
      {puffs.flatMap(([x, y, r], i) =>
        [
          [-0.52, -0.5, 0.15],
          [-0.2, -0.72, 0.12],
          [-0.68, -0.14, 0.1],
        ].map(([dx, dy, k], j) => <ellipse key={`h${i}-${j}`} cx={x + dx * r} cy={y + dy * r} rx={r * k} ry={r * k * 0.7} fill={light} />),
      )}
    </>
  );
}

function Snowfall({ seed, n, opacity = 1 }: { seed: number; n: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      {scatter(seed, n, 0, 1600, 0, 900).map(({ x, y, t }, i) => (
        <circle key={i} cx={x} cy={y} r={1.6 + t * 3.2} fill="#ffffff" opacity={0.45 + t * 0.5} />
      ))}
    </g>
  );
}

/* ── Mondstadt: a walled lake city, windmills and a great oak ── */
function GreatOak({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 34} ${y}C${x - 20} ${y - 60} ${x - 28} ${y - 120} ${x - 6} ${y - 190}H${x + 14}C${x + 30} ${y - 120} ${x + 26} ${y - 60} ${x + 44} ${y}Z`} fill="#6b4f3c" />
      <path d={`M${x} ${y - 150}L${x - 70} ${y - 225}M${x + 6} ${y - 160}L${x + 82} ${y - 232}`} stroke="#6b4f3c" strokeWidth="12" strokeLinecap="round" />
      <Canopy
        dark="#3f7f4a"
        mid="#5d9c52"
        light="#8cc56a"
        puffs={[
          [x - 92, y - 248, 78],
          [x + 96, y - 250, 80],
          [x - 30, y - 222, 70],
          [x + 42, y - 226, 70],
          [x + 4, y - 300, 102],
        ]}
      />
    </g>
  );
}

const mondstadt: Scene = {
  mid: () => (
    <>
      <ellipse cx="800" cy="620" rx="312" ry="22" fill="#8fbf74" />
      <ellipse cx="800" cy="630" rx="300" ry="9" fill="#3f8f8a" opacity=".35" />
      <City x={800} y={614} s={2.6} />
      {/* stone bridge to the eastern shore */}
      <path d="M1052 602L1206 646V658L1052 616Z" fill="#e2d8c8" />
      {[1092, 1134, 1176].map((x) => {
        const top = 616 + (x - 1052) * 0.286;
        return <rect key={x} x={x - 5} y={top} width="10" height="16" fill="#cbbfac" />;
      })}
      <Windmill x={430} y={664} s={1.35} />
      <Windmill x={1250} y={672} s={1.6} />
      <GreatOak x={190} y={676} />
    </>
  ),
  front: () => (
    <>
      {scatter(7, 16, 0, 1600, 160, 640).map(({ x, y, t }, i) => (
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(t * 60 - 30).toFixed(1)})`} opacity={0.55 + t * 0.4}>
          <circle r="10" fill="#ffffff" opacity=".35" />
          <circle r="4.5" fill="#ffffff" />
          <path d="M0 4v14" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
};

/* ── Liyue: a floating jade palace, harbor pagoda and stone pillars ── */
function Pagoda({ cx, y, tiers = 4 }: { cx: number; y: number; tiers?: number }) {
  const out: ReactNode[] = [];
  let base = y;
  for (let i = 0; i < tiers; i++) {
    const w = 150 - i * 30;
    const h = 54 - i * 4;
    out.push(
      <g key={i}>
        <Block x={cx - w / 2} y={base - h} w={w} h={h} lit="#f1e3c6" shade="#dccdaa" />
        {[-0.42, -0.14, 0.14, 0.42].map((f) => (
          <rect key={f} x={cx + f * w - 4} y={base - h} width="8" height={h} fill="#a8452f" />
        ))}
        <Roof cx={cx} y={base - h} w={w + 56} h={34} flare={22} fill="#4f5566" />
        <rect x={cx - w * 0.2} y={base - h - 37} width={w * 0.4} height="4" fill="#d9a646" />
      </g>,
    );
    base -= h + 26;
  }
  return (
    <g>
      {out}
      <rect x={cx - 3} y={base - 30} width="6" height="40" fill="#d9a646" />
      <circle cx={cx} cy={base - 34} r="7" fill="#d9a646" />
    </g>
  );
}

function LiyueHouse({ cx, y, w = 110, h = 62 }: { cx: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <Block x={cx - w / 2} y={y - h} w={w} h={h} lit="#efe0c4" shade="#d8c6a2" />
      <rect x={cx - w / 2} y={y - h} width="8" height={h} fill="#a8452f" />
      <rect x={cx + w / 2 - 8} y={y - h} width="8" height={h} fill="#a8452f" />
      <rect x={cx - 14} y={y - 36} width="28" height="36" fill="#7a3a2a" />
      {[cx - w / 2 + 16, cx + w / 2 - 34].map((wx) => (
        <g key={wx}>
          <rect x={wx - 2} y={y - 50} width="22" height="20" fill="#7a3a2a" />
          <rect x={wx} y={y - 48} width="18" height="16" fill="#ffd98a" />
          <path d={`M${wx + 6} ${y - 48}v16M${wx + 12} ${y - 48}v16M${wx} ${y - 43}h18M${wx} ${y - 37}h18`} stroke="#a8452f" strokeWidth="1.4" />
        </g>
      ))}
      {[cx - w / 2 + 4, cx + w / 2 - 4].map((lx) => (
        <g key={lx}>
          <path d={`M${lx} ${y - h}v8`} stroke="#5a3e2c" strokeWidth="1.5" />
          <circle cx={lx} cy={y - h + 18} r="14" fill="#ffb15c" opacity=".25" />
          <rect x={lx - 6} y={y - h + 8} width="12" height="16" rx="5" fill="#d8442f" />
          <rect x={lx - 6} y={y - h + 14} width="12" height="3" fill="#f6c35a" />
        </g>
      ))}
      <Roof cx={cx} y={y - h} w={w + 40} h={30} flare={18} fill="#55505e" />
      <rect x={cx - w * 0.18} y={y - h - 33} width={w * 0.36} height="4" fill="#d9a646" />
    </g>
  );
}

function Paifang({ cx, y, w = 130, h = 120 }: { cx: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={cx - w / 2} y={y - h} width="12" height={h} fill="#b2452f" />
      <rect x={cx + w / 2 - 12} y={y - h} width="12" height={h} fill="#b2452f" />
      <rect x={cx - w / 2 - 8} y={y - h + 20} width={w + 16} height="14" fill="#b2452f" />
      <rect x={cx - 22} y={y - h + 36} width="44" height="18" fill="#d9a646" />
      <rect x={cx - w / 2} y={y - h + 58} width={w} height="8" fill="#8a3424" />
      <Roof cx={cx} y={y - h + 20} w={w + 50} h={26} flare={18} fill="#3f6f6a" />
    </g>
  );
}

function JadePalace({ cx, y }: { cx: number; y: number }) {
  return (
    <g>
      <rect x={cx - 110} y={y - 14} width="220" height="14" fill="#e6d6b4" />
      <Block x={cx - 80} y={y - 62} w={160} h={48} lit="#f3e7cc" shade="#dccba6" />
      {[-72, -40, -4, 32, 64].map((x) => (
        <rect key={x} x={cx + x} y={y - 62} width="8" height="48" fill="#b2452f" />
      ))}
      <Roof cx={cx} y={y - 62} w={190} h={36} flare={22} fill="#3f9a7f" />
      <rect x={cx - 36} y={y - 102} width="72" height="5" fill="#d9a646" />
      <Block x={cx - 46} y={y - 130} w={92} h={32} lit="#f3e7cc" shade="#dccba6" />
      <Roof cx={cx} y={y - 130} w={128} h={30} flare={18} fill="#3f9a7f" />
      <rect x={cx - 3} y={y - 178} width="6" height="20" fill="#d9a646" />
      <circle cx={cx} cy={y - 182} r="6" fill="#d9a646" />
    </g>
  );
}

const liyue: Scene = {
  sky: () => {
    const isl = island(11, 330, 292, 270);
    return (
      <g>
        <ellipse cx="330" cy="300" rx="200" ry="74" fill="#fff6dc" opacity=".3" />
        <path d={isl.body} fill="#9a8f80" />
        <path d={isl.rim} fill="none" stroke="#86ad6a" strokeWidth="10" strokeLinejoin="round" />
        <JadePalace cx={330} y={288} />
      </g>
    );
  },
  mid: () => (
    <>
      <rect x="360" y="636" width="720" height="14" fill="#d8ccb0" />
      <rect x="360" y="650" width="720" height="10" fill="#a89a7c" />
      <Pagoda cx={480} y={636} />
      <LiyueHouse cx={650} y={636} />
      <LiyueHouse cx={770} y={636} w={100} h={56} />
      <LiyueHouse cx={890} y={636} />
      <Paifang cx={1010} y={636} />
      {/* a junk boat in the harbor */}
      <g>
        <path d="M1222 612V470" stroke="#5a3e2c" strokeWidth="5" />
        <path d="M1226 480Q1290 500 1298 560L1300 606H1226Z" fill="#d07a4a" />
        <path d="M1226 512H1290M1226 542H1296M1226 574H1299" stroke="#a85a34" strokeWidth="3" />
        <path d="M1182 522Q1210 542 1212 604H1182Z" fill="#e0a070" />
        <path d="M1160 626Q1240 652 1332 626L1322 610H1170Z" fill="#6b4a34" />
        <path d="M1170 611H1322" stroke="#8a6448" strokeWidth="4" />
      </g>
    </>
  ),
};

/* ── Inazuma: storm sky, a sacred cherry tree, a torii and a castle keep ── */
function Torii({ cx, y, w = 200, h = 180 }: { cx: number; y: number; w?: number; h?: number }) {
  const top = y - h;
  const px = w * 0.36;
  return (
    <g>
      {[-px, px].map((dx) => (
        <g key={dx}>
          <rect x={cx + dx - 7} y={top + 20} width="14" height={h - 20} fill="#c8352b" />
          <rect x={cx + dx - 10} y={y - 14} width="20" height="14" fill="#2b1f2a" />
          <rect x={cx + dx - 7} y={y + 4} width="14" height="20" fill="#c8352b" opacity=".25" />
        </g>
      ))}
      <rect x={cx - w * 0.46} y={top + 52} width={w * 0.92} height="12" fill="#c8352b" />
      <rect x={cx - 9} y={top + 22} width="18" height="30" fill="#c8352b" />
      <path d={`M${cx - w / 2 - 14} ${top - 4}Q${cx} ${top + 12} ${cx + w / 2 + 14} ${top - 4}L${cx + w / 2 + 4} ${top + 14}Q${cx} ${top + 26} ${cx - w / 2 - 4} ${top + 14}Z`} fill="#c8352b" />
      <path d={`M${cx - w / 2 - 18} ${top - 12}Q${cx} ${top + 2} ${cx + w / 2 + 18} ${top - 12}L${cx + w / 2 + 14} ${top - 2}Q${cx} ${top + 12} ${cx - w / 2 - 14} ${top - 2}Z`} fill="#2b1f2a" />
    </g>
  );
}

function CastleKeep({ cx, y }: { cx: number; y: number }) {
  const tiers: ReactNode[] = [];
  let base = y - 120;
  [250, 196, 150, 104].forEach((w, i) => {
    const h = 52 - i * 4;
    tiers.push(
      <g key={i}>
        <Block x={cx - w / 2} y={base - h} w={w} h={h} lit="#f3eff4" shade="#d9d2e0" />
        {Array.from({ length: Math.floor(w / 40) }, (_, k) => (
          <rect key={k} x={cx - w / 2 + 16 + k * 40} y={base - h + 14} width="14" height="18" fill="#3a3550" />
        ))}
        <Roof cx={cx} y={base - h} w={w + 60} h={30} flare={26} fill="#3a3550" />
        {i % 2 === 0 && <path d={`M${cx - 30} ${base - h - 2}Q${cx} ${base - h - 34} ${cx + 30} ${base - h - 2}Z`} fill="#3a3550" />}
      </g>,
    );
    base -= h + 22;
  });
  return (
    <g>
      <path d={`M${cx - 190} ${y}L${cx - 150} ${y - 120}H${cx + 150}L${cx + 190} ${y}Z`} fill="#8a8598" />
      <path d={`M${cx} ${y}V${y - 120}H${cx + 150}L${cx + 190} ${y}Z`} fill="#6f6a80" />
      <path d={`M${cx - 180} ${y - 30}H${cx + 180}M${cx - 170} ${y - 60}H${cx + 170}M${cx - 160} ${y - 90}H${cx + 160}`} stroke="#4f4a60" strokeWidth="3" opacity=".45" />
      {tiers}
      <rect x={cx - 26} y={base + 12} width="52" height="5" fill="#d9a646" />
      <path d={`M${cx - 30} ${base + 14}l-8 -16 12 6zM${cx + 30} ${base + 14}l8 -16 -12 6z`} fill="#d9a646" />
    </g>
  );
}

const inazuma: Scene = {
  sky: () => (
    <>
      {[cloud(21, 260, 170, 540, 110), cloud(23, 880, 120, 660, 120), cloud(29, 1430, 190, 470, 100)].map((c, ci) => (
        <g key={ci}>
          {c.map((q, i) => (
            <circle key={`s${i}`} cx={q.x} cy={q.y} r={q.r} fill="#2e2554" />
          ))}
          {c.map((q, i) => (
            <circle key={`l${i}`} cx={q.x} cy={q.y - q.r * 0.3} r={q.r * 0.84} fill="#4c4185" />
          ))}
        </g>
      ))}
      {["M1330 200L1296 296L1326 298L1278 412L1310 414L1254 540", "M1200 210L1214 270L1196 272L1212 330"].map((d) => (
        <g key={d} fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d={d} stroke="#c79bff" strokeWidth="24" opacity=".22" />
          <path d={d} stroke="#d9bcff" strokeWidth="10" opacity=".5" />
          <path d={d} stroke="#fbf4ff" strokeWidth="4" />
        </g>
      ))}
    </>
  ),
  far: (g) => (
    <>
      <defs>
        <radialGradient id={`${g}-sakura`}>
          <stop offset="0%" stopColor="#ffd6ea" stopOpacity=".7" />
          <stop offset="100%" stopColor="#ffd6ea" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M30 612L170 470L240 420L300 330L360 320L420 400L520 470L670 612Z" fill="#5b4f8c" />
      <path d="M300 330L360 320L420 400L390 424L340 380Z" fill="#7a6fb0" opacity=".6" />
      <circle cx="330" cy="262" r="200" fill={`url(#${g}-sakura)`} />
      <path d="M322 332L326 282L316 250H334L340 284L342 332Z" fill="#5a3b44" />
      <Canopy
        dark="#e07fac"
        mid="#f2a6c8"
        light="#ffd6e7"
        puffs={[
          [268, 262, 58],
          [394, 258, 60],
          [300, 286, 48],
          [364, 288, 48],
          [330, 226, 72],
        ]}
      />
    </>
  ),
  mid: () => (
    <>
      <Torii cx={450} y={646} />
      <path d="M380 660h40M480 664h50" stroke="#f3e7ff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <CastleKeep cx={960} y={650} />
    </>
  ),
  front: () => (
    <>
      {scatter(31, 28, 0, 1600, 120, 860).map(({ x, y, t }, i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx={4 + t * 4}
          ry={2.4 + t * 2}
          fill={i % 3 ? "#f7c6dc" : "#ef9cc0"}
          opacity={0.6 + t * 0.4}
          transform={`rotate(${(t * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})`}
        />
      ))}
    </>
  ),
};

/* ── Sumeru: a city grown into a giant tree, rainforest and great mushrooms ── */
function DomeHouse({ x, y, w, h, dome }: { x: number; y: number; w: number; h: number; dome: string }) {
  const r = w * 0.34;
  return (
    <g>
      <Block x={x - w / 2} y={y - h} w={w} h={h} lit="#f1e6cc" shade="#d9c9a6" />
      {/* doorway with a carved frame and a warm glow inside */}
      <rect x={x - 11} y={y - h * 0.66} width="22" height={h * 0.66} rx="11" fill="#c8b48a" />
      <rect x={x - 8} y={y - h * 0.62} width="16" height={h * 0.62} rx="8" fill="#2f6f6a" />
      <rect x={x - 5} y={y - h * 0.5} width="10" height={h * 0.3} rx="5" fill="#ffe3a0" opacity=".55" />
      {/* drum under the dome */}
      <rect x={x - r - 3} y={y - h - 4} width={r * 2 + 6} height="6" fill="#e9dcc0" />
      <path d={`M${x - r} ${y - h - 4}A${r} ${r} 0 0 1 ${x + r} ${y - h - 4}Z`} fill={dome} />
      <DomeLight cx={x} cy={y - h - 4} r={r} />
      <rect x={x - 2} y={y - h - r - 16} width="4" height="12" fill="#e6c35a" />
      <circle cx={x} cy={y - h - r - 17} r="3" fill="#f4d878" />
    </g>
  );
}

function Mushroom({ x, y, s, cap, spots }: { x: number; y: number; s: number; cap: string; spots: string }) {
  return (
    <g>
      <path d={`M${x - s * 0.12} ${y}Q${x - s * 0.06} ${y - s * 0.6} ${x - s * 0.16} ${y - s}H${x + s * 0.16}Q${x + s * 0.06} ${y - s * 0.6} ${x + s * 0.12} ${y}Z`} fill="#efe3c8" />
      <ellipse cx={x} cy={y - s * 0.97} rx={s * 0.62} ry={s * 0.07} fill="#c9b9a0" />
      <path d={`M${x - s * 0.75} ${y - s * 0.95}Q${x} ${y - s * 1.75} ${x + s * 0.75} ${y - s * 0.95}Q${x} ${y - s * 1.1} ${x - s * 0.75} ${y - s * 0.95}Z`} fill={cap} />
      {[
        [-0.36, -1.12, 0.07],
        [0.05, -1.26, 0.09],
        [0.4, -1.08, 0.06],
      ].map(([dx, dy, r], i) => (
        <circle key={i} cx={x + dx * s} cy={y + dy * s} r={r * s} fill={spots} opacity=".8" />
      ))}
    </g>
  );
}

const sumeru: Scene = {
  sky: () => (
    <g fill="#fffbe0" opacity=".1">
      <path d="M1380 0L1180 900H1300Z" />
      <path d="M1420 0L1420 900H1520Z" />
      <path d="M1340 0L960 900H1040Z" />
    </g>
  ),
  far: () => (
    <>
      <path d={hill([[0, 560], [90, 520], [180, 548], [260, 515], [360, 545], [470, 522], [560, 550], [1040, 550], [1130, 518], [1230, 546], [1320, 512], [1420, 540], [1510, 515], [1600, 535]])} fill="#86b8a0" />
      <path d={hill([[0, 600], [120, 574], [240, 598], [360, 570], [480, 596], [1120, 596], [1240, 568], [1360, 594], [1480, 572], [1600, 590]])} fill="#5f9a78" />
    </>
  ),
  mid: () => {
    const cx = 800;
    const y = 690;
    return (
      <g>
        <path d={`M${cx - 260} ${y}C${cx - 160} ${y - 14} ${cx - 110} ${y - 50} ${cx - 80} ${y - 120}H${cx + 80}C${cx + 110} ${y - 50} ${cx + 160} ${y - 14} ${cx + 260} ${y}Z`} fill="#7a5a3e" />
        <path
          d={`M${cx - 200} ${y}Q${cx - 120} ${y - 30} ${cx - 70} ${y - 110}M${cx + 200} ${y}Q${cx + 120} ${y - 30} ${cx + 70} ${y - 110}M${cx - 40} ${y}Q${cx - 40} ${y - 60} ${cx - 30} ${y - 120}M${cx + 40} ${y}Q${cx + 40} ${y - 60} ${cx + 30} ${y - 120}`}
          stroke="#5f4430"
          strokeWidth="8"
          fill="none"
        />
        <path d={`M${cx - 82} ${y - 110}C${cx - 70} ${y - 260} ${cx - 58} ${y - 360} ${cx - 46} ${y - 470}H${cx + 46}C${cx + 58} ${y - 360} ${cx + 70} ${y - 260} ${cx + 82} ${y - 110}Z`} fill="#8a6747" />
        <path d={`M${cx} ${y - 110}V${y - 470}H${cx + 46}C${cx + 58} ${y - 360} ${cx + 70} ${y - 260} ${cx + 82} ${y - 110}Z`} fill="#6e5136" />
        <path d={`M${cx - 30} ${y - 130}Q${cx - 40} ${y - 260} ${cx - 24} ${y - 420}M${cx + 20} ${y - 140}Q${cx + 30} ${y - 280} ${cx + 14} ${y - 430}`} stroke="#5f4430" strokeWidth="5" fill="none" opacity=".5" />
        <Canopy
          dark="#3f7f45"
          mid="#5d9a4f"
          light="#86bf63"
          puffs={[
            [cx - 370, 300, 80],
            [cx + 370, 300, 80],
            [cx - 250, 250, 120],
            [cx + 250, 250, 120],
            [cx - 60, 250, 120],
            [cx + 60, 250, 120],
            [cx - 130, 170, 150],
            [cx + 130, 170, 150],
            [cx, 130, 180],
          ]}
        />
        {[
          [cx - 330, 360, 70],
          [cx - 200, 350, 110],
          [cx + 190, 352, 90],
          [cx + 320, 362, 80],
        ].map(([x, top, len]) => (
          <path key={x} d={`M${x} ${top}q6 ${len / 2} -2 ${len}`} stroke="#3f7f45" strokeWidth="4" fill="none" />
        ))}
        {/* homes and walkways along the trunk */}
        <path d={`M${cx - 92} ${y - 52}H${cx - 70}M${cx + 92} ${y - 60}H${cx + 66}M${cx - 140} ${y - 132}H${cx - 66}M${cx + 130} ${y - 152}H${cx + 62}`} stroke="#8a6a46" strokeWidth="5" />
        <DomeHouse x={cx - 130} y={y - 50} w={80} h={56} dome="#3f9a8a" />
        <DomeHouse x={cx + 135} y={y - 58} w={86} h={60} dome="#4fae6a" />
        <DomeHouse x={cx - 172} y={y - 130} w={64} h={46} dome="#4fae6a" />
        <DomeHouse x={cx + 162} y={y - 150} w={60} h={44} dome="#3f9a8a" />
        <DomeHouse x={cx - 104} y={y - 214} w={54} h={40} dome="#c79a3a" />
        <DomeHouse x={cx + 108} y={y - 226} w={54} h={40} dome="#3f9a8a" />
        {/* the academy crowning the tree */}
        <circle cx={cx} cy="220" r="120" fill="#fff6c8" opacity=".25" />
        <rect x={cx - 110} y="296" width="220" height="16" fill="#e9dcc0" />
        <Block x={cx - 76} y={232} w={30} h={66} lit="#f6efe0" shade="#ddd0b6" />
        <Block x={cx + 46} y={232} w={30} h={66} lit="#f6efe0" shade="#ddd0b6" />
        <path d={`M${cx - 76} 232A15 15 0 0 1 ${cx - 46} 232ZM${cx + 46} 232A15 15 0 0 1 ${cx + 76} 232Z`} fill="#4fae6a" />
        <Block x={cx - 24} y={150} w={48} h={148} lit="#f6efe0" shade="#ddd0b6" />
        <rect x={cx - 10} y="180" width="20" height="34" rx="10" fill="#2f6f6a" />
        <rect x={cx - 8} y="236" width="16" height="40" rx="8" fill="#ffe9a8" />
        <path d={`M${cx - 32} 150A32 36 0 0 1 ${cx + 32} 150Z`} fill="#4fae6a" />
        <rect x={cx - 3} y="90" width="6" height="26" fill="#e6c35a" />
        <ellipse cx={cx} cy="196" rx="70" ry="14" fill="none" stroke="#e6c35a" strokeWidth="5" />
      </g>
    );
  },
  front: () => (
    <>
      <Mushroom x={150} y={836} s={170} cap="#4fa39a" spots="#c9f0e0" />
      <Mushroom x={262} y={850} s={78} cap="#d07a8a" spots="#ffe1e6" />
      <Mushroom x={1470} y={846} s={150} cap="#8a6fc0" spots="#e6d9ff" />
      {scatter(41, 22, 100, 1500, 260, 760).map(({ x, y, t }, i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={10 + t * 6} fill="#d6f58a" opacity=".18" />
          <circle cx={x} cy={y} r={2.5 + t * 2.5} fill="#e9ffb0" opacity=".9" />
        </g>
      ))}
    </>
  ),
};

/* ── Fontaine: a palace above the falls, a clock tower and an aqueduct ── */
function Palais({ cx, y }: { cx: number; y: number }) {
  const roof = "#4a6f9a";
  const gold = "#d9b04a";
  return (
    <g>
      {[-1, 1].map((s) => {
        const x0 = s < 0 ? cx - 288 : cx + 160;
        return (
          <g key={s}>
            <Block x={x0} y={y - 60} w={128} h={60} lit="#f4ede0" shade="#e0d6c4" />
            <path d={`M${x0 - 8} ${y - 60}L${x0 + 4} ${y - 84}H${x0 + 124}L${x0 + 136} ${y - 60}Z`} fill={roof} />
            <path d={Array.from({ length: 14 }, (_, k) => `M${x0 + 4 + k * 9} ${y - 82}l${(k - 6.5) * 0.9} 20`).join("")} stroke="#000" strokeOpacity=".16" strokeWidth="1.5" />
            <path d={`M${x0 + 4} ${y - 84}H${x0 + 124}`} stroke="#fff6d8" strokeOpacity=".6" strokeWidth="2.5" />
            {[22, 52, 82, 108].map((dx) => (
              <Win key={dx} x={x0 + dx - 6} y={y - 46} w={12} h={22} glass="#7ea8cc" />
            ))}
          </g>
        );
      })}
      <Block x={cx - 160} y={y - 96} w={320} h={96} lit="#f6efe2" shade="#e0d6c4" />
      <rect x={cx - 166} y={y - 102} width="332" height="6" fill="#d9c7a4" />
      <path d={`M${cx - 166} ${y - 102}L${cx - 150} ${y - 132}H${cx + 150}L${cx + 166} ${y - 102}Z`} fill={roof} />
      {/* slate courses and dormers on the mansard */}
      <path d={`M${cx - 160} ${y - 112}H${cx + 160}M${cx - 155} ${y - 122}H${cx + 155}`} stroke="#000" strokeOpacity=".18" strokeWidth="1.6" />
      {[-110, -70, 70, 110].map((dx) => (
        <g key={dx}>
          <rect x={cx + dx - 8} y={y - 128} width="16" height="18" fill="#f6efe2" />
          <path d={`M${cx + dx - 11} ${y - 127}L${cx + dx} ${y - 140}L${cx + dx + 11} ${y - 127}Z`} fill={roof} />
          <rect x={cx + dx - 4} y={y - 124} width="8" height="11" rx="4" fill="#7ea8cc" />
        </g>
      ))}
      <path d={`M${cx - 150} ${y - 132}H${cx + 150}`} stroke={gold} strokeWidth="3" />
      {Array.from({ length: 11 }, (_, k) => cx - 140 + k * 28)
        .filter((x) => Math.abs(x - cx) > 40)
        .map((x) => (
          <g key={x}>
            <Win x={x - 6} y={y - 84} w={12} h={24} glass="#7ea8cc" />
            <Win x={x - 6} y={y - 44} w={12} h={24} glass="#7ea8cc" />
          </g>
        ))}
      <rect x={cx - 40} y={y - 96} width="80" height="96" fill="#fbf6ec" />
      {[-30, -10, 10, 30].map((dx) => (
        <g key={dx}>
          <rect x={cx + dx - 4} y={y - 92} width="8" height="92" fill="#f3ebdc" />
          <rect x={cx + dx + 1} y={y - 92} width="3" height="92" fill={INK} opacity=".18" />
          <rect x={cx + dx - 6} y={y - 94} width="12" height="5" fill="#e6dcc8" />
        </g>
      ))}
      <rect x={cx - 40} y={y - 6} width="80" height="6" fill="#e6dcc8" />
      <path d={`M${cx - 48} ${y - 96}L${cx} ${y - 124}L${cx + 48} ${y - 96}Z`} fill="#efe6d4" />
      <Block x={cx - 46} y={y - 172} w={92} h={42} lit="#f6efe2" shade="#e0d6c4" />
      {[-26, 0, 26].map((dx) => (
        <Win key={dx} x={cx + dx - 5} y={y - 164} w={10} h={22} glass="#7ea8cc" />
      ))}
      <path d={`M${cx - 54} ${y - 172}A54 64 0 0 1 ${cx + 54} ${y - 172}Z`} fill="#3f8fb5" />
      <DomeLight cx={cx} cy={y - 172} r={54} />
      <path d={`M${cx} ${y - 236}V${y - 172}M${cx - 30} ${y - 226}Q${cx - 44} ${y - 200} ${cx - 38} ${y - 172}M${cx + 30} ${y - 226}Q${cx + 44} ${y - 200} ${cx + 38} ${y - 172}`} stroke={gold} strokeWidth="3" fill="none" />
      <rect x={cx - 9} y={y - 256} width="18" height="22" fill="#f6efe2" />
      <path d={`M${cx - 7} ${y - 256}L${cx} ${y - 294}L${cx + 7} ${y - 256}Z`} fill={gold} />
      {/* clock tower */}
      <Block x={cx + 294} y={y - 172} w={32} h={172} lit="#f6efe2" shade="#e0d6c4" />
      <circle cx={cx + 310} cy={y - 142} r="11" fill="#ffffff" stroke={gold} strokeWidth="3" />
      <path d={`M${cx + 310} ${y - 150}V${y - 142}H${cx + 316}`} stroke="#3b4255" strokeWidth="2" fill="none" />
      <path d={`M${cx + 288} ${y - 172}L${cx + 310} ${y - 228}L${cx + 332} ${y - 172}Z`} fill={roof} />
      <rect x={cx + 308} y={y - 250} width="4" height="24" fill={gold} />
    </g>
  );
}

const fontaine: Scene = {
  far: () => {
    const arches: number[] = [];
    for (let x = 1090; x < 1600; x += 56) arches.push(x);
    return (
      <g opacity=".9">
        <rect x="1080" y="512" width="520" height="70" fill="#d9d2c4" />
        <rect x="1080" y="506" width="520" height="8" fill="#ece6da" />
        {arches.map((x) => (
          <path key={x} d={`M${x + 8} 582V552A20 20 0 0 1 ${x + 48} 552V582Z`} fill="#c9d8ea" />
        ))}
      </g>
    );
  },
  mid: (g) => (
    <>
      <defs>
        <linearGradient id={`${g}-cliff`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#efe6d6" />
          <stop offset="100%" stopColor="#b9ab95" />
        </linearGradient>
        <linearGradient id={`${g}-fall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bfe6f5" />
        </linearGradient>
      </defs>
      <path d="M410 652L428 580L446 520L462 470H1138L1154 520L1172 580L1190 652Z" fill={`url(#${g}-cliff)`} />
      <path d="M440 530H1160M430 575H1170M420 618H1180" stroke="#a89880" strokeWidth="3" opacity=".45" />
      {[540, 800, 1060].map((x) => (
        <g key={x}>
          <rect x={x - 18} y="468" width="36" height="178" fill={`url(#${g}-fall)`} opacity=".95" />
          <path d={`M${x - 8} 482V640M${x + 6} 472V636`} stroke="#9fd6ec" strokeWidth="3" opacity=".7" />
          <circle cx={x - 26} cy="648" r="14" fill="#ffffff" opacity=".9" />
          <circle cx={x} cy="652" r="18" fill="#ffffff" opacity=".9" />
          <circle cx={x + 24} cy="648" r="14" fill="#ffffff" opacity=".9" />
        </g>
      ))}
      <Palais cx={800} y={470} />
    </>
  ),
  front: () => (
    <>
      {scatter(53, 9, 150, 1450, 220, 700).map(({ x, y, t }, i) => {
        const r = 8 + t * 14;
        return (
          <g key={i} opacity={0.5 + t * 0.35}>
            <circle cx={x} cy={y} r={r} fill="#e6f7ff" fillOpacity=".18" stroke="#ffffff" strokeWidth="2" />
            <circle cx={x - r * 0.35} cy={y - r * 0.35} r={2 + t * 3} fill="#ffffff" />
          </g>
        );
      })}
    </>
  ),
};

/* ── Natlan: a smoking volcano, mesas and a stepped temple with a sacred flame ── */
function Bunting({ x0, y0, x1, y1, sag, n }: { x0: number; y0: number; x1: number; y1: number; sag: number; n: number }) {
  const colors = ["#3fb8a6", "#e0533d", "#f0b232"];
  return (
    <g>
      <path d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag * 2} ${x1} ${y1}`} stroke="#4a3020" strokeWidth="2" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 1) / (n + 1);
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
        return <path key={i} d={`M${x - 7} ${y}H${x + 7}L${x} ${y + 16}Z`} fill={colors[i % 3]} />;
      })}
    </g>
  );
}

function StepTemple({ cx, y, g }: { cx: number; y: number; g: string }) {
  const lh = 46;
  const top = y - 4 * lh;
  const fy = top - 66;
  return (
    <g>
      <defs>
        <radialGradient id={`${g}-flame`}>
          <stop offset="0%" stopColor="#ffd27a" stopOpacity=".75" />
          <stop offset="45%" stopColor="#ff7a2f" stopOpacity=".3" />
          <stop offset="100%" stopColor="#ff7a2f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={fy - 50} r="150" fill={`url(#${g}-flame)`} />
      <Bunting x0={cx - 310} y0={y - 168} x1={cx - 70} y1={top - 30} sag={34} n={9} />
      <Bunting x0={cx + 310} y0={y - 168} x1={cx + 70} y1={top - 30} sag={34} n={9} />
      {[-310, 310].map((dx) => (
        <rect key={dx} x={cx + dx - 4} y={y - 176} width="8" height="180" fill="#5a3a26" />
      ))}
      {[440, 350, 266, 186].map((w, i) => {
        const t = y - (i + 1) * lh;
        return (
          <g key={w}>
            <Block x={cx - w / 2} y={t} w={w} h={lh} lit="#d39a62" shade="#a96d44" />
            <rect x={cx - w / 2} y={t} width={w} height="6" fill="#e9bb84" />
            {/* stone block joints, staggered per course */}
            <path
              d={Array.from({ length: Math.floor(w / 34) }, (_, k) => `M${cx - w / 2 + 17 + k * 34 + (i % 2) * 17} ${t + 8}v12M${cx - w / 2 + k * 34 + (i % 2) * 17} ${t + 30}v14`).join("")}
              stroke="#6e4128"
              strokeOpacity=".35"
              strokeWidth="2"
            />
            <rect x={cx - w / 2} y={t + 22} width={w} height="6" fill="#3fb8a6" opacity=".6" />
            {/* carved glyphs on the band */}
            {Array.from({ length: Math.floor(w / 26) }, (_, k) => (
              <rect key={k} x={cx - w / 2 + 9 + k * 26} y={t + 23} width="8" height="4" fill="#e9fff8" opacity=".55" />
            ))}
          </g>
        );
      })}
      <path d={`M${cx - 46} ${y}L${cx - 30} ${top}H${cx + 30}L${cx + 46} ${y}Z`} fill="#ecc08c" />
      {Array.from({ length: 15 }, (_, k) => {
        const sy = y - 12 - k * 12;
        const hw = 46 - ((y - sy) / (y - top)) * 16;
        return <path key={k} d={`M${cx - hw} ${sy}H${cx + hw}`} stroke="#b9875a" strokeWidth="2" opacity=".6" />;
      })}
      <Block x={cx - 60} y={top - 58} w={120} h={58} lit="#b8704a" shade="#97583a" />
      <rect x={cx - 16} y={top - 40} width="32" height="40" fill="#3a2220" />
      <rect x={cx - 72} y={top - 66} width="144" height="10" fill="#e9bb84" />
      <path d={`M${cx - 38} ${fy}C${cx - 62} ${fy - 50} ${cx - 22} ${fy - 72} ${cx - 14} ${fy - 122}C${cx + 4} ${fy - 92} ${cx + 26} ${fy - 112} ${cx + 18} ${fy - 152}C${cx + 62} ${fy - 100} ${cx + 52} ${fy - 30} ${cx + 38} ${fy}Z`} fill="#ff7a2f" />
      <path d={`M${cx - 20} ${fy}C${cx - 34} ${fy - 30} ${cx - 10} ${fy - 44} ${cx - 6} ${fy - 74}C${cx + 6} ${fy - 56} ${cx + 18} ${fy - 66} ${cx + 12} ${fy - 92}C${cx + 36} ${fy - 60} ${cx + 30} ${fy - 18} ${cx + 20} ${fy}Z`} fill="#ffd36b" />
    </g>
  );
}

const natlan: Scene = {
  sky: (g) => (
    <>
      <defs>
        <linearGradient id={`${g}-volc`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a3340" />
          <stop offset="100%" stopColor="#2f1f2c" />
        </linearGradient>
        <radialGradient id={`${g}-crater`}>
          <stop offset="0%" stopColor="#ffd27a" stopOpacity=".8" />
          <stop offset="40%" stopColor="#ff7a2f" stopOpacity=".35" />
          <stop offset="100%" stopColor="#ff7a2f" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[
        [392, 214, 38],
        [420, 168, 50],
        [470, 128, 60],
        [545, 102, 66],
        [640, 94, 62],
        [730, 102, 52],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#4d3a44" opacity=".8" />
          <circle cx={x - r * 0.2} cy={y - r * 0.3} r={r * 0.7} fill="#80606a" opacity=".55" />
        </g>
      ))}
      <circle cx="370" cy="262" r="150" fill={`url(#${g}-crater)`} />
      <path d="M60 640L250 380L330 272Q370 258 410 272L520 400L720 640Z" fill={`url(#${g}-volc)`} />
      <path d="M330 272Q350 266 370 266L300 640H60L250 380Z" fill="#7a4650" opacity=".45" />
      <path d="M330 272Q370 258 410 272" stroke="#ffb347" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M352 272Q340 330 356 380T330 470M392 274Q404 340 388 400T420 500" stroke="#ff8a3d" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".9" />
    </>
  ),
  far: (g) => (
    <>
      {["M760 612L800 470H960L1000 612Z", "M1060 612L1090 500H1250L1290 612Z", "M1340 612L1370 430H1560L1600 470V612Z"].map((d) => (
        <path key={d} d={d} fill={`url(#${g}-far)`} />
      ))}
      <path d="M790 520H970M1080 550H1270M1360 500H1590M1350 560H1600" stroke="#7a3a30" strokeWidth="4" opacity=".3" />
      <path d="M800 470H960M1090 500H1250M1370 430H1560" stroke="#8f9a4a" strokeWidth="8" strokeLinecap="round" />
    </>
  ),
  mid: (g) => <StepTemple cx={980} y={672} g={g} />,
  front: () => (
    <>
      {scatter(61, 34, 300, 1500, 150, 780).map(({ x, y, t }, i) => (
        <circle key={i} cx={x} cy={y} r={1.5 + t * 3} fill={i % 3 ? "#ffb347" : "#ff6a2f"} opacity={0.45 + t * 0.5} />
      ))}
    </>
  ),
};

/* ── Nod-Krai: a great moon, aurora, a lighthouse isle and northern cottages ── */
function Cottage({ x, y, w = 54, h = 36, wall }: { x: number; y: number; w?: number; h?: number; wall: string }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill={wall} />
      <rect x={x} y={y - h} width={w / 2} height={h} fill="#000" opacity=".2" />
      <path d={`M${x - w / 2 - 6} ${y - h}L${x} ${y - h - w * 0.75}L${x + w / 2 + 6} ${y - h}Z`} fill="#2b3040" />
      <rect x={x - 12} y={y - h + 10} width="12" height="12" fill="#ffd27a" />
      <rect x={x + 6} y={y - 20} width="10" height="20" fill="#2b2420" />
    </g>
  );
}

const nodkrai: Scene = {
  sky: (g) => (
    <>
      <defs>
        <linearGradient id={`${g}-aurora`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7ff0c0" />
          <stop offset="50%" stopColor="#8fb8ff" />
          <stop offset="100%" stopColor="#b48cff" />
        </linearGradient>
      </defs>
      {["M-40 300C180 200 360 330 560 230S880 160 980 210", "M-40 380C200 300 420 400 640 320S880 280 980 300"].map((d) =>
        [
          [70, 0.12],
          [34, 0.2],
          [10, 0.45],
        ].map(([w, o]) => <path key={`${d}${w}`} d={d} stroke={`url(#${g}-aurora)`} strokeWidth={w} opacity={o} fill="none" strokeLinecap="round" />),
      )}
      <circle cx="1160" cy="240" r="146" fill="none" stroke="#cfd8ff" strokeWidth="3" opacity=".2" />
    </>
  ),
  far: () => (
    <>
      <path d="M0 604V560L50 548L100 520L150 530L200 500L250 515L300 560L360 604Z" fill="#26345c" />
      <path d="M1240 604L1290 570L1350 560L1400 528L1460 540L1520 515L1600 530V604Z" fill="#26345c" />
      <path d="M880 604L910 586L950 580L990 604Z" fill="#2c3b66" />
    </>
  ),
  mid: (g) => (
    <>
      <defs>
        <linearGradient id={`${g}-beam`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#fff3c4" stopOpacity=".5" />
          <stop offset="100%" stopColor="#fff3c4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[
        [606, 140],
        [618, 96],
        [630, 150],
        [642, 80],
        [654, 120],
      ].map(([y, w]) => (
        <path key={y} d={`M${1160 - w / 2} ${y}H${1160 + w / 2}`} stroke="#e6ecff" strokeWidth="4" strokeLinecap="round" opacity=".45" />
      ))}
      <path d="M470 418L-20 340V500Z" fill={`url(#${g}-beam)`} />
      <path d="M360 662L392 610L440 590L480 566L540 552L610 556L668 572L720 566L790 596L830 662Z" fill="#3a4656" />
      <path d="M392 610L440 590L480 566L540 552L610 556L668 572L720 566L790 596" stroke="#5a6a80" strokeWidth="6" fill="none" strokeLinejoin="round" />
      <path d="M452 576L460 432H480L488 576Z" fill="#dfe3ea" />
      <path d="M470 576V432H480L488 576Z" fill="#b9c0cc" />
      <path d="M455 530H485L486 548H454ZM457 478H483L484 494H456Z" fill="#b5473a" />
      <rect x="456" y="428" width="28" height="6" fill="#2b3040" />
      <circle cx="470" cy="416" r="42" fill="#ffe8a0" opacity=".25" />
      <rect x="461" y="404" width="18" height="24" fill="#ffe8a0" />
      <path d="M456 404L470 386L484 404Z" fill="#2b3040" />
      <Cottage x={590} y={558} wall="#8a3b30" />
      <Cottage x={652} y={570} w={46} h={32} wall="#6a4a38" />
      <Cottage x={724} y={574} wall="#8a3b30" />
      <path d="M800 640H930" stroke="#3a2e28" strokeWidth="6" />
      {[820, 860, 900].map((x) => (
        <rect key={x} x={x - 2} y="640" width="4" height="18" fill="#3a2e28" />
      ))}
    </>
  ),
  front: () => (
    <>
      {[
        [300, 700, 420, 26],
        [1000, 690, 520, 30],
        [700, 744, 600, 24],
      ].map(([cx, cy, rx, ry]) => (
        <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} fill="#aab8e6" opacity=".12" />
      ))}
      {scatter(71, 16, 200, 1500, 300, 760).map(({ x, y, t }, i) => (
        <circle key={i} cx={x} cy={y} r={2 + t * 2} fill="#e6ecff" opacity={0.4 + t * 0.5} />
      ))}
    </>
  ),
};

/* ── Snezhnaya: a palace of onion domes in the snow ── */
function WinterPalace({ cx, y }: { cx: number; y: number }) {
  const wall = "#eef1f6";
  const shade = "#cdd6e2";
  const win = "#ffd98a";
  const gold = "#d9a646";
  const tower = (x: number, w: number, top: number, r: number, dome: string) => (
    <g key={x}>
      <Block x={x - w / 2} y={top} w={w} h={y - top} lit={wall} shade={shade} />
      <rect x={x - w / 2 - 3} y={top - 5} width={w + 6} height="7" fill="#ffffff" />
      <path d={onion(x, top - 4, r)} fill={dome} />
      <path d={`M${x} ${top - 4 - r * 2.4}C${x + r * 0.25} ${top - 4 - r * 1.45} ${x + r * 1.55} ${top - 4 - r * 0.95} ${x + r} ${top - 4}H${x}Z`} fill={INK} opacity=".2" />
      <path d={`M${x - r * 0.6} ${top - r * 0.6}Q${x - r * 0.75} ${top - r * 1.5} ${x - r * 0.12} ${top - r * 2.1}`} stroke="#ffffff" strokeWidth="4" fill="none" opacity=".55" />
      <rect x={x - w / 2 - 4} y={top - 7} width={w + 8} height="5" rx="2.5" fill="#ffffff" />
      <rect x={x - 2} y={top - 4 - r * 2.4 - 22} width="4" height="24" fill={gold} />
      <Win x={x - 6} y={top + 14} w={12} h={22} glass={win} glow />
    </g>
  );
  return (
    <g>
      <Block x={cx - 280} y={y - 100} w={560} h={100} lit={wall} shade={shade} />
      {Array.from({ length: 20 }, (_, k) => cx - 276 + k * 28).map((x) => (
        <g key={x}>
          <rect x={x} y={y - 112} width="16" height="12" fill={wall} />
          <rect x={x} y={y - 114} width="16" height="4" fill="#ffffff" />
        </g>
      ))}
      {Array.from({ length: 13 }, (_, k) => cx - 240 + k * 40)
        .filter((x) => Math.abs(x - cx) > 60)
        .map((x) => (
          <g key={x}>
            <Win x={x - 7} y={y - 84} w={14} h={24} glass={win} glow />
            <Win x={x - 7} y={y - 46} w={14} h={24} glass={win} glow />
          </g>
        ))}
      {tower(cx - 250, 56, y - 200, 30, "#3f8fa8")}
      {tower(cx + 250, 56, y - 200, 30, "#3f8fa8")}
      {tower(cx - 130, 44, y - 160, 22, gold)}
      {tower(cx + 130, 44, y - 160, 22, gold)}
      <Block x={cx - 60} y={y - 230} w={120} h={230} lit={wall} shade={shade} />
      {[-30, 0, 30].map((dx) => (
        <Win key={dx} x={cx + dx - 8} y={y - 200} w={16} h={40} glass={win} glow />
      ))}
      {/* snow resting on the ledges */}
      <path d={`M${cx - 284} ${y - 100}q140 -6 284 0t284 0v4h-568z`} fill="#ffffff" />
      <rect x={cx - 20} y={y - 56} width="40" height="56" rx="20" fill="#5a6a86" />
      <rect x={cx - 66} y={y - 236} width="132" height="8" fill="#ffffff" />
      <Block x={cx - 36} y={y - 290} w={72} h={60} lit={wall} shade={shade} />
      <rect x={cx - 40} y={y - 296} width="80" height="8" fill="#ffffff" />
      <path d={onion(cx, y - 292, 48)} fill="#2f6f9a" />
      <path d={`M${cx} ${y - 292 - 115}C${cx + 12} ${y - 292 - 70} ${cx + 74} ${y - 292 - 46} ${cx + 48} ${y - 292}H${cx}Z`} fill={INK} opacity=".2" />
      <path d={`M${cx - 30} ${y - 320}Q${cx - 38} ${y - 362} ${cx - 6} ${y - 394}`} stroke="#ffffff" strokeWidth="6" fill="none" opacity=".5" />
      <path d={`M${cx - 44} ${y - 302}Q${cx} ${y - 318} ${cx + 44} ${y - 302}`} stroke={gold} strokeWidth="4" fill="none" />
      <rect x={cx - 3} y={y - 292 - 115 - 40} width="6" height="42" fill={gold} />
      <path d={`M${cx - 200} ${y + 6}Q${cx - 100} ${y - 14} ${cx} ${y + 6}Q${cx + 100} ${y - 14} ${cx + 200} ${y + 6}Z`} fill="#ffffff" opacity=".85" />
    </g>
  );
}

const snezhnaya: Scene = {
  mid: () => <WinterPalace cx={800} y={664} />,
  front: () => <Snowfall seed={81} n={80} />,
};

/* ── Dragonspine: a crimson crystal tree on a frozen summit ── */
const dragonspine: Scene = {
  sky: () => (
    <>
      {scatter(83, 26, 0, 1600, 0, 360).map(({ x, y, t }, i) => (
        <circle key={i} cx={x} cy={y} r={1 + t * 1.6} fill="#ffffff" opacity={0.3 + t * 0.4} />
      ))}
    </>
  ),
  mid: (g) => {
    const cx = 800;
    const y = 556;
    const branches: [number, number, number, number][] = [
      [-6, -200, -150, -330],
      [-8, -176, -214, -262],
      [-4, -224, -92, -392],
      [0, -240, 0, -420],
      [4, -224, 100, -390],
      [8, -190, 162, -322],
      [8, -168, 222, -252],
      [-4, -150, -64, -300],
      [4, -160, 62, -306],
    ];
    return (
      <g>
        <defs>
          <radialGradient id={`${g}-crimson`}>
            <stop offset="0%" stopColor="#ff6a7a" stopOpacity=".55" />
            <stop offset="100%" stopColor="#ff6a7a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M470 690Q640 560 800 548Q960 560 1130 690Z" fill="#f1f6fb" />
        <path d="M800 548Q960 560 1130 690H800Z" fill="#cdd9e8" />
        <circle cx={cx} cy={y - 220} r="250" fill={`url(#${g}-crimson)`} />
        {[
          [560, 640, 120],
          [612, 632, 70],
          [1002, 632, 92],
          [1060, 644, 140],
        ].map(([x, base, h]) => (
          <g key={x}>
            <Block x={x - 14} y={base - h} w={28} h={h} lit="#d6dde8" shade="#aab6c8" />
            <path d={`M${x - 16} ${base - h}l8 -10 8 6 8 -12 8 16z`} fill="#d6dde8" />
            <ellipse cx={x} cy={base - h - 4} rx="17" ry="6" fill="#ffffff" />
          </g>
        ))}
        <path d={`M${cx - 26} ${y}L${cx - 14} ${y - 90}L${cx - 30} ${y - 160}L${cx - 8} ${y - 250}H${cx + 10}L${cx + 26} ${y - 160}L${cx + 14} ${y - 90}L${cx + 28} ${y}Z`} fill="#b8303f" />
        <path d={`M${cx + 1} ${y}V${y - 250}H${cx + 10}L${cx + 26} ${y - 160}L${cx + 14} ${y - 90}L${cx + 28} ${y}Z`} fill="#8a2232" />
        {branches.map(([sx, sy, ex, ey], i) => (
          <path key={i} d={shard(cx + sx, y + sy, cx + ex, y + ey, 10 + (i % 3) * 3)} fill={i % 2 ? "#d83a4c" : "#a82838"} />
        ))}
        {branches.map(([, , ex, ey], i) => (
          <g key={`c${i}`}>
            <circle cx={cx + ex} cy={y + ey} r="22" fill="#ff6a7a" opacity=".3" />
            <path d={shard(cx + ex - 14, y + ey + 10, cx + ex + 6, y + ey - 26, 7)} fill="#ff5a6e" />
            <path d={shard(cx + ex + 8, y + ey + 8, cx + ex + 22, y + ey - 14, 5)} fill="#ff8a96" />
          </g>
        ))}
      </g>
    );
  },
  front: () => (
    <>
      <Snowfall seed={87} n={44} opacity={0.9} />
      {scatter(89, 12, 500, 1100, 140, 560).map(({ x, y, t }, i) => (
        <path key={i} d={`M${x} ${y - 6}l3 6 -3 6 -3 -6z`} fill="#ff8a96" opacity={0.5 + t * 0.5} />
      ))}
    </>
  ),
};

/* ── The Chasm: a vast mine pit with scaffolds and a crane ── */
const chasm: Scene = {
  mid: (g) => (
    <>
      <defs>
        <radialGradient id={`${g}-pit`} cx=".5" cy=".3" r=".65">
          <stop offset="0%" stopColor="#0e0b14" />
          <stop offset="55%" stopColor="#2e2630" />
          <stop offset="100%" stopColor="#6d5a46" />
        </radialGradient>
      </defs>
      <ellipse cx="820" cy="702" rx="450" ry="100" fill="#b49a76" />
      <ellipse cx="820" cy="708" rx="410" ry="84" fill="#7d6750" />
      <ellipse cx="820" cy="716" rx="370" ry="70" fill={`url(#${g}-pit)`} />
      <path d="M470 714Q820 640 1170 714M500 726Q820 664 1140 726" stroke="#9a8264" strokeWidth="3" fill="none" opacity=".5" />
      <path d="M700 770L720 708L742 698L760 770ZM900 770L914 720L940 712L958 770Z" fill="#3a2f2a" />
      <path d="M380 700Q820 590 1260 700M380 708Q820 598 1260 708" stroke="#5a4630" strokeWidth="4" fill="none" />
      {/* scaffold and pulley */}
      <g stroke="#6b4a34" strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M490 650V486M550 650V486M486 486H554M490 610H550M490 568H550M490 526H550" />
        <path d="M490 610L550 568M550 610L490 568M490 568L550 526M550 568L490 526" strokeWidth="3" />
      </g>
      <circle cx="520" cy="470" r="16" fill="none" stroke="#5a3e2c" strokeWidth="5" />
      <path d="M520 486L620 742" stroke="#3a2a20" strokeWidth="2" />
      {/* crane */}
      <path d="M1150 646V470M1150 490L960 446M1150 540L1060 466" stroke="#6b4a34" strokeWidth="7" strokeLinecap="round" />
      <path d="M962 448V700" stroke="#3a2a20" strokeWidth="2" />
      <rect x="946" y="700" width="32" height="22" fill="#6b4a34" />
      {[
        [600, 668],
        [700, 640],
        [820, 630],
        [940, 640],
        [1050, 668],
      ].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="14" fill="#ffd27a" opacity=".3" />
          <circle cx={x} cy={y} r="5" fill="#ffe9a8" />
        </g>
      ))}
    </>
  ),
};

/* ── Enkanomiya: an artificial sun over a sunken land of white stone ── */
function WhiteHall({ cx, y, w, h }: { cx: number; y: number; w: number; h: number }) {
  return (
    <g>
      <Block x={cx - w / 2} y={y - h} w={w} h={h} lit="#e6ecf2" shade="#b9c4d4" />
      <rect x={cx - w / 2} y={y - h * 0.45} width={w} height="3" fill="#7fe7ff" />
      <path d={`M${cx - w / 2 - 14} ${y - h}L${cx - w / 4} ${y - h - 26}H${cx + w / 4}L${cx + w / 2 + 14} ${y - h}Z`} fill="#2e4a5a" />
      <path d={`M${cx - w / 2 - 14} ${y - h}H${cx + w / 2 + 14}`} stroke="#7fe7ff" strokeWidth="2" />
    </g>
  );
}

const enkanomiya: Scene = {
  sky: (g) => {
    const a = island(93, 320, 360, 220);
    const b = island(97, 1290, 330, 250);
    return (
      <>
        <defs>
          <radialGradient id={`${g}-sun`}>
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fff7d6" />
            <stop offset="100%" stopColor="#ffe9a8" />
          </radialGradient>
          <radialGradient id={`${g}-halo`}>
            <stop offset="0%" stopColor="#fff4cf" stopOpacity=".22" />
            <stop offset="100%" stopColor="#fff4cf" stopOpacity="0" />
          </radialGradient>
        </defs>
        {scatter(91, 40, 0, 1600, 0, 520).map(({ x, y, t }, i) => (
          <circle key={i} cx={x} cy={y} r={1.5 + t * 1.5} fill="#7fe0f0" opacity={0.3 + t * 0.5} />
        ))}
        <circle cx="800" cy="220" r="320" fill={`url(#${g}-halo)`} />
        <circle cx="800" cy="220" r="74" fill={`url(#${g}-sun)`} />
        <ellipse cx="800" cy="220" rx="130" ry="26" fill="none" stroke="#bfe9ff" strokeWidth="3" opacity=".6" transform="rotate(-14 800 220)" />
        <ellipse cx="800" cy="220" rx="164" ry="34" fill="none" stroke="#bfe9ff" strokeWidth="2" opacity=".35" transform="rotate(10 800 220)" />
        {[
          { isl: a, cx: 320, y: 356, w: 100 },
          { isl: b, cx: 1290, y: 326, w: 120 },
        ].map(({ isl, cx, y, w }) => (
          <g key={cx}>
            <path d={isl.body} fill="#3a4a6e" />
            <path d={isl.rim} stroke="#e6ecf2" strokeWidth="8" fill="none" />
            <WhiteHall cx={cx} y={y} w={w} h={44} />
          </g>
        ))}
      </>
    );
  },
  mid: () => (
    <>
      {[
        [520, 612, 560],
        [580, 572, 440],
        [650, 532, 300],
      ].map(([x, y, w]) => (
        <g key={y}>
          <Block x={x} y={y} w={w} h={40} lit="#dfe6ee" shade="#aeb9ca" />
          <path d={`M${x} ${y + 2}H${x + w}`} stroke="#7fe7ff" strokeWidth="3" opacity=".9" />
        </g>
      ))}
      <rect x="760" y="440" width="80" height="92" fill="#7fe7ff" opacity=".22" />
      <Block x={736} y={428} w={24} h={104} lit="#eef2f6" shade="#c4ccd8" />
      <Block x={840} y={428} w={24} h={104} lit="#eef2f6" shade="#c4ccd8" />
      <path d="M696 432L756 404H844L904 432Z" fill="#2e4a5a" />
      <path d="M696 432H904" stroke="#7fe7ff" strokeWidth="3" />
    </>
  ),
  front: () => (
    <>
      {scatter(95, 24, 0, 1600, 640, 880).map(({ x, y, t }, i) => (
        <circle key={i} cx={x} cy={y} r={1.5 + t * 2} fill="#7fe7ff" opacity={0.35 + t * 0.5} />
      ))}
    </>
  ),
};

/* ── Desert of Hadramaveth: a great pyramid and obelisks in the dunes ── */
const desert: Scene = {
  mid: () => {
    const cx = 1000;
    const base = 672;
    const apex = 250;
    const half = 330;
    const steps: number[] = [];
    for (let y = apex + 30; y < base; y += 26) steps.push(y);
    return (
      <>
        {[
          [520, 664, 200],
          [604, 668, 150],
        ].map(([x, y, h]) => (
          <g key={x}>
            <path d={`M${x - 14} ${y}L${x - 10} ${y - h}L${x} ${y - h - 16}L${x + 10} ${y - h}L${x + 14} ${y}Z`} fill="#c98a52" />
            <path d={`M${x} ${y}V${y - h - 16}L${x + 10} ${y - h}L${x + 14} ${y}Z`} fill="#9c6438" />
          </g>
        ))}
        <path d={`M${cx - half} ${base}L${cx} ${apex}V${base}Z`} fill="#e2b072" />
        <path d={`M${cx} ${apex}L${cx + half} ${base}H${cx}Z`} fill="#b47a46" />
        {steps.map((y) => {
          const w = ((y - apex) / (base - apex)) * half;
          return <path key={y} d={`M${cx - w} ${y}H${cx + w}`} stroke="#a46a3c" strokeWidth="2" opacity=".35" />;
        })}
        <path d={`M${cx} ${apex + 20}V${base - 50}`} stroke="#6fe0c8" strokeWidth="3" opacity=".7" />
        <path d={`M${cx - 32} ${base}V${base - 42}Q${cx} ${base - 72} ${cx + 32} ${base - 42}V${base}Z`} fill="#3a2a20" />
        <path d={`M${cx - 20} ${base}V${base - 36}Q${cx} ${base - 56} ${cx + 20} ${base - 36}V${base}Z`} fill="#6fe0c8" opacity=".35" />
        <path d={`M${cx} ${apex - 16}L${cx + 12} ${apex}L${cx} ${apex + 16}L${cx - 12} ${apex}Z`} fill="#9ff0dc" />
        <circle cx={cx} cy={apex} r="30" fill="#9ff0dc" opacity=".25" />
        {[
          [1400, 640, 80],
          [1460, 646, 50],
        ].map(([x, y, h]) => (
          <Block key={x} x={x - 13} y={y - h} w={26} h={h} lit="#d9a66a" shade="#a8743f" />
        ))}
      </>
    );
  },
  front: () => (
    <g fill="#ffe0b0" opacity=".14">
      <rect y="560" width="1600" height="30" />
      <rect y="700" width="1600" height="40" />
    </g>
  ),
};

const SCENES: Record<PlaceId, Scene> = { mondstadt, liyue, inazuma, sumeru, fontaine, natlan, nodkrai, snezhnaya, dragonspine, chasm, enkanomiya, desert };

/** One depth layer of a region's scene; `g` prefixes gradient ids so each banner stays unique. */
export function placeLayer(place: PlaceId | undefined, layer: PlaceLayer, g: string): ReactNode {
  if (!place) return null;
  const draw = SCENES[place]?.[layer];
  return draw ? draw(g) : null;
}
