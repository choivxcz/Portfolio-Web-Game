import { lazy, Suspense, useEffect, useState } from "react";
import { useReveal } from "../hooks/useReveal";
import { useWorld, worldStore } from "../world/store";
import { FpsCounter, GameMenus, HudRestore, useMenuKeys } from "./GameMenu";
import { ControlsGuide, Loading, Prompt, TopBar, TravelFade } from "./Hud";
import { RotatePrompt } from "./Landscape";
import { JumpButton, Joystick, Minimap } from "./Minimap";
import { WorldPanel } from "./WorldPanel";

// The 3D engine (three.js + the world) loads as its own chunk so this interface appears immediately.
const World = lazy(() => import("../world/World"));

export default function WorldApp() {
  useReveal();
  useMenuKeys();
  const hudHidden = useWorld((s) => s.hudHidden);
  const [touch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  useEffect(() => {
    document.documentElement.classList.add("world-mode");
    if (!worldStore.get().ready) worldStore.set({ progress: 0.08, stage: "Downloading the world" });
    return () => document.documentElement.classList.remove("world-mode");
  }, []);

  return (
    <div className={`world-app ${hudHidden ? "is-hud-hidden" : ""}`}>
      <a className="skip-link" href="?classic">
        Skip to the classic, text-only page
      </a>
      <div className="world-stage" aria-label="Explorable 3D world. Use the landmark buttons above to open each portfolio section.">
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </div>
      <TopBar />
      <Minimap />
      <Prompt />
      <ControlsGuide touch={touch} />
      {touch && <Joystick />}
      {touch && <JumpButton />}
      <FpsCounter />
      <HudRestore />
      <TravelFade />
      <WorldPanel />
      <GameMenus />
      {touch && <RotatePrompt />}
      <Loading />
    </div>
  );
}
