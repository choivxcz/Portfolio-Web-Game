import { useSyncExternalStore } from "react";
import type { LandmarkId, Quality } from "./config";

/** Visitor preferences from the Settings screen (saved in the browser). */
export interface Prefs {
  renderScale: number; // 0.6–1.4 multiplier on the render resolution
  bloom: boolean;
  vignette: boolean;
  sharpen: boolean;
  showFps: boolean;
  sensitivity: number; // 1–10 camera look speed
  invertY: boolean;
  camDistance: "near" | "default" | "far";
  minimapRotate: boolean;
  markers: boolean;
  guide: boolean; // controls guide in the corner
  character: "ranger" | "mage";
  outlines: boolean;
  ao: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  renderScale: 1,
  bloom: true,
  vignette: true,
  sharpen: true,
  showFps: false,
  sensitivity: 5,
  invertY: false,
  camDistance: "default",
  minimapRotate: false,
  markers: true,
  guide: true,
  character: "ranger",
  outlines: true,
  ao: true,
};

/** Which full-screen menu is open over the world. */
export type Menu = "pause" | "settings" | null;

/** Small external store shared by the 3D scene and the DOM interface. */
export interface WorldState {
  progress: number; // 0..1 real build progress
  stage: string;
  ready: boolean;
  nearby: LandmarkId | null;
  panel: LandmarkId | null;
  quality: Quality;
  reduced: boolean; // reduce visual effects
  locked: boolean; // pointer lock active
  travel: { id: LandmarkId; n: number } | null;
  minimap: string;
  prefs: Prefs;
  menu: Menu;
  hudHidden: boolean;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: settings just won't persist */
  }
};

const constrained =
  typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820);
const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let state: WorldState = {
  progress: 0,
  stage: "Preparing the journey",
  ready: false,
  nearby: null,
  panel: null,
  quality: read<Quality>("world.quality", constrained ? "low" : "medium"),
  reduced: read<boolean>("world.reduced", prefersReduced),
  locked: false,
  travel: null,
  minimap: "",
  prefs: { ...DEFAULT_PREFS, ...read<Partial<Prefs>>("world.prefs", {}) },
  menu: null,
  hudHidden: false,
};
const listeners = new Set<() => void>();

export const worldStore = {
  get: () => state,
  set(partial: Partial<WorldState>) {
    state = { ...state, ...partial };
    if ("quality" in partial) write("world.quality", state.quality);
    if ("reduced" in partial) write("world.reduced", state.reduced);
    if ("prefs" in partial) write("world.prefs", state.prefs);
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useWorld<T>(select: (s: WorldState) => T): T {
  return useSyncExternalStore(worldStore.subscribe, () => select(worldStore.get()));
}

export function setPrefs(partial: Partial<Prefs>) {
  worldStore.set({ prefs: { ...state.prefs, ...partial } });
}

export function travelTo(id: LandmarkId) {
  const n = (worldStore.get().travel?.n ?? 0) + 1;
  worldStore.set({ travel: { id, n }, panel: null, menu: null });
}

/** Per-frame input and player state (mutated directly, no React renders). */
export const input = {
  keys: new Set<string>(),
  joy: { x: 0, y: 0 },
  jump: false, // jump button on touch screens
  lookX: 0,
  lookY: 0,
  zoom: 0,
};
export const player = {
  x: 0,
  z: 0,
  y: 0, // feet height (ground + jump)
  yaw: 0, // camera heading
  facing: 0, // where the character looks (turns toward the direction of travel)
  speed: 0, // horizontal speed, m/s (smoothed)
  air: 0, // height above the ground while jumping
  vy: 0, // vertical velocity
  spawned: false,
};
