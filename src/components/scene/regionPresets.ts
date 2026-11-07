/** Visual recipes for the small landscape banners (all original, no game assets). */
import type { PlaceId } from "../../data/places";

export type Structure = "academy" | "pagoda" | "market" | "shrine" | "observatory" | "windmill" | "village" | "spires";
export type Far = "peaks" | "pillars" | "snow" | "hills" | "none";
export type TreeStyle = "round" | "pine" | "blossom" | "gold" | "jungle" | "poplar" | "palm" | "autumn";

export interface RegionPreset {
  sky: [string, string, string];
  night?: boolean;
  sun: { x: number; y: number; color: string };
  far: Far;
  farColor: [string, string];
  water?: [string, string];
  mid: [string, string];
  near: [string, string];
  /** Generic building; a `place` draws its own landmark instead. */
  structure?: Structure;
  /** Region-specific layers from places.tsx (sky, distance, landmark, foreground). */
  place?: PlaceId;
  trees: TreeStyle;
  /** Keep trees clear of the landmark: [centre x, half width]. */
  treeGap?: [number, number];
  treeCount?: number;
  lanterns?: boolean;
  lanternsAt?: [number, number][];
  /** Day clouds (default: on by day). */
  clouds?: boolean;
  /** Night extras (default: on at night). */
  stars?: boolean;
  fireflies?: boolean;
  /** Moon radius at night (default 58). */
  moon?: number;
}

export const regionPresets: Record<string, RegionPreset> = {
  plains: {
    sky: ["#3d82d6", "#8cc6f0", "#e9f4f7"],
    sun: { x: 1260, y: 150, color: "#fff6d8" },
    far: "peaks",
    farColor: ["#86aada", "#c2d8ef"],
    water: ["#6fcbe0", "#3aa0c8"],
    mid: ["#9fd383", "#5f9d5f"],
    near: ["#7cc35d", "#3f8443"],
    structure: "academy",
    trees: "round",
  },
  harbor: {
    sky: ["#5d8fd0", "#f0c9a4", "#fbe7c8"],
    sun: { x: 1240, y: 300, color: "#ffe6b0" },
    far: "pillars",
    farColor: ["#9aa9cc", "#d9cfd6"],
    water: ["#7cc0d4", "#3d86b0"],
    mid: ["#b8b77a", "#7c8f5e"],
    near: ["#8a9a5b", "#4e5c3c"],
    structure: "pagoda",
    trees: "gold",
    lanterns: true,
  },
  terraces: {
    sky: ["#e9a868", "#f6d8a2", "#fdf1d6"],
    sun: { x: 420, y: 250, color: "#fff2c4" },
    far: "hills",
    farColor: ["#d8a679", "#ecd2b0"],
    mid: ["#d9b45a", "#9c7c3a"],
    near: ["#b98f45", "#6f5427"],
    structure: "market",
    trees: "gold",
    lanterns: true,
  },
  nightshrine: {
    sky: ["#0d1638", "#27346a", "#4b4f86"],
    night: true,
    sun: { x: 1200, y: 170, color: "#f4ecd6" },
    far: "hills",
    farColor: ["#2c3b66", "#3c4a78"],
    mid: ["#25405a", "#172a3c"],
    near: ["#16263a", "#0b1420"],
    structure: "shrine",
    trees: "pine",
    lanterns: true,
  },
  twilight: {
    sky: ["#4b3c8c", "#b281c2", "#f2c3c4"],
    sun: { x: 800, y: 420, color: "#ffe1d0" },
    far: "peaks",
    farColor: ["#7d6aa8", "#b7a0c8"],
    water: ["#b49ad0", "#6f5fa6"],
    mid: ["#7fa36c", "#4d6f50"],
    near: ["#5d8352", "#2f4a33"],
    structure: "spires",
    trees: "blossom",
  },
  frost: {
    sky: ["#7fb3e3", "#cfe6f6", "#f4fafd"],
    sun: { x: 1180, y: 160, color: "#ffffff" },
    far: "snow",
    farColor: ["#a9c3df", "#e2edf7"],
    water: ["#cde9f3", "#8ec4dc"],
    mid: ["#e7f0f7", "#b9cde0"],
    near: ["#d8e5f0", "#9fb6cc"],
    structure: "observatory",
    trees: "pine",
  },
  windfields: {
    sky: ["#3f88d8", "#93cbf1", "#eef7f7"],
    sun: { x: 300, y: 140, color: "#fff6d8" },
    far: "hills",
    farColor: ["#8fb6dc", "#c6dcef"],
    mid: ["#a8d67d", "#6aa255"],
    near: ["#8ccb5f", "#4a8d43"],
    structure: "windmill",
    trees: "round",
  },
  newshore: {
    sky: ["#4d6fc0", "#f0b48c", "#fde3b4"],
    sun: { x: 800, y: 470, color: "#fff2cc" },
    far: "hills",
    farColor: ["#9a93c4", "#e0bfc6"],
    water: ["#f5c995", "#6c8cc4"],
    mid: ["#6f9e63", "#3e6a4a"],
    near: ["#4f7c48", "#25432f"],
    structure: "village",
    trees: "round",
  },
  riverlands: {
    sky: ["#4c8fd8", "#a5d3f1", "#f1f6ef"],
    sun: { x: 1350, y: 120, color: "#fff6d8" },
    far: "pillars",
    farColor: ["#94b2d8", "#cadcef"],
    water: ["#7fd0de", "#3a9ec4"],
    mid: ["#a7cf7c", "#678f52"],
    near: ["#86bd5c", "#46793f"],
    structure: "village",
    trees: "round",
  },

  /* ── Regions of the Expedition Board (see src/data/places.ts) ── */
  mondstadt: {
    sky: ["#2f7fd8", "#86c3f0", "#eaf6f8"],
    sun: { x: 1330, y: 140, color: "#fff6d8" },
    far: "hills",
    farColor: ["#8db3dd", "#c8ddf0"],
    water: ["#76cde2", "#3c9fc9"],
    mid: ["#a3d683", "#5f9d5f"],
    near: ["#7fc45e", "#3f8443"],
    place: "mondstadt",
    trees: "round",
    treeGap: [800, 330],
  },
  liyue: {
    sky: ["#4f7fc4", "#f2c69a", "#fde9c6"],
    sun: { x: 1240, y: 330, color: "#ffe2a6" },
    far: "pillars",
    farColor: ["#9aa6c6", "#dccfcf"],
    water: ["#7cbfd2", "#3b80aa"],
    mid: ["#c2b479", "#7f8a5a"],
    near: ["#93995c", "#4f5a3a"],
    place: "liyue",
    trees: "gold",
    treeGap: [720, 420],
    lanterns: true,
    lanternsAt: [[620, 330], [770, 240], [930, 320], [1170, 170], [1490, 300], [140, 450]],
  },
  inazuma: {
    sky: ["#2b2350", "#6b4f9a", "#d7a6c9"],
    sun: { x: 1260, y: 250, color: "#e3c8ff" },
    far: "peaks",
    farColor: ["#54498a", "#9384bb"],
    water: ["#8e7fc0", "#3e3a78"],
    mid: ["#6f8f6a", "#3e5a48"],
    near: ["#4f6d50", "#26392c"],
    place: "inazuma",
    trees: "blossom",
    treeGap: [720, 380],
    clouds: false,
  },
  sumeru: {
    sky: ["#3f8fbf", "#9fd7d0", "#eef7e0"],
    sun: { x: 1380, y: 150, color: "#fff7d6" },
    far: "none",
    farColor: ["#6fa98c", "#b4d6bd"],
    mid: ["#79b85a", "#3f7a3f"],
    near: ["#5fa047", "#2c5f30"],
    place: "sumeru",
    trees: "jungle",
    treeGap: [800, 300],
    clouds: false,
  },
  fontaine: {
    sky: ["#4b86d0", "#a9d2f2", "#eef4fb"],
    sun: { x: 290, y: 150, color: "#fffbe6" },
    far: "hills",
    farColor: ["#94b4d8", "#cfdcec"],
    water: ["#5fc6e0", "#2a7fb8"],
    mid: ["#9ccf86", "#5c9466"],
    near: ["#7ab866", "#3b7449"],
    place: "fontaine",
    trees: "poplar",
    treeGap: [800, 400],
  },
  natlan: {
    sky: ["#3b2a5c", "#d0603a", "#f6b25a"],
    sun: { x: 1260, y: 470, color: "#ffd08a" },
    far: "none",
    farColor: ["#9c4f3f", "#d08a5c"],
    mid: ["#a8834a", "#6b5030"],
    near: ["#7d6a3a", "#3f3320"],
    place: "natlan",
    trees: "palm",
    treeGap: [960, 330],
    clouds: false,
  },
  nodkrai: {
    sky: ["#0f1a3d", "#2c3c78", "#6f7fb6"],
    night: true,
    sun: { x: 1160, y: 240, color: "#e8ecff" },
    moon: 104,
    fireflies: false,
    far: "none",
    farColor: ["#2e3d6a", "#46578a"],
    water: ["#3e5590", "#16224a"],
    mid: ["#3d4f5e", "#1f2c38"],
    near: ["#2c3a40", "#121a20"],
    place: "nodkrai",
    trees: "autumn",
    treeGap: [600, 270],
  },
  snezhnaya: {
    sky: ["#7f9cc4", "#c9dbec", "#f2f6fa"],
    sun: { x: 1270, y: 190, color: "#ffffff" },
    far: "snow",
    farColor: ["#9fb6d2", "#dfe9f3"],
    mid: ["#eef3f8", "#c4d3e2"],
    near: ["#dde7f1", "#a7bbcf"],
    place: "snezhnaya",
    trees: "pine",
    treeGap: [800, 330],
  },
  dragonspine: {
    sky: ["#24365e", "#5d7aa8", "#c3d4e6"],
    sun: { x: 1320, y: 170, color: "#f2f6ff" },
    far: "snow",
    farColor: ["#7d93b8", "#c7d6e8"],
    mid: ["#e6eef6", "#aebfd2"],
    near: ["#d3e0ec", "#94a9c0"],
    place: "dragonspine",
    trees: "pine",
    treeGap: [800, 330],
    clouds: false,
  },
  chasm: {
    sky: ["#4a6aa0", "#c9b48f", "#efe0c0"],
    sun: { x: 300, y: 170, color: "#fff2cc" },
    far: "peaks",
    farColor: ["#9a8f9c", "#d6c6b4"],
    mid: ["#b9a77c", "#7a6a48"],
    near: ["#9c8a5a", "#55482e"],
    place: "chasm",
    trees: "gold",
    treeGap: [820, 470],
    treeCount: 8,
  },
  enkanomiya: {
    sky: ["#05081a", "#14204a", "#2c3c78"],
    night: true,
    stars: false,
    fireflies: false,
    sun: { x: 800, y: 220, color: "#fffbea" },
    moon: 0,
    far: "hills",
    farColor: ["#18264f", "#24356a"],
    water: ["#1f4f6a", "#0a1a30"],
    mid: ["#2a3a5c", "#141e36"],
    near: ["#1c2846", "#0a1022"],
    place: "enkanomiya",
    trees: "round",
    treeCount: 0,
  },
  desert: {
    sky: ["#c9663a", "#f0a75e", "#fbe0a8"],
    sun: { x: 320, y: 400, color: "#fff0c0" },
    far: "hills",
    farColor: ["#d79a5a", "#ecc38a"],
    mid: ["#e3b679", "#b9844c"],
    near: ["#d6a564", "#9a6a38"],
    place: "desert",
    trees: "palm",
    treeGap: [960, 420],
    treeCount: 3,
    clouds: false,
  },
};
