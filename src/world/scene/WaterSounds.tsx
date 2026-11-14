import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { ambience } from "../../audio/ambience";
import { STREAM, lakeShoreDistance } from "../config";
import { PROPS } from "../layout";
import { player, useWorld } from "../store";
import { waterfallSpot } from "./Waterfall";

/** 1 when within `near` metres, fading to 0 at `far`. */
const closeness = (d: number, near: number, far: number) => Math.max(0, Math.min(1, (far - d) / (far - near)));

/** Distance from (x, z) to the stream's polyline. */
function streamDistance(x: number, z: number) {
  let best = Infinity;
  for (let i = 0; i < STREAM.length - 1; i++) {
    const [ax, az] = STREAM[i];
    const [bx, bz] = STREAM[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}

/**
 * Drives the water sounds (audio/ambience.ts): starts them on the first gesture,
 * follows the Water Sounds settings, and sets each layer's loudness from how close
 * the explorer is to the waterfall, the lake or stream, and the nearest fountain.
 */
export function WaterSounds() {
  const on = useWorld((s) => s.prefs.waterSounds);
  const volume = useWorld((s) => s.prefs.waterVolume);
  const fall = useMemo(() => waterfallSpot(), []);
  const fountains = useMemo(() => PROPS.filter((p) => p.model === "fountain-round-detail"), []);
  const timer = useRef(0);

  useEffect(() => {
    ambience.set(on, Math.pow(volume / 10, 1.4));
  }, [on, volume]);

  useEffect(() => {
    const gesture = () => ambience.start();
    const vis = () => ambience.setHidden(document.hidden);
    window.addEventListener("pointerdown", gesture);
    window.addEventListener("keydown", gesture);
    window.addEventListener("touchend", gesture);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("pointerdown", gesture);
      window.removeEventListener("keydown", gesture);
      window.removeEventListener("touchend", gesture);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  useFrame((_, dt) => {
    timer.current += dt;
    if (timer.current < 0.15) return;
    timer.current = 0;
    const { x, z } = player;
    const f = closeness(Math.hypot(x - fall.x, z - fall.z), 8, 95);
    const shore = lakeShoreDistance(x, z);
    const l = Math.max(closeness(shore, 4, 45), closeness(streamDistance(x, z), 2, 18) * 0.8);
    let fo = 0;
    for (const p of fountains) fo = Math.max(fo, closeness(Math.hypot(x - p.x, z - p.z), 3, 24));
    ambience.setLevels(f * f, l, fo);
  });

  return null;
}
