import { useEffect, useState } from "react";
import { NavIcon } from "../components/NavIcons";
import { Sigil } from "../components/Sigil";
import { profile } from "../data/profile";
import { LANDMARKS } from "../world/config";
import { travelTo, useWorld, worldStore } from "../world/store";
import { MenuButtons } from "./GameMenu";

/** Top bar: identity + shortcuts that teleport to each landmark. */
export function TopBar() {
  const nearby = useWorld((s) => s.nearby);
  const panel = useWorld((s) => s.panel);
  const ready = useWorld((s) => s.ready);
  const go = (id: (typeof LANDMARKS)[number]["id"]) => (ready ? travelTo(id) : worldStore.set({ panel: id }));
  return (
    <header className="hud-top">
      <div className="nav-bar hud-bar">
        <a className="nav-brand" href="?classic" title="Open the classic scrolling page">
          <span className="nav-emblem" aria-hidden="true">
            <Sigil element="geo" size={26} ring={false} />
          </span>
          <span className="nav-brand-text">{profile.shortName}</span>
        </a>
        <nav aria-label="Landmarks" className="hud-links">
          {LANDMARKS.map((L) => (
            <button
              key={L.id}
              type="button"
              className={`hud-link ${nearby === L.id || panel === L.id ? "is-active" : ""}`}
              onClick={() => go(L.id)}
              title={`Teleport to ${L.name}`}
            >
              <NavIcon name={L.id} />
              <span>{L.section === "About Me" ? "About" : L.section}</span>
            </button>
          ))}
        </nav>
        <MenuButtons />
      </div>
    </header>
  );
}

/** "E" prompt when near a landmark; also a tap target on touch screens. */
export function Prompt() {
  const nearby = useWorld((s) => s.nearby);
  const panel = useWorld((s) => s.panel);
  const L = LANDMARKS.find((l) => l.id === nearby);
  if (!L || panel) return null;
  return (
    <div className="hud-prompt" role="status">
      <button type="button" className="hud-prompt-btn" onClick={() => worldStore.set({ panel: L.id })}>
        <kbd>E</kbd>
        <span>{L.prompt}</span>
      </button>
    </div>
  );
}

const GUIDE: [string, string][] = [
  ["W A S D", "Move"],
  ["Shift", "Sprint"],
  ["Space", "Jump"],
  ["Click + mouse", "Look around"],
  ["Wheel", "Zoom"],
  ["E", "Interact"],
  ["Esc", "Menu · close"],
  ["\\", "Hide HUD"],
];

export function ControlsGuide({ touch }: { touch: boolean }) {
  const enabled = useWorld((s) => s.prefs.guide);
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem("world.guide") !== "closed";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("world.guide", open ? "open" : "closed");
    } catch {
      /* ignore */
    }
  }, [open]);
  const rows: [string, string][] = touch
    ? [["Left stick", "Move"], ["Drag", "Look around"], ["↑ button", "Jump"], ["Tap prompt", "Interact"]]
    : GUIDE;
  if (!enabled) return null;
  return (
    <aside className={`hud-guide ${open ? "" : "is-closed"}`} aria-label="Controls">
      <button type="button" className="hud-guide-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Controls
      </button>
      {open && (
        <dl>
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}

/** Brief fade whenever the visitor teleports. */
export function TravelFade() {
  const travel = useWorld((s) => s.travel);
  if (!travel) return null;
  return <div key={travel.n} className="hud-fade" aria-hidden="true" />;
}

export function Loading() {
  const progress = useWorld((s) => s.progress);
  const stage = useWorld((s) => s.stage);
  const ready = useWorld((s) => s.ready);
  return (
    <div className={`world-loading ${ready ? "is-done" : ""}`} role="status" aria-live="polite" aria-hidden={ready}>
      <div className="world-loading-card">
        <p className="world-loading-kicker">A developer portfolio</p>
        <p className="world-loading-title">{profile.name}</p>
        <div className="world-loading-bar" aria-hidden="true">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p className="world-loading-stage">
          {stage}… {Math.round(progress * 100)}%
        </p>
        <a className="world-loading-skip" href="?classic">
          Prefer a regular page? Open the classic version
        </a>
      </div>
    </div>
  );
}
