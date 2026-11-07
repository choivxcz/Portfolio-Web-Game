import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { About } from "../components/About";
import { Achievements } from "../components/Achievements";
import { Contact } from "../components/Contact";
import { CloseIcon } from "../components/Icons";
import { Journey } from "../components/Journey";
import { NavIcon } from "../components/NavIcons";
import { Projects } from "../components/Projects";
import { Skills } from "../components/Skills";
import { LANDMARKS, type LandmarkId } from "../world/config";
import { useWorld, worldStore } from "../world/store";

const CONTENT: Record<LandmarkId, () => ReactNode> = {
  about: () => (
    <>
      <About />
      <Journey />
    </>
  ),
  skills: () => <Skills />,
  projects: () => <Projects />,
  achievements: () => <Achievements />,
  contact: () => <Contact />,
};

/**
 * The archive screen that opens at a landmark: full-screen over the world in the same
 * navy-glass style as the menu and settings, with every landmark as a tab on the left
 * so visitors can browse all sections without walking back.
 */
export function WorldPanel() {
  const panel = useWorld((s) => s.panel);
  const ref = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const L = LANDMARKS.find((l) => l.id === panel);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (panel && !d.open) {
      document.exitPointerLock?.();
      d.showModal();
    }
    if (!panel && d.open) d.close();
    body.current?.scrollTo({ top: 0 });
    // on phones the tabs are a scrolling row: keep the active one in view
    d.querySelector(`#gp-tab-${panel}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [panel]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => worldStore.set({ panel: null });
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  // ↑/↓ (or ←/→ on the horizontal phone tabs) move between landmarks
  const onTabKey = (e: KeyboardEvent<HTMLElement>) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step || !L) return;
    e.preventDefault();
    const i = LANDMARKS.findIndex((l) => l.id === L.id);
    const next = LANDMARKS[(i + step + LANDMARKS.length) % LANDMARKS.length];
    worldStore.set({ panel: next.id });
    ref.current?.querySelector<HTMLElement>(`#gp-tab-${next.id}`)?.focus();
  };

  return (
    <dialog ref={ref} className="world-panel" aria-labelledby="world-panel-title">
      {L && (
        <div className="gm gp">
          <header className="gm-head">
            <span className="gm-head-icon" aria-hidden="true">
              <NavIcon name={L.id} size={20} />
            </span>
            <div className="gp-heading">
              <p className="gp-place">{L.name}</p>
              <h2 id="world-panel-title">{L.section}</h2>
            </div>
            <button type="button" className="gm-close" onClick={() => ref.current?.close()} aria-label="Close and return to the world">
              <CloseIcon size={18} />
            </button>
          </header>

          <div className="gp-main">
            <nav className="gm-tabs gp-tabs" role="tablist" aria-label="Landmarks" onKeyDown={onTabKey}>
              {LANDMARKS.map((T) => (
                <button
                  key={T.id}
                  id={`gp-tab-${T.id}`}
                  type="button"
                  role="tab"
                  aria-selected={T.id === L.id}
                  aria-controls="gp-page"
                  tabIndex={T.id === L.id ? 0 : -1}
                  className="gm-tab gp-tab"
                  onClick={() => worldStore.set({ panel: T.id })}
                >
                  <NavIcon name={T.id} size={20} />
                  <span className="gp-tab-text">
                    <span>{T.section}</span>
                    <small>{T.name}</small>
                  </span>
                </button>
              ))}
            </nav>

            <div className="world-panel-body gp-body" ref={body}>
              <div className="gp-page" id="gp-page" role="tabpanel" aria-labelledby={`gp-tab-${L.id}`} key={L.id}>
                {CONTENT[L.id]()}
              </div>
            </div>
          </div>

          <footer className="gm-hints" aria-hidden="true">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> Switch
            </span>
            <span>
              <kbd>Esc</kbd> Close
            </span>
          </footer>
        </div>
      )}
    </dialog>
  );
}
