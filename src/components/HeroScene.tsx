import { memo, useMemo, type ReactNode } from "react";
import { rng } from "../utils/random";
import { City, Windmill } from "./scene/City";
import { H, W, cloud, hill, island, pillar, ridge, trees, type Puff } from "./scene/shapes";

/**
 * An original, procedurally drawn open-world vista: a path leading down to a
 * turquoise lake with a walled city on the far shore, a snowy peak, stone
 * pillars, a floating temple, a windmill and a great tree. Each layer is its
 * own element so the Hero can move them at different speeds.
 */

function SceneLayer({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className={`scene-layer ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
        {children}
      </svg>
    </div>
  );
}

/** Two passes (cool shadow, then warm-white light shifted up) give a cel-shaded cloud. */
function Cloud({ id, puffs, base }: { id: string; puffs: Puff[]; base: number }) {
  return (
    <g>
      <clipPath id={id}>
        <rect x="0" y="0" width={W} height={base} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {puffs.map((p, i) => (
          <circle key={`s${i}`} cx={p.x} cy={p.y} r={p.r} fill="#c4d4ee" />
        ))}
        {puffs.map((p, i) => (
          <circle key={`l${i}`} cx={p.x - p.r * 0.06} cy={p.y - p.r * 0.3} r={p.r * 0.86} fill="#fffdf6" />
        ))}
      </g>
    </g>
  );
}

function along(points: [number, number][]) {
  return (x: number) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      if (x >= x0 && x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
    return points[points.length - 1][1];
  };
}

const MID: [number, number][] = [[0, 600], [220, 588], [460, 616], [640, 668], [820, 700], [1000, 706], [1200, 700], [1400, 672], [1600, 648]];
const NEAR: [number, number][] = [[0, 716], [180, 700], [380, 736], [600, 800], [860, 842], [1100, 832], [1350, 792], [1600, 762]];

export const HeroScene = memo(function HeroScene() {
  const s = useMemo(() => {
    const r = rng(23);
    const midY = along(MID);
    const nearY = along(NEAR);
    return {
      clouds: [
        { id: "c1", puffs: cloud(1, 1360, 580, 420, 125), base: 602 },
        { id: "c3", puffs: cloud(4, 860, 170, 240, 60), base: 182 },
      ],
      floater: island(9, 1190, 236, 150),
      far: ridge(101, 612, 150, { step: 12, lift: (x) => Math.max(0, 1 - Math.abs(x - 1000) / 380) * 150 }),
      pillars: [
        [1420, 380, 46],
        [1470, 330, 56],
        [1526, 410, 40],
        [1574, 360, 50],
      ] as [number, number, number][],
      mid: hill(MID),
      midTreesL: trees(5, 40, 560, (x) => midY(x) + 6, 12, 18),
      midTreesR: trees(7, 1180, 1560, (x) => midY(x) + 6, 9, 16),
      near: hill(NEAR),
      nearTrees: trees(6, 30, 330, (x) => nearY(x) + 8, 5, 28),
      flowers: Array.from({ length: 80 }, () => {
        const x = r() * W;
        return { x, y: nearY(x) + 16 + r() * 60, c: r() > 0.45 ? "#ffffff" : "#ffe27a", s: 1.6 + r() * 1.8 };
      }),
      windmillY: midY(1230),
    };
  }, []);

  return (
    <div className="hero-scene" aria-hidden="true">
      <SceneLayer className="layer-sky">
        <defs>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="16%" stopColor="#fff8dc" stopOpacity=".95" />
            <stop offset="45%" stopColor="#ffeab0" stopOpacity=".3" />
            <stop offset="100%" stopColor="#ffeab0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="floaterRock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9bfe0" />
            <stop offset="100%" stopColor="#c9daf0" stopOpacity=".15" />
          </linearGradient>
        </defs>
        <circle cx="1270" cy="110" r="270" fill="url(#sun)" />
        <g fill="#ffffff" opacity=".5">
          <ellipse cx="420" cy="140" rx="200" ry="7" />
          <ellipse cx="500" cy="158" rx="120" ry="5" />
          <ellipse cx="1520" cy="236" rx="120" ry="5" />
        </g>
        <path d={s.floater.body} fill="url(#floaterRock)" />
        <path d={s.floater.rim} fill="none" stroke="#eef6ff" strokeWidth="2" />
        <g fill="#eaf2fb" stroke="#bccde6">
          <rect x="1174" y="170" width="12" height="62" />
          <path d="M1172 170l8 -26l8 26z" />
          <rect x="1196" y="200" width="8" height="32" />
          <rect x="1216" y="200" width="8" height="32" />
          <path d="M1192 200h36v-5q-18 -14 -36 0z" />
        </g>
        {s.clouds.map((c) => (
          <Cloud key={c.id} id={c.id} puffs={c.puffs} base={c.base} />
        ))}
        <g fill="none" stroke="#33507f" strokeWidth="2" strokeLinecap="round" opacity=".5">
          <path className="bird" d="M980 250q8 -7 16 0q8 -7 16 0" />
          <path className="bird bird--2" d="M1030 272q6 -5 12 0q6 -5 12 0" />
          <path className="bird bird--3" d="M948 282q5 -4 10 0q5 -4 10 0" />
        </g>
      </SceneLayer>

      <SceneLayer className="layer-far">
        <defs>
          <linearGradient id="farGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#80a7da" />
            <stop offset="100%" stopColor="#bcd5ef" />
          </linearGradient>
          <linearGradient id="pillarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b4cfee" />
            <stop offset="45%" stopColor="#93b4dd" />
            <stop offset="100%" stopColor="#7092c4" />
          </linearGradient>
          <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfeaf2" />
            <stop offset="35%" stopColor="#63c6da" />
            <stop offset="100%" stopColor="#2f9ac2" />
          </linearGradient>
          <clipPath id="snowline">
            <path d="M760 0H1240V470Q1000 430 760 470Z" />
          </clipPath>
        </defs>
        <path d={s.far} fill="url(#farGrad)" />
        <path d={s.far} fill="#f5f9ff" opacity=".92" clipPath="url(#snowline)" />
        {s.pillars.map(([x, top, w], i) => (
          <g key={i}>
            <path d={pillar(i, x, top, w, 700)} fill="url(#pillarGrad)" />
            <ellipse cx={x - 3} cy={top + 4} rx={w * 0.46} ry="9" fill="#86c07f" />
            <ellipse cx={x - w * 0.12} cy={top} rx={w * 0.22} ry="6" fill="#a5d68d" />
          </g>
        ))}
        {/* the lake and its far shore */}
        <path d="M520 640C700 596 1240 584 1600 604V720H520Z" fill="url(#lake)" />
        <path d="M600 626C820 604 1180 596 1560 610" stroke="#effbff" strokeWidth="2" fill="none" opacity=".7" />
        <g stroke="#ffffff" strokeLinecap="round" opacity=".55">
          <path d="M760 650h90M900 640h60M1180 646h120M1360 636h70" strokeWidth="2.5" />
          <path d="M840 668h50M1060 662h80M1260 668h60" strokeWidth="1.8" />
        </g>
        <City x={1030} y={606} s={0.95} />
      </SceneLayer>

      <div className="scene-mist" />

      <SceneLayer className="layer-mid">
        <defs>
          <linearGradient id="midGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a2d686" />
            <stop offset="45%" stopColor="#79b66b" />
            <stop offset="100%" stopColor="#5d9a5e" />
          </linearGradient>
        </defs>
        <path d={s.mid} fill="url(#midGrad)" />
        {[...s.midTreesL, ...s.midTreesR].map((t, i) => (
          <g key={i}>
            <circle cx={t.x} cy={t.y - t.s * 0.6} r={t.s * 0.72} fill="#4c8b54" />
            <circle cx={t.x - t.s * 0.2} cy={t.y - t.s * 0.82} r={t.s * 0.46} fill="#72ad63" />
            {i % 4 === 0 && <circle cx={t.x + t.s * 0.25} cy={t.y - t.s * 0.5} r={t.s * 0.32} fill="#e9a04c" />}
          </g>
        ))}
        <Windmill x={1230} y={s.windmillY + 6} s={0.82} />
      </SceneLayer>

      <SceneLayer className="layer-near">
        <defs>
          <linearGradient id="nearGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8bd063" />
            <stop offset="30%" stopColor="#6fb655" />
            <stop offset="100%" stopColor="#3f8443" />
          </linearGradient>
          <linearGradient id="pathGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#e9d4a1" />
            <stop offset="100%" stopColor="#f3e6c2" />
          </linearGradient>
        </defs>
        <path d={s.near} fill="url(#nearGrad)" />
        <path d={s.near} fill="none" stroke="#bdec8c" strokeWidth="3" opacity=".7" />
        {/* winding path toward the lake */}
        <path d="M770 900C790 840 742 780 690 742C672 730 676 722 694 726C760 760 850 830 930 900Z" fill="url(#pathGrad)" />
        <path d="M770 900C790 840 742 780 690 742" stroke="#cdb57f" strokeWidth="2" fill="none" opacity=".6" />
        {s.flowers.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.s} fill={f.c} />
        ))}
        {s.nearTrees.map((t, i) => (
          <g key={i}>
            <rect x={t.x - 3} y={t.y - t.s * 0.8} width="6" height={t.s * 0.8} fill="#6b4f3c" />
            <circle cx={t.x} cy={t.y - t.s * 1.2} r={t.s * 0.8} fill="#3f7f4a" />
            <circle cx={t.x - t.s * 0.25} cy={t.y - t.s * 1.42} r={t.s * 0.5} fill="#62a755" />
          </g>
        ))}
        <g>
          <path d="M1478 900C1484 820 1480 760 1462 700L1496 700C1510 760 1516 820 1530 900Z" fill="#6b4f3c" />
          <path d="M1470 720C1430 690 1400 680 1370 690" stroke="#6b4f3c" strokeWidth="12" fill="none" strokeLinecap="round" />
          {(
            [
              [1480, 610, 120, "#3c7a47"],
              [1390, 650, 80, "#3c7a47"],
              [1570, 640, 100, "#3c7a47"],
              [1460, 590, 86, "#5a9f52"],
              [1382, 632, 50, "#5a9f52"],
              [1540, 610, 64, "#5a9f52"],
              [1440, 566, 44, "#86c466"],
            ] as [number, number, number, string][]
          ).map(([x, y, rr, c], i) => (
            <circle key={i} cx={x} cy={y} r={rr} fill={c} />
          ))}
        </g>
      </SceneLayer>
    </div>
  );
});
