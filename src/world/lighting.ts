import { TIMES, type TimeOfDay } from "./config";
import { LIGHT } from "./lightState";
import { patchAtmosphere } from "./scene/atmosphere";
import { SKY, SUN_DIR } from "./scene/Sky";

/** The time-of-day setting: a preset, or "auto" to follow the visitor's clock. */
export type TimeSetting = TimeOfDay | "auto";

export { LIGHT };

/** Pick the preset for "auto" from the local hour. */
export function resolveTime(setting: TimeSetting, now = new Date()): TimeOfDay {
  if (setting !== "auto") return setting;
  const h = now.getHours() + now.getMinutes() / 60;
  if (h >= 5 && h < 8) return "morning";
  if (h >= 8 && h < 16) return "day";
  if (h >= 16 && h < 18.5) return "golden";
  if (h >= 18.5 && h < 20) return "dusk";
  return "night";
}

/**
 * Switch the world's lighting. Call before the scene (re)mounts: the sky, sun,
 * haze and hand-shaded materials read these values when they are created, and the
 * haze is compiled into the shaders.
 */
export function applyTimeOfDay(id: TimeOfDay) {
  const p = TIMES[id];
  LIGHT.id = id;
  LIGHT.p = p;
  const el = (p.sun[0] * Math.PI) / 180;
  const az = (p.sun[1] * Math.PI) / 180;
  SUN_DIR.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
  Object.assign(SKY, { top: p.sky.top, mid: p.sky.mid, horizon: p.sky.horizon, bottom: p.sky.bottom, halo: p.sky.halo, warm: p.sky.warm });
  patchAtmosphere();
}
