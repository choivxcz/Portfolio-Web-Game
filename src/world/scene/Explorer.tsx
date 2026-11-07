import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { LANDMARKS, SPAWN, SPAWN_YAW } from "../config";
import type { Collider } from "../scatter";
import { input, player, worldStore } from "../store";
import { groundAt, isWalkable } from "../terrain";

const BODY = 0.6; // explorer radius for collisions
const CAM_DIST = { near: 11, default: 17, far: 24 } as const;

/** Spatial hash so each frame only tests nearby colliders. */
function buildGrid(colliders: Collider[], cell = 10) {
  const map = new Map<string, Collider[]>();
  for (const c of colliders) {
    for (let gx = Math.floor((c.x - c.r) / cell); gx <= Math.floor((c.x + c.r) / cell); gx++) {
      for (let gz = Math.floor((c.z - c.r) / cell); gz <= Math.floor((c.z + c.r) / cell); gz++) {
        const k = `${gx},${gz}`;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(c);
      }
    }
  }
  return (x: number, z: number) => map.get(`${Math.floor(x / cell)},${Math.floor(z / cell)}`) ?? [];
}

export function Explorer({ colliders }: { colliders: Collider[] }) {
  const { camera, gl } = useThree();
  const near = useMemo(() => buildGrid(colliders), [colliders]);
  const view = useRef({ yaw: SPAWN_YAW, elev: 0.3, dist: CAM_DIST[worldStore.get().prefs.camDistance] as number });
  const camPos = useRef(new THREE.Vector3());
  const started = useRef(false);
  const ground = useRef<number | null>(null);

  // Spawn (once; a quality change rebuilds the scene but keeps the explorer where they were)
  useEffect(() => {
    if (!player.spawned) {
      player.x = SPAWN[0];
      player.z = SPAWN[1];
      player.facing = SPAWN_YAW + Math.PI; // facing away from the camera
      player.spawned = true;
    } else {
      view.current.yaw = player.yaw;
    }
    player.y = groundAt(player.x, player.z);
  }, []);

  // Keyboard, mouse, wheel, pointer lock, touch-look
  useEffect(() => {
    const el = gl.domElement;
    const typing = (e: Event) => (e.target as HTMLElement)?.closest?.("input, textarea, select, dialog");
    const down = (e: KeyboardEvent) => {
      const st = worldStore.get();
      if (typing(e) || st.panel || st.menu) return;
      input.keys.add(e.code);
      if (e.code === "KeyE") {
        const n = worldStore.get().nearby;
        if (n) {
          document.exitPointerLock?.();
          worldStore.set({ panel: n });
        }
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.code);
    const blur = () => input.keys.clear();
    let dragging = false;
    // Touches that started on the world (the joystick and buttons are separate elements):
    // one finger looks around, two fingers pinch to zoom.
    const touches = new Map<number, { x: number; y: number }>();
    const pinch = () => {
      const [a, b] = [...touches.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    let pinchDist = 0;
    const onDown = (e: PointerEvent) => {
      const st = worldStore.get();
      if (e.pointerType !== "mouse") {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 2) pinchDist = pinch();
        return;
      }
      if (e.button === 0 && !st.panel && !st.menu) {
        if (document.pointerLockElement !== el) el.requestPointerLock?.();
      }
      dragging = true;
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
        /* not capturable while pointer lock is starting: dragging still works */
      }
    };
    const onMove = (e: PointerEvent) => {
      const { sensitivity, invertY } = worldStore.get().prefs;
      if (e.pointerType !== "mouse") {
        const t = touches.get(e.pointerId);
        if (!t) return; // a finger on the joystick or a button
        const dx = e.clientX - t.x;
        const dy = e.clientY - t.y;
        t.x = e.clientX;
        t.y = e.clientY;
        if (touches.size === 1) {
          const k = 0.0055 * (sensitivity / 5);
          input.lookX += dx * k;
          input.lookY += dy * k * (invertY ? -1 : 1);
        } else if (touches.size === 2) {
          const d = pinch();
          input.zoom -= (d - pinchDist) * 0.06;
          pinchDist = d;
        }
        return;
      }
      const locked = document.pointerLockElement === el;
      if (locked || (dragging && e.buttons)) {
        const k = 0.0024 * (sensitivity / 5);
        input.lookX += e.movementX * k;
        input.lookY += e.movementY * k * (invertY ? -1 : 1);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        touches.delete(e.pointerId);
        if (touches.size === 2) pinchDist = pinch();
        return;
      }
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (worldStore.get().panel || worldStore.get().menu) return;
      input.zoom += e.deltaY * 0.012;
    };
    const onLock = () => worldStore.set({ locked: document.pointerLockElement === el });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    document.addEventListener("pointerlockchange", onLock);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      document.removeEventListener("pointerlockchange", onLock);
    };
  }, [gl]);

  // "Default camera distance" setting: jump to the new distance when it changes
  useEffect(() => {
    let last = worldStore.get().prefs.camDistance;
    return worldStore.subscribe(() => {
      const d = worldStore.get().prefs.camDistance;
      if (d !== last) view.current.dist = CAM_DIST[(last = d)];
    });
  }, []);

  // Teleport requests from the navigation
  useEffect(() => {
    let last = worldStore.get().travel?.n ?? 0;
    return worldStore.subscribe(() => {
      const t = worldStore.get().travel;
      if (!t || t.n === last) return;
      last = t.n;
      const L = LANDMARKS.find((l) => l.id === t.id)!;
      player.x = L.approach[0];
      player.z = L.approach[1];
      view.current.yaw = Math.atan2(-(L.pos[0] - L.approach[0]), -(L.pos[1] - L.approach[1]));
      player.facing = Math.atan2(L.pos[0] - L.approach[0], L.pos[1] - L.approach[1]);
      player.air = player.vy = 0;
      view.current.elev = 0.16;
      view.current.dist = 13;
      started.current = false; // snap camera
      window.setTimeout(() => worldStore.set({ panel: t.id }), 650);
    });
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const v = view.current;
    const st = worldStore.get();
    const panelOpen = st.panel !== null || st.menu !== null;

    // Look + zoom
    v.yaw -= input.lookX;
    v.elev = THREE.MathUtils.clamp(v.elev + input.lookY, -0.05, 1.15);
    v.dist = THREE.MathUtils.clamp(v.dist + input.zoom, 5, 30);
    input.lookX = input.lookY = input.zoom = 0;

    // Movement relative to the camera heading
    const startX = player.x;
    const startZ = player.z;
    if (!panelOpen) {
      const k = input.keys;
      const fwd = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) - input.joy.y;
      const side = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) + input.joy.x;
      const len = Math.hypot(fwd, side);
      if (len > 0.05) {
        const speed = (k.has("ShiftLeft") || k.has("ShiftRight") ? 16 : 8.5) * Math.min(1, len);
        const fx = -Math.sin(v.yaw);
        const fz = -Math.cos(v.yaw);
        const rx = Math.cos(v.yaw);
        const rz = -Math.sin(v.yaw);
        const mx = ((fx * fwd + rx * side) / Math.max(1, len)) * speed * dt;
        const mz = ((fz * fwd + rz * side) / Math.max(1, len)) * speed * dt;
        // turn the character toward the direction of travel (shortest way round)
        const want = Math.atan2(mx, mz);
        const diff = Math.atan2(Math.sin(want - player.facing), Math.cos(want - player.facing));
        player.facing += diff * (1 - Math.exp(-dt * 14));
        // move each axis separately so the explorer slides along obstacles
        if (isWalkable(player.x + mx, player.z)) player.x += mx;
        if (isWalkable(player.x, player.z + mz)) player.z += mz;
        for (const c of near(player.x, player.z)) {
          const dx = player.x - c.x;
          const dz = player.z - c.z;
          const d = Math.hypot(dx, dz);
          const min = c.r + BODY;
          if (d < min && d > 0.0001) {
            player.x = c.x + (dx / d) * min;
            player.z = c.z + (dz / d) * min;
          }
        }
      }
    }
    const gy = groundAt(player.x, player.z);
    ground.current = THREE.MathUtils.lerp(ground.current ?? gy, gy, 1 - Math.exp(-dt * 14));
    // Jump: Space while on the ground
    if (!panelOpen && player.air === 0 && (input.keys.has("Space") || input.jump)) player.vy = 7.2;
    input.jump = false;
    if (player.vy !== 0 || player.air > 0) {
      player.vy -= 22 * dt;
      player.air += player.vy * dt;
      if (player.air <= 0) {
        player.air = 0;
        player.vy = 0;
      }
    }
    player.y = ground.current + player.air;
    const moved = Math.hypot(player.x - startX, player.z - startZ) / Math.max(dt, 1e-4);
    player.speed = THREE.MathUtils.lerp(player.speed, moved, 1 - Math.exp(-dt * 12));
    player.yaw = v.yaw;

    // Third-person camera: behind and above, kept out of the ground and buildings
    // follow the ground, not the jump, so the camera doesn't bob
    const target = new THREE.Vector3(player.x, (ground.current ?? player.y) + 1.5 + player.air * 0.35, player.z);
    let dist = v.dist;
    for (let s = 1; s <= 8; s++) {
      const t = (s / 8) * dist;
      const px = target.x + Math.sin(v.yaw) * Math.cos(v.elev) * t;
      const pz = target.z + Math.cos(v.yaw) * Math.cos(v.elev) * t;
      if (near(px, pz).some((c) => c.r > 1.5 && Math.hypot(px - c.x, pz - c.z) < c.r)) {
        dist = Math.max(4, t - 1);
        break;
      }
    }
    const desired = new THREE.Vector3(
      target.x + Math.sin(v.yaw) * Math.cos(v.elev) * dist,
      target.y + Math.sin(v.elev) * dist,
      target.z + Math.cos(v.yaw) * Math.cos(v.elev) * dist,
    );
    desired.y = Math.max(desired.y, groundAt(desired.x, desired.z) + 1.3);
    if (!started.current) {
      camPos.current.copy(desired);
      started.current = true;
    } else {
      camPos.current.lerp(desired, 1 - Math.exp(-dt * 9));
    }
    camera.position.copy(camPos.current);
    // aim above the explorer so the horizon sits near mid-frame, like a vista shot
    camera.lookAt(target.x, target.y + 0.6 + dist * 0.2, target.z);

    // Nearest landmark within reach
    let nearby = null as (typeof LANDMARKS)[number]["id"] | null;
    for (const L of LANDMARKS) {
      if (Math.hypot(player.x - L.pos[0], player.z - L.pos[1]) < L.radius) nearby = L.id;
    }
    if (nearby !== worldStore.get().nearby) worldStore.set({ nearby });
  });

  return null;
}
