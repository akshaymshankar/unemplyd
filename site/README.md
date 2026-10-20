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
- `js/landmask.js` — 1024×512 land bitmap from Natural Earth (world-atlas, public domain)
- `vendor/` — three.js 0.149.0 (MIT), GSAP 3.15 + ScrollTrigger
- `fonts/` — Inter Display, Geist, JetBrains Mono (SIL OFL)
- `brand/` — logo + app icon (SVG/PNG, light/dark)
- `build.py` + `dist/index.html` — single-file build with everything inlined

## Before launch
1. Set `CTA_URL` in `js/content.js` to the real apply/enrol link.
2. Replace sample course rows in `js/content.js`.
3. Add case files for PathFinder AI, SentryNode, DeployKit.
4. Optional: founder photos for the crew badges.
