import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { LANDMARKS, PLAY_CENTER, type LandmarkId } from "../world/config";
import { input, player, travelTo, useWorld, worldStore } from "../world/store";
import { MINIMAP_SPAN } from "../world/terrain";

const MAP_PX = 420; // rendered size of the whole map image
const SCALE = MAP_PX / MINIMAP_SPAN; // px per metre

/** Circular minimap that follows the explorer: north-up, or turning with the camera (Settings → Other). */
export function Minimap() {
  const src = useWorld((s) => s.minimap);
  const layer = useRef<HTMLDivElement>(null);
  const arrow = useRef<HTMLDivElement>(null);
  const north = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const ox = (player.x - PLAY_CENTER[0]) * SCALE + MAP_PX / 2;
      const oz = (player.z - PLAY_CENTER[1]) * SCALE + MAP_PX / 2;
      const turn = worldStore.get().prefs.minimapRotate ? player.yaw : 0; // map turns so "ahead" is up
      if (layer.current) layer.current.style.transform = `rotate(${turn}rad) translate(${-ox}px, ${-oz}px)`;
      if (arrow.current) arrow.current.style.transform = `translate(-50%, -50%) rotate(${turn - player.yaw}rad)`;
      if (north.current) {
        north.current.style.left = `${50 + Math.sin(turn) * 49}%`;
        north.current.style.top = `${50 - Math.cos(turn) * 49}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!src) return null;
  return (
    <div className="minimap" aria-label="Map">
      <div className="minimap-disc">
        <div className="minimap-layer" ref={layer} style={{ width: MAP_PX, height: MAP_PX }}>
          <img src={src} alt="" width={MAP_PX} height={MAP_PX} draggable={false} />
          {LANDMARKS.map((L) => (
            <button
              key={L.id}
              type="button"
              className="minimap-pin"
              style={{ left: (L.pos[0] - PLAY_CENTER[0]) * SCALE + MAP_PX / 2, top: (L.pos[1] - PLAY_CENTER[1]) * SCALE + MAP_PX / 2 }}
              onClick={() => travelTo(L.id as LandmarkId)}
              aria-label={`Teleport to ${L.name}`}
              title={L.name}
            />
          ))}
        </div>
        <div className="minimap-arrow" ref={arrow} aria-hidden="true" />
      </div>
      <span className="minimap-north" ref={north} aria-hidden="true">
        N
      </span>
    </div>
  );
}

/** Round jump button for touch screens (bottom-right, opposite the joystick). */
export function JumpButton() {
  return (
    <button
      type="button"
      className="jump-btn"
      aria-label="Jump"
      onPointerDown={(e) => {
        e.preventDefault();
        input.jump = true;
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 4 5 11.5h4.5V20h5v-8.5H19z" />
      </svg>
    </button>
  );
}

/** On-screen joystick for touch devices. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const set = (x: number, y: number) => {
    input.joy.x = x;
    input.joy.y = y;
    if (knob.current) knob.current.style.transform = `translate(calc(-50% + ${x * 38}px), calc(-50% + ${y * 38}px))`;
  };
  const onMove = (e: ReactPointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    set(x, y);
  };
  return (
    <div
      ref={base}
      className="joystick"
      aria-hidden="true"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onMove(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons || e.pointerType === "touch") onMove(e);
      }}
      onPointerUp={() => set(0, 0)}
      onPointerCancel={() => set(0, 0)}
    >
      <div ref={knob} className="joystick-knob" />
    </div>
  );
}
