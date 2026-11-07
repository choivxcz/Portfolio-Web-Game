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
export const STREAM: Vec2[] = [
  [52, -50], [47, -32], [39, -10], [36, 16], [44, 46], [53, 82], [60, 124], [70, 200],
];
export const WATER_LEVEL = 0;

/** Island in the lake carrying the walled lake town, and the long bridge out to it. */
export const ISLAND = { x: 60, z: -86, r: 20, h: 3.4 };
export const CITY_BRIDGE = { from: [27, -77] as Vec2, to: [44, -82] as Vec2 };

/** Stone bridge where the Academy path crosses the stream. */
export const BRIDGE = { x: 46.6, z: -32.6, angle: Math.atan2(3, 14), length: 15, width: 3.4, deck: 2.2 };

/** Terrain extent and the walkable radius (mountains rise beyond it). */
export const WORLD_SIZE = 560;
export const PLAY_CENTER: Vec2 = [10, -24];
export const PLAY_RADIUS = 158;

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
  medium: { dpr: [1, 1.5], shadows: 3072, grass: 28000, flowers: 1100, trees: 170, rocks: 100, segments: 300, antialias: true, msaa: 2 },
  high: { dpr: [1, 2], shadows: 4096, grass: 50000, flowers: 1800, trees: 230, rocks: 130, segments: 360, antialias: true, msaa: 4 },
};
