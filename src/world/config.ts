/**
 * World layout. Units are metres; +x is east, -z is north.
 * The visitor starts at SPAWN looking north toward the village.
 */
export type LandmarkId = "about" | "skills" | "projects" | "achievements" | "contact" | "reviews";
export type Vec2 = [number, number];

export interface Landmark {
  id: LandmarkId;
  name: string; // in-world place name
  section: string; // portfolio section it opens
  prompt: string; // interaction prompt
  pos: Vec2; // centre of the structure
  pad: number; // radius of flattened ground around it
  radius: number; // interaction radius
  approach: Vec2; // where teleports place the visitor
  bump: number; // raise the ground (metres) for scenic placement
}

export const LANDMARKS: Landmark[] = [
  {
    id: "about",
    name: "Adventurer's Journal",
    section: "About Me",
    prompt: "Read the Adventurer's Journal",
    pos: [-48, -10],
    pad: 13,
    radius: 17,
    approach: [-34, -6],
    bump: 7,
  },
  {
    id: "skills",
    name: "The Academy",
    section: "Skills",
    prompt: "Enter the Academy archive",
    // set back from the stream valley so the hall stands on solid, level ground
    pos: [78, -19],
    pad: 21,
    radius: 22,
    approach: [70, -8],
    bump: 4,
  },
  {
    id: "projects",
    name: "Expedition Board",
    section: "Projects",
    prompt: "Read the Expedition Board",
    pos: [0, -46],
    pad: 14,
    radius: 16,
    approach: [2, -32],
    bump: 0,
  },
  {
    id: "achievements",
    name: "Hall of Achievements",
    section: "Achievements",
    prompt: "Inspect the Hall of Achievements",
    pos: [-64, -92],
    pad: 18,
    radius: 22,
    approach: [-50, -78],
    bump: 2,
  },
  {
    id: "contact",
    name: "Communication Beacon",
    section: "Contact",
    prompt: "Light the Communication Beacon",
    pos: [98, -104],
    // a wider hilltop: the lake side stays a cliff, the arrival point sits well back from the edge
    pad: 15,
    radius: 23,
    approach: [102, -93],
    bump: 9,
  },
  {
    id: "reviews",
    name: "Traveler's Guestbook",
    section: "Reviews",
    prompt: "Sign the Traveler's Guestbook",
    // beside the first path, just past the starting point
    pos: [10, 37],
    pad: 6,
    radius: 9,
    approach: [4, 39],
    bump: 0,
  },
];

export const SPAWN: Vec2 = [0, 46];
export const SPAWN_YAW = 0; // facing -z (north)

/** Walkable dirt paths (polylines). */
export const PATHS: Vec2[][] = [
  [[0, 50], [2, 24], [-2, 2], [0, -22], [0, -36]],
  [[-4, -40], [-18, -30], [-32, -18], [-42, -12]],
  [[-4, -52], [-22, -66], [-40, -80], [-54, -88]],
  [[6, -42], [24, -38], [40, -34], [54, -31], [61, -22], [65, -14], [70, -8]],
  [[64, -34], [80, -50], [94, -70], [100, -91]],
  [[2, 30], [-18, 18], [-36, 2], [-44, -4]],
];
export const PATH_WIDTH = 2.6;

/** Lake (north-east) and the stream that flows south out of it. */
export const LAKE = { x: 56, z: -82, r: 36 };
/**
 * The lake reaches further than the main basin: a bay below the Beacon's cliff (the
 * waterfall pours into it) and a wide lobe north-west behind the village and town.
 * Each lobe is a circle; they overlap the basin, so the water is one body. Placed
 * clear of every landmark's flattened ground, path and house.
 */
export const LAKE_LOBES = [
  { x: 68, z: -128, r: 21 },
  { x: 24, z: -112, r: 30 },
  { x: 46, z: -121, r: 15 }, // joins the two into one stretch of water
  { x: 27, z: -88, r: 20 }, // widens the water west of the island, under the long bridge
];
const LAKES = [LAKE, ...LAKE_LOBES];
const ease = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};
/** 0..1 how much (x, z) is lake: 1 in open water, fading from 0.72 to 1.1 × radius. */
export function lakeAmount(x: number, z: number) {
  let a = 0;
  for (const L of LAKES) {
    const d = Math.hypot(x - L.x, z - L.z);
    a = Math.max(a, 1 - ease((d - L.r * 0.72) / (L.r * 0.38)));
  }
  return a;
}
/** Distance from (x, z) to the nearest lake shoreline (any lobe). */
export function lakeShoreDistance(x: number, z: number) {
  let best = Infinity;
  for (const L of LAKES) best = Math.min(best, Math.abs(Math.hypot(x - L.x, z - L.z) - L.r));
  return best;
}
export const STREAM: Vec2[] = [
  [52, -50], [47, -32], [39, -10], [36, 16], [44, 46], [53, 82], [60, 124], [70, 200],
];
export const WATER_LEVEL = 0;

/** Island in the lake carrying the walled lake town, and the long bridge out to it. */
export const ISLAND = { x: 60, z: -86, r: 20, h: 3.4 };
export const CITY_BRIDGE = { from: [15.4, -73.6] as Vec2, to: [44, -82] as Vec2 };

/** Stone bridge where the Academy path crosses the stream. */
export const BRIDGE = { x: 46.6, z: -32.6, angle: Math.atan2(3, 14), length: 15, width: 3.4, deck: 2.2 };

/** Terrain extent and the walkable radius (mountains rise beyond it). */
export const WORLD_SIZE = 560;
export const PLAY_CENTER: Vec2 = [10, -24];
export const PLAY_RADIUS = 158;

/**
 * The environment's look: air, sky, palette, wind and outlines. Every tuning value
 * for the stylized open-world look lives here. Colours are sRGB hex.
 */
export const ENV = {
  /** Aerial perspective: distant land fades into the sky, warmer toward the sun. */
  haze: {
    color: "#c9e2f6", // also the sky's horizon colour, so land meets sky without a seam
    warm: "#ffe4bf", // haze colour when looking toward the sun
    warmPower: 5, // how tightly the warm glow hugs the sun's direction
    start: 45, // metres of clear air in front of the camera
    far: 1700, // scene fog far plane (haze is at full strength well before this)
    density: 0.0034, // per metre past `start`
    max: 0.8, // haze never fully hides the land
    mistHeight: 4, // valley mist sits below this world height (metres)
    mistFalloff: 0.16, // how quickly mist thins above `mistHeight`
    mistDensity: 0.0045, // per metre of distance
    mistMax: 0.32,
  },
  /** Mountain ranges: their own haze, matched to the air above. */
  mountainHaze: { start: 120, end: 1250, max: 0.86 },
  sky: {
    top: "#1d64d8",
    mid: "#4f9ff0", // the band between zenith and horizon
    bottom: "#a9cde8",
    sunHalo: "#fff1d6",
  },
  clouds: {
    crown: "#fffdf7", // sunlit tops
    mid: "#f4f6fb",
    edge: "#e4eaf6",
    shade: [150, 160, 212] as [number, number, number], // cool lavender underside (rgb)
  },
  palette: {
    grassBase: "#2f6b39", // blade roots: deep, slightly blue green
    grassTip: "#93c95d", // blade tips
    goldBase: "#9a7a2c", // golden meadow patches
    goldTip: "#f2d37a",
    groundA: "#5f9e4a",
    groundB: "#7db456",
    groundDark: "#3e7841",
    treeGreen: { dark: "#24603a", light: "#7cc458" },
    treeGreenTall: { dark: "#2a6640", light: "#8acf5c" },
    treeGold: { dark: "#a5681a", light: "#f6c85c" }, // autumn amber, not lemon yellow
    stoneLow: "#8e8f9f",
    stoneHigh: "#ddd6c8",
    stoneWarm: "#d8c6a6",
    moss: "#6f9a4e",
    stoneSun: "#e2c89a", // sun-baked ochre patches on the cliffs
    stoneShade: "#8e8fb3", // cool lavender patches in the cliffs' recesses
  },
  /** Gusts: bright bands of bent grass rolling across the meadows. */
  wind: {
    scale: 0.045, // size of a gust (lower = broader)
    speed: [0.55, 0.32] as [number, number], // drift direction and speed (metres/s scaled)
    strength: 0.55, // extra bend inside a gust
    shine: 0.28, // how much a gust lightens the blades
  },
  /** Ink outlines on solid models (rocks, trunks, village props). */
  outline: { darken: 0.38, tint: "#27345f", tintAmount: 0.35 },
  post: { bloom: 0.46, bloomThreshold: 0.8 },
  /** Lake swells (scene/Water.tsx): height and wavelength in metres, speed, depth where waves reach full height. */
  waves: { height: 0.38, length: 11, speed: 1.4, fullDepth: 3.5 },
  /** Wildlife (scene/Wildlife.tsx). */
  life: {
    butterflyCount: 16,
    butterflies: ["#ffb347", "#fff6e8", "#7fb8ff", "#ffe066", "#f59ac8"],
    birdCount: 7,
    birds: "#3a3f58",
    leafCount: 46,
    leaves: ["#e8a83a", "#d8792c", "#f2c85a", "#8cc45e"],
  },
} as const;

/**
 * Time of day. Each preset sets the sun (or moon), the sky, the haze, a tint for the
 * hand-shaded surfaces (grass, water, mountains, clouds) and the night extras.
 * `sun` is [elevation, azimuth] in degrees; azimuth 0 = east (+x), -90 = north (-z).
 * Colours are sRGB hex.
 */
export type TimeOfDay = "morning" | "day" | "golden" | "dusk" | "night";
export interface TimePreset {
  label: string;
  sun: [number, number];
  sunColor: string;
  sunIntensity: number;
  hemi: [string, string, number]; // sky colour, ground colour, intensity
  ambient: [string, number];
  sky: { top: string; mid: string; horizon: string; bottom: string; halo: string; warm: string };
  tint: string; // multiplies grass, water, mountains
  clouds: string; // multiplies the cloud sprites
  emissive: number; // scales the soft self-light on foliage and characters
  stars: number; // 0..1
  lanterns: number; // 0..1 glow of path lanterns
  shafts: number; // 0..1 light shafts through trees (needs medium or high quality)
  bloom: number;
}
export const TIMES: Record<TimeOfDay, TimePreset> = {
  morning: {
    label: "Morning",
    sun: [22, 150],
    sunColor: "#fff0dc",
    sunIntensity: 2.7,
    hemi: ["#cfe0ff", "#a4ae86", 0.95],
    ambient: ["#e3ebff", 0.12],
    sky: { top: "#3c7fe0", mid: "#7ab6f0", horizon: "#e2edf6", bottom: "#c3d6e6", halo: "#fff4e0", warm: "#ffe6c4" },
    tint: "#fbf7f2",
    clouds: "#fffaf2",
    emissive: 1,
    stars: 0,
    lanterns: 0,
    shafts: 0.6,
    bloom: 0.5,
  },
  day: {
    label: "Midday",
    sun: [46, 37],
    sunColor: "#ffeccc",
    sunIntensity: 3.1,
    hemi: ["#b9cdff", "#9aa874", 1.0],
    ambient: ["#dde6ff", 0.12],
    sky: { top: ENV.sky.top, mid: ENV.sky.mid, horizon: ENV.haze.color, bottom: ENV.sky.bottom, halo: ENV.sky.sunHalo, warm: ENV.haze.warm },
    tint: "#ffffff",
    clouds: "#ffffff",
    emissive: 1,
    stars: 0,
    lanterns: 0,
    shafts: 0,
    bloom: ENV.post.bloom,
  },
  golden: {
    label: "Golden hour",
    sun: [13, -58],
    sunColor: "#ffc98c",
    sunIntensity: 2.9,
    hemi: ["#ffd8b8", "#8a8a6a", 0.85],
    ambient: ["#ffe0c8", 0.1],
    sky: { top: "#3a6cc2", mid: "#8fb2dc", horizon: "#ffdcae", bottom: "#e6c6a2", halo: "#ffd28e", warm: "#ffb46e" },
    tint: "#ffe6c8",
    clouds: "#ffdcbc",
    emissive: 0.85,
    stars: 0,
    lanterns: 0.3,
    shafts: 1,
    bloom: 0.62,
  },
  dusk: {
    label: "Dusk",
    sun: [4, -78],
    sunColor: "#ff9c6e",
    sunIntensity: 1.7,
    hemi: ["#9088c8", "#5a5060", 0.8],
    ambient: ["#a89ad0", 0.12],
    sky: { top: "#28306e", mid: "#7a5c9e", horizon: "#ffa27e", bottom: "#ad7c8c", halo: "#ffb48c", warm: "#ff7d56" },
    tint: "#d9b0b8",
    clouds: "#f0aaa4",
    emissive: 0.6,
    stars: 0.3,
    lanterns: 0.85,
    shafts: 0.7,
    bloom: 0.66,
  },
  night: {
    label: "Night",
    sun: [52, 28], // the moon
    sunColor: "#8fa8ff",
    sunIntensity: 0.5,
    hemi: ["#30407a", "#121828", 0.48],
    ambient: ["#7080c0", 0.12],
    sky: { top: "#050a22", mid: "#112044", horizon: "#2c3e6e", bottom: "#18223e", halo: "#d4e2ff", warm: "#4e64a0" },
    tint: "#5e6ea2",
    clouds: "#4f5c88",
    emissive: 0.35,
    stars: 1,
    lanterns: 1,
    shafts: 0,
    bloom: 0.72,
  },
};

/**
 * The original anime-style hero (scene/hero.ts): colours and how its stride is
 * matched to ground speed. Colours are sRGB hex.
 */
export const HERO = {
  colors: {
    skin: "#ffe2d1",
    hair: "#8f402c", // auburn
    hairShine: "#c4664a",
    iris: "#1f7f7a", // teal-green
    irisLight: "#8fe3cf",
    lash: "#3a2420",
    jacket: "#1f6c78", // deep teal
    trim: "#f2e8d2", // cream
    gold: "#d8a443",
    under: "#2b2f45", // undersuit and gloves
    pants: "#30344d",
    boots: "#6a4530",
    cape: "#f2e8d2",
  },
  /** Ground speed (m/s) at which one animation cycle matches the stride. */
  stride: { run: 12, walk: 3.8 },
  /** How far the cape lifts behind when running (radians). */
  capeLift: 0.55,
  /** How far the arms are brought in from the rig's wide chibi poses (radians). */
  armsIn: 0.42,
} as const;

export type Quality = "low" | "medium" | "high";
export interface QualityPreset {
  dpr: [number, number];
  shadows: number; // shadow map size, 0 = off
  grass: number; // grass clumps in the patch around the visitor
  flowers: number;
  trees: number;
  rocks: number;
  segments: number; // terrain grid resolution
  antialias: boolean;
  msaa: number; // post-processing anti-aliasing samples
}
export const QUALITY: Record<Quality, QualityPreset> = {
  low: { dpr: [1, 1], shadows: 0, grass: 7000, flowers: 500, trees: 95, rocks: 70, segments: 210, antialias: false, msaa: 0 },
  medium: { dpr: [1, 1.5], shadows: 3072, grass: 34000, flowers: 1500, trees: 170, rocks: 100, segments: 300, antialias: true, msaa: 2 },
  high: { dpr: [1, 2], shadows: 4096, grass: 62000, flowers: 2400, trees: 230, rocks: 130, segments: 360, antialias: true, msaa: 4 },
};
