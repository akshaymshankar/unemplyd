// Design tokens for unemplyd.
// True black / near-white / signal red — pushed deliberately toward
// Netflix's actual black and Apple's actual near-white, rather than
// the softer off-black/off-white this started as. Every color, type,
// and motion decision in the app should trace back to this file.

export const colors = {
  ink: "#000000", // primary dark surface — true black, not off-black
  paper: "#FAFAFA", // primary light surface — near-white, not warm cream
  signal: "#E50914", // the one accent color, used sparingly and with confidence
  signalDim: "#7A1414", // muted red for subtle states (borders, disabled accents)
  graphite: "#6B6B6B", // secondary text on light
  fog: "#A6A6A6", // secondary text on dark
  line: "rgba(0, 0, 0, 0.12)", // hairline grid on light surfaces
  lineDark: "rgba(250, 250, 250, 0.14)", // hairline grid on dark surfaces
} as const;

export const type = {
  display: "var(--font-display)", // Inter — one system typeface, multiple weights
  body: "var(--font-body)", // Inter — same face as display, at UI weights
  mono: "var(--font-mono)", // JetBrains Mono — eyebrows, labels, annotations
} as const;

// GSAP/Framer Motion easing curves shared across the app so every
// animation feels like it belongs to the same hand.
export const ease = {
  out: [0.16, 1, 0.3, 1], // confident deceleration — hero reveals
  inOut: [0.65, 0, 0.35, 1], // symmetric — pinned section transitions
  snap: [0.34, 1.56, 0.64, 1], // slight overshoot — buttons, magnetic hover
} as const;

export const duration = {
  fast: 0.3,
  base: 0.6,
  slow: 1.1,
  cinematic: 1.8,
} as const;

// Standard stagger for word-by-word / character reveals.
export const stagger = {
  word: 0.06,
  char: 0.02,
};
