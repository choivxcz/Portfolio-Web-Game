import { useEffect, useState } from "react";
import { useWorld } from "../world/store";

/**
 * Phones held upright get a prompt to turn sideways. Where the browser allows it
 * (Android Chrome and most others) one tap goes full screen and locks landscape;
 * iPhones can't lock orientation from a web page, so they're asked to rotate.
 */
type LockableOrientation = ScreenOrientation & { lock?: (o: "landscape") => Promise<void> };

export const canLockLandscape = () =>
  typeof document !== "undefined" &&
  !!document.documentElement.requestFullscreen &&
  !!(screen.orientation as LockableOrientation | undefined)?.lock;

export async function playInLandscape() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    await (screen.orientation as LockableOrientation).lock?.("landscape");
  } catch {
    /* the browser refused: the visitor can still rotate by hand */
  }
}

export function RotatePrompt() {
  const ready = useWorld((s) => s.ready);
  const [portrait, setPortrait] = useState(() => window.matchMedia("(orientation: portrait)").matches);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("world.portrait") === "ok";
    } catch {
      return false;
    }
  });
  const [lockable] = useState(canLockLandscape);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const on = () => setPortrait(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  if (!ready || !portrait || dismissed) return null;
  const stay = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("world.portrait", "ok");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rotate-prompt" role="dialog" aria-modal="true" aria-labelledby="rotate-title">
      <div className="rotate-card">
        <svg className="rotate-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect x="22" y="8" width="20" height="36" rx="4" stroke="currentColor" strokeWidth="3" />
          <path d="M14 50a20 20 0 0 0 30 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M44 48v7h-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 id="rotate-title">Turn your phone sideways</h2>
        <p>{lockable ? "The world is best explored in landscape." : "The world is best explored in landscape. If the screen doesn't turn, switch off rotation lock."}</p>
        <div className="rotate-actions">
          {lockable && (
            <button type="button" className="rotate-go" onClick={playInLandscape}>
              Play in landscape
            </button>
          )}
          <button type="button" className="rotate-stay" onClick={stay}>
            Stay in portrait
          </button>
        </div>
      </div>
    </div>
  );
}
