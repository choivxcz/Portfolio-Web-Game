# Karl Sebastian V. Cuerdo — Portfolio

An explorable, real-time **3D open world** that doubles as a developer portfolio — a fan tribute to the look and feel of **Genshin Impact**. Visitors walk a stylized valley (hills, a lake and stream, a village with a windmill, ruins, a stone bridge, a walled lake town and layered mountain ranges) and discover five landmarks that open the portfolio:

| Landmark | Opens |
| --- | --- |
| Adventurer's Journal (stone shrine, west hill) | About Me + adventure log |
| The Academy (domed hall, east of the bridge) | Skills |
| Expedition Board (village centre — each note is a postcard from the region its project is charted in) | Projects |
| Hall of Achievements (ruined temple, north-west) | Achievements |
| Communication Beacon (tower on the lake cliff) | Contact |

Built with **React 19 + TypeScript + Vite**, **three.js** via **React Three Fiber** and **Drei**. The terrain, grass, water, sky, landmarks, lake town and houses are original and generated in code; pines, boulders, undergrowth, village props and the playable explorers are **CC0 (public domain) models** from Quaternius, Kenney and KayKit (Kay Lousberg), listed in [`public/models/CREDITS.md`](public/models/CREDITS.md). No game assets are used. It imitates the game's *style* only: no characters, logos, official icons, fonts or files from the game, and it is not affiliated with or endorsed by HoYoverse.

The previous scrolling page still exists as the **classic page** (`?classic`), shown automatically when a browser has no WebGL 2.

## The 3D world

**Controls:** W A S D / arrow keys to move · Shift to sprint · Space to jump · click the world, then move the mouse to look (or drag) · wheel to zoom · **E** to interact · **Esc** to open the menu (or go back / close a panel) · **\** to hide the HUD. On phones: left joystick to move, drag to look, ↑ button to jump, tap the prompt to interact. The top bar and minimap pins teleport straight to any landmark.

**How it's built** (`src/world/`):

- `terrain.ts` — height field from seeded simplex noise, shaped by the layout in `config.ts`: grassy plateaus with pale cliff rims (kept smooth along paths and in the village), a lake and stream, landmark plateaus and a terraced mountain ring. Golden meadow patches are shared by the ground and grass shaders; paints vertex colours and packs a heightmap texture for the shaders.
- `scene/Grass.tsx` — instanced grass and flowers in a patch that travels with the visitor; blades read height and density from the heightmap, sway in the wind and receive cel-shaded sun shadows (custom GLSL).
- `scene/Water.tsx` — depth-aware shader: clear turquoise shallows, a crisp lapping foam line, drifting ripple streaks, sun glints and a sky reflection; on High, real mirrored reflections of the scene.
- `scene/FluffyTrees.tsx` — original "fluffy" broadleaf trees (green and golden): canopies of camera-facing leaf-cluster cards shaded as one soft volume, swaying in the wind, with leafy shadows.
- `scene/structures/Ivy.tsx` — climbing ivy strands on the village walls.
- `scene/structures/LakeTown.tsx` — an original walled town on the lake island: crenellated ring wall with round towers and a gatehouse, half-timbered houses around a fountain plaza, a cathedral with a spire, shore windmills and an arched bridge.
- `scene/PostFX.tsx` — cool-tinted ambient occlusion, gentle bloom, neutral tone mapping (keeps greens rich without neon) and a light vignette (Medium/High).
- `scene/structures/detail.ts` — original procedural stone-block, plaster, roof-tile and wood-grain textures, projected in world space onto every structure.
- `scene/StaticBatch.tsx` — merges static architecture by material (hundreds of draw calls → a few dozen).
- `scene/structures/` — landmark and village architecture assembled from modelled parts (lathe columns, arches, gable roofs).
- `scene/Explorer.tsx` — third-person camera, movement, jumping, collisions (spatial grid), terrain/obstacle-aware camera, interaction detection and teleports.
- `scene/Avatar.tsx` — the explorer you play: a CC0 KayKit adventurer (Ranger or Mage, chosen in Settings) redrawn with the world's cel shading and a rim light, blending idle / walk / run / jump / interact animations from movement, with stride matched to ground speed.
- `scene/outline.ts` — anime ink outlines (inverted hull, constant pixel width, works on animated meshes).
- `scene/Sky.tsx` — gradient sky dome with sun and painted three-tone cumulus sprites.
- `scene/Mountains.tsx` — three layered mountain ranges with snowy peaks, drawn with a two-tone stylized shader (sunlit faces / cool blue shadow faces) and strong aerial haze.
- `scene/Cliffs.tsx` + `cliffLayout.ts` — a rim of pale cliff mesas around the valley: layered rock walls with strata texture, overhanging grassy caps and trees on top.
- `src/ui/` — HUD (top bar, minimap, prompt, controls guide, joystick, loading screen with real build progress) and the landmark archive screen (`WorldPanel.tsx`): full-screen in the menu style, with every landmark as a tab so all sections can be browsed from anywhere; it reuses the portfolio sections in `src/components/`.
- `src/ui/GameMenu.tsx` + `src/styles/menu.css` — the pause menu (explorer card + shortcut grid) and the full-screen Settings screen (Graphics / Controls / Other / About tabs with ‹ value › pickers and sliders). Every option is live: quality preset, render resolution, bloom, sharpening, vignette, wind, FPS readout, camera sensitivity, invert Y, camera distance, minimap rotation, markers and the controls guide. Choices are saved in the browser.

**Performance:** Low / Medium / High presets (resolution, shadows, grass density, tree count, terrain detail), chosen automatically (Low on touch or small screens) and changeable in ⚙ Settings, with a "Wind & Ambient Motion" switch (off by default when the OS asks for reduced motion). Repeated objects are instanced; the 3D engine is a separate lazy chunk (~400 kB gzipped, plus ~4.8 MB of CC0 models fetched with the world); resolution drops automatically if the frame rate falls.

## Run it locally

Requires Node.js 18+ (tested with Node 24).

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build at http://localhost:4173
npm run typecheck  # TypeScript only
```

## Edit your content

Everything personal lives in `src/data/`. You should not need to touch components to update content.

| File | What it holds |
| --- | --- |
| `src/data/profile.ts` | Name, tagline, intro, location, **email / LinkedIn / university** (empty = hidden) |
| `src/data/projects.ts` | Project cards and the details shown in each dialog; add `demo` or `image` here; `region` + `regionNote` place each project on the Expedition Board |
| `src/data/places.ts` | The regions projects are charted in (name, title, accent colour) |
| `src/data/skills.ts` | Skill categories, each skill with the projects that show it |
| `src/data/journey.ts` | Timeline stops |
| `src/data/achievements.ts` | Milestones (add honors / leadership here) |

### Still to fill in

These weren't in any public source, so they are **hidden until you add them** — nothing on the site is a fake placeholder:

- `profile.links.email` — enables the "Send me a message" button (otherwise the main button goes to GitHub)
- `profile.links.linkedin`
- `profile.university`
- `profile.previousBackground` — adds a "Before CS" stop to the journey
- Academic honors, leadership roles, certificates → `src/data/achievements.ts`
- Live demo URLs or screenshots → `demo` / `image` fields in `src/data/projects.ts` (put images in `public/projects/`)

Also review the wording in `src/components/About.tsx` (the journal text and the quote). It was written from what your projects show, so rewrite it in your own voice.

## Publish on GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds the site and deploys it on every push to `main`.

**Recommended:** name the repository `choivxcz.github.io` so the site lives at `https://choivxcz.github.io/`.

```bash
git init -b main
git add .
git commit -m "Portfolio site"
git remote add origin https://github.com/choivxcz/choivxcz.github.io.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions.** The first deploy runs automatically (watch it under the **Actions** tab). Re-run it from there if it started before Pages was enabled.

**Using a different repository name** (e.g. `portfolio`) also works with no code changes, because `vite.config.ts` uses relative asset paths (`base: "./"`). The site will be at `https://choivxcz.github.io/portfolio/`. In that case, update `og:url` and `og:image` in `index.html` to the new address so link previews work.

## Design notes

The visual system was built from reference screenshots of the game's own interface (viewed only for study; none are included in this repository). Colors were measured from them:

| Screen studied | What it informed |
| --- | --- |
| Paimon menu | Slate tiles (`#50596b`) with cream silhouette icons on an ivory panel → Skills tiles and the phone menu |
| Achievements | Navy category list, ivory book page (`#f2ece6`), rows (`#f5f1eb`) with gray titles (`#555`), tan descriptions (`#bca895`), a side column (`#ebe3d8`), brown headings (`#84603d`) and amber progress (`#f7ba3f`) → Achievements |
| Archive › Geography | Label strip, ivory-framed landscape, caption bar, ivory filter pill, gold counter (`#d3bc8e`) on deep blue (`#050f29`) → Projects |
| Archive › Weapons, Travel Log | Rarity stars, white selection glow, "◇◇" rules, quest acts → cards, hover states, Journey |
| Adventurer Handbook | Open book with a leather cover and bronze corners, colored bookmark tabs, a highlighted row with an amber bar → About |

- **Type:** the game uses a proprietary flared typeface, which is not used here. Headings use *Marcellus* (a flared, inscription-style serif) and body text uses *Zen Kaku Gothic New*. The official website loads its fonts through JavaScript, so its exact typefaces were not verified.
- **Contrast:** the in-game tan (`#bca895`) is too faint for body text on the web, so readable text uses a darker tan (`#7a6550`); the original is kept for large or decorative text.
- **Art:** every landscape is procedural SVG (`src/components/HeroScene.tsx`, `src/components/scene/`). Project banners come from presets in `regionPresets.ts`; set `image` on a project to use a real screenshot instead.
- **Expedition regions:** each project is charted in a region inspired by the game's world, matched by element: Mondstadt (Market Sales Tracker), Liyue (Peso Pilot), Inazuma (Classroom Attention Simulation), Sumeru (Iskolar ng Bayan), Fontaine (Internship System), Natlan (Bugtong Buhay), Snezhnaya (Machine Learning Practice) and Nod-Krai (Market Price Predictor). Dragonspine, The Chasm, Enkanomiya and the Desert of Hadramaveth are ready for new projects: set `region` to `dragonspine`, `chasm`, `enkanomiya` or `desert`. Each scene (`src/components/scene/places.tsx`) is an original drawing of the region's mood and architecture — no official emblems, maps or images. The same art is painted onto the notes on the 3D board.

## Project structure

```
src/
  components/   Nav (+ NavIcons), Hero (+ HeroScene, Particles), About, Journey, Skills,
                Projects (+ ProjectModal), Achievements, Contact, Footer,
                Ornament (frames, rules, corners), SectionHeader, Sigil, Stars
  components/scene/  Landscape generators: shapes, City/Windmill, RegionArt + regionPresets
  world/        The 3D world (see "The 3D world" above)
  ui/           HUD and landmark panel for the 3D world
  App.tsx       Chooses the 3D world, or ClassicSite.tsx (?classic / no WebGL)
  data/         All editable content
  hooks/        Scroll reveal, active section, scroll progress, reduced motion
  styles/       tokens.css (palette, type), base.css (buttons, panels), layout.css (section themes),
                nav.css, hero.css, about.css, journey.css, skills.css, projects.css, modal.css,
                achievements.css, contact.css, footer.css
public/         favicon, Apple touch icon, social preview image (og-image.png)
```

## Accessibility & performance notes

- Semantic sections and landmarks, a skip link, visible focus rings, and keyboard support (arrow keys move between skill elements; project details use a native `<dialog>`, so focus stays inside and Escape closes it).
- `prefers-reduced-motion` turns off parallax, particles, and reveal animations. Content is never hidden when JavaScript or motion is unavailable.
- The particle canvas pauses when it's off-screen or the tab is hidden.
- Only two runtime dependencies: `react` and `react-dom`. Fonts load from Google Fonts (Marcellus and Zen Kaku Gothic New, both under the SIL Open Font License) with system-font fallbacks.
- Project card rarity (3–5 stars) is decorative and set per project in `src/data/projects.ts`.
