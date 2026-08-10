# unemplyd. — website

Build Beyond The Classroom.

## Status

- [x] Phase 0 — Foundations & tech setup
- [x] Phase 1 — Brand & design system
- [x] Phase 2 — Navigation & global shell
- [x] Phase 3 — Hero section
- [x] Phase 4 — Philosophy (pinned statements)
- [x] Phase 5 — The Journey (interactive roadmap)
- [x] Phase 6 — Learning Ecosystem ("Courses")
- [x] Phase 7 — Practical Labs
- [x] Phase 8 — Project Showcase ("Projects")
- [x] Phase 11 — Founders (real team photos/bios)
- [x] Phase 12 — Final CTA & footer
- [ ] Phase 9 — AI For Engineers (statement section)
- [ ] Phase 10 — Community (metrics section)
- [ ] Phase 13/14 — Further polish / perf / a11y pass

Plus, not in the original phase plan: dark/light theme toggle, real
logo + favicon assets, and this round's "Netflix dark / Apple light"
direction.

## Getting started

```bash
npm install
npm run dev
```

## This round: "Netflix in dark, Apple in light"

That's a genuinely useful, specific brief, so here's exactly how it
was translated into decisions rather than left as a vibe:

**Type — one system typeface, not a branded display face.**
Neither Netflix Sans nor SF Pro is something I can legitimately ship
on a public site — Netflix's font isn't publicly licensed at all, and
Apple's SF license explicitly restricts it to Apple-platform apps and
marketing, not third-party web use. Both products share a real
principle underneath the specific fonts, though: **one neutral,
extremely legible system typeface used at multiple weights**, not a
"personality" display face paired with a body face. Swapped Clash
Display / General Sans for **Inter** everywhere (`app/layout.tsx`,
via `next/font/google` — also removes the external Fontshare CDN
dependency the previous version had). JetBrains Mono stays for
labels.

**Color — true black, near-white, one confident red.**
`ink` moved from `#0A0A0A` to `#000000` (Netflix's actual black, not
a soft off-black), `paper` moved from a warm `#F5F3EF` to a cooler
`#FAFAFA` (closer to Apple's actual product-page white), and `signal`
moved from `#D91E1E` to `#E50914` — a more iconic, saturated
streaming-red, still clearly the same accent as your logo's red dot,
just more confident. This is a single source-of-truth change in
`lib/tokens.ts` / `tailwind.config.ts` / `globals.css` — every
component references these tokens, nothing is hardcoded per-section.

**One Netflix-shaped interaction, for real, not just a color change.**
Labs (`components/sections/Labs.tsx`) cards are now collapsed by
default — icon and name only, poster-like — and expand on hover to
reveal the blurb, with a lift/scale/glow, the way a Netflix title
card expands. That's a genuine pattern borrow, not just "make it
red and call it Netflix."

**One Apple-shaped interaction, for real.**
Ecosystem (`components/sections/Ecosystem.tsx`) pillar cards now
animate in via a `ScrollTrigger` with `scrub`, not a fixed-duration
"trigger once" fade. Each card's opacity/position/scale is a direct
function of scroll position — it moves because you moved the page,
not because a timer fired. That's the specific quality that makes
Apple product pages feel "tied to your finger" rather than just
autoplaying at you.

**Buttery / anti-jank pass.**
"Any glitch will be a failure" is a real, fair bar, so:
- `.gpu-layer` utility (`globals.css`) applied to `MagneticButton`
  and `TiltCard` — promotes them to their own compositor layer
  *before* the first hover, avoiding the one-frame stutter some
  browsers show when a transform starts animating on an element
  that wasn't already layered.
- `GlassPanel`'s blur dropped from `backdrop-blur-xl` to `-md` —
  still reads as glass, meaningfully cheaper with 8–13 panels on
  screen at once (Ecosystem, Labs).
- Confirmed only the actively-hovered `TiltCard` is ever animating
  at a given moment (each card's spring is independent and settles
  to rest on pointer-leave), so hover cost never compounds across a
  full grid.

## Favicons / app icons

Your two new "u." mark uploads are now real favicons:
- `app/icon.png`, `app/apple-icon.png` — Next.js's auto-detected
  icon convention, no extra config needed.
- `public/icons/icon-{light,dark}-{32,180,512}.png` — sized variants.
- `app/layout.tsx` adds explicit `<link rel="icon" media="(prefers-color-scheme: …)">`
  tags, so the browser tab icon follows the **visitor's OS-level**
  light/dark preference. Note this is independent of the in-app
  theme toggle (browsers don't currently support swapping a favicon
  based on in-page JS state, only OS-level `prefers-color-scheme`).

## Founders photo mapping — confirmed

You confirmed: Akshay is the Caterpillar-site photo, Anush is the
polo-shirt photo. That's what `Founders.tsx` already had — no change
needed there.

## Still open / next steps

- Phase 9 (AI For Engineers) and Phase 10 (Community) aren't built.
- Project Showcase content is still placeholder — see the note in
  `components/sections/Projects.tsx`.
- Final CTA button (`#begin`) still loops back to `#ecosystem` —
  there's no application/enrollment flow to point it at yet.
- Everything above is a real, meaningful pass at "Netflix dark /
  Apple light," but going further (actual horizontal-scroll content
  rows, more Apple-style scroll-scrubbed video/3D moments) is a
  bigger scope than one pass — say which section to push next and
  I'll go deeper on that one specifically rather than spreading
  thinner across all of them.
