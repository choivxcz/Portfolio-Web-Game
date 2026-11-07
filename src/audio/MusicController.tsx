import { useEffect } from "react";
import { useWorld } from "../world/store";
import { music } from "./music";

/** Starts the music on the visitor's first click, tap or key press, and follows the Audio settings. */
export function MusicController() {
  const on = useWorld((s) => s.prefs.music);
  const volume = useWorld((s) => s.prefs.musicVolume);
  const ready = useWorld((s) => s.ready);

  // compose in the background once the world is up, so the music is ready by the first tap
  useEffect(() => {
    if (!ready || !on) return;
    const id = window.setTimeout(() => void music.prepare().catch(() => undefined), 1500);
    return () => window.clearTimeout(id);
  }, [ready, on]);

  useEffect(() => {
    // perceived loudness grows roughly with the square of the gain
    music.set(on, Math.pow(volume / 10, 2) * 0.9);
  }, [on, volume]);

  useEffect(() => {
    const gesture = () => music.start();
    const vis = () => music.setHidden(document.hidden);
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

  return null;
}
