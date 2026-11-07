import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { LANDMARKS, type LandmarkId } from "../config";
import { player, travelTo } from "../store";
import { terrainHeight } from "../terrain";

const HEIGHT: Record<LandmarkId, number> = { about: 8, skills: 23, projects: 6.5, achievements: 10, contact: 31 };

/** Floating location markers above each landmark, with live distance. */
export function Markers() {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useFrame(() => {
    LANDMARKS.forEach((L, i) => {
      const el = refs.current[i];
      if (!el) return;
      const d = Math.hypot(player.x - L.pos[0], player.z - L.pos[1]);
      const dist = el.querySelector(".marker-dist");
      if (dist) dist.textContent = `${Math.round(d)} m`;
      el.dataset.near = d < L.radius + 4 ? "true" : "false";
    });
  });
  return (
    <>
      {LANDMARKS.map((L, i) => (
        <Html key={L.id} position={[L.pos[0], terrainHeight(L.pos[0], L.pos[1]) + HEIGHT[L.id], L.pos[1]]} center zIndexRange={[20, 0]}>
          <button
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            className="world-marker"
            onClick={() => travelTo(L.id)}
            aria-label={`Travel to ${L.name} (${L.section})`}
          >
            <span className="marker-diamond" aria-hidden="true" />
            <span className="marker-text">
              <span className="marker-name">{L.name}</span>
              <span className="marker-dist" aria-hidden="true" />
            </span>
          </button>
        </Html>
      ))}
    </>
  );
}
