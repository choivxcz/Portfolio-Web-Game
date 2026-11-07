import { lazy, Suspense } from "react";
import ClassicSite from "./ClassicSite";

const WorldApp = lazy(() => import("./ui/WorldApp"));

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * The 3D world is the website. The scrolling "classic" page remains available
 * with ?classic, and is shown automatically when WebGL 2 is unavailable.
 */
export default function App() {
  const wantsClassic = new URLSearchParams(window.location.search).has("classic");
  if (wantsClassic) return <ClassicSite />;
  if (!webglAvailable()) {
    return <ClassicSite notice="Your browser can't display the 3D world (WebGL 2 is unavailable), so here is the classic portfolio page." />;
  }
  return (
    <Suspense fallback={<div className="world-boot" role="status">Preparing the journey…</div>}>
      <WorldApp />
    </Suspense>
  );
}
