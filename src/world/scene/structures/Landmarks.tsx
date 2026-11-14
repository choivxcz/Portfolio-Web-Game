import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { RegionArt } from "../../../components/scene/RegionArt";
import { places, type PlaceId } from "../../../data/places";
import { projects, type Project } from "../../../data/projects";
import { LANDMARKS, type LandmarkId } from "../../config";
import { facing } from "../../layout";
import { terrainHeight } from "../../terrain";
import { Column, Lantern, MAT, archGeometry, columnGeometry, gableFill, gableGeometry, starGeometry } from "./parts";
import { bannerTexture, clothMaterial } from "./Ornaments";
import { HangingLantern, RibbedDome, glassMaterial } from "./ornate";

/** One cloth material for every landmark banner (it sways in the wind). */
const bannerCloth = (() => {
  let m: THREE.Material | null = null;
  return () => (m ??= clothMaterial(bannerTexture()));
})();

/** A cloth banner hanging from a short rod; the group is left out of static batching so it can sway. */
function WallBanner({ w = 1.1, h = 2.6, ...props }: { w?: number; h?: number } & { position?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group {...props} userData={{ dynamic: true }}>
      <mesh material={MAT.woodDark} position={[0, h / 2 + 0.06, 0.04]}>
        <boxGeometry args={[w + 0.3, 0.07, 0.07]} />
      </mesh>
      <mesh material={bannerCloth()} position={[0, 0, 0.07]}>
        <planeGeometry args={[w, h, 4, 12]} />
      </mesh>
    </group>
  );
}

const at = (id: LandmarkId) => {
  const L = LANDMARKS.find((l) => l.id === id)!;
  return { position: [L.pos[0], terrainHeight(L.pos[0], L.pos[1]), L.pos[1]] as [number, number, number], rotation: [0, facing(id), 0] as [number, number, number] };
};

function Spin({ speed = 0.5, bob = 0, children, ...props }: { speed?: number; bob?: number; children: ReactNode } & { position?: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const baseY = props.position?.[1] ?? 0;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * speed;
    if (bob) ref.current.position.y = baseY + Math.sin(clock.elapsedTime * 1.4) * bob;
  });
  return (
    <group ref={ref} {...props} userData={{ dynamic: true }}>
      {children}
    </group>
  );
}

/* ── About: the Adventurer's Journal shrine ── */
function JournalShrine() {
  const steps = useMemo(
    () => new THREE.LatheGeometry([[0, 0], [7.2, 0], [7.2, 0.45], [5.9, 0.45], [5.9, 0.9], [4.6, 0.9], [4.6, 1.3], [0, 1.3]].map(([x, y]) => new THREE.Vector2(x, y)), 24),
    [],
  );
  const stele = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.3, 0);
    s.lineTo(1.3, 0);
    s.lineTo(1.3, 2.9);
    s.absarc(0, 2.9, 1.3, 0, Math.PI, false);
    s.lineTo(-1.3, 0);
    return new THREE.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 });
  }, []);
  const star = useMemo(() => starGeometry(0.55, 0.18, 0.12), []);
  return (
    <group {...at("about")}>
      <mesh material={MAT.stoneDark} position={[0, -2.6, 0]}>
        <cylinderGeometry args={[7.3, 7.6, 5.2, 24]} />
      </mesh>
      <mesh geometry={steps} material={MAT.stone} receiveShadow castShadow />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return <Column key={i} position={[Math.cos(a) * 5.4, 0.9, Math.sin(a) * 5.4]} height={5} radius={0.42} />;
      })}
      {/* a domed rotunda: carved stone ring on the columns, gilded band, ribbed dome and an open lantern */}
      <mesh material={MAT.stone} position={[0, 6.25, 0]} castShadow>
        <cylinderGeometry args={[6.05, 5.85, 0.75, 36, 1, true]} />
      </mesh>
      <mesh material={MAT.stoneWarm} position={[0, 6.25, 0]}>
        <cylinderGeometry args={[4.95, 4.95, 0.75, 36, 1, true]} />
      </mesh>
      <mesh material={MAT.stone} position={[0, 6.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.95, 6.2, 36, 1]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 5.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6.06, 0.07, 6, 48]} />
      </mesh>
      <RibbedDome radius={5.9} rise={4.1} ribs={12} material={MAT.roofBlue} position={[0, 6.62, 0]} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <HangingLantern key={i} position={[Math.cos(a) * 5.4, 5.88, Math.sin(a) * 5.4]} drop={0.5} />;
      })}
      {/* stele with gold emblem */}
      <mesh geometry={stele} material={MAT.stoneWarm} position={[0, 1.3, -2.9]} castShadow />
      <mesh geometry={star} material={MAT.gold} position={[0, 4.2, -2.25]} />
      {/* lectern and open journal */}
      <mesh material={MAT.stoneDark} position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.55, 1.3, 8]} />
      </mesh>
      <mesh material={MAT.stoneWarm} position={[0, 2.68, 0]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[1.5, 0.12, 1.0]} />
      </mesh>
      <group position={[0, 2.8, 0.02]} rotation={[-0.35, 0, 0]}>
        <mesh material={MAT.paper} position={[-0.34, 0, 0]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.66, 0.05, 0.86]} />
        </mesh>
        <mesh material={MAT.paper} position={[0.34, 0, 0]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.66, 0.05, 0.86]} />
        </mesh>
        <mesh material={MAT.cloth} position={[0, -0.05, 0]}>
          <boxGeometry args={[1.42, 0.05, 0.92]} />
        </mesh>
      </group>
      <Spin position={[0, 3.6, 0]} speed={0.8} bob={0.12}>
        <mesh material={MAT.glow} scale={[0.22, 0.32, 0.22]}>
          <octahedronGeometry args={[1, 0]} />
        </mesh>
      </Spin>
      <Lantern position={[-3.4, 1.3, 3.2]} rotation={[0, Math.PI, 0]} />
      <Lantern position={[3.4, 1.3, 3.2]} />
    </group>
  );
}

/* ── Skills: the Academy ── */
function Academy() {
  const roof = useMemo(() => gableGeometry(16, 4.2, 12, 0.7), []);
  const roofFill = useMemo(() => gableFill(16, 4.2, 11.6), []);
  const pediment = useMemo(() => gableFill(15, 2.6, 0.8), []);
  const col = useMemo(() => columnGeometry(7.2, 0.42), []);
  const academyWindow = useMemo(() => archGeometry(1.7, 3.6, 0.16, 1.2), []);
  return (
    <group {...at("skills")}>
      <mesh material={MAT.stoneDark} position={[0, -2.6, 1]}>
        <boxGeometry args={[17.4, 6.4, 17]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={MAT.stoneWarm} position={[0, 0.2 + i * 0.4, 8.6 - i * 0.7]} receiveShadow castShadow>
          <boxGeometry args={[16, 0.4, 1.6 + i * 0.1]} />
        </mesh>
      ))}
      <mesh material={MAT.stone} position={[0, 0.6, 0.5]} receiveShadow>
        <boxGeometry args={[17, 1.2, 15]} />
      </mesh>
      <mesh material={MAT.plaster} position={[0, 5.2, -1]} castShadow receiveShadow>
        <boxGeometry args={[16, 8, 12]} />
      </mesh>
      <mesh geometry={roofFill} material={MAT.plaster} position={[0, 9.2, -1]} />
      <mesh geometry={roof} material={MAT.roofBlue} position={[0, 9.2, -1]} castShadow />
      {/* portico */}
      {[-6, -3.6, -1.2, 1.2, 3.6, 6].map((x) => (
        <mesh key={x} geometry={col} material={MAT.stone} position={[x, 1.2, 6.6]} castShadow />
      ))}
      <mesh material={MAT.stone} position={[0, 8.7, 6.4]} castShadow>
        <boxGeometry args={[15.4, 0.9, 1.6]} />
      </mesh>
      <mesh geometry={pediment} material={MAT.stone} position={[0, 9.15, 6.4]} />
      <mesh material={MAT.gold} position={[0, 10.1, 6.9]}>
        <torusGeometry args={[0.92, 0.1, 8, 28]} />
      </mesh>
      <mesh material={glassMaterial()} position={[0, 10.1, 6.86]}>
        <circleGeometry args={[0.88, 28]} />
      </mesh>
      {/* tall arched stained-glass windows in carved frames */}
      {[-5, -1.7, 1.7, 5].map((x) => (
        <group key={x} position={[x, 3.2, 5.08]}>
          <mesh geometry={academyWindow} material={MAT.stone} />
          {/* glass sits 4 cm in front of the wall, inside the frame */}
          <mesh material={glassMaterial()} position={[0, 1.15, -0.04]}>
            <planeGeometry args={[1.2, 2.3]} />
          </mesh>
          <mesh material={glassMaterial()} position={[0, 2.3, -0.04]}>
            <circleGeometry args={[0.6, 20, 0, Math.PI]} />
          </mesh>
        </group>
      ))}
      {/* gilded cornice along the eaves */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={MAT.gold} position={[0, 9.15, -1 + s * 6.06]}>
          <boxGeometry args={[16.2, 0.16, 0.12]} />
        </mesh>
      ))}
      <mesh material={MAT.woodDark} position={[0, 2.9, 5.03]}>
        <boxGeometry args={[2.2, 3.4, 0.1]} />
      </mesh>
      {/* central tower with dome */}
      <mesh material={MAT.plaster} position={[0, 10, -3]} castShadow>
        <cylinderGeometry args={[3, 3.3, 10, 16]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        if (i === 0) return null; // the clock faces the front
        return (
          <mesh key={i} material={glassMaterial()} position={[Math.sin(a) * 3.05, 12.4, -3 + Math.cos(a) * 3.05]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.7, 1.6, 0.06]} />
          </mesh>
        );
      })}
      <group position={[0, 12.6, 0.3]}>
        <mesh material={MAT.gold}>
          <torusGeometry args={[1.05, 0.1, 8, 32]} />
        </mesh>
        <mesh material={MAT.paper} position={[0, 0, -0.03]}>
          <circleGeometry args={[1.0, 32]} />
        </mesh>
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k / 12) * Math.PI * 2;
          return (
            <mesh key={k} material={MAT.woodDark} position={[Math.sin(a) * 0.82, Math.cos(a) * 0.82, 0.01]} rotation={[0, 0, -a]}>
              <boxGeometry args={[0.05, 0.16, 0.02]} />
            </mesh>
          );
        })}
        <mesh material={MAT.woodDark} position={[0.18, 0.18, 0.03]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.07, 0.55, 0.02]} />
        </mesh>
        <mesh material={MAT.woodDark} position={[0, 0.3, 0.04]}>
          <boxGeometry args={[0.05, 0.62, 0.02]} />
        </mesh>
      </group>
      <mesh material={MAT.stone} position={[0, 15.2, -3]}>
        <cylinderGeometry args={[3.5, 3.5, 0.5, 16]} />
      </mesh>
      <RibbedDome radius={3.2} rise={3.3} ribs={10} material={MAT.roofBlue} position={[0, 15.45, -3]} />
      {/* corner turrets */}
      {[-8.4, 8.4].map((x) => (
        <group key={x} position={[x, 0, -6.6]}>
          <mesh material={MAT.stone} position={[0, 6, 0]} castShadow>
            <cylinderGeometry args={[1.5, 1.7, 12, 12]} />
          </mesh>
          <mesh material={MAT.stone} position={[0, 10.2, 0]}>
            <cylinderGeometry args={[2.2, 2.0, 0.3, 14]} />
          </mesh>
          {Array.from({ length: 14 }, (_, k) => {
            const a = (k / 14) * Math.PI * 2;
            return (
              <mesh key={k} material={MAT.stone} position={[Math.cos(a) * 2.05, 10.65, Math.sin(a) * 2.05]}>
                <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
              </mesh>
            );
          })}
          <mesh material={MAT.gold} position={[0, 10.98, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.05, 0.06, 6, 28]} />
          </mesh>
          <mesh material={MAT.roofBlue} position={[0, 14.2, 0]} castShadow>
            <coneGeometry args={[2.1, 4.4, 14]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, 12.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.08, 0.07, 6, 28]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, 16.8, 0]}>
            <coneGeometry args={[0.14, 0.9, 8]} />
          </mesh>
          <mesh material={glassMaterial()} position={[0, 8, 1.66]}>
            <planeGeometry args={[0.6, 1.4]} />
          </mesh>
        </group>
      ))}
      {/* banners on the corners of the front, clear of the windows */}
      {[-7.3, 7.3].map((x) => (
        <WallBanner key={x} position={[x, 6, 5.1]} h={3.4} />
      ))}
      {/* lamp posts flanking the steps */}
      {[-7.4, 7.4].map((x) => (
        <group key={x} position={[x, 0.4, 9.6]}>
          <mesh material={MAT.stoneDark} position={[0, 0.3, 0]}>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
          </mesh>
          <mesh material={MAT.woodDark} position={[0, 2, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 2.8, 8]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, 3.45, 0]}>
            <coneGeometry args={[0.3, 0.25, 6]} />
          </mesh>
          <mesh material={MAT.glow} position={[0, 3.15, 0]}>
            <cylinderGeometry args={[0.2, 0.17, 0.4, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Projects: the Expedition Board ──
   Each project is a postcard from the region it is charted in (src/data/places.ts):
   the region's landscape, its name on a coloured band, then the project title. */
const NOTE_W = 256;
const NOTE_H = 320;
const NOTE_RES = 2;

/** Breaks text into lines no wider than maxW at the context's current font. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawNote(canvas: HTMLCanvasElement, p: Project, art?: CanvasImageSource) {
  const place = places[p.region];
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(NOTE_RES, 0, 0, NOTE_RES, 0, 0);
  ctx.fillStyle = "#f4ecd9";
  ctx.fillRect(0, 0, NOTE_W, NOTE_H);

  // Landscape window (16:9), then the region band under it.
  const px = 14;
  const py = 14;
  const pw = 228;
  const ph = 128;
  if (art) ctx.drawImage(art, px, py, pw, ph);
  else {
    ctx.fillStyle = place.accent;
    ctx.fillRect(px, py, pw, ph);
  }
  ctx.fillStyle = place.accent;
  ctx.fillRect(px, py + ph, pw, 26);
  ctx.strokeStyle = "#e3d5b8";
  ctx.lineWidth = 3;
  ctx.strokeRect(px, py, pw, ph + 26);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#26304a";
  ctx.font = "15px Marcellus, Georgia, serif";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
  ctx.fillText(place.name.toUpperCase(), NOTE_W / 2, py + ph + 14);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

  // Project title, shrunk until it fits the space left.
  let size = 26;
  let lines: string[] = [];
  for (; size >= 15; size -= 2) {
    ctx.font = `${size}px Marcellus, Georgia, serif`;
    lines = wrapText(ctx, p.name, 216);
    if (lines.length * size * 1.18 <= 104) break;
  }
  const lh = size * 1.18;
  ctx.fillStyle = "#3b4255";
  lines.forEach((l, i) => ctx.fillText(l, NOTE_W / 2, 226 - ((lines.length - 1) * lh) / 2 + i * lh));

  ctx.fillStyle = "#8a6a42";
  ctx.font = "italic 13px Georgia, serif";
  ctx.fillText(`✦ ${place.epithet} ✦`, NOTE_W / 2, 296);
  ctx.strokeStyle = "#c9b48c";
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, NOTE_W - 10, NOTE_H - 10);
}

/** Renders a region banner (the same SVG as the Projects panel) to an image. */
async function regionImage(region: PlaceId, id: string) {
  const host = document.createElement("div");
  const root = createRoot(host);
  flushSync(() => root.render(<RegionArt preset={region} id={id} />));
  const svg = host.querySelector("svg");
  svg?.setAttribute("width", "800");
  svg?.setAttribute("height", "450");
  const markup = svg ? new XMLSerializer().serializeToString(svg) : "";
  root.unmount();
  if (!markup) return undefined;
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    // Never hand WebGL a canvas the browser considers tainted.
    const probe = document.createElement("canvas").getContext("2d")!;
    probe.drawImage(img, 0, 0, 1, 1);
    probe.getImageData(0, 0, 1, 1);
    return img;
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ExpeditionBoard() {
  const boardRoof = useMemo(() => gableGeometry(2.0, 1.05, 6.2, 0.25), []);
  const boardStar = useMemo(() => starGeometry(0.28, 0.1, 0.06), []);
  const notes = useMemo(
    () =>
      projects.slice(0, 8).map((p, i) => {
        const canvas = document.createElement("canvas");
        canvas.width = NOTE_W * NOTE_RES;
        canvas.height = NOTE_H * NOTE_RES;
        drawNote(canvas, p);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        return { p, canvas, tex, x: -1.75 + (i % 4) * 1.17, y: 2.75 - Math.floor(i / 4) * 1.25, r: ((i * 37) % 9) / 60 - 0.07 };
      }),
    [],
  );

  // Paint each region's landscape onto its note once the world is up.
  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      await document.fonts?.load("26px Marcellus").catch(() => undefined);
      for (const n of notes) {
        const art = await regionImage(n.p.region, `note-${n.p.id}`);
        if (!alive) return;
        drawNote(n.canvas, n.p, art);
        n.tex.needsUpdate = true;
      }
    }, 400);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [notes]);

  return (
    <group {...at("projects")}>
      <mesh material={MAT.stoneWarm} position={[0, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[5.9, 0.4, 0.9]} />
      </mesh>
      {[-2.5, 2.5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh material={MAT.stoneDark} position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[0.6, 0.5, 0.6]} />
          </mesh>
          <mesh material={MAT.woodDark} position={[0, 2.4, 0]} castShadow>
            <boxGeometry args={[0.38, 4.0, 0.38]} />
          </mesh>
          <mesh material={MAT.gold} position={[0, 4.4, 0]}>
            <boxGeometry args={[0.46, 0.12, 0.46]} />
          </mesh>
          {/* carved bracket under the roof */}
          <mesh material={MAT.wood} position={[0, 3.95, 0.35]} rotation={[0.75, 0, 0]}>
            <boxGeometry args={[0.16, 0.9, 0.16]} />
          </mesh>
          <HangingLantern position={[x > 0 ? 0.45 : -0.45, 4.25, 0.6]} drop={0.35} />
        </group>
      ))}
      {/* crest plank with the valley's compass star */}
      <mesh material={MAT.wood} position={[0, 4.05, 0.14]}>
        <boxGeometry args={[2.4, 0.5, 0.1]} />
      </mesh>
      <mesh geometry={boardStar} material={MAT.gold} position={[0, 4.05, 0.22]} />
      <mesh material={MAT.wood} position={[0, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 2.9, 0.22]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0, 3.72, 0.05]}>
        <boxGeometry args={[5.3, 0.16, 0.32]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[0, 0.68, 0.05]}>
        <boxGeometry args={[5.3, 0.16, 0.32]} />
      </mesh>
      {/* tiled gable roof with a ridge cap and gilded finials */}
      <mesh geometry={boardRoof} material={MAT.roofRed} position={[0, 4.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      {[-3.3, 3.3].map((x) => (
        <mesh key={x} material={MAT.gold} position={[x, 5.65, 0]}>
          <coneGeometry args={[0.09, 0.45, 8]} />
        </mesh>
      ))}
      <mesh geometry={boardStar} material={MAT.gold} position={[0, 5.95, 0]} scale={1.3} />
      {notes.map((n) => (
        <group key={n.p.id} position={[n.x, n.y, 0.125]} rotation={[0, 0, n.r]}>
          <mesh>
            <planeGeometry args={[0.95, 1.19]} />
            <meshBasicMaterial map={n.tex} toneMapped={false} />
          </mesh>
          <mesh material={MAT.gold} position={[0, 0.5, 0.03]}>
            <sphereGeometry args={[0.045, 8, 6]} />
          </mesh>
        </group>
      ))}
      <Lantern position={[3.2, 0, 0.6]} />
      {/* crates and a barrel */}
      <mesh material={MAT.wood} position={[-3.6, 0.45, 1.2]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
      </mesh>
      <mesh material={MAT.wood} position={[-3.3, 1.2, 1.1]} rotation={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
      </mesh>
      <mesh material={MAT.woodDark} position={[-4.6, 0.55, 0.2]} castShadow>
        <cylinderGeometry args={[0.45, 0.4, 1.1, 10]} />
      </mesh>
    </group>
  );
}

/* ── Achievements: the Hall ── */
function HallOfAchievements() {
  const arch = useMemo(() => archGeometry(5.6, 6.4, 1.1, 3.2), []);
  const star = useMemo(() => starGeometry(1.0, 0.36, 0.2), []);
  return (
    <group {...at("achievements")}>
      <mesh material={MAT.stoneDark} position={[0, -2.4, 0]}>
        <boxGeometry args={[17.4, 5.4, 17.4]} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} material={MAT.stoneWarm} position={[0, 0.3 + i * 0.5, 0]} receiveShadow castShadow>
          <boxGeometry args={[17 - i * 2, 0.6 + i * 0.4, 17 - i * 2]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Column key={i} position={[Math.cos(a) * 6.8, 1.3, Math.sin(a) * 6.8]} height={6.2} radius={0.5} />;
      })}
      {/* octagonal entablature, then a ribbed octagonal dome with a glowing cupola */}
      <mesh material={MAT.stone} position={[0, 7.95, 0]} rotation={[0, Math.PI / 8, 0]} castShadow>
        <cylinderGeometry args={[7.6, 7.4, 0.9, 8, 1, true]} />
      </mesh>
      <mesh material={MAT.stoneWarm} position={[0, 7.95, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[6.3, 6.3, 0.9, 8, 1, true]} />
      </mesh>
      <mesh material={MAT.stone} position={[0, 8.4, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[6.3, 7.75, 8, 1]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 7.52, 0]} rotation={[Math.PI / 2, 0, Math.PI / 8]}>
        <torusGeometry args={[7.55, 0.08, 6, 8]} />
      </mesh>
      <RibbedDome radius={7.5} rise={5.2} ribs={8} sides={8} material={MAT.roofRed} position={[0, 8.4, 0]} rotation={[0, Math.PI / 8, 0]} />
      {/* rose window high on the back wall */}
      <mesh material={MAT.stone} position={[0, 5.1, -6.8]}>
        <torusGeometry args={[1.55, 0.22, 8, 32]} />
      </mesh>
      <mesh material={glassMaterial()} position={[0, 5.1, -6.88]}>
        <circleGeometry args={[1.5, 32]} />
      </mesh>
      {/* banners between the side columns */}
      {[2, 3, 5, 6].map((i) => {
        const a = ((i + 0.5) / 8) * Math.PI * 2;
        return <WallBanner key={i} position={[Math.cos(a) * 6.3, 4.9, Math.sin(a) * 6.3]} rotation={[0, Math.atan2(Math.cos(a), Math.sin(a)), 0]} h={3.0} />;
      })}
      <mesh geometry={arch} material={MAT.stone} position={[0, 1.3, 8]} castShadow />
      <mesh material={MAT.gold} position={[0, 7.4, 8.6]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.6, 0.6, 0.2]} />
      </mesh>
      {/* back wall, up to the roof */}
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <mesh key={x} material={MAT.stoneDark} position={[x, 1.3 + 3.1, -7.4]} castShadow>
          <boxGeometry args={[2.9, 6.2, 0.9]} />
        </mesh>
      ))}
      {/* pedestal and floating medal */}
      <mesh material={MAT.stone} position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.8, 1.6, 8]} />
      </mesh>
      <Spin position={[0, 4.6, 0]} speed={0.35} bob={0.15}>
        <mesh material={MAT.gold}>
          <torusGeometry args={[1.25, 0.16, 10, 32]} />
        </mesh>
        <mesh material={MAT.rose} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 0.16, 32]} />
        </mesh>
        <mesh geometry={star} material={MAT.gold} />
      </Spin>
    </group>
  );
}

/* ── Contact: the Communication Beacon ── */
function Beacon({ light }: { light: boolean }) {
  const beaconDoor = useMemo(() => archGeometry(2.2, 3.3, 0.5, 1.4), []);
  const crystal = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (crystal.current) {
      crystal.current.rotation.y = clock.elapsedTime * 0.8;
      crystal.current.position.y = 21.6 + Math.sin(clock.elapsedTime * 1.6) * 0.25;
    }
  });
  return (
    <group {...at("contact")}>
      <mesh material={MAT.stoneDark} position={[0, -2.4, 0]}>
        <cylinderGeometry args={[4.9, 5.4, 5, 8]} />
      </mesh>
      <mesh material={MAT.stoneWarm} position={[0, 0.6, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[4.6, 5, 1.2, 8]} />
      </mesh>
      <mesh material={MAT.stone} position={[0, 10.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 3.2, 18, 8]} />
      </mesh>
      {[4.5, 9, 13.5, 18].map((y) => (
        <mesh key={y} material={MAT.stoneDark} position={[0, y, 0]}>
          <cylinderGeometry args={[3.25 - y * 0.035, 3.3 - y * 0.035, 0.35, 8]} />
        </mesh>
      ))}
      {[6, 12].map((y) =>
        [0, 2, 4, 6].map((k) => {
          const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
          return (
            <mesh key={`${y}-${k}`} material={MAT.glow} position={[Math.sin(a) * (3.1 - y * 0.035), y, Math.cos(a) * (3.1 - y * 0.035)]} rotation={[0, a, 0]}>
              <boxGeometry args={[0.6, 1.3, 0.1]} />
            </mesh>
          );
        }),
      )}
      {/* buttresses around the base */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        if (i === 0 || i === 7) return null; // leave the door side (+z, toward the arrival point) open
        return (
          <mesh key={`b${i}`} material={MAT.stoneWarm} position={[Math.sin(a) * 3.35, 2.6, Math.cos(a) * 3.35]} rotation={[0, a, 0]} castShadow>
            <boxGeometry args={[0.7, 4.2, 1.1]} />
          </mesh>
        );
      })}
      {/* arched door facing the arrival point */}
      <mesh geometry={beaconDoor} material={MAT.stoneWarm} position={[0, 1.15, 3.05]} castShadow />
      <mesh material={MAT.woodDoor} position={[0, 2.25, 2.98]}>
        <boxGeometry args={[1.3, 2.3, 0.1]} />
      </mesh>
      {/* gallery: a wide railed balcony around the lantern room */}
      <mesh material={MAT.stone} position={[0, 19.4, 0]} castShadow>
        <cylinderGeometry args={[4.3, 3.6, 0.7, 16]} />
      </mesh>
      {Array.from({ length: 24 }, (_, k) => {
        const a = (k / 24) * Math.PI * 2;
        return (
          <mesh key={`r${k}`} material={MAT.stone} position={[Math.cos(a) * 4.1, 20.15, Math.sin(a) * 4.1]}>
            <cylinderGeometry args={[0.07, 0.09, 0.8, 6]} />
          </mesh>
        );
      })}
      <mesh material={MAT.gold} position={[0, 20.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.1, 0.08, 6, 40]} />
      </mesh>
      {/* glazed lantern room around the crystal */}
      <mesh position={[0, 21.6, 0]} renderOrder={3}>
        <cylinderGeometry args={[2.55, 2.55, 3.4, 8, 1, true]} />
        <meshBasicMaterial color="#bff4ff" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} material={MAT.stone} position={[Math.sin(a) * 2.3, 21.4, Math.cos(a) * 2.3]} castShadow>
            <boxGeometry args={[0.45, 3.6, 0.45]} />
          </mesh>
        );
      })}
      <mesh material={MAT.gold} position={[0, 23.35, 0]}>
        <cylinderGeometry args={[3.55, 3.55, 0.2, 8]} />
      </mesh>
      <mesh material={MAT.roofBlue} position={[0, 25.2, 0]} castShadow>
        <coneGeometry args={[3.4, 3.6, 8]} />
      </mesh>
      <mesh material={MAT.gold} position={[0, 27.7, 0]}>
        <coneGeometry args={[0.3, 1.4, 8]} />
      </mesh>
      {/* pennant flying from the spire */}
      <mesh material={MAT.woodDark} position={[0, 29.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
      </mesh>
      <group position={[0, 29.8, 0]} userData={{ dynamic: true }}>
        <mesh material={bannerCloth()} position={[0.75, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <planeGeometry args={[0.7, 1.5, 2, 8]} />
        </mesh>
      </group>
      <mesh ref={crystal} userData={{ dynamic: true }} material={MAT.crystal} position={[0, 21.6, 0]} scale={[0.75, 1.15, 0.75]}>
        <octahedronGeometry args={[1, 0]} />
      </mesh>
      {light && <pointLight position={[0, 21.6, 0]} color="#8eeaff" intensity={60} distance={45} decay={1.6} />}
    </group>
  );
}

/* ── Reviews: the Traveler's Guestbook ──
   A small roofed lectern with an open book and quill, a mailbox for the reviews,
   a bench and a lantern, on a round stone pad beside the first path. */
function Guestbook() {
  const star = useMemo(() => starGeometry(0.13, 0.05, 0.05), []);
  return (
    <group {...at("reviews")}>
      {/* stone pad */}
      <mesh material={MAT.stoneWarm} position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.4, 0.24, 24]} />
      </mesh>
      {/* lectern */}
      <mesh material={MAT.woodDark} position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.5, 1.2, 0.5]} />
      </mesh>
      <mesh material={MAT.wood} position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.9, 0.16, 0.9]} />
      </mesh>
      <mesh material={MAT.wood} position={[0, 1.38, 0.05]} rotation={[-0.38, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 1.05]} />
      </mesh>
      {/* open book: two pages and a ribbon */}
      <group position={[0, 1.48, 0.07]} rotation={[-0.38, 0, 0]}>
        <mesh material={MAT.cloth} position={[0, -0.02, 0]}>
          <boxGeometry args={[1.3, 0.04, 0.88]} />
        </mesh>
        <mesh material={MAT.paper} position={[-0.31, 0.02, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.6, 0.04, 0.8]} />
        </mesh>
        <mesh material={MAT.paper} position={[0.31, 0.02, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.6, 0.04, 0.8]} />
        </mesh>
        <mesh material={MAT.rose} position={[0.05, 0.03, 0.5]}>
          <boxGeometry args={[0.06, 0.02, 0.3]} />
        </mesh>
        {/* quill in an inkpot */}
        <mesh material={MAT.stoneDark} position={[0.58, 0.08, -0.32]}>
          <cylinderGeometry args={[0.07, 0.08, 0.14, 10]} />
        </mesh>
        <mesh material={MAT.paper} position={[0.62, 0.32, -0.36]} rotation={[0.3, 0, -0.35]}>
          <coneGeometry args={[0.05, 0.5, 6]} />
        </mesh>
      </group>
      {/* little roof on two posts */}
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} material={MAT.woodDark} position={[x, 1.35, -0.55]} castShadow>
          <boxGeometry args={[0.14, 2.7, 0.14]} />
        </mesh>
      ))}
      <mesh material={MAT.roofRed} position={[0, 2.82, -0.2]} rotation={[0.45, 0, 0]} castShadow>
        <boxGeometry args={[2.5, 0.12, 1.3]} />
      </mesh>
      <mesh material={MAT.roofRed} position={[0, 2.82, -0.9]} rotation={[-0.45, 0, 0]} castShadow>
        <boxGeometry args={[2.5, 0.12, 0.8]} />
      </mesh>
      {/* sign board under the roof with a gold star */}
      <mesh material={MAT.wood} position={[0, 2.38, -0.5]}>
        <boxGeometry args={[1.5, 0.36, 0.08]} />
      </mesh>
      <mesh geometry={star} material={MAT.gold} position={[0, 2.38, -0.44]} />
      {/* mailbox for the reviews */}
      <group position={[2.3, 0, 0.4]} rotation={[0, -0.35, 0]}>
        <mesh material={MAT.woodDark} position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.16, 1.2, 0.16]} />
        </mesh>
        <mesh material={MAT.roofBlue} position={[0, 1.36, 0]} castShadow>
          <boxGeometry args={[0.55, 0.42, 0.75]} />
        </mesh>
        <mesh material={MAT.roofBlue} position={[0, 1.57, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.275, 0.275, 0.75, 12, 1, false, 0, Math.PI]} />
        </mesh>
        <mesh material={MAT.paper} position={[0, 1.42, 0.38]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.36, 0.22, 0.02]} />
        </mesh>
        <mesh material={MAT.flowerRed} position={[0.3, 1.5, -0.1]}>
          <boxGeometry args={[0.04, 0.32, 0.08]} />
        </mesh>
      </group>
      {/* bench */}
      <group position={[-2.6, 0, -0.6]} rotation={[0, 0.45, 0]}>
        <mesh material={MAT.wood} position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.8, 0.1, 0.5]} />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} material={MAT.woodDark} position={[x, 0.25, 0]}>
            <boxGeometry args={[0.12, 0.5, 0.42]} />
          </mesh>
        ))}
        <mesh material={MAT.wood} position={[0, 0.85, -0.22]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[1.8, 0.32, 0.08]} />
        </mesh>
      </group>
      {/* flowers along the pad edge */}
      {[-1.6, -0.9, 1.1, 1.7].map((x, i) => (
        <mesh key={x} material={i % 2 ? MAT.flowerYellow : MAT.flowerRed} position={[x, 0.32, 2.3 + (i % 2) * 0.3]}>
          <icosahedronGeometry args={[0.2, 0]} />
        </mesh>
      ))}
      <Lantern position={[1.6, 0.18, 1.5]} />
    </group>
  );
}

export function Landmarks({ lights }: { lights: boolean }) {
  return (
    <>
      <JournalShrine />
      <Academy />
      <ExpeditionBoard />
      <HallOfAchievements />
      <Beacon light={lights} />
      <Guestbook />
    </>
  );
}
