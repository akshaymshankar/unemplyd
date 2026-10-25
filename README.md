# unemplyd. — website ("Shortest Path")

Static site. No build step needed to run: open `index.html` through any local server
(e.g. `npx serve .` or `python -m http.server`) — browsers block WebGL textures on `file://` in some cases.

## Structure
- `index.html` — all sections and copy containers
- `css/app.css` — design system + layout (brand red `#F20A14`)
- `js/content.js` — **edit copy here**: regions, journey commits, courses, labs, projects, `CTA_URL`
- `js/globe.js` — Three.js world: code-glyph globe, arcs, hub, 12-waypoint route, procedural jet
- `js/loader.js` — real Dijkstra loader + logo intro (unemployed → o/e drop → Gate O / Gate E)
- `js/main.js` — scroll choreography (GSAP ScrollTrigger) and interactions
- `js/film/` — **the intro film** ("Beyond the Horizon"), see below
- `js/landmask.js` — 1024×512 land bitmap from Natural Earth (world-atlas, public domain)
- `vendor/` — three.js 0.149.0 (MIT), GSAP 3.15 + ScrollTrigger, GLTFLoader r149 (loaded only when a model is set)
- `fonts/` — Inter Display, Geist, JetBrains Mono (SIL OFL)
- `brand/` — logo + app icon (SVG/PNG, light/dark)
- `build.py` + `dist/index.html` — single-file build with everything inlined

## Before launch
1. Set `CTA_URL` in `js/content.js` to the real apply/enrol link.
2. Replace sample course rows in `js/content.js`.
3. Add case files for PathFinder AI, SentryNode, DeployKit.
4. Optional: founder photos for the crew badges.

## Intro film: "Beyond the Horizon"
The page opens on a scroll-controlled 3D film above the hero. Scroll drives it, scrolling back reverses it.
Built so far: **Scene 01 Departure** (runway at blue hour) and **Scene 02 Take-off** (roll, V1, rotate,
lift-off, gear up, climb). A short bridge then climbs into the cloud deck and fades into the globe hero.

- `js/film/rig.js` — reusable choreography: `Track` (keyframed values), `Timeline` (scenes by scroll share),
  `ShotRig` (camera on a Catmull-Rom spline through keys in world space or in the aircraft's frame, with fov,
  roll, shake). Every later scene is just more keys.
- `js/film/film.js` — storyboard, aircraft kinematics, camera shots, titles/callouts, renderer and post
  (HDR, bloom, scroll-speed motion trails, grain, vignette, ACES). Add scenes 03–06 to `STORYBOARD` + `SHOTS`.
- `js/film/aircraft.js` — procedural UNEMPLYD airliner (livery, lights, spinning fans, retracting gear).
- `js/film/airport.js` — sky, fog, runway + markings, full airfield lighting, terminal, tower, mist, clouds.
- `js/film/assets.js` — drop-in slots for real assets (e.g. a Blender aircraft as GLB).

Skipped automatically with `prefers-reduced-motion`, without WebGL, or with `?nofilm` in the URL.
