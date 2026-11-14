import { TIMES, type TimeOfDay, type TimePreset } from "./config";

/**
 * The lighting in effect (set by lighting.ts). Scene modules read it when they
 * build their materials. Kept in its own module so the sky and shaders can read it
 * without importing lighting.ts, which imports them.
 */
export const LIGHT: { id: TimeOfDay; p: TimePreset } = { id: "day", p: TIMES.day };
