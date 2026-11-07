import { useEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode, type RefObject } from "react";
import { CloseIcon, GitHubIcon } from "../components/Icons";
import { NavIcon } from "../components/NavIcons";
import { Sigil } from "../components/Sigil";
import { milestones } from "../data/achievements";
import { profile } from "../data/profile";
import { projects } from "../data/projects";
import { skillGroups } from "../data/skills";
import { LANDMARKS, type LandmarkId, type Quality } from "../world/config";
import { canLockLandscape, playInLandscape } from "./Landscape";
import { DEFAULT_PREFS, setPrefs, travelTo, useWorld, worldStore, type Prefs, type WorldState } from "../world/store";

/* ─────────────────────────────────────────────────────────────
   Keyboard: Esc opens / backs out of the menus, "\" hides the HUD.
   Losing pointer lock (the browser uses Esc for that) also opens
   the pause menu, like pausing a game.
   ───────────────────────────────────────────────────────────── */
export function useMenuKeys() {
  useEffect(() => {
    let lostLockAt = 0;
    let wasLocked = false;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input[type=text], textarea, select")) return;
      const st = worldStore.get();
      if (e.code === "Escape") {
        if (st.panel) return; // the landmark panel closes itself
        if (performance.now() - lostLockAt < 400) return; // this Esc already opened the menu
        e.preventDefault();
        worldStore.set({ menu: st.menu === "settings" ? "pause" : st.menu === "pause" ? null : "pause" });
      } else if (e.code === "Backslash" && !st.panel && !st.menu) {
        worldStore.set({ hudHidden: !st.hudHidden });
      }
    };
    const onLock = () => {
      const locked = !!document.pointerLockElement;
      const st = worldStore.get();
      if (wasLocked && !locked && !st.panel && !st.menu && document.hasFocus()) {
        lostLockAt = performance.now();
        worldStore.set({ menu: "pause" });
      }
      wasLocked = locked;
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerlockchange", onLock);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerlockchange", onLock);
    };
  }, []);

  // Opening a menu frees the cursor
  const menu = useWorld((s) => s.menu);
  useEffect(() => {
    if (menu && document.pointerLockElement) document.exitPointerLock?.();
  }, [menu]);
}

/* ─────────────────────────────── Icons (original drawings) */
const ICONS: Record<string, ReactElement> = {
  sound: <path d="M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18.5 6a8.5 8.5 0 0 1 0 12l-1.4-1.4a6.5 6.5 0 0 0 0-9.2z" />,
  mute: <path d="M4 9h4l5-4v14l-5-4H4zM15.3 9.7l1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3z" />,
  menu: <path d="M7 3.5 10.5 7 7 10.5 3.5 7zM17 3.5 20.5 7 17 10.5 13.5 7zM7 13.5l3.5 3.5L7 20.5 3.5 17zM17 13.5l3.5 3.5-3.5 3.5-3.5-3.5z" />,
  gear: (
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm9 3.5-2.1-.6-.5-1.3 1-1.9-1.6-1.6-1.9 1-1.3-.5L14 3h-4l-.6 2.1-1.3.5-1.9-1L4.6 6.2l1 1.9-.5 1.3L3 10v4l2.1.6.5 1.3-1 1.9 1.6 1.6 1.9-1 1.3.5L10 21h4l.6-2.1 1.3-.5 1.9 1 1.6-1.6-1-1.9.5-1.3L21 14z" />
  ),
  graphics: <path d="M3 4.5h18v12H3zm2 2v8h14v-8zm2.5 6.5 3-3.5 2 2.2 1.5-1.4 2.5 2.7zM9 19h6v1.5H9z" />,
  controls: (
    <path d="M7 7h10a5 5 0 0 1 4.9 6l-.8 4a2.5 2.5 0 0 1-4.4 1l-1.9-2.5H9.2L7.3 18a2.5 2.5 0 0 1-4.4-1l-.8-4A5 5 0 0 1 7 7zm0 3v1.5H5.5V13H7v1.5h1.5V13H10v-1.5H8.5V10zm8.5.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm2 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
  ),
  other: <path d="M4 6h9.2a2.5 2.5 0 0 1 4.6 0H20v2h-2.2a2.5 2.5 0 0 1-4.6 0H4zm0 5h2.2a2.5 2.5 0 0 1 4.6 0H20v2h-9.2a2.5 2.5 0 0 1-4.6 0H4zm0 5h9.2a2.5 2.5 0 0 1 4.6 0H20v2h-2.2a2.5 2.5 0 0 1-4.6 0H4z" />,
  info: <path d="M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19zm0 2a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM11 10h2v7h-2zm1-3.6a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z" />,
  eye: <path d="M12 5c4.6 0 8.2 3 10 7-1.8 4-5.4 7-10 7S3.8 16 2 12c1.8-4 5.4-7 10-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />,
  page: <path d="M6 2.5h8l4.5 4.5v14.5H6zm7 1.8V8h3.7zM8.5 11h7v1.5h-7zm0 3h7v1.5h-7zm0 3h5v1.5h-5z" />,
  resume: <path d="M8 5.5v13l10.5-6.5z" />,
  back: <path d="M14.5 5 7.5 12l7 7 1.5-1.5L10.5 12 16 6.5z" />,
  next: <path d="M9.5 5 8 6.5l5.5 5.5L8 17.5 9.5 19l7-7z" />,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** A phone turning on its side. */
function RotateIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <path d="M8 4.5a6 6 0 0 1 8 0" />
      <path d="M16 2v2.5h-2.5" />
    </svg>
  );
}

/** HUD buttons in the top bar: the pause menu and the settings shortcut. */
export function MenuButtons() {
  const on = useWorld((s) => s.prefs.music);
  return (
    <div className="hud-menu-btns">
      <button type="button" className="hud-gear" onClick={() => setPrefs({ music: !on })} aria-pressed={on} aria-label={on ? "Mute music" : "Play music"} title={on ? "Mute music" : "Play music"}>
        <Icon name={on ? "sound" : "mute"} />
      </button>
      <button type="button" className="hud-gear" onClick={() => worldStore.set({ menu: "pause" })} aria-label="Open menu (Esc)" title="Menu (Esc)">
        <Icon name="menu" />
      </button>
      <button type="button" className="hud-gear" onClick={() => worldStore.set({ menu: "settings" })} aria-label="Settings" title="Settings">
        <Icon name="gear" />
      </button>
    </div>
  );
}

/** Moves focus into a menu when it opens and back out when it closes. */
function useFocusOnOpen(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => prev?.focus?.();
  }, [key]);
}

/* ═════════════════════════════════════ Pause menu */
const SHORT: Record<LandmarkId, string> = { about: "About", skills: "Skills", projects: "Projects", achievements: "Achievements", contact: "Contact" };

export function GameMenus() {
  const menu = useWorld((s) => s.menu);
  if (menu === "pause") return <PauseMenu />;
  if (menu === "settings") return <SettingsScreen />;
  return null;
}

function PauseMenu() {
  const ready = useWorld((s) => s.ready);
  const ref = useRef<HTMLDivElement>(null);
  useFocusOnOpen(ref, "pause");
  const close = () => worldStore.set({ menu: null });
  const go = (id: LandmarkId) => (ready ? travelTo(id) : worldStore.set({ menu: null, panel: id }));
  const skillCount = skillGroups.reduce((n, g) => n + g.skills.length, 0);

  const tiles: { key: string; label: string; icon: ReactNode; onClick?: () => void; href?: string }[] = [
    ...LANDMARKS.map((L) => ({ key: L.id, label: SHORT[L.id], icon: <NavIcon name={L.id} size={26} />, onClick: () => go(L.id) })),
    { key: "settings", label: "Settings", icon: <Icon name="gear" size={26} />, onClick: () => worldStore.set({ menu: "settings" }) },
    { key: "hud", label: "Hide HUD", icon: <Icon name="eye" size={26} />, onClick: () => worldStore.set({ menu: null, hudHidden: true }) },
    ...(canLockLandscape() && window.matchMedia("(pointer: coarse)").matches
      ? [{ key: "landscape", label: "Landscape", icon: <RotateIcon />, onClick: () => { worldStore.set({ menu: null }); playInLandscape(); } }]
      : []),
    { key: "github", label: "GitHub", icon: <GitHubIcon size={24} />, href: profile.links.github },
    { key: "classic", label: "Classic Page", icon: <Icon name="page" size={26} />, href: "?classic" },
  ];

  return (
    <div className="gm gm-pause" role="dialog" aria-modal="true" aria-label="Menu" ref={ref} onClick={(e) => e.target === e.currentTarget && close()}>
      <section className="gm-card" aria-label="Explorer profile">
        <div className="gm-card-banner" aria-hidden="true" />
        <div className="gm-avatar" aria-hidden="true">
          <Sigil element="geo" size={58} ring={false} />
        </div>
        <h2 className="gm-card-name">{profile.name}</h2>
        <p className="gm-card-level">
          <span>{profile.yearLevel}-Year</span> {profile.degree}
        </p>
        <p className="gm-card-sign">{profile.tagline}</p>
        <dl className="gm-card-stats">
          <div>
            <dt>Projects</dt>
            <dd>{projects.length}</dd>
          </div>
          <div>
            <dt>Skills</dt>
            <dd>{skillCount}</dd>
          </div>
          <div>
            <dt>Achievements</dt>
            <dd>{milestones.length}</dd>
          </div>
          <div>
            <dt>Region</dt>
            <dd>{profile.location}</dd>
          </div>
        </dl>
        <p className="gm-card-id">ID: {profile.links.githubHandle}</p>
      </section>

      <section className="gm-grid-wrap" aria-label="Destinations">
        <p className="gm-grid-title">Menu</p>
        <div className="gm-grid">
          {tiles.map((t, i) => {
            const inner = (
              <>
                <span className="gm-tile-orb">{t.icon}</span>
                <span className="gm-tile-label">{t.label}</span>
              </>
            );
            return t.href ? (
              <a key={t.key} className="gm-tile" href={t.href} style={{ animationDelay: `${i * 25}ms` }} {...(t.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                {inner}
              </a>
            ) : (
              <button key={t.key} type="button" className="gm-tile" style={{ animationDelay: `${i * 25}ms` }} onClick={t.onClick} data-autofocus={i === 0 ? true : undefined}>
                {inner}
              </button>
            );
          })}
        </div>
      </section>

      <button type="button" className="gm-close" onClick={close} aria-label="Resume">
        <CloseIcon size={18} />
      </button>
      <footer className="gm-hints" aria-hidden="true">
        <span>
          <kbd>Esc</kbd> Resume
        </span>
        <span>
          <kbd>\</kbd> Hide HUD
        </span>
      </footer>
    </div>
  );
}

/* ═════════════════════════════════════ Settings screen */
type Choice<V> = { v: V; label: string };
type Option =
  | {
      kind: "choice";
      id: string;
      label: string;
      desc: string;
      values: Choice<unknown>[];
      get: (s: WorldState) => unknown;
      set: (v: unknown) => void;
      off?: (s: WorldState) => string | false; // reason the option is unavailable
    }
  | { kind: "slider"; id: string; label: string; desc: string; min: number; max: number; step: number; get: (s: WorldState) => number; set: (v: number) => void; format: (v: number) => string }
  | { kind: "keys"; id: string; label: string; desc: string; keys: string[] }
  | { kind: "action"; id: string; label: string; desc: string; button: string; run: () => void }
  | { kind: "heading"; id: string; label: string };

const onOff = [
  { v: false, label: "Off" },
  { v: true, label: "On" },
];
const pref =
  <K extends keyof Prefs>(k: K) =>
  (s: WorldState) =>
    s.prefs[k];
const put =
  <K extends keyof Prefs>(k: K) =>
  (v: unknown) =>
    setPrefs({ [k]: v } as Partial<Prefs>);
const needsPost = (s: WorldState) => (s.quality === "low" ? "Needs Graphics Quality Medium or High" : false);

const TABS: { id: string; label: string; icon: string; options: Option[] }[] = [
  {
    id: "graphics",
    label: "Graphics",
    icon: "graphics",
    options: [
      {
        kind: "choice",
        id: "quality",
        label: "Graphics Quality",
        desc: "Preset for shadows, grass density, tree count and terrain detail. Changing it rebuilds the world for a moment.",
        values: (["low", "medium", "high"] as Quality[]).map((q) => ({ v: q, label: q[0].toUpperCase() + q.slice(1) })),
        get: (s) => s.quality,
        set: (v) => worldStore.set({ quality: v as Quality }),
      },
      {
        kind: "slider",
        id: "res",
        label: "Render Resolution",
        desc: "Scales the resolution of the 3D view. Higher looks sharper; lower runs faster on slow devices.",
        min: 0.6,
        max: 1.4,
        step: 0.1,
        get: (s) => s.prefs.renderScale,
        set: (v) => setPrefs({ renderScale: Math.round(v * 10) / 10 }),
        format: (v) => v.toFixed(1),
      },
      { kind: "heading", id: "h-fx", label: "Effects" },
      { kind: "choice", id: "bloom", label: "Bloom", desc: "Soft glow around bright light, the sun and lanterns.", values: onOff, get: pref("bloom"), set: put("bloom"), off: needsPost },
      { kind: "choice", id: "ao", label: "Ambient Occlusion", desc: "Soft contact shading in corners, under roofs and where objects meet the ground. Adds depth; costs some performance.", values: onOff, get: pref("ao"), set: put("ao"), off: needsPost },
      { kind: "choice", id: "sharpen", label: "Sharpening", desc: "Crisper edges on grass, leaves and stonework.", values: onOff, get: pref("sharpen"), set: put("sharpen"), off: needsPost },
      { kind: "choice", id: "vignette", label: "Vignette", desc: "Gently darkens the corners of the screen.", values: onOff, get: pref("vignette"), set: put("vignette"), off: needsPost },
      {
        kind: "choice",
        id: "motion",
        label: "Wind & Ambient Motion",
        desc: "Swaying grass and trees, drifting pollen and moving clouds. Turned off automatically when your system asks for reduced motion.",
        values: onOff,
        get: (s) => !s.reduced,
        set: (v) => worldStore.set({ reduced: !v }),
      },
      { kind: "choice", id: "outlines", label: "Character Outlines", desc: "Thin ink lines around the explorer, like a hand-drawn cel.", values: onOff, get: pref("outlines"), set: put("outlines") },
      { kind: "choice", id: "fps", label: "Show FPS", desc: "Shows the frame rate in the top-right corner.", values: onOff, get: pref("showFps"), set: put("showFps") },
    ],
  },
  {
    id: "controls",
    label: "Controls",
    icon: "controls",
    options: [
      {
        kind: "slider",
        id: "sens",
        label: "Camera Sensitivity",
        desc: "How fast the camera turns when you move the mouse or drag.",
        min: 1,
        max: 10,
        step: 1,
        get: (s) => s.prefs.sensitivity,
        set: (v) => setPrefs({ sensitivity: v }),
        format: (v) => String(v),
      },
      { kind: "choice", id: "invert", label: "Invert Vertical Axis", desc: "Moving the mouse up looks down.", values: onOff, get: pref("invertY"), set: put("invertY") },
      {
        kind: "choice",
        id: "dist",
        label: "Default Camera Distance",
        desc: "How far the camera sits behind you. The mouse wheel still zooms.",
        values: [
          { v: "near", label: "Near" },
          { v: "default", label: "Default" },
          { v: "far", label: "Far" },
        ],
        get: pref("camDistance"),
        set: put("camDistance"),
      },
      { kind: "heading", id: "h-keys", label: "Keyboard" },
      { kind: "keys", id: "k-move", label: "Move", desc: "Walk around the valley. Arrow keys also work.", keys: ["W", "A", "S", "D"] },
      { kind: "keys", id: "k-sprint", label: "Sprint", desc: "Hold while moving to run faster.", keys: ["Shift"] },
      { kind: "keys", id: "k-jump", label: "Jump", desc: "Hop over fences and small ledges.", keys: ["Space"] },
      { kind: "keys", id: "k-look", label: "Look Around", desc: "Click the world to capture the mouse, then move it. On touch screens, drag.", keys: ["Mouse"] },
      { kind: "keys", id: "k-zoom", label: "Zoom", desc: "Move the camera closer or further.", keys: ["Wheel"] },
      { kind: "keys", id: "k-use", label: "Interact", desc: "Open a landmark when its prompt appears.", keys: ["E"] },
      { kind: "keys", id: "k-menu", label: "Menu / Back", desc: "Open the menu, or go back one screen.", keys: ["Esc"] },
      { kind: "keys", id: "k-hud", label: "Hide HUD", desc: "Hide every on-screen element for a clean view. Press again to bring it back.", keys: ["\\"] },
    ],
  },
  {
    id: "other",
    label: "Other",
    icon: "other",
    options: [
      {
        kind: "choice",
        id: "character",
        label: "Explorer",
        desc: "Who walks the valley. Both are CC0 adventurers by Kay Lousberg, redrawn with the world's cel shading.",
        values: [
          { v: "ranger", label: "Ranger" },
          { v: "mage", label: "Mage" },
        ],
        get: pref("character"),
        set: put("character"),
      },
      {
        kind: "choice",
        id: "minimap",
        label: "Minimap Orientation",
        desc: "Keep north at the top, or turn the map with the camera so ahead is always up.",
        values: [
          { v: false, label: "Lock North" },
          { v: true, label: "Rotate" },
        ],
        get: pref("minimapRotate"),
        set: put("minimapRotate"),
      },
      { kind: "choice", id: "markers", label: "Landmark Markers", desc: "Floating names and distances above each landmark.", values: [{ v: false, label: "Hide" }, { v: true, label: "Show" }], get: pref("markers"), set: put("markers") },
      { kind: "choice", id: "guide", label: "Controls Guide", desc: "The key reminder in the bottom-left corner.", values: [{ v: false, label: "Hide" }, { v: true, label: "Show" }], get: pref("guide"), set: put("guide") },
      { kind: "heading", id: "h-audio", label: "Audio" },
      { kind: "choice", id: "music", label: "Music", desc: "An original pastoral theme that plays while you explore. It starts after your first click or tap.", values: onOff, get: pref("music"), set: put("music") },
      {
        kind: "slider",
        id: "musicVolume",
        label: "Music Volume",
        desc: "How loud the music plays.",
        min: 0,
        max: 10,
        step: 1,
        get: (s) => s.prefs.musicVolume,
        set: (v) => setPrefs({ musicVolume: v }),
        format: (v) => String(v),
      },
      { kind: "heading", id: "h-misc", label: "Misc" },
      {
        kind: "action",
        id: "classic",
        label: "Classic Page",
        desc: "The same portfolio as a regular scrolling page, without the 3D world.",
        button: "Open",
        run: () => {
          window.location.search = "?classic";
        },
      },
      {
        kind: "action",
        id: "reset",
        label: "Restore Defaults",
        desc: "Put every setting on this screen back to how it started.",
        button: "Restore",
        run: () => setPrefs(DEFAULT_PREFS),
      },
    ],
  },
  { id: "about", label: "About", icon: "info", options: [] },
];

function SettingsScreen() {
  const [tab, setTab] = useState(() => {
    try {
      return sessionStorage.getItem("world.settingsTab") ?? "graphics";
    } catch {
      return "graphics";
    }
  });
  const [focus, setFocus] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useFocusOnOpen(ref, "settings");
  useEffect(() => {
    try {
      sessionStorage.setItem("world.settingsTab", tab);
    } catch {
      /* ignore */
    }
    setFocus(null);
  }, [tab]);
  const T = TABS.find((t) => t.id === tab) ?? TABS[0];
  const focused = T.options.find((o) => o.id === focus && o.kind !== "heading") as Exclude<Option, { kind: "heading" }> | undefined;

  return (
    <div className="gm gm-settings" role="dialog" aria-modal="true" aria-labelledby="gm-settings-title" ref={ref}>
      <header className="gm-head">
        <span className="gm-head-icon" aria-hidden="true">
          <Icon name="gear" size={22} />
        </span>
        <h2 id="gm-settings-title">Settings</h2>
        <button type="button" className="gm-close" onClick={() => worldStore.set({ menu: null })} aria-label="Close settings">
          <CloseIcon size={18} />
        </button>
      </header>

      <div className="gm-settings-body">
        <nav className="gm-tabs" role="tablist" aria-label="Settings categories">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`gm-tab-${t.id}`}
              aria-selected={t.id === tab}
              aria-controls="gm-tabpanel"
              className="gm-tab"
              onClick={() => setTab(t.id)}
              data-autofocus={i === 0 ? true : undefined}
            >
              <Icon name={t.icon} size={20} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="gm-panel" id="gm-tabpanel" role="tabpanel" aria-labelledby={`gm-tab-${tab}`}>
          <div className="gm-options" key={tab}>
            {tab === "about" ? <AboutTab /> : T.options.map((o) => <OptionRow key={o.id} o={o} onFocus={() => setFocus(o.id)} active={o.id === focus} />)}
          </div>
          <div className="gm-desc" aria-live="polite">
            {focused ? (
              <>
                <p className="gm-desc-title">{focused.label}</p>
                <p className="gm-desc-text">{focused.desc}</p>
              </>
            ) : (
              <p className="gm-desc-text is-muted">{tab === "about" ? "Thanks for visiting." : "Hover or select an option to see what it does."}</p>
            )}
          </div>
        </div>
      </div>

      <footer className="gm-hints" aria-hidden="true">
        <span>
          <kbd>Esc</kbd> Back
        </span>
      </footer>
    </div>
  );
}

function OptionRow({ o, onFocus, active }: { o: Option; onFocus: () => void; active: boolean }) {
  const st = useWorld((s) => s);
  if (o.kind === "heading") return <p className="gm-section">{o.label}</p>;
  const off = o.kind === "choice" && o.off ? o.off(st) : false;
  const labelId = `gm-opt-${o.id}`;
  return (
    <div className={`gm-row ${active ? "is-active" : ""} ${off ? "is-off" : ""}`} onPointerEnter={onFocus} onFocusCapture={onFocus}>
      <span className="gm-row-label" id={labelId}>
        {o.label}
        {off && <small>{off}</small>}
      </span>
      {o.kind === "choice" && <ArrowPicker o={o} st={st} labelId={labelId} disabled={!!off} />}
      {o.kind === "slider" && <Slider o={o} value={o.get(st)} labelId={labelId} />}
      {o.kind === "keys" && (
        <span className="gm-keys">
          {o.keys.map((k) => (
            <kbd key={k}>{k}</kbd>
          ))}
        </span>
      )}
      {o.kind === "action" && (
        <button type="button" className="gm-pill" onClick={o.run} aria-describedby={labelId}>
          {o.button}
        </button>
      )}
    </div>
  );
}

/** ‹ Value › selector with position dots underneath. */
function ArrowPicker({ o, st, labelId, disabled }: { o: Extract<Option, { kind: "choice" }>; st: WorldState; labelId: string; disabled: boolean }) {
  const cur = o.get(st);
  const i = Math.max(0, o.values.findIndex((c) => c.v === cur));
  const step = (d: number) => o.set(o.values[(i + d + o.values.length) % o.values.length].v);
  return (
    <div
      className="gm-picker"
      role="group"
      aria-labelledby={labelId}
      onKeyDown={(e) => {
        if (disabled || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
        e.preventDefault();
        step(e.key === "ArrowLeft" ? -1 : 1);
      }}
    >
      <button type="button" className="gm-arrow" onClick={() => step(-1)} disabled={disabled} aria-label={`Previous ${o.label}`}>
        <Icon name="back" size={18} />
      </button>
      <span className="gm-picker-value" aria-live="polite">
        {o.values[i].label}
        <span className="gm-dots" aria-hidden="true">
          {o.values.map((c, j) => (
            <i key={String(c.v)} className={j === i ? "is-on" : ""} />
          ))}
        </span>
      </span>
      <button type="button" className="gm-arrow" onClick={() => step(1)} disabled={disabled} aria-label={`Next ${o.label}`}>
        <Icon name="next" size={18} />
      </button>
    </div>
  );
}

function Slider({ o, value, labelId }: { o: Extract<Option, { kind: "slider" }>; value: number; labelId: string }) {
  const pct = ((value - o.min) / (o.max - o.min)) * 100;
  return (
    <div className="gm-slider">
      <input
        type="range"
        min={o.min}
        max={o.max}
        step={o.step}
        value={value}
        aria-labelledby={labelId}
        aria-valuetext={o.format(value)}
        style={{ "--pct": `${pct}%` } as CSSProperties}
        onChange={(e) => o.set(Number(e.target.value))}
      />
      <output className="gm-slider-value">{o.format(value)}</output>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="gm-about">
      <div className="gm-about-head">
        <span className="gm-avatar is-small" aria-hidden="true">
          <Sigil element="geo" size={36} ring={false} />
        </span>
        <div>
          <p className="gm-about-name">{profile.name}</p>
          <p className="gm-about-sub">Developer portfolio · explorable 3D world</p>
        </div>
      </div>
      <p>
        Built with React, TypeScript and three.js. The terrain, water, sky, trees and buildings are generated in code; pines, rocks and village props are CC0 models
        by Quaternius and Kenney, and the explorers are CC0 KayKit adventurers by Kay Lousberg, redrawn with the world's cel shading.
      </p>
      <p>
        A fan tribute to the look of anime-style open-world adventure games. It uses no characters, logos, icons, fonts or files from any game, and is not
        affiliated with or endorsed by HoYoverse.
      </p>
      <p>
        <a className="gm-pill" href={profile.links.github} target="_blank" rel="noreferrer">
          <GitHubIcon size={16} /> github.com/{profile.links.githubHandle}
        </a>
      </p>
    </div>
  );
}

/* ═════════════════════════════════════ Small HUD extras */

/** Frame-rate readout (Settings → Graphics → Show FPS). */
export function FpsCounter() {
  const show = useWorld((s) => s.prefs.showFps);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!show) return;
    let raf = 0;
    let frames = 0;
    let since = performance.now();
    const loop = (t: number) => {
      frames++;
      if (t - since >= 500) {
        if (ref.current) ref.current.textContent = `${Math.round((frames * 1000) / (t - since))} FPS`;
        frames = 0;
        since = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [show]);
  if (!show) return null;
  return <span className="hud-fps" ref={ref} aria-hidden="true" />;
}

/** While the HUD is hidden: a faint button to bring it back (for touch screens). */
export function HudRestore() {
  const hidden = useWorld((s) => s.hudHidden);
  if (!hidden) return null;
  return (
    <button type="button" className="hud-restore" onClick={() => worldStore.set({ hudHidden: false })} aria-label="Show the HUD again (\\)">
      <Icon name="eye" size={18} />
    </button>
  );
}
